"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetShopBySlug, useGetShopProducts, useFollowShop, useUnfollowShop } from "@/features/shop/usePublicShop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Store, MapPin, Phone, Mail, UserCheck, Star, Heart, MessageSquare } from "lucide-react";
import { ProductCard } from "@/components/common/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth.store";
import { resolveMediaUrl } from "@/lib/media";

export function ShopDetailPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const slug = params?.slug || "";

    // Queries
    const { data: shop, isLoading: shopLoading } = useGetShopBySlug(slug);
    const shopId = shop?.id ? Number(shop.id) : 0;

    const [activeTab, setActiveTab] = useState("products");

    const { data: products, isLoading: productsLoading } = useGetShopProducts(shopId, {
        limit: 20,
        sort: 'newest'
    });

    // Mutations
    const followMutation = useFollowShop();
    const unfollowMutation = useUnfollowShop();

    const isOwner = user?.id === shop?.owner_id;

    // Mock follow state (backend dependent)
    const [isFollowing, setIsFollowing] = useState(false);

    const handleFollow = () => {
        if (!user) {
            // Redirect to login or show auth modal
            return;
        }
        if (isFollowing) {
            unfollowMutation.mutate(shopId);
            setIsFollowing(false);
        } else {
            followMutation.mutate(shopId);
            setIsFollowing(true);
        }
    };

    const handleMessage = () => {
        if (!shop?.owner_id) return;
        router.push(`/chat?userId=${shop.owner_id}`);
    };

    if (shopLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-40 col-span-1 rounded-xl" />
                    <Skeleton className="h-96 col-span-3 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy cửa hàng</h2>
                <Button onClick={() => router.push('/shop')} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại chợ
                </Button>
            </div>
        );
    }

    const coverUrl = shop.cover_url ? resolveMediaUrl(shop.cover_url) : null;
    const logoUrl = shop.logo_url ? resolveMediaUrl(shop.logo_url) : null;

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Cover Image */}
            <div className="h-48 md:h-64 w-full bg-slate-200 relative overflow-hidden">
                {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-400 to-pink-500" />
                )}
                <div className="absolute inset-0 bg-black/20" />

                <Button
                    className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-900"
                    size="sm"
                    onClick={() => router.push('/shop')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                </Button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="p-6 text-center space-y-4 shadow-xl border-t-0">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 text-3xl font-bold">
                                            {shop.name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                    )}
                                </div>
                                {shop.is_verified && (
                                    <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Verified Shop">
                                        <UserCheck className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                                <div className="flex items-center justify-center gap-2 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                                        {shop.rating || '4.9'}
                                    </span>
                                    <span>•</span>
                                    <span>{shop.followers || '1.2k'} followers</span>
                                </div>
                            </div>

                            <div className="flex gap-2 justify-center">
                                {isOwner ? (
                                    <Button className="w-full" variant="outline" onClick={() => router.push('/profile/shop')}>
                                        Quản lý Shop
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            className={`flex-1 ${isFollowing ? 'bg-gray-100 text-gray-900 hover:bg-gray-200' : 'bg-pink-600 hover:bg-pink-700 text-white'}`}
                                            variant={isFollowing ? "ghost" : "default"}
                                            onClick={handleFollow}
                                        >
                                            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={handleMessage}>
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="pt-4 border-t text-left space-y-3 text-sm text-gray-600">
                                {shop.description && (
                                    <p className="italic">"{shop.description}"</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{shop.address || 'Vietnam'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{shop.phone || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{shop.email || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content Info */}
                    <div className="lg:col-span-3 space-y-6">
                        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-white p-1 border shadow-sm w-full justify-start rounded-lg h-auto">
                                <TabsTrigger value="products" className="py-2 px-6">Sản phẩm</TabsTrigger>
                                <TabsTrigger value="about" className="py-2 px-6">Giới thiệu</TabsTrigger>
                                <TabsTrigger value="reviews" className="py-2 px-6">Đánh giá</TabsTrigger>
                            </TabsList>

                            <TabsContent value="products" className="mt-6">
                                {productsLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="space-y-4">
                                                <Skeleton className="h-[300px] w-full rounded-xl" />
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {products?.length === 0 ? (
                                            <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
                                                <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Store className="w-8 h-8 text-purple-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900">Chưa có sản phẩm</h3>
                                                <p className="text-gray-500">Shop này hiện chưa đăng bán sản phẩm nào.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {products?.map((product: any) => (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        viewMode="grid"
                                                        onProductClick={(p) => router.push(`/product/${p.id}`)}
                                                        onAddToCart={() => { }} // TODO: Add cart logic
                                                        onToggleWishlist={() => { }} // TODO: Add wishlist logic
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="about" className="mt-6">
                                <Card className="p-8">
                                    <h3 className="text-xl font-bold mb-4">Giới thiệu {shop.name}</h3>
                                    <div className="prose max-w-none text-gray-600">
                                        <p>{shop.description || "Chưa có mô tả chi tiết."}</p>
                                        <p className="mt-4">
                                            Tham gia từ: {new Date(shop.created_at || Date.now()).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-6">
                                <Card className="p-8 text-center">
                                    <p className="text-gray-500">Tính năng đánh giá shop đang được phát triển.</p>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                </div>
            </div>
        </div>
    );
}
