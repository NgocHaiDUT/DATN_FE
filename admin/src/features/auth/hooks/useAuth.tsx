import React, { createContext, useContext, useEffect, useState } from 'react'
import { LoginUseCase, VerifyDeviceUseCase } from '../usecases/LoginUseCase'
import type { ApiUser } from '../data/api/authApi'
import { authApi } from '../data/api/authApi'

type User = {
  id: string
  name: string
  email: string
  role?: string
  avatarUrl?: string
  phone?: string
  firstLogin?: boolean
  isActive?: boolean
} | null

interface AuthContextValue {
  user: User
  token: string | null
  requiresPasswordChange: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  verifyDevice: (email: string, deviceId: string, otp: string) => Promise<void>
  logout: (allDevices?: boolean) => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null)
  const [token, setToken] = useState<string | null>(null) // Memory only!
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-restore session on mount using refresh token
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true)
      try {
        // Check if we have a refresh token
        if (!authApi.hasRefreshToken()) {
          setIsLoading(false)
          return
        }

        // Try to get new access token
        const refreshed = await authApi.refreshAccessToken()
        if (!refreshed || !refreshed.access_token) {
          // Refresh token invalid or expired - clear auth data
          authApi.clearAuthData()
          setIsLoading(false)
          return
        }

        // Fetch user profile
        const me = await authApi.getMe(refreshed.access_token)
        if (!me) {
          // User info fetch failed - but keep the token, will retry on next API call
          setToken(refreshed.access_token)
          setIsLoading(false)
          return
        }

        // Restore session in memory and localStorage
        const normalizedUser = mapApiUserToUser(me, me?.email || 'admin@example.com')
        localStorage.setItem('access_token', refreshed.access_token)
        setToken(refreshed.access_token)
        setUser(normalizedUser)
        setRequiresPasswordChange(Boolean(me.firstlogin))
      } catch (error: any) {
        // Only clear auth data if it's an authentication error (not network error)
        if (error?.message === 'REFRESH_FAILED') {
          authApi.clearAuthData()
          setToken(null)
          setUser(null)
          setRequiresPasswordChange(false)
        }
        // For other errors (network, etc), keep refresh token and try again later
        console.error('Session restore failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await LoginUseCase(email, password)

    // Device verification step required
    if (!res.success && (res as any).code === 'DEVICE_VERIFICATION_REQUIRED') {
      const err: any = new Error('DEVICE_VERIFICATION_REQUIRED')
      err.code = 'DEVICE_VERIFICATION_REQUIRED'
      err.deviceId = (res as any).device_id
      err.email = email
      throw err
    }

    if (!res.success) {
      throw new Error(res.message || 'Login failed')
    }

    if (!res.access_token) {
      throw new Error('Invalid response from authentication server')
    }
    // Fetch user profile using access token for authoritative role and info
    const me = await authApi.getMe(res.access_token)
    const normalizedUser = mapApiUserToUser(me ?? undefined, email)

    // Store access token in localStorage for API calls
    localStorage.setItem('access_token', res.access_token)
    setToken(res.access_token)
    setUser(normalizedUser)
    setRequiresPasswordChange(Boolean(res.requiresPasswordChange))
    // Note: refresh_token is already stored by authApi.login
  }

  const verifyDevice = async (email: string, deviceId: string, otp: string) => {
    const res = await VerifyDeviceUseCase(email, deviceId, otp)

    // Fetch user after verification succeeds
    const me = await authApi.getMe(res.access_token)
    const normalizedUser = mapApiUserToUser(me ?? undefined, email)

    // Store access token in localStorage for API calls
    localStorage.setItem('access_token', res.access_token)
    setToken(res.access_token)
    setUser(normalizedUser)
    setRequiresPasswordChange(false)
    // Note: refresh_token is already stored by authApi.verifyDevice
  }

  const logout = async (allDevices: boolean = false) => {
    try {
      await authApi.logout(allDevices)
    } catch {
      // Ignore logout errors
    } finally {
      // Clear memory state and localStorage
      localStorage.removeItem('access_token')
      setToken(null)
      setUser(null)
      setRequiresPasswordChange(false)
      authApi.clearAuthData()
    }
  }

  const refreshSession = async (): Promise<boolean> => {
    try {
      const refreshed = await authApi.refreshAccessToken()
      if (!refreshed || !refreshed.access_token) {
        return false
      }

      setToken(refreshed.access_token)
      return true
    } catch {
      // Refresh failed
      setToken(null)
      setUser(null)
      authApi.clearAuthData()
      return false
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      requiresPasswordChange,
      isLoading,
      login,
      verifyDevice,
      logout,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  )
}

const mapApiUserToUser = (apiUser: ApiUser | undefined, fallbackEmail: string): NonNullable<User> => {
  const safeEmail = apiUser?.email ?? fallbackEmail ?? 'admin@example.com'
  const safeName = apiUser?.full_name ?? (safeEmail ? safeEmail.split('@')[0] : 'Administrator')

  return {
    id: String(apiUser?.id ?? 'self'),
    name: safeName,
    email: safeEmail,
    role: apiUser?.role?.name,
    avatarUrl: apiUser?.avatar_url || undefined,
    phone: apiUser?.phone || undefined,
    firstLogin: apiUser?.firstlogin,
    isActive: apiUser?.is_active,
  }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthContext };
