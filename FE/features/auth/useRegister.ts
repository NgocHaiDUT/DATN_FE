import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
import type { RegisterRequest, RegisterResponse } from "@/types/auth.types";
import { ROUTES } from "@/constants/routes";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export const useRegister = () => {
  const router = useRouter();

  return useMutation<RegisterResponse, Error, Omit<RegisterRequest, "device_register">>({
    mutationFn: async (data) => {
      const registerData: RegisterRequest = {
        ...data,
        device_register: getDeviceId(),
      };

      const res = await apiClient(ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        body: JSON.stringify(registerData),
      });

      if (!res || !(res as RegisterResponse).success) {
        throw new Error((res as any)?.message || "Đăng ký thất bại");
      }

      return res as RegisterResponse;
    },

    onSuccess: (data) => {
      toast.success(data.message || "Đăng ký thành công. Mật khẩu tạm thời đã được gửi về email của bạn.");
      router.push(ROUTES.AUTH.LOGIN);
    },

    onError: (error) => {
      toast.error(error.message || "Đăng ký thất bại, vui lòng thử lại");
    },
  });
};

