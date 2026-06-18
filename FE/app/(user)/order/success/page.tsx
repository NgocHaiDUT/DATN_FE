import { Suspense } from "react";
import OrderSuccessPage from "@/components/pages/order/OrderSuccessPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
                <OrderSuccessPage />
            </Suspense>
        </ProtectedPage>
    );
}
