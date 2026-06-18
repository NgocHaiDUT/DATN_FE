// Domain exports
export type { DashboardStats, RevenueTrend, ProductCategory } from './domain/entities';
export type { IDashboardRepository } from './domain/repositories';

// Use cases exports
export { GetDashboardStatsUseCase, GetRevenueTrendUseCase, GetProductCategoriesUseCase } from './usecases';

// Data layer exports
export { DashboardRepositoryImpl } from './data/repositories';
export { DashboardApi } from './data/api';

// Hooks exports
export { useDashboard } from './hooks';

// UI exports
export { DashboardPage } from './ui/pages';
export { StatCard, RevenueChart, ProductCategoryChart } from './ui/components';
export type { StatCardProps, RevenueChartProps, ProductCategoryChartProps } from './ui/components';
