export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: number
  user_id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total_records: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: PaginationMeta
}

export interface APIResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  todo_tasks: number
  blocked_tasks: number
  overdue_tasks: number
}

export interface DashboardMetrics {
  stats: DashboardStats
  priority_distribution: Record<TaskPriority, number>
  status_distribution: Record<TaskStatus, number>
  recent_tasks: Task[]
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface TaskFilterParams {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  overdue_only?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}
