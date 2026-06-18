import React from 'react';
import type { RevenueTrend } from '../../domain/entities';
import { useI18n } from '../../../../shared/i18n/I18nContext';

/**
 * RevenueChartProps defines the properties for RevenueChart component
 */
export interface RevenueChartProps {
  data: RevenueTrend[];
}

/**
 * RevenueChart displays a line chart of monthly revenue trend
 */
export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { t } = useI18n();

  if (data.length === 0) {
    return <div className="text-gray-500">{t('dashboard.noData')}</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const minRevenue = Math.min(...data.map(d => d.revenue));
  const range = maxRevenue - minRevenue;

  // Calculate points for the SVG path
  const width = 600;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((item.revenue - minRevenue) / range) * chartHeight;
    return { x, y, ...item };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{t('dashboard.revenueTrend')}</h2>
        <p className="text-gray-500 text-sm">{t('dashboard.revenueTrendDesc')}</p>
      </div>
      
      <div className="relative">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i / 4) * chartHeight;
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding + (i / 4) * chartHeight;
            const value = maxRevenue - (i / 4) * range;
            return (
              <text
                key={i}
                x={padding - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {Math.round(value / 1000)}k
              </text>
            );
          })}

          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#EC4899"
                stroke="white"
                strokeWidth="3"
                className="cursor-pointer hover:r-8 transition-all"
              />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {point.month}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
