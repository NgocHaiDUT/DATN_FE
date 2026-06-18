"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw
} from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { useShop } from "@/features/shop/useShop";
import {
  useShopProducts,
  useProductDetail,
  useAllBrands,
  useAllCategories,
  useDeleteProduct,
  useRequestProductRestore,
  useUpdateProduct,
} from "@/features/seller/useShopProducts";
import { API_BASE_URL } from "@/lib/api";
import { AddProductForm } from "./AddProductForm";
import { EditProductFormNew } from "./EditProductFormNew";

export function ProductManagementPage() {
  const { shop, isLoading: isLoadingShop, error: shopError } = useShop();

  // Debug logging
  console.log('🔍 ProductManagementPage - Shop data:', { shop, isLoadingShop, shopError });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, filterCategory, filterStatus, filterBrand]);

  // Fetch brands and categories
  const { data: brandsData } = useAllBrands();
  const { data: categoriesData } = useAllCategories();
  const brands = Array.isArray(brandsData?.brands) ? brandsData.brands : (Array.isArray(brandsData) ? brandsData : []);
  const categories = Array.isArray(categoriesData?.categories) ? categoriesData.categories : (Array.isArray(categoriesData) ? categoriesData : []);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    refetch,
  } = useShopProducts(shop?.id, {
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearchTerm || undefined,
    category_id: filterCategory !== 'all' ? filterCategory : undefined,
    brand_id: filterBrand !== 'all' ? filterBrand : undefined,
    is_published:
      filterStatus === 'published'
        ? true
        : filterStatus === 'unpublished'
          ? false
          : undefined,
    is_deleted:
      filterStatus === 'deleted'
        ? true
        : filterStatus === 'published' || filterStatus === 'unpublished'
          ? false
          : undefined,
    isOwnerView: true, // Show all products including unpublished and pending
  });

  const products = productsData?.data?.products || productsData?.products || [];
  const paginationData = productsData?.data?.pagination || productsData?.pagination || {
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 20,
  };

  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();
  const requestProductRestoreMutation = useRequestProductRestore();

  const isProductDeleted = (product: any) =>
    product.is_deleted === true ||
    product.is_deleted === "true" ||
    product.is_deleted === 1 ||
    Boolean(product.deleted_at);

  const getStatusBadge = (product: any) => {
    if (isProductDeleted(product)) {
      return <Badge className="bg-red-100 text-red-800">Đã xoá</Badge>;
    }
    if (product.is_published) {
      return <Badge className="bg-green-100 text-green-800">Đã xuất bản</Badge>;
    }
    return <Badge variant="secondary">Chưa xuất bản</Badge>;
  };

  const getModerationBadge = (moderation: string) => {
    switch (moderation) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Đang chờ</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Bị từ chối</Badge>;
      default:
        return <Badge variant="outline">{moderation}</Badge>;
    }
  };

  // Fetch full product details when editing
  const { data: productDetailData, isLoading: isLoadingProductDetail } = useProductDetail(
    editingProductId || undefined,
    true // isOwnerView
  );

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
  };

  const handleSaveEditedProduct = async (productData: any) => {
    // Just close the form and refetch data
    // All updates are already handled in EditProductFormNew
    setEditingProduct(null);
    refetch();
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const confirmed = window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?');
      if (!confirmed) return;

      const result = await deleteProductMutation.mutateAsync(productId);
      // Check if response indicates failure
      if (result && result.success === false) {
        toast.error(result.message || 'Không thể xóa sản phẩm');
        return;
      }

      toast.success(result?.message || 'Xóa sản phẩm thành công!');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleRequestRestore = async (productId: number) => {
    try {
      const confirmed = window.confirm('Gửi yêu cầu admin khôi phục sản phẩm này?');
      if (!confirmed) return;

      const result = await requestProductRestoreMutation.mutateAsync(productId);
      if (result && result.success === false) {
        toast.error(result.message || 'Không thể gửi yêu cầu khôi phục');
        return;
      }

      toast.success(result?.message || 'Đã gửi yêu cầu khôi phục đến admin');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi gửi yêu cầu khôi phục');
    }
  };

  const handleDuplicateProduct = (product: any) => {
    alert('Chức năng nhân bản sản phẩm đang được phát triển');
  };

  const handleToggleVisibility = async (productId: number, currentStatus: boolean) => {
    try {
      const product = products.find((p: any) => p.id === productId);
      if (!product) {
        alert('Không tìm thấy sản phẩm');
        return;
      }

      const categoryIds = (product as any).product_categories
        ? (product as any).product_categories.map((pc: any) => pc.category_id)
        : ((product as any).category_ids || []);

      const result = await updateProductMutation.mutateAsync({
        productId,
        productData: {
          name: (product as any).name,
          description: (product as any).description,
          how_to_use: (product as any).how_to_use,
          is_published: !currentStatus,
          brand_id: (product as any).brand_id,
          category_ids: categoryIds,
        },
      });

      if (result && result.success === false) {
        toast.error(result.message || 'Không thể thay đổi trạng thái hiển thị');
        return;
      }

      toast.success(currentStatus ? 'Đã ẩn sản phẩm' : 'Đã hiển thị sản phẩm');
      refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi thay đổi trạng thái hiển thị');
    }
  };

  const handleSaveProduct = async (productData: any) => {
    if (!shop?.id) {
      alert('Không tìm thấy thông tin cửa hàng');
      return;
    }

    try {
      // This will be handled by AddProductForm component
      setIsAddFormOpen(false);
      refetch();
    } catch (error) {
    }
  };

  // Show loading state while fetching shop
  if (isLoadingShop) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#c27aff] mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin cửa hàng...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if shop fetch failed
  if (shopError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Lỗi tải thông tin cửa hàng
                </h2>
                <p className="text-gray-600 mb-6">
                  {(shopError as any)?.message || 'Không thể tải thông tin cửa hàng'}
                </p>
                <Button
                  className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                  onClick={() => window.location.reload()}
                >
                  Thử lại
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if shop exists
  if (!shop?.id) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#c27aff] to-[#fb64b6] flex items-center justify-center">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Chưa có cửa hàng
                </h2>
                <p className="text-gray-600 mb-6">
                  Bạn cần tạo cửa hàng trước khi có thể quản lý sản phẩm
                </p>
                <Button
                  className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
                  onClick={() => window.location.href = '/profile/create-shop'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo cửa hàng ngay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAddFormOpen) {
    return (
      <AddProductForm
        onClose={() => setIsAddFormOpen(false)}
        onSave={handleSaveProduct}
        brands={brands}
        categories={categories}
        shopId={shop?.id}
      />
    );
  }

  // Show loading while fetching product details for editing
  if (editingProductId && isLoadingProductDetail) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#c27aff] mx-auto mb-4" />
            <p className="text-gray-600">Đang tải chi tiết sản phẩm...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show edit form once product details are loaded
  if (editingProductId && productDetailData?.product) {
    return (
      <EditProductFormNew
        product={productDetailData.product}
        onClose={() => {
          setEditingProductId(null);
          setEditingProduct(null);
        }}
        onSave={handleSaveEditedProduct}
        brands={brands}
        categories={categories}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600">Quản lý sản phẩm và tồn kho của bạn</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#c27aff] to-[#fb64b6] hover:opacity-90"
          onClick={() => setIsAddFormOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                {brands.map((brand: any) => (
                  <SelectItem key={brand.id} value={String(brand.id)}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="unpublished">Chưa xuất bản</SelectItem>
                <SelectItem value="deleted">Đã xoá</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm ({isLoading ? '...' : paginationData.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#c27aff] mx-auto mb-2" />
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Thương hiệu</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Kiểm duyệt</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => {
                  const firstVariant = product.product_variants?.[0];
                  const firstMedia = product.product_media?.[0];
                  const totalStock = product.product_variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;

                  // Tạo URL đầy đủ cho ảnh từ product_media
                  const imageUrl = firstMedia?.url
                    ? (firstMedia.url.startsWith('http') ? firstMedia.url : `${API_BASE_URL}${firstMedia.url}`)
                    : '/placeholder-product.png';

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.brand?.name || '-'}</TableCell>
                      <TableCell>
                        {product.product_categories?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.product_categories.slice(0, 2).map((pc: any) => (
                              <Badge key={pc.category_id} variant="outline" className="text-xs">
                                {pc.category?.name}
                              </Badge>
                            ))}
                            {product.product_categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.product_categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {firstVariant ? `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(firstVariant.price))}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={totalStock === 0 ? "text-red-600" : totalStock < 20 ? "text-orange-600" : ""}>
                          {totalStock}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(product)}</TableCell>
                      <TableCell>{getModerationBadge(product.moderation_status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isProductDeleted(product) && (
                              <>
                                <DropdownMenuItem onClick={() => handleRequestRestore(product.id)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Yêu cầu khôi phục
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem disabled={isProductDeleted(product)} onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={isProductDeleted(product)} onClick={() => handleToggleVisibility(product.id, product.is_published)}>
                              {product.is_published ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Ẩn sản phẩm
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Hiển thị
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={isProductDeleted(product)} onClick={() => handleDuplicateProduct(product)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Nhân bản
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={isProductDeleted(product)}
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Trang {paginationData.page} / {paginationData.totalPages} ({paginationData.total} sản phẩm)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationData.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginationData.page === paginationData.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

