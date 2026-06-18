"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUserWallet, useUserWalletTransactions, useInitiateTopup } from "@/features/order/useOrder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Loader2, RefreshCcw, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export function UserWalletTab() {
  const searchParams = useSearchParams();
  const { data: walletRes, isLoading: walletLoading, refetch } = useUserWallet();
  const { data: txRes, isLoading: txLoading } = useUserWalletTransactions({ page: 1, limit: 20 });
  const topupMutation = useInitiateTopup();

  const [topupAmount, setTopupAmount] = useState("");
  const [showTopup, setShowTopup] = useState(false);

  const wallet: any = (walletRes as any)?.data || walletRes;
  const transactions: any[] = (txRes as any)?.data?.items || (txRes as any)?.items || [];

  // Show result toast when redirected back from VNPay
  useEffect(() => {
    const topup = searchParams.get("topup");
    if (topup === "success") {
      toast.success("Nạp tiền vào ví thành công!");
      refetch();
    } else if (topup === "fail") {
      toast.error("Nạp tiền thất bại. Vui lòng thử lại.");
    }
  }, [searchParams]);

  const handleTopup = async () => {
    const amount = Number(topupAmount.replace(/\D/g, ""));
    if (!amount || amount < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10,000₫");
      return;
    }
    try {
      const res: any = await topupMutation.mutateAsync(amount);
      const paymentUrl = res?.data?.paymentUrl || res?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo liên kết thanh toán");
    }
  };

  const txTypeLabel = (type: string) => {
    switch (type) {
      case "refund": return "Hoàn tiền đơn hàng";
      case "topup": return "Nạp tiền";
      case "payment": return "Thanh toán đơn hàng";
      default: return type;
    }
  };

  const txIcon = (type: string) =>
    type === "payment"
      ? <ArrowUpCircle className="h-4 w-4 text-red-500" />
      : <ArrowDownCircle className="h-4 w-4 text-emerald-600" />;

  if (walletLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance card */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Ví của tôi
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center mb-4">
            <p className="text-sm text-slate-500 mb-1">Số dư hiện tại</p>
            <p className="text-4xl font-black text-emerald-700">
              {formatPrice(wallet?.balance ?? 0)}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Dùng để thanh toán đơn hàng hoặc nhận tiền hoàn
            </p>
          </div>

          {/* Top-up section */}
          {showTopup ? (
            <div className="space-y-3 border rounded-xl p-4 bg-slate-50">
              <p className="text-sm font-medium text-slate-700">Chọn số tiền nạp</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={topupAmount === String(amt) ? "default" : "outline"}
                    size="sm"
                    className="rounded-full text-xs"
                    onClick={() => setTopupAmount(String(amt))}
                  >
                    {formatPrice(amt)}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Hoặc nhập số tiền khác..."
                value={topupAmount ? formatPrice(Number(topupAmount)).replace("₫", "").trim() : ""}
                onChange={(e) => setTopupAmount(e.target.value.replace(/\D/g, ""))}
                className="mt-1"
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleTopup}
                  disabled={topupMutation.isPending}
                >
                  {topupMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Nạp tiền qua VNPay
                </Button>
                <Button variant="outline" onClick={() => { setShowTopup(false); setTopupAmount(""); }}>
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowTopup(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nạp tiền vào ví
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-slate-500" />
            Lịch sử giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <ul className="divide-y">
              {transactions.map((tx: any) => {
                const isDebit = tx.type === "payment";
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isDebit ? "bg-red-50" : "bg-emerald-100"}`}>
                        {txIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {tx.note || txTypeLabel(tx.type)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {tx.created_at
                            ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: vi })
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={`border-0 font-semibold ${isDebit ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isDebit ? "-" : "+"}{formatPrice(Number(tx.amount))}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
