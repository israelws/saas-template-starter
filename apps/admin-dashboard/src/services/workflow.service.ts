import { apiClient } from '@/lib/api-client';

export interface Workflow {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  triggerType: 'manual' | 'event' | 'scheduled' | 'api';
  entityType?: string;
  flowDefinition: {
    nodes: any[];
    edges: any[];
  };
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  isActive: boolean;
  isTemplate: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  triggerType: 'manual' | 'event' | 'scheduled' | 'api';
  entityType?: string;
  flowDefinition: {
    nodes: any[];
    edges: any[];
  };
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface ExecuteWorkflowDto {
  inputData?: Record<string, any>;
  triggerEntityType?: string;
  triggerEntityId?: string;
  triggerEvent?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  errorMessage?: string;
  executionLog: any[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

class WorkflowService {
  async getAll(): Promise<Workflow[]> {
    return apiClient.get('/workflows');
  }

  async getById(id: string): Promise<Workflow> {
    return apiClient.get(`/workflows/${id}`);
  }

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    return apiClient.post('/workflows', data);
  }

  async update(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow> {
    return apiClient.put(`/workflows/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/workflows/${id}`);
  }

  async toggleActive(id: string): Promise<Workflow> {
    return apiClient.post(`/workflows/${id}/toggle-active`);
  }

  async execute(id: string, data: ExecuteWorkflowDto): Promise<WorkflowExecution> {
    return apiClient.post(`/workflows/${id}/execute`, data);
  }

  async getExecutions(workflowId: string, limit?: number): Promise<WorkflowExecution[]> {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/workflows/${workflowId}/executions${params}`);
  }

  async getStatistics(workflowId: string): Promise<any> {
    return apiClient.get(`/workflows/${workflowId}/statistics`);
  }

  async cancelExecution(executionId: string): Promise<WorkflowExecution> {
    return apiClient.post(`/workflows/executions/${executionId}/cancel`);
  }

  async getTemplates(): Promise<Workflow[]> {
    return apiClient.get('/workflows/templates');
  }

  async cloneFromTemplate(templateId: string): Promise<Workflow> {
    return apiClient.post(`/workflows/templates/${templateId}/clone`);
  }

  async createBinding(workflowId: string, bindingData: {
    entityType: string;
    eventName: string;
    entityId?: string;
    condition?: Record<string, any>;
  }): Promise<any> {
    return apiClient.post(`/workflows/${workflowId}/bindings`, bindingData);
  }
}

export const workflowService = new WorkflowService();