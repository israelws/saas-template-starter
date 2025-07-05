import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { store } from '@/store'
import { loginSuccess, logout } from '@/store/slices/authSlice'
import { authAPI } from './api'

interface FailedRequest {
  resolve: (token: string | null) => void
  reject: (error: any) => void
}

let isRefreshing = false
let failedQueue: FailedRequest[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

export const setupAuthInterceptor = () => {
  // Request interceptor to add auth token
  axios.interceptors.request.use(
    (config) => {
      const state = store.getState()
      const token = state.auth.token
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // Add organization context if available
      const currentOrg = state.organization.currentOrganization
      if (currentOrg && config.headers) {
        config.headers['X-Organization-Id'] = currentOrg.id
      }
      
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor to handle token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return axios(originalRequest)
          }).catch((err) => {
            return Promise.reject(err)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) {
          store.dispatch(logout())
          window.location.href = '/login'
          return Promise.reject(error)
        }

        try {
          const response = await authAPI.refreshToken(refreshToken)
          const { accessToken } = response.data

          // Update token in store
          const state = store.getState()
          store.dispatch(loginSuccess({ 
            user: state.auth.user!, 
            token: accessToken 
          }))

          // Process queued requests
          processQueue(null, accessToken)
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          
          return axios(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          store.dispatch(logout())
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      return Promise.reject(error)
    }
  )
}