import { workflowAPI } from '@/lib/api';

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
    // Get organizationId from localStorage
    const organizationId = localStorage.getItem('currentOrganizationId');
    if (!organizationId) {
      console.warn('No organization selected, returning empty workflow list');
      return [];
    }
    
    const response = await workflowAPI.getAll({ organizationId });
    return response.data || [];
  }

  async getById(id: string): Promise<Workflow> {
    const response = await workflowAPI.getById(id);
    return response.data;
  }

  async create(data: CreateWorkflowDto): Promise<Workflow> {
    // Get organizationId from localStorage
    const organizationId = localStorage.getItem('currentOrganizationId');
    if (!organizationId) {
      throw new Error('No organization selected');
    }
    
    // Add organizationId to the workflow data
    const workflowData = {
      ...data,
      organizationId,
    };
    
    const response = await workflowAPI.create(workflowData);
    return response.data;
  }

  async update(id: string, data: Partial<CreateWorkflowDto>): Promise<Workflow> {
    const response = await workflowAPI.update(id, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await workflowAPI.delete(id);
  }

  async toggleActive(id: string): Promise<Workflow> {
    // Use the direct API call for toggle-active endpoint
    const { api } = await import('@/lib/api');
    const response = await api.post(`/workflows/${id}/toggle-active`);
    return response.data;
  }

  async execute(id: string, data: ExecuteWorkflowDto): Promise<WorkflowExecution> {
    const response = await workflowAPI.execute(id, data);
    return response.data;
  }

  async getExecutions(workflowId: string, limit?: number): Promise<WorkflowExecution[]> {
    const response = await workflowAPI.getExecutions(workflowId);
    return response.data || [];
  }

  async getStatistics(workflowId: string): Promise<any> {
    // Not implemented in workflowAPI, need to add it
    const response = await workflowAPI.getExecutions(workflowId);
    return response.data;
  }

  async cancelExecution(executionId: string): Promise<WorkflowExecution> {
    // Not directly available in workflowAPI, will use direct API call
    const { api } = await import('@/lib/api');
    const response = await api.post(`/workflows/executions/${executionId}/cancel`);
    return response.data;
  }

  async getTemplates(): Promise<Workflow[]> {
    const response = await workflowAPI.getTemplates();
    return response.data || [];
  }

  async cloneFromTemplate(templateId: string): Promise<Workflow> {
    // Use duplicate with a generated name
    const templateName = `Cloned Workflow ${new Date().toISOString()}`;
    const response = await workflowAPI.duplicate(templateId, templateName);
    return response.data;
  }

  async createBinding(workflowId: string, bindingData: {
    entityType: string;
    eventName: string;
    entityId?: string;
    condition?: Record<string, any>;
  }): Promise<any> {
    // Not directly available in workflowAPI, will use direct API call
    const { api } = await import('@/lib/api');
    const response = await api.post(`/workflows/${workflowId}/bindings`, bindingData);
    return response.data;
  }
}

export const workflowService = new WorkflowService();