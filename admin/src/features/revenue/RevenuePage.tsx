import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { useI18n } from '../../shared/i18n/I18nContext';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const PERIOD_OPTIONS = [
  { value: 'all', labelVi: 'Tất cả', labelEn: 'All time' },
  { value: 'today', labelVi: 'Hôm nay', labelEn: 'Today' },
  { value: 'week', labelVi: '7 ngày qua', labelEn: 'Last 7 days' },
  { value: 'month', labelVi: 'Tháng này', labelEn: 'This month' },
  { value: 'year', labelVi: 'Năm nay', labelEn: 'This year' },
];

const STATUS_CONFIG: Record<string, { labelVi: string; labelEn: string; color: string; bg: string }> = {
  pending: { labelVi: 'Chờ xác nhận', labelEn: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
  processing: { labelVi: 'Đang xử lý', labelEn: 'Processing', color: 'text-blue-700', bg: 'bg-blue-100' },
  shipped: { labelVi: 'Đang giao', labelEn: 'Shipped', color: 'text-purple-700', bg: 'bg-purple-100' },
  delivered: { labelVi: 'Hoàn thành', labelEn: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  cancelled: { labelVi: 'Đã hủy', labelEn: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100' },
};

interface RevenueData {
  summary: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    avgOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  revenueByPeriod: Array<{ label: string; revenue: number; orders: number }>;
  topShops: Array<{ id: number; name: string; revenue: number; orders: number }>;
  revenueByStatus: Array<{ status: string; revenue: number; count: number }>;
}

export function RevenuePage() {
  const { token } = useAuth();
  const { locale } = useI18n();
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isVi = locale !== 'en';

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(isVi ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/analytics/admin/revenue-details?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      setError(isVi ? 'Không thể tải dữ liệu doanh thu' : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [token, period, isVi]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">{isVi ? 'Đang tải...' : 'Loading...'}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const summary = data?.summary;
  const revenueByPeriod = data?.revenueByPeriod ?? [];
  const topShops = data?.topShops ?? [];
  const revenueByStatus = data?.revenueByStatus ?? [];

  const trendLabel =
    period === 'all'
      ? isVi ? 'Theo tháng (tất cả)' : 'By month (all time)'
      : period === 'today'
      ? isVi ? 'Theo giờ' : 'By hour'
      : period === 'year'
      ? isVi ? 'Theo tháng' : 'By month'
      : isVi ? 'Theo ngày' : 'By day';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isVi ? 'Thống kê doanh thu' : 'Revenue Analytics'}
          </h1>
          <p className="text-gray-500">
            {isVi ? 'Tổng quan doanh thu toàn nền tảng' : 'Platform-wide revenue overview'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === opt.value
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              {isVi ? opt.labelVi : opt.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <SummaryCard
          icon="💰"
          title={isVi ? 'Tổng doanh thu' : 'Total Revenue'}
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          badge={
            summary?.revenueGrowth !== undefined
              ? `${summary.revenueGrowth >= 0 ? '+' : ''}${summary.revenueGrowth.toFixed(1)}%`
              : undefined
          }
          badgePositive={(summary?.revenueGrowth ?? 0) >= 0}
          color="pink"
        />
        <SummaryCard
          icon="📦"
          title={isVi ? 'Tổng đơn hàng' : 'Total Orders'}
          value={(summary?.totalOrders ?? 0).toLocaleString()}
          badge={
            summary?.ordersGrowth !== undefined
              ? `${summary.ordersGrowth >= 0 ? '+' : ''}${summary.ordersGrowth.toFixed(1)}%`
              : undefined
          }
          badgePositive={(summary?.ordersGrowth ?? 0) >= 0}
          color="blue"
        />
        <SummaryCard
          icon="📊"
          title={isVi ? 'Giá trị TB/đơn' : 'Avg Order Value'}
          value={formatCurrency(summary?.avgOrderValue ?? 0)}
          color="purple"
        />
        <SummaryCard
          icon="✅"
          title={isVi ? 'Đơn hoàn thành' : 'Completed Orders'}
          value={(summary?.completedOrders ?? 0).toLocaleString()}
          sub={`${summary?.cancelledOrders ?? 0} ${isVi ? 'đơn đã hủy' : 'cancelled'}`}
          color="green"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isVi ? 'Biểu đồ doanh thu' : 'Revenue Chart'}
            </h2>
            <p className="text-sm text-gray-500">{trendLabel}</p>
          </div>
          <button
            onClick={fetchData}
            className="text-sm text-pink-500 hover:text-pink-700 font-medium"
          >
            {isVi ? 'Làm mới' : 'Refresh'}
          </button>
        </div>
        {revenueByPeriod.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {isVi ? 'Không có dữ liệu' : 'No data available'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className={revenueByPeriod.length > 20 ? 'min-w-[800px]' : 'min-w-[400px]'}>
              <BarChart data={revenueByPeriod} formatCurrency={formatCurrency} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: Status & Top Shops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isVi ? 'Doanh thu theo trạng thái' : 'Revenue by Status'}
          </h2>
          <div className="space-y-4">
            {revenueByStatus.map((item) => {
              const cfg = STATUS_CONFIG[item.status];
              const label = cfg ? (isVi ? cfg.labelVi : cfg.labelEn) : item.status;
              const colorClass = cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-100 text-gray-700';
              const pct =
                (summary?.totalRevenue ?? 0) > 0
                  ? (item.revenue / summary!.totalRevenue) * 100
                  : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass} min-w-[115px] text-center`}
                  >
                    {label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right min-w-[140px]">
                    <div className="text-sm font-semibold text-gray-800">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.count} {isVi ? 'đơn' : 'orders'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Shops */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isVi ? 'Top cửa hàng doanh thu cao' : 'Top Shops by Revenue'}
          </h2>
          {topShops.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {isVi ? 'Không có dữ liệu' : 'No data available'}
            </div>
          ) : (
            <div className="space-y-4">
              {topShops.map((shop, idx) => {
                const maxShopRevenue = topShops[0]?.revenue || 1;
                const pct = (shop.revenue / maxShopRevenue) * 100;
                const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
                return (
                  <div key={shop.id} className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold w-5 text-right ${
                        rankColors[idx] ?? 'text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate max-w-[160px]">
                          {shop.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                          {shop.orders} {isVi ? 'đơn' : 'orders'}
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 min-w-[110px] text-right shrink-0">
                      {formatCurrency(shop.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: string;
  title: string;
  value: string;
  badge?: string;
  badgePositive?: boolean;
  sub?: string;
  color: 'pink' | 'blue' | 'purple' | 'green';
}

const COLOR_MAP = {
  pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
};

function SummaryCard({ icon, title, value, badge, badgePositive, sub, color }: SummaryCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xl w-10 h-10 flex items-center justify-center rounded-xl ${c.bg} ${c.text}`}>
          {icon}
        </span>
        {badge !== undefined && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              badgePositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1 truncate">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

interface BarChartProps {
  data: Array<{ label: string; revenue: number; orders: number }>;
  formatCurrency: (n: number) => string;
}

function BarChart({ data, formatCurrency }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = data.length > 30 ? data.slice(-30) : data;
  const barMax = Math.max(...display.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-1 h-52 pt-8 relative">
      {display.map((item, idx) => {
        const pct = (item.revenue / barMax) * 100;
        const isHov = hovered === idx;
        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center relative"
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            {isHov && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                <div className="font-medium mb-0.5">{item.label}</div>
                <div className="font-semibold text-pink-300">{formatCurrency(item.revenue)}</div>
                <div className="text-gray-300">{item.orders} đơn</div>
              </div>
            )}
            <div className="w-full flex flex-col justify-end" style={{ height: 160 }}>
              <div
                className={`w-full rounded-t transition-all duration-200 ${
                  isHov
                    ? 'bg-gradient-to-t from-pink-600 to-purple-500'
                    : 'bg-gradient-to-t from-pink-400 to-purple-300'
                }`}
                style={{
                  height: item.revenue > 0 ? `${Math.max(pct, 1)}%` : '2px',
                  opacity: item.revenue === 0 ? 0.25 : 1,
                }}
              />
            </div>
            {display.length <= 16 && (
              <div className="text-xs text-gray-400 mt-1 truncate max-w-full text-center leading-none">
                {item.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
