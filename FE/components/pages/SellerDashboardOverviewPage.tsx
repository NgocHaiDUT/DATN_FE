"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
    MessageSquare,
    Package,
    CheckCircle,
    Loader2,
    Users,
    Star
} from "lucide-react";
import { useShop, useShopDetails } from "@/features/shop/useShop";
import { useDashboardOverview, type DashboardPeriod } from "@/features/seller/useDashboardOverview";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { useI18n } from "@/lib/i18n/I18nContext";

const formatDateInputValue = (date: Date) => {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
};

export function SellerDashboardOverviewPage() {
    const { shop, isLoading: isLoadingShop, error } = useShop();
    const { data: shopDetails } = useShopDetails(shop?.id || 0);
    const { t } = useI18n();
    const today = formatDateInputValue(new Date());
    const defaultStartDate = useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() - 29);
        return formatDateInputValue(date);
    }, []);
    const [period, setPeriod] = useState<DashboardPeriod>("month");
    const [customStartDate, setCustomStartDate] = useState(defaultStartDate);
    const [customEndDate, setCustomEndDate] = useState(today);
    const dashboardOptions = useMemo(
        () =>
            period === "custom"
                ? { period, startDate: customStartDate, endDate: customEndDate }
                : { period },
        [customEndDate, customStartDate, period]
    );
    const { data, isLoading, error: dashboardError, refetch } = useDashboardOverview(shop?.id, dashboardOptions);

    const handlePeriodChange = (value: string) => {
        setPeriod(value as DashboardPeriod);
    };

    const handleStartDateChange = (value: string) => {
        setCustomStartDate(value);
        if (value > customEndDate) {
            setCustomEndDate(value);
        }
    };

    const handleEndDateChange = (value: string) => {
        setCustomEndDate(value);
        if (value < customStartDate) {
            setCustomStartDate(value);
        }
    };

    // Extract data from hook response
    // Backend returns: { overview: { overview: {...}, growth: {...} }, salesTrends: {...}, ... }
    const overviewData = data?.overview?.overview || null;
    const growthData = data?.overview?.growth || null;
    const salesTrends = data?.salesTrends || [];
    const topProducts = data?.topProducts || [];
    const engagement = data?.engagement?.engagement || data?.engagement || null;
    const stockAlerts = data?.stockAlerts || null;
    const notifications = data?.notifications || [];

    // Combine overview and growth for easier access
    const overview = overviewData ? { ...overviewData, growth: growthData } : null;


    const loading = isLoading;
    const loadError = dashboardError?.message || null;

    const formatCurrency = (amount: number | undefined) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatTimeAgo = (date: string | Date | undefined) => {
        if (!date) return '';
        const now = new Date();
        const created = new Date(date);
        const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return t('seller.dashboard.justNow');
        if (diffInMinutes < 60) return t('seller.dashboard.minutesAgo', { n: diffInMinutes });

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return t('seller.dashboard.hoursAgo', { n: diffInHours });

        const diffInDays = Math.floor(diffInHours / 24);
        return t('seller.dashboard.daysAgo', { n: diffInDays });
    };

    return (
        <div className="space-y-6">
            {/* Welcome section */}
            <div className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] rounded-lg p-6 text-white relative overflow-hidden">
                {/* Background image if cover_url exists */}
                {shop?.cover_url && (
                    <ImageWithFallback
                        src={shop.cover_url}
                        alt="Shop cover"
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                    />
                )}
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        {shop?.logo_url ? (
                            <ImageWithFallback
                                src={shop.logo_url}
                                alt="Shop logo"
                                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
                                <span className="text-2xl font-bold text-white">
                                    {shop?.name?.split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2) || 'BS'}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">
                                {t('seller.dashboard.welcome', { name: shop?.name || t('seller.dashboard.shopDefault') })} 🌟
                            </h1>
                            {shop?.is_verified && (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-300" />
                                    <span className="text-sm text-green-300">{t('seller.dashboard.verified')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-white/90">
                        {shop?.description || t('seller.dashboard.shopDefault')}
                    </p>

                    {/* Shop Stats from Controller */}
                    {shopDetails?.data && (
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/90 bg-white/10 p-3 rounded-lg backdrop-blur-sm w-fit">
                            <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
                                <Package className="w-4 h-4" />
                                <span className="font-semibold">{shopDetails.data.product_count}</span> {t('seller.dashboard.products')}
                            </div>
                            <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{shopDetails.data.staff_count}</span> {t('seller.dashboard.staff')}
                            </div>
                            <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
                                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                <span className="font-semibold">{shopDetails.data.avg_rating || 0}</span> {t('seller.dashboard.rating')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{shopDetails.data.follower_count || 0}</span> {t('seller.dashboard.followers')}
                            </div>
                        </div>
                    )}

                    {(isLoadingShop || loading) && (
                        <div className="mt-2 text-white/70 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('seller.dashboard.loading')}
                        </div>
                    )}
                    {(error || loadError) && (
                        <div className="mt-2 text-red-200 text-sm">Lỗi: {error?.message || loadError}</div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-xs lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">{t('seller.dashboard.period')}</p>
                    <p className="text-xs text-gray-500">{t('seller.dashboard.periodSelected', { period: t(`seller.dashboard.period.${period}`) })}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-full sm:w-[170px]" aria-label={t('seller.dashboard.period')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">{t('seller.dashboard.period.today')}</SelectItem>
                            <SelectItem value="week">{t('seller.dashboard.period.week')}</SelectItem>
                            <SelectItem value="month">{t('seller.dashboard.period.month')}</SelectItem>
                            <SelectItem value="year">{t('seller.dashboard.period.year')}</SelectItem>
                            <SelectItem value="custom">{t('seller.dashboard.period.custom')}</SelectItem>
                        </SelectContent>
                    </Select>
                    {period === "custom" && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input
                                aria-label={t('seller.dashboard.startDate')}
                                className="sm:w-[150px]"
                                max={customEndDate}
                                type="date"
                                value={customStartDate}
                                onChange={(event) => handleStartDateChange(event.target.value)}
                            />
                            <Input
                                aria-label={t('seller.dashboard.endDate')}
                                className="sm:w-[150px]"
                                min={customStartDate}
                                max={today}
                                type="date"
                                value={customEndDate}
                                onChange={(event) => handleEndDateChange(event.target.value)}
                            />
                        </div>
                    )}
                    <Button variant="outline" onClick={() => refetch()} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {t('seller.dashboard.refresh')}
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('seller.dashboard.revenue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm text-gray-500">{t('seller.dashboard.loading')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{formatCurrency(overview?.totalRevenue || 0)}</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className={overview?.growth?.revenue > 0 ? "text-green-600" : "text-red-600"}>
                                        {overview?.growth?.revenue > 0 ? '+' : ''}{overview?.growth?.revenue?.toFixed(1) || 0}%
                                    </span> {t('seller.dashboard.prevMonth')}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('seller.dashboard.orders')}</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm text-gray-500">{t('seller.dashboard.loading')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{overview?.totalOrders || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    <span className={overview?.growth?.orders > 0 ? "text-green-600" : "text-red-600"}>
                                        {overview?.growth?.orders > 0 ? '+' : ''}{overview?.growth?.orders?.toFixed(1) || 0}%
                                    </span> {t('seller.dashboard.prevMonth')}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('seller.dashboard.avgOrder')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm text-gray-500">{t('seller.dashboard.loading')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{formatCurrency(overview?.averageOrderValue || 0)}</div>
                                <p className="text-xs text-muted-foreground">{t('seller.dashboard.perOrder')}</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('seller.dashboard.stockAlert')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm text-gray-500">{t('seller.dashboard.loading')}</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-orange-500">
                                    {(stockAlerts?.summary?.lowStockCount || 0) + (stockAlerts?.summary?.outOfStockCount || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stockAlerts?.summary?.outOfStockCount > 0 && t('seller.dashboard.outOfStock', { count: stockAlerts.summary.outOfStockCount })}
                                    {stockAlerts?.summary?.lowStockCount > 0 && stockAlerts?.summary?.outOfStockCount > 0 && ', '}
                                    {stockAlerts?.summary?.lowStockCount > 0 && t('seller.dashboard.lowStock', { count: stockAlerts.summary.lowStockCount })}
                                    {!stockAlerts?.summary?.lowStockCount && !stockAlerts?.summary?.outOfStockCount && t('seller.dashboard.allInStock')}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trends Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('seller.dashboard.salesTrend')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#c27aff]" />
                            </div>
                        ) : salesTrends.length > 0 ? (
                            <div className="space-y-4">
                                {salesTrends.map((trend: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{trend.label}</p>
                                            <p className="text-xs text-gray-500">{t('seller.dashboard.ordersUnit', { count: trend.orders })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-[#c27aff]">{formatCurrency(trend.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                                <div className="text-center">
                                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">{t('seller.dashboard.noSalesTrend')}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Customer Engagement */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('seller.dashboard.engagement')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#c27aff]" />
                            </div>
                        ) : engagement ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#c27aff]" />
                                        <span className="text-sm font-medium">{t('seller.dashboard.newFollowers')}</span>
                                    </div>
                                    <span className="text-sm font-bold">{engagement.newFollowers || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#fb64b6]" />
                                        <span className="text-sm font-medium">{t('seller.dashboard.productLikes')}</span>
                                    </div>
                                    <span className="text-sm font-bold">{engagement.totalLikes || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#8b5cf6]" />
                                        <span className="text-sm font-medium">{t('seller.dashboard.comments')}</span>
                                    </div>
                                    <span className="text-sm font-bold">{engagement.totalComments || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-[#f472b6]" />
                                        <span className="text-sm font-medium">{t('seller.dashboard.newConversations')}</span>
                                    </div>
                                    <span className="text-sm font-bold">{engagement.newConversations || 0}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className="text-gray-500">{t('seller.dashboard.noEngagement')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Selling Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('seller.dashboard.topProducts')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#c27aff]" />
                            </div>
                        ) : topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.map((product: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#c27aff]/20 to-[#fb64b6]/20 flex items-center justify-center">
                                                {product.product?.product_media?.[0]?.url ? (
                                                    <ImageWithFallback
                                                        src={product.product.product_media[0].url}
                                                        alt={product.product.name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-5 h-5 text-[#c27aff]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{product.product?.name || t('seller.orders.products')}</p>
                                                <p className="text-xs text-gray-500">{t('seller.dashboard.sold', { count: product.totalQuantity || product.totalSales })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(product.totalRevenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="text-center">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">{t('seller.dashboard.noTopProducts')}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Notifications */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('seller.dashboard.recentActivity')}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => refetch()}>
                            {t('seller.dashboard.refresh')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#c27aff]" />
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="space-y-4">
                                {notifications.map((notification: any) => (
                                    <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${notification.type === 'order' ? 'bg-green-500' :
                                            notification.type === 'message' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                            }`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{notification.title}</p>
                                            <p className="text-sm text-gray-600">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notification.createdAt)}</p>
                                        </div>
                                        {notification.type === 'order' && (
                                            <Badge variant="default" className="text-xs bg-green-500">{t('seller.dashboard.newBadge')}</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">{t('seller.dashboard.noActivity')}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
