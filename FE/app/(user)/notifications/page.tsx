import NotificationsPage from "@/components/pages/notifications/NotificationsPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function Page() {
    return (
        <ProtectedPage>
            <NotificationsPage />
        </ProtectedPage>
    );
}
