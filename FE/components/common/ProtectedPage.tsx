"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { usePermissions } from "@/features/auth/usePermissions";
import { Loader2 } from "lucide-react";

export default function ProtectedPage({
    requiredPermission,
    children,
}: {
    requiredPermission?: string;
    children: ReactNode;
}) {
    const user = useAuthStore((s) => s.user);
    const { hasPermission, loading } = usePermissions();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        if (!user) {
            router.push("/login");
            return;
        }
        if (requiredPermission && !hasPermission(requiredPermission)) {
            router.push("/403");
        }
    }, [mounted, user, requiredPermission, hasPermission, router]);

    // Show spinner while Zustand is hydrating or shop data is loading
    if (!mounted || (!!user && loading && !!requiredPermission)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    // Not authenticated or missing permission – render nothing while navigating
    if (!user) return null;
    if (requiredPermission && !hasPermission(requiredPermission)) return null;

    return <>{children}</>;
}
