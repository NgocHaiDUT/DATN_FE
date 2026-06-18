import { CartPage } from "@/components/pages/cart/CartPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
  return (
    <ProtectedPage>
      <CartPage />
    </ProtectedPage>
  );
}

