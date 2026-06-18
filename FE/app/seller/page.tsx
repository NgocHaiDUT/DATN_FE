import { SellerDashboardOverviewPage } from "@/components/pages/SellerDashboardOverviewPage";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { SELLER_PERMISSIONS } from "@/constants/seller-permissions";

export default function Page() {
    return (
        <PermissionGuard permissions={[SELLER_PERMISSIONS.VIEW_DASHBOARD]}>
            <SellerDashboardOverviewPage />
        </PermissionGuard>
    )
}