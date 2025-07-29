import axios from 'axios';
import { store } from '@/store/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors are handled in auth-interceptor.ts

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  validateToken: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

export const organizationAPI = {
  getAll: (params?: any) => api.get('/organizations', { params }),
  getById: (id: string) => api.get(`/organizations/${id}`),
  getHierarchy: (id: string) => api.get(`/organizations/${id}/hierarchy`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  getMembers: (id: string) => api.get(`/organizations/${id}/members`),
  search: (params: { name: string; limit?: number }) => 
    api.get('/organizations/search', { params }),
  // Hierarchy endpoints
  hierarchy: {
    refresh: () => api.post('/organizations/hierarchy/refresh'),
    getRoots: () => api.get('/organizations/hierarchy/roots'),
    getByDepth: (depth: number) => api.get(`/organizations/hierarchy/depth/${depth}`),
    search: (params: {
      q: string;
      type?: string;
      status?: string;
      minDepth?: number;
      maxDepth?: number;
      rootId?: string;
    }) => api.get('/organizations/hierarchy/search', { params }),
    getStats: (ids: string[]) =>
      api.get('/organizations/hierarchy/stats', {
        params: { ids: ids.join(',') },
      }),
    getHierarchy: (id: string) => api.get(`/organizations/${id}/full-hierarchy`),
    getOrgStats: (id: string) => api.get(`/organizations/${id}`), // Use regular getById for now
    getPath: (id: string) => api.get(`/organizations/hierarchy/${id}/path`),
    getSiblings: (id: string) => api.get(`/organizations/hierarchy/${id}/siblings`),
  },
};

export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getUserMemberships: (id: string) => api.get(`/users/${id}/memberships`),
  getMemberships: (id: string) => api.get(`/users/${id}/memberships`),
  addMembership: (userId: string, data: any) => api.post(`/users/${userId}/memberships`, data),
  removeMembership: (userId: string, membershipId: string) =>
    api.delete(`/users/${userId}/memberships/${membershipId}`),
  // Organization membership helpers
  assignToOrganization: (userId: string, organizationId: string, role: string) =>
    api.post(`/users/${userId}/memberships`, { organizationId, role }),
  updateOrganizationRole: (userId: string, organizationId: string, role: string) =>
    api.patch(`/users/${userId}/memberships/${organizationId}`, { role }),
  removeFromOrganization: (userId: string, organizationId: string) =>
    api.delete(`/users/${userId}/memberships/${organizationId}`),
  // Profile management
  updateProfile: (id: string, data: any) => api.patch(`/users/${id}/profile`, data),
  uploadAvatar: (id: string, formData: FormData) =>
    api.post(`/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  // Multi-role management
  getUserRoles: (userId: string, organizationId: string) =>
    api.get(`/users/${userId}/roles`, { params: { organizationId } }),
  assignRole: (
    userId: string,
    organizationId: string,
    data: {
      roleName: string;
      assignedBy: string;
      priority?: number;
      validTo?: string;
    },
  ) => api.post(`/users/${userId}/roles`, { ...data, organizationId }),
  removeRole: (userId: string, organizationId: string, roleName: string) =>
    api.delete(`/users/${userId}/roles/${roleName}`, { params: { organizationId } }),
  updateRolePriority: (
    userId: string,
    organizationId: string,
    roleName: string,
    priority: number,
  ) => api.patch(`/users/${userId}/roles/${roleName}`, { priority, organizationId }),
};

export const policyAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    // Include organizationId for ABAC context
    return api.get('/abac/policies', { 
      params: { ...params, organizationId } 
    });
  },
  getById: (id: string) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get(`/abac/policies/${id}`, { 
      params: { organizationId } 
    });
  },
  create: (data: any) => {
    // Organization ID is optional - can be provided in data if creating org-specific policy
    return api.post('/abac/policies', data);
  },
  update: (id: string, data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.patch(`/abac/policies/${id}`, data, { 
      params: { organizationId } 
    });
  },
  delete: (id: string) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.delete(`/abac/policies/${id}`, { 
      params: { organizationId } 
    });
  },
  test: (context: any) => api.post('/abac/policies/test', context),
  evaluate: (context: any) => api.post('/abac/policies/evaluate', context),
};

export const attributeAPI = {
  getAll: () => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/abac/attributes', {
      params: { organizationId },
    });
  },
  getById: (id: string) => api.get(`/abac/attributes/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/abac/attributes', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.put(`/abac/attributes/${id}`, data),
  delete: (id: string) => api.delete(`/abac/attributes/${id}`),
};

export const productAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/products', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/products', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: (organizationId?: string) => {
    const state = store.getState();
    const orgId = organizationId || state.organization.currentOrganization?.id;
    return api.get('/products/low-stock', { params: { organizationId: orgId } });
  },
  getBySku: (sku: string, organizationId?: string) => {
    const state = store.getState();
    const orgId = organizationId || state.organization.currentOrganization?.id;
    return api.get(`/products/sku/${sku}`, { params: { organizationId: orgId } });
  },
  updateInventory: (id: string, quantity: number, operation?: 'set' | 'add' | 'subtract') =>
    api.post(`/products/${id}/inventory`, { quantity, operation }),
  reserveInventory: (id: string, quantity: number) =>
    api.post(`/products/${id}/inventory/reserve`, { quantity }),
  releaseInventory: (id: string, quantity: number) =>
    api.post(`/products/${id}/inventory/release`, { quantity }),
  bulkUpdateStatus: (ids: string[], status: string) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/products/bulk-status', { ids, status, organizationId });
  },
};

