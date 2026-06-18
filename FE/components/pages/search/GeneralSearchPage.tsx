"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Search,
    User,
    Store,
    ArrowLeft,
    Loader2,
    MessageCircle,
    ShoppingBag,
    Star,
    ChevronRight,
    SearchX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGeneralSearch } from "@/features/search/useSearch";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media";
import { ROUTES } from "@/constants/routes";
import { ProductCard } from "@/components/common/ProductCard";
import { useEffect } from "react";


export function GeneralSearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    const { data, isLoading } = useGeneralSearch(query, type !== 'all' ? type : undefined);

    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse recent searches', e);
            }
        }
    }, []);

    const addToRecent = (q: string) => {
        const newRecent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const q = formData.get('search') as string;
        if (q.trim()) {
            addToRecent(q.trim());
            router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(q.trim())}&type=${type}`);
        }
    };

    const handleTypeChange = (newType: string) => {
        router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(query)}&type=${newType}`);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-16 z-30">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            name="search"
                            defaultValue={query}
                            placeholder="Tìm kiếm mọi thứ..."
                            className="pl-10 h-10 bg-slate-100 border-none rounded-full"
                        />
                    </form>
                </div>

                <div className="max-w-5xl mx-auto px-4 overflow-x-auto no-scrollbar">
                    <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
                        <TabsList className="bg-transparent h-12 p-0 gap-8">
                            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none h-full px-1 font-semibold transition-all">Tất cả</TabsTrigger>
                            <TabsTrigger value="product" className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none h-full px-1 font-semibold transition-all">Sản phẩm</TabsTrigger>
                            <TabsTrigger value="shop" className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none h-full px-1 font-semibold transition-all">Cửa hàng</TabsTrigger>
                            <TabsTrigger value="user" className="data-[state=active]:bg-transparent data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none h-full px-1 font-semibold transition-all">Người dùng</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-pink-600 mb-4" />
                        <p className="text-slate-500 text-sm">Đang tìm kiếm...</p>
                    </div>
                ) : !query ? (
                    <div className="py-12 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 rotate-3">
                            <Search className="h-10 w-10 text-pink-500/50" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Tìm kiếm trên Beauty</h2>
                        <p className="text-slate-500 text-sm max-w-xs text-center leading-relaxed">
                            Khám phá bài viết, cửa hàng và những người bạn mới trong cộng đồng làm đẹp
                        </p>

                        {recentSearches.length > 0 && (
                            <div className="mt-12 w-full max-w-xs">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Tìm kiếm gần đây</h3>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((s, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(s)}&type=${type}`);
                                            }}
                                            className="px-4 py-2 bg-white border border-slate-100 rounded-full text-sm text-slate-600 hover:border-pink-200 hover:text-pink-600 transition-all shadow-sm"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Tab-specific results or All results */}
                        {type === 'all' ? (
                            <div className="space-y-12">
                                {/* Products Grid - Preview */}
                                {data?.products?.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-4 px-1">
                                            <h3 className="text-base font-bold text-slate-900">Sản phẩm nổi bật</h3>
                                            <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 h-8 gap-1" onClick={() => handleTypeChange('product')}>
                                                Xem tất cả <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {data.products.slice(0, 4).map((p: any) => (
                                                <ProductCard
                                                    key={p.id}
                                                    product={p}
                                                    onProductClick={(product) => router.push(ROUTES.SHOP.PRODUCT_DETAIL(product.id))}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Users Results */}
                                {data?.users?.length > 0 && (
                                    <section>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 px-1">Người dùng</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {data.users.slice(0, 3).map((u: any) => (
                                                <Card key={u.id} className="hover:bg-pink-50/30 transition-all border-none shadow-none bg-white/50 group backdrop-blur-sm rounded-2xl">
                                                    <CardContent className="p-3 flex items-center gap-4">
                                                        <Link href={ROUTES.PROFILE.PUBLIC(u.id)} className="flex items-center gap-4 flex-1 min-w-0">
                                                            <Avatar className="h-14 w-14 ring-2 ring-transparent group-hover:ring-pink-200 transition-all shadow-sm">
                                                                <AvatarImage src={resolveMediaUrl(u.avatar_url)} />
                                                                <AvatarFallback className="bg-pink-100 text-pink-500 font-bold text-lg">{u.full_name?.[0]?.toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{u.full_name}</div>
                                                                <div className="text-xs text-slate-500 truncate font-medium">@{u.email?.split('@')[0] || u.id}</div>
                                                            </div>
                                                        </Link>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Shops Results */}
                                {data?.shops?.length > 0 && (
                                    <section>
                                        <h3 className="text-base font-bold text-slate-900 mb-4 px-1">Cửa hàng</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {data.shops.slice(0, 3).map((s: any) => (
                                                <Card key={s.id} className="hover:bg-slate-50 border-none shadow-none bg-white group rounded-2xl transition-all">
                                                    <CardContent className="p-3 flex items-center gap-4">
                                                        <Link href={ROUTES.SHOP.SHOP_DETAIL(s.id)} className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center text-pink-600 overflow-hidden border border-slate-100 group-hover:border-pink-200 transition-all shadow-sm">
                                                                {s.logo_url ? (
                                                                    <img src={resolveMediaUrl(s.logo_url)} alt={s.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Store className="h-8 w-8 opacity-40" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{s.name}</div>
                                                                <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{s.description || 'Cửa hàng làm đẹp uy tín'}</div>
                                                                <div className="flex items-center gap-2 mt-1.5 font-medium">
                                                                    <div className="flex items-center gap-0.5 text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded text-[10px]">
                                                                        <Star className="h-3 w-3 fill-yellow-500" /> 4.9
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400">1.2k Đánh giá</span>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        <Link href={ROUTES.SHOP.SHOP_DETAIL(s.id)}>
                                                            <Button size="sm" variant="outline" className="rounded-full border-slate-200 text-slate-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 px-5 h-9 font-semibold">Ghé thăm</Button>
                                                        </Link>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </section>
                                )}

                            </div>
                        ) : (
                            /* Sub-tabs specific view */
                            <div className="space-y-4">
                                {data?.results?.length > 0 ? (
                                    <>
                                        {/* Result items based on type */}
                                        {type === 'product' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                {data.results.map((p: any) => (
                                                    <ProductCard
                                                        key={p.id}
                                                        product={p}
                                                        onProductClick={(product) => router.push(ROUTES.SHOP.PRODUCT_DETAIL(product.id))}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {type === 'user' && data.results.map((u: any) => (
                                            <Card key={u.id} className="hover:bg-white transition-all border-none shadow-none bg-slate-50 group rounded-2xl overflow-hidden">
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <Link href={ROUTES.PROFILE.PUBLIC(u.id)} className="flex items-center gap-4 flex-1">
                                                        <Avatar className="h-14 w-14 ring-2 ring-transparent group-hover:ring-pink-200 transition-all border border-slate-100">
                                                            <AvatarImage src={resolveMediaUrl(u.avatar_url)} />
                                                            <AvatarFallback className="bg-pink-50 text-pink-500 font-bold">{u.full_name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{u.full_name}</div>
                                                            <div className="text-xs text-slate-500 font-medium">@{u.email?.split('@')[0]}</div>
                                                        </div>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {type === 'shop' && data.results.map((s: any) => (
                                            <Card key={s.id} className="hover:bg-white border-none shadow-none bg-slate-50 group rounded-2xl transition-all overflow-hidden">
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <Link href={ROUTES.SHOP.SHOP_DETAIL(s.id)} className="flex items-center gap-4 flex-1">
                                                        <div className="h-16 w-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-pink-200 transition-all">
                                                            {s.logo_url ? <img src={resolveMediaUrl(s.logo_url)} className="w-full h-full object-cover" /> : <Store className="h-8 w-8 text-slate-200" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 truncate group-hover:text-pink-600 transition-colors">{s.name}</div>
                                                            <div className="text-xs text-slate-500 line-clamp-1 mt-1 font-medium">{s.description || 'Cửa hàng làm đẹp uy tín'}</div>
                                                        </div>
                                                    </Link>
                                                    <Link href={ROUTES.SHOP.SHOP_DETAIL(s.id)}>
                                                        <Button variant="outline" className="rounded-full px-6 border-slate-200 hover:border-pink-500 hover:text-pink-600 transition-all font-bold">Ghé thăm</Button>
                                                    </Link>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </>
                                ) : (
                                    /* Individual tab empty state */
                                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                                        <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                            <SearchX className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy kết quả phù hợp</h3>
                                        <p className="text-sm text-slate-500 max-w-[280px]">
                                            Chúng mình đã tìm khắp mọi nơi nhưng không thấy kết quả nào cho <span className="text-pink-600 font-bold">"{query}"</span> ở mục {
                                                type === 'product' ? 'Sản phẩm' :
                                                    type === 'shop' ? 'Cửa hàng' : 'Người dùng'
                                            }.
                                        </p>
                                        <Button variant="link" className="mt-4 text-pink-600 font-bold" onClick={() => handleTypeChange('all')}>
                                            Trở lại tìm kiếm chung
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Summary empty state for 'all' tab if NO results in ANY category */}
                        {type === 'all' && data &&
                            (!data.users || data.users.length === 0) &&
                            (!data.shops || data.shops.length === 0) &&
                            (!data.products || data.products.length === 0) && (
                                <div className="text-center py-24 bg-white rounded-3xl border border-slate-50 shadow-sm">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <SearchX className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy bất cứ gì</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Thử tìm kiếm với một từ khóa khác xem sao nhé!</p>
                                </div>
                            )
                        }
                    </div>
                )}
            </main>
        </div>
    );
}
