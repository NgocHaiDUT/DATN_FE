"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useExchangeToken } from "@/features/auth/useExchangeToken";
import { ROUTES } from "@/constants/routes";
import { Loader2 } from "lucide-react";

export default function OAuthCallbackPage() {
const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const exchangeToken = useExchangeToken();
  const hasProcessed = useRef(false);
useEffect(() => {
// Prevent multiple executions
    if (hasProcessed.current) {
return;
    }

    // Read directly from URL - simpler and more reliable
    if (typeof window === "undefined") {
return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const access_token = urlParams.get("access_token");
    const oauth_error = urlParams.get("oauth_error");
if (oauth_error) {
      hasProcessed.current = true;
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
      setTimeout(() => {
        router.push(ROUTES.AUTH.LOGIN);
      }, 3000);
      return;
    }

    // Handle Google OAuth (with code)
    if (code) {
      hasProcessed.current = true;
      // Mark code as in-flight to prevent duplicate processing on the same page instance
      sessionStorage.setItem("last_oauth_code", code);
      exchangeToken.mutate(
        { code },
        {
          onSuccess: () => {
          },
          onError: (err) => {
            // Clear stored code on error so user can retry
            sessionStorage.removeItem("last_oauth_code");
            setError(err.message || "Đăng nhập thất bại");
            setTimeout(() => {
              router.push(ROUTES.AUTH.LOGIN);
            }, 3000);
          },
        }
      );
      return;
    }

    // Handle Facebook OAuth (with access_token directly)
    if (access_token) {
      hasProcessed.current = true;
      // For Facebook, we get access_token directly
      // We need to set it and fetch user info
      const { setAccessToken } = require("@/stores/auth.store").useAuthStore.getState();
      setAccessToken(access_token);
      router.push(ROUTES.HOME);
      return;
    }

    // No code or access_token found
hasProcessed.current = true;
    setError("Không tìm thấy thông tin đăng nhập");
    setTimeout(() => {
      router.push(ROUTES.AUTH.LOGIN);
    }, 3000);
  }, [router, exchangeToken]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#c27aff] mx-auto mb-4" />
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}

