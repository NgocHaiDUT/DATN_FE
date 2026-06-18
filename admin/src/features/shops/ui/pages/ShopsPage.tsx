import React, { useState, useEffect } from 'react';
import { useShops } from '../../hooks/useShops';
import { ShopTable, Pagination } from '../components';
import { ShopRepositoryImpl } from '../../data/repositories/ShopRepositoryImpl';
import { useI18n } from '../../../../shared/i18n/I18nContext';

export interface ShopsPageProps {
  onShopClick?: (shopId: string) => void;
}

export const ShopsPage: React.FC<ShopsPageProps> = ({ onShopClick }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkCommissionPercent, setBulkCommissionPercent] = useState('3');
  const [bulkCommissionSaving, setBulkCommissionSaving] = useState(false);
  const [bulkCommissionMessage, setBulkCommissionMessage] = useState('');
  const [bulkCommissionSuccess, setBulkCommissionSuccess] = useState(false);
  const itemsPerPage = 10;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data: shops, total, loading, error, refetch } = useShops({ 
    page: currentPage, 
    limit: itemsPerPage, 
    search: debouncedSearch 
  });

  const totalActive = shops.filter((s) => s.isActive).length;
  const totalPending = shops.filter((s) => !s.isActive).length;
  const totalPages = Math.ceil(total / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyCommissionToAll = async () => {
    const nextPercent = Number(bulkCommissionPercent);
    if (!Number.isFinite(nextPercent) || nextPercent < 0 || nextPercent > 100) {
      setBulkCommissionMessage(t('shops.commissionRangeError'));
      setBulkCommissionSuccess(false);
      return;
    }

    const confirmed = window.confirm(
      t('shops.confirmApplyCommission', { percent: nextPercent })
    );
    if (!confirmed) return;

    try {
      setBulkCommissionSaving(true);
      setBulkCommissionMessage('');
      setBulkCommissionSuccess(false);
      const repo = new ShopRepositoryImpl();
      const result = await repo.updateAllCommissionRates(nextPercent / 100);
      setBulkCommissionMessage(t('shops.commissionUpdated', { count: result.updatedCount, percent: nextPercent }));
      setBulkCommissionSuccess(true);
      await refetch();
    } catch (err) {
      setBulkCommissionMessage(err instanceof Error ? err.message : t('shops.commissionUpdateError'));
      setBulkCommissionSuccess(false);
    } finally {
      setBulkCommissionSaving(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('shops.title')}</h1>
        <p className="text-gray-600">{t('shops.subtitle')}</p>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-start gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm"
              placeholder={t('shops.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
            <div className="min-w-[280px]">
              <label htmlFor="bulkCommissionPercent" className="block text-xs font-medium text-gray-500 uppercase mb-2">
                {t('shops.platformCommissionAll')}
              </label>
              <div className="flex gap-2">
                <div className="relative w-28">
                  <input
                    id="bulkCommissionPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={bulkCommissionPercent}
                    onChange={(event) => setBulkCommissionPercent(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
                <button
                  onClick={handleApplyCommissionToAll}
                  disabled={bulkCommissionSaving}
                  className="px-4 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60"
                >
                  {bulkCommissionSaving ? t('shops.applying') : t('shops.applyToAll')}
                </button>
              </div>
              {bulkCommissionMessage && (
                <p className={`mt-2 text-sm ${bulkCommissionSuccess ? 'text-green-600' : 'text-red-600'}`}>
                  {bulkCommissionMessage}
                </p>
              )}
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t('common.refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('dashboard.totalShops')}</p>
              <p className="text-3xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('shops.activeShops')}</p>
              <p className="text-3xl font-bold text-gray-900">{totalActive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{t('shops.pendingApproval')}</p>
              <p className="text-3xl font-bold text-gray-900">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-500">{t('shops.loading')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-red-800">{t('shops.errorFetching')}</div>
              <div className="text-sm text-red-600 mt-1">{error.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Table */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <ShopTable shops={shops} onShopClick={onShopClick} />
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {/* Empty State */}
          {shops.length === 0 && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500 font-medium">{t('shops.empty')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('shops.emptyHint')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
