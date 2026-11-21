import { apiClient } from './apiClient'
import type {
  APIResponse,
  DashboardMetrics,
  PaginatedResponse,
  Task,
  TaskFilterParams,
  TaskPriority,
  TaskStatus,
} from '../types'

export interface TaskCreatePayload {
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date?: string | null
}

export interface TaskUpdatePayload {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
}

export const taskService = {
  async getTasks(params?: TaskFilterParams): Promise<PaginatedResponse<Task>> {
    return apiClient.get<PaginatedResponse<Task>>('/tasks', params as any)
  },

  async getTask(id: number): Promise<APIResponse<Task>> {
    return apiClient.get<APIResponse<Task>>(`/tasks/${id}`)
  },

  async createTask(payload: TaskCreatePayload): Promise<APIResponse<Task>> {
    return apiClient.post<APIResponse<Task>>('/tasks', payload)
  },

  async updateTask(id: number, payload: TaskUpdatePayload): Promise<APIResponse<Task>> {
    return apiClient.put<APIResponse<Task>>(`/tasks/${id}`, payload)
  },

  async updateStatus(id: number, status: TaskStatus): Promise<APIResponse<Task>> {
    return apiClient.patch<APIResponse<Task>>(`/tasks/${id}/status`, { status })
  },

  async updatePriority(id: number, priority: TaskPriority): Promise<APIResponse<Task>> {
    return apiClient.patch<APIResponse<Task>>(`/tasks/${id}/priority`, { priority })
  },

  async deleteTask(id: number): Promise<APIResponse<{ id: number }>> {
    return apiClient.delete<APIResponse<{ id: number }>>(`/tasks/${id}`)
  },

  async getDashboardMetrics(): Promise<APIResponse<DashboardMetrics>> {
    return apiClient.get<APIResponse<DashboardMetrics>>('/dashboard/stats')
  },
}
