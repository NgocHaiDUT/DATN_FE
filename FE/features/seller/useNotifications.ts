import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { useAuthStore } from "@/stores/auth.store";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSocketIO } from "@/hooks/useSocketIO";

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  meta_json?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = (page?: number, limit?: number) => {
  const { user } = useAuthStore();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { lastMessage } = useSocketIO();

  useEffect(() => {
    if (lastMessage?.type === "notification") {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast(lastMessage.title || "Thông báo mới", {
        description: lastMessage.body || lastMessage.message,
        action: {
          label: "Xem",
          onClick: () => window.location.href = "/notifications",
        },
      });
    }
  }, [lastMessage, queryClient]);

  return useQuery({
    queryKey: ["notifications", userId, page, limit],
    queryFn: async () => {
      if (!userId) return { notifications: [], unreadCount: 0, total: 0, totalPages: 0 };

      let url = `${ENDPOINTS.NOTIFICATIONS.GET_ALL}?userId=${userId}`;
      if (page) url += `&page=${page}`;
      if (limit) url += `&limit=${limit}`;

      const response = await apiClient(url);

      if (!response || response.success === false) {
        return { notifications: [], unreadCount: 0, total: 0, totalPages: 0 };
      }

      // Backend returns { data: [], total, page, limit, total_pages }
      // Check if response.data is the paginated object or the array directly (depending on interception)
      const responseData = response.data || response;
      const notificationsList = Array.isArray(responseData) ? responseData : (responseData.data || []);
      const total = responseData.total || 0;
      const totalPages = responseData.total_pages || 0;

      // If unreadCount is not provided by backend stats, we can only count from what we fetched, 
      // or we should fetch getStats separately. For now, let's keep it simple.
      // Ideally we should call getStats endpoint.

      return {
        notifications: notificationsList,
        unreadCount: notificationsList.filter((n: Notification) => !n.is_read).length,
        total,
        totalPages
      };
    },
    enabled: !!userId,
    // refetchInterval removed in favor of socket
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      return apiClient(ENDPOINTS.NOTIFICATIONS.MARK_AS_READ(notificationId), {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not found");
      return apiClient(ENDPOINTS.NOTIFICATIONS.MARK_ALL_AS_READ, {
        method: "POST",
        body: JSON.stringify({ user_id: user.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
