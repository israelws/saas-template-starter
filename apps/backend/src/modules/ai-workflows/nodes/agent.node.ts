import { Logger } from '@nestjs/common';
import { BaseNode, INodeExecutionContext, INodeExecutionResult, INodeData } from './base-node.class';
import { ILLMProvider } from '../providers/llm-provider.interface';
import { ITool, ToolRegistry } from '../tools/tool-registry';
import { UniversalLLMAdapter } from '../providers/universal-llm-adapter';
import { IMemory, MemoryManager } from '../memory/memory-manager';

export interface AgentNodeConfig {
  // LLM Configuration
  llmProvider: 'openai' | 'anthropic' | 'bedrock' | 'gemini' | 'ollama' | 'custom';
  llmModel: string;
  llmConfig?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    [key: string]: any;
  };
  
  // Tool Configuration  
  tools?: string[];  // Tool IDs from registry
  toolChoice?: 'auto' | 'required' | 'none';
  
  // Agent Type
  agentType: 'react' | 'openai-functions' | 'sequential' | 'conversational';
  
  // Memory Configuration
  memoryType?: 'conversation' | 'buffer' | 'summary' | 'vector' | 'none';
  memoryConfig?: {
    k?: number;  // Number of messages to remember
    vectorStore?: string;
    sessionKey?: string;
    [key: string]: any;
  };
  
  // Execution Configuration
  maxIterations?: number;
  timeout?: number;
  streaming?: boolean;
  returnIntermediateSteps?: boolean;
  
  // Input/Output Mapping
  inputMapping?: Record<string, string>;  // Map flow variables to agent input
  outputMapping?: Record<string, string>; // Map agent output to flow variables
}

export class GenericAgentNode extends BaseNode {
  private static readonly logger = new Logger(GenericAgentNode.name);
  private llmAdapter: UniversalLLMAdapter;
  private toolRegistry: ToolRegistry;
  private memoryManager: MemoryManager;
  
  constructor(
    nodeData: INodeData,
    nodeParams: Record<string, any>,
    llmAdapter: UniversalLLMAdapter,
    toolRegistry: ToolRegistry,
    memoryManager: MemoryManager
  ) {
    super(nodeData, nodeParams);
    this.llmAdapter = llmAdapter;
    this.toolRegistry = toolRegistry;
    this.memoryManager = memoryManager;
  }

  async execute(
    input: any,
    context: INodeExecutionContext,
    config?: any
  ): Promise<INodeExecutionResult> {
    try {
      const agentConfig = this.getAgentConfig();
      
      // 1. Load and initialize LLM provider
      const llmProvider = await this.loadLLMProvider(agentConfig, context);
      
      // 2. Load and initialize tools
      const tools = await this.loadTools(agentConfig, context);
      
      // 3. Load memory if configured
      const memory = await this.loadMemory(agentConfig, context);
      
      // 4. Map input variables
      const agentInput = this.mapInputVariables(input, agentConfig.inputMapping, context);
      
      // 5. Create and execute agent
      const agent = await this.createAgent(
        agentConfig.agentType,
        llmProvider,
        tools,
        memory,
        agentConfig
      );
      
      // 6. Execute with timeout and iteration control
      const result = await this.executeWithTimeout(
        agent,
        agentInput,
        agentConfig.timeout || 30000,
        agentConfig.maxIterations || 10
      );
      
      // 7. Save to memory if configured
      if (memory) {
        await this.saveToMemory(memory, agentInput, result, context);
      }
      
      // 8. Map output variables
      const mappedOutput = this.mapOutputVariables(result, agentConfig.outputMapping);
      
      return {
        output: mappedOutput,
        variables: this.extractVariables(result),
        flowState: this.updateFlowState(context.flowState, result),
        metadata: {
          provider: agentConfig.llmProvider,
          model: agentConfig.llmModel,
          toolsUsed: this.extractToolsUsed(result),
          iterations: result.iterations || 1,
        },
        tokenUsage: result.tokenUsage,
        cost: result.cost,
      };
    } catch (error) {
      GenericAgentNode.logger.error(`Agent execution failed: ${error.message}`, error.stack);
      return this.formatError(error);
    }
  }

