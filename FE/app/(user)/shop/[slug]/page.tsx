"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Store, MessageCircle, Heart, Star, MapPin,
  Phone, Mail, UserCheck, Users, Package, Calendar,
  TrendingUp, Award, Clock, Share2, MoreVertical,
  Grid, List, Filter, Search
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveMediaUrl } from "@/lib/media";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/I18nContext";

interface Shop {
  id: number;
  name?: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  phone?: string;
  email?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  owner?: {
    id: number;
    full_name?: string;
    avatar_url?: string;
  };
  staff_count?: number;
  product_count?: number;
  follower_count?: number;
  avg_rating?: number;
  total_reviews?: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  images?: string[];
  first_image?: string; // From API: product_media[0].url
  price: number;
  discount_price?: number;
  avg_rating?: number;
  review_count: number;
  sold_count?: number;
  is_published?: boolean;
  product_variants?: Array<{
    id: number;
    price: number;
    compare_at_price?: number;
    stock: number;
  }>;
}

export default function PublicShopPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const { t, locale } = useI18n();

  useEffect(() => {
    const fetchShop = async () => {
      if (!params?.slug) return;
      if (!params?.slug) return;

      setLoading(true);
      try {
        const res: any = await apiClient(ENDPOINTS.SHOP.DETAILS(params.slug), { method: "GET" });
        const shopData = res?.data || res;
        setShop(shopData);

        // Check if user is following
        if (user && shopData?.owner?.id) {
          // TODO: Add API to check follow status
          // setIsFollowing(await checkFollowStatus(shopData.owner.id));
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
        toast.error(t('shopPage.cannotLoad'));
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [params?.slug, user]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shop?.id) return;

      setProductsLoading(true);
      try {
        // Always show only published products (user requirement)
        const res: any = await apiClient(
          `/products/shops/${shop.id}?limit=20&is_published=true`,
          { method: "GET" }
        );

        console.log('Full API Response:', res);

        // API returns: { success: true, data: { products: [...], pagination: {...} } }
        if (res?.success && res?.data?.products) {
          console.log('Setting products:', res.data.products);
          setProducts(res.data.products);
        } else {
          console.log('No products found in response');
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    if (activeTab === "products") {
      fetchProducts();
    }
  }, [shop?.id, activeTab]);

  const handleStartChat = async () => {
    if (!user) {
      toast.error(t('shopPage.loginToChat'));
      router.push("/login");
      return;
    }

    if (!shop?.id) {
      toast.error(t('shopPage.notFound'));
      return;
    }

    setIsStartingChat(true);
    try {
      const response: any = await apiClient(
        ENDPOINTS.MESSAGES.FIND_OR_CREATE_SHOP_CONVERSATION(shop.id),
        { method: "POST" }
      );

      const conversation = response?.data || response;

      if (conversation?.id) {
        router.push(`/chat?conversation=${conversation.id}`);
        toast.success(t('shopPage.chatOpened'));
      } else {
        toast.error(t('shopPage.cannotChat'));
      }
    } catch (error: any) {
      toast.error(error?.message || t('shopPage.chatError'));
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error(t('shopPage.loginToFollow'));
      router.push("/login");
      return;
    }

    if (!shop?.owner?.id) return;

    try {
      // TODO: Implement follow/unfollow API
      if (isFollowing) {
        // await apiClient(`/follows/${shop.owner.id}`, { method: "DELETE" });
        setIsFollowing(false);
        toast.success(t('shopPage.unfollowed'));
      } else {
        // await apiClient(`/follows/${shop.owner.id}`, { method: "POST" });
        setIsFollowing(true);
        toast.success(t('shopPage.followed'));
      }
    } catch (error: any) {
      toast.error(error?.message || t('common.error'));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop?.name,
        text: shop?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('shopPage.copiedLink'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="h-96 bg-gray-200 rounded-xl" />
              <div className="md:col-span-3 h-96 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Store className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('shopPage.notFound')}</h2>
          <p className="text-gray-600 mb-6">{t('shopPage.notFoundDesc')}</p>
          <Button onClick={() => router.push("/shop")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('shopPage.goBack')}
          </Button>
        </Card>
      </div>
    );
  }

  const coverUrl = shop.cover_url ? resolveMediaUrl(shop.cover_url) : null;
  const logoUrl = shop.logo_url ? resolveMediaUrl(shop.logo_url) : null;
  const isOwner = user?.id === shop.owner?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Cover Section */}
      <div className="relative h-72 w-full overflow-hidden bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
        {coverUrl && (
          <Image
            src={coverUrl}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="bg-white/90 hover:bg-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('shopPage.goBack')}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="bg-white/90 hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.info(t('shopPage.developing'))}>
                  {t('shopPage.report')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info(t('shopPage.developing'))}>
                  {t('shopPage.block')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Shop Info */}
          <div className="space-y-4">
            <Card className="overflow-visible border-2 shadow-xl">
              <CardContent className="p-6 text-center">
                {/* Avatar */}
                <div className="relative inline-block -mt-20 mb-4">
                  <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg mx-auto overflow-hidden bg-white">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={shop.name || 'Shop'}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white text-3xl font-bold">
                        {shop.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                    )}
                  </div>
                  {shop.is_verified && (
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full border-4 border-white shadow-md">
                      <UserCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Shop Name & Rating */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{shop.name || 'Cửa hàng'}</h1>
                <div className="flex items-center justify-center gap-3 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{shop.avg_rating || 0}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-gray-600">{shop.follower_count || 0} {t('shopPage.followers')}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 mb-4">
                  {isOwner ? (
                    <Button
                      className="w-full"
                      onClick={() => router.push("/seller")}
                    >
                      <Store className="mr-2 h-4 w-4" />
                      {t('shopPage.managing')}
                    </Button>
                  ) : (
                    <>
                      <div className="grid grid-cols-5 gap-2">
                        <Button
                          onClick={handleFollowToggle}
                          variant={isFollowing ? "outline" : "default"}
                          className={`col-span-3 ${!isFollowing && 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'}`}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${isFollowing && 'fill-current'}`} />
                          {isFollowing ? t('shopPage.following') : t('shopPage.follow')}
                        </Button>
                        <Button
                          onClick={handleStartChat}
                          disabled={isStartingChat}
                          variant="outline"
                          className="col-span-2"
                        >
                          {isStartingChat ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{shop.product_count || 0}</div>
                    <div className="text-xs text-gray-600">{t('shopPage.products')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">{shop.total_reviews || 0}</div>
                    <div className="text-xs text-gray-600">{t('shopPage.reviewsTab')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{shop.staff_count || 0}</div>
                    <div className="text-xs text-gray-600">{t('seller.dashboard.staff')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info Card */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('shopPage.contact')}
                </h3>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {shop.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{shop.phone}</span>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 break-all">{shop.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-gray-500 text-xs">{t('shopPage.joined')}</div>
                    <div className="text-gray-700">
                      {new Date(shop.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  {t('shopPage.achievements')}
                </h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {shop.is_verified && (
                  <Badge variant="secondary" className="w-full justify-start">
                    <UserCheck className="mr-2 h-3 w-3" />
                    {t('shopPage.verified')}
                  </Badge>
                )}
                {(shop.avg_rating || 0) >= 4.5 && (
                  <Badge variant="secondary" className="w-full justify-start bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                    <Star className="mr-2 h-3 w-3" />
                    {t('shopPage.highRating')}
                  </Badge>
                )}
                {(shop.product_count || 0) >= 50 && (
                  <Badge variant="secondary" className="w-full justify-start bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <Package className="mr-2 h-3 w-3" />
                    {t('shopPage.manyProducts')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {shop.description && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed">{shop.description}</p>
                </CardContent>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Card>
                <CardContent className="p-4">
                  <TabsList className="w-full bg-gray-100">
                    <TabsTrigger value="products" className="flex-1">
                      <Package className="mr-2 h-4 w-4" />
                      {t('shopPage.products')} ({shop.product_count || 0})
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex-1">
                      <Store className="mr-2 h-4 w-4" />
                      {t('shopPage.about')}
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="flex-1">
                      <Star className="mr-2 h-4 w-4" />
                      {t('shopPage.reviewsTab')} ({shop.total_reviews || 0})
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                        placeholder={t('shopPage.filter')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === "list" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Filter className="mr-2 h-4 w-4" />
                          {t('shopPage.filter')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {productsLoading ? (
                  <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <div className="animate-pulse">
                          <div className="h-48 bg-gray-200" />
                          <div className="p-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('shopPage.noProducts')}
                      </h3>
                      <p className="text-gray-600">
                        Cửa hàng này hiện chưa có sản phẩm nào để bán.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                    {products
                      .filter((p) =>
                        !searchQuery ||
                        p.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((product) => (
                        <Card
                          key={product.id}
                          className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
                          onClick={() => router.push(`/product/${product.id}`)}
                        >
                          <div className="relative aspect-square overflow-hidden bg-gray-100">
                            {product.first_image ? (
                              <Image
                                src={resolveMediaUrl(product.first_image) ?? ""}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : product.images?.[0] ? (
                              <Image
                                src={resolveMediaUrl(product.images[0]) ?? ""}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-16 w-16" />
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              {product.avg_rating && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="font-medium">{product.avg_rating}</span>
                                </div>
                              )}
                              <span className="text-xs text-gray-500">
                                {t('seller.dashboard.sold')} {product.sold_count || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(() => {
                                // Get price from variants if available
                                const variants = product.product_variants || [];
                                if (variants.length > 0) {
                                  const prices = variants.map(v => Number(v.price));
                                  const minPrice = Math.min(...prices);
                                  const maxPrice = Math.max(...prices);
                                  const hasComparePrice = variants.some(v => v.compare_at_price);

                                  if (hasComparePrice) {
                                    return (
                                      <>
                                        <span className="text-lg font-bold text-red-600">
                                          {minPrice === maxPrice
                                            ? minPrice.toLocaleString("vi-VN")
                                            : `${minPrice.toLocaleString("vi-VN")} - ${maxPrice.toLocaleString("vi-VN")}`
                                          }₫
                                        </span>
                                        <span className="text-sm text-gray-400 line-through">
                                          {variants[0].compare_at_price?.toLocaleString("vi-VN")}₫
                                        </span>
                                      </>
                                    );
                                  }

                                  return (
                                    <span className="text-lg font-bold text-gray-900">
                                      {minPrice === maxPrice
                                        ? minPrice.toLocaleString("vi-VN")
                                        : `${minPrice.toLocaleString("vi-VN")} - ${maxPrice.toLocaleString("vi-VN")}`
                                      }₫
                                    </span>
                                  );
                                }

                                // Fallback to product price
                                if (product.discount_price) {
                                  return (
                                    <>
                                      <span className="text-lg font-bold text-red-600">
                                        {product.discount_price.toLocaleString("vi-VN")}₫
                                      </span>
                                      <span className="text-sm text-gray-400 line-through">
                                        {product.price.toLocaleString("vi-VN")}₫
                                      </span>
                                    </>
                                  );
                                }

                                return (
                                  <span className="text-lg font-bold text-gray-900">
                                    {product.price?.toLocaleString("vi-VN")}₫
                                  </span>
                                );
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-bold">{t('shopPage.about')} {shop.name || ''}</h3>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        {t('shopPage.about')}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {shop.description || "Chưa có mô tả chi tiết về cửa hàng."}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {shop.owner && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('seller.dashboard.staff')}
                          </h4>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar>
                              <AvatarImage src={shop.owner.avatar_url ? resolveMediaUrl(shop.owner.avatar_url) : undefined} />
                              <AvatarFallback>
                                {shop.owner.full_name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{shop.owner.full_name || t('seller.staff.noName')}</div>
                              <div className="text-sm text-gray-600">{t('shopPage.managing')}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {t('shopPage.products')}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">{t('shopPage.products')}</span>
                            <span className="font-semibold">{shop.product_count || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">{t('shopPage.followers')}</span>
                            <span className="font-semibold">{shop.follower_count || 0}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-gray-600">{t('shopPage.reviewsTab')}</span>
                            <span className="font-semibold">{shop.avg_rating || 0} ⭐</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-12 text-center">
                    <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t('shopPage.reviewsTab')}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t('shopPage.developing')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shop.total_reviews || 0} {t('shopPage.reviewsTab')}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
