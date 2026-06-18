import { Suspense } from "react";
import CheckoutPage from "@/components/pages/checkout/CheckoutPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
                <CheckoutPage />
            </Suspense>
        </ProtectedPage>
    );
}
