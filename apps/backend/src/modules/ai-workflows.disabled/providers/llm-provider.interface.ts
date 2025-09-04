/**
 * Universal interface for all LLM providers
 * Supports cloud, local, and custom endpoints
 */

export interface ILLMProvider {
  name: string;
  type: 'cloud' | 'local' | 'proxy' | 'custom';
  models: string[];
  supportedFeatures: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    embeddings: boolean;
    imageGeneration?: boolean;
    audioTranscription?: boolean;
    codeExecution?: boolean;
  };
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: LLMProviderConfig): Promise<void>;
  
  /**
   * Send chat completion request
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  
  /**
   * Stream chat completion
   */
  streamChat?(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatStreamChunk>;
  
  /**
   * Generate embeddings
   */
  embed?(text: string | string[], options?: EmbedOptions): Promise<number[][]>;
  
  /**
   * Generate images
   */
  generateImage?(prompt: string, options?: ImageOptions): Promise<string[]>;
  
  /**
   * Transcribe audio
   */
  transcribeAudio?(audio: Buffer, options?: AudioOptions): Promise<string>;
  
  /**
   * List available models
   */
  listModels(): Promise<ModelInfo[]>;
  
  /**
   * Validate credentials
   */
  validateCredentials(): Promise<boolean>;
  
  /**
   * Get usage/cost information
   */
  getUsage?(): Promise<UsageInfo>;
}

export interface LLMProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  organizationId?: string;
  projectId?: string;
  region?: string;
  timeout?: number;
  maxRetries?: number;
  customHeaders?: Record<string, string>;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  functions?: FunctionDefinition[];
  functionCall?: 'none' | 'auto' | { name: string };
  tools?: ToolDefinition[];
  toolChoice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
  responseFormat?: { type: 'text' | 'json_object' };
  seed?: number;
  user?: string;
  logprobs?: boolean;
  topLogprobs?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter';
}

export interface ChatStreamChunk {
  id: string;
  model: string;
  delta: {
    content?: string;
    functionCall?: {
      name?: string;
      arguments?: string;
    };
    toolCalls?: Array<{
      index: number;
      id?: string;
      type?: 'function';
      function?: {
        name?: string;
        arguments?: string;
      };
    }>;
  };
  finishReason?: string;
}

export interface EmbedOptions {
  model?: string;
  dimensions?: number;
  user?: string;
}

export interface ImageOptions {
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  n?: number;
  responseFormat?: 'url' | 'b64_json';
  user?: string;
}

export interface AudioOptions {
  model?: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: {
    prompt: number; // $ per 1K tokens
    completion: number; // $ per 1K tokens
  };
  capabilities?: string[];
  deprecated?: boolean;
}

export interface UsageInfo {
  totalTokens: number;
  totalCost: number;
  modelUsage: Record<string, {
    tokens: number;
    cost: number;
  }>;
  period?: {
    start: Date;
    end: Date;
  };
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolDefinition {
  type: 'function';
  function: FunctionDefinition;
}