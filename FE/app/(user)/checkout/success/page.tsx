import { Suspense } from "react";
import OrderSuccessPage from "@/components/pages/order/OrderSuccessPage";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <OrderSuccessPage />
        </Suspense>
    );
}
