"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Heart, ShoppingBag, Verified, Minus, Plus, Loader2, Sparkles } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";
import type { Product } from "@/types/shop";
import { ROUTES } from "@/constants/routes";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useCart } from "@/features/shop/useCart";
import { useWishlist } from "@/features/shop/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductCardProps {
    product?: Product;
    viewMode?: "grid" | "list";
    onProductClick?: (product: Product) => void;
    onAddToCart?: (product: Product) => void;
    onToggleWishlist?: (product: Product) => void;
    skeleton?: boolean;
}

export function ProductCard({
    product,
    viewMode = "grid",
    onProductClick,
    onAddToCart,
    onToggleWishlist,
    skeleton = false,
}: ProductCardProps) {
    // Render skeleton placeholder
    if (skeleton) {
        return (
            <Card className={`group ${viewMode === "list" ? "flex" : ""} animate-pulse`}>
                <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                    <div className={`${viewMode === "list" ? "w-full h-full" : "w-full h-48"} bg-gray-100`} />
                </div>
                <CardContent className={`space-y-3 ${viewMode === "list" ? "flex-1 p-6" : "p-4"}`}>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-100 rounded w-1/3"></div>
                </CardContent>
            </Card>
        );
    }

    // Return null if no product data
    if (!product) {
        return null;
    }

    const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<any>(product?.variants?.[0] || null);
    const [quantity, setQuantity] = useState(1);
    const { addToCart, isAdding } = useCart();
    const { wishlist, addToWishlist: addToWishlistFn, removeFromWishlist: removeFromWishlistFn } = useWishlist();
    const { toast } = useToast();
    const user = useAuthStore((s) => s.user);
    const router = useRouter();

    const isInWishlist = wishlist?.some((item: any) => Number(item.product?.id) === Number(product.id)) ?? false;

    const handleProductClick = () => {
        if (onProductClick && product) {
            onProductClick(product);
        }
    };

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push("/login");
            return;
        }
        if (product.variants && product.variants.length > 0) {
            setIsCartDialogOpen(true);
        } else {
            addToCart({
                productId: Number(product.id),
                quantity: 1,
            });
            toast({ title: "Đã thêm vào giỏ hàng" });
        }
        if (onAddToCart) {
            onAddToCart(product);
        }
    };

    const handleConfirmAddToCart = () => {
        if (!user) {
            router.push("/login");
            setIsCartDialogOpen(false);
            return;
        }
        addToCart({
            productId: Number(product.id),
            quantity: quantity,
            variantId: selectedVariant?.id
        });
        toast({ title: `Đã thêm ${quantity} sản phẩm vào giỏ hàng` });
        setIsCartDialogOpen(false);
    };

    const handleToggleWishlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push("/login");
            return;
        }
        if (isInWishlist) {
            removeFromWishlistFn(Number(product.id));
        } else {
            addToWishlistFn(Number(product.id));
        }
        if (onToggleWishlist) {
            onToggleWishlist(product);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(price).replace(/\s₫/, '₫');
    };

    const productImage = product.image
        ? resolveMediaUrl(product.image)
        : product.first_image
            ? resolveMediaUrl(product.first_image)
            : product.images?.[0]
                ? resolveMediaUrl(product.images[0])
                : '';

    return (
        <Card
            className={`group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden ${viewMode === "list" ? "flex" : ""
                } ${!product.inStock ? "opacity-75" : ""}`}
            onClick={handleProductClick}
        >
            <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                {productImage ? (
                    <img
                        src={productImage}
                        alt={product.name}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${viewMode === "list" ? "w-full h-full" : "w-full h-48"
                            }`}
                    />
                ) : (
                    <div className={`bg-gray-100 flex items-center justify-center ${viewMode === "list" ? "w-full h-full" : "w-full h-48"}`}>
                        <span className="text-gray-400 text-xs">No image</span>
                    </div>
                )}
                <div className="absolute top-3 left-3 space-y-1">
                    {product.badges?.map((badge, idx) => (
                        <Badge key={idx} className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] block text-xs">
                            {badge}
                        </Badge>
                    ))}
                </div>
                <div className="absolute top-3 right-3">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={handleToggleWishlist}
                    >
                        <Heart className={`h-4 w-4 transition-colors ${isInWishlist ? "fill-pink-500 text-pink-500" : "text-gray-500"}`} />
                    </Button>
                </div>
                {product.freeShipping && (
                    <Badge className="absolute bottom-3 left-3 bg-green-500 text-xs">
                        Miễn phí vận chuyển
                    </Badge>
                )}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="bg-white text-gray-900">
                            Hết hàng
                        </Badge>
                    </div>
                )}
                {product.hasTryOn && (
                    <div className="absolute bottom-3 right-3 bg-white/90 p-1.5 rounded-full shadow-sm border border-pink-100 flex items-center justify-center group/tryon hover:bg-pink-50 transition-colors" title="Sản phẩm hỗ trợ dùng thử AI">
                        <Sparkles className="h-3.5 w-3.5 text-pink-500 fill-pink-50 group-hover/tryon:scale-110 transition-transform" />
                    </div>
                )}
            </div>

            <CardContent className={`space-y-3 ${viewMode === "list" ? "flex-1 p-6" : "p-4"}`}>
                <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={ROUTES.SHOP.SHOP_DETAIL(product.seller?.id)} className="flex items-center gap-2 hover:text-pink-600 transition-colors">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={resolveMediaUrl(product.seller?.avatar)} />
                            <AvatarFallback>{product.seller?.name?.[0] || "S"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{product.seller?.name || "Nhà bán"}</span>
                    </Link>
                    {product.seller?.verified && (
                        <Verified className="h-4 w-4 text-blue-500" />
                    )}
                    <div className="flex items-center ml-auto">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500 ml-1">{product.seller?.rating || 0}</span>
                    </div>
                </div>

                <div>
                    <p className="text-sm text-gray-500 mb-1">{typeof product.brand === 'object' ? product.brand?.name : product.brand}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-sm font-medium">{product.rating || 0}</span>
                        </div>
                        <span className="text-sm text-gray-500">({product.reviews || 0})</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-pink-600">
                                {formatPrice(product.price)}
                                {product.maxPrice && product.maxPrice > product.price && (
                                    <> - {formatPrice(product.maxPrice)}</>
                                )}
                            </span>
                        </div>
                        {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                    </div>
                    <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:scale-105 transition-all"
                        disabled={!product.inStock}
                        onClick={handleAddToCartClick}
                    >
                        <ShoppingBag className="h-4 w-4 mr-1" />
                        {product.inStock ? "Thêm" : "Hết hàng"}
                    </Button>
                </div>
            </CardContent>

            {/* Add to Cart Dialog */}
            <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Chọn phân loại sản phẩm</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-xl overflow-hidden border bg-slate-50">
                                <img src={productImage} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{product.name}</h4>
                                <p className="text-lg font-black text-pink-600 mt-1">
                                    {formatPrice(selectedVariant ? Number(selectedVariant.price) : product.price)}
                                </p>
                            </div>
                        </div>

                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-slate-700">Phân loại:</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v: any) => (
                                        <Button
                                            key={v.id}
                                            variant={selectedVariant?.id === v.id ? "default" : "outline"}
                                            size="sm"
                                            className={`rounded-full px-4 ${selectedVariant?.id === v.id ? 'bg-pink-600 hover:bg-pink-700 border-pink-600' : 'hover:border-pink-600 hover:text-pink-600'}`}
                                            onClick={() => setSelectedVariant(v)}
                                        >
                                            {v.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm font-bold text-slate-700">Số lượng:</p>
                            <div className="flex items-center gap-1 border rounded-full p-1 bg-slate-50">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-white transition-colors"
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-bold text-slate-700">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-white transition-colors"
                                    onClick={() => setQuantity(q => q + 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 text-base font-bold shadow-lg" onClick={handleConfirmAddToCart} disabled={isAdding}>
                            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                            Thêm vào giỏ hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
