import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export const useSearchUsers = (q: string, limit = 20) => {
  return useQuery<any[]>({
    queryKey: ["search-users", { q, limit }],
    enabled: !!q,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", q);
      if (limit) params.set("limit", String(limit));

      const res: any = await apiClient(
        `${ENDPOINTS.SEARCH.USERS}?${params.toString()}`,
        { method: "GET" }
      );
      return res?.data?.results || [];
    },
  });
};

