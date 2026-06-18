import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export const useUpdateFullName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fullName }: { fullName: string }) => {
      const response = await apiClient(ENDPOINTS.PROFILE.UPDATE_FULLNAME, {
        method: "PATCH",
        body: JSON.stringify({ fullName }),
      });

      if (!response || (response as any).success === false) {
        throw new Error(
          (response as any)?.message || "Failed to update full name"
        );
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Cập nhật tên thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật tên");
    },
  });
};

export const useUpdatePhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiClient(ENDPOINTS.PROFILE.UPDATE_PHONE, {
        method: "PATCH",
        body: JSON.stringify({ phone }),
      });

      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to update phone");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Cập nhật số điện thoại thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật số điện thoại");
    },
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient(ENDPOINTS.PROFILE.UPDATE_AVATAR, {
        method: "POST", // Backend uses POST for file upload
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        },
        body: formData,
      });

      if (!response || (response as any).success === false) {
        throw new Error(
          (response as any)?.message || "Failed to update avatar"
        );
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Cập nhật avatar thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật ảnh thất bại");
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (story: string) => {
      const response = await apiClient(ENDPOINTS.PROFILE.UPDATE_STORY, {
        method: "PATCH",
        body: JSON.stringify({ story }),
      });

      if (!response || (response as any).success === false) {
        throw new Error((response as any)?.message || "Failed to update story");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Cập nhật tiểu sử thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật tiểu sử thất bại");
    },
  });
};
