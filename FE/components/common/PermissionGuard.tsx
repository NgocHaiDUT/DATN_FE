"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/features/auth/usePermissions";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback,
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions, isOwner, loading } = usePermissions();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Owner has all permissions
  if (isOwner) {
    return <>{children}</>;
  }

  // No permissions required
  if (!permissions || permissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions
  const hasPermission = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với chủ shop để được cấp quyền.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <Button
                onClick={() => router.push("/seller")}
                className="w-full bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
              >
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
