import OrderDetailPage from "@/components/pages/order/OrderDetailPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <OrderDetailPage />
        </ProtectedPage>
    );
}
