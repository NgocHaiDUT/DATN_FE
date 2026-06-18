import React, { useEffect, useState } from 'react';
import type { Shop } from '../../domain/entities/Shop';
import type { User } from '../../../users/domain/entities';
import { ShopRepositoryImpl } from '../../data/repositories/ShopRepositoryImpl';
import { UserRepositoryImpl } from '../../../users/data/repositories/UserRepositoryImpl';
import { UserApi } from '../../../users/data/api/userApi';
import { useAuth } from '../../../auth/hooks/useAuth';
import { ProductRepositoryImpl } from '../../../products/data/repositories/ProductRepositoryImpl';
import type { Product } from '../../../products/domain/entities/Product';

export interface ShopDetailPageProps {
  shopId: string;
  onBack: () => void;
  onSellerClick?: (sellerId: string) => void;
  onStaffClick?: (staffId: string) => void;
  onViewStatistics?: (shopId: string) => void;
  onProductClick?: (productId: number) => void;
}

/**
 * ShopDetailPage displays detailed information about a shop
 */
export const ShopDetailPage: React.FC<ShopDetailPageProps> = ({ 
  shopId, 
  onBack, 
  onSellerClick, 
  onStaffClick, 
  onViewStatistics,
  onProductClick 
}) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [commissionPercent, setCommissionPercent] = useState('3');
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    const fetchShopAndSeller = async () => {
      try {
        setLoading(true);
        const shopRepository = new ShopRepositoryImpl();
        const shopData = await shopRepository.getById(shopId);
        setShop(shopData);
        setStaffMembers([]);
        setProducts([]);
        setCommissionPercent(String(((shopData?.commissionRate ?? 0.03) * 100).toFixed(2)).replace(/\.?0+$/, ''));

        const userRepository = new UserRepositoryImpl(new UserApi(), token);

        // Fetch seller info
        if (shopData?.sellerId) {
          try {
            const sellerData = await userRepository.getUserById(shopData.sellerId);
            setSeller(sellerData);
          } catch (err) {
            console.warn('Could not fetch seller info:', err);
          }
        }

        // Fetch staff members
        if (shopData?.staffIds && shopData.staffIds.length > 0) {
          try {
            const staffPromises = shopData.staffIds.map(id => userRepository.getUserById(id));
            const staffData = await Promise.all(staffPromises);
            setStaffMembers(staffData.filter(Boolean)); // Filter out any null values
          } catch (err) {
            console.warn('Could not fetch staff info:', err);
          }
        }

        // Fetch products directly by shop. The shop API returns counts, not product IDs.
        try {
          const productRepository = new ProductRepositoryImpl();
          const productResult = await productRepository.getProducts({
            shopId,
            page: 1,
            limit: Math.max(shopData?.productCount ?? 50, 50),
          });
          setProducts(productResult.products);
        } catch (err) {
          console.warn('Could not fetch product info:', err);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndSeller();
  }, [shopId, token]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading shop details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500">Error: {error?.message || 'Shop not found'}</div>
        </div>
      </div>
    );
  }

  const handleProductClick = (productId: number) => {
    if (onProductClick) {
      onProductClick(productId);
    } else {
      window.location.href = `/products/${productId}`;
    }
  };

  const handleSaveCommission = async () => {
    const nextPercent = Number(commissionPercent);
    if (!Number.isFinite(nextPercent) || nextPercent < 0 || nextPercent > 100) {
      setCommissionMessage('Hoa hồng phải nằm trong khoảng 0% đến 100%.');
      return;
    }

    try {
      setCommissionSaving(true);
      setCommissionMessage('');
      const nextRate = nextPercent / 100;
      const shopRepository = new ShopRepositoryImpl();
      await shopRepository.updateCommissionRate(shopId, nextRate);
      setShop((current) => current ? { ...current, commissionRate: nextRate } : current);
      setCommissionPercent(String(nextPercent));
      setCommissionMessage('Đã cập nhật hoa hồng platform.');
    } catch (err) {
      setCommissionMessage(err instanceof Error ? err.message : 'Không thể cập nhật hoa hồng platform.');
    } finally {
      setCommissionSaving(false);
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
      return Math.min(...product.product_variants.map((v) => v.price));
    }
    return 0;
  };

  const getProductStock = (product: Product): number => {
    if (product.product_variants && product.product_variants.length > 0) {
      return product.product_variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return 0;
  };

  const getProductCategory = (product: Product): string => {
    if (product.product_categories && product.product_categories.length > 0) {
      return product.product_categories[0].category.name;
    }
    return 'N/A';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Pending Approval';
  };

  const formatCommission = (rate?: number) => `${((rate ?? 0.03) * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
  const displayedStaffCount = shop.staffCount ?? shop.staffIds.length;
  const displayedProductCount = shop.productCount ?? products.length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors border border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Shops
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Details</h1>
          <p className="text-gray-600 mt-1">View and manage shop information and staff</p>
        </div>
        <button
          onClick={() => onViewStatistics?.(shopId)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Statistics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Shop Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Shop Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-5xl">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">{shop.name}</h2>
              <p className="text-gray-500 text-center mt-1">{shop.description || 'No description'}</p>

              {/* Status */}
              <div className="mt-4">
                <span className={`inline-flex px-4 py-1.5 text-sm font-medium rounded-full ${getStatusColor(shop.isActive)}`}>
                  {getStatusText(shop.isActive)}
                </span>
              </div>
            </div>

            {/* Shop Information */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Shop ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">{shop.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Seller ID</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">{shop.sellerId}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Total Staff</label>
                <p className="text-sm text-gray-900 mt-1">{displayedStaffCount} members</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hoa hồng platform</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Tỷ lệ áp dụng khi chốt các đơn hàng thành công sau thời điểm cập nhật.
                </p>
              </div>
              <span className="inline-flex px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-sm font-semibold">
                {formatCommission(shop.commissionRate)}
              </span>
            </div>

            <div className="mt-5">
              <label htmlFor="commissionPercent" className="text-xs font-medium text-gray-500 uppercase">
                Tỷ lệ hoa hồng (%)
              </label>
              <div className="mt-2 flex gap-3">
                <div className="relative flex-1">
                  <input
                    id="commissionPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={commissionPercent}
                    onChange={(event) => setCommissionPercent(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
                </div>
                <button
                  onClick={handleSaveCommission}
                  disabled={commissionSaving}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-60"
                >
                  {commissionSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              {commissionMessage && (
                <p className={`mt-2 text-sm ${commissionMessage.startsWith('Đã') ? 'text-green-600' : 'text-red-600'}`}>
                  {commissionMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Staff List and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{displayedStaffCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{displayedProductCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${shop.isActive ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-orange-500'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {shop.isActive ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-bold text-gray-900">{getStatusText(shop.isActive)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2m8-6a8 8 0 11-16 0 8 8 0 0116 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Platform Commission</p>
                  <p className="text-lg font-bold text-pink-700">{formatCommission(shop.commissionRate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Owner / Seller Information */}
          {seller && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Shop Owner</h3>
              <div 
                onClick={() => onSellerClick?.(seller.id)}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:from-pink-100 hover:to-purple-100 transition-all cursor-pointer border border-pink-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-2xl">
                    {seller.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg">{seller.name}</p>
                  <p className="text-sm text-gray-600">{seller.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {seller.role}
                    </span>
                    {seller.phone && (
                      <span className="text-xs text-gray-500">📞 {seller.phone}</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">Click to view seller details</p>
            </div>
          )}

          {/* Staff List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Staff Members</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm text-sm">
                + Add Staff
              </button>
            </div>

            {staffMembers.length > 0 ? (
              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div 
                    key={staff.id} 
                    onClick={() => onStaffClick?.(staff.id)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 transition-all cursor-pointer border border-transparent hover:border-pink-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-pink-700 font-bold text-lg">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{staff.name}</p>
                        {staff.email && <p className="text-sm text-gray-500">{staff.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {staff.role && (
                        <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          {staff.role}
                        </span>
                      )}
                      <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 font-medium">No staff members yet</p>
                <p className="text-sm text-gray-400 mt-1">Add staff members to manage this shop</p>
              </div>
            )}
            {staffMembers.length > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">Click on a staff member to view their details</p>
            )}
          </div>

          {/* Products List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Products</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm text-sm">
                + Add Product
              </button>
            </div>

            {products.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      onClick={() => handleProductClick(product.id)}
                      className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        {getProductImage(product) ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={getProductImage(product)} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.png';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-pink-600">
                              {product.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate group-hover:text-pink-600 transition-colors">
                            {product.name}
                          </h4>
                          {product.brand && (
                            <p className="text-xs text-gray-500 mt-0.5">{product.brand.name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {getProductCategory(product)}
                            </span>
                            {product.is_published ? (
                              <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-pink-600">
                              {formatPrice(getProductPrice(product))}
                            </span>
                            <span className="text-xs text-gray-500">
                              Stock: {getProductStock(product)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Click to view details
                        </span>
                        <svg className="w-4 h-4 text-pink-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Total: {products.length} product{products.length !== 1 ? 's' : ''}. Click on a product to view details.
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 font-medium">No products yet</p>
                <p className="text-sm text-gray-400 mt-1">Add products to start selling</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm">
              Edit Shop
            </button>
            {!shop.isActive && (
              <button className="px-6 py-3 bg-green-50 text-green-600 font-medium rounded-xl hover:bg-green-100 transition-all border border-green-200">
                Approve Shop
              </button>
            )}
            <button className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all">
              Delete Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
