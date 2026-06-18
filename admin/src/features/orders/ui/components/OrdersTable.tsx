import React from 'react';
import type { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useI18n } from '../../../../shared/i18n/I18nContext';
import { getOrderStatusLabel } from '../../../../shared/i18n/statusUtils';

const statusOptions: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN');

export interface OrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onOrderClick?: (orderId: string) => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onOrderClick,
  onStatusChange,
}) => {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        {t('orders.loading')}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p className="text-lg font-semibold">{t('orders.empty')}</p>
        <p className="text-sm">{t('orders.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.colId')}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.colCustomer')}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.items')}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.colTotal')}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.colStatus')}</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('orders.payment')}</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-pink-50/40">
              <td className="px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">{order.id}</div>
                <div className="text-xs text-gray-500">{formatDate(order.orderDate)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                <div className="text-xs text-gray-500">#{order.customerId}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {order.items[0]?.productName ?? t('orders.noItems')}
                  {order.items.length > 1 && (
                    <span className="text-gray-500"> {t('orders.moreItems', { count: order.items.length - 1 })}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{t('orders.itemCount', { count: order.items.length })}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">{currency.format(order.total)}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-2">
                  <OrderStatusBadge status={order.status} />
                  {onStatusChange && (
                    <select
                      value={order.status}
                      onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
                      className="text-xs border-gray-200 rounded-lg focus:ring-pink-500 focus:border-pink-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {getOrderStatusLabel(status, t)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 capitalize">{order.paymentMethod ?? 'N/A'}</div>
              </td>
              <td className="px-6 py-4 text-right">
                {onOrderClick && (
                  <button
                    type="button"
                    onClick={() => onOrderClick(order.id)}
                    className="text-sm font-medium text-pink-600 hover:text-pink-700"
                  >
                    {t('orders.view')}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
