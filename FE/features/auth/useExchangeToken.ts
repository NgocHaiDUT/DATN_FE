import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId, getDeviceName } from "@/lib/device";
import type { ExchangeTokenRequest, ExchangeTokenResponse, User } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export const useExchangeToken = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  return useMutation<ExchangeTokenResponse, Error, { code: string }>({
    mutationFn: async ({ code }) => {
const data: ExchangeTokenRequest = {
        code,
        device_id: getDeviceId(),
        device_name: getDeviceName(),
      };
      const res = await apiClient(ENDPOINTS.AUTH.EXCHANGE_TOKEN, {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!res || !(res as ExchangeTokenResponse).success || !(res as ExchangeTokenResponse).access_token) {
        // Map error codes to user-friendly messages
        const errorCode = (res as any)?.code;
        let errorMessage = (res as any)?.message || "Đăng nhập thất bại";
        
        if (errorCode === "OAUTH_CODE_INVALID") {
          errorMessage = "Mã xác thực không hợp lệ hoặc đã được sử dụng. Vui lòng đăng nhập lại.";
        } else if (errorCode === "OAUTH_CODE_EXPIRED") {
          errorMessage = "Mã xác thực đã hết hạn. Vui lòng đăng nhập lại.";
        }
        
        throw new Error(errorMessage);
      }
      
      return res as ExchangeTokenResponse;
    },

    onSuccess: async (data) => {
      if (data.access_token && data.refresh_token) {
        // Set tokens first
        setTokens(data.access_token, data.refresh_token);

        if (data.user) {
          // Map backend user format to frontend User type
          // Backend returns: { id, email, full_name, avatar (from avatar_url), phone, story, firstlogin, role: string (name), permissions: string[] }
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.full_name,
            avatar_url: (data.user as any).avatar || data.user.avatar_url || null,
            phone: data.user.phone || null,
            story: data.user.story || null,
            role_id: null, // Backend returns role as string (name), not id. Will be fetched from /auth/me if needed
            firstlogin: data.user.firstlogin ?? false,
            is_active: true, // Default to true, backend doesn't return this in getCurrentUser
            permissions: data.user.permissions || [],
            cartItemCount: 0, // Will be fetched separately if needed
          };

          setUser(user);
          queryClient.setQueryData(["auth", "me"], user);
          
          // Small delay to ensure tokens are persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          
          router.refresh();

          router.push(
            user.firstlogin ? ROUTES.AUTH.FIRST_CHANGER_PASSWORD : ROUTES.HOME
          );
        } else {
          // If user is not returned, fetch it
          // Small delay to ensure tokens are persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          router.push(ROUTES.HOME);
        }
      }
    },

    onError: (error) => {
      toast.error(error.message || "Đăng nhập thất bại, vui lòng thử lại");
      router.push(ROUTES.AUTH.LOGIN);
    },
  });
};

