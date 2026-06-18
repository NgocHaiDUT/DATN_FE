import type { DashboardStats, RevenueTrend, ProductCategory } from '../entities';

/**
 * IDashboardRepository defines the contract for dashboard data access
 */
export interface IDashboardRepository {
  /**
   * Fetches dashboard statistics
   */
  getStats(): Promise<DashboardStats>;

  /**
   * Fetches revenue trend data for the last 6 months
   */
  getRevenueTrend(): Promise<RevenueTrend[]>;

  /**
   * Fetches product category distribution
   */
  getProductCategories(): Promise<ProductCategory[]>;
}
