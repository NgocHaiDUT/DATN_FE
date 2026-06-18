import { Suspense } from "react";
import ChatPage from "@/components/pages/chat/ChatPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
  return (
    <ProtectedPage>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
        <ChatPage />
      </Suspense>
    </ProtectedPage>
  );
}