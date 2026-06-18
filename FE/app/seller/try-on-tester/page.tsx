import { TryOnTesterPage } from "@/components/pages/seller/TryOnTesterPage";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { SELLER_PERMISSIONS } from "@/constants/seller-permissions";

export default function Page() {
  return (
    <PermissionGuard permissions={[SELLER_PERMISSIONS.TRY_ON_TESTER]}>
      <TryOnTesterPage />
    </PermissionGuard>
  );
}

