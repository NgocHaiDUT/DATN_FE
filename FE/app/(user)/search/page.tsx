import { Suspense } from "react";
import { GeneralSearchPage } from "@/components/pages/search/GeneralSearchPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <GeneralSearchPage />
    </Suspense>
  );
}

