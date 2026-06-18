import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId, getDeviceName } from "@/lib/device";
import type { LoginRequest, LoginResponse, User } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, setTokens, setTemporaryLoginCredentials } = useAuthStore();

  return useMutation<LoginResponse, Error, Omit<LoginRequest, "device_id" | "device_name"> & { _credentials?: { email: string; password: string } }>({
    mutationFn: async (credentials) => {
      console.log('🔑 [useLogin] Starting login...');

      const loginData: LoginRequest = {
        ...credentials,
        device_id: getDeviceId(),
        device_name: getDeviceName(),
        device_type: "web",
      };

      console.log('📡 [useLogin] Calling API...');
      const res = await apiClient(ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: JSON.stringify(loginData),
      });

      if (!res) {
        console.error('❌ [useLogin] No response from API');
        throw new Error("Đăng nhập thất bại");
      }

      console.log('📊 [useLogin] API Response:', {
        success: res.success,
        hasAccessToken: !!res.access_token,
        hasUser: !!res.user,
        userPermissions: res.user?.permissions?.length || 0,
        code: res.code
      });

      // Check if device verification is required
      if ((res as any).code === "DEVICE_VERIFICATION_REQUIRED") {
        console.log('🔐 [useLogin] Device verification required');
        return {
          success: false,
          code: "DEVICE_VERIFICATION_REQUIRED",
          device_id: (res as any).device_id,
        } as LoginResponse;
      }

      // Validate response structure
      const loginRes = res as LoginResponse;

      if (!loginRes || typeof loginRes !== 'object') {
        console.error('❌ [useLogin] Invalid response format:', res);
        throw new Error("Phản hồi không hợp lệ từ máy chủ");
      }

      if (Object.keys(loginRes).length === 0) {
        console.error('❌ [useLogin] Empty response received:', JSON.stringify(res));
        throw new Error("Máy chủ không trả về dữ liệu. Vui lòng thử lại sau.");
      }

      // Check for backend error response
      if (loginRes.success === false) {
        console.error('❌ [useLogin] Login failed with error:', loginRes);
        throw new Error(loginRes.message || "Đăng nhập thất bại");
      }

      // Attach credentials for storage if first login
      (res as any)._credentials = credentials._credentials;

      return res as LoginResponse;
    },

    onSuccess: (data) => {
      console.log('✅ [useLogin] Login success:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
        userPermissions: data.user?.permissions?.length || 0,
        permissions: data.user?.permissions
      });

      // If device verification is required, don't proceed with login
      if (data.code === "DEVICE_VERIFICATION_REQUIRED") {
        // This will be handled by the component to show OTP input
        return;
      }

      if (data.access_token && data.refresh_token && data.user) {
        console.log('🔑 [useLogin] Setting tokens and user...');
        setTokens(data.access_token, data.refresh_token);
        setUser(data.user);
        queryClient.setQueryData(["auth", "me"], data.user);

        // Store temporary credentials if first login
        if (data.user.firstlogin && (data as any)._credentials) {
          setTemporaryLoginCredentials((data as any)._credentials);
        }

        router.refresh();

        router.push(
          data.user.firstlogin ? ROUTES.AUTH.FIRST_CHANGER_PASSWORD : ROUTES.HOME
        );
      }
    },

    onError: (error) => {
      toast.error(error.message || "Đăng nhập thất bại, vui lòng thử lại");
    },
  });
};
