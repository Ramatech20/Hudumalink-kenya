import React, { useState } from 'react';
import { SlidersHorizontal, X, ArrowUpDown, RefreshCw, Layers } from 'lucide-react';
import { cn } from '../lib/utils';

interface MarketplaceLayoutProps {
  sidebarContent: React.ReactNode;
  mainGridContent: React.ReactNode;
  resultsCount: number;
  sortByContent?: React.ReactNode;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
}

export const MarketplaceLayout: React.FC<MarketplaceLayoutProps> = ({
  sidebarContent,
  mainGridContent,
  resultsCount,
  sortByContent,
  activeFiltersCount = 0,
  onResetFilters
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div id="hudumalink-marketplace-discovery-system" className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-6 text-white bg-slate-950 min-h-screen">
      
      {/* Search statistics and top navigation actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-700/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight font-sans text-slate-100 uppercase">
              Biashara Discovery Hub
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              Find verified sellers, services, and secure escrow products.
            </p>
          </div>
        </div>

        {/* Results count label */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-bold text-slate-300">
            {resultsCount} offers verified
          </span>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all"
            >
              Clear {activeFiltersCount}
            </button>
          )}
        </div>
      </div>

      {/* Control row for mobile sorting / mobile filter toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 md:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-slate-200 active:bg-slate-850 hover:bg-slate-800 transition-all uppercase tracking-wider"
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>

        {sortByContent && (
          <div className="flex-grow flex items-center justify-end">
            {sortByContent}
          </div>
        )}
      </div>

      {/* Main Responsive Grid Discovery Layout */}
      <div className="md:flex md:flex-row items-start gap-4 w-full relative">
        
        {/* Left Sidebar desktop block - sticky top column */}
        <aside className="w-64 shrink-0 hidden md:block select-none">
          {sidebarContent}
        </aside>

        {/* Right Main Discovery Container - stretches to fit full space */}
        <main className="flex-grow w-full min-w-0">
          {/* Top Sort Bar on Desktop views */}
          <div className="hidden md:flex items-center justify-between py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl mb-4 text-xs font-bold text-slate-400">
            <span>Showing verified live deals across Kenya</span>
            {sortByContent && (
              <div className="flex items-center gap-3">
                <span>Refine by:</span>
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
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-md animate-fadeIn flex justify-end">
          <div className="w-full max-w-[340px] bg-slate-900 h-full border-l border-slate-800 p-4 relative shadow-2xl flex flex-col justify-between">
            {/* Header with Exit controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <span className="text-sm font-black text-slate-200 uppercase tracking-widest">Adjust Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
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
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-center font-bold text-xs uppercase tracking-wider transition-all border border-emerald-500/30 shadow-lg shadow-emerald-900/30"
            >
              Apply Filter Adjustments
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
