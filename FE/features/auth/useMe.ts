import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { ENDPOINTS } from "@/constants/endpoint";

export const useMe = () => {
  const { setUser, resetUser, user: currentUser, accessToken } = useAuthStore();

  // ✅ FIXED: Only refresh if user is missing OR has NO permissions at all
  // Don't refresh if user already has permissions (e.g., from login response)
  const needsRefresh = !currentUser || !currentUser.permissions || currentUser.permissions.length === 0;

  console.log('🔍 [useMe] State:', {
    hasAccessToken: !!accessToken,
    hasCurrentUser: !!currentUser,
    currentUserPermissions: currentUser?.permissions?.length || 0,
    needsRefresh,
    queryEnabled: needsRefresh && !!accessToken,
    reason: !currentUser ? 'no_user' : (!currentUser.permissions || currentUser.permissions.length === 0) ? 'no_permissions' : 'has_data'
  });

  const query = useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<User> => {
      console.log('📡 [useMe] Fetching /auth/me...');
      const res = await apiClient(ENDPOINTS.AUTH.ME);

      console.log('✅ [useMe] Response:', {
        success: res?.success,
        hasUser: !!res?.user,
        permissions_count: res?.user?.permissions?.length || 0
      });

      // Chỉ reset user khi là lỗi 401 (Unauthorized)
      if (!res || res.success === false) {
        const status = (res as any)?.status;
        const error = new Error(res?.message || "Unauthorized") as Error & { status?: number };
        error.status = status;
        throw error;
      }

      const u = res.user;

      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: u.avatar_url,
        phone: u.phone,
        story: u.story,
        role_id: u.role_id,
        firstlogin: u.firstlogin ?? false,
        is_active: u.is_active ?? true,
        permissions: u.permissions || [],
        cartItemCount: u.cartItemCount || 0,
      };
    },

    enabled: needsRefresh && !!accessToken,

    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // ---- Sync to Zustand ----
  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isSuccess, query.data]);

  useEffect(() => {
    // Chỉ reset user khi lỗi là 401 (Unauthorized)
    // Không reset khi là lỗi khác (404, network error, etc)
    if (query.isError && query.error) {
      const error = query.error as Error & { status?: number };
      if (error.status === 401 || error.message === "Unauthorized") {
        resetUser();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isError, query.error]);

  return query;
};
