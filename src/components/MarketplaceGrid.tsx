import React from 'react';

interface MarketplaceGridProps {
  children: React.ReactNode;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ children }) => {
  return (
    <div 
      id="marketplace-responsive-grid" 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 w-full h-auto items-stretch auto-rows-fr"
    >
      {children}
    </div>
  );
};
