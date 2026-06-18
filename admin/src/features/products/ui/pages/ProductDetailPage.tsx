import React, { useEffect, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import type { Product } from '../../domain/entities/Product';

export interface ProductDetailPageProps {
  productId: number;
  onBack?: () => void;
  onEdit?: (productId: number) => void;
  onDelete?: (productId: number) => void;
}

/**
 * ProductDetailPage - Displays detailed information about a product
 */
export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
  onEdit,
  onDelete,
}) => {
  const { fetchProductById, deleteProduct, loading, error } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    const result = await fetchProductById(productId.toString());
    if (result) {
      setProduct(result);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(productId);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      const success = await deleteProduct(productId.toString());
      if (success) {
        if (onDelete) {
          onDelete(productId);
        } else if (onBack) {
          onBack();
        } else {
          window.history.back();
        }
      }
    }
  };

  const getProductImage = (product: Product): string | undefined => {
    if (product.first_image) return product.first_image;
    if (product.product_media && product.product_media.length > 0) {
      return product.product_media[0].url;
    }
    return undefined;
  };

  const getProductPrice = (product: Product): number => {
    if (product.product_variants && product.product_variants.length > 0) {
      return Math.min(...product.product_variants.map(v => v.price));
    }
    return 0;
  };

  const getTotalStock = (product: Product): number => {
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return 0;
  };

  const getCategories = (product: Product): string => {
    if (product.product_categories && product.product_categories.length > 0) {
      return product.product_categories.map(pc => pc.category.name).join(', ');
    }
    return 'N/A';
  };

  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModerationStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Product not found</p>
      </div>
    );
  }

  const imageUrl = getProductImage(product);
  const price = getProductPrice(product);
  const stock = getTotalStock(product);
  const categories = getCategories(product);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => onBack ? onBack() : window.history.back()}
          className="text-indigo-600 hover:text-indigo-900 mb-4 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Products
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Product Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Detailed information about this product
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${product.is_published
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}
              >
                {product.is_published ? 'Published' : 'Draft'}
              </span>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getModerationStatusColor(product.moderation_status)}`}
              >
                {getModerationStatusText(product.moderation_status)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            {imageUrl && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Product Image</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-48 w-48 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.png';
                    }}
                  />
                </dd>
              </div>
            )}

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Product ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.id}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Slug</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.slug}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Shop</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.shop?.name || 'N/A'}
                {product.shop && (
                  <span className="ml-2 text-xs text-gray-500">(ID: {product.shop.id})</span>
                )}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Brand</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.brand?.name || 'N/A'}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Categories</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {categories}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Price Range</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">
                {price > 0 ? formatPrice(price) : 'N/A'}
                {product.product_variants && product.product_variants.length > 1 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (from {product.product_variants.length} variants)
                  </span>
                )}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Stock</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span
                  className={`font-semibold ${stock < 20 ? 'text-red-600' : 'text-gray-900'
                    }`}
                >
                  {stock}
                </span>
                {stock < 20 && (
                  <span className="ml-2 text-red-600 text-xs">(Low stock)</span>
                )}
              </dd>
            </div>

            {product.description && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.description}
                </dd>
              </div>
            )}

            {product.how_to_use && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">How to Use</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {product.how_to_use}
                </dd>
              </div>
            )}

            {product.product_variants && product.product_variants.length > 0 && (
              <div className="bg-gray-50 px-4 py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 mb-3">Product Variants</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.product_variants.map((variant) => (
                          <tr key={variant.id}>
                            <td className="px-4 py-2 text-sm">{variant.sku}</td>
                            <td className="px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                {variant.shade_hex && (
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: variant.shade_hex }}
                                  />
                                )}
                                {variant.name}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm font-medium">{formatPrice(variant.price)}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={variant.stock < 10 ? 'text-red-600 font-semibold' : ''}>
                                {variant.stock}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${variant.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {variant.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </dd>
              </div>
            )}

            {product.product_media && product.product_media.length > 0 && (
              <div className="bg-white px-4 py-5 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 mb-3">Product Media</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.product_media.map((media) => (
                      <div key={media.id} className="relative">
                        <img
                          src={media.url}
                          alt={`Product media ${media.id}`}
                          className="w-full h-32 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                        />
                        <span className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {media.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rating</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {product.avg_rating ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {typeof product.avg_rating === 'string'
                        ? parseFloat(product.avg_rating).toFixed(1)
                        : product.avg_rating.toFixed(1)
                      }
                    </span>
                    <span className="text-gray-500">({product.review_count || 0} reviews)</span>
                  </div>
                ) : (
                  'No ratings yet'
                )}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(product.created_at)}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(product.updated_at)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => onBack ? onBack() : window.history.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleEdit}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Edit Product
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete Product
        </button>
      </div>
    </div>
  );
};
