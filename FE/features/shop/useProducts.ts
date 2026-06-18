import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { getAllProducts } from "@/lib/api/shop";
import { ENDPOINTS } from "@/constants/endpoint";

export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  thumbnail_url?: string;
  image_url?: string;
  brand_name?: string;
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  search?: string;
}

export const useProducts = (params: GetProductsParams = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.category) searchParams.set("category", params.category);
  if (params.brand) searchParams.set("brand", params.brand);
  if (params.search) searchParams.set("search", params.search);

  const queryString = searchParams.toString();

  return useQuery<any>({
    queryKey: ["products", params],
    queryFn: async () => {
      // Use the canonical API helper which normalizes product objects to `Product` shape
      return await getAllProducts(params);
    },
    staleTime: 60_000,
  });
};
