import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export type DashboardPeriod = "today" | "week" | "month" | "year" | "custom";

type DashboardOverviewOptions = {
  period?: DashboardPeriod;
  startDate?: string;
  endDate?: string;
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

export const useDashboardOverview = (
  shopId?: number,
  options: DashboardOverviewOptions = {}
) => {
  const { period = "month", startDate, endDate } = options;
  const isCustomPeriod = period === "custom";
  const analyticsParams = {
    period,
    startDate: isCustomPeriod ? startDate : undefined,
    endDate: isCustomPeriod ? endDate : undefined,
  };

  return useQuery({
    queryKey: ["dashboard-overview", shopId, analyticsParams],
    enabled: !!shopId && (!isCustomPeriod || Boolean(startDate && endDate)),
    queryFn: async () => {
      const [
        overview,
        salesTrends,
        topProducts,
        engagement,
        stockAlerts,
        notifications,
      ] = await Promise.all([
        apiClient(
          `${ENDPOINTS.ANALYTICS.OVERVIEW(shopId!)}${buildQueryString(analyticsParams)}`
        ),
        apiClient(
          `${ENDPOINTS.ANALYTICS.SALES_TRENDS(shopId!)}${buildQueryString({ ...analyticsParams, limit: 6 })}`
        ),
        apiClient(
          `${ENDPOINTS.ANALYTICS.TOP_PRODUCTS(shopId!)}${buildQueryString({ ...analyticsParams, limit: 5 })}`
        ),
        apiClient(
          `${ENDPOINTS.ANALYTICS.ENGAGEMENT(shopId!)}${buildQueryString(analyticsParams)}`
        ),
        apiClient(
          `${ENDPOINTS.ANALYTICS.STOCK_ALERTS(shopId!)}${buildQueryString({ threshold: 10 })}`
        ),
        apiClient(
          `${ENDPOINTS.ANALYTICS.NOTIFICATIONS(shopId!)}${buildQueryString({ limit: 4, type: "all" })}`
        ),
      ]);

      return {
        overview,
        salesTrends: salesTrends?.data ?? [],
        topProducts: topProducts?.data ?? [],
        engagement,
        stockAlerts,
        notifications: notifications?.data ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
