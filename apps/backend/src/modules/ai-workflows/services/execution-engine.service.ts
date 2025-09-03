import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject, Observable } from 'rxjs';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowExecution, WorkflowExecutionStatus } from '../entities/workflow-execution.entity';
import { LangGraphService } from './langgraph.service';
import { NodeExecutorService } from './node-executor.service';
import { StreamingService } from './streaming.service';
import { StateManagerService } from './state-manager.service';

export interface ExecutionOptions {
  sessionId?: string;
  streaming?: boolean;
  checkpointing?: boolean;
  timeout?: number;
  maxRetries?: number;
  variables?: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface ExecutionEvent {
  type: 'start' | 'node_start' | 'node_complete' | 'node_error' | 'complete' | 'error' | 'stream';
  executionId: string;
  nodeId?: string;
  data?: any;
  error?: any;
  timestamp: Date;
}

export interface ExecutionResult {
  executionId: string;
  status: WorkflowExecutionStatus;
  output?: any;
  errors?: any[];
  duration?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

/**
 * Enhanced execution engine with streaming support and LangGraph integration
 */
@Injectable()
export class ExecutionEngineService {
  private readonly logger = new Logger(ExecutionEngineService.name);
  private activeExecutions = new Map<string, Subject<ExecutionEvent>>();

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowExecution)
    private executionRepository: Repository<WorkflowExecution>,
    private langGraphService: LangGraphService,
    private nodeExecutorService: NodeExecutorService,
    private streamingService: StreamingService,
    private stateManagerService: StateManagerService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Execute a workflow with streaming support
   */
  async executeWorkflow(
    workflowId: string,
    input: any,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['organization'],
    });

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Create execution record
    const execution = await this.createExecution(workflow, input, options);
    
    // Create event stream
    const eventStream = new Subject<ExecutionEvent>();
    this.activeExecutions.set(execution.id, eventStream);

