import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ILLMProvider,
  LLMProviderConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  EmbedOptions,
  ImageOptions,
  AudioOptions,
  ModelInfo,
  UsageInfo,
} from '../llm-provider.interface';

export class OpenAIProvider implements ILLMProvider {
  name = 'openai';
  type: 'cloud' = 'cloud';
  models = [
    'gpt-4-turbo-preview',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ];
  
  supportedFeatures = {
    streaming: true,
    functionCalling: true,
    vision: true,
    embeddings: true,
    imageGeneration: true,
    audioTranscription: true,
    codeExecution: false,
  };

  private client: OpenAI | null = null;
  private logger = new Logger(OpenAIProvider.name);
  private totalUsage = { promptTokens: 0, completionTokens: 0, totalCost: 0 };

  async initialize(config: LLMProviderConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organizationId,
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });

    this.logger.log('OpenAI provider initialized');
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Convert messages to OpenAI format
      const openAIMessages = this.convertMessages(messages);
      
      // Prepare request parameters
      const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model: options?.model || 'gpt-3.5-turbo',
        messages: openAIMessages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        user: options?.user,
        seed: options?.seed,
        logprobs: options?.logprobs,
        top_logprobs: options?.topLogprobs,
      };

      // Add function calling if provided
      if (options?.functions) {
        params.functions = options.functions as any;
        params.function_call = options.functionCall as any;
      }

      // Add tools if provided (GPT-4 Turbo)
      if (options?.tools) {
        params.tools = options.tools as any;
        params.tool_choice = options.toolChoice as any;
      }

      // Response format
      if (options?.responseFormat) {
        params.response_format = options.responseFormat as any;
      }

      // Make the API call
      const completion = await this.client.chat.completions.create(params);
      
      const choice = completion.choices[0];
      
      // Update usage tracking
      if (completion.usage) {
        this.totalUsage.promptTokens += completion.usage.prompt_tokens;
        this.totalUsage.completionTokens += completion.usage.completion_tokens;
        this.totalUsage.totalCost += this.calculateCost(
          options?.model || 'gpt-3.5-turbo',
          completion.usage.prompt_tokens,
          completion.usage.completion_tokens
        );
      }

      // Build response
      const response: ChatResponse = {
        id: completion.id,
        model: completion.model,
        content: choice.message.content || '',
        finishReason: choice.finish_reason as any,
      };

      // Add function call if present
      if (choice.message.function_call) {
        response.functionCall = {
          name: choice.message.function_call.name,
          arguments: choice.message.function_call.arguments,
        };
      }

      // Add tool calls if present
      if (choice.message.tool_calls) {
        response.toolCalls = choice.message.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        }));
      }

      // Add usage info
      if (completion.usage) {
        response.usage = {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        };
      }

      return response;
    } catch (error) {
      this.logger.error('OpenAI chat failed:', error);
      throw error;
    }
  }

  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<ChatStreamChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const openAIMessages = this.convertMessages(messages);
      
      const stream = await this.client.chat.completions.create({
        model: options?.model || 'gpt-3.5-turbo',
        messages: openAIMessages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stream: true,
        functions: options?.functions as any,
        tools: options?.tools as any,
      });

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        
        yield {
          id: chunk.id,
          model: chunk.model,
          delta: {
            content: choice.delta?.content,
            functionCall: choice.delta?.function_call ? {
              name: choice.delta.function_call.name,
              arguments: choice.delta.function_call.arguments,
            } : undefined,
            toolCalls: choice.delta?.tool_calls?.map((tc, index) => ({
              index,
              id: tc.id,
              type: 'function' as const,
              function: tc.function ? {
                name: tc.function.name,
                arguments: tc.function.arguments,
              } : undefined,
            })),
          },
          finishReason: choice.finish_reason || undefined,
        };
      }
    } catch (error) {
      this.logger.error('OpenAI stream chat failed:', error);
      throw error;
    }
  }

  async embed(text: string | string[], options?: EmbedOptions): Promise<number[][]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const input = Array.isArray(text) ? text : [text];
      
      const response = await this.client.embeddings.create({
        model: options?.model || 'text-embedding-ada-002',
        input,
        dimensions: options?.dimensions,
        user: options?.user,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      this.logger.error('OpenAI embed failed:', error);
      throw error;
    }
  }

  async generateImage(prompt: string, options?: ImageOptions): Promise<string[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.images.generate({
        model: options?.model || 'dall-e-3',
        prompt,
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        style: options?.style || 'vivid',
        n: options?.n || 1,
        response_format: options?.responseFormat || 'url',
        user: options?.user,
      });

      return response.data.map(item => 
        item.url || item.b64_json || ''
      );
    } catch (error) {
      this.logger.error('OpenAI image generation failed:', error);
      throw error;
    }
  }

  async transcribeAudio(audio: Buffer, options?: AudioOptions): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Create a File object from Buffer
      const file = new File([audio], 'audio.mp3', { type: 'audio/mpeg' });
      
      const response = await this.client.audio.transcriptions.create({
        model: options?.model || 'whisper-1',
        file,
        language: options?.language,
        prompt: options?.prompt,
        response_format: options?.responseFormat || 'text',
        temperature: options?.temperature,
      });

      return typeof response === 'string' ? response : response.text;
    } catch (error) {
      this.logger.error('OpenAI audio transcription failed:', error);
      throw error;
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.models.list();
      
      // Filter to only chat models and add pricing info
      const chatModels = response.data.filter(model => 
        model.id.includes('gpt') || model.id.includes('text-davinci')
      );

      return chatModels.map(model => ({
        id: model.id,
        name: model.id,
        description: this.getModelDescription(model.id),
        contextLength: this.getModelContextLength(model.id),
        pricing: this.getModelPricing(model.id),
        capabilities: this.getModelCapabilities(model.id),
        deprecated: this.isModelDeprecated(model.id),
      }));
    } catch (error) {
      // If listing fails, return default models
      return this.models.map(modelId => ({
        id: modelId,
        name: modelId,
        description: this.getModelDescription(modelId),
        contextLength: this.getModelContextLength(modelId),
        pricing: this.getModelPricing(modelId),
        capabilities: this.getModelCapabilities(modelId),
        deprecated: false,
      }));
    }
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Try to list models as a simple test
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.error('OpenAI credentials validation failed:', error);
      return false;
    }
  }

  async getUsage(): Promise<UsageInfo> {
    return {
      totalTokens: this.totalUsage.promptTokens + this.totalUsage.completionTokens,
      totalCost: this.totalUsage.totalCost,
      modelUsage: {
        'all': {
          tokens: this.totalUsage.promptTokens + this.totalUsage.completionTokens,
          cost: this.totalUsage.totalCost,
        },
      },
    };
  }

  // Helper methods
  private convertMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      const baseMessage: any = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.name) {
        baseMessage.name = msg.name;
      }

      if (msg.functionCall) {
        baseMessage.function_call = msg.functionCall;
      }

      if (msg.toolCalls) {
        baseMessage.tool_calls = msg.toolCalls;
      }

      return baseMessage;
    });
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
    };

    const modelPricing = pricing[model] || { prompt: 0, completion: 0 };
    const promptCost = (promptTokens / 1000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }

  private getModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'gpt-4-turbo-preview': 'Most capable GPT-4 model with 128k context',
      'gpt-4-turbo': 'GPT-4 Turbo with Vision',
      'gpt-4': 'Most capable model for complex tasks',
      'gpt-4-32k': 'GPT-4 with extended context length',
      'gpt-3.5-turbo': 'Fast and efficient for most tasks',
      'gpt-3.5-turbo-16k': 'GPT-3.5 with extended context',
    };
    
    return descriptions[modelId] || 'OpenAI language model';
  }

  private getModelContextLength(modelId: string): number {
    const contextLengths: Record<string, number> = {
      'gpt-4-turbo-preview': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-4-32k': 32768,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16385,
    };
    
    return contextLengths[modelId] || 4096;
  }

  private getModelPricing(modelId: string): { prompt: number; completion: number } {
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-32k': { prompt: 0.06, completion: 0.12 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      'gpt-3.5-turbo-16k': { prompt: 0.003, completion: 0.004 },
    };
    
    return pricing[modelId] || { prompt: 0, completion: 0 };
  }

  private getModelCapabilities(modelId: string): string[] {
    const capabilities: Record<string, string[]> = {
      'gpt-4-turbo-preview': ['chat', 'functions', 'tools', 'vision', 'json_mode'],
      'gpt-4-turbo': ['chat', 'functions', 'tools', 'vision', 'json_mode'],
      'gpt-4': ['chat', 'functions'],
      'gpt-4-32k': ['chat', 'functions', 'extended_context'],
      'gpt-3.5-turbo': ['chat', 'functions'],
      'gpt-3.5-turbo-16k': ['chat', 'functions', 'extended_context'],
    };
    
    return capabilities[modelId] || ['chat'];
  }

  private isModelDeprecated(modelId: string): boolean {
    const deprecated = ['text-davinci-003', 'text-davinci-002'];
    return deprecated.includes(modelId);
  }
}

export default OpenAIProvider;