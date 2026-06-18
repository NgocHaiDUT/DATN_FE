import React from 'react';
import type { Product } from '../../domain/entities/Product';
import { useI18n } from '../../../../shared/i18n/I18nContext';
import { getModerationStatusLabel } from '../../../../shared/i18n/statusUtils';

export interface ProductTableProps {
  products: Product[];
  onProductClick: (id: number) => void;
}

/**
 * ProductTable - Displays products in a table format
 */
export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onProductClick,
}) => {
  const { t } = useI18n();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
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
      // Return the lowest price
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
    return t('products.na');
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

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.colName')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.colShop')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('brands.name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.categories')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.colPrice')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.stock')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('products.colStatus')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {products.map((product) => {
            const imageUrl = getProductImage(product);
            const price = getProductPrice(product);
            const stock = getTotalStock(product);
            const categories = getCategories(product);

            return (
              <tr
                key={product.id}
                onClick={() => onProductClick(product.id)}
                className="hover:bg-indigo-50 transition-colors duration-150 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {imageUrl && (
                      <div className="h-12 w-12 flex-shrink-0">
                        <img
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                          src={imageUrl}
                          alt={product.name}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                        />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {product.description.substring(0, 50)}...
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.shop?.name || t('products.na')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.brand?.name || t('products.na')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {categories}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {price > 0 ? formatPrice(price) : t('products.na')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`font-semibold ${stock < 20
                        ? 'text-red-600'
                        : stock < 50
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                  >
                    {stock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {product.is_published ? t('products.published') : t('products.draft')}
                    </span>
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getModerationStatusColor(product.moderation_status)}`}
                    >
                      {getModerationStatusLabel(product.moderation_status, t)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="mt-4 text-lg font-medium">{t('products.empty')}</p>
          <p className="mt-2 text-sm">{t('products.emptyHint')}</p>
        </div>
      )}
    </div>
  );
};
