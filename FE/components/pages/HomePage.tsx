"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    Star,
    Camera,
    Sparkles,
    TrendingUp,
    Heart,
    ShoppingBag,
    ArrowRight,
    ShieldCheck,
    Truck,
    Clock,
    CheckCircle2,
    PlayCircle,
    Loader2
} from "lucide-react";
import { useProducts } from "@/features/shop/useProducts";
import { ProductCard } from "@/components/common/ProductCard";
import { ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
// Assuming framer-motion might not be installed or I can't check, I'll stick to CSS transitions for safety.

export function HomePage() {
    const router = useRouter();
    const { data: products, isLoading, isError } = useProducts({ limit: 8 });

    const benefits = [
        { icon: Truck, title: "Miễn phí vận chuyển", desc: "Cho đơn hàng trên 500k" },
        { icon: ShieldCheck, title: "Hàng chính hãng", desc: "Cam kết 100% chất lượng" },
        { icon: Clock, title: "Giao hàng nhanh", desc: "Nhận hàng trong 24h" },
        { icon: CheckCircle2, title: "Đổi trả dễ dàng", desc: "Trong vòng 7 ngày" },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-white -mt-16">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 opacity-70"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="space-y-8 animate-in slide-in-from-left duration-700 fade-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-600 font-medium text-sm">
                                <Sparkles className="h-4 w-4" />
                                <span>Công nghệ làm đẹp AI</span>
                            </div>
                            <h1 className="text-4xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tight">
                                Vẻ đẹp của bạn, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">Sức mạnh của AI</span>
                            </h1>
                            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                                Khám phá phong cách trang điểm phù hợp nhất với công nghệ phân tích da và thử đồ ảo tiên tiến. Mua sắm thông minh, đẹp rạng ngời.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/ai-studio">
                                    <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        <Camera className="mr-2 h-5 w-5" />
                                        Thử AI Beauty
                                    </Button>
                                </Link>
                                <Link href="/shop">
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-slate-50 transition-all duration-300">
                                        <ShoppingBag className="mr-2 h-5 w-5" />
                                        Mua sắm ngay
                                    </Button>
                                </Link>
                            </div>
                        </div>


                    </div>
                </div>
            </section>


            {/* Trending Products */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="text-pink-500" />
                            Xu hướng hiện nay
                        </h2>
                        <p className="text-slate-500">Những sản phẩm được yêu thích nhất tuần này</p>
                    </div>
                    <Link href="/shop">
                        <Button variant="ghost" className="hidden sm:flex group">
                            Xem tất cả <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <ProductCard key={`skeleton_${i}`} skeleton />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* Display fetched products or empty state */}
                        {isError ? (
                            <div className="col-span-full text-center py-16 text-slate-400">
                                <p className="mb-2">Không thể tải sản phẩm. Vui lòng thử lại.</p>
                            </div>
                        ) : products && products.length > 0 ? (
                            products.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onProductClick={(p) => router.push(ROUTES.SHOP.PRODUCT_DETAIL(p.slug || p.id))}
                                />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-slate-400">
                                Chưa có sản phẩm nào
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-8 text-center sm:hidden">
                    <Link href="/shop">
                        <Button variant="outline" className="w-full">Xem tất cả</Button>
                    </Link>
                </div>
            </section>

            {/* AI Feature Highlight (Dark Mode Contrast) */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative">
                            <div className="bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl p-1">
                                <div className="bg-slate-900 rounded-xl overflow-hidden relative min-h-[400px]">
                                    <img
                                        src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&auto=format&fit=crop"
                                        alt="AI Analysis"
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    {/* AI overlay UI elements */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="w-24 h-24 border-2 border-white/50 rounded-full flex items-center justify-center animate-ping absolute"></div>
                                        <div className="w-24 h-24 border-2 border-white rounded-full flex items-center justify-center relative">
                                            <Sparkles className="text-white h-8 w-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="order-1 lg:order-2 space-y-8">
                            <Badge className="bg-pink-500 hover:bg-pink-600 border-none px-4 py-1 text-base">
                                Công nghệ mới
                            </Badge>
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                                AI Skin Analysis & <br /> Virtual Try-On
                            </h2>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                Không còn phải đoán mò về tông da hay màu son phù hợp. Công nghệ AI của chúng tôi phân tích khuôn mặt bạn trong vài giây để đưa ra gợi ý sản phẩm chính xác nhất.
                            </p>

                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <Camera className="text-purple-400 h-8 w-8 mb-3" />
                                <h4 className="font-bold text-lg mb-1">Thử trang điểm</h4>
                                <p className="text-sm text-slate-400">Thử hàng trăm màu son, phấn má ngay trên camera.</p>
                            </div>

                            <Link href="/ai-studio">
                                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 rounded-full h-12 px-8 font-bold">
                                    Trải nghiệm ngay <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Banner */}
            <section className="py-16 bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((b, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                                    <b.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{b.title}</h4>
                                    <p className="text-sm text-slate-500 mt-1">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}