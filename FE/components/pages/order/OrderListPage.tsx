"use client";

import { useMyOrders, useCancelOrder, useConfirmOrderReceived } from "@/features/order/useOrder";
import {
    Package,
    ChevronRight,
    Calendar,
    Clock,
    AlertCircle,
    ShoppingBag,
    Loader2,
    CheckCircle2,
    XCircle,
    Truck,
    CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n/I18nContext";

const ORDER_STATUSES = [
    { labelKey: 'orderStatus.all', value: "all" },
    { labelKey: 'orderStatus.pending', value: "pending" },
    { labelKey: 'orderStatus.confirmed', value: "confirmed" },
    { labelKey: 'orderStatus.processing', value: "processing" },
    { labelKey: 'orderStatus.shipped', value: "shipped" },
    { labelKey: 'orderStatus.delivered', value: "delivered" },
    { labelKey: 'orderStatus.cancelled', value: "cancelled" },
];

export default function OrderListPage() {
    const router = useRouter();
    const { t } = useI18n();
    const [status, setStatus] = useState("all");
    const { data: orders, isLoading } = useMyOrders({ status: status === "all" ? undefined : status });
    const cancelOrderMutation = useCancelOrder();
    const confirmReceivedMutation = useConfirmOrderReceived();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">{t('orderStatus.pending')}</Badge>;
            case "confirmed":
                return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{t('orderStatus.confirmed')}</Badge>;
            case "processing":
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">{t('orderStatus.processing')}</Badge>;
            case "shipped":
                return <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200">{t('orderStatus.shipped')}</Badge>;
            case "delivered":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">{t('orderStatus.delivered')}</Badge>;
            case "cancelled":
                return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{t('orderStatus.cancelled')}</Badge>;
            case "refunded":
                return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">{t('orderStatus.refunded')}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm(t('orders.cancelConfirm'))) return;
        try {
            await cancelOrderMutation.mutateAsync(orderId);
            toast.success(t('orders.cancelSuccess'));
        } catch (error: any) {
            toast.error(error.message || t('orders.cancelError'));
        }
    };

    const handleConfirmReceived = async (orderId: number) => {
        if (!confirm("Bạn xác nhận đã nhận được hàng?")) return;
        try {
            await confirmReceivedMutation.mutateAsync(orderId);
            if (status === "shipped") {
                setStatus("delivered");
            }
            toast.success("Đã xác nhận nhận hàng. Bạn có thể đánh giá sản phẩm.");
        } catch (error: any) {
            toast.error(error.message || "Không thể xác nhận nhận hàng");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-12 pt-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Package className="h-8 w-8 text-pink-500" />
                            {t('orders.title')}
                        </h1>
                        <p className="text-slate-500 mt-1">{t('orders.subtitle')}</p>
                    </div>
                    <Button onClick={() => router.push("/shop")} variant="outline" className="rounded-full border-slate-200 shadow-sm">
                        <ShoppingBag className="h-4 w-4 mr-2" /> {t('orders.continueShopping')}
                    </Button>
                </div>

                <Tabs value={status} className="mb-8" onValueChange={setStatus}>
                    <TabsList className="bg-white p-1 h-auto rounded-full shadow-sm border border-slate-100 flex-wrap justify-center sm:justify-start">
                        {ORDER_STATUSES.map((s) => (
                            <TabsTrigger
                                key={s.value}
                                value={s.value}
                                className="rounded-full px-6 py-2.5 data-[state=active]:bg-pink-500 data-[state=active]:text-white transition-all"
                            >
                                {t(s.labelKey as any)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                        <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-4" />
                        <p className="text-slate-400 font-medium">{t('orders.loading')}</p>
                    </div>
                ) : orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order: any) => (
                            <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                                <div className={`h-1.5 w-full ${order.status === 'pending' ? 'bg-amber-400' :
                                    order.status === 'shipped' ? 'bg-blue-400' :
                                        order.status === 'delivered' ? 'bg-emerald-400' :
                                            (order.status === 'processing' || order.status === 'confirmed') ? 'bg-indigo-400' : 'bg-slate-300'
                                    }`} />
                                <CardContent className="p-0">
                                    <div className="p-6">
                                        {/* Order Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                                                    <Package className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">{t('orders.orderNum', { id: order.id })}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(order.status)}
                                                <div className="mt-2 font-black text-xl text-slate-900 tracking-tight">
                                                    {formatPrice(Number(order.total_amount))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Items Preview */}
                                        <div className="space-y-4 mb-6">
                                            {order.order_items?.map((item: any) => (
                                                <div key={item.id} className="flex gap-4 items-center">
                                                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                                                        <img
                                                            src={resolveMediaUrl(item.product?.product_media?.[0]?.url) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200'}
                                                            alt={item.product?.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-slate-800 truncate text-sm">{item.product?.name || item.name_snapshot}</h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">Phân loại: {item.variant_snapshot || 'Mặc định'}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-sm font-bold text-slate-900">{formatPrice(Number(item.unit_price))}</span>
                                                            <span className="text-xs text-slate-400">x{item.quantity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Info Bar */}
                                        <div className="bg-slate-50/80 rounded-2xl p-4 flex flex-wrap gap-6 items-center border border-slate-100/50">
                                            <div className="flex items-center gap-2.5">
                                                <Truck className="h-4 w-4 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-600">Giao hàng tận nơi</span>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <CreditCard className="h-4 w-4 text-slate-400" />
                                                <span className="text-xs font-medium text-slate-600 capitalize">
                                                    {(() => {
                                                        const method = order.payments?.[0]?.provider || order.payments?.[0]?.method || order.payment_method || 'cod';
                                                        return method === 'vnpay' ? 'Thanh toán trực tuyến (VNPAY)' : 'Thanh toán COD';
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="ml-auto flex gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-full text-slate-500 hover:text-slate-900"
                                                    onClick={() => router.push(`/order/${order.id}`)}
                                                >
                                                    Chi tiết
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                                {order.status === 'pending' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        disabled={cancelOrderMutation.isPending}
                                                    >
                                                        {cancelOrderMutation.isPending ? t('common.processing') : t('orders.cancelOrder')}
                                                    </Button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                                        onClick={() => handleConfirmReceived(order.id)}
                                                        disabled={confirmReceivedMutation.isPending}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        {confirmReceivedMutation.isPending ? t('common.processing') : "Đã nhận hàng"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden p-12 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="h-12 w-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('orders.empty')}</h2>
                        <p className="text-slate-400 mb-8 max-w-xs mx-auto">{t('orders.emptyDesc')}</p>
                        <Button
                            onClick={() => router.push("/shop")}
                            className="rounded-full bg-slate-900 hover:bg-slate-800 px-8 h-12 font-bold"
                        >
                            {t('orders.continueShopping')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
