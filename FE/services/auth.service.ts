import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId, getDeviceName } from "@/lib/device";
import { API_BASE_URL } from "@/lib/api";

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      device_id: getDeviceId(),
      device_name: getDeviceName(),
      device_type: "web",
    }),
  });

  if (!res.ok) throw new Error("Login failed");

  const data = await res.json();

  useAuthStore.getState().setAccessToken(data.access_token);
}
export async function logout() {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: getDeviceId(),
    }),
  });
}

export function loginWithGoogle() {
  const deviceId = getDeviceId();
  const deviceType = 'web';

  window.location.href = `${API_BASE_URL}/auth/google?device_id=${deviceId}&device_type=${deviceType}`;
}
