import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export interface Address {
  id: number;
  label?: string;
  receiver_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  is_default: boolean;
  ghn_province_id?: number;
  ghn_district_id?: number;
  ghn_ward_code?: string;
}

export interface CreateAddressData {
  label?: string;
  receiver_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  is_default: boolean;
  ghn_province_id?: number;
  ghn_district_id?: number;
  ghn_ward_code?: string;
}

export const useAddresses = () => {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const response = await apiClient(ENDPOINTS.PROFILE.GET_ALL_ADDRESSES);
      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to fetch addresses");
      }
      const data = (Array.isArray(response) ? response : (response as any).data || response) as any[];
      return data.map(addr => ({
        ...addr,
        receiver_name: addr.receiver_name || addr.recipient
      })) as Address[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressData: CreateAddressData) => {
      const response = await apiClient(ENDPOINTS.PROFILE.ADD_ADDRESS, {
        method: "POST",
        body: JSON.stringify(addressData),
      });

      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to add address");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Thêm địa chỉ thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi thêm địa chỉ");
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CreateAddressData> }) => {
      const response = await apiClient(ENDPOINTS.PROFILE.UPDATE_ADDRESS(id), {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to update address");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Cập nhật địa chỉ thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật địa chỉ");
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressId: number) => {
      const response = await apiClient(ENDPOINTS.PROFILE.DELETE_ADDRESS(addressId), {
        method: "DELETE",
      });

      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to delete address");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Xóa địa chỉ thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi xóa địa chỉ");
    },
  });
};
