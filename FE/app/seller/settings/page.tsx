"use client";

import { SettingsPage } from "@/components/pages/seller/SettingsPage";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { SELLER_PERMISSIONS } from "@/constants/seller-permissions";

export default function Page() {
  return (
    <PermissionGuard permissions={[SELLER_PERMISSIONS.EDIT_PROFILE_SHOP, SELLER_PERMISSIONS.MANAGE_SHOP_SETTING]}>
      <SettingsPage />
    </PermissionGuard>
  );
}
