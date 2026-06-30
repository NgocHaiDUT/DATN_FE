"use client";

import { useOrderDetails, useVnpayUrl, useCreateReturnRequest, useConfirmOrderReceived, useTrackGhnOrder } from "@/features/order/useOrder";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    ChevronLeft,
    Package,
    Calendar,
    Clock,
    MapPin,
    Truck,
    CreditCard,
    ShieldCheck,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Store,
    Phone,
    Mail,
    AlertCircle,
    Info,
    ShoppingBag,
    ArrowRight,
    RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import { ReviewForm } from "@/components/reviews/ReviewForm";

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = Number(params.id);
    const { data: orderResponse, isLoading } = useOrderDetails(orderId);
    const getVnpayUrlMutation = useVnpayUrl();
    const createReturnRequestMutation = useCreateReturnRequest();
    const confirmReceivedMutation = useConfirmOrderReceived();
    const trackGhnOrderMutation = useTrackGhnOrder();
    const [isRetrying, setIsRetrying] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: number, name: string, image: string } | null>(null);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [trackingData, setTrackingData] = useState<any>(null);

    const handleOpenReview = (item: any) => {
        if (!item.product) return;
        setSelectedProduct({
            id: Number(item.product.id),
            name: item.product.name || item.name_snapshot,
            image: item.product.product_media?.[0]?.url || item.product.image || ""
        });
        setReviewModalOpen(true);
    };

    const order = orderResponse?.order || orderResponse;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price || 0);
    };

    const handleRetryPayment = async () => {
        setIsRetrying(true);
        try {
            const res = await getVnpayUrlMutation.mutateAsync(orderId);
            if (res?.paymentUrl) {
                window.location.href = res.paymentUrl;
            } else {
                toast.error("Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Retry payment error:", error);
            toast.error("Có lỗi xảy ra khi tạo liên kết thanh toán.");
        } finally {
            setIsRetrying(false);
        }
    };

    const handleSubmitReturn = async () => {
        if (!returnReason.trim()) {
            toast.error("Vui lòng nhập lý do trả hàng");
            return;
        }
        try {
            await createReturnRequestMutation.mutateAsync({ order_id: orderId, reason: returnReason });
            toast.success("Yêu cầu trả hàng đã được gửi!");
            setReturnDialogOpen(false);
            setReturnReason("");
        } catch (err: any) {
            toast.error(err?.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
        }
    };

    const handleTrackOrder = async () => {
        try {
            const data = await trackGhnOrderMutation.mutateAsync(orderId);
            setTrackingData(data);
        } catch (error: any) {
            toast.error(error?.message || "Khong the tai thong tin van chuyen");
        }
    };

    const handleConfirmReceived = async () => {
        if (!confirm("Bạn xác nhận đã nhận được hàng?")) return;
        try {
            await confirmReceivedMutation.mutateAsync(orderId);
            toast.success("Đã xác nhận nhận hàng. Bạn có thể đánh giá sản phẩm.");
        } catch (error: any) {
            toast.error(error?.message || "Không thể xác nhận nhận hàng");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Chờ xác nhận</Badge>;
            case "confirmed":
                return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đã xác nhận</Badge>;
            case "processing":
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">Đang chuẩn bị</Badge>;
            case "shipped":
                return <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200">Đang giao hàng</Badge>;
            case "delivered":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Đã giao hàng</Badge>;
            case "cancelled":
                return <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">Đã hủy</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
                    <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-sm max-w-md mx-auto">
                    <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-slate-500 mb-6">Đơn hàng #{orderId} không tồn tại hoặc bạn không có quyền truy cập.</p>
                    <Button onClick={() => router.push("/order")} className="w-full rounded-full bg-slate-900 group">
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    const paymentMethod = order.payments?.[0]?.provider || order.payments?.[0]?.method || order.payment_method || 'cod';
    const isUnpaidVnpay = paymentMethod === 'vnpay' && order.payment_status !== 'paid';
    const trackingLogs = Array.isArray(trackingData?.log) ? trackingData.log : [];
    const trackingStatus = trackingData?.status || trackingData?.status_name || trackingData?.converted_status;
    const formatTrackingDate = (value?: string) => {
        if (!value) return "";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-20 pt-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đơn hàng #{order.id}</h1>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(order.created_at).toLocaleDateString("vi-VN")}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(order.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Panel: Info & Tracking */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Info Card */}
                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                            <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-bold">Thông tin vận chuyển</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900">{order.shipping_address?.receiver_name || order.shipping_address?.recipient}</span>
                                            <span className="text-sm font-medium text-slate-500">{order.shipping_address?.phone}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {order.shipping_address?.street}, {order.shipping_address?.ward}, {order.shipping_address?.district}, {order.shipping_address?.province}
                                        </p>
                                    </div>
                                </div>

                                {order.ghn_order_code && (
                                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mã vận đơn GHN</p>
                                                <p className="text-sm font-mono font-bold text-slate-900">{order.ghn_order_code}</p>
                                                {order.ghn_expected_delivery_time && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-medium whitespace-nowrap">
                                                        <Calendar className="h-3 w-3" />
                                                        Dự kiến giao: {new Date(order.ghn_expected_delivery_time).toLocaleDateString("vi-VN")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleTrackOrder}
                                            disabled={trackGhnOrderMutation.isPending}
                                            className="text-xs font-bold text-pink-500 p-0 hover:bg-transparent"
                                        >
                                            {trackGhnOrderMutation.isPending ? (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            ) : null}
                                            Theo dõi <ChevronLeft className="h-3 w-3 ml-1 rotate-180" />
                                        </Button>
                                    </div>
                                )}

                                {trackingData && (
                                    <div className="rounded-2xl border border-slate-100 bg-white p-4">
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-slate-400">Trang thai van chuyen</p>
                                                <p className="text-sm font-bold text-slate-900">{trackingStatus || "Dang cap nhat"}</p>
                                            </div>
                                            {trackingData.expected_delivery_time && (
                                                <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100">
                                                    Du kien: {new Date(trackingData.expected_delivery_time).toLocaleDateString("vi-VN")}
                                                </Badge>
                                            )}
                                        </div>

                                        {trackingLogs.length > 0 ? (
                                            <div className="space-y-3">
                                                {trackingLogs.map((log: any, index: number) => (
                                                    <div key={`${log.status || "log"}-${log.updated_date || index}`} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-pink-500" : "bg-slate-300"}`} />
                                                            {index < trackingLogs.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                                                        </div>
                                                        <div className="pb-3">
                                                            <p className="text-sm font-semibold text-slate-800">{log.status || "Cap nhat"}</p>
                                                            {(log.reason || log.description) && (
                                                                <p className="text-xs text-slate-500 mt-0.5">{log.reason || log.description}</p>
                                                            )}
                                                            <p className="text-[11px] text-slate-400 mt-1">{formatTrackingDate(log.updated_date)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">Chua co lich su van chuyen tu GHN.</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Items Card */}
                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                            <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center gap-3">
                                <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-bold">Danh sách sản phẩm</CardTitle>
                                <Badge className="ml-auto bg-slate-100 text-slate-500 border-none">{order.order_items?.length || 0}</Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Shop Header */}
                                {order.shop && (
                                    <div className="px-6 py-4 bg-slate-50/50 flex items-center gap-3 border-b border-slate-100">
                                        <Store className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-bold text-slate-700">{order.shop.name}</span>
                                        {order.shop.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 font-bold" />}
                                    </div>
                                )}

                                <div className="divide-y divide-slate-100 px-6">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="py-6 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                                                <img
                                                    src={resolveMediaUrl(item.product?.product_media?.[0]?.url) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300'}
                                                    alt={item.product?.name || item.name_snapshot}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <h4 className="font-bold text-slate-900 group-hover:text-pink-600 transition-colors">{item.product?.name || item.name_snapshot}</h4>
                                                <p className="text-xs text-slate-400 mt-1">Phân loại: {item.variant_snapshot || 'Mặc định'}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900">{formatPrice(Number(item.unit_price))}</span>
                                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-bold">x{item.quantity}</span>
                                                    </div>
                                                    <span className="font-black text-slate-900">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                                                </div>
                                                {order.status === 'delivered' && (
                                                    <div className="mt-3 flex justify-end">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-pink-600 border-pink-200 hover:bg-pink-50"
                                                            onClick={() => handleOpenReview(item)}
                                                        >
                                                            Viết đánh giá
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {order.note && (
                                    <div className="p-4 m-4 mt-0 bg-amber-50 rounded-2xl border border-amber-100/50 flex gap-3">
                                        <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-0.5">Lưu ý cho shop</p>
                                            <p className="text-sm text-amber-800 italic">"{order.note}"</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Panel: Payment Summary */}
                    <div className="space-y-6">
                        {/* Payment Method Card */}
                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                            <CardHeader className="bg-white border-b border-slate-50 py-4 flex flex-row items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-base font-bold">Thanh toán</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500 font-medium">Phương thức</span>
                                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-100 text-slate-600 px-3 py-1 font-bold">
                                        {paymentMethod === 'vnpay' ? 'Thẻ/QR VNPAY' : 'Tiền mặt (COD)'}
                                    </Badge>
                                </div>
                                <Separator className="my-4 bg-slate-50" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Trạng thái</span>
                                    <span className={`font-bold ${order.payment_status === 'paid' ? 'text-emerald-500' :
                                        order.payment_status === 'failed' ? 'text-red-500' : 'text-amber-500'
                                        }`}>
                                        {order.payment_status === 'paid' ? 'Đã thanh toán' :
                                            order.payment_status === 'failed' ? 'Thanh toán lỗi' : 'Chờ thanh toán'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Card */}
                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl sticky top-24">
                            <CardHeader className="bg-slate-900 py-6">
                                <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-widest mb-1">Tổng quan chi phí</p>
                                <h3 className="text-white text-xl font-black tracking-tight">{formatPrice(order.total_amount)}</h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tiền hàng</span>
                                        <span className="font-bold text-slate-900">{formatPrice(Number(order.subtotal_amount ?? (Number(order.total_amount) + Number(order.discount_amount || 0) - Number(order.shipping_fee || 0))))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Phí vận chuyển</span>
                                        <span className="font-bold text-slate-900">{formatPrice(Number(order.shipping_fee))}</span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Giảm giá</span>
                                            <span className="font-bold text-emerald-500">-{formatPrice(Number(order.discount_amount))}</span>
                                        </div>
                                    )}
                                    <Separator className="bg-slate-50 mt-4" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-slate-900">Tổng cộng</span>
                                        <span className="text-2xl font-black text-pink-600 tracking-tight">{formatPrice(Number(order.total_amount))}</span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <div className="bg-emerald-50 p-4 rounded-2xl flex items-start gap-3 border border-emerald-100/50 mb-4">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                            Beauty Market bảo vệ mọi giao dịch của bạn. Tiền chỉ được chuyển cho người bán khi bạn hài lòng với sản phẩm.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {isUnpaidVnpay && (
                                            <Button
                                                onClick={handleRetryPayment}
                                                disabled={isRetrying}
                                                className="w-full h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-base font-bold shadow-lg shadow-pink-200 mb-2"
                                            >
                                                {isRetrying ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                ) : (
                                                    <CreditCard className="h-5 w-5 mr-2" />
                                                )}
                                                Thanh toán ngay
                                                {!isRetrying && <ArrowRight className="h-5 w-5 ml-2" />}
                                            </Button>
                                        )}
                                        {order.status === "shipped" && (
                                            <Button
                                                type="button"
                                                onClick={handleConfirmReceived}
                                                disabled={confirmReceivedMutation.isPending}
                                                className="w-full h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold shadow-lg shadow-emerald-100 mb-2"
                                            >
                                                {confirmReceivedMutation.isPending ? (
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                                )}
                                                Đã nhận được hàng
                                            </Button>
                                        )}
                                        {order.status === "delivered" && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setReturnDialogOpen(true)}
                                                className="w-full h-12 rounded-full border-amber-300 text-amber-700 hover:bg-amber-50 font-bold"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Yêu cầu trả hàng
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => router.push('/chat')}
                                            className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 font-bold"
                                        >
                                            Liên hệ Shop
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push('/order')}
                                            className="w-full h-12 rounded-full border-slate-200 font-bold text-slate-600"
                                        >
                                            Quay lại danh sách
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Return Request Dialog */}
            {returnDialogOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Yêu cầu trả hàng</h3>
                        <p className="text-sm text-slate-500 mb-4">Vui lòng mô tả lý do bạn muốn trả hàng cho đơn #{orderId}.</p>
                        <textarea
                            rows={4}
                            placeholder="Ví dụ: Sản phẩm bị lỗi, không đúng màu..."
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-full"
                                onClick={() => { setReturnDialogOpen(false); setReturnReason(""); }}
                            >
                                Hủy
                            </Button>
                            <Button
                                className="flex-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                                onClick={handleSubmitReturn}
                                disabled={createReturnRequestMutation.isPending}
                            >
                                {createReturnRequestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                                Gửi yêu cầu
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <ReviewForm
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    productImage={selectedProduct.image}
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    isVerifiedPurchase={true}
                />
            )}
        </div>
    );
}
