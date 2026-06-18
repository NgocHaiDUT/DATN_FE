import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId } from "@/lib/device";
import type { RefreshTokenRequest, RefreshTokenResponse } from "@/types/auth.types";
import { ENDPOINTS } from "@/constants/endpoint";

export const useRefreshToken = () => {
  const { refreshToken, setAccessToken } = useAuthStore();

  return useMutation<RefreshTokenResponse, Error, void>({
    mutationFn: async () => {
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const data: RefreshTokenRequest = {
        token: refreshToken,
        device_id: getDeviceId(),
      };

      const res = await apiClient(ENDPOINTS.AUTH.REFRESH_TOKEN, {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res || !(res as RefreshTokenResponse).access_token) {
        throw new Error("Refresh token failed");
      }

      return res as RefreshTokenResponse;
    },

    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },

    onError: () => {
      // Reset user on refresh token failure
      useAuthStore.getState().resetUser();
    },
  });
};