  private getAgentConfig(): AgentNodeConfig {
    return {
      llmProvider: this.getParam('llmProvider', 'openai'),
      llmModel: this.getParam('llmModel', 'gpt-3.5-turbo'),
      llmConfig: this.getParam('llmConfig', {}),
      tools: this.getParam('tools', []),
      toolChoice: this.getParam('toolChoice', 'auto'),
      agentType: this.getParam('agentType', 'react'),
      memoryType: this.getParam('memoryType', 'none'),
      memoryConfig: this.getParam('memoryConfig', {}),
      maxIterations: this.getParam('maxIterations', 10),
      timeout: this.getParam('timeout', 30000),
      streaming: this.getParam('streaming', false),
      returnIntermediateSteps: this.getParam('returnIntermediateSteps', false),
      inputMapping: this.getParam('inputMapping', {}),
      outputMapping: this.getParam('outputMapping', {}),
    };
  }

  private async loadLLMProvider(
    config: AgentNodeConfig,
    context: INodeExecutionContext
  ): Promise<ILLMProvider> {
    const providerConfig = {
      provider: config.llmProvider,
      model: config.llmModel,
      organizationId: context.organizationId,
      ...config.llmConfig,
    };
    
    return await this.llmAdapter.getProvider(providerConfig);
  }

  private async loadTools(
    config: AgentNodeConfig,
    context: INodeExecutionContext
  ): Promise<ITool[]> {
    if (!config.tools || config.tools.length === 0) {
      return [];
    }
    
    return await this.toolRegistry.getTools(config.tools, context);
  }

  private async loadMemory(
    config: AgentNodeConfig,
    context: INodeExecutionContext
  ): Promise<IMemory | null> {
    if (config.memoryType === 'none' || !config.memoryType) {
      return null;
    }
    
    const sessionKey = config.memoryConfig?.sessionKey || context.sessionId || context.executionId;
    
    return await this.memoryManager.getMemory(
      config.memoryType,
      sessionKey,
      config.memoryConfig
    );
  }

  private mapInputVariables(
    input: any,
    mapping: Record<string, string> | undefined,
    context: INodeExecutionContext
  ): any {
    if (!mapping || Object.keys(mapping).length === 0) {
      return input;
    }
    
    const mapped: any = {};
    
    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      // Support both direct input and flow state variables
      if (sourcePath.startsWith('$')) {
        // Flow state variable
        const varName = sourcePath.substring(1);
        mapped[targetKey] = context.flowState[varName];
      } else if (sourcePath.startsWith('{{') && sourcePath.endsWith('}}')) {
        // Template variable
        mapped[targetKey] = this.resolveVariables(sourcePath, context);
      } else {
        // Direct input path
        mapped[targetKey] = this.getValueFromPath(input, sourcePath);
      }
    }
    
