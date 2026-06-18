"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetProductById } from "@/features/shop/usePublicShop";
import { resolveMediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Star, Heart, Share2, ShoppingCart, Minus, Plus, Store, ArrowRight, Check, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/features/shop/useCart";
import { useWishlist } from "@/features/shop/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth.store";
import { Loader2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ShareProductDialog } from "@/components/common/ShareProductDialog";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";

export function ProductDetailPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const productId = params?.slug;

    const { data: product, isLoading, error } = useGetProductById(productId!);

    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Record product view once when product loads
    const viewRecorded = useRef(false);
    useEffect(() => {
        if (product?.id && !viewRecorded.current) {
            viewRecorded.current = true;
            apiClient(ENDPOINTS.PRODUCTS.RECORD_VIEW(product.id), { method: "POST" }).catch(() => {});
        }
    }, [product?.id]);

    // Let user see the price range first, don't auto-select
    // if (product && !selectedVariant && product.variants && product.variants.length > 0) {
    //     setSelectedVariant(product.variants[0]);
    // }

    const { toast } = useToast();
    const { addToCart, isAdding: isAddingToCart } = useCart();
    const { addToWishlist, removeFromWishlist, wishlist } = useWishlist();
    const user = useAuthStore((s) => s.user);

    // Derived state
    const currentPrice = selectedVariant ? Number(selectedVariant.price) : (product?.price || 0);
    const originalPrice = product?.originalPrice;
    const discount = originalPrice && currentPrice < originalPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    const isInWishlist = wishlist?.some((item: any) => item.product.id === product?.id);

    // Fallback logic for images if backend returns variants but we mapped basic info
    // In a real scenario, we would store all media in the Product type or fetch strictly from product_media
    const displayImage = selectedImage || (product?.image ? resolveMediaUrl(product.image) : null);

    const handleQuantityChange = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;
        if (!user) {
            router.push("/login");
            return;
        }
        addToCart({
            productId: Number(product.id),
            quantity: quantity,
            variantId: selectedVariant?.id
        });
    };

    const handleToggleWishlist = () => {
        if (!product) return;
        if (!user) {
            router.push("/login");
            return;
        }
        if (isInWishlist) {
            removeFromWishlist(Number(product.id));
            toast({ title: "Đã xóa khỏi danh sách yêu thích" });
        } else {
            addToWishlist(Number(product.id));
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-[500px] w-full rounded-xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !productId || !product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-gray-500 mb-6">Sản phẩm bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.</p>
                <Button onClick={() => router.push('/shop')}>
                    Quay lại cửa hàng
                </Button>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0
        }).format(price).replace(/\s₫/, '₫');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Product Detail Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Left: Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square relative overflow-hidden rounded-xl border bg-gray-50">
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}

                            {discount > 0 && (
                                <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-base">
                                    -{discount}%
                                </Badge>
                            )}
                        </div>
                        {/* Thumbnails (Mock for now since mapped object only has 1 image) */}
                        {/* If we had multiple images in Product type, we would map them here */}
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-8">
                        <div>
                            {product.brand && (
                                <div
                                    className="text-sm font-medium text-pink-600 mb-2 cursor-pointer hover:underline"
                                    onClick={() => typeof product.brand === 'object' && router.push(`/search?brand=${(product.brand as any).id}`)} // Casting for now
                                >
                                    {typeof product.brand === 'object' ? (product.brand as any).name : product.brand}
                                </div>
                            )}
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                {product.name}
                            </h1>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-lg">{product.rating}</span>
                                </div>
                                <Separator orientation="vertical" className="h-5" />
                                <span className="text-gray-500">{product.reviews} Đánh giá</span>
                                <Separator orientation="vertical" className="h-5" />
                                <span className="text-gray-500">Đã bán {(product as any).sold_count || 0}</span>
                            </div>

                            <div className="flex items-baseline gap-4">
                                <span className="text-4xl font-bold text-pink-600">
                                    {selectedVariant ? (
                                        formatPrice(currentPrice)
                                    ) : (
                                        <>
                                            {formatPrice(product.price)}
                                            {product.maxPrice && product.maxPrice > product.price && (
                                                <> - {formatPrice(product.maxPrice)}</>
                                            )}
                                        </>
                                    )}
                                </span>
                                {originalPrice && (
                                    <span className="text-xl text-gray-400 line-through">
                                        {formatPrice(originalPrice)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Variants Selection */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Phân loại: <span className="text-gray-500 font-normal">{selectedVariant?.name}</span></h3>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((variant: any) => (
                                        <Button
                                            key={variant.id}
                                            variant="outline"
                                            className={`border ${selectedVariant?.id === variant.id ? 'border-pink-600 text-pink-600 bg-pink-50' : 'border-gray-200 hover:border-pink-600'}`}
                                            onClick={() => setSelectedVariant(variant)}
                                        >
                                            {variant.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Actions */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="font-medium text-gray-900">Số lượng:</span>
                                <div className="flex items-center border rounded-md">
                                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-12 text-center font-medium">{quantity}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(1)}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {product.inStock ? (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <Check className="w-4 h-4" /> Còn hàng
                                    </span>
                                ) : (
                                    <span className="text-sm text-red-500">Hết hàng</span>
                                )}
                            </div>

                            {product.hasTryOn && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 h-11 text-base font-semibold rounded-xl shadow-sm border hover:-translate-y-0.5 transition-all group overflow-hidden relative mb-2"
                                    onClick={() => router.push(`/product/${product.slug}/try-on`)}
                                >
                                    <Sparkles className="mr-2 w-4 h-4" />
                                    Dùng thử bằng AI (Try On)
                                </Button>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    size="lg"
                                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-12 text-lg shadow-xl hover:-translate-y-1 transition-all"
                                    onClick={handleAddToCart}
                                    disabled={!product.inStock || isAddingToCart}
                                >
                                    {isAddingToCart ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 w-5 h-5" />}
                                    Thêm vào giỏ
                                </Button>
                                <Button
                                    size="lg"
                                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white h-12 text-lg shadow-xl hover:-translate-y-1 transition-all"
                                    onClick={() => {
                                        if (!product) return;
                                        const params = new URLSearchParams({
                                            buyNow: "true",
                                            productId: product.id.toString(),
                                            quantity: quantity.toString(),
                                        });
                                        if (selectedVariant) {
                                            params.append("variantId", selectedVariant.id.toString());
                                        }
                                        router.push(`/checkout?${params.toString()}`);
                                    }}
                                    disabled={!product.inStock}
                                >
                                    Mua ngay
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className={`px-6 h-12 ${isInWishlist ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                                    onClick={handleToggleWishlist}
                                >
                                    <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="px-6 h-12"
                                    onClick={() => setShowShareDialog(true)}
                                >
                                    <Share2 className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Seller Info */}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border">
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={resolveMediaUrl(product.seller?.avatar)} />
                                <AvatarFallback>{product.seller?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900">{product.seller?.name}</h4>
                                <div className="flex items-center text-sm text-gray-500 gap-2">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{product.seller?.rating} / 5.0</span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.SHOP.SHOP_DETAIL(product.seller?.id))}>
                                <Store className="w-4 h-4 mr-2" /> Xem Shop
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Description & Reviews Tabs (Simplistic for now) */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold mb-6">Mô tả sản phẩm</h3>
                    <Card className="p-6 mb-12">
                        <div className="prose max-w-none text-gray-600 whitespace-pre-line">
                            {product.description || "Thông tin chi tiết về sản phẩm đang được cập nhật. Vui lòng liên hệ shop để biết thêm chi tiết."}
                        </div>
                    </Card>

                    <Separator className="my-12" />

                    <ReviewList
                        productId={Number(product.id)}
                        productName={product.name}
                        productImage={displayImage || ""}
                    />
                </div>

            </div>

            {/* Share Product Dialog */}
            {product && (
                <ShareProductDialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    product={product}
                    onShare={() => {
                        toast({
                            title: "Thành công",
                            description: "Đã chia sẻ sản phẩm qua tin nhắn",
                        });
                    }}
                />
            )}
        </div>
    );
}
