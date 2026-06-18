/**
 * Utility functions to translate DB enum values using the i18n system.
 * Use these inside components that have access to the useI18n() hook.
 *
 * Example:
 *   const { t } = useI18n();
 *   <Badge>{getOrderStatusLabel(order.status, t)}</Badge>
 */

import type { TranslationKey } from './translations';

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

// Order status from DB: pending | confirmed | processing | shipped | delivered | cancelled | refunded
export function getOrderStatusLabel(status: string, t: TFn): string {
  const key = `orderStatus.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}

// Payout status from DB: pending | approved | paid | rejected
export function getPayoutStatusLabel(status: string, t: TFn): string {
  const key = `payoutStatus.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}

// Transaction type from DB: credit_sale | debit_payout | debit_refund | credit_refund_payout
export function getTxTypeLabel(type: string, t: TFn): { label: string; color: string } {
  const colorMap: Record<string, string> = {
    credit_sale: 'text-emerald-600',
    debit_payout: 'text-rose-600',
    debit_refund: 'text-amber-600',
    credit_refund_payout: 'text-blue-600',
  };
  const key = `txType.${type}` as TranslationKey;
  try {
    return { label: t(key), color: colorMap[type] || 'text-slate-600' };
  } catch {
    return { label: type, color: 'text-slate-600' };
  }
}

// Product moderation status: pending | approved | rejected
export function getModerationStatusLabel(status: string, t: TFn): string {
  const key = `moderationStatus.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}
