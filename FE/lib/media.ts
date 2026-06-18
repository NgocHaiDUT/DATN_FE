"use client";

import { API_BASE_URL } from "@/lib/api";

/**
 * Chuẩn hoá đường dẫn media từ backend thành URL đầy đủ cho frontend.
 * - Nếu đã là http/blob/data: → trả nguyên.
 * - Nếu là relative path (postimages/..., videos/..., ...):
 *   + Nếu đã có prefix uploads/ → giữ nguyên.
 *   + Ngược lại tự thêm /uploads vào trước.
 */
export function resolveMediaUrl(raw?: string | null): string | undefined {
  if (!raw) return undefined;

  if (
    raw.startsWith("http") ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  let path = raw;

  if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
    path = path.startsWith("/") ? path : `/${path}`;
  } else {
    path = path.startsWith("/") ? `/uploads${path}` : `/uploads/${path}`;
  }

  return `${API_BASE_URL}${path}`;
}

