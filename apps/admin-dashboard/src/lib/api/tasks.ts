import { api } from '../api';

export interface TaskType {
  id: string;
  name: string;
  description?: string;
  scope: 'system' | 'organization';
  organizationId?: string;
  metadata?: Record<string, any>;
  isActive: boolean;
  icon?: string;
  color?: string;
  lifecycleEvents?: TaskLifecycleEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskLifecycleEvent {
  id: string;
  name: string;
  description?: string;
  taskTypeId: string;
  order: number;
  color?: string;
  icon?: string;
  isFinal: boolean;
  isInitial: boolean;
  allowedTransitions?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  taskTypeId: string;
  taskType?: TaskType;
  assigneeId?: string;
  assignee?: any;
  createdById: string;
  createdBy?: any;
  organizationId: string;
  organization?: any;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  currentLifecycleEventId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
  tags: string[];
  parentTaskId?: string;
  parentTask?: Task;
  subTasks?: Task[];
  history?: TaskHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  action: string;
  description?: string;
  fromStatus?: string;
  toStatus?: string;
  fromLifecycleEventId?: string;
  toLifecycleEventId?: string;
  userId: string;
  user?: any;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  taskTypeId: string;
  assigneeId?: string;
  organizationId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  tags?: string[];
  parentTaskId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  currentLifecycleEventId?: string;
}

export interface CreateTaskTypeDto {
  name: string;
  description?: string;
  scope?: 'system' | 'organization';
  organizationId?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateLifecycleEventDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isFinal?: boolean;
  isInitial?: boolean;
  allowedTransitions?: string[];
  metadata?: Record<string, any>;
}

export interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
}

export const tasksApi = {
  // Task endpoints
  getTasks: async (filters?: {
    organizationId?: string;
    assigneeId?: string;
    status?: Task['status'];
    taskTypeId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  getMyTasks: async (organizationId?: string) => {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    const response = await api.get(`/tasks/my-tasks${params}`);
    return response.data;
  },

  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: CreateTaskDto) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskDto) => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  assignTask: async (taskId: string, assigneeId: string) => {
    const response = await api.post(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  },

  updateTaskLifecycle: async (taskId: string, lifecycleEventId: string) => {
    const response = await api.post(`/tasks/${taskId}/lifecycle`, { lifecycleEventId });
    return response.data;
  },

  getTaskHistory: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  },

  getTaskStats: async (organizationId: string) => {
    const response = await api.get(`/tasks/stats/${organizationId}`);
    return response.data;
  },

  // Task Type endpoints
  getTaskTypes: async (organizationId?: string) => {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    const response = await api.get(`/task-types${params}`);
    return response.data;
  },

  getTaskType: async (id: string) => {
    const response = await api.get(`/task-types/${id}`);
    return response.data;
  },

  createTaskType: async (data: CreateTaskTypeDto) => {
    const response = await api.post('/task-types', data);
    return response.data;
  },

  updateTaskType: async (id: string, data: Partial<CreateTaskTypeDto>) => {
    const response = await api.patch(`/task-types/${id}`, data);
    return response.data;
  },

  deleteTaskType: async (id: string) => {
    const response = await api.delete(`/task-types/${id}`);
    return response.data;
  },

  duplicateTaskType: async (id: string, organizationId: string, name: string) => {
    const response = await api.post(`/task-types/${id}/duplicate`, {
      organizationId,
      name,
    });
    return response.data;
  },

  // Lifecycle Event endpoints
  getLifecycleEvents: async (taskTypeId: string) => {
    const response = await api.get(`/task-types/${taskTypeId}/lifecycle-events`);
    return response.data;
  },

  createLifecycleEvent: async (taskTypeId: string, data: CreateLifecycleEventDto) => {
    const response = await api.post(`/task-types/${taskTypeId}/lifecycle-events`, data);
    return response.data;
  },

  updateLifecycleEvent: async (id: string, data: Partial<CreateLifecycleEventDto>) => {
    const response = await api.patch(`/task-types/lifecycle-events/${id}`, data);
    return response.data;
  },

  deleteLifecycleEvent: async (id: string) => {
    const response = await api.delete(`/task-types/lifecycle-events/${id}`);
    return response.data;
  },

  reorderLifecycleEvents: async (taskTypeId: string, eventIds: string[]) => {
    const response = await api.post(`/task-types/${taskTypeId}/lifecycle-events/reorder`, {
      eventIds,
    });
    return response.data;
  },
};