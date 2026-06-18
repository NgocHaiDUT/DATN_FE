"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMyVouchers } from "@/features/order/useOrder";
import { Gift, Loader2, Truck } from "lucide-react";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "Không giới hạn";
  return new Date(value).toLocaleDateString("vi-VN");
};

export function UserVouchersTab() {
  const { data, isLoading } = useMyVouchers();
  const vouchers = ((data as any)?.data || data || []) as any[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải voucher...
      </div>
    );
  }

  const available = vouchers.filter((voucher) => voucher.status === "available");
  const unavailable = vouchers.filter((voucher) => voucher.status !== "available");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Voucher của tôi</h3>
        <p className="text-sm text-slate-500"> Mỗi đơn hàng chỉ được chọn một voucher.</p>
      </div>

      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            <Gift className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            Bạn chưa có voucher nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {[...available, ...unavailable].map((voucher) => {
            const coupon = voucher.coupon || {};
            const isShipping = coupon.voucher_type === "shipping";
            return (
              <Card key={voucher.id} className={voucher.status === "available" ? "border-pink-100" : "opacity-60"}>
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                    {isShipping ? <Truck className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{coupon.description || coupon.code}</h4>
                      <Badge variant={voucher.status === "available" ? "default" : "secondary"}>
                        {voucher.status === "available" ? "Có thể dùng" : voucher.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {coupon.discount_type === "percentage"
                        ? `Giảm ${coupon.discount_value}%`
                        : `Giảm ${formatPrice(Number(coupon.discount_value || 0))}`}{" "}
                      {isShipping ? "phí vận chuyển" : "đơn hàng"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Hạn dùng: {formatDate(voucher.expires_at)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
