import { API_BASE_URL } from "@/lib/api";
import { getDeviceId, getDeviceName } from "@/lib/device";
import { ENDPOINTS } from "@/constants/endpoint";

export function useGoogleLogin() {
  const loginWithGoogle = () => {
    const deviceId = getDeviceId();
    const deviceName = getDeviceName();
    const deviceType = 'web';

    // Store device_name in sessionStorage for later use if needed
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oauth_device_name", deviceName);
    }

    // Gửi thông tin thiết bị qua query params để GoogleAuthGuard ở Backend có thể bọc vào state
    const redirectOrigin = window.location.origin;
    window.location.href = `${API_BASE_URL}${ENDPOINTS.AUTH.GOOGLE}?device_id=${deviceId}&device_type=${deviceType}&redirect_origin=${encodeURIComponent(redirectOrigin)}`;
  };

  return { loginWithGoogle };
}
