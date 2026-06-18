import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export type SearchType = "post" | "user" | "shop" | "hashtag";

interface UseSearchAllParams {
  q: string;
  type?: SearchType;
  limit?: number;
}

export interface SearchAllResult {
  posts?: any[];
  users?: any[];
  shops?: any[];
  hashtags?: any[];
  total: { posts: number; users: number; shops: number; hashtags: number };
}

export const useSearchAll = ({ q, type, limit = 20 }: UseSearchAllParams) => {
  return useQuery<SearchAllResult>({
    queryKey: ["search-all", { q, type, limit }],
    enabled: !!q,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", q);
      if (type) params.set("type", type);
      if (limit) params.set("limit", String(limit));

      const res: any = await apiClient(
        `${ENDPOINTS.SEARCH.ALL}?${params.toString()}`,
        { method: "GET" }
      );

      const data = res?.data || {};

      // Nếu có type thì backend trả {results, total}; nếu không thì trả {posts, users, shops, hashtags, total}
      if (type) {
        const results = data.results || [];
        const total = data.total || 0;
        return {
          [type === "post"
            ? "posts"
            : type === "user"
            ? "users"
            : type === "shop"
            ? "shops"
            : "hashtags"]: results,
          total: {
            posts: type === "post" ? total : 0,
            users: type === "user" ? total : 0,
            shops: type === "shop" ? total : 0,
            hashtags: type === "hashtag" ? total : 0,
          },
        } as SearchAllResult;
      }

      return {
        posts: data.posts || [],
        users: data.users || [],
        shops: data.shops || [],
        hashtags: data.hashtags || [],
        total:
          data.total || ({ posts: 0, users: 0, shops: 0, hashtags: 0 } as any),
      } as SearchAllResult;
    },
  });
};

