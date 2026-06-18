import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

interface UseSearchProductsParams {
  q?: string;
  category?: string | null;
  brandSlug?: string | null;
}

export const useSearchProducts = ({
  q,
  category,
  brandSlug,
}: UseSearchProductsParams) => {
  const searchParams = new URLSearchParams();
  if (q) searchParams.set("search", q);
  if (category) searchParams.set("category", category);
  if (brandSlug) searchParams.set("brand", brandSlug);

  const queryString = searchParams.toString();

  return useQuery<any[]>({
    queryKey: ["search-products", { q, category, brandSlug }],
    enabled: !!q || !!category || !!brandSlug,
    queryFn: async () => {
      const path =
        ENDPOINTS.PRODUCTS.GET_ALL + (queryString ? `?${queryString}` : "");
      const res: any = await apiClient(path, { method: "GET" });
      const raw =
        res?.data?.items ||
        res?.data?.products ||
        res?.data ||
        res?.items ||
        res;
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 30_000,
  });
};

