import { OrderManagementPage } from "@/components/pages/seller/OrderManagementPage";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { SELLER_PERMISSIONS } from "@/constants/seller-permissions";

export default function Page() {
  return (
    <PermissionGuard permissions={[SELLER_PERMISSIONS.MANAGE_ORDER]}>
      <OrderManagementPage />
    </PermissionGuard>
  );
}

