import React from 'react';
import type { OrderStatus } from '../../domain/entities/Order';
import { useI18n } from '../../../../shared/i18n/I18nContext';
import { getOrderStatusLabel } from '../../../../shared/i18n/statusUtils';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  processing: 'bg-blue-50 text-blue-700 border border-blue-200',
  shipped: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
  refunded: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const { t } = useI18n();

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}>
      {getOrderStatusLabel(status, t)}
    </span>
  );
};
