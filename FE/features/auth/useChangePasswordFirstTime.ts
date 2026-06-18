import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { ChangePasswordFirstTimeRequest } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";

export const useChangePasswordFirstTime = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, temporaryLoginCredentials, setTemporaryLoginCredentials } = useAuthStore();

  return useMutation<any, Error, { newPassword: string }>({
    mutationFn: async ({ newPassword }) => {
      if (!temporaryLoginCredentials) {
        throw new Error("Thông tin đăng nhập tạm thời không tồn tại. Vui lòng đăng nhập lại.");
      }

      const payload: ChangePasswordFirstTimeRequest = {
        email: temporaryLoginCredentials.email,
        temporaryPassword: temporaryLoginCredentials.password,
        newPassword,
      };

      const res = await apiClient("/auth/change-password-first-time", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "Đổi mật khẩu thất bại");
      }

      // Clear temporary credentials after successful password change
      setTemporaryLoginCredentials(null);

      return res;
    },

    onSuccess: (data) => {
      // Đồng bộ lại user từ response backend
      if (data?.user) {
        setUser(data.user);
        queryClient.setQueryData(["auth", "me"], data.user);
      }

      toast.success(data?.message || "Đổi mật khẩu thành công");
      router.push(ROUTES.HOME);
    },

    onError: (error) => {
      toast.error(error.message || "Đổi mật khẩu thất bại, vui lòng thử lại");
    },
  });
};
