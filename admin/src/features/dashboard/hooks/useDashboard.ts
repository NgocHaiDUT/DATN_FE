import { useState, useEffect } from 'react';
import type { DashboardStats, RevenueTrend, ProductCategory } from '../domain/entities';
import { DashboardRepositoryImpl } from '../data/repositories';
import { DashboardApi } from '../data/api';
import {
  GetDashboardStatsUseCase,
  GetRevenueTrendUseCase,
  GetProductCategoriesUseCase,
} from '../usecases';
import { useAuth } from '../../auth';

/**
 * useDashboard hook provides dashboard data and loading states
 */
export const useDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrend[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize repository and use cases
        const api = new DashboardApi(token);
        const repository = new DashboardRepositoryImpl(api);
        
        const statsUseCase = new GetDashboardStatsUseCase(repository);
        const revenueTrendUseCase = new GetRevenueTrendUseCase(repository);
        const categoriesUseCase = new GetProductCategoriesUseCase(repository);

        // Fetch all data in parallel
        const [statsData, revenueData, categoriesData] = await Promise.all([
          statsUseCase.execute(),
          revenueTrendUseCase.execute(),
          categoriesUseCase.execute(),
        ]);

        setStats(statsData);
        setRevenueTrend(revenueData);
        setProductCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  return {
    stats,
    revenueTrend,
    productCategories,
    loading,
    error,
  };
};
