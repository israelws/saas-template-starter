export interface INodeParam {
  label: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'code' | 'json' | 'file' | 'credential' | 'multiOptions';
  default?: any;
  optional?: boolean;
  options?: Array<{ label: string; name: string; description?: string }>;
  rows?: number;
  placeholder?: string;
  description?: string;
  acceptFormats?: string[];
  credentialNames?: string[];
  show?: {
    [key: string]: string[];
  };
}

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
  inputAnchors?: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
    optional?: boolean;
    list?: boolean;
  }>;
  outputAnchors?: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
  }>;
}

export interface NodeCategory {
  name: string;
  label: string;
  description?: string;
  nodes: INodeData[];
}

// Node Categories
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    name: 'triggers',
    label: 'Triggers',
    description: 'Start points for workflows',
    nodes: [
      {
        id: 'manual-trigger',
        label: 'Manual Trigger',
        name: 'manualTrigger',
        type: 'trigger',
        category: 'triggers',
        version: 1,
        description: 'Manually start a workflow',
        icon: '▶️',
        baseClasses: ['Trigger'],
        outputs: [
          {
            label: 'Output',
            name: 'output',
            type: 'any',
          },
        ],
      },
      {
        id: 'webhook-trigger',
        label: 'Webhook',
        name: 'webhookTrigger',
        type: 'trigger',
        category: 'triggers',
        version: 1,
        description: 'Trigger workflow via webhook',
        icon: '🌐',
        baseClasses: ['Trigger'],
        inputs: [
          {
            label: 'Method',
            name: 'method',
            type: 'options',
            options: [
              { label: 'POST', name: 'POST' },
              { label: 'GET', name: 'GET' },
            ],
            default: 'POST',
          },
          {
            label: 'Path',
            name: 'path',
            type: 'string',
            placeholder: '/webhook/my-workflow',
          },
        ],
        outputs: [
          {
            label: 'Request Data',
            name: 'requestData',
            type: 'json',
          },
        ],
      },
      {
        id: 'schedule-trigger',
        label: 'Schedule',
        name: 'scheduleTrigger',
        type: 'trigger',
        category: 'triggers',
        version: 1,
        description: 'Run workflow on a schedule',
        icon: '⏰',
        baseClasses: ['Trigger'],
        inputs: [
          {
            label: 'Cron Expression',
            name: 'cron',
            type: 'string',
            placeholder: '0 0 * * *',
            description: 'Cron expression for scheduling',
          },
          {
            label: 'Timezone',
            name: 'timezone',
            type: 'string',
            default: 'UTC',
          },
        ],
        outputs: [
          {
            label: 'Timestamp',
            name: 'timestamp',
            type: 'string',
          },
        ],
      },
      {
        id: 'event-trigger',
        label: 'Event Trigger',
        name: 'eventTrigger',
        type: 'trigger',
        category: 'triggers',
        version: 1,
        description: 'Trigger on platform events',
        icon: '⚡',
        baseClasses: ['Trigger'],
        inputs: [
          {
            label: 'Entity Type',
            name: 'entityType',
            type: 'options',
            options: [
              { label: 'Task', name: 'task' },
              { label: 'Order', name: 'order' },
              { label: 'Customer', name: 'customer' },
              { label: 'Product', name: 'product' },
            ],
          },
          {
            label: 'Event',
            name: 'event',
            type: 'options',
            options: [
              { label: 'Created', name: 'created' },
              { label: 'Updated', name: 'updated' },
              { label: 'Deleted', name: 'deleted' },
            ],
          },
        ],
        outputs: [
          {
            label: 'Event Data',
            name: 'eventData',
            type: 'json',
          },
        ],
      },
    ],
  },
  {
    name: 'ai',
    label: 'AI / LLM',
    description: 'AI and Language Model nodes',
    nodes: [
      {
        id: 'openai-chat',
        label: 'OpenAI Chat',
        name: 'openAIChat',
        type: 'llm',
        category: 'ai',
        version: 1,
        description: 'Chat with OpenAI models',
        icon: '🤖',
        baseClasses: ['LLM', 'OpenAI'],
        inputs: [
          {
            label: 'API Key',
            name: 'apiKey',
            type: 'credential',
            credentialNames: ['openAIApi'],
          },
          {
            label: 'Model',
            name: 'model',
            type: 'options',
            options: [
              { label: 'GPT-4', name: 'gpt-4' },
              { label: 'GPT-4 Turbo', name: 'gpt-4-turbo' },
              { label: 'GPT-3.5 Turbo', name: 'gpt-3.5-turbo' },
            ],
            default: 'gpt-3.5-turbo',
          },
          {
            label: 'System Message',
            name: 'systemMessage',
            type: 'string',
            rows: 4,
            optional: true,
          },
          {
            label: 'User Message',
            name: 'userMessage',
            type: 'string',
            rows: 4,
          },
          {
            label: 'Temperature',
            name: 'temperature',
            type: 'number',
            default: 0.7,
            optional: true,
          },
        ],
        inputAnchors: [
          {
            id: 'messages',
            label: 'Messages',
            name: 'messages',
            type: 'ChatMessage[]',
            optional: true,
          },
        ],
        outputs: [
          {
            label: 'Response',
            name: 'response',
            type: 'string',
          },
        ],
        outputAnchors: [
          {
            id: 'output',
            label: 'Output',
            name: 'output',
            type: 'ChatMessage',
          },
        ],
      },
      {
        id: 'text-prompt',
        label: 'Text Prompt',
        name: 'textPrompt',
        type: 'prompt',
        category: 'ai',
        version: 1,
        description: 'Format text with variables',
        icon: '💬',
        baseClasses: ['Prompt'],
        inputs: [
          {
            label: 'Template',
            name: 'template',
            type: 'string',
            rows: 6,
            placeholder: 'Enter your prompt template. Use {{variable}} for variables.',
          },
          {
            label: 'Variables',
            name: 'variables',
            type: 'json',
            optional: true,
            placeholder: '{"name": "John", "age": 30}',
          },
        ],
        inputAnchors: [
          {
            id: 'input',
            label: 'Input',
            name: 'input',
            type: 'any',
            optional: true,
          },
        ],
        outputs: [
          {
            label: 'Formatted Text',
            name: 'formattedText',
            type: 'string',
          },
        ],
      },
    ],
  },
  {
    name: 'logic',
    label: 'Logic',
    description: 'Control flow and logic nodes',
    nodes: [
      {
        id: 'condition',
        label: 'Condition',
        name: 'condition',
        type: 'logic',
        category: 'logic',
        version: 1,
        description: 'Branch based on condition',
        icon: '🔀',
        baseClasses: ['Logic'],
        inputs: [
          {
            label: 'Condition Type',
            name: 'conditionType',
            type: 'options',
            options: [
              { label: 'Equals', name: 'equals' },
              { label: 'Not Equals', name: 'notEquals' },
              { label: 'Contains', name: 'contains' },
              { label: 'Greater Than', name: 'greaterThan' },
              { label: 'Less Than', name: 'lessThan' },
            ],
          },
          {
            label: 'Value 1',
            name: 'value1',
            type: 'string',
          },
          {
            label: 'Value 2',
            name: 'value2',
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
            id: 'true',
            label: 'True',
            name: 'true',
            type: 'any',
          },
          {
            id: 'false',
            label: 'False',
            name: 'false',
            type: 'any',
          },
        ],
      },
      {
        id: 'loop',
        label: 'Loop',
        name: 'loop',
        type: 'logic',
        category: 'logic',
        version: 1,
        description: 'Iterate over items',
        icon: '🔄',
        baseClasses: ['Logic'],
        inputs: [
          {
            label: 'Items',
            name: 'items',
            type: 'json',
            description: 'Array of items to iterate over',
          },
        ],
        inputAnchors: [
          {
            id: 'input',
            label: 'Input',
            name: 'input',
            type: 'any[]',
          },
        ],
        outputAnchors: [
          {
            id: 'item',
            label: 'Item',
            name: 'item',
            type: 'any',
          },
          {
            id: 'done',
            label: 'Done',
            name: 'done',
            type: 'any',
          },
        ],
      },
    ],
  },
  {
    name: 'actions',
    label: 'Actions',
    description: 'Perform actions on platform entities',
    nodes: [
      {
        id: 'create-task',
        label: 'Create Task',
        name: 'createTask',
        type: 'action',
        category: 'actions',
        version: 1,
        description: 'Create a new task',
        icon: '📝',
        baseClasses: ['Action'],
        inputs: [
          {
            label: 'Title',
            name: 'title',
            type: 'string',
          },
          {
            label: 'Description',
            name: 'description',
            type: 'string',
            rows: 3,
            optional: true,
          },
          {
            label: 'Task Type',
            name: 'taskType',
            type: 'string',
            optional: true,
          },
          {
            label: 'Priority',
            name: 'priority',
            type: 'options',
            options: [
              { label: 'Low', name: 'low' },
              { label: 'Medium', name: 'medium' },
              { label: 'High', name: 'high' },
              { label: 'Urgent', name: 'urgent' },
            ],
            default: 'medium',
          },
          {
            label: 'Assignee',
            name: 'assignee',
            type: 'string',
            optional: true,
          },
        ],
        inputAnchors: [
          {
            id: 'taskData',
            label: 'Task Data',
            name: 'taskData',
            type: 'json',
            optional: true,
          },
        ],
        outputAnchors: [
          {
            id: 'task',
            label: 'Created Task',
            name: 'task',
            type: 'Task',
          },
        ],
      },
      {
        id: 'send-email',
        label: 'Send Email',
        name: 'sendEmail',
        type: 'action',
        category: 'actions',
        version: 1,
        description: 'Send an email notification',
        icon: '📧',
        baseClasses: ['Action'],
        inputs: [
          {
            label: 'To',
            name: 'to',
            type: 'string',
            description: 'Recipient email address',
          },
          {
            label: 'Subject',
            name: 'subject',
            type: 'string',
          },
          {
            label: 'Body',
            name: 'body',
            type: 'string',
            rows: 6,
          },
          {
            label: 'CC',
            name: 'cc',
            type: 'string',
            optional: true,
          },
        ],
        outputAnchors: [
          {
            id: 'result',
            label: 'Result',
            name: 'result',
            type: 'boolean',
          },
        ],
      },
      {
        id: 'http-request',
        label: 'HTTP Request',
        name: 'httpRequest',
        type: 'action',
        category: 'actions',
        version: 1,
        description: 'Make an HTTP API call',
        icon: '🌐',
        baseClasses: ['Action'],
        inputs: [
          {
            label: 'Method',
            name: 'method',
            type: 'options',
            options: [
              { label: 'GET', name: 'GET' },
              { label: 'POST', name: 'POST' },
              { label: 'PUT', name: 'PUT' },
              { label: 'DELETE', name: 'DELETE' },
            ],
            default: 'GET',
          },
          {
            label: 'URL',
            name: 'url',
            type: 'string',
            placeholder: 'https://api.example.com/endpoint',
          },
          {
            label: 'Headers',
            name: 'headers',
            type: 'json',
            optional: true,
            placeholder: '{"Content-Type": "application/json"}',
          },
          {
            label: 'Body',
            name: 'body',
            type: 'json',
            optional: true,
            show: {
              method: ['POST', 'PUT'],
            },
          },
        ],
        outputAnchors: [
          {
            id: 'response',
            label: 'Response',
            name: 'response',
            type: 'json',
          },
        ],
      },
    ],
  },
  {
    name: 'data',
    label: 'Data',
    description: 'Data transformation and storage',
    nodes: [
      {
        id: 'transform-data',
        label: 'Transform Data',
        name: 'transformData',
        type: 'data',
        category: 'data',
        version: 1,
        description: 'Transform data using JavaScript',
        icon: '🔄',
        baseClasses: ['Data'],
        inputs: [
          {
            label: 'Code',
            name: 'code',
            type: 'code',
            rows: 10,
            placeholder: '// Access input data via $input\n// Return transformed data\nreturn $input;',
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
      },
      {
        id: 'database-query',
        label: 'Database Query',
        name: 'databaseQuery',
        type: 'data',
        category: 'data',
        version: 1,
        description: 'Query database',
        icon: '💾',
        baseClasses: ['Data'],
        inputs: [
          {
            label: 'Operation',
            name: 'operation',
            type: 'options',
            options: [
              { label: 'Find', name: 'find' },
              { label: 'Find One', name: 'findOne' },
              { label: 'Insert', name: 'insert' },
              { label: 'Update', name: 'update' },
              { label: 'Delete', name: 'delete' },
            ],
          },
          {
            label: 'Entity',
            name: 'entity',
            type: 'options',
            options: [
              { label: 'Tasks', name: 'tasks' },
              { label: 'Orders', name: 'orders' },
              { label: 'Customers', name: 'customers' },
              { label: 'Products', name: 'products' },
            ],
          },
          {
            label: 'Query',
            name: 'query',
            type: 'json',
            placeholder: '{"status": "active"}',
            show: {
              operation: ['find', 'findOne', 'update', 'delete'],
            },
          },
          {
            label: 'Data',
            name: 'data',
            type: 'json',
            show: {
              operation: ['insert', 'update'],
            },
          },
        ],
        outputAnchors: [
          {
            id: 'result',
            label: 'Result',
            name: 'result',
            type: 'any',
          },
        ],
      },
    ],
  },
  {
    name: 'utilities',
    label: 'Utilities',
    description: 'Utility and helper nodes',
    nodes: [
      {
        id: 'delay',
        label: 'Delay',
        name: 'delay',
        type: 'utility',
        category: 'utilities',
        version: 1,
        description: 'Add a delay',
        icon: '⏱️',
        baseClasses: ['Utility'],
        inputs: [
          {
            label: 'Delay (ms)',
            name: 'delay',
            type: 'number',
            default: 1000,
            description: 'Delay in milliseconds',
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
      },
      {
        id: 'log',
        label: 'Log',
        name: 'log',
        type: 'utility',
        category: 'utilities',
        version: 1,
        description: 'Log data for debugging',
        icon: '📋',
        baseClasses: ['Utility'],
        inputs: [
          {
            label: 'Log Level',
            name: 'level',
            type: 'options',
            options: [
              { label: 'Info', name: 'info' },
              { label: 'Warning', name: 'warning' },
              { label: 'Error', name: 'error' },
              { label: 'Debug', name: 'debug' },
            ],
            default: 'info',
          },
          {
            label: 'Message',
            name: 'message',
            type: 'string',
            optional: true,
          },
        ],
        inputAnchors: [
          {
            id: 'data',
            label: 'Data',
            name: 'data',
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
      },
    ],
  },
];

// Helper function to get all nodes flat
export const getAllNodes = (): INodeData[] => {
  return NODE_CATEGORIES.flatMap(category => category.nodes);
};

// Helper function to get node by id
export const getNodeById = (id: string): INodeData | undefined => {
  return getAllNodes().find(node => node.id === id);
};

// Helper function to validate connection
export const isValidConnection = (sourceNode: INodeData, targetNode: INodeData, sourceHandle: string, targetHandle: string): boolean => {
  // Get source output type
  const sourceOutput = sourceNode.outputAnchors?.find(anchor => anchor.id === sourceHandle);
  const targetInput = targetNode.inputAnchors?.find(anchor => anchor.id === targetHandle);
  
  if (!sourceOutput || !targetInput) return false;
  
  // Check if types are compatible
  if (targetInput.type === 'any' || sourceOutput.type === 'any') return true;
  if (sourceOutput.type === targetInput.type) return true;
  
  // Check for base class compatibility
  if (sourceNode.baseClasses && targetNode.baseClasses) {
    return sourceNode.baseClasses.some(baseClass => 
      targetInput.type.includes(baseClass)
    );
  }
  
  return false;
};