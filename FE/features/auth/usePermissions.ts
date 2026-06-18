"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useShop } from "@/features/shop/useShop";
import { useMemo } from "react";

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const { shop, isLoading } = useShop();

  // Check if user has seller permissions (view_dashboard)
  const hasDashboardPermission = useMemo(() => {
    return (user?.permissions || []).includes('view_dashboard');
  }, [user?.permissions]);

  // ✅ User is OWNER only if they created the shop (owner_id matches)
  // Having view_dashboard doesn't make you owner - you could be staff!
  const isOwner = useMemo(() => {
    return !!user?.id && !!shop?.owner_id && user.id === shop.owner_id;
  }, [user?.id, shop?.owner_id]);

  // Check if user is manager
  const isManager = useMemo(() => {
    if (!shop?.staff || !user?.id) return false;
    const staffMember = shop.staff.find((s: any) => s.user_id === user.id);
    return staffMember?.is_manager === true;
  }, [shop?.staff, user?.id]);

  // Check if user is staff (not owner, but has shop access)
  const isStaff = useMemo(() => {
    if (isOwner) return false; // Owner is not staff
    if (!shop?.staff || !user?.id) return false;
    return shop.staff.some((s: any) => s.user_id === user.id);
  }, [shop?.staff, user?.id, isOwner]);

  // Get staff permissions from shop data if user is staff
  const staffPermissions = useMemo(() => {
    if (!shop?.staff || !user?.id) return [];

    // Find current user in staff list
    const staffMember = shop.staff.find((s: any) => s.user_id === user.id);
    if (!staffMember) return [];

    // Extract permission names from permission objects
    return (staffMember.permissions || []).map((p: any) =>
      typeof p === 'string' ? p : p.name
    );
  }, [shop?.staff, user?.id]);

  // Combine user permissions and staff permissions
  const allPermissions = useMemo(() => {
    const userPerms = user?.permissions || [];

    console.log('🔍 [usePermissions] Debug:', {
      userId: user?.id,
      userPerms_count: userPerms.length,
      userPerms: userPerms,
      isOwner,
      isManager,
      isStaff,
      hasDashboardPermission,
      shopLoading: isLoading,
      hasShop: !!shop,
      shopOwnerId: shop?.owner_id
    });

    const filteredUserPerms = (isOwner || isManager)
      ? userPerms
      : userPerms.filter(p => p !== 'manage_shop_staff');

    console.log('✅ [usePermissions] Filtered:', {
      filtered_count: filteredUserPerms.length,
      staffPerms_count: staffPermissions.length
    });

    const combined = [...new Set([...filteredUserPerms, ...staffPermissions])];

    console.log('🎯 [usePermissions] Final:', combined.length, 'permissions');

    return combined;
  }, [user?.permissions, staffPermissions, isOwner, isManager, hasDashboardPermission, isLoading, shop, user?.id]);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (isOwner) return true;
    // Managers have access to manage_shop_staff
    if (isManager && permission === 'manage_shop_staff') return true;
    return allPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return true;
    if (isOwner) return true;
    // Managers have access to manage_shop_staff
    if (isManager && permissions.includes('manage_shop_staff')) return true;
    return permissions.some((p) => allPermissions.includes(p));
  };

  const hasAllPermissions = (permissions?: string[]) => {
    if (!permissions || permissions.length === 0) return true;
    if (isOwner) return true;
    // Managers have access to manage_shop_staff
    if (isManager && permissions.includes('manage_shop_staff')) {
      const otherPerms = permissions.filter(p => p !== 'manage_shop_staff');
      if (otherPerms.length === 0) return true;
      return otherPerms.every((p) => allPermissions.includes(p));
    }
    return permissions.every((p) => allPermissions.includes(p));
  };

  return {
    user,
    shop,
    isOwner,
    isManager,
    isStaff, // ✅ Add staff flag
    loading: isLoading,
    permissions: allPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
