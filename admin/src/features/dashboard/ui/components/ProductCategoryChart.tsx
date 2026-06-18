import React from 'react';
import type { ProductCategory } from '../../domain/entities';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * ProductCategoryChartProps defines the properties for ProductCategoryChart component
 */
export interface ProductCategoryChartProps {
  data: ProductCategory[];
}

/**
 * ProductCategoryChart displays a donut chart of sales distribution by product type
 */
export const ProductCategoryChart: React.FC<ProductCategoryChartProps> = ({ data }) => {
  const { t } = useI18n();

  if (data.length === 0) {
    return <div className="text-gray-500">{t('dashboard.noData')}</div>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top

  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc path
    const radius = 80;
    const innerRadius = 50;
    const cx = 100;
    const cy = 100;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z',
    ].join(' ');

    return {
      ...item,
      pathData,
      percentage,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.productCategories')}</h2>
        <p className="text-gray-500 text-sm">{t('dashboard.productCategoriesDesc')}</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Donut Chart */}
        <div className="flex-shrink-0">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="w-full space-y-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-700 text-sm font-medium">
                  {segment.category}
                </span>
              </div>
              <span className="text-gray-900 font-semibold text-sm">
                {segment.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
