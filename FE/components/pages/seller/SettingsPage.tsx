"use client";

import React, { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  Store,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  Loader2,
  Truck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Combobox } from "@/components/ui/combobox";
import { getProvinces, getDistricts, getWards } from "@/lib/api/location";
import { useShop } from '@/features/shop/useShop';
import {
  useUpdateShopLogo,
  useUpdateShopBanner,
  useUpdateShopPhone,
  useUpdateShopEmail,
  useUpdateShopDescription,
  useShopAddresses,
  useAddShopAddress,
  useUpdateShopAddress,
  useDeleteShopAddress,
  useRegisterGHNShop,
  type ShopAddress,
} from '@/features/seller/useShopSettings';
import { StaffManagement } from '@/components/pages/seller/StaffManagement';
import { usePermissions } from '@/features/auth/usePermissions';

const emptyAddressForm: Omit<ShopAddress, "id"> = {
  name: '',
  phone: '',
  email: '',
  street: '',
  ward: '',
  district: '',
  province: '',
  is_default: false,
  ghn_province_id: undefined,
  ghn_district_id: undefined,
  ghn_ward_code: undefined,
};

export function SettingsPage() {
  const { shop, isLoading: isLoadingShop, refetch: fetchShop } = useShop();
  const { isOwner, isManager } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  // Location selectors state
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  // Only owner and manager can manage staff
  const canManageStaff = isOwner || isManager;

  // Shop information state
  const [shopData, setShopData] = useState({
    name: '',
    email: '',
    phone: '',
    description: ''
  });

  // Address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<ShopAddress, "id">>(emptyAddressForm);

  // Prevent hydration mismatch by only rendering Tabs on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mutations
  const updateLogoMutation = useUpdateShopLogo(shop?.id);
  const updateBannerMutation = useUpdateShopBanner(shop?.id);
  const updatePhoneMutation = useUpdateShopPhone(shop?.id);
  const updateEmailMutation = useUpdateShopEmail(shop?.id);
  const updateDescriptionMutation = useUpdateShopDescription(shop?.id);
  const registerGHNMutation = useRegisterGHNShop(shop?.id);

  // Address queries & mutations
  const { data: addressesData, refetch: refetchAddresses } = useShopAddresses(shop?.id);
  console.log('[DEBUG] shop?.id:', shop?.id, 'addressesData:', addressesData);
  const addresses = Array.isArray(addressesData?.data)
    ? addressesData.data
    : Array.isArray(addressesData?.addresses)
      ? addressesData.addresses
      : Array.isArray(addressesData)
        ? addressesData
        : [];
  const addAddressMutation = useAddShopAddress(shop?.id);
  const updateAddressMutation = useUpdateShopAddress(shop?.id);
  const deleteAddressMutation = useDeleteShopAddress(shop?.id);

  // Initial load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data || []);
      } catch (error) {
        console.error("Failed to fetch provinces", error);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (addressForm.ghn_province_id) {
      const fetchDistricts = async () => {
        try {
          const data = await getDistricts(addressForm.ghn_province_id!);
          setDistricts(data || []);
        } catch (error) {
          console.error("Failed to fetch districts", error);
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [addressForm.ghn_province_id]);

  // Fetch wards when district changes
  useEffect(() => {
    if (addressForm.ghn_district_id) {
      const fetchWards = async () => {
        try {
          const data = await getWards(addressForm.ghn_district_id!);
          setWards(data || []);
        } catch (error) {
          console.error("Failed to fetch wards", error);
        }
      };
      fetchWards();
    } else {
      setWards([]);
    }
  }, [addressForm.ghn_district_id]);

  const provinceOptions = Array.isArray(provinces) ? provinces.map(p => ({ value: p.ProvinceID, label: p.ProvinceName })) : [];
  const districtOptions = Array.isArray(districts) ? districts.map(d => ({ value: d.DistrictID, label: d.DistrictName })) : [];
  const wardOptions = Array.isArray(wards) ? wards.map(w => ({ value: w.WardCode, label: w.WardName })) : [];

  const handleRegisterGHN = async (addressId: number) => {
    if (!confirm('Bạn có chắc chắn muốn đăng ký GHN với địa chỉ này?')) return;

    try {
      await registerGHNMutation.mutateAsync(addressId);
      await fetchShop(); // refetch shop data trước để cập nhật ghn_shop_id
      alert('Đăng ký GHN thành công!');
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi đăng ký GHN');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await updateAddressMutation.mutateAsync({
        addressId,
        addressData: { is_default: true }
      });
      alert('Đã thiết lập địa chỉ mặc định!');
      refetchAddresses();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi thiết lập địa chỉ mặc định');
    }
  };

  // Populate shop data when shop is loaded
  useEffect(() => {
    if (shop) {
      setShopData({
        name: shop.name || '',
        email: shop.email || '',
        phone: shop.phone || '',
        description: shop.description || ''
      });
    }
  }, [shop]);

  // ============ Shop Info Handlers ============

  const handleShopInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const promises = [];

      if (shopData.phone !== shop?.phone) {
        promises.push(updatePhoneMutation.mutateAsync(shopData.phone));
      }

      if (shopData.email !== shop?.email) {
        promises.push(updateEmailMutation.mutateAsync(shopData.email));
      }

      if (shopData.description !== shop?.description) {
        promises.push(updateDescriptionMutation.mutateAsync(shopData.description));
      }

      await Promise.all(promises);

      alert('Cập nhật thông tin shop thành công!');
      fetchShop();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateLogoMutation.mutateAsync(file);
      alert('Cập nhật logo thành công!');
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tải logo');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await updateBannerMutation.mutateAsync(file);
      alert('Cập nhật banner thành công!');
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi tải banner');
    }
  };

  // ============ Address Handlers ============

  const handleAddressFormChange = (field: keyof Omit<ShopAddress, "id">, value: any) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAddressForm = () => {
    setAddressForm(emptyAddressForm);
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAddressId) {
        await updateAddressMutation.mutateAsync({
          addressId: editingAddressId,
          addressData: addressForm
        });
        alert('Cập nhật địa chỉ thành công!');
      } else {
        await addAddressMutation.mutateAsync(addressForm);
        alert('Thêm địa chỉ thành công!');
      }

      resetAddressForm();
      refetchAddresses();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi lưu địa chỉ');
    }
  };

  const handleEditAddress = (address: ShopAddress) => {
    setAddressForm({
      name: address.name,
      phone: address.phone,
      email: address.email || '',
      street: address.street,
      ward: address.ward,
      district: address.district,
      province: address.province,
      is_default: address.is_default,
      ghn_province_id: address.ghn_province_id,
      ghn_district_id: address.ghn_district_id,
      ghn_ward_code: address.ghn_ward_code,
    });
    setEditingAddressId(address.id);
    setIsAddingAddress(true);

    // Scroll to form
    setTimeout(() => {
      document.getElementById('address-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      await deleteAddressMutation.mutateAsync(addressId);
      alert('Xóa địa chỉ thành công!');
      refetchAddresses();
    } catch (error: any) {
      alert(error.message || 'Có lỗi xảy ra khi xóa địa chỉ');
    }
  };

  if (isLoadingShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600">Quản lý thông tin và cài đặt cửa hàng của bạn</p>
      </div>

      {!isMounted ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <Tabs defaultValue="shop-info" className="space-y-6">
          <TabsList className={`grid w-full ${canManageStaff ? 'grid-cols-3' : 'grid-cols-2'} lg:w-auto lg:inline-grid bg-gray-100 p-1 rounded-lg`}>
            <TabsTrigger
              value="shop-info"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Thông tin Shop
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
            >
              Địa chỉ
            </TabsTrigger>
            {canManageStaff && (
              <TabsTrigger
                value="staff"
                className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Nhân viên
              </TabsTrigger>
            )}
          </TabsList>

          {/* Shop Info Tab */}
          <TabsContent value="shop-info">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cửa hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleShopInfoSubmit} className="space-y-6">
                  {/* Shop Banner */}
                  <div>
                    <Label>Banner cửa hàng</Label>
                    <div className="mt-2 relative">
                      {shop?.cover_url ? (
                        <img
                          src={shop.cover_url}
                          alt="Shop banner"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] rounded-lg flex items-center justify-center">
                          <Store className="w-16 h-16 text-white opacity-50" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="bannerUpload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={updateBannerMutation.isPending}
                      />
                      <Button
                        size="sm"
                        className="absolute bottom-4 right-4"
                        type="button"
                        onClick={() => document.getElementById('bannerUpload')?.click()}
                        disabled={updateBannerMutation.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {updateBannerMutation.isPending ? 'Đang tải...' : 'Đổi banner'}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Kích thước đề xuất: 1920x400px</p>
                  </div>

                  {/* Shop Logo */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {shop?.logo_url ? (
                        <img
                          src={shop.logo_url}
                          alt="Shop logo"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] rounded-lg flex items-center justify-center">
                          <Store className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <input
                        type="file"
                        id="logoUpload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={updateLogoMutation.isPending}
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                        type="button"
                        onClick={() => document.getElementById('logoUpload')?.click()}
                        disabled={updateLogoMutation.isPending}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg text-gray-900 mb-1">Logo cửa hàng</h3>
                      <p className="text-sm text-gray-600 mb-2">Tải lên ảnh vuông (kích thước đề xuất: 512x512px)</p>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => document.getElementById('logoUpload')?.click()}
                        disabled={updateLogoMutation.isPending}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {updateLogoMutation.isPending ? 'Đang tải lên...' : 'Đổi logo'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="shopName">Tên cửa hàng</Label>
                      <Input
                        id="shopName"
                        value={shopData.name}
                        onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                        className="mt-1"
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email liên hệ</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shopData.email}
                        onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={shopData.phone}
                        onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả cửa hàng</Label>
                    <textarea
                      id="description"
                      value={shopData.description}
                      onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
                      disabled={updatePhoneMutation.isPending || updateEmailMutation.isPending || updateDescriptionMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>Địa chỉ cửa hàng</CardTitle>
                    {shop?.ghn_shop_id ? (
                      <Badge variant="outline" className="border-green-600 text-green-600 px-2 py-0.5">
                        <Truck className="w-3 h-3 mr-1" />
                        Đã đăng ký GHN (ID: {shop.ghn_shop_id})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-600 text-yellow-600 px-2 py-0.5">
                        <Truck className="w-3 h-3 mr-1" />
                        Chưa đăng ký GHN
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsAddingAddress(true)}
                    className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
                    disabled={isAddingAddress}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm địa chỉ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add/Edit Address Form */}
                {isAddingAddress && (
                  <Card id="address-form" className="mb-6 border-2 border-[#c27aff]">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Địa chỉ mới'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveAddress} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="address-name">Tên liên hệ *</Label>
                            <Input
                              id="address-name"
                              value={addressForm.name}
                              onChange={(e) => handleAddressFormChange('name', e.target.value)}
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="address-phone">Số điện thoại *</Label>
                            <Input
                              id="address-phone"
                              value={addressForm.phone}
                              onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                              className="mt-1"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address-email">Email</Label>
                          <Input
                            id="address-email"
                            type="email"
                            value={addressForm.email}
                            onChange={(e) => handleAddressFormChange('email', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label>Tỉnh/Thành phố *</Label>
                            <Combobox
                              placeholder="Chọn Tỉnh/Thành phố"
                              options={provinceOptions}
                              value={addressForm.ghn_province_id || ""}
                              onChange={(val) => {
                                const provinceName = provinces.find(p => p.ProvinceID === Number(val))?.ProvinceName;
                                setAddressForm(prev => ({
                                  ...prev,
                                  ghn_province_id: Number(val),
                                  province: provinceName || "",
                                  ghn_district_id: undefined,
                                  district: "",
                                  ghn_ward_code: undefined,
                                  ward: ""
                                }));
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Quận/Huyện *</Label>
                              <Combobox
                                placeholder="Chọn Quận/Huyện"
                                options={districtOptions}
                                value={addressForm.ghn_district_id || ""}
                                onChange={(val) => {
                                  const districtName = districts.find(d => d.DistrictID === Number(val))?.DistrictName;
                                  setAddressForm(prev => ({
                                    ...prev,
                                    ghn_district_id: Number(val),
                                    district: districtName || "",
                                    ghn_ward_code: undefined,
                                    ward: ""
                                  }));
                                }}
                                disabled={!addressForm.ghn_province_id}
                              />
                            </div>
                            <div>
                              <Label>Phường/Xã *</Label>
                              <Combobox
                                placeholder="Chọn Phường/Xã"
                                options={wardOptions}
                                value={addressForm.ghn_ward_code || ""}
                                onChange={(val) => {
                                  const wardName = wards.find(w => w.WardCode === String(val))?.WardName;
                                  setAddressForm(prev => ({
                                    ...prev,
                                    ghn_ward_code: String(val),
                                    ward: wardName || ""
                                  }));
                                }}
                                disabled={!addressForm.ghn_district_id}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address-street">Địa chỉ đường phố *</Label>
                          <Input
                            id="address-street"
                            value={addressForm.street}
                            onChange={(e) => handleAddressFormChange('street', e.target.value)}
                            className="mt-1"
                            placeholder="Số nhà, tên đường"
                            required
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="address-default"
                            checked={addressForm.is_default}
                            onCheckedChange={(checked) => handleAddressFormChange('is_default', checked)}
                          />
                          <Label htmlFor="address-default" className="cursor-pointer">
                            Đặt làm địa chỉ mặc định
                          </Label>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={resetAddressForm}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b169ee] hover:to-[#fa52a5]"
                            disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingAddressId ? 'Cập nhật' : 'Thêm'} địa chỉ
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Address List */}
                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có địa chỉ nào</p>
                    <p className="text-sm text-gray-400 mt-2">Thêm địa chỉ để quản lý địa điểm giao hàng</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address: ShopAddress) => (
                      <Card key={address.id} className={address.is_default ? 'border-2 border-[#c27aff]' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{address.name}</h3>
                                {address.is_default && (
                                  <Badge className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6]">
                                    <Star className="w-3 h-3 mr-1" />
                                    Mặc định
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {address.phone}
                                </p>
                                {address.email && (
                                  <p className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    {address.email}
                                  </p>
                                )}
                                <p className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 mt-0.5" />
                                  <span>
                                    {address.street}, {address.ward}, {address.district}, {address.province}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              {!address.is_default && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-500 hover:text-purple-600 h-8"
                                  onClick={() => handleSetDefault(address.id)}
                                  disabled={updateAddressMutation.isPending}
                                >
                                  Thiết lập mặc định
                                </Button>
                              )}
                              {!shop?.ghn_shop_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-600 text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                  onClick={() => handleRegisterGHN(address.id)}
                                  disabled={registerGHNMutation.isPending}
                                  title="Đăng ký GHN với địa chỉ này"
                                >
                                  {registerGHNMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Truck className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAddress(address)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteAddress(address.id)}
                                disabled={deleteAddressMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff">
            {isLoadingShop ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-gray-500">Đang tải thông tin shop...</p>
                  </div>
                </CardContent>
              </Card>
            ) : shop?.id ? (
              <StaffManagement shopId={shop.id} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Store className="w-12 h-12 text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        Chưa có thông tin shop
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Vui lòng tạo shop hoặc kiểm tra lại thông tin đăng nhập
                      </p>
                      <Button
                        onClick={() => fetchShop()}
                        variant="outline"
                      >
                        Thử lại
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}