"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("id") || searchParams.get("orderId");

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-xl overflow-hidden">
                <div className="h-2 bg-emerald-500" />
                <CardContent className="pt-12 pb-8 px-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Đặt hàng thành công!</h1>
                    <p className="text-slate-500 mb-8">
                        Cảm ơn bạn đã mua sắm tại Beauty. Đơn hàng <span className="font-bold text-slate-900">#{orderId}</span> của bạn đang được xử lý.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push("/order")}
                            className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 font-semibold"
                        >
                            Xem đơn hàng của tôi
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push("/")}
                                className="flex-1 h-12 rounded-full font-semibold border-slate-200"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Trang chủ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/shop")}
                                className="flex-1 h-12 rounded-full font-semibold border-slate-200"
                            >
                                <ShoppingBag className="h-4 w-4 mr-2" />
                                Mua thêm
                            </Button>
                        </div>
                    </div>

                    <p className="mt-8 text-xs text-slate-400">
                        Một email xác nhận đã được gửi tới địa chỉ email của bạn.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
