import { Injectable, Logger } from '@nestjs/common';
import { ILLMProvider, LLMProviderConfig, ChatMessage, ChatOptions, ChatResponse } from './llm-provider.interface';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface LLMConfig {
  provider: string;
  model?: string;
  organizationId?: string;
  credentials?: any;
  [key: string]: any;
}

export interface ProviderCredentials {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  region?: string;
  projectId?: string;
  [key: string]: any;
}

@Injectable()
export class UniversalLLMAdapter {
  private readonly logger = new Logger(UniversalLLMAdapter.name);
  private providers: Map<string, ILLMProvider> = new Map();
  private providerInstances: Map<string, ILLMProvider> = new Map();
  private credentialsCache: Map<string, ProviderCredentials> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository('LLMCredentials')
    private credentialsRepo: Repository<any>,
  ) {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Providers will be registered dynamically
    this.logger.log('Universal LLM Adapter initialized');
  }

  /**
   * Register a new LLM provider
   */
  registerProvider(name: string, providerClass: new () => ILLMProvider) {
    if (this.providers.has(name)) {
      this.logger.warn(`Provider ${name} is already registered. Overwriting.`);
    }
    
    const provider = new providerClass();
    this.providers.set(name, provider);
    this.logger.log(`Registered LLM provider: ${name}`);
  }

  /**
   * Get a configured LLM provider instance
   */
  async getProvider(config: LLMConfig): Promise<ILLMProvider> {
    const { provider: providerName, organizationId } = config;
    
    // Check if provider is registered
    const providerTemplate = this.providers.get(providerName);
    if (!providerTemplate) {
      throw new Error(`LLM provider '${providerName}' is not registered`);
    }

    // Create instance key for caching
    const instanceKey = `${providerName}-${organizationId || 'default'}`;
    
    // Check if we have a cached instance
    if (this.providerInstances.has(instanceKey)) {
      return this.providerInstances.get(instanceKey)!;
    }

    // Get credentials
    const credentials = await this.getCredentials(providerName, organizationId);
    
    // Create new provider instance
    const provider = Object.create(providerTemplate);
    
    // Initialize with credentials
    const providerConfig: LLMProviderConfig = {
      ...credentials,
      ...config.credentials,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };
    
    await provider.initialize(providerConfig);
    
    // Validate credentials
    const isValid = await provider.validateCredentials();
    if (!isValid) {
      throw new Error(`Invalid credentials for provider '${providerName}'`);
    }

    // Cache the instance
    this.providerInstances.set(instanceKey, provider);
    
    return provider;
  }

  /**
   * Get credentials for a provider
   */
  private async getCredentials(
    provider: string,
    organizationId?: string
  ): Promise<ProviderCredentials> {
    const cacheKey = `${provider}-${organizationId || 'default'}`;
    
    // Check cache
    if (this.credentialsCache.has(cacheKey)) {
      return this.credentialsCache.get(cacheKey)!;
    }

    // Try to get from database if organizationId is provided
    if (organizationId) {
      try {
        const dbCredentials = await this.credentialsRepo.findOne({
          where: {
            organizationId,
            provider,
            isActive: true,
          },
        });
        
        if (dbCredentials) {
          const credentials = {
            provider,
            ...this.decryptCredentials(dbCredentials.credentials),
          };
          this.credentialsCache.set(cacheKey, credentials);
          return credentials;
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch credentials from database: ${error.message}`);
      }
    }

    // Fall back to environment variables
    const envCredentials = this.getEnvCredentials(provider);
    if (envCredentials) {
      this.credentialsCache.set(cacheKey, envCredentials);
      return envCredentials;
    }

    throw new Error(`No credentials found for provider '${provider}'`);
  }

  /**
   * Get credentials from environment variables
   */
  private getEnvCredentials(provider: string): ProviderCredentials | null {
    const mapping: Record<string, { apiKey: string; apiUrl?: string; region?: string }> = {
      openai: {
        apiKey: 'OPENAI_API_KEY',
        apiUrl: 'OPENAI_API_URL',
      },
      anthropic: {
        apiKey: 'ANTHROPIC_API_KEY',
        apiUrl: 'ANTHROPIC_API_URL',
      },
      bedrock: {
        apiKey: 'AWS_ACCESS_KEY_ID',
        region: 'AWS_REGION',
      },
      gemini: {
        apiKey: 'GOOGLE_API_KEY',
      },
      ollama: {
        apiUrl: 'OLLAMA_API_URL',
      },
    };

    const config = mapping[provider];
    if (!config) {
      return null;
    }

    const credentials: ProviderCredentials = { provider };

    if (config.apiKey) {
      const apiKey = this.configService.get<string>(config.apiKey);
      if (apiKey) {
        credentials.apiKey = apiKey;
      }
    }

    if (config.apiUrl) {
      const apiUrl = this.configService.get<string>(config.apiUrl);
      if (apiUrl) {
        credentials.apiUrl = apiUrl;
      }
    }

    if (config.region) {
      const region = this.configService.get<string>(config.region);
      if (region) {
        credentials.region = region;
      }
    }

    // Check if we have minimum required credentials
    if (provider === 'ollama' && credentials.apiUrl) {
      return credentials;
    }
    
    if (credentials.apiKey) {
      return credentials;
    }

    return null;
  }

  /**
   * Decrypt credentials (implement your encryption logic)
   */
  private decryptCredentials(encrypted: any): any {
    // TODO: Implement actual decryption
    // For now, assuming credentials are stored in plain JSON (not recommended for production)
    return encrypted;
  }

  /**
   * Unified chat interface
   */
  async chat(
    providerName: string,
    messages: ChatMessage[],
    options?: ChatOptions & { organizationId?: string }
  ): Promise<ChatResponse> {
    const provider = await this.getProvider({
      provider: providerName,
      organizationId: options?.organizationId,
    });
    
    return await provider.chat(messages, options);
  }

  /**
   * Stream chat responses
   */
  async *streamChat(
    providerName: string,
    messages: ChatMessage[],
    options?: ChatOptions & { organizationId?: string }
  ): AsyncGenerator<any> {
    const provider = await this.getProvider({
      provider: providerName,
      organizationId: options?.organizationId,
    });
    
    if (!provider.streamChat) {
      throw new Error(`Provider '${providerName}' does not support streaming`);
    }
    
    for await (const chunk of provider.streamChat(messages, options)) {
      yield chunk;
    }
  }

  /**
   * Generate embeddings
   */
  async embed(
    providerName: string,
    text: string | string[],
    options?: any
  ): Promise<number[][]> {
    const provider = await this.getProvider({
      provider: providerName,
      organizationId: options?.organizationId,
    });
    
    if (!provider.embed) {
      throw new Error(`Provider '${providerName}' does not support embeddings`);
    }
    
    return await provider.embed(text, options);
  }

  /**
   * List available models for a provider
   */
  async listModels(providerName: string, organizationId?: string): Promise<any[]> {
    const provider = await this.getProvider({
      provider: providerName,
      organizationId,
    });
    
    return await provider.listModels();
  }

  /**
   * Get all registered providers
   */
  getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(providerName: string): any {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider '${providerName}' is not registered`);
    }
    
    return {
      name: provider.name,
      type: provider.type,
      models: provider.models,
      supportedFeatures: provider.supportedFeatures,
    };
  }

  /**
   * Clear cached instances and credentials
   */
  clearCache(organizationId?: string) {
    if (organizationId) {
      // Clear specific organization's cached instances
      for (const [key] of this.providerInstances) {
        if (key.includes(organizationId)) {
          this.providerInstances.delete(key);
        }
      }
      for (const [key] of this.credentialsCache) {
        if (key.includes(organizationId)) {
          this.credentialsCache.delete(key);
        }
      }
    } else {
      // Clear all caches
      this.providerInstances.clear();
      this.credentialsCache.clear();
    }
  }

  /**
   * Save or update credentials for a provider
   */
  async saveCredentials(
    organizationId: string,
    provider: string,
    credentials: any
  ): Promise<void> {
    try {
      const existing = await this.credentialsRepo.findOne({
        where: {
          organizationId,
          provider,
        },
      });

      if (existing) {
        existing.credentials = credentials; // Should be encrypted
        existing.isActive = true;
        await this.credentialsRepo.save(existing);
      } else {
        await this.credentialsRepo.save({
          organizationId,
          provider,
          credentials, // Should be encrypted
          isActive: true,
        });
      }

      // Clear cache for this provider
      const cacheKey = `${provider}-${organizationId}`;
      this.credentialsCache.delete(cacheKey);
      this.providerInstances.delete(cacheKey);
      
      this.logger.log(`Saved credentials for ${provider} in organization ${organizationId}`);
    } catch (error) {
      this.logger.error(`Failed to save credentials: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test provider connectivity
   */
  async testProvider(
    provider: string,
    credentials: any,
    organizationId?: string
  ): Promise<{ success: boolean; message: string; models?: any[] }> {
    try {
      const config: LLMConfig = {
        provider,
        organizationId,
        credentials,
      };
      
      const llmProvider = await this.getProvider(config);
      const models = await llmProvider.listModels();
      
      return {
        success: true,
        message: `Successfully connected to ${provider}`,
        models,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Estimate cost for a request
   */
  estimateCost(
    provider: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Cost per 1K tokens (example pricing, should be updated with actual pricing)
    const pricing: Record<string, Record<string, { prompt: number; completion: number }>> = {
      openai: {
        'gpt-4': { prompt: 0.03, completion: 0.06 },
        'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
        'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
      },
      anthropic: {
        'claude-3-opus': { prompt: 0.015, completion: 0.075 },
        'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
        'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
      },
      bedrock: {
        'claude-v2': { prompt: 0.008, completion: 0.024 },
        'llama2-70b': { prompt: 0.00195, completion: 0.00256 },
      },
      gemini: {
        'gemini-pro': { prompt: 0.0005, completion: 0.0015 },
      },
      ollama: {
        'llama2': { prompt: 0, completion: 0 }, // Local, no cost
        'mistral': { prompt: 0, completion: 0 },
      },
    };

    const providerPricing = pricing[provider];
    if (!providerPricing) {
      return 0;
    }

    const modelPricing = providerPricing[model];
    if (!modelPricing) {
      return 0;
    }

    const promptCost = (promptTokens / 1000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1000) * modelPricing.completion;
    
    return promptCost + completionCost;
  }
}

export default UniversalLLMAdapter;