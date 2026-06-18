import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export interface CreateShopData {
  shop_name: string;
  slug: string;
  description: string;
  phone?: string;
  email?: string;
}

export interface CreateShopFiles {
  logo?: File;
  banner?: File;
}

export const useCreateShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopData,
      files,
    }: {
      shopData: CreateShopData;
      files?: CreateShopFiles;
    }) => {
      const formData = new FormData();
      formData.append("shop_name", shopData.shop_name.trim());
      formData.append("slug", shopData.slug.trim());
      formData.append("description", shopData.description.trim());
      if (shopData.phone) {
        formData.append("phone", shopData.phone.trim());
      }
      if (shopData.email) {
        formData.append("email", shopData.email.trim());
      }

      if (files?.logo) {
        formData.append("logo", files.logo);
      }
      if (files?.banner) {
        formData.append("banner", files.banner);
      }

      const response = await apiClient(ENDPOINTS.SHOP.CREATE_SHOP, {
        method: "POST",
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData,
      });

      const res: any = response;

      // Log chi tiết để debug khi backend trả lỗi
      if (res?.success === false || res?.error || !res) {
        // Ưu tiên message từ backend, sau đó code/status
        const message =
          res?.message ||
          res?.error ||
          (res?.status ? `Tạo cửa hàng thất bại (HTTP ${res.status})` : null) ||
          "Có lỗi xảy ra khi tạo cửa hàng";

        // eslint-disable-next-line no-console
throw new Error(message);
      }

      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      toast.success(response.message || "Tạo cửa hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi tạo cửa hàng");
    },
  });
};

