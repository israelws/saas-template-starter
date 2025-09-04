import { Logger } from '@nestjs/common';
import { RunnableConfig } from '@langchain/core/runnables';

/**
 * Node parameter types
 */
export enum NodeParamType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  OPTIONS = 'options',
  MULTILINE = 'multiline',
  CODE = 'code',
  FILE = 'file',
  CREDENTIAL = 'credential',
  MULTI_OPTIONS = 'multiOptions',
  DATE = 'date',
  COLOR = 'color',
}

/**
 * Node parameter definition
 */
export interface INodeParam {
  label: string;
  name: string;
  type: NodeParamType;
  default?: any;
  optional?: boolean;
  options?: Array<{
    label: string;
    name: string;
    description?: string;
  }>;
  rows?: number;
  placeholder?: string;
  description?: string;
  acceptFormats?: string[];
  credentialNames?: string[];
  show?: Record<string, string[]>;
  hide?: Record<string, string[]>;
  additionalParams?: boolean;
}

/**
 * Node input/output anchor
 */
export interface INodeAnchor {
  id: string;
  label: string;
  name: string;
  type: string;
  optional?: boolean;
  list?: boolean;
  description?: string;
}

/**
 * Node data interface
 */
export interface INodeData {
  id: string;
  label: string;
  name: string;
  type: string;
  category: string;
  version: number;
  description?: string;
  icon?: string;
  baseClasses?: string[];
  inputs?: INodeParam[];
  outputs?: INodeParam[];
  credentials?: INodeParam[];
  inputAnchors?: INodeAnchor[];
  outputAnchors?: INodeAnchor[];
}

/**
 * Node execution context
 */
export interface INodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  organizationId: string;
  sessionId?: string;
  variables: Record<string, any>;
  flowState: Record<string, any>;
  credentials: Record<string, any>;
  memory?: any;
  logger: Logger;
}

/**
 * Node execution result
 */
export interface INodeExecutionResult {
  output?: any;
  variables?: Record<string, any>;
  flowState?: Record<string, any>;
  messages?: any[];
  error?: string;
  metadata?: Record<string, any>;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number;
}

/**
 * Base class for all workflow nodes
 */
export abstract class BaseNode {
  protected readonly logger: Logger;
  
