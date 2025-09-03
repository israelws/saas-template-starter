import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolContext {
  organizationId: string;
  workflowId: string;
  executionId: string;
  variables?: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface ITool {
  name: string;
  description: string;
  category: 'api' | 'database' | 'mcp' | 'custom' | 'utility';
  execute(input: any, context?: ToolContext): Promise<any>;
  getSchema(): ToolSchema;
  validate?(input: any): boolean;
}

export interface APIToolConfig {
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apiKey' | 'oauth2';
    config?: any;
  };
  inputSchema?: ToolSchema['parameters'];
  outputSchema?: any;
}

export interface DatabaseToolConfig {
  name: string;
  description: string;
  connectionString?: string;
  query: string;
  parameters?: string[];
  database?: 'postgres' | 'mysql' | 'mongodb' | 'redis';
}

export interface MCPToolConfig {
  serverUrl: string;
  toolName: string;
  description?: string;
}

export interface CustomToolConfig {
  name: string;
  description: string;
  handler: (input: any, context?: ToolContext) => Promise<any>;
  schema?: ToolSchema['parameters'];
}

@Injectable()
export class ToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private tools: Map<string, ITool> = new Map();
  private toolConfigs: Map<string, any> = new Map();

  constructor(
    private httpService: HttpService,
    @InjectRepository('WorkflowTool')
    private toolRepo: Repository<any>,
  ) {
    this.initializeDefaultTools();
  }

  private async initializeDefaultTools() {
    // Register some default utility tools
    this.registerUtilityTools();
    this.logger.log('Tool Registry initialized with default tools');
  }

  /**
   * Register a new tool
   */
  registerTool(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Tool ${tool.name} is already registered. Overwriting.`);
    }
    
    this.tools.set(tool.name, tool);
    this.logger.log(`Registered tool: ${tool.name} (${tool.category})`);
  }

  /**
   * Get tools by names
   */
  async getTools(toolNames: string[], context?: ToolContext): Promise<ITool[]> {
    const tools: ITool[] = [];
    
    for (const name of toolNames) {
      // Check if tool is already registered
      let tool = this.tools.get(name);
      
      // If not found, try to load from database
      if (!tool && context?.organizationId) {
        tool = await this.loadToolFromDatabase(name, context.organizationId);
      }
      
      if (tool) {
        tools.push(tool);
      } else {
        this.logger.warn(`Tool ${name} not found`);
      }
    }
    
    return tools;
  }

  /**
   * Register an API tool
   */
  registerAPITool(config: APIToolConfig): ITool {
    const tool: ITool = {
      name: config.name,
      description: config.description,
      category: 'api',
      
      async execute(input: any, context?: ToolContext): Promise<any> {
        try {
          // Build request configuration
          const requestConfig: any = {
            url: config.url,
            method: config.method,
            headers: config.headers || {},
            params: config.params || {},
          };
          
          // Handle authentication
          if (config.authentication) {
            this.applyAuthentication(requestConfig, config.authentication, context);
          }
          
          // Handle request body
          if (config.method !== 'GET' && config.body) {
            requestConfig.data = this.processTemplate(config.body, input);
          }
          
          // Process URL parameters
          if (input && config.inputSchema) {
            requestConfig.params = { ...requestConfig.params, ...input };
          }
          
          // Make HTTP request
          const response = await firstValueFrom(
            this.httpService.request(requestConfig)
          );
          
          return response.data;
        } catch (error) {
          throw new Error(`API tool ${config.name} failed: ${error.message}`);
        }
      },
      
      getSchema(): ToolSchema {
        return {
          name: config.name,
          description: config.description,
          parameters: config.inputSchema || {
            type: 'object',
            properties: {},
          },
        };
      },
    };
    
    this.registerTool(tool);
    this.toolConfigs.set(config.name, config);
    return tool;
  }

  /**
   * Register a database tool
   */
  registerDatabaseTool(config: DatabaseToolConfig): ITool {
    const tool: ITool = {
      name: config.name,
      description: config.description,
      category: 'database',
      
      async execute(input: any, context?: ToolContext): Promise<any> {
        try {
          // Get database connection
          const connection = await this.getDatabaseConnection(config, context);
          
          // Process query with parameters
          let query = config.query;
          const params: any[] = [];
          
          if (config.parameters && input) {
            for (const param of config.parameters) {
              if (param in input) {
                params.push(input[param]);
                query = query.replace(`{{${param}}}`, '?');
              }
            }
          }
          
          // Execute query
          const result = await connection.query(query, params);
          
          return result;
        } catch (error) {
          throw new Error(`Database tool ${config.name} failed: ${error.message}`);
        }
      },
      
      getSchema(): ToolSchema {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        
        if (config.parameters) {
          for (const param of config.parameters) {
            properties[param] = { type: 'string' };
            required.push(param);
          }
        }
        
        return {
          name: config.name,
          description: config.description,
          parameters: {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
          },
        };
      },
    };
    
    this.registerTool(tool);
    this.toolConfigs.set(config.name, config);
    return tool;
  }

  /**
   * Register an MCP (Model Context Protocol) tool
   */
  registerMCPTool(config: MCPToolConfig): ITool {
    const tool: ITool = {
      name: config.toolName,
      description: config.description || `MCP tool: ${config.toolName}`,
      category: 'mcp',
      
      async execute(input: any, context?: ToolContext): Promise<any> {
        try {
          // Connect to MCP server
          const response = await firstValueFrom(
            this.httpService.post(`${config.serverUrl}/execute`, {
              tool: config.toolName,
              input,
              context,
            })
          );
          
          return response.data;
        } catch (error) {
          throw new Error(`MCP tool ${config.toolName} failed: ${error.message}`);
        }
      },
      
      getSchema(): ToolSchema {
        // Fetch schema from MCP server
        // For now, return a generic schema
        return {
          name: config.toolName,
          description: config.description || `MCP tool: ${config.toolName}`,
          parameters: {
            type: 'object',
            properties: {
              input: { type: 'string' },
            },
          },
        };
      },
    };
    
    this.registerTool(tool);
    this.toolConfigs.set(config.toolName, config);
    return tool;
  }

  /**
   * Register a custom tool
   */
  registerCustomTool(config: CustomToolConfig): ITool {
    const tool: ITool = {
      name: config.name,
      description: config.description,
      category: 'custom',
      
      async execute(input: any, context?: ToolContext): Promise<any> {
        try {
          return await config.handler(input, context);
        } catch (error) {
          throw new Error(`Custom tool ${config.name} failed: ${error.message}`);
        }
      },
      
      getSchema(): ToolSchema {
        return {
          name: config.name,
          description: config.description,
          parameters: config.schema || {
            type: 'object',
            properties: {},
          },
        };
      },
    };
    
    this.registerTool(tool);
    this.toolConfigs.set(config.name, config);
    return tool;
  }

  /**
   * Register default utility tools
   */
  private registerUtilityTools() {
    // Calculator tool
    this.registerCustomTool({
      name: 'calculator',
      description: 'Perform mathematical calculations',
      handler: async (input: { expression: string }) => {
        try {
          // Simple eval for math expressions (be careful in production)
          const result = Function('"use strict"; return (' + input.expression + ')')();
          return { result };
        } catch (error) {
          throw new Error(`Invalid expression: ${input.expression}`);
        }
      },
      schema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate',
          },
        },
        required: ['expression'],
      },
    });

    // String manipulation tool
    this.registerCustomTool({
      name: 'string_manipulator',
      description: 'Manipulate strings (uppercase, lowercase, reverse, etc.)',
      handler: async (input: { text: string; operation: string }) => {
        const { text, operation } = input;
        switch (operation) {
          case 'uppercase':
            return { result: text.toUpperCase() };
          case 'lowercase':
            return { result: text.toLowerCase() };
          case 'reverse':
            return { result: text.split('').reverse().join('') };
          case 'length':
            return { result: text.length };
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      },
      schema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['uppercase', 'lowercase', 'reverse', 'length'],
          },
        },
        required: ['text', 'operation'],
      },
    });

    // Date/time tool
    this.registerCustomTool({
      name: 'datetime',
      description: 'Get current date and time in various formats',
      handler: async (input: { format?: string; timezone?: string }) => {
        const now = new Date();
        const format = input.format || 'ISO';
        
        switch (format) {
          case 'ISO':
            return { result: now.toISOString() };
          case 'date':
            return { result: now.toDateString() };
          case 'time':
            return { result: now.toTimeString() };
          case 'timestamp':
            return { result: now.getTime() };
          default:
            return { result: now.toString() };
        }
      },
      schema: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['ISO', 'date', 'time', 'timestamp', 'string'],
          },
          timezone: { type: 'string' },
        },
      },
    });

    // JSON parser tool
    this.registerCustomTool({
      name: 'json_parser',
      description: 'Parse JSON strings or stringify objects',
      handler: async (input: { data: any; operation: 'parse' | 'stringify' }) => {
        try {
          if (input.operation === 'parse') {
            return { result: JSON.parse(input.data) };
          } else {
            return { result: JSON.stringify(input.data, null, 2) };
          }
        } catch (error) {
          throw new Error(`JSON operation failed: ${error.message}`);
        }
      },
      schema: {
        type: 'object',
        properties: {
          data: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['parse', 'stringify'],
          },
        },
        required: ['data', 'operation'],
      },
    });
  }

  /**
   * Load tool from database
   */
  private async loadToolFromDatabase(name: string, organizationId: string): Promise<ITool | null> {
    try {
      const toolConfig = await this.toolRepo.findOne({
        where: {
          name,
          organizationId,
          isActive: true,
        },
      });
      
      if (!toolConfig) {
        return null;
      }
      
      // Create tool based on stored configuration
      switch (toolConfig.type) {
        case 'api':
          return this.registerAPITool(toolConfig.configuration);
        case 'database':
          return this.registerDatabaseTool(toolConfig.configuration);
        case 'mcp':
          return this.registerMCPTool(toolConfig.configuration);
        case 'custom':
          // For custom tools, we need to reconstruct the handler
          // This is tricky and might require storing the handler as code
          return null;
        default:
          return null;
      }
    } catch (error) {
      this.logger.error(`Failed to load tool from database: ${error.message}`);
      return null;
    }
  }

  /**
   * Apply authentication to request config
   */
  private applyAuthentication(
    requestConfig: any,
    auth: APIToolConfig['authentication'],
    context?: ToolContext
  ) {
    if (!auth || auth.type === 'none') {
      return;
    }
    
    switch (auth.type) {
      case 'bearer':
        const token = auth.config?.token || context?.credentials?.token;
        if (token) {
          requestConfig.headers['Authorization'] = `Bearer ${token}`;
        }
        break;
      case 'apiKey':
        const apiKey = auth.config?.apiKey || context?.credentials?.apiKey;
        const header = auth.config?.header || 'X-API-Key';
        if (apiKey) {
          requestConfig.headers[header] = apiKey;
        }
        break;
      case 'basic':
        const username = auth.config?.username || context?.credentials?.username;
        const password = auth.config?.password || context?.credentials?.password;
        if (username && password) {
          const encoded = Buffer.from(`${username}:${password}`).toString('base64');
          requestConfig.headers['Authorization'] = `Basic ${encoded}`;
        }
        break;
    }
  }

  /**
   * Process template strings
   */
  private processTemplate(template: any, data: any): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let current = data;
        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            return match;
          }
        }
        return current;
      });
    }
    
    if (typeof template === 'object' && template !== null) {
      const processed: any = Array.isArray(template) ? [] : {};
      for (const key in template) {
        processed[key] = this.processTemplate(template[key], data);
      }
      return processed;
    }
    
    return template;
  }

  /**
   * Get database connection (placeholder)
   */
  private async getDatabaseConnection(config: DatabaseToolConfig, context?: ToolContext): Promise<any> {
    // This should be implemented based on your database setup
    // For now, returning a mock connection
    return {
      query: async (query: string, params: any[]) => {
        this.logger.log(`Would execute query: ${query} with params: ${params}`);
        return { rows: [], rowCount: 0 };
      },
    };
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Remove tool
   */
  removeTool(name: string): boolean {
    this.toolConfigs.delete(name);
    return this.tools.delete(name);
  }

  /**
   * Save tool configuration to database
   */
  async saveToolToDatabase(
    organizationId: string,
    name: string,
    type: string,
    configuration: any
  ): Promise<void> {
    try {
      const existing = await this.toolRepo.findOne({
        where: { organizationId, name },
      });
      
      if (existing) {
        existing.type = type;
        existing.configuration = configuration;
        existing.isActive = true;
        await this.toolRepo.save(existing);
      } else {
        await this.toolRepo.save({
          organizationId,
          name,
          type,
          configuration,
          schema: this.generateSchemaFromConfig(type, configuration),
          isActive: true,
        });
      }
      
      this.logger.log(`Saved tool ${name} for organization ${organizationId}`);
    } catch (error) {
      this.logger.error(`Failed to save tool: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate schema from tool configuration
   */
  private generateSchemaFromConfig(type: string, config: any): any {
    // Generate schema based on tool type and configuration
    // This is a simplified version
    return {
      type: 'object',
      properties: {},
    };
  }
}

export default ToolRegistry;