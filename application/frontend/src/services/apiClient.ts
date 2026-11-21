const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export class APIError extends Error {
  code: string
  status: number
  details?: unknown[]

  constructor(message: string, status: number, code: string = 'UNKNOWN_ERROR', details?: unknown[]) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
  }
}

class APIClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('launchpad_access_token')
  }

  private setAccessToken(token: string): void {
    localStorage.setItem('launchpad_access_token', token)
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('launchpad_refresh_token')
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('launchpad_refresh_token', token)
  }

  public clearTokens(): void {
    localStorage.removeItem('launchpad_access_token')
    localStorage.removeItem('launchpad_refresh_token')
    localStorage.removeItem('launchpad_user')
  }

  public setSession(accessToken: string, refreshToken: string, user: unknown): void {
    this.setAccessToken(accessToken)
    this.setRefreshToken(refreshToken)
    localStorage.setItem('launchpad_user', JSON.stringify(user))
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return null

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const data = await response.json()
      const newAccessToken = data.access_token
      this.setAccessToken(newAccessToken)
      return newAccessToken
    } catch {
      this.clearTokens()
      return null
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${window.location.origin}${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    )

    const headers = new Headers(options.headers || {})
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    if (requiresAuth) {
      let token = this.getAccessToken()
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    let response = await fetch(url.toString(), {
      ...options,
      headers,
    })

    // If 401 Unauthorized, attempt token refresh once
    if (response.status === 401 && requiresAuth) {
      const newToken = await this.tryRefreshToken()
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`)
        response = await fetch(url.toString(), {
          ...options,
          headers,
        })
      } else {
        // Dispatched session expiry event for UI listeners
        window.dispatchEvent(new CustomEvent('launchpad:unauthorized'))
      }
    }

    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: { message: response.statusText, code: 'HTTP_ERROR' } }
      }

      const errorDetail = errorData?.error || {}
      throw new APIError(
        errorDetail.message || 'An unexpected error occurred',
        response.status,
        errorDetail.code || 'UNKNOWN_ERROR',
        errorDetail.details
      )
    }

    return response.json() as Promise<T>
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>, requiresAuth = true): Promise<T> {
    let path = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        path += (path.includes('?') ? '&' : '?') + queryString
      }
    }
    return this.request<T>(path, { method: 'GET' }, requiresAuth)
  }

  post<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      requiresAuth
    )
  }

  put<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      requiresAuth
    )
  }

  patch<T>(endpoint: string, body?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      requiresAuth
    )
  }

  delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, requiresAuth)
  }
}

export const apiClient = new APIClient()
