import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WorkflowExecutionService } from '../services/workflow-execution.service';
import { WorkflowExecutionStatus } from '../entities/workflow-execution.entity';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

interface WorkflowJobData {
  executionId: string;
  workflow: any;
  inputData: Record<string, any>;
}

@Processor('workflow-execution')
@Injectable()
export class WorkflowProcessor {
  private readonly logger = new Logger(WorkflowProcessor.name);
  private openai: OpenAI;

  constructor(
    private readonly executionService: WorkflowExecutionService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  @Process('execute')
  async handleWorkflowExecution(job: Job<WorkflowJobData>) {
    const { executionId, workflow, inputData } = job.data;

    try {
      this.logger.log(`Starting workflow execution: ${executionId}`);

      // Update status to running
      await this.executionService.updateStatus(executionId, WorkflowExecutionStatus.RUNNING, {
        logEntry: {
          nodeId: 'start',
          status: 'running',
          message: 'Workflow execution started',
        },
      });

      // Process workflow nodes
      const result = await this.processWorkflow(workflow, inputData, executionId);

      // Update status to completed
      await this.executionService.updateStatus(executionId, WorkflowExecutionStatus.COMPLETED, {
        outputData: result,
        logEntry: {
          nodeId: 'end',
          status: 'completed',
          message: 'Workflow execution completed successfully',
          data: result,
        },
      });

      this.logger.log(`Completed workflow execution: ${executionId}`);
    } catch (error) {
      this.logger.error(`Failed workflow execution: ${executionId}`, error);

      await this.executionService.updateStatus(executionId, WorkflowExecutionStatus.FAILED, {
        errorMessage: error.message,
        logEntry: {
          nodeId: 'error',
          status: 'failed',
          message: error.message,
        },
      });
    }
  }

  private async processWorkflow(
    workflow: any,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<any> {
    const { flowDefinition } = workflow;
    const { nodes, edges } = flowDefinition;

    // Create execution context
    const context = {
      input: inputData,
      variables: {},
      outputs: {},
    };

    // Find start node
    const startNode = nodes.find((n: any) => n.type === 'start') || nodes[0];
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    // Process nodes sequentially (simplified for now)
    let currentNodeId = startNode.id;
    let processedNodes = new Set<string>();

    while (currentNodeId && !processedNodes.has(currentNodeId)) {
      processedNodes.add(currentNodeId);

      const node = nodes.find((n: any) => n.id === currentNodeId);
      if (!node) break;

      // Log node execution
      await this.executionService.updateStatus(executionId, WorkflowExecutionStatus.RUNNING, {
        logEntry: {
          nodeId: node.id,
          status: 'processing',
          message: `Processing node: ${node.data?.label || node.type}`,
        },
      });

      // Process node based on type
      const nodeResult = await this.processNode(node, context);
      context.outputs[node.id] = nodeResult;

      // Find next node
      const nextEdge = edges.find((e: any) => e.source === currentNodeId);
      currentNodeId = nextEdge?.target;
    }

    return context.outputs;
  }

  private async processNode(node: any, context: any): Promise<any> {
    const { type, data } = node;

    switch (type) {
      case 'start':
        return context.input;

      case 'llm':
        return await this.processLLMNode(data, context);

      case 'transform':
        return this.processTransformNode(data, context);

      case 'condition':
        return this.processConditionNode(data, context);

      case 'entityReader':
        return await this.processEntityReaderNode(data, context);

      case 'entityWriter':
        return await this.processEntityWriterNode(data, context);

      default:
        this.logger.warn(`Unknown node type: ${type}`);
        return null;
    }
  }

  private async processLLMNode(nodeData: any, context: any): Promise<any> {
    if (!this.openai) {
      this.logger.warn('OpenAI not configured, returning mock response');
      return { response: 'Mock LLM response' };
    }

    const { prompt, model = 'gpt-3.5-turbo', temperature = 0.7 } = nodeData;

    // Replace variables in prompt
    const processedPrompt = this.replaceVariables(prompt, context);

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: processedPrompt }],
        temperature,
      });

      return {
        response: completion.choices[0]?.message?.content || '',
        usage: completion.usage,
      };
    } catch (error) {
      this.logger.error('LLM node processing failed', error);
      throw error;
    }
  }

  private processTransformNode(nodeData: any, context: any): any {
    const { script } = nodeData;
    
    try {
      // Simple JavaScript evaluation (in production, use a sandboxed environment)
      const func = new Function('context', script);
      return func(context);
    } catch (error) {
      this.logger.error('Transform node processing failed', error);
      throw error;
    }
  }

  private processConditionNode(nodeData: any, context: any): boolean {
    const { condition } = nodeData;
    
    try {
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch (error) {
      this.logger.error('Condition node processing failed', error);
      return false;
    }
  }

  private async processEntityReaderNode(nodeData: any, context: any): Promise<any> {
    // TODO: Implement entity reading logic
    const { entityType, entityId } = nodeData;
    this.logger.log(`Reading entity: ${entityType}/${entityId}`);
    return { entityType, entityId, data: {} };
  }

  private async processEntityWriterNode(nodeData: any, context: any): Promise<any> {
    // TODO: Implement entity writing logic
    const { entityType, operation, data } = nodeData;
    this.logger.log(`Writing entity: ${entityType} - ${operation}`);
    return { success: true, entityType, operation };
  }

  private replaceVariables(text: string, context: any): string {
    return text.replace(/\{\{(\w+\.?\w+)\}\}/g, (match, variable) => {
      const parts = variable.split('.');
      let value = context;
      
      for (const part of parts) {
        value = value?.[part];
      }
      
      return value !== undefined ? String(value) : match;
    });
  }
}