import { Suspense } from "react";
import { MakeupAR } from "@/components/pages/ai/MakeupAR";

export default function MakeupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <MakeupAR />
    </Suspense>
  );
}
