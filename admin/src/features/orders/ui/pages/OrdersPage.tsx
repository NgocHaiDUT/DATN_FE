import React, { useEffect, useMemo, useState } from 'react';
import { useOrders } from '../../hooks';
import type { OrderStatus, PaymentMethod } from '../../domain/entities/Order';
import { OrdersFilters, OrdersTable } from '../components';
import { useI18n } from '../../../../shared/i18n/I18nContext';

export interface OrdersPageProps {
  onOrderClick?: (orderId: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onOrderClick }) => {
  const { t } = useI18n();
  const itemsPerPage = 10;
  const { orders, total, loading, error, setFilters, updateOrderStatus } = useOrders({
    page: 1,
    limit: itemsPerPage,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [shopFilter, setShopFilter] = useState<'all' | string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [shopOptions, setShopOptions] = useState<Array<{ value: string; label: string }>>([]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }),
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const apiBase = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    fetch(`${apiBase}/shop/list?limit=100`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load shops')))
      .then((payload) => {
        setShopOptions((payload.data || []).map((shop: any) => ({
          value: String(shop.id),
          label: shop.name,
        })));
      })
      .catch(() => setShopOptions([]));
  }, []);

  useEffect(() => {
    setFilters({
      page: currentPage,
      limit: itemsPerPage,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      shopId: shopFilter === 'all' ? undefined : shopFilter,
      paymentMethod: paymentFilter === 'all' ? undefined : paymentFilter,
      dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : undefined,
    });
  }, [currentPage, dateFrom, dateTo, itemsPerPage, paymentFilter, search, setFilters, shopFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, shopFilter, paymentFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / itemsPerPage);
  const pageRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingCount = orders.filter((order) => order.status === 'pending').length;
  const completedCount = orders.filter((order) => order.status === 'delivered').length;

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setShopFilter('all');
    setPaymentFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('orders.title')}</h1>
          <p className="text-gray-600">{t('orders.subtitle')}</p>
        </div>
        <button
          type="button"
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium shadow-sm hover:from-pink-600 hover:to-purple-700"
        >
          {t('orders.create')}
        </button>
      </div>

      <OrdersFilters
        search={search}
        status={statusFilter}
        shopId={shopFilter}
        paymentMethod={paymentFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        shopOptions={shopOptions}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onShopChange={setShopFilter}
        onPaymentMethodChange={setPaymentFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onReset={handleResetFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t('orders.pageOrders')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
          <p className="text-xs text-gray-400 mt-1">{t('orders.ofTotal', { count: total })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t('orders.pageRevenue')}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {currencyFormatter.format(pageRevenue)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm text-gray-500">{t('orders.statusOverview')}</p>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <p className="text-xs text-gray-500">{t('orderStatus.pending')}</p>
              <p className="text-xl font-semibold text-gray-900">{pendingCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('orderStatus.delivered')}</p>
              <p className="text-xl font-semibold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error.message}
          </div>
        )}

        <OrdersTable
          orders={orders}
          loading={loading}
          onOrderClick={onOrderClick}
          onStatusChange={handleStatusChange}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              {t('common.prev')}
            </button>
            <p className="text-sm text-gray-500">
              {t('common.page', { page: currentPage, total: totalPages })}
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-50"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
