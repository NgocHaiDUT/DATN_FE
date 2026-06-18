const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const LOGIN_ENDPOINT = '/auth/admin/login'
const VERIFY_DEVICE_ENDPOINT = '/auth/verify-device'
const ME_ENDPOINT = '/auth/me'
const REFRESH_ENDPOINT = '/auth/refresh-token'
const LOGOUT_ENDPOINT = '/auth/logout'

export interface ApiRole {
  name: string
}

export interface ApiUser {
  id: number | string
  email: string
  password_hash?: string
  full_name?: string
  avatar_url?: string
  phone?: string
  role_id?: number
  firstlogin?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
  role?: ApiRole
}

export interface LoginResponse {
  success: boolean
  message?: string
  user?: ApiUser
  requiresPasswordChange?: boolean
  access_token?: string
  refresh_token?: string
  code?: string
  device_id?: string
}
export interface VerifyDeviceResponse {
  success: boolean
  access_token: string
  refresh_token?: string
}

export interface RefreshTokenResponse {
  access_token: string
}

const resolveUrl = (path: string) => {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

// Helper to store refresh token securely
// Note: For true httpOnly security, backend should send Set-Cookie header
const REFRESH_TOKEN_KEY = '__rt'

function storeRefreshToken(token: string) {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch {
    // Ignore storage errors
  }
}

function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

function clearRefreshToken() {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Ignore
  }
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }
    const device = getDeviceInfo()

    const response = await fetch(resolveUrl(LOGIN_ENDPOINT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        device_id: device.id,
        device_name: device.name,
      }),
    })

    let data: unknown
    try {
      data = await response.json()
    } catch {
      data = null
    }

    // Handle non-200 HTTP responses
    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string'
          ? (data as any).message
          : null) || 'Invalid email or password'
      throw new Error(message)
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from authentication server')
    }

    const parsed = data as any

    // OTP device verification flow
    if (parsed && parsed.success === false && parsed.code === 'DEVICE_VERIFICATION_REQUIRED') {
      return parsed as LoginResponse
    }

    // Successful login must include access_token
    if (parsed && parsed.success === true && typeof parsed.access_token === 'string') {
      // Store refresh token securely
      if (parsed.refresh_token) {
        storeRefreshToken(parsed.refresh_token)
      }
      return parsed as LoginResponse
    }

    // Any other shape is invalid for this flow
    throw new Error('Invalid response from authentication server')
  },
  verifyDevice: async (
    email: string,
    otp: string,
    deviceId: string,
  ): Promise<VerifyDeviceResponse> => {
    const device = getDeviceInfo()
    const res = await fetch(resolveUrl(VERIFY_DEVICE_ENDPOINT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp, device_id: deviceId, device_name: device.name }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = (data && typeof data === 'object' && 'message' in data && typeof (data as any).message === 'string')
        ? (data as any).message
        : 'Invalid or expired OTP'
      throw new Error(msg)
    }
    if (!data || typeof data !== 'object' || !('access_token' in data)) {
      throw new Error('Invalid response from verification server')
    }

    // Store refresh token
    if ((data as any).refresh_token) {
      storeRefreshToken((data as any).refresh_token)
    }

    return data as VerifyDeviceResponse
  },
  getMe: async (accessToken: string): Promise<ApiUser | null> => {
    const res = await fetch(resolveUrl(ME_ENDPOINT), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    if (res.status === 401) return null
    const data = await res.json().catch(() => null)
    if (!res.ok || !data) {
      return null
    }
    // Backend returns { success: true, user: {...} }
    if (data.success && data.user) {
      return data.user as ApiUser
    }
    return null
  },

  refreshAccessToken: async (): Promise<RefreshTokenResponse> => {
    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const device = getDeviceInfo()
    const res = await fetch(resolveUrl(REFRESH_ENDPOINT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        token: refreshToken,
        device_id: device.id,
      }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data || typeof data !== 'object' || !('access_token' in data)) {
      // Refresh failed - clear stored token
      clearRefreshToken()
      throw new Error('REFRESH_FAILED')
    }

    return data as RefreshTokenResponse
  },

  logout: async (all: boolean = false): Promise<void> => {
    const device = getDeviceInfo()
    try {
      await fetch(resolveUrl(LOGOUT_ENDPOINT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          device_id: device.id,
          all,
        }),
      })
    } finally {
      // Always clear local refresh token
      clearRefreshToken()
    }
  },

  // Helper to check if we have a refresh token
  hasRefreshToken: (): boolean => {
    return !!getStoredRefreshToken()
  },

  // Helper to clear all auth data
  clearAuthData: () => {
    clearRefreshToken()
  },
}

function getDeviceInfo(): { id: string; name: string } {
  try {
    const key = 'device_id'
    let id = localStorage.getItem(key) || ''
    if (!id) {
      id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
      localStorage.setItem(key, id)
    }
    const name = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Admin'
    return { id, name }
  } catch {
    // Fallback when localStorage is not accessible
    return { id: Math.random().toString(36).slice(2), name: 'Web Admin' }
  }
}
