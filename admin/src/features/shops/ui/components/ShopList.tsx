import React from 'react';
import type { Shop } from '../../domain/entities/Shop';

export interface ShopListProps {
  shops: Shop[];
  onShopClick?: (id: string) => void;
}

/**
 * Presentational list of shops and their staff members.
 */
export const ShopList: React.FC<ShopListProps> = ({ shops, onShopClick }) => {
  if (!shops.length) return null;

  const formatCommission = (rate?: number) => `${((rate ?? 0.03) * 100).toFixed(2).replace(/\.?0+$/, '')}%`;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shops.map((shop) => {
        const staffCount = shop.staffCount ?? shop.staffIds.length;

        return (
        <div
          key={shop.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-pink-200 transition-all duration-200 overflow-hidden group"
        >
          {/* Card Header with Status */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                  {shop.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{shop.description || 'No description'}</p>
              </div>
              <span 
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  shop.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${shop.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {shop.isActive ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Card Body - Staff List */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-semibold text-gray-700">
                Staff Members ({staffCount})
              </p>
            </div>

            {staffCount > 0 ? (
              <div className="mb-4">
                <p className="text-sm text-gray-500 italic">
                  {staffCount} staff member{staffCount !== 1 ? 's' : ''} assigned
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic mb-4">No staff assigned</p>
            )}

            <div className="mb-4 rounded-xl bg-pink-50 border border-pink-100 px-3 py-2">
              <p className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Platform Commission</p>
              <p className="text-lg font-bold text-pink-800">{formatCommission(shop.commissionRate)}</p>
            </div>

            {/* Card Footer - Action Button */}
            <button
              onClick={() => onShopClick?.(shop.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
};
