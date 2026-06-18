"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, ShoppingBag, ArrowRight, Home, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getVnpayUrl } from "@/lib/api/order";
import { toast } from "sonner";

export default function OrderFailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("id") || searchParams.get("orderId");
    const message = searchParams.get("message") || "Giao dịch không thành công hoặc đã bị hủy.";
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetryPayment = async () => {
        if (!orderId) {
            router.push("/checkout");
            return;
        }

        setIsRetrying(true);
        try {
            const res = await getVnpayUrl(Number(orderId));
            if (res?.paymentUrl) {
                window.location.href = res.paymentUrl;
            } else {
                toast.error("Không thể tạo liên kết thanh toán mới. Vui lòng thử lại sau.");
            }
        } catch (error) {
            console.error("Retry payment error:", error);
            toast.error("Có lỗi xảy ra khi tạo liên kết thanh toán.");
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-xl overflow-hidden">
                <div className="h-2 bg-red-500" />
                <CardContent className="pt-12 pb-8 px-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="h-10 w-10 text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanh toán thất bại</h1>
                    <p className="text-slate-500 mb-4">
                        {orderId ? (
                            <>Rất tiếc, thanh toán cho đơn hàng <span className="font-bold text-slate-900">#{orderId}</span> gặp sự cố.</>
                        ) : (
                            <>Rất tiếc, quá trình thanh toán đã gặp sự cố.</>
                        )}
                    </p>

                    <div className="bg-red-50 p-4 rounded-xl flex items-start gap-3 mb-8 text-left border border-red-100">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 italic">
                            {decodeURIComponent(message)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            onClick={handleRetryPayment}
                            disabled={isRetrying}
                            className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 font-semibold"
                        >
                            {isRetrying ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ArrowRight className="h-4 w-4 mr-2" />
                            )}
                            Thanh toán lại ngay
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
                                Shop
                            </Button>
                        </div>
                    </div>

                    <p className="mt-8 text-xs text-slate-400">
                        Nếu tiền đã bị trừ nhưng đơn hàng chưa được xác nhận, vui lòng liên hệ bộ phận hỗ trợ.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
