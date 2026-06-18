import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export const useSearchShops = (q: string, limit = 20) => {
  return useQuery<any[]>({
    queryKey: ["search-shops", { q, limit }],
    enabled: !!q,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", q);
      if (limit) params.set("limit", String(limit));

      const res: any = await apiClient(
        `${ENDPOINTS.SEARCH.SHOPS}?${params.toString()}`,
        { method: "GET" }
      );
      return res?.data?.results || [];
    },
  });
};

