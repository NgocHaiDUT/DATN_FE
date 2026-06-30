import { ENDPOINTS } from "@/constants/endpoint";
import { apiClient } from "@/lib/api";

export type VrReviewPromptStatus = {
  should_show?: boolean;
  reason?: "available" | "reviewed_today" | "snoozed" | "review_cooldown" | string;
  last_review_at?: string | null;
  snooze_until?: string | null;
  next_available_at?: string | null;
};

export function unwrapVrReviewStatus(response: any): VrReviewPromptStatus {
  return response?.data?.data ?? response?.data ?? response ?? {};
}

export async function getVrReviewPromptStatus(): Promise<VrReviewPromptStatus> {
  const response = await apiClient(ENDPOINTS.MAKEUP.VR_REVIEW_STATUS, { method: "GET" });
  return unwrapVrReviewStatus(response);
}

export function getVrReviewUnavailableMessage(status: VrReviewPromptStatus) {
  const nextTime = status?.next_available_at
    ? new Date(status.next_available_at).toLocaleString("vi-VN")
    : "";

  if (status?.reason === "snoozed") {
    return nextTime
      ? `Bạn đã chọn nhắc lại sau. Có thể đánh giá từ ${nextTime}`
      : "Bạn đã chọn nhắc lại sau";
  }

  if (status?.reason === "reviewed_today" || status?.reason === "review_cooldown") {
    return nextTime
      ? `Bạn vừa đánh giá model. Có thể đánh giá lại từ ${nextTime}`
      : "Bạn vừa đánh giá model. Vui lòng thử lại sau 10 phút";
  }

  return "Hiện chưa thể mở đánh giá model";
}
