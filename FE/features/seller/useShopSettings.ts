import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

// ============ SHOP INFO ============

export const useUpdateShopLogo = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logoFile: File) => {
      if (!shopId) throw new Error("Shop ID is required");

      const formData = new FormData();
      formData.append("file", logoFile);

      return apiClient(ENDPOINTS.SHOP.UPDATE_LOGO(shopId), {
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};

export const useUpdateShopBanner = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bannerFile: File) => {
      if (!shopId) throw new Error("Shop ID is required");

      const formData = new FormData();
      formData.append("file", bannerFile);

      return apiClient(ENDPOINTS.SHOP.UPDATE_BANNER(shopId), {
        method: "PATCH",
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};

export const useUpdateShopPhone = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.UPDATE_PHONE(shopId), {
        method: "PATCH",
        body: JSON.stringify({ phone }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};

export const useUpdateShopEmail = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.UPDATE_EMAIL(shopId), {
        method: "PATCH",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};

export const useUpdateShopDescription = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (description: string) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.UPDATE_DESCRIPTION(shopId), {
        method: "PATCH",
        body: JSON.stringify({ description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};

// ============ SHOP ADDRESSES ============

export interface ShopAddress {
  id: number;
  name: string;
  phone: string;
  email?: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  is_default: boolean;
  ghn_province_id?: number;
  ghn_district_id?: number;
  ghn_ward_code?: string;
}

export const useShopAddresses = (shopId?: number) => {
  return useQuery({
    queryKey: ["shop-addresses", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      if (!shopId) throw new Error("Shop ID is required");
      return apiClient(ENDPOINTS.SHOP.GET_ADDRESSES(shopId));
    },
  });
};

export const useAddShopAddress = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: Omit<ShopAddress, "id">) => {
      if (!shopId) throw new Error("Shop ID is required");
      return apiClient(ENDPOINTS.SHOP.ADD_ADDRESS(shopId), {
        method: "POST",
        body: JSON.stringify(addressData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-addresses", shopId] });
    },
  });
};

export const useUpdateShopAddress = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      addressId,
      addressData,
    }: {
      addressId: number;
      addressData: Partial<ShopAddress>;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");
      return apiClient(ENDPOINTS.SHOP.UPDATE_ADDRESS(shopId, addressId), {
        method: "PUT",
        body: JSON.stringify(addressData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-addresses", shopId] });
    },
  });
};

export const useDeleteShopAddress = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: number) => {
      if (!shopId) throw new Error("Shop ID is required");
      return apiClient(ENDPOINTS.SHOP.DELETE_ADDRESS(shopId, addressId), {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-addresses", shopId] });
    },
  });
};

// ============ STAFF MANAGEMENT ============

export interface StaffMember {
  email: string;
  full_name?: string;
  is_manager: boolean;
  permissions: string[];
  avatar_url?: string;
}

export const useStaffList = (shopId?: number) => {
  return useQuery({
    queryKey: ["staff-list", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      if (!shopId) throw new Error("Shop ID is required");
      return apiClient(ENDPOINTS.SHOP.GET_STAFF_LIST(shopId));
    },
  });
};

export const useAddStaff = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffEmail,
      isManager = false,
    }: {
      staffEmail: string;
      isManager?: boolean;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.ADD_STAFF(shopId), {
        method: "POST",
        body: JSON.stringify({ staffEmail, isManager }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list", shopId] });
    },
  });
};

export const useDeleteStaff = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffEmail: string) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.DELETE_STAFF, {
        method: "DELETE",
        body: JSON.stringify({
          staffEmail,
          shopId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list", shopId] });
    },
  });
};

export const useUpdateStaffPermissions = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffEmail,
      permissions,
    }: {
      staffEmail: string;
      permissions: string[];
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(
        ENDPOINTS.SHOP.UPDATE_STAFF_PERMISSIONS(shopId, staffEmail),
        {
          method: "PUT",
          body: JSON.stringify({ permissions }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list", shopId] });
    },
  });
};

export const useDeleteStaffPermissions = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffEmail,
      permissions,
    }: {
      staffEmail: string;
      permissions: string[];
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(
        ENDPOINTS.SHOP.DELETE_STAFF_PERMISSIONS(shopId, staffEmail),
        {
          method: "DELETE",
          body: JSON.stringify({ permissions }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list", shopId] });
    },
  });
};

export const useStaffPermissions = (shopId?: number, staffEmail?: string) => {
  return useQuery({
    queryKey: ["staff-permissions", shopId, staffEmail],
    enabled: !!shopId && !!staffEmail,
    queryFn: async () => {
      if (!shopId || !staffEmail)
        throw new Error("Shop ID and staff email are required");
      return apiClient(
        ENDPOINTS.SHOP.GET_STAFF_PERMISSIONS(shopId, staffEmail)
      );
    },
  });
};

export const useRegisterGHNShop = (shopId?: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressShopId: number) => {
      if (!shopId) throw new Error("Shop ID is required");

      return apiClient(ENDPOINTS.SHOP.REGISTER_GHN(shopId), {
        method: "POST",
        body: JSON.stringify({ address_shop_id: addressShopId }),
      });
    },
    onSuccess: (data: any) => {
      // Cập nhật ngay lập tức cache shop với ghn_shop_id mới
      if (data?.ghn_shop_id) {
        queryClient.setQueriesData(
          { queryKey: ["shop"], exact: false },
          (old: any) => old ? { ...old, ghn_shop_id: data.ghn_shop_id } : old
        );
      }
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
};
