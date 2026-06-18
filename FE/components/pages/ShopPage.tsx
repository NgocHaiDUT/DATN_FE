"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// TODO: thay bằng card sản phẩm chuẩn khi có
import { SharedProductCard } from "@/components/common/SharedProductCard";
import { Search, TrendingUp } from "lucide-react";
import { useBrands } from "@/features/shop/useBrands";
import { useProducts } from "@/features/shop/useProducts";
import { useI18n } from "@/lib/i18n/I18nContext";

const categories = [
  { name: "Face", icon: "✨", count: "1.2k products", color: "from-pink-400 to-rose-400" },
  { name: "Eyes", icon: "👁️", count: "890 products", color: "from-purple-400 to-indigo-400" },
  { name: "Lips", icon: "💋", count: "654 products", color: "from-red-400 to-pink-400" },
  { name: "Skincare", icon: "🧴", count: "2.1k products", color: "from-green-400 to-emerald-400" },
  { name: "Tools", icon: "🔧", count: "321 products", color: "from-blue-400 to-cyan-400" },
  { name: "Fragrance", icon: "🌸", count: "445 products", color: "from-violet-400 to-purple-400" },
];

export const ShopPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllBrands, setShowAllBrands] = useState(false);
  const { t } = useI18n();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: products = [] } = useProducts({ page: 1, limit: 8 });

  const brandsList = useMemo(() => brands || [], [brands]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/products?category=${categoryName.toLowerCase()}`);
  };

  const handleBrandClick = (brand: any) => {
    router.push(
      `/products?brandSlug=${brand.slug}&brand=${encodeURIComponent(
        brand.name
      )}`
    );
  };

  const handleKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">{t('shop.heroTitle')}</h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t('shop.heroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={t('shop.searchPlaceholder2')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:bg-white/20"
                />
              </div>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <Search className="h-5 w-5 mr-2" />
                {t('shop.searchBtn')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="featured" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {t('shop.featured')}
              </h2>
              <p className="text-gray-600">
                {t('shop.featuredDesc')}
              </p>
            </div>
            <Button variant="outline">
              {t('shop.viewAll')} <TrendingUp className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product: any) => {
              const image =
                product.thumbnail_url ||
                product.image_url ||
                product.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1612590838546-42efc879aa49?w=300";
              return (
                <SharedProductCard
                  key={product.id}
                  payload={{
                    product_id: product.id,
                    product_name: product.name,
                    product_image_url: image,
                    product_price: product.price,
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('shop.browseCategory')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('shop.browseCategoryDesc')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-6 text-center space-y-3 relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5`}
                  ></div>
                  <div className="relative">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">{category.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section id="brands" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              Thương hiệu
            </h2>
            <Button
              variant="outline"
              onClick={() => setShowAllBrands((v) => !v)}
            >
              {showAllBrands ? "Thu gọn" : "Xem tất cả"}
            </Button>
          </div>

          {brandsLoading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!brandsLoading && (
            <>
              <p className="text-xs text-gray-500 mb-3">
                Tổng số thương hiệu: {brandsList.length}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {(showAllBrands ? brandsList : brandsList.slice(0, 12)).map(
                  (b: any) => {
                    const rawLogo = b.logo_url || b.logo || "";
                    const logo =
                      rawLogo && rawLogo.startsWith("/")
                        ? rawLogo
                        : `/uploads/brands/${b.slug}.png`;
                    return (
                      <Card
                        key={b.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleBrandClick(b)}
                      >
                        <CardContent className="p-4 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logo}
                              alt={b.name}
                              className="w-16 h-16 object-contain"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                )}
                {!brandsLoading && brandsList.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có thương hiệu.</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default ShopPage;

