import type { IDashboardRepository } from '../../domain/repositories';
import type { DashboardStats, RevenueTrend, ProductCategory } from '../../domain/entities';
import { DashboardApi } from '../api/dashboardApi';
import { mapDashboardStatsDtoToEntity, type DashboardStatsDTO } from '../api/mappers';

/**
 * DashboardRepositoryImpl implements IDashboardRepository using DashboardApi
 */
export class DashboardRepositoryImpl implements IDashboardRepository {
  private api: DashboardApi;

  constructor(api: DashboardApi) {
    this.api = api;
  }

  /**
   * Fetches dashboard statistics and maps to entity
   */
  async getStats(): Promise<DashboardStats> {
    const fallback: DashboardStatsDTO = {
      total_users: 24568,
      user_growth: 12.5,
      active_sellers: 1247,
      seller_growth: 8.3,
      total_products: 15892,
      product_growth: 23.1,
    };

    try {
      const dto = (await this.api.getStats()) as DashboardStatsDTO;
      if (dto) {
        return mapDashboardStatsDtoToEntity(dto);
      }
    } catch (error) {
      console.warn('DashboardApi.getStats failed, falling back to mock data', error);
    }

    return mapDashboardStatsDtoToEntity(fallback);
  }

  /**
   * Fetches revenue trend data
   */
  async getRevenueTrend(): Promise<RevenueTrend[]> {
    const fallback: RevenueTrend[] = [
      { month: 'Jan', revenue: 95000 },
      { month: 'Feb', revenue: 102000 },
      { month: 'Mar', revenue: 88000 },
      { month: 'Apr', revenue: 118000 },
      { month: 'May', revenue: 128000 },
      { month: 'Jun', revenue: 132000 },
    ];

    try {
      const data = await this.api.getRevenueTrend();
      if (Array.isArray(data)) {
        return data as RevenueTrend[];
      }
    } catch (error) {
      console.warn('DashboardApi.getRevenueTrend failed, falling back to mock data', error);
    }

    return fallback;
  }

  /**
   * Fetches product category distribution
   */
  async getProductCategories(): Promise<ProductCategory[]> {
    const fallback: ProductCategory[] = [
      { category: 'Lipstick', value: 45, color: '#EC4899' },
      { category: 'Foundation', value: 30, color: '#A855F7' },
      { category: 'Eyeshadow', value: 15, color: '#3B82F6' },
      { category: 'Skincare', value: 10, color: '#F59E0B' },
    ];

    try {
      const data = await this.api.getProductCategories();
      if (Array.isArray(data)) {
        return data as ProductCategory[];
      }
    } catch (error) {
      console.warn('DashboardApi.getProductCategories failed, falling back to mock data', error);
    }

    return fallback;
  }
}
