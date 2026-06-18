import type { DashboardStats } from '../../domain/entities/DashboardStats';

/**
 * DashboardStatsDTO represents the data transfer object for dashboard stats from API
 */
export interface DashboardStatsDTO {
  total_users: number;
  user_growth: number;
  active_sellers: number;
  seller_growth: number;
  total_products: number;
  product_growth: number;
}

/**
 * Maps DashboardStatsDTO to DashboardStats entity
 */
export const mapDashboardStatsDtoToEntity = (dto: DashboardStatsDTO): DashboardStats => ({
  totalUsers: dto.total_users,
  userGrowth: dto.user_growth,
  activeSellers: dto.active_sellers,
  sellerGrowth: dto.seller_growth,
  totalProducts: dto.total_products,
  productGrowth: dto.product_growth,
});
