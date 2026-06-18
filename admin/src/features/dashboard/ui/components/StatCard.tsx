import React from 'react';

/**
 * StatCardProps defines the properties for StatCard component
 */
export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  growth: number;
  iconBgColor: string;
}

/**
 * StatCard displays a single statistic with icon, value and growth indicator
 */
export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, growth, iconBgColor }) => {
  const isPositive = growth >= 0;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBgColor} p-3 rounded-xl`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-sm">
          <svg 
            className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
            />
          </svg>
          <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{growth}%
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="text-gray-500 text-sm">{title}</p>
      </div>
    </div>
  );
};
