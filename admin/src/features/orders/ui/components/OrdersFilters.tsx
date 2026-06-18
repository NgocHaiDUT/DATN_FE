import React from 'react';
import type { OrderStatus, PaymentMethod } from '../../domain/entities/Order';
import { useI18n } from '../../../../shared/i18n/I18nContext';

export interface OrdersFiltersProps {
  search: string;
  status: 'all' | OrderStatus;
  shopId: 'all' | string;
  paymentMethod: 'all' | PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  shopOptions: Array<{ value: string; label: string }>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | OrderStatus) => void;
  onShopChange: (value: 'all' | string) => void;
  onPaymentMethodChange: (value: 'all' | PaymentMethod) => void;
  onDateFromChange: (value?: string) => void;
  onDateToChange: (value?: string) => void;
  onReset: () => void;
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  search,
  status,
  shopId,
  paymentMethod,
  dateFrom,
  dateTo,
  shopOptions,
  onSearchChange,
  onStatusChange,
  onShopChange,
  onPaymentMethodChange,
  onDateFromChange,
  onDateToChange,
  onReset,
}) => {
  const { t } = useI18n();
  const statusOptions: Array<{ value: 'all' | OrderStatus; label: string }> = [
    { value: 'all', label: t('orders.allStatuses') },
    { value: 'pending', label: t('orderStatus.pending') },
    { value: 'confirmed', label: t('orderStatus.confirmed') },
    { value: 'processing', label: t('orderStatus.processing') },
    { value: 'shipped', label: t('orderStatus.shipped') },
    { value: 'delivered', label: t('orderStatus.delivered') },
    { value: 'cancelled', label: t('orderStatus.cancelled') },
    { value: 'refunded', label: t('orderStatus.refunded') },
  ];
  const paymentOptions: Array<{ value: 'all' | PaymentMethod; label: string }> = [
    { value: 'all', label: t('orders.allPayments') },
    { value: 'cod', label: t('orders.payment.cod') },
    { value: 'vnpay', label: t('orders.payment.vnpay') },
    { value: 'wallet', label: t('orders.payment.wallet') },
  ];

  return (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1">
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('orders.search')}</label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
          />
        </div>
      </div>
      <div className="lg:w-48">
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('common.status')}</label>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as 'all' | OrderStatus)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:w-48">
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('common.shop')}</label>
        <select
          value={shopId}
          onChange={(event) => onShopChange(event.target.value as 'all' | string)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
        >
          <option value="all">{t('orders.allShops')}</option>
          {shopOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="lg:w-48">
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('orders.payment')}</label>
        <select
          value={paymentMethod}
          onChange={(event) => onPaymentMethodChange(event.target.value as 'all' | PaymentMethod)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('orders.fromDate')}</label>
        <input
          type="date"
          value={dateFrom ?? ''}
          onChange={(event) => onDateFromChange(event.target.value || undefined)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 block mb-2">{t('orders.toDate')}</label>
        <input
          type="date"
          value={dateTo ?? ''}
          onChange={(event) => onDateToChange(event.target.value || undefined)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-pink-500 focus:border-pink-500 text-sm"
        />
      </div>
      <div className="flex items-end justify-end">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('orders.resetFilters')}
        </button>
      </div>
    </div>
  </div>
  );
};
