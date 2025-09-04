import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  ILLMProvider,
  LLMProviderConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  EmbedOptions,
  ModelInfo,
} from '../llm-provider.interface';

/**
 * Ollama provider for local LLM models
 * Supports 100+ open-source models running locally
 */
@Injectable()
export class OllamaProvider implements ILLMProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private client: AxiosInstance;
  private config: LLMProviderConfig;
  private available = false;

  name = 'ollama';
  type = 'local' as const;
  models: string[] = [];
  supportedFeatures = {
    streaming: true,
    functionCalling: false, // Most Ollama models don't support function calling yet
    vision: true, // Some models like llava support vision
    embeddings: true,
    imageGeneration: false,
    audioTranscription: false,
    codeExecution: false,
  };

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config;
    
    // Default Ollama runs on localhost:11434
    const baseURL = config.apiUrl || 'http://localhost:11434';
    
    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 120000, // 2 minutes default for large models
      headers: config.customHeaders || {},
    });

    // Check if Ollama is running and get available models
    try {
      await this.validateCredentials();
      this.available = true;
      this.models = await this.fetchAvailableModels();
      this.logger.log(`Ollama initialized with ${this.models.length} models available`);
    } catch (error) {
      this.logger.warn('Ollama service not available:', error.message);
      this.available = false;
    }
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    const model = options?.model || 'llama2';
    
    // Convert messages to Ollama format
    const prompt = this.messagesToPrompt(messages);
    
    try {
      const response = await this.client.post('/api/generate', {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature,
          top_p: options?.topP,
          num_predict: options?.maxTokens,
          stop: options?.stop,
          seed: options?.seed,
        },
      });

      return {
        id: `ollama-${Date.now()}`,
        model,
        content: response.data.response,
        usage: {
          promptTokens: response.data.prompt_eval_count || 0,
          completionTokens: response.data.eval_count || 0,
          totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
        },
        finishReason: response.data.done ? 'stop' : 'length',
      };
    } catch (error) {
      this.logger.error('Ollama chat error:', error);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  async *streamChat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<ChatStreamChunk> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    const model = options?.model || 'llama2';
    const prompt = this.messagesToPrompt(messages);

    try {
      const response = await this.client.post('/api/generate', {
        model,
        prompt,
        stream: true,
        options: {
          temperature: options?.temperature,
          top_p: options?.topP,
          num_predict: options?.maxTokens,
          stop: options?.stop,
          seed: options?.seed,
        },
      }, {
        responseType: 'stream',
      });

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              yield {
                id: `ollama-stream-${Date.now()}`,
                model,
                delta: {
                  content: data.response,
                },
                finishReason: data.done ? 'stop' : undefined,
              };
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Ollama stream error:', error);
      throw new Error(`Ollama stream failed: ${error.message}`);
    }
  }

  async embed(text: string | string[], options?: EmbedOptions): Promise<number[][]> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    const model = options?.model || 'nomic-embed-text';
    const texts = Array.isArray(text) ? text : [text];
    const embeddings: number[][] = [];

    try {
      for (const t of texts) {
        const response = await this.client.post('/api/embeddings', {
          model,
          prompt: t,
        });
        embeddings.push(response.data.embedding);
      }
      
      return embeddings;
    } catch (error) {
      this.logger.error('Ollama embed error:', error);
      throw new Error(`Ollama embedding failed: ${error.message}`);
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (!this.available) {
      return [];
    }

    try {
      const response = await this.client.get('/api/tags');
      return response.data.models.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: `${model.name} - Size: ${this.formatSize(model.size)}`,
        contextLength: this.getContextLength(model.name),
        capabilities: this.getModelCapabilities(model.name),
      }));
    } catch (error) {
      this.logger.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Pull a model from Ollama library
   */
  async pullModel(modelName: string): Promise<void> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    try {
      this.logger.log(`Pulling model ${modelName}...`);
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: false,
      });
      
      if (response.data.status === 'success') {
        this.logger.log(`Model ${modelName} pulled successfully`);
        // Refresh available models
        this.models = await this.fetchAvailableModels();
      }
    } catch (error) {
      this.logger.error(`Failed to pull model ${modelName}:`, error);
      throw new Error(`Failed to pull model: ${error.message}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    try {
      await this.client.delete('/api/delete', {
        data: { name: modelName },
      });
      this.logger.log(`Model ${modelName} deleted`);
      // Refresh available models
      this.models = await this.fetchAvailableModels();
    } catch (error) {
      this.logger.error(`Failed to delete model ${modelName}:`, error);
      throw new Error(`Failed to delete model: ${error.message}`);
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<any> {
    if (!this.available) {
      throw new Error('Ollama service is not available');
    }

    try {
      const response = await this.client.post('/api/show', {
        name: modelName,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get model info for ${modelName}:`, error);
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }

  private async fetchAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models.map((m: any) => m.name);
    } catch (error) {
      return [];
    }
  }

  private messagesToPrompt(messages: ChatMessage[]): string {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return `System: ${msg.content}`;
        case 'user':
          return `User: ${msg.content}`;
        case 'assistant':
          return `Assistant: ${msg.content}`;
        default:
          return msg.content;
      }
    }).join('\n\n');
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private getContextLength(modelName: string): number {
    // Common context lengths for popular models
    const contextLengths: Record<string, number> = {
      'llama2': 4096,
      'llama2:13b': 4096,
      'llama2:70b': 4096,
      'llama3': 8192,
      'llama3:70b': 8192,
      'mistral': 8192,
      'mixtral': 32768,
      'codellama': 16384,
      'deepseek-coder': 16384,
      'phi': 2048,
      'phi3': 128000,
      'gemma': 8192,
      'gemma2': 8192,
      'qwen': 32768,
      'qwen2': 128000,
      'yi': 200000,
    };

    // Check for exact match or base model
    const baseName = modelName.split(':')[0];
    return contextLengths[modelName] || contextLengths[baseName] || 4096;
  }

  private getModelCapabilities(modelName: string): string[] {
    const capabilities: string[] = ['text-generation'];
    
    // Vision models
    if (modelName.includes('llava') || modelName.includes('bakllava')) {
      capabilities.push('vision');
    }
    
    // Code models
    if (modelName.includes('code') || modelName.includes('deepseek') || modelName.includes('starcoder')) {
      capabilities.push('code-generation');
    }
    
    // Embedding models
    if (modelName.includes('embed') || modelName.includes('nomic')) {
      capabilities.push('embeddings');
    }
    
    // Instruction-tuned models
    if (modelName.includes('instruct') || modelName.includes('chat')) {
      capabilities.push('instruction-following');
    }
    
    return capabilities;
  }

  /**
   * Get recommended models for different use cases
   */
  getRecommendedModels(): Record<string, string[]> {
    return {
      general: ['llama3', 'mistral', 'gemma2'],
      code: ['codellama', 'deepseek-coder', 'starcoder2'],
      vision: ['llava', 'bakllava'],
      embeddings: ['nomic-embed-text', 'all-minilm'],
      large: ['llama3:70b', 'mixtral:8x7b', 'yi:34b'],
      fast: ['phi3', 'tinyllama', 'gemma:2b'],
    };
  }
}