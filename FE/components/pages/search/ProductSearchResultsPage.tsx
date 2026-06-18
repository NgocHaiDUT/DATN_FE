"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    Filter,
    Grid3X3,
    List,
    ArrowLeft,
    Store,
    SlidersHorizontal,
    Star,
    X,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/common/ProductCard";
import { useGetAllProducts, useGetBrands, useGetAllCategories } from "@/features/shop/usePublicShop";
import { ROUTES } from "@/constants/routes";

export function ProductSearchResultsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State for local UI
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showFilters, setShowFilters] = useState(false);

    // Parse search params
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const brandId = searchParams.get('brand') || '';
    const sort = searchParams.get('sort') || 'popular';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    // Data fetching
    const { data: products, isLoading: productsLoading } = useGetAllProducts({
        search: query,
        category: categoryId,
        brand: brandId,
        sort: sort,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });

    const { data: brands } = useGetBrands();
    const { data: categories } = useGetAllCategories();

    // Derived info
    const currentBrand = useMemo(() => {
        if (!brandId || !brands) return null;
        return brands.find((b: any) => b.id.toString() === brandId);
    }, [brandId, brands]);

    const currentCategory = useMemo(() => {
        if (!categoryId || !categories) return null;
        return categories.find((c: any) => c.id?.toString() === categoryId || c.slug === categoryId);
    }, [categoryId, categories]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const q = formData.get('search') as string;
        updateParams({ q });
    };

    const updateParams = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });
        router.push(`${ROUTES.SHOP.SEARCH}?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push(`${ROUTES.SHOP.SEARCH}?q=` + query);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white pt-12 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(ROUTES.SHOP.PRODUCTS)}
                            className="text-white hover:bg-white/20"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại Shop
                        </Button>
                    </div>

                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-3xl font-bold mb-4">
                            {query ? `Kết quả cho "${query}"` : (currentCategory?.name || currentBrand?.name || "Tất cả sản phẩm")}
                        </h1>
                        <p className="text-white/80 mb-8">
                            {productsLoading ? "Đang tìm kiếm..." : `Tìm thấy ${products?.length || 0} sản phẩm phù hợp`}
                        </p>

                        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                name="search"
                                defaultValue={query}
                                placeholder="Tìm kiếm sản phẩm khác..."
                                className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 rounded-full"
                            />
                            <Button
                                type="submit"
                                className="absolute right-1.5 top-1.5 h-9 rounded-full bg-white text-purple-600 hover:bg-white/90"
                            >
                                Tìm kiếm
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-16">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar - Desktop */}
                    <aside className="hidden lg:block w-64 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Bộ lọc
                                </h3>
                                {(categoryId || brandId || minPrice || maxPrice) && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-pink-600 hover:text-pink-700 font-medium"
                                    >
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            <div className="space-y-6">
                                {/* Price Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Khoảng giá</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Từ"
                                            defaultValue={minPrice}
                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => updateParams({ minPrice: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                        <Input
                                            placeholder="Đến"
                                            defaultValue={maxPrice}
                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => updateParams({ maxPrice: e.target.value })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Danh mục</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => updateParams({ category: null })}
                                            className={`text-sm block w-full text-left px-2 py-1 rounded transition-colors ${!categoryId ? 'bg-pink-50 text-pink-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Tất cả danh mục
                                        </button>
                                        {categories?.map((c: any) => (
                                            <button
                                                key={c.id}
                                                onClick={() => updateParams({ category: categoryId === c.id.toString() ? null : c.id.toString() })}
                                                className={`text-sm block w-full text-left px-2 py-1 rounded transition-colors ${categoryId === c.id.toString() ? 'bg-pink-50 text-pink-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Brand Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-3">Thương hiệu</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        <button
                                            onClick={() => updateParams({ brand: null })}
                                            className={`text-sm block w-full text-left px-2 py-1 rounded transition-colors ${!brandId ? 'bg-pink-50 text-pink-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Tất cả thương hiệu
                                        </button>
                                        {brands?.map((b: any) => (
                                            <button
                                                key={b.id}
                                                onClick={() => updateParams({ brand: brandId === b.id.toString() ? null : b.id.toString() })}
                                                className={`text-sm block w-full text-left px-2 py-1 rounded transition-colors ${brandId === b.id.toString() ? 'bg-pink-50 text-pink-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {b.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="flex-1">
                        {/* Toolbar */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <Select value={sort} onValueChange={(val: string) => updateParams({ sort: val })}>
                                    <SelectTrigger className="w-[180px] h-9 text-sm">
                                        <SelectValue placeholder="Sắp xếp theo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="popular">Phổ biến nhất</SelectItem>
                                        <SelectItem value="price-asc">Giá: Thấp đến Cao</SelectItem>
                                        <SelectItem value="price-desc">Giá: Cao đến Thấp</SelectItem>
                                        <SelectItem value="newest">Mới nhất</SelectItem>
                                        <SelectItem value="rating">Đánh giá cao</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-7 w-7 ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                                        onClick={() => setViewMode("grid")}
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-7 w-7 ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <span className="text-sm text-slate-500 font-medium">
                                Hiển thị {products?.length || 0} sản phẩm
                            </span>
                        </div>

                        {/* Active Filters Bar */}
                        {(categoryId || brandId || minPrice || maxPrice) && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {currentCategory && (
                                    <Badge variant="secondary" className="bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100 px-3 py-1 gap-1">
                                        Danh mục: {currentCategory.name}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => updateParams({ category: null })} />
                                    </Badge>
                                )}
                                {currentBrand && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 px-3 py-1 gap-1">
                                        Hãng: {currentBrand.name}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => updateParams({ brand: null })} />
                                    </Badge>
                                )}
                                {(minPrice || maxPrice) && (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 px-3 py-1 gap-1">
                                        Giá: {minPrice || '0'} - {maxPrice || '∞'}
                                        <X className="h-3 w-3 cursor-pointer" onClick={() => updateParams({ minPrice: null, maxPrice: null })} />
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Grid */}
                        {productsLoading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
                                <p className="text-slate-500">Đang tìm kiếm những sản phẩm tốt nhất cho bạn...</p>
                            </div>
                        ) : !products || products.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy sản phẩm</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                                    Rất tiếc, chúng tôi không tìm thấy kết quả phù hợp với tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc nhé!
                                </p>
                                <Button onClick={clearFilters} variant="outline" className="rounded-full">
                                    Xem tất cả sản phẩm
                                </Button>
                            </div>
                        ) : (
                            <div className={viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                                : "space-y-4"
                            }>
                                {products.map((product: any) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onProductClick={(p) => router.push(ROUTES.SHOP.PRODUCT_DETAIL(p.id))}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination (TBD as backend supports it) */}
                    </div>
                </div>
            </div>
        </div>
    );
}
