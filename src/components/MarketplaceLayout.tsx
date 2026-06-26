import React, { useState } from 'react';
import { SlidersHorizontal, X, Layers, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface MarketplaceLayoutProps {
  sidebarContent: React.ReactNode;
  mainGridContent: React.ReactNode;
  resultsCount: number;
  sortByContent?: React.ReactNode;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  title?: string;
  description?: string;
  accentColor?: 'emerald' | 'indigo' | 'rose' | 'amber';
  icon?: React.ReactNode;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  sidebarContent,
  mainGridContent,
  resultsCount,
  sortByContent,
  activeFiltersCount = 0,
  onResetFilters,
  title = "Biashara Discovery Hub",
  description = "Find verified sellers, services, and secure escrow products.",
  accentColor = "emerald",
  icon = <Layers className="w-5 h-5" />
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dynamic accent classes
  const accentBg = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
  }[accentColor];

  return (
    <div id="hudumalink-marketplace-discovery-system" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-gray-900 dark:text-neutral-100 bg-gray-50 dark:bg-neutral-950 min-h-screen transition-colors duration-300">
      
      {/* Search statistics and top navigation actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-gray-200 dark:border-neutral-800 gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm", accentBg)}>
            {icon}
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight font-sans text-gray-900 dark:text-white uppercase">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 max-w-xl">
              {description}
            </p>
          </div>
        </div>

        {/* Results count label */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3.5 py-2 rounded-xl font-bold text-gray-700 dark:text-gray-300 shadow-sm">
            {resultsCount} Live Offers
          </span>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="px-3.5 py-2 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all shadow-xs"
            >
              Clear Filters ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Control row for mobile sorting / mobile filter toggle */}
      <div className="flex items-center justify-between gap-3 mb-6 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-xs font-black text-gray-700 dark:text-gray-300 shadow-xs hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all uppercase tracking-wider"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>

        {sortByContent && (
          <div className="flex-grow flex items-center justify-end">
            {sortByContent}
          </div>
        )}
      </div>

      {/* Main Responsive Grid Discovery Layout */}
      <div className="md:flex md:flex-row items-start gap-6 w-full relative">
        
        {/* Left Sidebar desktop block - sticky top column */}
        <aside className="w-68 shrink-0 hidden md:block select-none">
          {sidebarContent}
        </aside>

        {/* Right Main Discovery Container - stretches to fit full space */}
        <main className="flex-grow w-full min-w-0">
          {/* Top Sort Bar on Desktop views */}
          <div className="hidden md:flex items-center justify-between py-3 px-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl mb-6 text-xs font-bold text-gray-500 dark:text-gray-400 shadow-sm">
            <span>🛡️ Showing premium verified escrow-protected deals across all 47 counties</span>
            {sortByContent && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-extrabold">Sort By:</span>
                {sortByContent}
              </div>
            )}
          </div>

          <div className="w-full">
            {mainGridContent}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Filter Panel Overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-md animate-fadeIn flex justify-end">
          <div className="w-full max-w-[340px] bg-white dark:bg-neutral-900 h-full border-l border-gray-200 dark:border-neutral-800 p-5 relative shadow-2xl flex flex-col justify-between">
            {/* Header with Exit controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-800 mb-4">
              <span className="text-sm font-black text-gray-900 dark:text-neutral-100 uppercase tracking-widest">Adjust Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-950 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Overflow Filters Scroll area */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              {sidebarContent}
            </div>

            {/* Bottom Apply Bar block */}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-center font-bold text-xs uppercase tracking-wider transition-all border border-emerald-500/30 shadow-lg shadow-emerald-900/30"
            >
              Apply Filter Adjustments
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
