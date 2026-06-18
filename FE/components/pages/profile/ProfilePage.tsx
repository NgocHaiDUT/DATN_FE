"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { OnlineStatus } from "@/components/common/OnlineStatus";
import { useAuthStore } from "@/stores/auth.store";
import { useShop } from "@/features/shop/useShop";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { resolveMediaUrl } from "@/lib/media";
import { formatTimeAgo } from "@/lib/utils";
import { usePermissions } from "@/features/auth/usePermissions";
import { useUpdateFullName, useUpdatePhone, useUpdateAvatar, useUpdateStory } from "@/features/profile/useProfile";
import { useChangePassword } from "@/features/auth/useChangePassword";
import { useAddresses, useDeleteAddress } from "@/features/profile/useAddresses";
import { useLogout } from "@/features/auth/useLogout";
import { useWishlist } from "@/features/shop/useWishlist";
import { ProductCard } from "@/components/common/ProductCard";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import {
  User,
  Settings,
  Bell,
  Shield,
  Heart,
  Bookmark,
  ShoppingBag,
  Camera,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Star,
  Eye,
  Share2,
  Download,
  Trash2,
  LogOut,
  MessageCircle,
  Moon,
  Sun,
  Globe,
  Lock,
  Palette,
  Sparkles,
  Target,
  BarChart3,
  Gift,
  ChevronRight,
  Store,
  Package,
  DollarSign,
  PlusCircle,
  BarChart,
  ShoppingCart,
  Plus,
  Edit2,
} from "lucide-react";
import { AddressDialog } from "@/components/common/address/AddressDialog";
import { UserWalletTab } from "./UserWalletTab";
import { UserVouchersTab } from "./UserVouchersTab";

