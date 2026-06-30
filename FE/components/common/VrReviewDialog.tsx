"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

type VrReviewDialogProps = {
  open: boolean;
  source: string;
  showSnoozeOptions?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
};

const aspectGroups = [
  {
    key: "realism",
    label: "Độ chân thật của lớp trang điểm",
    options: [
      { value: "very_good", label: "Rất tự nhiên" },
      { value: "good", label: "Ổn" },
      { value: "needs_work", label: "Cần tự nhiên hơn" },
    ],
  },
  {
    key: "color_match",
    label: "Màu sắc sau khi thử",
    options: [
      { value: "accurate", label: "Đúng màu sản phẩm" },
      { value: "acceptable", label: "Gần đúng" },
      { value: "inaccurate", label: "Lệch màu" },
    ],
  },
  {
    key: "face_fit",
    label: "Độ khớp với khuôn mặt",
    options: [
      { value: "stable", label: "Bám khuôn mặt tốt" },
      { value: "acceptable", label: "Chấp nhận được" },
      { value: "unstable", label: "Dễ bị lệch" },
    ],
  },
  {
    key: "performance",
    label: "Tốc độ và độ mượt",
    options: [
      { value: "smooth", label: "Mượt" },
      { value: "normal", label: "Bình thường" },
      { value: "slow", label: "Còn chậm" },
    ],
  },
] as const;

const suggestionOptions = [
  { value: "more_natural_color", label: "Màu lên tự nhiên hơn" },
  { value: "better_face_tracking", label: "Bắt khuôn mặt ổn định hơn" },
  { value: "more_makeup_styles", label: "Thêm nhiều phong cách trang điểm" },
  { value: "faster_processing", label: "Tăng tốc độ xử lý" },
  { value: "clearer_product_preview", label: "Xem sản phẩm rõ hơn khi thử" },
] as const;

export function VrReviewDialog({
  open,
  source,
  showSnoozeOptions = false,
  onOpenChange,
  onSubmitted,
}: VrReviewDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [aspects, setAspects] = useState<Record<string, string>>({
    realism: "very_good",
    color_match: "accurate",
    face_fit: "stable",
    performance: "smooth",
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const toggleSuggestion = (value: string) => {
    setSuggestions((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    try {
      const response: any = await apiClient(ENDPOINTS.MAKEUP.VR_REVIEW_SUBMIT, {
        method: "POST",
        body: JSON.stringify({
          rating,
          source,
          aspects,
          suggestions,
        }),
      });
      const voucher = response?.data?.voucher;
      const alreadyReceivedVoucher = response?.data?.voucher_already_granted;
      queryClient.invalidateQueries({ queryKey: ["my-vouchers"] });
      const expiresAt = voucher?.expires_at
        ? new Date(voucher.expires_at).toLocaleDateString("vi-VN")
        : "";
      const toastMessage = voucher
        ? expiresAt
          ? `\u0110\u00e3 nh\u1eadn voucher gi\u1ea3m 30.000\u0111 ph\u00ed ship, h\u1ea1n d\u00f9ng ${expiresAt}`
          : "\u0110\u00e3 nh\u1eadn voucher gi\u1ea3m 30.000\u0111 ph\u00ed ship"
        : alreadyReceivedVoucher
          ? "\u0110\u00e3 g\u1eedi \u0111\u00e1nh gi\u00e1. Voucher \u0111\u00e1nh gi\u00e1 model \u0111\u00e3 \u0111\u01b0\u1ee3c nh\u1eadn tr\u01b0\u1edbc \u0111\u00f3."
          : "\u0110\u00e3 g\u1eedi \u0111\u00e1nh gi\u00e1.";
      toast.success(toastMessage, {
        action: {
          label: "Xem voucher",
          onClick: () => router.push("/profile?tab=vouchers"),
        },
      });
      onSubmitted?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Không thể gửi đánh giá lúc này");
    } finally {
      setIsSubmitting(false);
    }
  };

  const snoozePrompt = async (payload: { days?: number; minutes?: number }) => {
    try {
      await apiClient(ENDPOINTS.MAKEUP.VR_REVIEW_SNOOZE, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch {
      // Không chặn thao tác đóng popup nếu lưu nhắc lại thất bại.
    }
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <Card className="relative w-full max-w-2xl border-pink-100 shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
        <CardHeader className="space-y-2 pr-12">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Đánh giá trải nghiệm thử trang điểm</CardTitle>
              <p className="text-sm text-muted-foreground">
                Chọn nhanh cảm nhận của bạn để nhận voucher giảm 30.000đ phí ship nếu chưa nhận trước đó.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[75vh] space-y-5 overflow-y-auto">
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Mức độ hài lòng chung</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="rounded-full p-1 transition hover:bg-pink-50"
                  aria-label={`${star} sao`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {aspectGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">{group.label}</p>
                <div className="grid gap-2">
                  {group.options.map((option) => {
                    const selected = aspects[group.key] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAspects((current) => ({ ...current, [group.key]: option.value }))
                        }
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          selected
                            ? "border-pink-400 bg-pink-50 text-pink-700"
                            : "border-slate-200 hover:border-pink-200 hover:bg-pink-50/60"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Bạn muốn cải thiện thêm phần nào?</p>
            <div className="flex flex-wrap gap-2">
              {suggestionOptions.map((option) => {
                const selected = suggestions.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleSuggestion(option.value)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selected
                        ? "border-pink-400 bg-pink-50 text-pink-700"
                        : "border-slate-200 hover:border-pink-200 hover:bg-pink-50/60"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Button
              onClick={submitReview}
              disabled={isSubmitting}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gửi đánh giá
            </Button>
            {showSnoozeOptions ? (
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => snoozePrompt({ minutes: 10 })}>
                  {"Kh\u00f4ng h\u1ecfi l\u1ea1i 10 ph\u00fat"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => snoozePrompt({ days: 7 })}>
                  Không hỏi lại 7 ngày
                </Button>
                <Button variant="outline" size="sm" onClick={() => snoozePrompt({ days: 30 })}>
                  Không hỏi lại 30 ngày
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
