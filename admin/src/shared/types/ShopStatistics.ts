import type { Order } from './Order';

/**
 * Top selling product statistics
 */
export interface TopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

/**
 * Revenue trend data point
 */
export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

/**
 * Shop statistics aggregated data
 */
export interface ShopStatistics {
  /** Shop ID */
  shopId: string;
  /** Total revenue (completed orders only) */
  totalRevenue: number;
  /** Total number of orders */
  totalOrders: number;
  /** Number of completed orders */
  completedOrders: number;
  /** Number of pending orders */
  pendingOrders: number;
  /** Number of cancelled orders */
  cancelledOrders: number;
  /** Average order value */
  averageOrderValue: number;
  /** Top selling products */
  topProducts: TopProduct[];
  /** Recent orders */
  recentOrders: Order[];
  /** Revenue trend (last 30 days) */
  revenueTrend?: RevenueTrendPoint[];
}
