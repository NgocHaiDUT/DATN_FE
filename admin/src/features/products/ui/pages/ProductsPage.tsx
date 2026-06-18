import React, { useEffect, useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { ProductTable } from '../components/ProductTable';
import { Pagination } from '../components/Pagination';
import { ProductForm } from '../components/ProductForm';
import type { Product, CreateProductInput, UpdateProductInput } from '../../domain/entities/Product';
import { productApi } from '../../data/api/productApi';
import { useI18n } from '../../../../shared/i18n/I18nContext';

export interface ProductsPageProps {
  onProductClick?: (productId: number) => void;
  onNavigateToBrands?: () => void;
  onNavigateToCategories?: () => void;
}

/**
 * ProductsPage - Main page for managing products
 */
export const ProductsPage: React.FC<ProductsPageProps> = ({
  onProductClick,
  onNavigateToBrands,
  onNavigateToCategories
}) => {
  const { t } = useI18n();
  const {
    products,
    total,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
  } = useProducts();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [brandFilter, setBrandFilter] = useState<number | ''>('');
  const [publishedFilter, setPublishedFilter] = useState<boolean | ''>('');
  const [moderationFilter, setModerationFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Fetch categories and brands
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(total / itemsPerPage);

  useEffect(() => {
    loadFilters();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadProducts();
      } else {
        setCurrentPage(1); // This will trigger loadProducts via the next useEffect
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, categoryFilter, brandFilter, publishedFilter, moderationFilter]);

  const loadFilters = async () => {
    setLoadingFilters(true);
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getBrands(),
      ]);

      if (categoriesRes.success && categoriesRes.categories) {
        setCategories(categoriesRes.categories);
      }
      if (brandsRes.success && brandsRes.brands) {
        setBrands(brandsRes.brands);
      }
    } catch (err) {
      console.error('Failed to load filters:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadProducts = () => {
    fetchProducts({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      category: categoryFilter || undefined,
      brand: brandFilter || undefined,
      is_published: publishedFilter === '' ? undefined : publishedFilter,
      moderation_status: moderationFilter || undefined,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is now handled by debounced effect
    // This just prevents form submission
  };

  const handleProductClick = (id: number) => {
    if (onProductClick) {
      onProductClick(id);
    } else {
      window.location.href = `/products/${id}`;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setBrandFilter('');
    setPublishedFilter('');
    setModerationFilter('');
    setCurrentPage(1);
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowProductForm(true);
  };

  const handleManageBrands = () => {
    if (onNavigateToBrands) {
      onNavigateToBrands();
    } else {
      window.location.href = '/products/brands';
    }
  };

  const handleManageCategories = () => {
    if (onNavigateToCategories) {
      onNavigateToCategories();
    } else {
      window.location.href = '/products/categories';
    }
  };

  const handleProductFormSubmit = async (input: CreateProductInput | UpdateProductInput) => {
    if ('id' in input) {
      // Update
      const result = await updateProduct(input);
      if (result) {
        setShowProductForm(false);
        setEditingProduct(undefined);
        loadProducts();
      }
    } else {
      // Create
      const result = await createProduct(input);
      if (result) {
        setShowProductForm(false);
        loadProducts();
      }
    }
  };

  const handleProductFormCancel = () => {
    setShowProductForm(false);
    setEditingProduct(undefined);
  };

  const handleCategoryFormCancel = () => {
    setShowCategoryForm(false);
  };

  const hasActiveFilters = searchTerm !== '' || categoryFilter !== '' || brandFilter !== '' || publishedFilter !== '' || moderationFilter !== '';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('products.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('products.subtitle')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showProductForm ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="mb-6">
            <button
              onClick={handleProductFormCancel}
              className="text-indigo-600 hover:text-indigo-900 mb-4 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {t('products.backToProducts')}
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {editingProduct ? t('common.edit') : t('products.create')}
            </h2>
          </div>
          <ProductForm
            product={editingProduct}
            onSubmit={handleProductFormSubmit}
            onCancel={handleProductFormCancel}
            loading={loading}
          />
        </div>
      ) : showCategoryForm ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="mb-6">
            <button
              onClick={handleCategoryFormCancel}
              className="text-indigo-600 hover:text-indigo-900 mb-4 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {t('products.backToProducts')}
            </button>
            <h2 className="text-xl font-bold text-gray-900">
              {t('categories.add')}
            </h2>
          </div>
          <form className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                {t('categories.name')} *
              </label>
              <input
                type="text"
                id="categoryName"
                name="categoryName"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={t('categories.namePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">
                {t('common.description')}
              </label>
              <textarea
                id="categoryDescription"
                name="categoryDescription"
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder={t('categories.descriptionPlaceholder')}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCategoryFormCancel}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                {t('categories.add')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium shadow-sm"
              >
                {t('products.searchLabel')}
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value ? Number(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                  disabled={loadingFilters}
                  className="appearance-none w-full sm:w-48 px-4 py-2 pr-10 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors duration-200 disabled:opacity-50"
                >
                  <option value="">{t('products.allCategories')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={brandFilter}
                  onChange={(e) => {
                    setBrandFilter(e.target.value ? Number(e.target.value) : '');
                    setCurrentPage(1);
                  }}
                  disabled={loadingFilters}
                  className="appearance-none w-full sm:w-48 px-4 py-2 pr-10 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors duration-200 disabled:opacity-50"
                >
                  <option value="">{t('products.allBrands')}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Publication Status Filter */}
              <div className="relative">
                <select
                  value={publishedFilter === '' ? '' : publishedFilter ? 'true' : 'false'}
                  onChange={(e) => {
                    setPublishedFilter(e.target.value === '' ? '' : e.target.value === 'true');
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full sm:w-48 px-4 py-2 pr-10 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors duration-200"
                >
                  <option value="">{t('products.allStatus')}</option>
                  <option value="true">{t('products.published')}</option>
                  <option value="false">{t('products.draft')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Moderation Status Filter */}
              <div className="relative">
                <select
                  value={moderationFilter}
                  onChange={(e) => {
                    setModerationFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full sm:w-48 px-4 py-2 pr-10 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer hover:border-gray-400 transition-colors duration-200"
                >
                  <option value="">{t('products.allModeration')}</option>
                  <option value="pending">{t('products.moderationStatus.pending')}</option>
                  <option value="approved">{t('products.moderationStatus.approved')}</option>
                  <option value="rejected">{t('products.moderationStatus.rejected')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2 ml-auto">
                <button
                  onClick={handleAddProduct}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 whitespace-nowrap font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {t('products.add')}
                </button>
                <button
                  onClick={handleManageBrands}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 whitespace-nowrap font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {t('products.manageBrands')}
                </button>
                <button
                  onClick={handleManageCategories}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 whitespace-nowrap font-medium shadow-sm flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 1 0 012-2h12a2 1 0 012 2v4a2 1 0 01-2 2H4a2 1 0 01-2-2v-4z" />
                  </svg>
                  {t('products.manageCategories')}
                </button>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">{t('products.activeFilters')}</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {t('products.searchLabel')}: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="hover:bg-indigo-200 rounded-full p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {t('products.category')}: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                {t('products.clearAll')}
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">{t('products.loading')}</p>
            </div>
          ) : (
            <>
              <ProductTable
                products={products}
                onProductClick={handleProductClick}
              />

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}

              <div className="mt-4 text-sm text-gray-600">
                {t('products.showing', { shown: products.length, total })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