export function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { shop, refetch: refetchShop } = useShop();
  const { isOwner } = usePermissions();
  const updateFullName = useUpdateFullName();
  const updatePhone = useUpdatePhone();
  const updateAvatar = useUpdateAvatar();
  const updateStory = useUpdateStory();
  const changePassword = useChangePassword();
  const { data: addresses = [], isLoading: addressesLoading, refetch: refetchAddresses } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const logout = useLogout();
  const { wishlist, isLoading: wishlistLoading, removeFromWishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStory, setEditStory] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    newFollowers: true,
    likes: true,
    comments: true,
    messages: true,
    productUpdates: false,
    promotions: true,
    tutorials: true,
  });

  const userId = user?.id;
  const isShopOwner = !!(shop && shop.id);

  const statsQuery = useQuery<any>({
    queryKey: ["profile-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const likesRes = await apiClient(ENDPOINTS.PROFILE.GET_TOTAL_LIKES_BY_USER(userId!), { method: "GET" });
        return { likes: likesRes?.data?.totalLikes ?? 0 };
      } catch (error) {
        return { likes: 0 };
      }
    },
  });

  useEffect(() => {
    if (user) {
      setEditFullName(user.full_name || "");
      setEditPhone(user.phone || "");
      setEditStory(user.story || "");
    }
  }, [user]);

  useEffect(() => {
    refetchShop();
  }, []);

  const userProfile = {
    name: user?.full_name || user?.email || "",
    username: user?.email ? `@${user.email.split("@")[0]}` : `@user_${user?.id ?? ""}`,
    bio: user?.story || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: "",
    joinDate: "",
    avatar: avatarPreview || user?.avatar_url || "",
    isVerified: false,
    id: user?.id,
  };

  const userStats = {
    likes: statsQuery.data?.likes || 0,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editFullName && editFullName !== userProfile.name) {
        await updateFullName.mutateAsync({ fullName: editFullName });
      }
      if (editPhone && editPhone !== userProfile.phone) {
        await updatePhone.mutateAsync(editPhone);
      }
      if (editStory !== undefined && editStory !== (userProfile.bio || "")) {
        await updateStory.mutateAsync(editStory || "");
      }
      setSuccess("Đã lưu thay đổi hồ sơ");
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateAvatar.mutateAsync({ file });
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setSuccess("Đã cập nhật ảnh đại diện");
    } catch (e: any) {
      setError(e?.message || "Cập nhật ảnh thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddressDialog = (address?: any) => {
    setEditingAddress(address || null);
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      if (confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
        await deleteAddress.mutateAsync(addressId);
        refetchAddresses();
      }
    } catch (e: any) {
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
              Hồ Sơ Của Tôi
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ hồ sơ
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (isEditing) {
                    await handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] to-[#f550a8]"
                disabled={saving}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? (saving ? "Đang lưu..." : "Lưu") : "Chỉnh sửa"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Summary */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {userProfile.name[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>


                {user?.story?.trim() && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Giới thiệu
                    </label>
                    <p className="text-gray-900">{user.story}</p>
                  </div>
                )}

                <OnlineStatus userId={user?.id} size="lg" className="right-[30%] bottom-1" />
                {isShopOwner && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                      <Store className="h-3 w-3 mr-1" />
                      {isOwner ? "Chủ shop" : "Nhân viên"}
                    </Badge>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarChange(file);
                  }}
                />
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] to-[#f550a8]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isEditing ? (
                    <Input
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full max-w-[220px]"
                    />
                  ) : (
                    <h2 className="font-bold text-gray-900">{userProfile.name}</h2>
                  )}
                </div>
                <p className="text-purple-600 font-medium">{userProfile.username}</p>
                {isEditing ? (
                  <div className="mt-2 text-left">
                    <Label htmlFor="story" className="text-sm font-medium">Tiểu sử</Label>
                    <Textarea
                      id="story"
                      value={editStory}
                      onChange={(e) => setEditStory(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">{userProfile.bio}</p>
                )}
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
              </div>

              <div className="flex justify-center gap-4 mb-6">
                <div className="text-center px-4">
                  <div className="font-bold text-lg text-gray-900">
                    {formatNumber(userStats.likes)}
                  </div>
                  <div className="text-sm text-gray-600">Lượt thích</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {!isShopOwner ? (
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 to-blue-600"
                    onClick={() => router.push("/profile/create-shop")}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Bắt đầu bán hàng
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => router.push("/seller")}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Quản lý Shop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full mb-6">
                <TabsTrigger value="profile" className="text-xs">
                  <User className="h-4 w-4 mr-1" />
                  Hồ sơ
                </TabsTrigger>
                <TabsTrigger value="wallet" className="text-xs">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Ví của tôi
                </TabsTrigger>
                <TabsTrigger value="vouchers" className="text-xs">
                  <Gift className="h-4 w-4 mr-1" />
                  Voucher
                </TabsTrigger>
                <TabsTrigger value="saved" className="text-xs">
                  <Bookmark className="h-4 w-4 mr-1" />
                  Đã lưu
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="h-4 w-4 mr-1" />
                  Cài đặt
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Họ và tên
                        </label>
                        {isEditing ? (
                          <Input
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                          />
                        ) : (
                          <Input value={userProfile.name} disabled />
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Tên người dùng
                        </label>
                        <Input value={userProfile.username} disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email
                        </label>
                        <Input type="email" value={userProfile.email} disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Số điện thoại
                        </label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                        ) : (
                          <Input type="tel" value={userProfile.phone} disabled />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tiểu sử</label>
                      <Textarea
                        value={userProfile.bio}
                        disabled={!isEditing}
                        placeholder="Chia sẻ về hành trình làm đẹp của bạn..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>


              </TabsContent>

              {/* Wallet Tab */}
              <TabsContent value="wallet">
                <UserWalletTab />
              </TabsContent>

              <TabsContent value="vouchers">
                <UserVouchersTab />
              </TabsContent>

              <TabsContent value="saved" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      Danh sách yêu thích
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {wishlistLoading ? (
                      <div className="py-8 text-center text-gray-500">Đang tải...</div>
                    ) : !wishlist || wishlist.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">Bạn chưa lưu sản phẩm nào</p>
                        <Button onClick={() => router.push('/shop')} variant="outline">Khám phá ngay</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wishlist.map((item) => (
                          <div key={item.id} className="relative group">
                            <ProductCard product={item.product} />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-8 w-8 shadow-md"
                              onClick={() => removeFromWishlist(item.product.id as number)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <div className="absolute top-2 left-2 z-10">
                              <Badge className="bg-pink-500">Đã lưu</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                {/* Addresses */}
                <Card className="border-none shadow-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      Địa chỉ giao hàng
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAddressDialog()}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm mới
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addressesLoading && (
                      <div className="py-8 text-center">
                        <p className="text-sm text-gray-500 animate-pulse">Đang tải địa chỉ...</p>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`p-4 rounded-xl border-2 transition-all ${addr.is_default
                            ? "border-purple-100 bg-purple-50/30"
                            : "border-slate-50 bg-white hover:border-purple-50"
                            } group`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{addr.receiver_name}</span>
                                <span className="text-slate-300 text-xs">|</span>
                                <span className="text-slate-600 text-sm font-medium">{addr.phone}</span>
                                {addr.is_default && (
                                  <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] py-0 px-1.5 h-4">Mặc định</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                {addr.label && <span className="text-purple-600 font-semibold mr-1">[{addr.label}]</span>}
                                {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                                onClick={() => handleOpenAddressDialog(addr)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteAddress(addr.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {addresses.length === 0 && !addressesLoading && (
                        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                          <MapPin className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm uppercase font-bold tracking-wider">Chưa có địa chỉ giao hàng</p>
                          <Button
                            variant="link"
                            className="text-purple-600 mt-2"
                            onClick={() => handleOpenAddressDialog()}
                          >
                            Thêm địa chỉ đầu tiên của bạn
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <AddressDialog
                  open={isAddressDialogOpen}
                  onOpenChange={setIsAddressDialogOpen}
                  address={editingAddress}
                  onSuccess={refetchAddresses}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>Đổi mật khẩu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (newPassword.trim().length < 6) {
                          toast.error("Mật khẩu mới cần tối thiểu 6 ký tự");
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          toast.error("Mật khẩu xác nhận không khớp");
                          return;
                        }

                        try {
                          await changePassword.mutateAsync({ currentPassword, newPassword });
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        } catch (err) {
                          // handled by hook
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                      </div>

                      <div>
                        <Label htmlFor="newPassword">Mật khẩu mới</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      </div>

                      <div>
                        <Button type="submit" disabled={changePassword.isPending || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}>
                          {changePassword.isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Vùng nguy hiểm</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => logout(false)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
