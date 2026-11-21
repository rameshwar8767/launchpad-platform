import React, { useEffect, useState } from 'react'
import type { User } from '../types'
import type { LoginPayload, RegisterPayload } from '../services/authService'
import { authService } from '../services/authService'
import { AuthContext } from './AuthContextDefinition'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('launchpad_user')
    try {
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('launchpad_access_token')
      if (token) {
        try {
          const res = await authService.getProfile()
          setUser(res.data)
          localStorage.setItem('launchpad_user', JSON.stringify(res.data))
        } catch {
          setUser(null)
          localStorage.removeItem('launchpad_user')
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    verifySession()

    const handleUnauthorized = () => {
      setUser(null)
      localStorage.removeItem('launchpad_user')
    }

    window.addEventListener('launchpad:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('launchpad:unauthorized', handleUnauthorized)
  }, [])

  const login = async (payload: LoginPayload) => {
    const tokens = await authService.login(payload)
    setUser(tokens.user)
  }

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload)
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
