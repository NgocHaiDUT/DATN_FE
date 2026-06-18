import { ProfilePage } from "@/components/pages/profile/ProfilePage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
  return (
    <ProtectedPage>
      <ProfilePage />
    </ProtectedPage>
  );
}

