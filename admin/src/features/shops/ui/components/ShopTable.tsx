import React from 'react';
import type { Shop } from '../../domain/entities/Shop';
import { useI18n } from '../../../../shared/i18n/I18nContext';

export interface ShopTableProps {
  shops: Shop[];
  onShopClick?: (shopId: string) => void;
}

/**
 * ShopTable displays shops in a table format similar to UserTable
 */
export const ShopTable: React.FC<ShopTableProps> = ({ shops, onShopClick }) => {
  const { t } = useI18n();

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? t('status.active') : t('status.pending');
  };

  const formatCommission = (rate?: number) => `${((rate ?? 0.03) * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.shop')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('shops.sellerId')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('shops.staffCount')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('shops.platformCommission')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.status')}
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('common.description')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {shops.map((shop) => (
            <tr
              key={shop.id}
              className={`transition-colors ${
                onShopClick
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onShopClick?.(shop.id)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {shop.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                    <div className="text-sm text-gray-500">ID: {shop.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 font-mono">{shop.sellerId}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-900">{shop.staffCount ?? shop.staffIds.length}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-pink-50 text-pink-700">
                  {formatCommission(shop.commissionRate)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    shop.isActive
                  )}`}
                >
                  {getStatusText(shop.isActive)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-500 max-w-xs truncate">
                  {shop.description || t('shops.noDescription')}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
