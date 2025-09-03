import axios from 'axios';

// Use environment variable for API URL, fallback to localhost:3000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Debug log the API URL being used
console.log('[API Configuration] Using API URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Include cookies in cross-origin requests
});

// Helper function to safely get organization ID without accessing store directly
const getOrganizationId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const orgId = localStorage.getItem('currentOrganizationId');
  if (!orgId) {
    console.warn('[API] No organization ID found in localStorage');
  }
  return orgId;
};

// Setup request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // CRITICAL: Ensure cookie is synced before EVERY API call
    if (token && typeof window !== 'undefined') {
      // Set cookie immediately before request
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000);
      document.cookie = `authToken=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      
      // Debug logging for all API calls
      console.log('[API Request]', {
        url: config.url,
        hasToken: true,
        cookieSet: document.cookie.includes('authToken'),
      });
    }
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add organization context if available
    const orgId = getOrganizationId();
    if (orgId && config.headers) {
      config.headers['X-Organization-Id'] = orgId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Note: Response interceptor for token refresh is set up in auth-interceptor.ts by AuthProvider

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  validateToken: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
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
    const organizationId = getOrganizationId();
    return api.get('/abac/policies', { 
      params: { ...params, organizationId } 
    });
  },
  getById: (id: string) => {
    const organizationId = getOrganizationId();
    return api.get(`/abac/policies/${id}`, { 
      params: { organizationId } 
    });
  },
  create: (data: any) => {
    // Organization ID is optional - can be provided in data if creating org-specific policy
    return api.post('/abac/policies', data);
  },
  update: (id: string, data: any) => {
    const organizationId = getOrganizationId();
    return api.patch(`/abac/policies/${id}`, data, { 
      params: { organizationId } 
    });
  },
  delete: (id: string) => {
    const organizationId = getOrganizationId();
    return api.delete(`/abac/policies/${id}`, { 
      params: { organizationId } 
    });
  },
  test: (context: any) => api.post('/abac/policies/test', context),
  evaluate: (context: any) => api.post('/abac/policies/evaluate', context),
};

export const attributeAPI = {
  getAll: () => {
    const organizationId = getOrganizationId();
    return api.get('/abac/attributes', {
      params: { organizationId },
    });
  },
  getById: (id: string) => api.get(`/abac/attributes/${id}`),
  create: (data: any) => {
    const organizationId = getOrganizationId();
    return api.post('/abac/attributes', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.put(`/abac/attributes/${id}`, data),
  delete: (id: string) => api.delete(`/abac/attributes/${id}`),
};

export const productAPI = {
  getAll: (params?: any) => {
    const organizationId = getOrganizationId();
    return api.get('/products', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => {
    const organizationId = getOrganizationId();
    return api.post('/products', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getLowStock: (organizationId?: string) => {
    const orgId = organizationId || getOrganizationId();
    return api.get('/products/low-stock', { params: { organizationId: orgId } });
  },
  getBySku: (sku: string, organizationId?: string) => {
    const orgId = organizationId || getOrganizationId();
    return api.get(`/products/sku/${sku}`, { params: { organizationId: orgId } });
  },
  updateInventory: (id: string, quantity: number, operation?: 'set' | 'add' | 'subtract') =>
    api.post(`/products/${id}/inventory`, { quantity, operation }),
  reserveInventory: (id: string, quantity: number) =>
    api.post(`/products/${id}/inventory/reserve`, { quantity }),
  releaseInventory: (id: string, quantity: number) =>
    api.post(`/products/${id}/inventory/release`, { quantity }),
  bulkUpdateStatus: (ids: string[], status: string) => {
    const organizationId = getOrganizationId();
    return api.post('/products/bulk-status', { ids, status, organizationId });
  },
};

export const customerAPI = {
  getAll: (params?: any) => {
    const organizationId = getOrganizationId();
    return api.get('/customers', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => {
    const organizationId = getOrganizationId();
    return api.post('/customers', { ...data, organizationId });
  },
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getByEmail: (email: string) => {
    const organizationId = getOrganizationId();
    return api.get('/customers/by-email', { params: { email, organizationId } });
  },
  getTransactions: (customerId: string, params?: any) =>
    api.get(`/customers/${customerId}/transactions`, { params }),
  getOrders: (customerId: string, params?: any) =>
    api.get(`/customers/${customerId}/orders`, { params }),
};

export const orderAPI = {
  getAll: (params?: any) => {
    const organizationId = getOrganizationId();
    return api.get('/orders', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => {
    const organizationId = getOrganizationId();
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
    const organizationId = getOrganizationId();
    return api.get('/transactions', {
      params: {
        ...params,
        organizationId,
      },
    });
  },
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => {
    const organizationId = getOrganizationId();
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

export const workflowAPI = {
  getAll: (params?: any) => api.get('/workflows', { params }),
  getById: (id: string) => api.get(`/workflows/${id}`),
  create: (data: any) => api.post('/workflows', data),
  update: (id: string, data: any) => api.patch(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  execute: (id: string, input: any) => api.post(`/workflows/${id}/execute`, input),
  getExecutions: (workflowId: string) => api.get(`/workflows/${workflowId}/executions`),
  getTemplates: () => api.get('/workflows/templates'),
  duplicate: (id: string, name: string) => api.post(`/workflows/${id}/duplicate`, { name }),
  toggleActive: (id: string, isActive: boolean) => api.patch(`/workflows/${id}/active`, { isActive }),
};
