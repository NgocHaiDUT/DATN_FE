"use client";

import { useGetBrands, useGetAllCategories, useGetAllProducts } from "@/features/shop/usePublicShop";
import { ProductCard } from "@/components/common/ProductCard";
import { CategoryCard } from "@/components/shop/CategoryCard";
import { BrandCard } from "@/components/shop/BrandCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, SlidersHorizontal, Package, RefreshCw, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/routes";

export function ShopPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [showAllBrands, setShowAllBrands] = useState(false);

    const { data: brands = [], isLoading: brandsLoading } = useGetBrands();
    const { data: categories = [], isLoading: categoriesLoading } = useGetAllCategories();
    const { data: products = [], isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useGetAllProducts({
        limit: 20,
        sort: 'newest'
    });

    const allProducts = Array.isArray(products) ? products : [];

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`${ROUTES.SHOP.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const categoryIcons: Record<string, string> = {
        'Face': '✨',
        'Eyes': '👁️',
        'Lips': '💋',
        'Skincare': '🧴',
        'Tools': '🔧',
        'Fragrance': '🌸'
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero Banner */}
            <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-pink-500 text-white py-20 px-4">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
                <div className="relative max-w-7xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-100">
                        Chợ Làm Đẹp
                    </h1>
                    <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
                        Khám phá hàng ngàn sản phẩm làm đẹp chính hãng từ các nhà bán uy tín và chuyên gia hàng đầu.
                    </p>

                    <div className="max-w-2xl mx-auto relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                                className="pl-12 h-12 bg-white/95 border-0 text-slate-900 placeholder:text-slate-500 shadow-xl focus-visible:ring-2 focus-visible:ring-purple-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                        </div>
                        <Button
                            size="lg"
                            className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105"
                            onClick={handleSearch}
                        >
                            Tìm kiếm
                        </Button>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* All Products Grid */}
                <section id="featured" className="scroll-mt-20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-pink-500" />
                                Sản phẩm mới nhất
                            </h2>
                            <p className="text-muted-foreground mt-1">Khám phá các sản phẩm làm đẹp chính hãng</p>
                        </div>
                        <Button variant="ghost" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50" onClick={() => router.push(ROUTES.SHOP.SEARCH)}>
                            Xem tất cả
                        </Button>
                    </div>

                    {productsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-[220px] w-full rounded-xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : productsError ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Không thể tải sản phẩm</h3>
                            <p className="text-muted-foreground mb-4">Đã xảy ra lỗi khi tải danh sách sản phẩm.</p>
                            <Button variant="outline" onClick={() => refetchProducts()} className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Thử lại
                            </Button>
                        </div>
                    ) : allProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Package className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có sản phẩm</h3>
                            <p className="text-muted-foreground">Hiện chưa có sản phẩm nào. Hãy quay lại sau!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {allProducts.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    viewMode="grid"
                                    onProductClick={(p) => router.push(`/product/${p.slug || p.id}`)}
                                    onAddToCart={() => { }}
                                    onToggleWishlist={() => { }}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Categories */}
                <section id="categories" className="scroll-mt-20">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Danh mục phổ biến</h2>

                    {categoriesLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {categories.length > 0 ? categories.map((cat: any) => (
                                <CategoryCard
                                    key={cat.id}
                                    name={cat.name}
                                    icon={categoryIcons[cat.name] || '✨'}
                                    productCount={undefined} // Backend doesn't return count yet
                                    onClick={() => router.push(`${ROUTES.SHOP.SEARCH}?category=${cat.id}`)}
                                />
                            )) : (
                                // Fallback purely for design if API is empty during dev
                                ['Face', 'Eyes', 'Lips', 'Skincare', 'Tools', 'Fragrance'].map(name => (
                                    <CategoryCard
                                        key={name}
                                        name={name}
                                        icon={categoryIcons[name] || '✨'}
                                        onClick={() => router.push(`${ROUTES.SHOP.SEARCH}?category=${name.toLowerCase()}`)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </section>

                {/* Brands */}
                <section id="brands" className="scroll-mt-20">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold">Thương hiệu chính hãng</h2>
                        <Button variant="outline" onClick={() => setShowAllBrands(!showAllBrands)}>
                            {showAllBrands ? "Thu gọn" : "Xem tất cả"}
                        </Button>
                    </div>

                    {brandsLoading ? (
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-full" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                            {(showAllBrands ? brands : brands.slice(0, 12)).map((brand: any) => (
                                <BrandCard
                                    key={brand.id}
                                    brand={brand}
                                    onClick={() => router.push(`${ROUTES.SHOP.SEARCH}?brand=${brand.id}`)}
                                />
                            ))}
                            {brands.length === 0 && (
                                <div className="col-span-full text-center text-muted-foreground py-8">
                                    Chưa có thương hiệu nào.
                                </div>
                            )}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
