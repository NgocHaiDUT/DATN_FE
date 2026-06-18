import AIStudioPage from "@/components/pages/AIStudioPage";
import ProtectedPage from "@/components/common/ProtectedPage";

export default function AIStudioRoute() {
  return (
    <ProtectedPage>
      <AIStudioPage />
    </ProtectedPage>
  );
}

