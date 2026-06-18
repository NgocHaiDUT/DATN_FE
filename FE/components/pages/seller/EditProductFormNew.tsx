"use client";

import { useState, useRef, useEffect } from "react";
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
  GripVertical,
  Star,
  Save,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import {
  useUpdateProduct,
  useUpdateProductVariant,
  useDeleteProductVariant,
  useCreateProductVariant,
  useDeleteProductMedia,
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

interface EditProductFormNewProps {
  product: any;
  onClose: () => void;
  onSave: (productData: any) => void;
  brands: any[];
  categories: any[];
}

export function EditProductFormNew({
  product,
  onClose,
  onSave,
  brands,
  categories,
}: EditProductFormNewProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: product.name || "",
    brand_id: product.brand_id?.toString() || "",
    description: product.description || "",
    how_to_use: product.how_to_use || "",
    category_ids: product.product_categories
      ? product.product_categories.map((pc: any) => pc.category_id)
      : (product.category_ids || []),
    is_published: product.is_published || false,
  });

  const [images, setImages] = useState<Array<{ id: number; file: File | null; url: string; sort_order: number; isExisting: boolean }>>(() => {
    const mediaArray = product.product_media || product.media;

    if (mediaArray && Array.isArray(mediaArray)) {
      return mediaArray
        .filter((m: any) => m.type === 'image' || !m.type)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((m: any) => ({
          id: m.id,
          file: null,
          url: m.url,
          sort_order: m.sort_order || 0,
          isExisting: true
        }));
    }
    return [];
  });

  const [variants, setVariants] = useState(() => {
    const variantsArray = product.product_variants || product.variants;

    if (variantsArray && Array.isArray(variantsArray) && variantsArray.length > 0) {
      return variantsArray.map((v: any) => ({
        id: v.id,
        sku: v.sku || "",
        name: v.name || "Default",
        shade_hex: v.shade_hex || "",
        size_label: v.size_label || "",
        price: v.price?.toString() || "",
        compare_at_price: v.compare_at_price?.toString() || "",
        stock: v.stock?.toString() || "",
        opacity: v.opacity != null ? v.opacity.toString() : "",
        weight: v.weight != null ? v.weight.toString() : "",
        length: v.length != null ? v.length.toString() : "",
        width: v.width != null ? v.width.toString() : "",
        height: v.height != null ? v.height.toString() : "",
        is_active: v.is_active !== false,
        isExisting: true
      }));
    }
    return [{
      id: Date.now(),
      sku: "",
      name: "Default",
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
      is_active: true,
      isExisting: false
    }];
  });

  const [deletedVariants, setDeletedVariants] = useState<number[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProductMutation = useUpdateProduct();
  const updateVariantMutation = useUpdateProductVariant();
  const deleteVariantMutation = useDeleteProductVariant();
  const createVariantMutation = useCreateProductVariant();
  const deleteMediaMutation = useDeleteProductMedia();
  const addMediaMutation = useAddProductMedia();

  const steps = [
    { id: 1, title: "Thông tin cơ bản", description: "Chi tiết sản phẩm" },
    { id: 2, title: "Danh mục", description: "Phân loại sản phẩm" },
    { id: 3, title: "Phương tiện", description: "Hình ảnh" },
    { id: 4, title: "Phiên bản", description: "Kích cỡ & giá" },
    { id: 5, title: "Xem lại", description: "Xác nhận thay đổi" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const parentCategories = categories.filter((cat: any) => !cat.parent_id);
  const getChildCategories = (parentId: number) => {
    return categories.filter((cat: any) => cat.parent_id === parentId);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isMakeupCategory = (categoryName: string) => {
    return ALL_MAKEUP_CATEGORY_NAMES.includes(categoryName);
  };

  const toggleCategory = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    if (!category) return;

    setFormData(prev => {
      const currentIds = prev.category_ids || [];
      const isSelected = currentIds.includes(categoryId);

      // If deselecting, just remove it
      if (isSelected) {
        return {
          ...prev,
          category_ids: currentIds.filter((id: number) => id !== categoryId)
        };
      }

      // If selecting a makeup category, check if another makeup category is already selected
      if (isMakeupCategory(category.name)) {
        const selectedMakeupCategories = currentIds.filter((id: number) => {
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
        category_ids: [...currentIds, categoryId]
      };
    });
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newImages = fileArray.map((file, index) => ({
      id: Date.now() + index,
      file: file,
      url: URL.createObjectURL(file),
      sort_order: images.length + index,
      isExisting: false
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (imageId: number) => {
    const image = images.find(img => img.id === imageId);

    if (image && image.isExisting) {
      setDeletedImages(prev => [...prev, image.id]);
    }

    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const setPrimaryImage = (imageId: number) => {
    setImages(prev => {
      return prev.map((img, index) => ({
        ...img,
        sort_order: img.id === imageId ? 0 : index + 1
      })).sort((a, b) => a.sort_order - b.sort_order);
    });
  };

  const addVariant = () => {
    setVariants((prev: any) => [...prev, {
      id: Date.now(),
      sku: "",
      name: `Phiên bản ${prev.length + 1}`,
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
      is_active: true,
      isExisting: false
    }]);
  };

  const removeVariant = (variantId: number) => {
    if (variants.length === 1) {
      alert("Sản phẩm phải có ít nhất 1 phiên bản");
      return;
    }

    const variant = variants.find((v: any) => v.id === variantId);

    if (variant && variant.isExisting) {
      setDeletedVariants(prev => [...prev, variant.id]);
    }

    setVariants((prev: any) => prev.filter((v: any) => v.id !== variantId));
  };

  const updateVariant = (variantId: number, field: string, value: any) => {
    setVariants((prev: any) => prev.map((v: any) =>
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.category_ids.length === 0 || variants.length === 0) {
      alert('Vui lòng điền tất cả các trường bắt buộc');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        how_to_use: formData.how_to_use,
        is_published: formData.is_published,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,
        category_ids: formData.category_ids || []
      };

      const updateResult = await updateProductMutation.mutateAsync({
        productId: product.id,
        productData: productData
      });

      if (updateResult && updateResult.success === false) {
        alert(updateResult.message || 'Không thể cập nhật sản phẩm');
        return;
      }

      if (deletedVariants.length > 0) {
        for (const variantId of deletedVariants) {
          await deleteVariantMutation.mutateAsync(variantId);
        }
      }

      for (const variant of variants) {
        if (!variant.price) continue;

        const variantData = {
          sku: variant.sku || `PRD${product.id}-${Date.now()}`,
          name: variant.name || 'Default',
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock) || 0,
          compare_at_price: variant.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
          shade_hex: variant.shade_hex || undefined,
          size_label: variant.size_label || undefined,
          opacity: variant.opacity ? parseFloat(variant.opacity) : undefined,
          weight: variant.weight && variant.weight !== "" ? parseInt(variant.weight) : undefined,
          length: variant.length && variant.length !== "" ? parseInt(variant.length) : undefined,
          width: variant.width && variant.width !== "" ? parseInt(variant.width) : undefined,
          height: variant.height && variant.height !== "" ? parseInt(variant.height) : undefined,
          is_active: variant.is_active !== false
        };

        if (variant.isExisting) {
          await updateVariantMutation.mutateAsync({
            variantId: variant.id,
            variantData: variantData
          });
        } else {
          await createVariantMutation.mutateAsync({
            product_id: product.id,
            ...variantData
          });
        }
      }

      if (deletedImages.length > 0) {
        for (const imageId of deletedImages) {
          await deleteMediaMutation.mutateAsync(imageId);
        }
      }

      const newImages = images.filter(img => !img.isExisting && img.file);
      if (newImages.length > 0) {
        for (let i = 0; i < newImages.length; i++) {
          const image = newImages[i];
          const sortOrder = image.sort_order !== undefined ? image.sort_order : i;

          if (image.file) {
            await addMediaMutation.mutateAsync({
              productId: product.id,
              file: image.file,
              type: 'image',
              sortOrder
            });
          }
        }
      }

      alert('Cập nhật sản phẩm thành công!');
      onSave({ ...formData, variants, images });
      onClose();

    } catch (error) {
      alert(`Có lỗi xảy ra khi cập nhật sản phẩm`);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Tên sản phẩm *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Nhập tên sản phẩm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand">Thương hiệu</Label>
        <Select
          value={formData.brand_id}
          onValueChange={(value) => handleInputChange('brand_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn thương hiệu" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand: any) => (
              <SelectItem key={brand.id} value={brand.id.toString()}>
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
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Mô tả sản phẩm của bạn..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="how_to_use">Hướng dẫn sử dụng</Label>
        <Textarea
          id="how_to_use"
          value={formData.how_to_use}
          onChange={(e) => handleInputChange('how_to_use', e.target.value)}
          placeholder="Hướng dẫn sử dụng..."
          rows={3}
        />
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="is_published">Xuất bản sản phẩm</Label>
          <p className="text-sm text-gray-500">Hiển thị sản phẩm với khách hàng</p>
        </div>
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => handleInputChange('is_published', checked)}
        />
      </div>
    </div>
  );

  const renderCategories = () => {
    const selectedMakeupCategories = (formData.category_ids || []).filter((id: number) => {
      const cat = categories.find((c: any) => c.id === id);
      return cat && isMakeupCategory(cat.name);
    });

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Chọn danh mục *</Label>
          <p className="text-sm text-gray-500">Chọn một hoặc nhiều danh mục cho sản phẩm</p>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-2">
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
        </div>

        <div className="space-y-4">
          {parentCategories.map((parent: any) => {
            const children = getChildCategories(parent.id);
            const isParentSelected = formData.category_ids?.includes(parent.id);
            const isParentMakeup = isMakeupCategory(parent.name);

            return (
              <Card
                key={parent.id}
                className={`${isParentSelected ? "border-purple-500" : ""
                  } ${isParentMakeup ? "bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-300" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`cat-${parent.id}`}
                      checked={isParentSelected}
                      onChange={() => toggleCategory(parent.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`cat-${parent.id}`} className="font-semibold cursor-pointer flex items-center gap-2">
                      {parent.name}
                      {isParentMakeup && (
                        <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Virtual Try-On
                        </Badge>
                      )}
                    </Label>
                  </div>
                </CardHeader>

                {children.length > 0 && (
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {children.map((child: any) => {
                        const isChildSelected = formData.category_ids?.includes(child.id);
                        const isChildMakeup = isMakeupCategory(child.name);
                        return (
                          <div key={child.id} className="flex items-center space-x-2">
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
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {formData.category_ids?.length > 0 && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm font-medium text-purple-900 mb-2">Đã chọn:</p>
            <div className="flex flex-wrap gap-2">
              {formData.category_ids.map((catId: number) => {
                const category = categories.find((c: any) => c.id === catId);
                return category ? (
                  <Badge key={catId} variant="secondary">
                    {category.name}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMedia = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Hình ảnh sản phẩm</Label>
        <p className="text-sm text-gray-500">Tải ảnh lên (ảnh đầu tiên sẽ là ảnh chính)</p>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {images.map((image, index) => (
            <div key={`${image.id}-${index}`} className="relative group">
              <div className="aspect-square border-2 border-dashed rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={image.url}
                  alt={`Sản phẩm ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-gradient-to-r from-[#c27aff] to-[#fb64b6]">
                  <Star className="w-3 h-3 mr-1" />
                  Chính
                </Badge>
              )}

              {image.isExisting && (
                <Badge variant="outline" className="absolute top-2 right-12 bg-white">
                  Đã có
                </Badge>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(image.id)}
                type="button"
              >
                <X className="w-4 h-4" />
              </Button>

              {index !== 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  onClick={() => setPrimaryImage(image.id)}
                  type="button"
                >
                  Đặt làm ảnh chính
                </Button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Tải ảnh lên</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageUpload(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderVariants = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Phiên bản sản phẩm</Label>
          <p className="text-sm text-gray-500">Thêm các kích cỡ, màu sắc hoặc tùy chọn khác</p>
        </div>
        <Button onClick={addVariant} size="sm" type="button">
          <Plus className="w-4 h-4 mr-2" />
          Thêm phiên bản
        </Button>
      </div>

      <div className="space-y-4">
        {variants.map((variant: any, index: number) => (
          <Card key={variant.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Phiên bản {index + 1}</span>
                  {variant.isExisting && (
                    <Badge variant="outline" className="ml-2">Đã có</Badge>
                  )}
                </div>
                {variants.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(variant.id)}
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                    placeholder="PRD-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tên phiên bản</Label>
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    placeholder="VD: Đỏ, Nhỏ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Màu sắc (Mã Hex)</Label>
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
                  <Label>Nhãn kích thước</Label>
                  <Input
                    value={variant.size_label}
                    onChange={(e) => updateVariant(variant.id, 'size_label', e.target.value)}
                    placeholder="VD: 50ml, Lớn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Giá *</Label>
                  <Input
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá so sánh</Label>
                  <Input
                    type="number"
                    value={variant.compare_at_price}
                    onChange={(e) => updateVariant(variant.id, 'compare_at_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tồn kho</Label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                    placeholder="0"
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
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Cân nặng (g)</Label>
                  <Input
                    type="number"
                    value={variant.weight ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'weight', e.target.value)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chiều dài (cm)</Label>
                  <Input
                    type="number"
                    value={variant.length ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'length', e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chiều rộng (cm)</Label>
                  <Input
                    type="number"
                    value={variant.width ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'width', e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chiều cao (cm)</Label>
                  <Input
                    type="number"
                    value={variant.height ?? ""}
                    onChange={(e) => updateVariant(variant.id, 'height', e.target.value)}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={variant.is_active}
                  onCheckedChange={(checked) => updateVariant(variant.id, 'is_active', checked)}
                />
                <Label>Kích hoạt phiên bản</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900">Kiểm tra thay đổi của bạn</h3>
            <p className="text-sm text-purple-700 mt-1">
              Vui lòng kiểm tra tất cả thay đổi trước khi lưu. Các thay đổi sẽ được áp dụng ngay lập tức.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Tên sản phẩm:</span>
            <span className="font-medium">{formData.name}</span>

            <span className="text-gray-500">Thương hiệu:</span>
            <span className="font-medium">
              {brands.find((b: any) => b.id.toString() === formData.brand_id)?.name || 'N/A'}
            </span>

            <span className="text-gray-500">Trạng thái:</span>
            <span>
              <Badge variant={formData.is_published ? "default" : "secondary"}>
                {formData.is_published ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh mục ({formData.category_ids?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {formData.category_ids?.map((catId: number) => {
              const category = categories.find((c: any) => c.id === catId);
              return category ? (
                <Badge key={catId} variant="secondary">{category.name}</Badge>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phương tiện ({images.length} ảnh)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((image, index) => (
              <div key={`review-img-${image.id || 'new'}-${index}`} className="relative aspect-square rounded-lg overflow-hidden border">
                <ImageWithFallback
                  src={image.url}
                  alt={`Sản phẩm ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <Badge className="absolute top-1 left-1 text-xs">Chính</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phiên bản ({variants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {variants.map((variant: any, index: number) => {
              return (
                <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{variant.name}</span>
                    <div className="text-sm text-gray-500 mt-1">
                      <span>{Number(variant.price).toLocaleString()} VND</span>
                      <span className="mx-1">•</span>
                      <span>Tồn kho: {variant.stock || 0}</span>
                      {variant.opacity != null && variant.opacity !== "" && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Độ trong suốt: {variant.opacity}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={variant.is_active ? "default" : "secondary"}>
                    {variant.is_active ? "Kích hoạt" : "Vô hiệu"}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {(deletedVariants.length > 0 || deletedImages.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Mục sẽ bị xóa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-red-700">
            {deletedVariants.length > 0 && (
              <p>• {deletedVariants.length} phiên bản sẽ bị xóa</p>
            )}
            {deletedImages.length > 0 && (
              <p>• {deletedImages.length} ảnh sẽ bị xóa</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const isLoading = updateProductMutation.isPending ||
    updateVariantMutation.isPending ||
    deleteVariantMutation.isPending ||
    createVariantMutation.isPending ||
    deleteMediaMutation.isPending ||
    addMediaMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div className="border-l pl-4 min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
                <p className="text-xs text-gray-500 truncate" title={product.name}>{product.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <Badge variant="outline" className="px-3 py-1">
                Bước {currentStep} / {steps.length}
              </Badge>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="hover:bg-gray-100"
              >
                Hủy
              </Button>
              {currentStep === steps.length ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90 text-white"
                >
                  Tiếp theo
                </Button>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-2 overflow-x-auto flex-1">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${currentStep === step.id
                      ? 'bg-gradient-to-r from-[#c27aff] to-[#fb64b6] text-white shadow-md'
                      : currentStep > step.id
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                  >
                    <span className="mr-1">{step.id}.</span>
                    {step.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full transition-all duration-300 bg-gradient-to-r from-[#c27aff] to-[#fb64b6]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <p className="text-sm text-gray-500">{steps[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && renderBasicInfo()}
            {currentStep === 2 && renderCategories()}
            {currentStep === 3 && renderMedia()}
            {currentStep === 4 && renderVariants()}
            {currentStep === 5 && renderReview()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Trước
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Tiếp theo
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

