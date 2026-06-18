
import type { Metadata } from "next";
import { ReactNode, Suspense } from "react";
import Navbar from "@/components/common/Navbar";
import { ChatbotWidget } from "@/components/common/ChatbotWidget";

export const metadata: Metadata = {
  title: "BeautyAI - Nền tảng làm đẹp với AI",
  description: "Khám phá thế giới làm đẹp với công nghệ AI tiên tiến. Mua sắm mỹ phẩm, học hỏi từ hướng dẫn làm đẹp và kết nối với cộng đồng.",
};

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <ChatbotWidget />
    </div>
  );
}
