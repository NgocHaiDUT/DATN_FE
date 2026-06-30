import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

type ShopOrdersData = {
  success?: boolean;
  orders?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  error?: string;
  status?: number;
  statusCode?: number;
};

type ShopOrdersSnapshot = Array<[readonly unknown[], ShopOrdersData | undefined]>;

const isFailedResponse = (res: any) => {
  return (
    res?.success === false ||
    Number(res?.status || res?.statusCode || 0) >= 400 ||
    Boolean(res?.error)
  );
};

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, value.toString());
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const useShopOrders = (
  shopId?: number,
  options?: { page?: number; limit?: number; status?: string }
) => {
  return useQuery({
    queryKey: ["shop-orders", shopId, options],
    enabled: !!shopId,
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        shopId: shopId!,
        page: options?.page || 1,
        limit: options?.limit || 10,
      };
      if (options?.status && options.status !== 'all') {
        params.status = options.status;
      }

      const res = await apiClient(
        `${ENDPOINTS.ORDERS.GET_ORDERS_BY_SHOP}${buildQueryString(params)}`
      );

      if (isFailedResponse(res)) {
        throw new Error(res?.message || res?.error || "Khong the tai danh sach don hang");
      }

      return res;
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: number;
      status: string;
    }) => {
      const res: any = await apiClient(ENDPOINTS.ORDERS.UPDATE_ORDER_STATUS(orderId), {
        method: "POST",
        body: JSON.stringify({ status }),
      });

      if (Number(res?.status || res?.statusCode || 0) >= 400 || (res?.error && !res?.success)) {
        throw new Error(res?.message || res?.error || "Khong the cap nhat trang thai don hang");
      }

      if (res?.success === false) {
        throw new Error(res.message || "Không thể cập nhật trạng thái đơn hàng");
      }

      return res;
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["shop-orders"] });

      const previousOrders = queryClient.getQueriesData<ShopOrdersData>({
        queryKey: ["shop-orders"],
      });

      queryClient.setQueriesData<ShopOrdersData>(
        { queryKey: ["shop-orders"] },
        (old) => {
          if (!old?.orders) return old;

          return {
            ...old,
            orders: old.orders.map((order: any) =>
              order.id === orderId
                ? {
                    ...order,
                    status,
                    updated_at: new Date().toISOString(),
                  }
                : order
            ),
          };
        }
      );

      return { previousOrders };
    },
    onError: (_error, _variables, context) => {
      const previousOrders = context?.previousOrders as ShopOrdersSnapshot | undefined;
      previousOrders?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      // Refetch in the background so server-side changes like shipments/payment stay in sync.
      queryClient.invalidateQueries({
        queryKey: ["shop-orders"],
      });
    },
  });
};

export const useOrderDetails = (orderId?: number) => {
  return useQuery({
    queryKey: ["order-details", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      return apiClient(ENDPOINTS.ORDERS.GET_ORDER_DETAILS(orderId!));
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

