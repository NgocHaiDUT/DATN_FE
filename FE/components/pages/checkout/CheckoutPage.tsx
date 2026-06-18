"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    MapPin,
    CreditCard,
    Truck,
    ShieldCheck,
    AlertCircle,
    Plus,
    CheckCircle2,
    Store,
    Loader2,
    Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/shop/useCart";
import { useAddresses } from "@/features/profile/useAddresses";
import { useCalculateShipping, useCreateOrder, useCreateOrderFromProduct, useMyVouchers, useVnpayUrl, useValidateCoupon, useUserWallet } from "@/features/order/useOrder";
import { resolveMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import { AddressDialog } from "@/components/common/address/AddressDialog";
import { useGetProductById } from "@/features/shop/usePublicShop";
import { useMe } from "@/features/auth/useMe";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function CheckoutPage() {
    const router = useRouter();
    const { t } = useI18n();
    const searchParams = useSearchParams();
    const { data: user } = useMe();
    const { items: allCartItems, isLoading: cartLoading } = useCart();
    const { data: addresses, isLoading: addressesLoading } = useAddresses();
    const calculateShippingMutation = useCalculateShipping();
    const createOrderMutation = useCreateOrder();
    const createOrderFromProductMutation = useCreateOrderFromProduct();

    const getVnpayUrlMutation = useVnpayUrl();

    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay" | "wallet">("cod");
    const [note, setNote] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const { data: walletRes } = useUserWallet();
    const walletBalance: number = (walletRes as any)?.data?.balance ?? (walletRes as any)?.balance ?? 0;
    const { data: vouchersRes } = useMyVouchers();
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code?: string; userVoucherId?: number; discountAmount: number; voucherType?: string; label?: string } | null>(null);
    const validateCouponMutation = useValidateCoupon();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Get selected items from URL
    const selectedItemIds = useMemo(() => {
        const items = searchParams.get("items");
        return items ? items.split(",").map(Number) : [];
    }, [searchParams]);

    // Direct Buy Now info
    const isBuyNow = searchParams.get("buyNow") === "true";
    const buyNowProductId = searchParams.get("productId");
    const buyNowVariantId = searchParams.get("variantId");
    const buyNowQuantity = Number(searchParams.get("quantity") || 1);

    const { data: buyNowProduct, isLoading: buyNowProductLoading } = useGetProductById(buyNowProductId!);

    // Filter items to checkout
    const checkoutItems = useMemo(() => {
        if (isBuyNow && buyNowProduct) {
            const selectedVariant = buyNowVariantId
                ? buyNowProduct.variants?.find((v: any) => v.id === Number(buyNowVariantId))
                : buyNowProduct.variants?.[0];

            return [{
                id: -1, // Temporary ID
                product: buyNowProduct,
                variant_id: selectedVariant?.id || null,
                selectedVariant: selectedVariant,
                quantity: buyNowQuantity,
                price_snapshot: selectedVariant ? Number(selectedVariant.price) : Number(buyNowProduct.price),
            }];
        }
        return allCartItems.filter(item => selectedItemIds.includes(item.id));
    }, [allCartItems, selectedItemIds, isBuyNow, buyNowProduct, buyNowVariantId, buyNowQuantity]);

    // Group items by shop for display
    const groupedItems = useMemo(() => {
        return checkoutItems.reduce((acc: any, item: any) => {
            const shopName = item.product?.seller?.name || "Beauty Shop";
            if (!acc[shopName]) {
                acc[shopName] = {
                    shop: item.product?.seller || { name: shopName },
                    items: [],
                };
            }
            acc[shopName].items.push(item);
            return acc;
        }, {} as Record<string, any>);
    }, [checkoutItems]);

    // Subtotal
    const subtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item: any) => sum + (item.price_snapshot * item.quantity), 0);
    }, [checkoutItems]);

    const allFreeShipping = useMemo(() => {
        return checkoutItems.length > 0 && checkoutItems.every((item: any) => item.product?.freeShipping === true);
    }, [checkoutItems]);

    // Calculate shipping when address changes
    useEffect(() => {
        if (addresses && addresses.length > 0 && selectedAddressId === null) {
            const defaultAddress = addresses.find(a => a.is_default) || addresses[0];
            setSelectedAddressId(defaultAddress.id);
        }
    }, [addresses, selectedAddressId]);

    const selectedAddress = useMemo(() => {
        return addresses?.find(a => a.id === selectedAddressId);
    }, [addresses, selectedAddressId]);

    const isAddressIncomplete = useMemo(() => {
        return selectedAddress && (!selectedAddress.ghn_district_id || !selectedAddress.ghn_ward_code);
    }, [selectedAddress]);

    const [shippingFee, setShippingFee] = useState(0);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    const total = Math.max(subtotal + shippingFee - (appliedCoupon?.discountAmount || 0), 0);
    const myVouchers = useMemo(() => {
        // Safely extract vouchers array from response
        let vouchers: any[] = [];
        
        if (Array.isArray((vouchersRes as any)?.data)) {
            vouchers = (vouchersRes as any).data;
        } else if (Array.isArray(vouchersRes)) {
            vouchers = vouchersRes;
        }
        
        return vouchers.filter((voucher) => voucher.status === "available");
    }, [vouchersRes]);

    // Calculate shipping when address or items change
    useEffect(() => {
        if (!selectedAddressId || checkoutItems.length === 0 || isAddressIncomplete) {
            setShippingFee(0);
            return;
        }

        // All items must have a valid variant_id before we can calculate shipping
        const allItemsHaveVariant = checkoutItems.every(item => item.variant_id != null);
        if (!allItemsHaveVariant) {
            setShippingFee(0);
            return;
        }

        // If all items qualify for free shipping, skip the API call
        const allFreeShipping = checkoutItems.every(item => item.product?.freeShipping === true);
        if (allFreeShipping) {
            setShippingFee(0);
            return;
        }

        const triggerShippingCalculation = async () => {
            setIsCalculatingShipping(true);
            try {
                const response = await calculateShippingMutation.mutateAsync({
                    shipping_address_id: selectedAddressId,
                    items: checkoutItems.map(item => ({
                        variant_id: item.variant_id!,
                        quantity: item.quantity
                    }))
                });

                // response is { total_shipping_fee: number, details: [...] }
                const fee = typeof response === 'number' ? response : (response?.total_shipping_fee || 0);
                setShippingFee(fee);
            } catch (error) {
                console.error("Failed to calculate shipping:", error);
                setShippingFee(0);
                toast.error("Không thể tính phí vận chuyển cho địa chỉ này");
            } finally {
                setIsCalculatingShipping(false);
            }
        };

        const timer = setTimeout(triggerShippingCalculation, 500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAddressId, selectedItemIds.join(','), isAddressIncomplete, isBuyNow ? (checkoutItems[0]?.variant_id ?? null) : null]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        try {
            const res: any = await validateCouponMutation.mutateAsync({
                code: couponCode.trim().toUpperCase(),
                subtotal,
                shipping_fee: shippingFee,
            });
            const discount = res?.data?.discount_amount ?? res?.discountAmount ?? res?.data?.discountAmount ?? 0;
            setAppliedCoupon({
                code: couponCode.trim().toUpperCase(),
                discountAmount: discount,
                voucherType: res?.data?.voucher_type,
                label: couponCode.trim().toUpperCase(),
            });
            toast.success(`Áp dụng mã giảm giá thành công! Giảm ${formatPrice(discount)}`);
        } catch (err: any) {
            toast.error(err?.message || "Mã giảm giá không hợp lệ");
            setAppliedCoupon(null);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
    };

    const handleApplyVoucher = async (voucher: any) => {
        try {
            const res: any = await validateCouponMutation.mutateAsync({
                user_voucher_id: voucher.id,
                subtotal,
                shipping_fee: shippingFee,
            });
            const discount = res?.data?.discount_amount ?? res?.discountAmount ?? res?.data?.discountAmount ?? 0;
            setAppliedCoupon({
                userVoucherId: voucher.id,
                code: res?.data?.code || voucher?.coupon?.code,
                discountAmount: discount,
                voucherType: res?.data?.voucher_type || voucher?.coupon?.voucher_type,
                label: voucher?.coupon?.description || voucher?.coupon?.code || "Voucher",
            });
            setCouponCode("");
            toast.success(`Da chon voucher, giam ${formatPrice(discount)}`);
        } catch (err: any) {
            toast.error(err?.message || "Voucher khong hop le");
            setAppliedCoupon(null);
        }
    };

    const handlePlaceOrder = async () => {
        // Prevent double submission
        if (isProcessing) {
            return;
        }

        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng");
            return;
        }

        if (paymentMethod === "wallet" && walletBalance < total) {
            toast.error(t('checkout.walletInsufficient'));
            return;
        }

        setIsProcessing(true);

        try {
            let response;
            if (isBuyNow) {
                const item = checkoutItems[0];
                response = await createOrderFromProductMutation.mutateAsync({
                    product_id: Number(buyNowProductId),
                    variant_id: item.variant_id,
                    quantity: buyNowQuantity,
                    shipping_address_id: selectedAddressId,
                    payment_method: paymentMethod,
                    note: note,
                    userId: user?.id,
                    coupon_code: appliedCoupon?.code,
                    user_voucher_id: appliedCoupon?.userVoucherId,
                });
            } else {
                const payload = {
                    shipping_address_id: selectedAddressId,
                    payment_method: paymentMethod as any,
                    note: note,
                    items: checkoutItems.map(item => ({
                        variant_id: item.variant_id!,
                        quantity: item.quantity
                    })),
                    coupon_code: appliedCoupon?.code,
                    user_voucher_id: appliedCoupon?.userVoucherId,
                };
                response = await createOrderMutation.mutateAsync(payload);
            }

            const result = (response as any).data || response;
            const orders = result.orders || [];
            const orderId = Array.isArray(orders) && orders.length > 0 ? orders[0].id : (result.id || result.orderId);

            if (paymentMethod === "vnpay") {
                let vnpayUrl = result.paymentUrl;

                // Fallback: if backend didn't return URL in order creation, fetch it manually
                if (!vnpayUrl && orderId) {
                    try {
                        const vnpayRes = await getVnpayUrlMutation.mutateAsync(orderId);
                        vnpayUrl = vnpayRes?.paymentUrl;
                    } catch (err) {
                        console.error("Failed to fetch VNPay URL fallback:", err);
                    }
                }

                if (vnpayUrl) {
                    toast.info(t('checkout.vnpayRedirecting'));
                    localStorage.removeItem("checkout_selected_items");
                    window.location.href = vnpayUrl;
                    return;
                }

                // VNPay URL not available, fallback with warning
                toast.error(t('checkout.vnpayError'));
                return;
            }

            // COD or wallet: order is confirmed immediately
            toast.success(t('checkout.orderSuccess'));
            router.push(`/order/success?id=${orderId}`);
        } catch (error: any) {
            console.error("Order failed:", error);
            const msg = error?.response?.message || error?.message || "Lỗi khi tạo đơn hàng";
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartLoading || addressesLoading || (isBuyNow && buyNowProductLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
                    <p className="text-slate-500 animate-pulse">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md mx-auto">
                    <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Không có sản phẩm nào</h2>
                    <p className="text-slate-500 mb-6">Vui lòng chọn sản phẩm từ giỏ hàng để tiếp tục thanh toán.</p>
                    <Button onClick={() => router.push("/cart")} className="w-full rounded-full">Quay lại giỏ hàng</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-20">
            {/* Top Navigation */}
            <div className="bg-white border-b sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-slate-900">{t('checkout.title')}</h1>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <span className="text-pink-600">Giỏ hàng</span>
                        <span>/</span>
                        <span className="text-slate-900">Thanh toán</span>
                        <span>/</span>
                        <span>Hoàn tất</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address Section */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-pink-500 to-purple-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-pink-500" />
                                    Địa chỉ nhận hàng
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-pink-600 hover:text-pink-700 font-medium h-auto p-0"
                                    onClick={() => router.push('/profile?tab=profile')}
                                >
                                    Quản lý
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {addresses && addresses.length > 0 ? (
                                    <div className="space-y-4">
                                        {addresses.map((addr) => (
                                            <div
                                                key={addr.id}
                                                onClick={() => setSelectedAddressId(addr.id)}
                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${selectedAddressId === addr.id
                                                    ? (addr.ghn_district_id && addr.ghn_ward_code ? 'border-pink-500 bg-pink-50/30' : 'border-amber-500 bg-amber-50/30')
                                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">{addr.receiver_name}</span>
                                                            <span className="text-slate-400">|</span>
                                                            <span className="text-slate-600">{addr.phone}</span>
                                                            {addr.is_default && (
                                                                <Badge className="bg-pink-100 text-pink-600 border-none text-[10px] py-0 px-1.5 h-4">Mặc định</Badge>
                                                            )}
                                                            {(!addr.ghn_district_id || !addr.ghn_ward_code) && (
                                                                <Badge className="bg-amber-100 text-amber-600 border-none text-[10px] py-0 px-1.5 h-4">Thiếu thông tin</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500 leading-relaxed">
                                                            {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                                        </p>
                                                        {(!addr.ghn_district_id || !addr.ghn_ward_code) && (
                                                            <p className="text-xs text-amber-600 font-medium mt-1">
                                                                * Địa chỉ này chưa được hỗ trợ tính phí vận chuyển. Vui lòng cập nhật.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {selectedAddressId === addr.id && (
                                                            <CheckCircle2 className={`h-5 w-5 ${addr.ghn_district_id && addr.ghn_ward_code ? 'text-pink-500' : 'text-amber-500'}`} />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-slate-400 hover:text-pink-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingAddress(addr);
                                                                setIsAddressDialogOpen(true);
                                                            }}
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="w-full border-dashed border-2 rounded-xl h-12 text-slate-600 hover:bg-slate-50"
                                            onClick={() => {
                                                setEditingAddress(null);
                                                setIsAddressDialogOpen(true);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Thêm địa chỉ mới
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-500 mb-4">Bạn chưa có địa chỉ giao hàng nào</p>
                                        <Button
                                            className="rounded-full bg-pink-600 hover:bg-pink-700"
                                            onClick={() => setIsAddressDialogOpen(true)}
                                        >
                                            Thêm địa chỉ ngay
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Address Dialog */}
                        <AddressDialog
                            open={isAddressDialogOpen}
                            onOpenChange={setIsAddressDialogOpen}
                            address={editingAddress}
                        />

                        {/* Order Items Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 px-1">Sản phẩm của bạn</h3>
                            {Object.entries(groupedItems).map(([shopName, group]: any) => (
                                <Card key={shopName} className="border-none shadow-sm overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 py-3 border-b">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-slate-400" />
                                            <span className="font-semibold text-slate-700">{shopName}</span>
                                            {group.shop?.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-100">
                                            {group.items.map((item: any) => (
                                                <div key={item.id} className="p-4 flex gap-4">
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                                        <img
                                                            src={resolveMediaUrl(item.product?.image || item.product?.images?.[0]) || '/assets/placeholder-product.svg'}
                                                            alt={item.product?.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/placeholder-product.svg'; }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-slate-900 truncate mb-1">{item.product?.name}</h4>
                                                        <p className="text-xs text-slate-500 mb-2">Phân loại: {item.selectedVariant?.name || 'Mặc định'}</p>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-slate-900">{formatPrice(item.price_snapshot)}</span>
                                                                <span className="text-slate-400 text-sm">x{item.quantity}</span>
                                                            </div>
                                                            <span className="font-semibold text-slate-900">{formatPrice(item.price_snapshot * item.quantity)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 bg-slate-50/30">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-4 w-4 text-slate-400 mt-1" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-500 mb-1.5 uppercase font-medium tracking-wider">Ghi chú cho cửa hàng</p>
                                                    <input
                                                        type="text"
                                                        placeholder="Lưu ý cho người bán (về màu sắc, size...)"
                                                        className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-slate-400"
                                                        onChange={(e) => setNote(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Checkout Summary */}
                    <div className="space-y-6">
                        {/* Payment Method Section */}
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                    Phương thức thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div
                                    onClick={() => setPaymentMethod("cod")}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-pink-500 bg-pink-50/30" : "border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${paymentMethod === "cod" ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-500"}`}>
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <span className={`font-medium ${paymentMethod === "cod" ? "text-slate-900" : "text-slate-600"}`}>Thanh toán khi nhận hàng (COD)</span>
                                    </div>
                                    {paymentMethod === "cod" && <CheckCircle2 className="h-5 w-5 text-pink-500" />}
                                </div>

                                <div
                                    onClick={() => setPaymentMethod("vnpay")}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "vnpay" ? "border-pink-500 bg-pink-50/30" : "border-slate-100 hover:border-slate-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${paymentMethod === "vnpay" ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-500"}`}>
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${paymentMethod === "vnpay" ? "text-slate-900" : "text-slate-600"}`}>Thanh toán trực tuyến</span>
                                            <span className="text-[10px] text-slate-400">Hỗ trợ QR-VNPay, Visa, MoMo...</span>
                                        </div>
                                    </div>
                                    {paymentMethod === "vnpay" && <CheckCircle2 className="h-5 w-5 text-pink-500" />}
                                </div>

                                <div
                                    onClick={() => setPaymentMethod("wallet")}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "wallet" ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 hover:border-slate-200"
                                        } ${walletBalance < total ? "opacity-60" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${paymentMethod === "wallet" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${paymentMethod === "wallet" ? "text-slate-900" : "text-slate-600"}`}>Thanh toán bằng ví</span>
                                            <span className="text-[10px] text-slate-400">
                                                Số dư: <span className={walletBalance >= total ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(walletBalance)}</span>
                                                {walletBalance < total && " — Không đủ số dư"}
                                            </span>
                                        </div>
                                    </div>
                                    {paymentMethod === "wallet" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Summary Section */}
                        <Card className="border-none shadow-sm overflow-hidden sticky top-32">
                            <CardHeader>
                                <CardTitle className="text-lg">Tóm tắt đơn hàng</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span>Tạm tính ({checkoutItems.length} sản phẩm)</span>
                                        <span className="font-semibold text-slate-900">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-sm">
                                        <span className="flex items-center gap-2">
                                            Tổng phí vận chuyển
                                            {allFreeShipping && (
                                                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">Miễn phí</Badge>
                                            )}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {isCalculatingShipping ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-pink-500 inline mr-1" />
                                            ) : (
                                                (shippingFee === 0 || allFreeShipping) ? "Miễn phí" : formatPrice(shippingFee)
                                            )}
                                        </span>
                                    </div>
                                    {appliedCoupon && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span className="flex items-center gap-1">
                                                Mã giảm giá
                                                <span className="font-mono bg-emerald-50 px-1 rounded text-xs">{appliedCoupon.label || appliedCoupon.code}</span>
                                            </span>
                                            <span className="font-semibold">-{formatPrice(appliedCoupon.discountAmount)}</span>
                                        </div>
                                    )}
                                    <Separator className="bg-slate-100" />
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-slate-900">Tổng thanh toán</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-pink-600 tracking-tight">{formatPrice(total)}</span>
                                            <p className="text-[10px] text-slate-400">(Đã bao gồm VAT nếu có)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    {/* Coupon Code */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mã giảm giá</p>
                                        {appliedCoupon ? (
                                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                                <span className="text-sm font-semibold text-emerald-700">{appliedCoupon.label || appliedCoupon.code}</span>
                                                <button onClick={handleRemoveCoupon} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Xóa</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã giảm giá"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                                                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleApplyCoupon}
                                                    disabled={validateCouponMutation.isPending || !couponCode.trim()}
                                                    className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50"
                                                >
                                                    {validateCouponMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Áp dụng"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    {myVouchers.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Voucher cua ban</p>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {myVouchers.map((voucher: any) => {
                                                    const coupon = voucher.coupon || {};
                                                    const selected = appliedCoupon?.userVoucherId === voucher.id;
                                                    const isShipping = coupon.voucher_type === "shipping";
                                                    return (
                                                        <button
                                                            key={voucher.id}
                                                            type="button"
                                                            onClick={() => handleApplyVoucher(voucher)}
                                                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                                                selected ? "border-pink-400 bg-pink-50" : "border-slate-200 hover:border-pink-200 hover:bg-pink-50/50"
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 text-pink-600">
                                                                    {isShipping ? <Truck className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                                        {coupon.description || coupon.code}
                                                                    </p>
                                                                    <p className="text-xs text-slate-500">
                                                                        {coupon.discount_type === "percentage"
                                                                            ? `Giam ${coupon.discount_value}%`
                                                                            : `Giam ${formatPrice(Number(coupon.discount_value || 0))}`}{" "}
                                                                        {isShipping ? "phi ship" : "don hang"}
                                                                    </p>
                                                                </div>
                                                                {selected && <CheckCircle2 className="h-4 w-4 text-pink-600" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-emerald-50 p-3 rounded-lg flex items-start gap-3">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
                                        <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                                            Thông tin cá nhân & thanh toán của bạn luôn được bảo mã hoá và bảo vệ an toàn tuyệt đối.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing || createOrderMutation.isPending || createOrderFromProductMutation.isPending || isCalculatingShipping || isAddressIncomplete}
                                        className="w-full h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-base font-bold shadow-lg shadow-pink-200"
                                    >
                                        {createOrderMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            "Đặt hàng ngay"
                                        )}
                                    </Button>

                                    <p className="text-[10px] text-center text-slate-400 px-4">
                                        Bằng việc nhấn đặt hàng, bạn đồng ý với các <span className="underline cursor-pointer">Điều khoản & Điều kiện</span> của Beauty Market.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Processing Modal */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16">
                            <Loader2 className="w-full h-full animate-spin text-pink-600" strokeWidth={1.5} />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-lg font-bold text-slate-900">Đang xử lý đơn hàng</p>
                            <p className="text-sm text-slate-500">Vui lòng không đóng cửa sổ này...</p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
