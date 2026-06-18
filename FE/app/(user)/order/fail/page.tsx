import { Suspense } from "react";
import OrderFailPage from "@/components/pages/order/OrderFailPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
                <OrderFailPage />
            </Suspense>
        </ProtectedPage>
    );
}
