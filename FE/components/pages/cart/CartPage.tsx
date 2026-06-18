"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
    Heart,
    ArrowLeft,
    Truck,
    Shield,
    CreditCard,
    Tag,
    Store,
    Verified,
    Loader2,
    Sparkles
} from "lucide-react";
import { useCart } from "@/features/shop/useCart";
import { useAddresses } from "@/features/address/useAddress";
import { resolveMediaUrl } from "@/lib/media";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useCalculateShipping } from "@/features/order/useOrder";

export function CartPage() {
    const router = useRouter();
    const { t } = useI18n();
    const { cart, isLoading, updateQuantity, removeFromCart, isUpdating, isRemoving } = useCart();
    const { data: addresses } = useAddresses();
    const calculateShippingMutation = useCalculateShipping();

    const [promoCode, setPromoCode] = useState("");
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
    const [shippingFee, setShippingFee] = useState(0);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

    // Flatten items for easier access
    const allItems = useMemo(() => cart?.flatMap(group => group.items) || [], [cart]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price || 0);
    };

    // Selection Handlers
    const toggleItemSelection = (itemId: number) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const toggleShopSelection = (shopId: number, itemIds: number[]) => {
        const allShopSelected = itemIds.every(id => selectedItemIds.includes(id));
        if (allShopSelected) {
            setSelectedItemIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedItemIds(prev => [...new Set([...prev, ...itemIds])]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedItemIds.length === allItems.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(allItems.map(item => item.id));
        }
    };

    const handleCheckout = () => {
        if (selectedItemIds.length === 0) return;
        const params = new URLSearchParams();
        params.append("items", selectedItemIds.join(","));
        router.push(`/checkout?${params.toString()}`);
    };

    // Derived Calculations based on selections
    const selectedItems = useMemo(() =>
        allItems.filter(item => selectedItemIds.includes(item.id)),
        [allItems, selectedItemIds]
    );

    const subtotal = useMemo(() =>
        selectedItems.reduce((sum: number, item: any) => sum + (Number(item.price_snapshot || item.product.price) * item.quantity), 0),
        [selectedItems]
    );

    const defaultAddress = useMemo(() =>
        addresses?.find(a => a.is_default) || addresses?.[0],
        [addresses]
    );

    // Calculate real shipping fee
    useEffect(() => {
        if (!defaultAddress || selectedItems.length === 0) {
            setShippingFee(0);
            return;
        }

        const triggerCalc = async () => {
            setIsCalculatingShipping(true);
            try {
                const response = await calculateShippingMutation.mutateAsync({
                    shipping_address_id: defaultAddress.id,
                    items: selectedItems.map(item => ({
                        variant_id: item.variant_id || item.variant?.id || 0,
                        quantity: item.quantity
                    }))
                });

                const totalFee = typeof response === 'number' ? response : (response?.total_shipping_fee || 0);
                setShippingFee(totalFee);
            } catch (error) {
                console.error("Shipping calc error:", error);
                setShippingFee(0);
            } finally {
                setIsCalculatingShipping(false);
            }
        };

        const timer = setTimeout(triggerCalc, 400);
        return () => clearTimeout(timer);
    }, [defaultAddress?.id, JSON.stringify(selectedItems.map(i => ({ id: i.id, q: i.quantity })))]);

    const total = subtotal + shippingFee;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (!cart || cart.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <ShoppingBag className="h-10 w-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
                    <p className="text-gray-500 mb-8">{t('cart.emptyDesc')}</p>
                    <Button
                        onClick={() => router.push("/shop")}
                        className="bg-pink-600 hover:bg-pink-700"
                    >
                        {t('cart.continueShopping')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/shop")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('cart.keepShopping')}
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">{t('cart.title', { count: allItems.length })}</h1>
                    </div>

                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                        <Checkbox
                            id="select-all"
                            checked={selectedItemIds.length === allItems.length && allItems.length > 0}
                            onCheckedChange={toggleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            {t('cart.selectAll', { count: allItems.length })}
                        </label>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((group) => {
                            const shopItemIds = group.items.map((i: any) => i.id);
                            const isShopSelected = shopItemIds.every((id: number) => selectedItemIds.includes(id));

                            return (
                                <Card key={group.shop?.id || 'unknown'} className="overflow-hidden border-none shadow-sm">
                                    <CardHeader className="bg-white border-b px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isShopSelected}
                                                    onCheckedChange={() => toggleShopSelection(group.shop?.id || 0, shopItemIds)}
                                                />
                                                <Avatar className="h-8 w-8 border">
                                                    <AvatarImage src={resolveMediaUrl(group.shop?.logo_url)} />
                                                    <AvatarFallback>{group.shop?.name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 cursor-pointer hover:underline" onClick={() => router.push(`/shop/${group.shop?.slug}`)}>
                                                        <Store className="h-4 w-4" />
                                                        {group.shop?.name}
                                                        <Verified className="h-4 w-4 text-blue-500" />
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 divide-y">
                                        {group.items.map((item: any) => (
                                            <div key={item.id} className="p-6 flex gap-6 bg-white hover:bg-slate-50 transition-colors">
                                                {/* Selection Checkbox */}
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        checked={selectedItemIds.includes(item.id)}
                                                        onCheckedChange={() => toggleItemSelection(item.id)}
                                                    />
                                                </div>

                                                {/* Image */}
                                                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100 cursor-pointer" onClick={() => router.push(`/product/${item.product.id}`)}>
                                                    <img
                                                        src={resolveMediaUrl(item.product.image)}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex flex-1 flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between">
                                                            <h4 className="font-medium text-gray-900 cursor-pointer hover:text-pink-600 line-clamp-2 flex items-center gap-1.5" onClick={() => router.push(`/product/${item.product.id}`)}>
                                                                {item.product.name}
                                                                {item.product.hasTryOn && (
                                                                    <span title={t('cart.aiTryOn')}>
                                                                        <Sparkles className="h-4 w-4 text-pink-500 fill-pink-50" />
                                                                    </span>
                                                                )}
                                                            </h4>
                                                            <span className="font-bold text-gray-900 ml-4">
                                                                {formatPrice(item.price_snapshot || item.product.price)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-500">{item.selectedVariant?.name || t('cart.defaultVariant')}</p>

                                                    </div>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="flex items-center border rounded-md bg-white">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-none"
                                                                disabled={item.quantity <= 1 || isUpdating}
                                                                onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity - 1 })}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-none"
                                                                disabled={isUpdating}
                                                                onClick={() => updateQuantity({ itemId: item.id, quantity: item.quantity + 1 })}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => removeFromCart(item.id)}
                                                            disabled={isRemoving}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm sticky top-24">
                            <CardHeader className="bg-white border-b">
                                <CardTitle className="text-lg">{t('cart.orderSummary')}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4 bg-white">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('cart.subtotal', { count: selectedItems.length })}</span>
                                        <span className="font-medium">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">{t('cart.shipping')}</span>
                                        <span className="font-medium text-green-600">
                                            {isCalculatingShipping ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                selectedItems.length === 0 ? "0₫" : (shippingFee === 0 ? t('cart.shippingFree') : formatPrice(shippingFee))
                                            )}
                                        </span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-base font-bold">
                                        <span>{t('cart.total')}</span>
                                        <span className="text-pink-600">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Input placeholder={t('cart.promoPlaceholder')} value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                    <Button variant="outline">{t('cart.apply')}</Button>
                                </div>

                                <Button
                                    className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg"
                                    disabled={selectedItems.length === 0}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    {t('cart.checkout', { count: selectedItems.length })}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Security Badges */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white p-3 rounded-lg shadow-sm">
                                <Shield className="h-5 w-5 text-green-500" />
                                <span>{t('cart.securePayment')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white p-3 rounded-lg shadow-sm">
                                <Truck className="h-5 w-5 text-blue-500" />
                                <span>{t('cart.freeDelivery')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
