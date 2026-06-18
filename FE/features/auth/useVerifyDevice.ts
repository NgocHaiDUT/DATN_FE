import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { getDeviceName } from "@/lib/device";
import type { VerifyDeviceRequest, LoginResponse, User } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export const useVerifyDevice = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  return useMutation<LoginResponse, Error, Omit<VerifyDeviceRequest, "device_name">>({
    mutationFn: async (data) => {
      const verifyData: VerifyDeviceRequest = {
        ...data,
        device_name: getDeviceName(),
      };

      const res = await apiClient(ENDPOINTS.AUTH.VERIFY_DEVICE, {
        method: "POST",
        body: JSON.stringify(verifyData),
      });

      if (!res || !(res as LoginResponse).success || !(res as LoginResponse).access_token) {
        throw new Error((res as any)?.message || "Xác minh thiết bị thất bại");
      }

      return res as LoginResponse;
    },

    onSuccess: (data) => {
      console.log('✅ [useVerifyDevice] Verification success:', {
        hasAccessToken: !!data.access_token,
        hasUser: !!data.user,
        userPermissions: data.user?.permissions?.length || 0
      });

      if (data.access_token && data.refresh_token && data.user) {
        setTokens(data.access_token, data.refresh_token);
        setUser(data.user);
        queryClient.setQueryData(["auth", "me"], data.user);

        // ❌ REMOVED: router.refresh() causes useMe to refetch and overwrite user data
        // router.refresh();

        router.push(
          data.user.firstlogin ? ROUTES.AUTH.FIRST_CHANGER_PASSWORD : ROUTES.HOME
        );
      }
    },

    onError: (error) => {
      toast.error(error.message || "Xác minh thiết bị thất bại, vui lòng thử lại");
    },
  });
};

