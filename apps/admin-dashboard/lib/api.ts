import axios from 'axios'
import { store } from '@/store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      store.dispatch({ type: 'auth/logout' })
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
}

export const organizationAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  getHierarchy: (id: string) => api.get(`/organizations/${id}/hierarchy`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  getMembers: (id: string) => api.get(`/organizations/${id}/members`),
}

export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  getMemberships: (id: string) => api.get(`/users/${id}/memberships`),
  addMembership: (userId: string, data: any) =>
    api.post(`/users/${userId}/memberships`, data),
  removeMembership: (userId: string, membershipId: string) =>
    api.delete(`/users/${userId}/memberships/${membershipId}`),
}

export const policyAPI = {
  getAll: (params?: any) => api.get('/abac/policies', { params }),
  getById: (id: string) => api.get(`/abac/policies/${id}`),
  create: (data: any) => api.post('/abac/policies', data),
  update: (id: string, data: any) => api.patch(`/abac/policies/${id}`, data),
  delete: (id: string) => api.delete(`/abac/policies/${id}`),
  test: (context: any) => api.post('/abac/policies/test', context),
  evaluate: (context: any) => api.post('/abac/policies/evaluate', context),
}

export const attributeAPI = {
  getAll: () => api.get('/abac/attributes'),
  getById: (id: string) => api.get(`/abac/attributes/${id}`),
  create: (data: any) => api.post('/abac/attributes', data),
  update: (id: string, data: any) => api.patch(`/abac/attributes/${id}`, data),
  delete: (id: string) => api.delete(`/abac/attributes/${id}`),
}