    try {
      // Emit start event
      this.emitEvent(execution.id, {
        type: 'start',
        executionId: execution.id,
        data: { input, options },
        timestamp: new Date(),
      });

      // Initialize state
      const state = await this.stateManagerService.initializeState(
        execution.id,
        workflow,
        input,
        options
      );

      // Compile workflow to LangGraph
      const graph = await this.langGraphService.compileWorkflow(workflow.flowDefinition);
      const compiledGraph = graph.compile();

      // Set up checkpointer if enabled
      let checkpointer = null;
      if (options.checkpointing) {
        checkpointer = await this.langGraphService.createCheckpointer(
          workflowId,
          options.sessionId || execution.id
        );
      }

      // Execute with streaming
      if (options.streaming) {
        return await this.executeWithStreaming(
          execution,
          compiledGraph,
          state,
          checkpointer,
          options
        );
      } else {
        return await this.executeSync(
          execution,
          compiledGraph,
          state,
          checkpointer,
          options
        );
      }
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${error.message}`, error.stack);
      
      // Update execution status
      await this.updateExecutionStatus(execution.id, WorkflowExecutionStatus.FAILED, {
        error: error.message,
        stack: error.stack,
      });

      // Emit error event
      this.emitEvent(execution.id, {
        type: 'error',
        executionId: execution.id,
        error: error.message,
        timestamp: new Date(),
      });

      throw error;
    } finally {
      // Clean up
      eventStream.complete();
      this.activeExecutions.delete(execution.id);
    }
  }

  /**
   * Execute workflow with streaming
   */
  private async executeWithStreaming(
    execution: WorkflowExecution,
    compiledGraph: any,
    initialState: any,
    checkpointer: any,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let finalState = initialState;
    let totalTokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    let totalCost = 0;

    try {
      // Create streaming configuration
      const streamConfig = {
        callbacks: [
          {
            handleLLMStart: async (llm: any, prompts: string[]) => {
              this.logger.debug('LLM started with prompts:', prompts);
            },
            handleLLMNewToken: async (token: string) => {
              // Stream token to client
              this.streamingService.sendToken(execution.id, token);
              this.emitEvent(execution.id, {
                type: 'stream',
                executionId: execution.id,
                data: { token },
                timestamp: new Date(),
              });
            },
            handleLLMEnd: async (output: any) => {
              this.logger.debug('LLM completed:', output);
              if (output.llmOutput?.tokenUsage) {
                totalTokenUsage.promptTokens += output.llmOutput.tokenUsage.promptTokens || 0;
                totalTokenUsage.completionTokens += output.llmOutput.tokenUsage.completionTokens || 0;
                totalTokenUsage.totalTokens += output.llmOutput.tokenUsage.totalTokens || 0;
              }
            },
          },
        ],
        checkpointer,
        recursionLimit: options.maxRetries || 3,
      };

      // Stream execution
      const stream = await compiledGraph.stream(initialState, streamConfig);

      for await (const chunk of stream) {
        // Process each chunk
        for (const [node, nodeState] of Object.entries(chunk)) {
          this.emitEvent(execution.id, {
            type: 'node_complete',
            executionId: execution.id,
            nodeId: node,
            data: nodeState,
            timestamp: new Date(),
          });

          // Update state
          finalState = { ...finalState, ...(nodeState as any) };
          
          // Save checkpoint if enabled
          if (checkpointer) {
            await checkpointer.save(finalState);
          }
        }
      }

      // Calculate duration
      const duration = Date.now() - startTime;

      // Update execution with results
      await this.updateExecutionStatus(execution.id, WorkflowExecutionStatus.COMPLETED, {
        output: finalState.variables || {},
        duration,
        tokenUsage: totalTokenUsage,
        cost: totalCost,
      });

      // Emit complete event
      this.emitEvent(execution.id, {
        type: 'complete',
        executionId: execution.id,
        data: finalState.variables,
        timestamp: new Date(),
      });

      return {
        executionId: execution.id,
        status: WorkflowExecutionStatus.COMPLETED,
        output: finalState.variables,
        duration,
        tokenUsage: totalTokenUsage,
        cost: totalCost,
      };
    } catch (error) {
      this.logger.error(`Streaming execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute workflow synchronously
   */
  private async executeSync(
    execution: WorkflowExecution,
    compiledGraph: any,
    initialState: any,
    checkpointer: any,
    options: ExecutionOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Execute graph
      const config = {
        checkpointer,
        recursionLimit: options.maxRetries || 3,
      };

      const result = await compiledGraph.invoke(initialState, config);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Update execution with results
      await this.updateExecutionStatus(execution.id, WorkflowExecutionStatus.COMPLETED, {
        output: result.variables || {},
        duration,
      });

      // Emit complete event
      this.emitEvent(execution.id, {
        type: 'complete',
        executionId: execution.id,
        data: result.variables,
        timestamp: new Date(),
      });

      return {
        executionId: execution.id,
        status: WorkflowExecutionStatus.COMPLETED,
        output: result.variables,
        duration,
      };
    } catch (error) {
      this.logger.error(`Sync execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get execution stream
   */
  getExecutionStream(executionId: string): Observable<ExecutionEvent> {
    const stream = this.activeExecutions.get(executionId);
    if (!stream) {
      throw new Error(`No active execution found for ${executionId}`);
    }
    return stream.asObservable();
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const stream = this.activeExecutions.get(executionId);
    if (stream) {
      stream.complete();
      this.activeExecutions.delete(executionId);
    }

    await this.updateExecutionStatus(executionId, WorkflowExecutionStatus.CANCELLED, {
      cancelledAt: new Date(),
    });

    this.logger.log(`Execution ${executionId} cancelled`);
  }

  /**
   * Resume execution from checkpoint
   */
  async resumeExecution(
    executionId: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['workflow'],
    });

    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status !== WorkflowExecutionStatus.PAUSED) {
      throw new Error(`Execution ${executionId} is not paused`);
    }

    // Load checkpoint
    const checkpointer = await this.langGraphService.createCheckpointer(
      execution.workflow.id,
      options.sessionId || executionId
    );
    
    const state = await checkpointer.load();
    if (!state) {
      throw new Error(`No checkpoint found for execution ${executionId}`);
    }

    // Resume execution
    const graph = await this.langGraphService.compileWorkflow(execution.workflow.flowDefinition);
    const compiledGraph = graph.compile();

    return await this.executeWithStreaming(
      execution,
      compiledGraph,
      state,
      checkpointer,
      options
    );
  }

  /**
   * Create execution record
   */
  private async createExecution(
    workflow: Workflow,
    input: any,
    options: ExecutionOptions
  ): Promise<WorkflowExecution> {
    const execution = this.executionRepository.create({
      workflow,
      organizationId: workflow.organizationId,
      input,
      status: WorkflowExecutionStatus.RUNNING,
      startedAt: new Date(),
      metadata: {
        options,
        sessionId: options.sessionId,
      },
    });

    return await this.executionRepository.save(execution);
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: WorkflowExecutionStatus,
    data: any = {}
  ): Promise<void> {
    await this.executionRepository.update(executionId, {
      status,
      ...(status === WorkflowExecutionStatus.COMPLETED && {
        output: data.output,
        completedAt: new Date(),
      }),
      ...(status === WorkflowExecutionStatus.FAILED && {
        error: data.error,
        completedAt: new Date(),
      }),
      metadata: data,
    });
  }

  /**
   * Emit execution event
   */
  private emitEvent(executionId: string, event: ExecutionEvent): void {
    const stream = this.activeExecutions.get(executionId);
    if (stream) {
      stream.next(event);
    }
    
    // Also emit via EventEmitter for other listeners
    this.eventEmitter.emit('workflow.execution.event', event);
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    workflowId: string,
    limit: number = 10
  ): Promise<WorkflowExecution[]> {
    return await this.executionRepository.find({
      where: { workflowId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get execution metrics
   */
  async getExecutionMetrics(workflowId: string): Promise<any> {
    const executions = await this.executionRepository.find({
      where: { workflowId },
    });

    const metrics = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED).length,
      failedExecutions: executions.filter(e => e.status === WorkflowExecutionStatus.FAILED).length,
      averageDuration: 0,
      totalTokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      totalCost: 0,
    };

    // Calculate averages
    const completedExecutions = executions.filter(e => e.status === WorkflowExecutionStatus.COMPLETED);
    if (completedExecutions.length > 0) {
      const totalDuration = completedExecutions.reduce((sum, e) => {
        const duration = e.metadata?.duration || 0;
        return sum + duration;
      }, 0);
      metrics.averageDuration = totalDuration / completedExecutions.length;

      // Sum token usage and cost
      completedExecutions.forEach(e => {
        if (e.metadata?.tokenUsage) {
          metrics.totalTokenUsage.promptTokens += e.metadata.tokenUsage.promptTokens || 0;
          metrics.totalTokenUsage.completionTokens += e.metadata.tokenUsage.completionTokens || 0;
          metrics.totalTokenUsage.totalTokens += e.metadata.tokenUsage.totalTokens || 0;
        }
        metrics.totalCost += e.metadata?.cost || 0;
      });
    }

    return metrics;
  }
}