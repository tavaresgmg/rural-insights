import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  color?: 'verde-safra' | 'dourado-milho' | 'terra-fertil';
  trend?: 'up' | 'down' | 'normal' | 'high' | 'opportunity';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon = '📊',
  color = 'verde-safra',
  trend
}) => {
  const colorClasses = {
    'verde-safra': 'bg-verde-safra/10 border-verde-safra/20 text-verde-safra',
    'dourado-milho': 'bg-dourado-milho/10 border-dourado-milho/20 text-dourado-milho',
    'terra-fertil': 'bg-terra-fertil/10 border-terra-fertil/20 text-terra-fertil'
  };

  const trendIcons = {
    up: '📈',
    down: '📉',
    high: '⚠️',
    normal: '✅',
    opportunity: '💡'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl p-6 border-2 ${colorClasses[color]} bg-white shadow-lg`}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-5">
        <div className="text-9xl">{icon}</div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{icon}</div>
          {trend && (
            <div className="text-2xl" title={trend}>
              {trendIcons[trend]}
            </div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-gray-600 mb-1 truncate">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-words">{value}</p>
        
        {subtitle && (
          <p className="text-sm text-gray-500 truncate-2">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};