export const customerAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/customers', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/customers', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getByEmail: (email: string) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/customers/by-email', { params: { email, organizationId } });
  },
  getTransactions: (customerId: string, params?: any) =>
    api.get(`/customers/${customerId}/transactions`, { params }),
  getOrders: (customerId: string, params?: any) =>
    api.get(`/customers/${customerId}/orders`, { params }),
};

export const orderAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/orders', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/orders', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/orders/${id}`, data),
  delete: (id: string) => api.delete(`/orders/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  getItems: (orderId: string) => api.get(`/orders/${orderId}/items`),
  addItem: (orderId: string, item: any) => api.post(`/orders/${orderId}/items`, item),
  updateItem: (orderId: string, itemId: string, data: any) =>
    api.patch(`/orders/${orderId}/items/${itemId}`, data),
  removeItem: (orderId: string, itemId: string) => api.delete(`/orders/${orderId}/items/${itemId}`),
};

export const transactionAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/transactions', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/transactions', { ...data, organizationId });
  },
  getByReference: (reference: string) => api.get(`/transactions/reference/${reference}`),
  refund: (id: string, amount?: number) => api.post(`/transactions/${id}/refund`, { amount }),
};

export const insuranceAgentAPI = {
  getAll: (params?: any) => api.get('/insurance/agents', { params }),
  getById: (id: string) => api.get(`/insurance/agents/${id}`),
  getByUserId: (userId: string) => api.get(`/insurance/agents/user/${userId}`),
  create: (data: any) => api.post('/insurance/agents', data),
  update: (id: string, data: any) => api.patch(`/insurance/agents/${id}`, data),
  delete: (id: string) => api.delete(`/insurance/agents/${id}`),
  updateLicenseStatus: (id: string, status: string) =>
    api.patch(`/insurance/agents/${id}/license-status`, { status }),
  updatePerformanceMetrics: (id: string, metrics: any) =>
    api.patch(`/insurance/agents/${id}/performance-metrics`, metrics),
  assignTerritories: (id: string, territoryIds: string[]) =>
    api.post(`/insurance/agents/${id}/territories`, { territoryIds }),
  getByBranch: (branchId: string) => api.get(`/insurance/agents/branch/${branchId}`),
  getExpiringLicenses: () => api.get('/insurance/agents/license/expiring'),
};

export const insuranceBranchAPI = {
  getAll: (params?: any) => api.get('/insurance/branches', { params }),
  getById: (id: string) => api.get(`/insurance/branches/${id}`),
  getByCode: (branchCode: string) => api.get(`/insurance/branches/code/${branchCode}`),
  create: (data: any) => api.post('/insurance/branches', data),
  update: (id: string, data: any) => api.patch(`/insurance/branches/${id}`, data),
  delete: (id: string) => api.delete(`/insurance/branches/${id}`),
  assignManager: (id: string, managerId: string) =>
    api.patch(`/insurance/branches/${id}/manager`, { managerId }),
  updateTerritories: (id: string, territoryIds: string[]) =>
    api.patch(`/insurance/branches/${id}/territories`, { territoryIds }),
  getByAgency: (agencyId: string) => api.get(`/insurance/branches/agency/${agencyId}`),
  getStatistics: (id: string) => api.get(`/insurance/branches/${id}/statistics`),
};

export const territoryAPI = {
  getAll: (params?: any) => api.get('/territories', { params }),
  getById: (id: string) => api.get(`/territories/${id}`),
  getByCode: (code: string) => api.get(`/territories/code/${code}`),
  create: (data: any) => api.post('/territories', data),
  update: (id: string, data: any) => api.patch(`/territories/${id}`, data),
  delete: (id: string) => api.delete(`/territories/${id}`),
  getHierarchy: (rootId?: string) => api.get('/territories/hierarchy', { params: { rootId } }),
  getByIds: (ids: string[]) => api.post('/territories/bulk', { ids }),
};
