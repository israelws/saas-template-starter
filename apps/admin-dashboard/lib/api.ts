import axios from 'axios';
import { store } from '@/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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
  getAll: () => api.get('/organizations'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  getHierarchy: (id: string) => api.get(`/organizations/${id}/hierarchy`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  getMembers: (id: string) => api.get(`/organizations/${id}/members`),
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
    getHierarchy: (id: string) => api.get(`/organizations/hierarchy/${id}`),
    getOrgStats: (id: string) => api.get(`/organizations/hierarchy/${id}/stats`),
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
};

export const policyAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/abac/policies', { 
      params: { 
        ...params, 
        organizationId 
      } 
    });
  },
  getById: (id: string) => api.get(`/abac/policies/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/abac/policies', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/abac/policies/${id}`, data),
  delete: (id: string) => api.delete(`/abac/policies/${id}`),
  test: (context: any) => api.post('/abac/policies/test', context),
  evaluate: (context: any) => api.post('/abac/policies/evaluate', context),
};

export const attributeAPI = {
  getAll: () => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/abac/attributes', { 
      params: { organizationId } 
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
        organizationId 
      } 
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
        organizationId 
      } 
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
        organizationId 
      } 
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
  updateStatus: (id: string, status: string) => 
    api.patch(`/orders/${id}/status`, { status }),
  getItems: (orderId: string) => api.get(`/orders/${orderId}/items`),
  addItem: (orderId: string, item: any) => api.post(`/orders/${orderId}/items`, item),
  updateItem: (orderId: string, itemId: string, data: any) => 
    api.patch(`/orders/${orderId}/items/${itemId}`, data),
  removeItem: (orderId: string, itemId: string) => 
    api.delete(`/orders/${orderId}/items/${itemId}`),
};

export const transactionAPI = {
  getAll: (params?: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.get('/transactions', { 
      params: { 
        ...params, 
        organizationId 
      } 
    });
  },
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => {
    const state = store.getState();
    const organizationId = state.organization.currentOrganization?.id;
    return api.post('/transactions', { ...data, organizationId });
  },
  getByReference: (reference: string) => api.get(`/transactions/reference/${reference}`),
  refund: (id: string, amount?: number) => 
    api.post(`/transactions/${id}/refund`, { amount }),
};
