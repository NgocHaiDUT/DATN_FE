import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/common/Providers";
import Navbar from "@/components/common/Navbar";
import { Toaster } from "@/components/ui/toaster";
export const metadata: Metadata = {
  title: {
    default: "BeautyAI - Nền tảng làm đẹp với AI",
    template: "%s | BeautyAI",
  },
  description: "Khám phá thế giới làm đẹp với công nghệ AI tiên tiến. Mua sắm mỹ phẩm, học hỏi từ hướng dẫn làm đẹp và kết nối với cộng đồng.",
};

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <main>{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>

  );
}
