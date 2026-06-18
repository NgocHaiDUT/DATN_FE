/**
 * Utility functions to translate DB enum values using the i18n system.
 *
 * Example:
 *   const { t } = useI18n();
 *   <span>{getPayoutStatusLabel(req.status, t)}</span>
 */

import type { TranslationKey } from './translations';

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

// Payout status: pending | approved | paid | rejected
export function getPayoutStatusLabel(status: string, t: TFn): string {
  const key = `status.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}

// Order status: pending | confirmed | processing | shipped | delivered | cancelled | refunded
export function getOrderStatusLabel(status: string, t: TFn): string {
  const key = `orderStatus.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}

// Product moderation: pending | approved | rejected
export function getModerationStatusLabel(status: string, t: TFn): string {
  const key = `products.moderationStatus.${status}` as TranslationKey;
  try { return t(key); } catch { return status; }
}
