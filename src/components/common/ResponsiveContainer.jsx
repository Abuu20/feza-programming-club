import React from 'react';

const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;

// Responsive text component
export const ResponsiveText = ({ children, as: Component = 'p', className = '' }) => {
  return (
    <Component className={`text-sm sm:text-base lg:text-lg ${className}`}>
      {children}
    </Component>
  );
};

// Responsive grid component
export const ResponsiveGrid = ({ children, cols = { default: 1, sm: 2, lg: 3 }, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gridClass = typeof cols === 'number' 
    ? gridCols[cols] || gridCols[1]
    : `grid-cols-${cols.default || 1} sm:grid-cols-${cols.sm || 2} lg:grid-cols-${cols.lg || 3}`;

  return (
    <div className={`grid ${gridClass} gap-4 sm:gap-6 lg:gap-8 ${className}`}>
      {children}
    </div>
  );
};
