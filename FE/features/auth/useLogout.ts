"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { getDeviceId } from "@/lib/device";
import { API_BASE_URL } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { ROUTES } from "@/constants/routes";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { resetUser, accessToken } = useAuthStore();

  return async (allDevices: boolean = false) => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            device_id: getDeviceId(),
            all: allDevices,
          }),
        });
      }
    } catch {
      // Ignore errors during logout
    } finally {
      resetUser();
      queryClient.clear();
      
      // Clear OAuth-related data from sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("last_oauth_code");
        sessionStorage.removeItem("oauth_device_name");
      }
      
      router.replace(ROUTES.AUTH.LOGIN);
      router.refresh();
    }
  };
};
