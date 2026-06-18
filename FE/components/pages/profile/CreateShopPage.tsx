"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useCreateShop, type CreateShopData, type CreateShopFiles } from "@/features/profile/useCreateShop";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";
import {
  Store,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Check,
  Camera,
  X,
  Eye,
} from "lucide-react";

export function CreateShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createShop = useCreateShop();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateShopData>({
    shop_name: "",
    slug: "",
    description: "",
    phone: "",
    email: user?.email || "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Generate slug from shop name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  };

  const handleInputChange = (field: keyof CreateShopData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto-generate slug when shop name changes
      ...(field === "shop_name" && { slug: generateSlug(value) }),
    }));
  };

  const handleFileUpload = (type: "logo" | "banner", file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.match(/\/(jpg|jpeg|png|gif|heic|heif|webp)$/)) {
      toast.error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif, heic, heif, webp)");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    const preview = URL.createObjectURL(file);

    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(preview);
    } else if (type === "banner") {
      setBannerFile(file);
      setBannerPreview(preview);
    }
  };

  const removeFile = (type: "logo" | "banner") => {
    if (type === "logo") {
      setLogoFile(null);
      setLogoPreview("");
      if (logoInputRef.current) logoInputRef.current.value = "";
    } else if (type === "banner") {
      setBannerFile(null);
      setBannerPreview("");
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    if (!formData.shop_name.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return false;
    }
    if (formData.shop_name.trim().length < 3) {
      toast.error("Tên cửa hàng phải có ít nhất 3 ký tự");
      return false;
    }
    if (!formData.slug.trim()) {
      toast.error("Vui lòng nhập slug");
      return false;
    }
    if (formData.slug.trim().length < 3) {
      toast.error("Slug phải có ít nhất 3 ký tự");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Vui lòng nhập mô tả cửa hàng");
      return false;
    }
    if (formData.description.trim().length < 10) {
      toast.error("Mô tả cửa hàng phải có ít nhất 10 ký tự");
      return false;
    }
    if (formData.email && !formData.email.includes("@")) {
      toast.error("Email không hợp lệ");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const files: CreateShopFiles = {};
      if (logoFile) {
        files.logo = logoFile;
      }
      if (bannerFile) {
        files.banner = bannerFile;
      }

      await createShop.mutateAsync({ shopData: formData, files });

      toast.success("Chuyển đến quản lý cửa hàng...");
      setTimeout(() => {
        router.push("/seller");
      }, 1500);
    } catch (error: any) {
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#c27aff] to-[#fb64b6] bg-clip-text text-transparent">
                Tạo cửa hàng mới
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-purple-600" />
                Thông tin cửa hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shop_name">Tên cửa hàng *</Label>
                  <Input
                    id="shop_name"
                    value={formData.shop_name}
                    onChange={(e) => handleInputChange("shop_name", e.target.value)}
                    placeholder="Nhập tên cửa hàng của bạn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    placeholder="ten-cua-hang"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /shop/{formData.slug}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả cửa hàng *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Mô tả về cửa hàng và sản phẩm của bạn..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Số điện thoại cửa hàng"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email cửa hàng"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                Hình ảnh cửa hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label>Logo cửa hàng</Label>
                <div className="mt-2">
                  {logoPreview ? (
                    <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("logo")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    >
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Thêm logo</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("logo", e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Khuyến nghị: 500x500px, dưới 5MB
                  </p>
                </div>
              </div>

              <Separator />

              {/* Banner Upload */}
              <div>
                <Label>Banner cửa hàng</Label>
                <div className="mt-2">
                  {bannerPreview ? (
                    <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile("banner")}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Thêm banner cửa hàng
                        </p>
                        <p className="text-sm text-gray-500">
                          Kéo thả hoặc click để chọn ảnh
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload("banner", e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Khuyến nghị: 1200x400px, dưới 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shop Preview */}
          {(formData.shop_name || logoPreview || bannerPreview) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  Xem trước cửa hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  {/* Banner Preview */}
                  <div className="h-32 bg-gradient-to-r from-purple-100 to-pink-100 relative">
                    {bannerPreview && (
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Shop Info Preview */}
                  <div className="p-4 relative">
                    <div className="flex items-start gap-4">
                      {/* Logo Preview */}
                      <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-lg overflow-hidden -mt-8 relative z-10">
                        {logoPreview ? (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Store className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900">
                          {formData.shop_name || "Tên cửa hàng"}
                        </h3>
                        {formData.slug && (
                          <p className="text-sm text-purple-600">@{formData.slug}</p>
                        )}
                        {formData.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {formData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading || createShop.isPending}
              className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:from-[#b266f5] to-[#f550a8] min-w-[150px]"
            >
              {loading || createShop.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang tạo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Tạo cửa hàng
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

