import { Suspense } from "react";
import { ProductSearchResultsPage } from "@/components/pages/search/ProductSearchResultsPage";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <ProductSearchResultsPage />
        </Suspense>
    );
}
