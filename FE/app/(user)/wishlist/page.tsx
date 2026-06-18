import { WishlistPage } from "@/components/pages/wishlist/WishlistPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <WishlistPage />
        </ProtectedPage>
    );
}
