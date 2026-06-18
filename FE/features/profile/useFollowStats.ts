import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export function useFollowStats(userId?: number, currentUserId?: number) {
    return useQuery({
        queryKey: ["follow-stats", userId, currentUserId],
        queryFn: async () => {
            if (!userId) return null;

            const url = currentUserId
                ? `${ENDPOINTS.FOLLOWS.STATS(userId)}?currentUserId=${currentUserId}`
                : ENDPOINTS.FOLLOWS.STATS(userId);

            const response = await apiClient(url, { method: "GET" });
            return response?.data || response;
        },
        enabled: !!userId,
        staleTime: 30 * 1000, // 30 seconds
    });
}
