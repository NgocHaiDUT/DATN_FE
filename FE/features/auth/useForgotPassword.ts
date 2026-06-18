import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { ForgotPasswordRequest, ForgotPasswordResponse } from "@/types/auth.types";
import { toast } from "sonner";

export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: async (data) => {
      const res = await apiClient("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!res || !(res as ForgotPasswordResponse).success) {
        throw new Error((res as any)?.message || "Không thể gửi email đặt lại mật khẩu");
      }

      return res as ForgotPasswordResponse;
    },

    onSuccess: (data) => {
      toast.success(data.message || "Email đặt lại mật khẩu đã được gửi!");
    },

    onError: (error) => {
      toast.error(error.message || "Không thể gửi email đặt lại mật khẩu");
    },
  });
};