    return mapped;
  }

  private mapOutputVariables(
    result: any,
    mapping: Record<string, string> | undefined
  ): any {
    if (!mapping || Object.keys(mapping).length === 0) {
      return result;
    }
    
    const mapped: any = {};
    
    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      mapped[targetKey] = this.getValueFromPath(result, sourcePath);
    }
    
    return mapped;
  }

  private async createAgent(
    agentType: string,
    llm: ILLMProvider,
    tools: ITool[],
    memory: IMemory | null,
    config: AgentNodeConfig
  ): Promise<any> {
    switch (agentType) {
      case 'react':
        return this.createReActAgent(llm, tools, memory, config);
      case 'openai-functions':
        return this.createOpenAIFunctionsAgent(llm, tools, memory, config);
      case 'sequential':
        return this.createSequentialAgent(llm, tools, memory, config);
      case 'conversational':
        return this.createConversationalAgent(llm, tools, memory, config);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  private async createReActAgent(
    llm: ILLMProvider,
    tools: ITool[],
    memory: IMemory | null,
    config: AgentNodeConfig
  ): Promise<any> {
    // ReAct agent implementation (Reasoning + Acting)
    const systemPrompt = config.llmConfig?.systemPrompt || 
      `You are a helpful AI assistant that can use tools to help answer questions.
      Think step by step about what you need to do.`;
    
    return {
      invoke: async (input: any) => {
        let iterations = 0;
        const maxIterations = config.maxIterations || 10;
        let currentInput = input;
        const steps: any[] = [];
        
        while (iterations < maxIterations) {
          iterations++;
          
          // Get memory context
          const memoryContext = memory ? await memory.getContext() : '';
          
          // Construct messages
          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${memoryContext}\n\n${JSON.stringify(currentInput)}` }
          ];
          
          // Get LLM response
          const response = await llm.chat(messages, {
            model: config.llmModel,
            ...config.llmConfig,
          });
          
          steps.push({ thought: response.content });
          
          // Check if agent wants to use a tool
          const toolCall = this.parseToolCall(response.content);
          if (toolCall) {
            const tool = tools.find(t => t.name === toolCall.name);
            if (tool) {
              const toolResult = await tool.execute(toolCall.args);
              steps.push({ action: toolCall.name, result: toolResult });
              currentInput = toolResult;
              continue;
            }
          }
          
          // If no tool call, we're done
          return {
            output: response.content,
            steps: config.returnIntermediateSteps ? steps : undefined,
            iterations,
            tokenUsage: response.usage,
          };
        }
        
        throw new Error(`Agent exceeded maximum iterations (${maxIterations})`);
      }
    };
  }

  private async createOpenAIFunctionsAgent(
    llm: ILLMProvider,
    tools: ITool[],
    memory: IMemory | null,
    config: AgentNodeConfig
  ): Promise<any> {
    // OpenAI Functions agent implementation
    const functions = tools.map(tool => tool.getSchema());
    
    return {
      invoke: async (input: any) => {
        const memoryContext = memory ? await memory.getContext() : '';
        
        const messages = [
          { 
            role: 'system', 
            content: config.llmConfig?.systemPrompt || 'You are a helpful assistant.'
          },
          { 
            role: 'user', 
            content: `${memoryContext}\n\n${JSON.stringify(input)}`
          }
        ];
        
        const response = await llm.chat(messages, {
          model: config.llmModel,
          functions,
          functionCall: config.toolChoice || 'auto',
          ...config.llmConfig,
        });
        
        // Handle function calls
        if (response.functionCall) {
          const tool = tools.find(t => t.name === response.functionCall!.name);
          if (tool) {
            const args = JSON.parse(response.functionCall.arguments);
            const toolResult = await tool.execute(args);
            
            // Get final response with tool result
            messages.push({
              role: 'function',
              name: response.functionCall.name,
              content: JSON.stringify(toolResult),
            });
            
            const finalResponse = await llm.chat(messages, {
              model: config.llmModel,
              ...config.llmConfig,
            });
            
            return {
              output: finalResponse.content,
              toolCalls: [{ name: response.functionCall.name, result: toolResult }],
              tokenUsage: {
                promptTokens: (response.usage?.promptTokens || 0) + (finalResponse.usage?.promptTokens || 0),
                completionTokens: (response.usage?.completionTokens || 0) + (finalResponse.usage?.completionTokens || 0),
                totalTokens: (response.usage?.totalTokens || 0) + (finalResponse.usage?.totalTokens || 0),
              },
            };
          }
        }
        
        return {
          output: response.content,
          tokenUsage: response.usage,
        };
      }
    };
  }

  private async createSequentialAgent(
    llm: ILLMProvider,
    tools: ITool[],
    memory: IMemory | null,
    config: AgentNodeConfig
  ): Promise<any> {
    // Sequential agent - executes tools in sequence based on plan
    return {
      invoke: async (input: any) => {
        // First, create a plan
        const planPrompt = `Given this task: ${JSON.stringify(input)}
        And these available tools: ${tools.map(t => `${t.name}: ${t.description}`).join(', ')}
        Create a step-by-step plan to accomplish the task.`;
        
        const planResponse = await llm.chat([
          { role: 'system', content: 'You are a planning assistant.' },
          { role: 'user', content: planPrompt }
        ], config.llmConfig);
        
        // Execute plan steps
        const steps = this.parsePlanSteps(planResponse.content);
        const results: any[] = [];
        
        for (const step of steps) {
          const tool = tools.find(t => t.name === step.tool);
          if (tool) {
            const result = await tool.execute(step.args);
            results.push({ tool: step.tool, result });
          }
        }
        
        // Generate final response
        const finalPrompt = `Task: ${JSON.stringify(input)}
        Results: ${JSON.stringify(results)}
        Provide a final answer based on these results.`;
        
        const finalResponse = await llm.chat([
          { role: 'user', content: finalPrompt }
        ], config.llmConfig);
        
        return {
          output: finalResponse.content,
          steps: results,
          tokenUsage: finalResponse.usage,
        };
      }
    };
  }

  private async createConversationalAgent(
    llm: ILLMProvider,
    tools: ITool[],
    memory: IMemory | null,
    config: AgentNodeConfig
  ): Promise<any> {
    // Conversational agent with memory
    return {
      invoke: async (input: any) => {
        const conversation = memory ? await memory.getMessages() : [];
        
        const messages = [
          { 
            role: 'system', 
            content: config.llmConfig?.systemPrompt || 'You are a helpful conversational assistant.'
          },
          ...conversation,
          { role: 'user', content: JSON.stringify(input) }
        ];
        
        const response = await llm.chat(messages, {
          model: config.llmModel,
          ...config.llmConfig,
        });
        
        // Save to memory
        if (memory) {
          await memory.addMessage('user', JSON.stringify(input));
          await memory.addMessage('assistant', response.content);
        }
        
        return {
          output: response.content,
          tokenUsage: response.usage,
        };
      }
    };
  }

  private async executeWithTimeout(
    agent: any,
    input: any,
    timeout: number,
    maxIterations: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${timeout}ms`));
      }, timeout);
      
      agent.invoke(input)
        .then((result: any) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error: any) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async saveToMemory(
    memory: IMemory,
    input: any,
    result: any,
    context: INodeExecutionContext
  ): Promise<void> {
    await memory.save({
      input,
      output: result.output,
      timestamp: new Date(),
      nodeId: this.nodeData.id,
      executionId: context.executionId,
    });
  }

  private extractVariables(result: any): Record<string, any> {
    return {
      agentOutput: result.output,
      toolsUsed: result.toolCalls?.map((tc: any) => tc.name) || [],
      iterations: result.iterations || 1,
    };
  }

  private updateFlowState(
    currentState: Record<string, any>,
    result: any
  ): Record<string, any> {
    return {
      ...currentState,
      lastAgentOutput: result.output,
      lastAgentTools: result.toolCalls?.map((tc: any) => tc.name) || [],
    };
  }

  private extractToolsUsed(result: any): string[] {
    if (result.toolCalls) {
      return result.toolCalls.map((tc: any) => tc.name);
    }
    if (result.steps) {
      return result.steps.filter((s: any) => s.action).map((s: any) => s.action);
    }
    return [];
  }

  private parseToolCall(text: string): { name: string; args: any } | null {
    // Parse tool calls from agent response
    // Format: ACTION: tool_name(args)
    const match = text.match(/ACTION:\s*(\w+)\((.*?)\)/);
    if (match) {
      try {
        return {
          name: match[1],
          args: JSON.parse(match[2]),
        };
      } catch {
        return { name: match[1], args: match[2] };
      }
    }
    return null;
  }

  private parsePlanSteps(plan: string): Array<{ tool: string; args: any }> {
    // Parse sequential plan into steps
    const steps: Array<{ tool: string; args: any }> = [];
    const lines = plan.split('\n');
    
    for (const line of lines) {
      const match = line.match(/\d+\.\s*(\w+):\s*(.*)/);
      if (match) {
        steps.push({
          tool: match[1],
          args: this.parseArgs(match[2]),
        });
      }
    }
    
    return steps;
  }

  private parseArgs(argsStr: string): any {
    try {
      return JSON.parse(argsStr);
    } catch {
      // If not JSON, return as string
      return argsStr;
    }
  }
}

// Node metadata for registration
export const AGENT_NODE_DATA: INodeData = {
  id: 'agent',
  label: 'AI Agent',
  name: 'agent',
  type: 'agent',
  category: 'agents',
  version: 1,
  description: 'Generic AI agent that can use any LLM provider and tools',
  icon: '🤖',
  baseClasses: ['Agent', 'Node'],
  inputs: [
    {
      label: 'Input',
      name: 'input',
      type: 'string',
      optional: false,
    },
  ],
  outputs: [
    {
      label: 'Output',
      name: 'output',
      type: 'string',
    },
  ],
  inputAnchors: [
    {
      id: 'input',
      label: 'Input',
      name: 'input',
      type: 'any',
    },
  ],
  outputAnchors: [
    {
      id: 'output',
      label: 'Output',
      name: 'output',
      type: 'any',
    },
  ],
};