"use client";

import { CreateShopPage } from "@/components/pages/profile/CreateShopPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function CreateShop() {
  return (
    <ProtectedPage>
      <CreateShopPage />
    </ProtectedPage>
  );
}

