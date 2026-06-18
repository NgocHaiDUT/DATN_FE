import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value.toString());
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const useShopConversations = (shopId?: number, options?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["shop-conversations", shopId, options],
    enabled: !!shopId,
    queryFn: async () => {
      const params = {
        page: options?.page || 1,
        limit: options?.limit || 50,
      };
      return apiClient(
        `${ENDPOINTS.MESSAGES.SHOP_GET_CONVERSATIONS(shopId!)}${buildQueryString(params)}`
      );
    },
    staleTime: 3 * 1000, // 3 seconds
    refetchInterval: 3 * 1000, // Poll every 3 seconds for real-time updates
    retry: 1,
  });
};

export const useShopMessages = (
  shopId?: number,
  conversationId?: number,
  options?: { limit?: number; before?: number; after?: number; cursor?: number; page?: number }
) => {
  return useQuery({
    queryKey: ["shop-messages", shopId, conversationId, options],
    enabled: !!shopId && !!conversationId,
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        limit: options?.limit || 50,
      };
      if (options?.before) params.before = options.before;
      if (options?.after) params.after = options.after;
      if (options?.cursor) params.cursor = options.cursor;
      if (options?.page) params.page = options.page;

      return apiClient(
        `${ENDPOINTS.MESSAGES.SHOP_GET_MESSAGES(shopId!, conversationId!)}${buildQueryString(params)}`
      );
    },
    staleTime: 3 * 1000, // 3 seconds
    refetchInterval: 3 * 1000, // Poll every 3 seconds for real-time updates
    retry: 1,
  });
};

export const useSendShopMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      messageData,
    }: {
      shopId: number;
      messageData: {
        conversation_id: number;
        content: string;
        type?: string;
        payload?: any;
      };
    }) => {
      return apiClient(ENDPOINTS.MESSAGES.SHOP_SEND_MESSAGE(shopId), {
        method: "POST",
        body: JSON.stringify({
          conversation_id: messageData.conversation_id,
          content: messageData.content,
          messageType: messageData.type || "TEXT", // ✅ Changed from 'type' to 'messageType' to match DTO
          payload: messageData.payload,
        }),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({
        queryKey: ["shop-messages", variables.shopId, variables.messageData.conversation_id],
      });
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({
        queryKey: ["shop-conversations", variables.shopId],
      });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      conversationId,
    }: {
      shopId: number;
      conversationId: number;
    }) => {
      return apiClient(ENDPOINTS.MESSAGES.SHOP_MARK_ALL_AS_READ(shopId, conversationId), {
        method: "PATCH",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shop-conversations", variables.shopId],
      });
      queryClient.invalidateQueries({
        queryKey: ["shop-messages", variables.shopId, variables.conversationId],
      });
    },
  });
};

