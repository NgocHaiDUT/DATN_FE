import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export type ProductStat = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  view_count: number;
  tryon_count: number;
  review_count: number;
  avg_rating: number;
  sold_count: number;
};

export const useProductStats = (shopId?: number, period: string = "month") => {
  return useQuery<ProductStat[]>({
    queryKey: ["product-stats", shopId, period],
    enabled: !!shopId,
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      const data = await apiClient(
        `${ENDPOINTS.ANALYTICS.PRODUCT_STATS(shopId!)}?${params.toString()}`
      );
      return data as ProductStat[];
    },
  });
};
