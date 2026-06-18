"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SELLER_PERMISSIONS as PERMISSIONS, SELLER_PERMISSION_DETAILS as PERMISSION_DETAILS } from '@/constants/seller-permissions';
import { useStaffPermissions } from '@/features/seller/useShopSettings';
import { useI18n } from '@/lib/i18n/I18nContext';

// Default permissions for staff role - these cannot be managed
const DEFAULT_STAFF_PERMISSIONS = [
  'view_dashboard',
  'manage_order', 
  'chat_with_customer'
];

interface PermissionManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
  shopId: number;
  onUpdatePermissions: (staff: any, newPermissions: string[], oldPermissions: string[]) => Promise<void>;
}

export function PermissionManagementDialog({ 
  isOpen, 
  onClose, 
  staff,
  shopId,
  onUpdatePermissions 
}: PermissionManagementDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  // Load permissions from API
  const { data: permissionsData, isLoading: isLoadingPermissions, refetch } = useStaffPermissions(
    shopId, 
    staff?.email
  );

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPermissions([]);
      setOriginalPermissions([]);
    } else {
      // Refetch permissions when dialog opens
      refetch();
    }
  }, [isOpen, refetch]);

  // Update permissions when data loads
  useEffect(() => {
    if (permissionsData && isOpen) {
const allPermissions = Array.isArray(permissionsData) 
        ? permissionsData 
        : (permissionsData?.permissions || permissionsData?.data || []);
// Only take shop-related permissions from SELLER_PERMISSIONS
      const validShopPermissions = Object.values(PERMISSIONS) as string[];
// Handle both string and object formats
      const staffShopPermissions = allPermissions
        .map((p: any) => {
          // Handle different permission formats
          if (typeof p === 'string') return p;
          if (p?.name) return p.name;
          if (p?.permission) return p.permission;
return null;
        })
        .filter((p: string | null): p is string => {
          // Filter out: nulls, invalid permissions, owner-only, and default staff permissions
          return p !== null && 
                 validShopPermissions.includes(p) && 
                 p !== PERMISSIONS.MANAGE_SHOP_STAFF &&
                 !DEFAULT_STAFF_PERMISSIONS.includes(p);
        });
      setSelectedPermissions(staffShopPermissions);
      setOriginalPermissions(staffShopPermissions);
    }
  }, [permissionsData, isOpen]);

  // Group permissions by category (exclude owner-only and default staff permissions)
  const groupedPermissions = Object.entries(PERMISSION_DETAILS)
    .filter(([permissionValue]) => 
      permissionValue !== PERMISSIONS.MANAGE_SHOP_STAFF &&
      !DEFAULT_STAFF_PERMISSIONS.includes(permissionValue)
    )
    .reduce((acc, [permissionValue, details]) => {
      const category = (details as any).category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        permissionValue, // This is the actual permission string like "manage_product"
        ...details
      });
      return acc;
    }, {} as Record<string, any[]>);

  const handlePermissionToggle = (permission: string) => {
setSelectedPermissions(prev => {
      const newPermissions = prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission];
return newPermissions;
    });
  };

  const handleSelectAll = () => {
    // Exclude owner-only and default staff permissions
    const allPermissions = (Object.values(PERMISSIONS) as string[])
      .filter(p => 
        p !== PERMISSIONS.MANAGE_SHOP_STAFF &&
        !DEFAULT_STAFF_PERMISSIONS.includes(p)
      );
setSelectedPermissions(allPermissions);
  };

  const handleDeselectAll = () => {
setSelectedPermissions([]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdatePermissions(staff, selectedPermissions, originalPermissions);
      onClose();
    } catch (error: any) {
alert(error.message || t('seller.permissions.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            {t('seller.permissions.title')} - {staff.name}
          </DialogTitle>
          <DialogDescription>
            {t('seller.permissions.desc')}
            <br />
            <span className="text-xs text-muted-foreground">{t('seller.permissions.note')}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoadingPermissions ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-500">{t('seller.permissions.loading')}</p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                type="button"
              >
                <Check className="w-4 h-4 mr-2" />
                {t('seller.permissions.selectAll')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeselectAll}
                type="button"
              >
                <X className="w-4 h-4 mr-2" />
                {t('seller.permissions.deselectAll')}
              </Button>
              <div className="flex-1"></div>
              <Badge variant="secondary">
                {selectedPermissions.length} / {Object.keys(PERMISSIONS).length - 1 - DEFAULT_STAFF_PERMISSIONS.length} {t('seller.permissions.count')}
              </Badge>
            </div>

            {/* Permissions by Category */}
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissions.map((perm: any) => {
                      const permissionValue = perm.permissionValue; // Use the actual permission value
                      const isChecked = selectedPermissions.includes(permissionValue);
                      
                      return (
                        <div
                          key={permissionValue}
                          className={`
                            flex items-start space-x-3 p-3 rounded-lg border transition-colors
                            ${isChecked ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'}
                          `}
                        >
                          <Checkbox
                            id={permissionValue}
                            checked={isChecked}
                            onCheckedChange={() => handlePermissionToggle(permissionValue)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={permissionValue}
                              className="font-medium text-sm cursor-pointer"
                            >
                              {perm.name}
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isLoadingPermissions}
            className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
          >
            {isLoading ? t('seller.permissions.saving') : t('seller.permissions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
