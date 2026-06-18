import { MessagesPage } from "@/components/pages/seller/MessagesPage";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { SELLER_PERMISSIONS } from "@/constants/seller-permissions";

export default function Page() {
  return (
    <PermissionGuard permissions={[SELLER_PERMISSIONS.CHAT_WITH_CUSTOMER]}>
      <MessagesPage />
    </PermissionGuard>
  );
}

