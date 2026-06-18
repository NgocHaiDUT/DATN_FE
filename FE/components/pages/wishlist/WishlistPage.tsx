"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Heart,
    Trash2,
    ShoppingBag,
    ArrowLeft,
    Loader2,
    Search,
    ShoppingBasket
} from "lucide-react";
import { useWishlist } from "@/features/shop/useWishlist";
import { resolveMediaUrl } from "@/lib/media";
import { ProductCard } from "@/components/common/ProductCard";
import { useI18n } from "@/lib/i18n/I18nContext";

export function WishlistPage() {
    const router = useRouter();
    const { wishlist, isLoading, removeFromWishlist, isRemoving } = useWishlist();
    const { t } = useI18n();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
        );
    }

    if (!wishlist || wishlist.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Heart className="h-10 w-10 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('wishlist.empty')}</h2>
                    <p className="text-gray-500 mb-8">{t('wishlist.emptyDesc')}</p>
                    <Button
                        onClick={() => router.push("/shop")}
                        className="bg-pink-600 hover:bg-pink-700"
                    >
                        {t('wishlist.browse')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/shop")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {t('wishlist.back')}
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">{t('wishlist.title', { count: wishlist.length })}</h1>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/cart")}
                        className="hidden md:flex"
                    >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        {t('wishlist.cart')}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlist.map((item) => (
                        <div key={item.id} className="relative group">
                            <ProductCard product={item.product} />

                            {/* Remove button overlay or footer */}
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 w-8 shadow-md"
                                onClick={() => removeFromWishlist(item.product.id as number)}
                                disabled={isRemoving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
