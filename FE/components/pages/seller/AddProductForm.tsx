"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Star,
  Save,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import {
  useCreateProduct,
  useCreateProductVariant,
  useAddProductMedia,
} from "@/features/seller/useShopProducts";

// Map category names for online makeup try-on
const MAKEUP_CATEGORIES = {
  lips: ['Son thỏi', 'Son kem', 'Son tint', 'Son dưỡng có màu', 'Son môi'],
  eyeshadow: ['Phấn mắt'],
  blush: ['Phấn má hồng'],
  eyeliner: ['Kẻ mắt'],
  eyebrows: ['Chì kẻ mày'],
  foundation: ['Kem nền'],
  mascara: ['Mascara'],
};

const ALL_MAKEUP_CATEGORY_NAMES = Object.values(MAKEUP_CATEGORIES).flat();

interface AddProductFormProps {
  onClose: () => void;
  onSave: (productData: any) => void;
  brands: any[];
  categories: any[];
  shopId?: number;
}

export function AddProductForm({ onClose, onSave, brands = [], categories = [], shopId }: AddProductFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    brand_id: "",
    description: "",
    how_to_use: "",
    category_ids: [] as number[],
    is_published: false,
  });

  const [images, setImages] = useState<Array<{ id: string; file: File; url: string; isPrimary?: boolean; sort_order: number }>>([]);
  const [variants, setVariants] = useState([
    {
      id: Date.now(),
      sku: "",
      name: "Default",
      shade_hex: "",
      size_label: "",
      price: "",
      compare_at_price: "",
      stock: "",
      opacity: "",
      is_active: true
    }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProductMutation = useCreateProduct();
  const createVariantMutation = useCreateProductVariant();
  const addMediaMutation = useAddProductMedia();

  const steps = [
    { id: 1, title: "Thông tin cơ bản", description: "Chi tiết sản phẩm" },
    { id: 2, title: "Danh mục", description: "Phân loại sản phẩm" },
    { id: 3, title: "Phương tiện", description: "Hình ảnh" },
    { id: 4, title: "Phiên bản", description: "Kích cỡ & giá" },
    { id: 5, title: "Xem lại", description: "Xác nhận thông tin" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const parentCategories = categories.filter((cat: any) => !cat.parent_id);

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const newImage = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          url: URL.createObjectURL(file),
          sort_order: images.length,
          isPrimary: images.length === 0
        };
        setImages(prev => [...prev, newImage]);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      return updated.map((img, index) => ({ ...img, sort_order: index }));
    });
  };

  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({ ...img, isPrimary: img.id === id })));
  };

  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      sku: "",
      name: "",
      shade_hex: "",
      size_label: "",
      price: "",
      compare_at_price: "",
      stock: "",
      opacity: "",
      weight: "",
      length: "",
      width: "",
      height: "",
      is_active: true
    };
    setVariants(prev => [...prev, newVariant]);
  };

  const removeVariant = (id: number) => {
    if (variants.length === 1) {
      alert("Sản phẩm phải có ít nhất 1 variant");
      return;
    }
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: number, field: string, value: any) => {
    setVariants(prev => prev.map(v =>
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const isMakeupCategory = (categoryName: string) => {
    return ALL_MAKEUP_CATEGORY_NAMES.includes(categoryName);
  };

  const toggleCategory = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    if (!category) return;

    setFormData(prev => {
      const isCurrentlySelected = prev.category_ids.includes(categoryId);

      // If deselecting, just remove it
      if (isCurrentlySelected) {
        return {
          ...prev,
          category_ids: prev.category_ids.filter(id => id !== categoryId)
        };
      }

      // If selecting a makeup category, check if another makeup category is already selected
      if (isMakeupCategory(category.name)) {
        const selectedMakeupCategories = prev.category_ids.filter((id: number) => {
          const cat = categories.find((c: any) => c.id === id);
          return cat && isMakeupCategory(cat.name);
        });

        if (selectedMakeupCategories.length > 0) {
          alert('Mỗi sản phẩm chỉ được chọn MỘT danh mục có thể trang điểm online. Vui lòng bỏ chọn danh mục makeup hiện tại trước.');
          return prev;
        }
      }

      return {
        ...prev,
        category_ids: [...prev.category_ids, categoryId]
      };
    });
  };

  const handleFinalSubmit = async () => {
    if (!shopId) {
      alert('Không tìm thấy thông tin cửa hàng');
      return;
    }

    if (!formData.name || formData.category_ids.length === 0 || variants.length === 0) {
      alert('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    try {
      console.log('🚀 Creating product with data:', {
        shop_id: shopId,
        name: formData.name,
        category_ids: formData.category_ids,
        variants: variants.length,
        images: images.length
      });

      const productResponse = await createProductMutation.mutateAsync({
        shop_id: shopId,
        name: formData.name,
        is_published: formData.is_published,
        how_to_use: formData.how_to_use,
        description: formData.description,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,
        category_ids: formData.category_ids,
      });

      console.log('✅ Product created, response:', productResponse);

      const productId = (productResponse as any)?.product?.id || (productResponse as any)?.id;

      if (!productId) {
        console.error('❌ No product ID in response:', productResponse);
        alert('Không thể tạo sản phẩm - không nhận được ID');
        return;
      }

      console.log('📦 Product ID:', productId);

      // Create variants
      console.log(`🔨 Creating ${variants.length} variants...`);
      for (const variant of variants) {
        if (variant.price) {
          try {
            const variantData: any = {
              product_id: productId,
              sku: variant.sku || `PRD${productId}-${Date.now()}`,
              name: variant.name || 'Default',
              price: parseFloat(variant.price),
              stock: variant.stock ? parseInt(variant.stock) : 0,
              compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
              shade_hex: variant.shade_hex || undefined,
              size_label: variant.size_label || undefined,
              opacity: variant.opacity ? parseFloat(variant.opacity) : undefined,
              weight: (variant as any).weight && (variant as any).weight !== "" ? parseInt((variant as any).weight) : undefined,
              length: (variant as any).length && (variant as any).length !== "" ? parseInt((variant as any).length) : undefined,
              width: (variant as any).width && (variant as any).width !== "" ? parseInt((variant as any).width) : undefined,
              height: (variant as any).height && (variant as any).height !== "" ? parseInt((variant as any).height) : undefined,
              is_active: variant.is_active !== false,
            };
            console.log('Creating variant:', variantData);
            const variantResponse = await createVariantMutation.mutateAsync(variantData);
            console.log('✅ Variant created:', variantResponse);
          } catch (variantError: any) {
            console.error('❌ Failed to create variant:', variantError);
            alert(`Lỗi tạo variant: ${variantError.message || 'Unknown error'}`);
            throw variantError;
          }
        }
      }

      // Upload images
      console.log(`📸 Uploading ${images.length} images...`);
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          console.log(`Uploading image ${i + 1}/${images.length}:`, {
            productId,
            fileName: image.file.name,
            size: image.file.size,
            sortOrder: image.sort_order
          });
          const mediaResponse = await addMediaMutation.mutateAsync({
            productId,
            file: image.file,
            type: 'image',
            sortOrder: image.sort_order,
          });
          console.log(`✅ Image ${i + 1} uploaded:`, mediaResponse);
        } catch (mediaError: any) {
          console.error(`❌ Failed to upload image ${i + 1}:`, mediaError);
          alert(`Lỗi upload ảnh ${i + 1}: ${mediaError.message || 'Unknown error'}`);
          throw mediaError;
        }
      }

      console.log('✅ ALL SUCCESS! Product, variants, and media created');
      alert('Thêm sản phẩm thành công!');
      onSave({});
    } catch (error: any) {
      console.error('❌ FINAL ERROR:', error);
      alert(`Có lỗi xảy ra: ${error.message || 'Unknown error'}`);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Tên sản phẩm *</Label>
        <Input
          id="name"
          placeholder="VD: Kem Dưỡng Ẩm 24h L'Oréal"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand">Thương hiệu</Label>
        <Select value={formData.brand_id} onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn thương hiệu" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand: any) => (
              <SelectItem key={brand.id} value={String(brand.id)}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả sản phẩm, thành phần, công dụng..."
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="how_to_use">Hướng dẫn sử dụng</Label>
        <Textarea
          id="how_to_use"
          placeholder="Hướng dẫn sử dụng sản phẩm..."
          rows={3}
          value={formData.how_to_use}
          onChange={(e) => setFormData(prev => ({ ...prev, how_to_use: e.target.value }))}
        />
      </div>
    </div>
  );

  const renderCategories = () => {
    const selectedMakeupCategories = formData.category_ids.filter((id: number) => {
      const cat = categories.find((c: any) => c.id === id);
      return cat && isMakeupCategory(cat.name);
    });

    return (
      <div className="space-y-6">
        <div>
          <Label className="text-base">Chọn danh mục *</Label>
          <p className="text-sm text-gray-500 mb-2">Chọn một hoặc nhiều danh mục cho sản phẩm</p>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-4">
            <Star className="w-3.5 h-3.5" />
            <span>Danh mục có biểu tượng ngôi sao hỗ trợ trang điểm online (Virtual Try-On)</span>
          </div>

          {selectedMakeupCategories.length > 0 && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  Sản phẩm này có thể trang điểm online (Virtual Try-On)
                </span>
              </div>
              <p className="text-xs text-purple-700 mt-1 ml-6">
                Lưu ý: Mỗi sản phẩm chỉ được chọn MỘT danh mục makeup
              </p>
            </div>
          )}

          <div className="space-y-4">
            {parentCategories.map((parent: any) => {
              const isParentSelected = formData.category_ids.includes(parent.id);
              const isParentMakeup = isMakeupCategory(parent.name);
              const children = categories.filter((cat: any) => cat.parent_id === parent.id);

              return (
                <Card
                  key={parent.id}
                  className={`${isParentSelected ? "border-purple-500" : ""
                    } ${isParentMakeup ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-300" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id={`cat-${parent.id}`}
                        checked={isParentSelected}
                        onChange={() => toggleCategory(parent.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`cat-${parent.id}`} className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        {parent.name}
                        {isParentMakeup && (
                          <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Virtual Try-On
                          </Badge>
                        )}
                      </Label>
                    </div>

                    {children.length > 0 && (
                      <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {children.map((child: any) => {
                          const isChildSelected = formData.category_ids.includes(child.id);
                          const isChildMakeup = isMakeupCategory(child.name);
                          return (
                            <div key={child.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`cat-${child.id}`}
                                checked={isChildSelected}
                                onChange={() => toggleCategory(child.id)}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <Label htmlFor={`cat-${child.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                                {child.name}
                                {isChildMakeup && (
                                  <Star className="w-3 h-3 text-purple-500" />
                                )}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {formData.category_ids.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Đã chọn:</span>
              {formData.category_ids.map(catId => {
                const cat = categories.find((c: any) => c.id === catId);
                return cat ? (
                  <Badge key={catId} variant="secondary">
                    {cat.name}
                    <X
                      className="w-3 h-3 ml-1 cursor-pointer"
                      onClick={() => toggleCategory(cat.id)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMediaUpload = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Hình ảnh sản phẩm *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Thêm ảnh
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)}
        />

        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-200">
                  <ImageWithFallback
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPrimaryImage(image.id)}
                    className="text-xs"
                  >
                    {image.isPrimary ? <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> : <Star className="w-3 h-3" />}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {image.isPrimary && (
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white text-xs">
                    Chính
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nhấp để tải ảnh lên</p>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP tối đa 10MB mỗi ảnh</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderVariants = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Phiên bản sản phẩm</Label>
          <p className="text-sm text-gray-500">Thêm các kích cỡ, màu sắc hoặc biến thể khác nhau</p>
        </div>
        <Button onClick={addVariant} size="sm" type="button">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phiên bản
        </Button>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <Card key={variant.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold">Phiên bản #{index + 1}</h3>
                {variants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                    placeholder="Tự động tạo nếu để trống"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tên phiên bản</Label>
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    placeholder="VD: 50ml, Đỏ, Lớn"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giá (VND) *</Label>
                  <Input
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                    placeholder="120000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Giá so sánh (VND)</Label>
                  <Input
                    type="number"
                    value={variant.compare_at_price}
                    onChange={(e) => updateVariant(variant.id, 'compare_at_price', e.target.value)}
                    placeholder="150000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tồn kho *</Label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Độ trong suốt (%)</Label>
                  <Input
                    type="number"
                    value={variant.opacity}
                    onChange={(e) => updateVariant(variant.id, 'opacity', e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nhãn kích thước</Label>
                  <Input
                    value={variant.size_label}
                    onChange={(e) => updateVariant(variant.id, 'size_label', e.target.value)}
                    placeholder="50ml, 100g"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mã màu (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={variant.shade_hex}
                      onChange={(e) => updateVariant(variant.id, 'shade_hex', e.target.value)}
                      placeholder="#FF5733"
                    />
                    {variant.shade_hex && (
                      <div
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: variant.shade_hex }}
                      />
                    )}
                  </div>
                </div>


                <div className="space-y-2">
                  <Label>Cân nặng (g)</Label>
                  <Input
                    type="number"
                    value={(variant as any).weight ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'weight', e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chiều dài (cm)</Label>
                  <Input
                    type="number"
                    value={(variant as any).length ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'length', e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chiều rộng (cm)</Label>
                  <Input
                    type="number"
                    value={(variant as any).width ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'width', e.target.value)}
                    placeholder="5"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chiều cao (cm)</Label>
                  <Input
                    type="number"
                    value={(variant as any).height ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'height', e.target.value)}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2 flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={(checked) => updateVariant(variant.id, 'is_active', checked)}
                    />
                    <Label>Kích hoạt</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-600">Tên</Label>
            <p className="font-medium">{formData.name || '-'}</p>
          </div>
          <div>
            <Label className="text-gray-600">Thương hiệu</Label>
            <p className="font-medium">
              {brands.find((b: any) => b.id === parseInt(formData.brand_id))?.name || '-'}
            </p>
          </div>
          <div>
            <Label className="text-gray-600">Danh mục</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.category_ids.length > 0 ? (
                formData.category_ids.map(catId => {
                  const cat = categories.find((c: any) => c.id === catId);
                  return cat ? <Badge key={catId}>{cat.name}</Badge> : null;
                })
              ) : (
                <span className="text-gray-500">Chưa chọn</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phương tiện ({images.length} ảnh)</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Chưa có ảnh</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phiên bản ({variants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {variants.map((v, index) => (
              <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{v.name || `Phiên bản #${index + 1}`}</span>
                  <span className="text-gray-500 ml-2">SKU: {v.sku || 'Auto'}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{Number(v.price || 0).toLocaleString()} VND</div>
                  <div className="text-sm text-gray-500">
                    Tồn kho: {v.stock}
                    {v.opacity && ` • Độ trong suốt: ${v.opacity}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cài đặt xuất bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Xuất bản ngay</Label>
            <Switch
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
            />
          </div>
          <p className="text-sm text-gray-500">
            {formData.is_published
              ? "Sản phẩm sẽ hiển thị với khách hàng sau khi được duyệt"
              : "Sản phẩm sẽ được lưu dưới dạng nháp"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderBasicInfo();
      case 2: return renderCategories();
      case 3: return renderMediaUpload();
      case 4: return renderVariants();
      case 5: return renderReview();
      default: return renderBasicInfo();
    }
  };

  const isLoading = createProductMutation.isPending || createVariantMutation.isPending || addMediaMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Thêm sản phẩm mới</h1>
              <p className="text-sm text-gray-600">Tạo sản phẩm mới cho cửa hàng của bạn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Bước {currentStep} / {steps.length}</span>
                <span>{Math.round(progress)}% Hoàn thành</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${step.id === currentStep
                    ? "text-[#c27aff]"
                    : step.id < currentStep
                      ? "text-green-600"
                      : "text-gray-400"
                    }`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${step.id === currentStep
                      ? "bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white"
                      : step.id < currentStep
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                      }`}
                  >
                    {step.id}
                  </div>
                  <span className="text-xs font-medium text-center">{step.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-8 bg-gradient-to-b from-[#c27aff] to-[#fb64b6] rounded-full" />
              {steps.find(s => s.id === currentStep)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || isLoading}
          >
            Trước
          </Button>

          {currentStep === steps.length ? (
            <Button
              onClick={handleFinalSubmit}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu sản phẩm
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
              disabled={isLoading}
            >
              Tiếp theo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

