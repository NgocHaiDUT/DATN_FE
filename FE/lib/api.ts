import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId } from "./device";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

let globalAbortController: AbortController | null = null;

function getAbortController() {
  if (!globalAbortController || globalAbortController.signal.aborted) {
    globalAbortController = new AbortController();
  }
  return globalAbortController;
}

async function refreshAccessToken(): Promise<{ success: boolean; code?: string }> {
  try {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().resetUser();
      return { success: false };
    }

    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: refreshToken,
        device_id: getDeviceId(),
      }),
    });

    if (!res.ok) {
      try {
        const errorData = await res.json();
        const errorCode = errorData?.code || errorData?.error?.code;

        // If refresh token is invalid, reset user and trigger logout
        if (errorCode === "REFRESH_TOKEN_INVALID") {
          useAuthStore.getState().resetUser();

          // Store message for display after redirect
          if (typeof window !== "undefined") {
            sessionStorage.setItem("auth_expired_message", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            window.location.href = "/login";
          }

          return { success: false, code: errorCode };
        }

        useAuthStore.getState().resetUser();
        return { success: false, code: errorCode };
      } catch {
        useAuthStore.getState().resetUser();
        return { success: false };
      }
    }

    const data = await res.json();
    useAuthStore.getState().setAccessToken(data.access_token);
    return { success: true };
  } catch {
    useAuthStore.getState().resetUser();
    return { success: false };
  }
}

export async function apiClient(path: string, options: RequestInit = {}) {
  const controller = getAbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const accessToken = useAuthStore.getState().accessToken;

  // Don't set Content-Type for FormData, let browser set it with boundary
  const isFormData = options.body instanceof FormData;

  /* eslint-disable @typescript-eslint/naming-convention */
  const headers: HeadersInit = {
    ...options.headers,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  if (!isFormData && options.method !== 'GET' && options.method !== 'HEAD') {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const finalOptions: RequestInit = {
    ...options,
    credentials: "include", // Ensure cookies are sent if needed
    headers,
    signal: controller.signal,
  };

  try {
    let res = await fetch(`${API_BASE_URL}${path}`, finalOptions);

    // Only refresh token if 401 with ACCESS_TOKEN_INVALID code
    if (res.status === 401) {
      try {
        const errorData = await res.clone().json();
        const errorCode = errorData?.code || errorData?.error?.code;

        // Only refresh if error code is ACCESS_TOKEN_INVALID
        if (errorCode === "ACCESS_TOKEN_INVALID") {
          const refreshResult = await refreshAccessToken();

          // If refresh failed due to REFRESH_TOKEN_INVALID, redirect already happened
          if (!refreshResult.success && refreshResult.code === "REFRESH_TOKEN_INVALID") {
            clearTimeout(timeout);
            return { success: false, status: 401, code: "REFRESH_TOKEN_INVALID" };
          }

          if (!refreshResult.success) {
            clearTimeout(timeout);
            return { success: false, status: 401, code: errorCode };
          }

          const newAccessToken = useAuthStore.getState().accessToken;
          res = await fetch(`${API_BASE_URL}${path}`, {
            ...finalOptions,
            headers: {
              ...finalOptions.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        } else {
          // Other 401 errors (like INVALID_CREDENTIALS, etc.) should not trigger refresh
          clearTimeout(timeout);
          return { success: false, status: 401, code: errorCode };
        }
      } catch {
        // If error response is not JSON, return 401 without refresh
        clearTimeout(timeout);
        return { success: false, status: 401 };
      }
    }

    if (!res.ok) {
      try {
        const errorData = await res.clone().json();
        clearTimeout(timeout);
        return { success: false, status: res.status, code: errorData?.code, message: errorData?.message };
      } catch {
        clearTimeout(timeout);
        return { success: false, status: res.status };
      }
    }

    const data = await res.json();
    clearTimeout(timeout);
    return data;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      return { success: false, error: "cancelled" };
    }
    return { success: false, error: "network" };
  }
}
