import { apiClient } from './apiClient'
import type { APIResponse, AuthTokens, User } from '../types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    const data = await apiClient.post<AuthTokens>('/auth/login', payload, false)
    apiClient.setSession(data.access_token, data.refresh_token, data.user)
    return data
  },

  async register(payload: RegisterPayload): Promise<APIResponse<User>> {
    return apiClient.post<APIResponse<User>>('/auth/register', payload, false)
  },

  async getProfile(): Promise<APIResponse<User>> {
    return apiClient.get<APIResponse<User>>('/auth/me')
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('launchpad_refresh_token')
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken })
      } catch {
        // Silently clear local session even if remote logout fails
      }
    }
    apiClient.clearTokens()
  },
}
