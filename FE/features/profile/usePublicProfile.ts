import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export interface PublicUserProfile {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  story?: string | null;
}

export const usePublicProfile = (userId: number | undefined) => {
  return useQuery<PublicUserProfile>({
    queryKey: ["public-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res: any = await apiClient(ENDPOINTS.USERS.GET_BY_ID(userId!), {
        method: "GET",
      });
      // controller users/admin trả {data: {...}}; profile.users/:id có thể trả trực tiếp; hỗ trợ cả 2
      return (res?.data as PublicUserProfile) || (res as PublicUserProfile);
    },
  });
};

