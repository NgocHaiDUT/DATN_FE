"use client";

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  useStaffList,
  useAddStaff,
  useDeleteStaff,
  useUpdateStaffPermissions,
} from '@/features/seller/useShopSettings';
import { SELLER_PERMISSIONS as PERMISSIONS, SELLER_PERMISSION_DETAILS as PERMISSION_DETAILS } from '@/constants/seller-permissions';
import { PermissionManagementDialog } from '@/components/pages/seller/PermissionManagementDialog';
import { UserEmailAutocomplete } from '@/components/pages/seller/UserEmailAutocomplete';

interface StaffManagementProps {
  shopId: number;
}

export function StaffManagement({ shopId }: StaffManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Form state
  const [staffFormData, setStaffFormData] = useState({
    email: '',
    name: '',
    is_manager: false
  });

  // Queries & Mutations
  const { data: staffData, isLoading, refetch } = useStaffList(shopId);
  const addStaffMutation = useAddStaff(shopId);
  const deleteStaffMutation = useDeleteStaff(shopId);
  const updatePermissionsMutation = useUpdateStaffPermissions(shopId);

  const staffList = React.useMemo(() => {
    const rawData = Array.isArray(staffData?.data) 
      ? staffData.data 
      : Array.isArray(staffData) 
      ? staffData 
      : [];
    
    return rawData.map((staff: any) => {
      // Extract permission names from permission objects
      const permissionNames = (staff.permissions || []).map((p: any) => 
        typeof p === 'string' ? p : p.name
      );
      
      return {
        id: staff.id,
        userId: staff.user_id,
        shopId: staff.shop_id,
        name: staff.user?.full_name || staff.user?.email || 'Unknown',
        email: staff.user?.email || '',
        phone: staff.user?.phone || '',
        avatar: staff.user?.avatar_url || '',
        role: staff.is_manager ? 'Manager' : 'Staff',
        isActive: true,
        isManager: staff.is_manager,
        permissions: permissionNames,
        createdAt: staff.created_at,
        lastActiveAt: staff.updated_at || staff.created_at
      };
    });
  }, [staffData]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addStaffMutation.mutateAsync({
        staffEmail: staffFormData.email,
        isManager: staffFormData.is_manager,
      });
      
      // If is_manager = true, automatically add all permissions
      if (staffFormData.is_manager) {
        try {
          const allPermissions = Object.values(PERMISSIONS);
          await updatePermissionsMutation.mutateAsync({
            staffEmail: staffFormData.email,
            permissions: allPermissions as string[],
          });
        } catch (permError) {
          alert('Nhân viên đã được thêm nhưng có lỗi khi gán quyền. Vui lòng gán quyền thủ công.');
        }
      }
      
      setIsAddStaffOpen(false);
      setStaffFormData({ email: '', name: '', is_manager: false });
      refetch();
      alert('Thêm nhân viên thành công!');
    } catch (error: any) {
alert(error.message || 'Có lỗi xảy ra khi thêm nhân viên');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Tính năng cập nhật thông tin nhân viên chưa được hỗ trợ. Bạn có thể xóa và thêm lại nhân viên với thông tin mới.');
    setIsEditStaffOpen(false);
    setSelectedStaff(null);
  };

  const handleDeleteStaff = async (staff: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên ${staff.name}?`)) {
      return;
    }

    try {
      await deleteStaffMutation.mutateAsync(staff.email);
      refetch();
      alert('Xóa nhân viên thành công!');
    } catch (error: any) {
alert(error.message || 'Có lỗi xảy ra khi xóa nhân viên');
    }
  };

  const handleToggleStatus = async (staff: any, currentStatus: boolean) => {
    alert('Chức năng này chưa khả dụng');
  };

  const handleUpdatePermissions = async (staff: any, newPermissions: string[], oldPermissions: string[]) => {
    try {
      // Default permissions that all staff should have
      const DEFAULT_STAFF_PERMISSIONS = [
        'view_dashboard',
        'manage_order', 
        'chat_with_customer'
      ];

      // Always include default permissions when updating
      // Backend uses full replace strategy, so we need to send complete permission list
      const fullPermissions = [...new Set([...DEFAULT_STAFF_PERMISSIONS, ...newPermissions])];

      // Send all permissions to backend (full replace)
      await updatePermissionsMutation.mutateAsync({
        staffEmail: staff.email,
        permissions: fullPermissions,
      });

      refetch();
      alert('Cập nhật quyền hạn thành công!');
    } catch (error) {
      throw error;
    }
  };

  const openEditDialog = (staff: any) => {
    setSelectedStaff(staff);
    setStaffFormData({
      email: staff.email || '',
      name: staff.name || '',
      is_manager: staff.isManager || false
    });
    setIsEditStaffOpen(true);
  };

  const openPermissionDialog = (staff: any) => {
    setSelectedStaff(staff);
    setIsPermissionDialogOpen(true);
  };

  const filteredStaff = staffList.filter((staff: any) =>
    staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            setStaffFormData({ email: '', name: '', is_manager: false });
            setIsAddStaffOpen(true);
          }}
          className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-gray-500">Đang tải...</p>
            </CardContent>
          </Card>
        ) : filteredStaff.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              {searchQuery ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
            </CardContent>
          </Card>
        ) : (
          filteredStaff.map((staff: any) => (
            <Card key={staff.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={staff.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white text-lg">
                      {staff.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'NA'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {staff.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={staff.isActive ? 'default' : 'secondary'}
                            className={
                              staff.isActive
                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {staff.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Đang hoạt động
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Không hoạt động
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(staff)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPermissionDialog(staff)}>
                            <Shield className="w-4 h-4 mr-2" />
                            Quản lý quyền hạn
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(staff, staff.isActive)}
                          >
                            {staff.isActive ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteStaff(staff)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Contact Info */}
                    <div className="mt-4 space-y-2">
                      {staff.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {staff.email}
                        </div>
                      )}
                      {staff.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {staff.phone}
                        </div>
                      )}
                      {staff.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Tham gia: {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>

                    {/* Permissions Preview */}
                    {staff.permissions && staff.permissions.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700 font-medium">Quyền hạn:</span>
                          {staff.permissions.slice(0, 3).map((permission: string, idx: number) => {
                            // Get friendly name from PERMISSION_DETAILS
                            const permDetails = Object.entries(PERMISSION_DETAILS).find(
                              ([key, details]) => key === permission
                            );
                            const displayName = permDetails ? permDetails[1].name : permission;
                            
                            return (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {displayName}
                              </Badge>
                            );
                          })}
                          {staff.permissions.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{staff.permissions.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhân viên mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin nhân viên mới để gửi lời mời tham gia shop
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <UserEmailAutocomplete
              value={staffFormData.email}
              onChange={(email) => setStaffFormData({ ...staffFormData, email })}
              label="Email"
              placeholder="Tìm kiếm và chọn nhân viên..."
              required
              id="addEmail"
            />
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="isManager" className="font-medium">
                  Quản lý cửa hàng
                </Label>
                <p className="text-sm text-gray-600">
                  Cho phép nhân viên này quản lý shop (tự động cấp toàn bộ quyền)
                </p>
              </div>
              <Switch
                id="isManager"
                checked={staffFormData.is_manager}
                onCheckedChange={(checked) =>
                  setStaffFormData({ ...staffFormData, is_manager: checked })
                }
              />
            </div>
            {staffFormData.is_manager && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  ⚠️ Quản lý shop sẽ tự động được cấp toàn bộ quyền hạn
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddStaffOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
                disabled={addStaffMutation.isPending}
              >
                {addStaffMutation.isPending ? 'Đang thêm...' : 'Thêm nhân viên'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin nhân viên</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div>
              <Label htmlFor="editName">Họ và tên *</Label>
              <Input
                id="editName"
                value={staffFormData.name}
                onChange={(e) =>
                  setStaffFormData({ ...staffFormData, name: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={staffFormData.email}
                onChange={(e) =>
                  setStaffFormData({ ...staffFormData, email: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditStaffOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
              >
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permission Management Dialog */}
      <PermissionManagementDialog
        isOpen={isPermissionDialogOpen}
        onClose={() => {
          setIsPermissionDialogOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
        shopId={shopId}
        onUpdatePermissions={handleUpdatePermissions}
      />
    </div>
  );
}
