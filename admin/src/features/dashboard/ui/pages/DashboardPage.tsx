import React from 'react';
import { useDashboard } from '../../hooks';
import { StatCard, RevenueChart, ProductCategoryChart } from '../components';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * DashboardPage displays the main dashboard with stats, charts and analytics
 */
export const DashboardPage: React.FC = () => {
  const { stats, revenueTrend, productCategories, loading, error } = useDashboard();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('dashboard.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('dashboard.noData')}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-600">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={
            <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          title={t('dashboard.totalUsers')}
          value={stats.totalUsers}
          growth={stats.userGrowth}
          iconBgColor="bg-pink-50"
        />

        <StatCard
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          title={t('dashboard.activeShops')}
          value={stats.activeSellers}
          growth={stats.sellerGrowth}
          iconBgColor="bg-purple-50"
        />

        <StatCard
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          title={t('dashboard.totalProducts')}
          value={stats.totalProducts}
          growth={stats.productGrowth}
          iconBgColor="bg-blue-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RevenueChart data={revenueTrend} />
        </div>

        {/* Product Categories Chart - Takes 1 column */}
        <div className="lg:col-span-1">
          <ProductCategoryChart data={productCategories} />
        </div>
      </div>
    </div>
  );
};
