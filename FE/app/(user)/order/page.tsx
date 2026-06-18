import OrderListPage from "@/components/pages/order/OrderListPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <OrderListPage />
        </ProtectedPage>
    );
}