  constructor(
    public readonly nodeData: INodeData,
    protected readonly nodeParams: Record<string, any> = {}
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Initialize node before execution
   */
  async initialize(context: INodeExecutionContext): Promise<void> {
    this.logger.debug(`Initializing node ${this.nodeData.id}`);
    // Override in subclasses for specific initialization
  }

  /**
   * Execute the node
   */
  abstract execute(
    input: any,
    context: INodeExecutionContext,
    config?: RunnableConfig
  ): Promise<INodeExecutionResult>;

  /**
   * Validate node parameters
   */
  validateParams(): boolean {
    const requiredParams = this.nodeData.inputs?.filter(p => !p.optional) || [];
    
    for (const param of requiredParams) {
      if (!(param.name in this.nodeParams) || this.nodeParams[param.name] === undefined) {
        throw new Error(`Required parameter '${param.label}' is missing`);
      }
    }
    
    return true;
  }

  /**
   * Get parameter value
   */
  protected getParam<T = any>(name: string, defaultValue?: T): T {
    return this.nodeParams[name] ?? defaultValue;
  }

  /**
   * Resolve variable references in text
   */
  protected resolveVariables(text: string, context: INodeExecutionContext): string {
    if (!text) return text;
    
    // Replace {{variable}} patterns with actual values
    return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getValueFromPath(context.variables, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get value from nested object path
   */
  protected getValueFromPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Set value in nested object path
   */
  protected setValueInPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    if (lastKey) {
      current[lastKey] = value;
    }
  }

  /**
   * Clean up after execution
   */
  async cleanup(context: INodeExecutionContext): Promise<void> {
    this.logger.debug(`Cleaning up node ${this.nodeData.id}`);
    // Override in subclasses for specific cleanup
  }

  /**
   * Get node metadata
   */
  getMetadata(): INodeData {
    return this.nodeData;
  }

  /**
   * Get node type
   */
  getType(): string {
    return this.nodeData.type;
  }

  /**
   * Get node category
   */
  getCategory(): string {
    return this.nodeData.category;
  }

  /**
   * Check if node has specific base class
   */
  hasBaseClass(className: string): boolean {
    return this.nodeData.baseClasses?.includes(className) || false;
  }

  /**
   * Format error for consistent error handling
   */
  protected formatError(error: any): INodeExecutionResult {
    return {
      error: error.message || 'Unknown error occurred',
      metadata: {
        stack: error.stack,
        nodeId: this.nodeData.id,
        nodeType: this.nodeData.type,
      },
    };
  }
}

/**
 * Base class for trigger nodes
 */
export abstract class BaseTriggerNode extends BaseNode {
  /**
   * Register trigger handlers
   */
  abstract registerTrigger(context: INodeExecutionContext): Promise<void>;

  /**
   * Unregister trigger handlers
   */
  abstract unregisterTrigger(context: INodeExecutionContext): Promise<void>;
}

/**
 * Base class for LLM nodes
 */
export abstract class BaseLLMNode extends BaseNode {
  /**
   * Get LLM configuration
   */
  protected getLLMConfig(): Record<string, any> {
    return {
      temperature: this.getParam('temperature', 0.7),
      maxTokens: this.getParam('maxTokens', 1000),
      topP: this.getParam('topP', 1),
      frequencyPenalty: this.getParam('frequencyPenalty', 0),
      presencePenalty: this.getParam('presencePenalty', 0),
      streaming: this.getParam('streaming', false),
    };
  }

  /**
   * Calculate token usage cost
   */
  protected calculateCost(tokenUsage: any, model: string): number {
    // Implement cost calculation based on model pricing
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      'claude-3-opus': { prompt: 0.015, completion: 0.075 },
      'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
    };

    const price = pricing[model] || { prompt: 0, completion: 0 };
    const promptCost = (tokenUsage.promptTokens / 1000) * price.prompt;
    const completionCost = (tokenUsage.completionTokens / 1000) * price.completion;
    
    return promptCost + completionCost;
  }
}

/**
 * Base class for agent nodes
 */
export abstract class BaseAgentNode extends BaseLLMNode {
  /**
   * Get available tools for the agent
   */
  abstract getTools(context: INodeExecutionContext): Promise<any[]>;

  /**
   * Create agent executor
   */
  abstract createAgentExecutor(context: INodeExecutionContext): Promise<any>;
}

/**
 * Base class for memory nodes
 */
export abstract class BaseMemoryNode extends BaseNode {
  /**
   * Save to memory
   */
  abstract saveMemory(data: any, context: INodeExecutionContext): Promise<void>;

  /**
   * Load from memory
   */
  abstract loadMemory(context: INodeExecutionContext): Promise<any>;

  /**
   * Clear memory
   */
  abstract clearMemory(context: INodeExecutionContext): Promise<void>;
}

/**
 * Base class for tool nodes
 */
export abstract class BaseToolNode extends BaseNode {
  /**
   * Get tool schema
   */
  abstract getToolSchema(): any;

  /**
   * Execute tool
   */
  abstract executeTool(input: any, context: INodeExecutionContext): Promise<any>;
}

/**
 * Base class for vector store nodes
 */
export abstract class BaseVectorStoreNode extends BaseNode {
  /**
   * Add documents to vector store
   */
  abstract addDocuments(documents: any[], context: INodeExecutionContext): Promise<void>;

  /**
   * Search similar documents
   */
  abstract similaritySearch(
    query: string,
    k: number,
    context: INodeExecutionContext
  ): Promise<any[]>;

  /**
   * Delete documents from vector store
   */
  abstract deleteDocuments(ids: string[], context: INodeExecutionContext): Promise<void>;
}