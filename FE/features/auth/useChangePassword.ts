import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";

export const useChangePassword = () => {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const payload = {
        userid: user?.id,
        currentPassword,
        newPassword,
      };

      const res = await apiClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res || (res as any).success === false) {
        throw new Error((res as any)?.message || "Đổi mật khẩu thất bại");
      }

      return res;
    },
    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Đổi mật khẩu thất bại");
    },
  });
};
