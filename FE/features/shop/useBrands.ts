import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  logo?: string;
}

interface BrandsResponse {
  success: boolean;
  data?: Brand[] | { items?: Brand[]; brands?: Brand[] };
}

export const useBrands = () => {
  return useQuery<Brand[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const res: any = await apiClient(ENDPOINTS.BRANDS.GET_ALL, {
        method: "GET",
      });
      const raw =
        res?.data?.brands || res?.data?.items || res?.data || res?.brands || res;
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

