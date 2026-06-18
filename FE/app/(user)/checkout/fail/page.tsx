import { Suspense } from "react";
import OrderFailPage from "@/components/pages/order/OrderFailPage";

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
            <OrderFailPage />
        </Suspense>
    );
}
