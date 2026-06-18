import { authApi } from './authApi'

interface FetchOptions extends RequestInit {
  skipAuthRefresh?: boolean
}

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

/**
 * Authenticated fetch wrapper that:
 * 1. Adds Authorization header from memory token
 * 2. Auto-refreshes on 401
 * 3. Retries original request with new token
 */
export async function authFetch(
  url: string,
  options: FetchOptions = {},
  accessToken: string | null,
  onTokenUpdate: (newToken: string) => void,
): Promise<Response> {
  const { skipAuthRefresh, ...fetchOptions } = options

  // Add auth header if token exists
  const headers = new Headers(fetchOptions.headers)
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const finalOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include',
  }

  const response = await fetch(url, finalOptions)

  // If not 401 or already retrying, return as-is
  if (response.status !== 401 || skipAuthRefresh) {
    return response
  }

  // Handle 401: refresh token and retry
  if (!isRefreshing) {
    isRefreshing = true
    try {
      const refreshed = await authApi.refreshAccessToken()
      const newToken = refreshed.access_token
      
      // Notify all subscribers
      onTokenRefreshed(newToken)
      onTokenUpdate(newToken)
      
      isRefreshing = false

      // Retry original request with new token
      headers.set('Authorization', `Bearer ${newToken}`)
      return fetch(url, { ...finalOptions, headers })
    } catch (refreshError) {
      isRefreshing = false
      // Refresh failed - clear auth and redirect to login
      authApi.clearAuthData()
      throw new Error('Session expired. Please login again.')
    }
  } else {
    // Already refreshing - wait for new token
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken: string) => {
        headers.set('Authorization', `Bearer ${newToken}`)
        fetch(url, { ...finalOptions, headers })
          .then(resolve)
          .catch(reject)
      })
    })
  }
}

/**
 * Hook to get authenticated fetch function
 * Usage: const { authFetch } = useAuthFetch()
 */
export function useAuthFetch() {
  // This will be implemented later if needed
  // For now, consumers can use authFetch directly by passing token
  return { authFetch }
}
