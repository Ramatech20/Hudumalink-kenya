import React, { useState } from 'react';
import { Tag, MapPin, DollarSign, ShieldCheck, Star, Truck, Bookmark, Flame, RefreshCcw, Sparkles } from 'lucide-react';
import { KENYAN_COUNTIES, CATEGORIES, TOWNS } from '../constants';
import { cn } from '../lib/utils';

export interface FilterState {
  category: string;
  county: string;
  town: string;
  minPrice: string;
  maxPrice: string;
  type: string;
  isVerified: boolean;
  isEscrowProtected: boolean;
  fastDelivery: boolean;
  hasPromotion: boolean;
  minRating: number | null;
}

interface SidebarFiltersProps {
  filters: FilterState;
  onChange: (update: Partial<FilterState>) => void;
  onClear: () => void;
  countyTowns?: string[];
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  filters,
  onChange,
  onClear,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    location: true,
    pricing: true,
    guarantees: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (key: keyof FilterState, checked: boolean) => {
    onChange({ [key]: checked });
  };

  return (
    <div id="sidebar-filters-panel" className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-5 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto space-y-6 shadow-sm scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800 scrollbar-track-transparent">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800 shrink-0">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
          <Flame className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          Filter Listings
        </h2>
        
        <button
          onClick={onClear}
          className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 hover:underline uppercase transition-all tracking-wider flex items-center gap-1 shrink-0"
        >
          <RefreshCcw className="w-3 h-3" />
          Reset All
        </button>
      </div>

      {/* Guarantees & Trust Features */}
      <div id="filter-section-guarantees" className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          Platform Trust Guarantees
        </h3>
        <div className="flex flex-col gap-2">
          {/* Escrow Checkbox button */}
          <button
            onClick={() => handleCheckboxChange('isEscrowProtected', !filters.isEscrowProtected)}
            className={cn(
              "flex items-center justify-between w-full p-3 rounded-2xl border text-xs font-bold tracking-wide transition-all text-left shadow-xs",
              filters.isEscrowProtected 
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400" 
                : "bg-gray-50 dark:bg-neutral-950/40 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-800 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Escrow Protected Only
            </span>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              filters.isEscrowProtected ? "bg-emerald-500 dark:bg-emerald-400 shadow-md shadow-emerald-500/50" : "bg-transparent border border-gray-300 dark:border-neutral-700"
            )} />
          </button>

          {/* Verification Checkbox */}
          <button
            onClick={() => handleCheckboxChange('isVerified', !filters.isVerified)}
            className={cn(
              "flex items-center justify-between w-full p-3 rounded-2xl border text-xs font-bold tracking-wide transition-all text-left shadow-xs",
              filters.isVerified 
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400" 
                : "bg-gray-50 dark:bg-neutral-950/40 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-800 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Verified Vendors Only
            </span>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              filters.isVerified ? "bg-emerald-500 dark:bg-emerald-400 shadow-md shadow-emerald-500/50" : "bg-transparent border border-gray-300 dark:border-neutral-700"
            )} />
          </button>

          {/* Fast Delivery Checkbox */}
          <button
            onClick={() => handleCheckboxChange('fastDelivery', !filters.fastDelivery)}
            className={cn(
              "flex items-center justify-between w-full p-3 rounded-2xl border text-xs font-bold tracking-wide transition-all text-left shadow-xs",
              filters.fastDelivery 
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400" 
                : "bg-gray-50 dark:bg-neutral-950/40 border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-800 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Instant Speed Gigs
            </span>
            <div className={cn(
              "w-2.5 h-2.5 rounded-full transition-all",
              filters.fastDelivery ? "bg-emerald-500 dark:bg-emerald-400 shadow-md shadow-emerald-500/50" : "bg-transparent border border-gray-300 dark:border-neutral-700"
            )} />
          </button>
        </div>
      </div>

      {/* County & Town location filters */}
      <div id="filter-section-location" className="space-y-3 border-t border-gray-100 dark:border-neutral-800/60 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
            County Territory
          </h3>
          {filters.county && (
            <button onClick={() => onChange({ county: '', town: '' })} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button>
          )}
        </div>
        <select 
          className="w-full text-xs p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 transition-all font-sans"
          value={filters.county}
          onChange={(e) => onChange({ county: e.target.value, town: '' })}
        >
          <option value="">All Counties in Kenya</option>
          {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {filters.county && (
          <div className="space-y-1.5 pt-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">Town / Estate</label>
              {filters.town && (
                <button onClick={() => onChange({ town: '' })} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button>
              )}
            </div>
            {TOWNS[filters.county] ? (
              <select
                className="w-full text-xs p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 font-sans"
                value={filters.town}
                onChange={(e) => onChange({ town: e.target.value })}
              >
                <option value="">All Towns</option>
                {TOWNS[filters.county].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter town keyword..."
                className="w-full text-xs p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-neutral-600"
                value={filters.town}
                onChange={(e) => onChange({ town: e.target.value })}
              />
            )}
          </div>
        )}
      </div>

      {/* Category selection */}
      <div id="filter-section-categories" className="space-y-3 border-t border-gray-100 dark:border-neutral-800/60 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
            Marketplace Category
          </h3>
          {filters.category && (
            <button onClick={() => onChange({ category: '' })} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button>
          )}
        </div>
        <select 
          className="w-full text-xs p-3 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 transition-all font-sans"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All Categories</option>
          <optgroup label="Services Catalog">
            {CATEGORIES.services.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
          <optgroup label="Marketplace Gigs">
            {CATEGORIES.marketplace.map(c => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Precise Pricing limits */}
      <div id="filter-section-price" className="space-y-3 border-t border-gray-100 dark:border-neutral-800/60 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
            KSh Price Boundaries
          </h3>
          {(filters.minPrice || filters.maxPrice) && (
            <button onClick={() => onChange({ minPrice: '', maxPrice: '' })} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">Clear</button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-gray-400 dark:text-neutral-500">MIN</span>
            <input 
              type="number" 
              placeholder="0"
              className="w-full pl-9 pr-2 py-2.5 text-xs bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 leading-none"
              value={filters.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-gray-400 dark:text-neutral-500">MAX</span>
            <input 
              type="number" 
              placeholder="1M+"
              className="w-full pl-9 pr-2 py-2.5 text-xs bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 dark:text-slate-200 leading-none"
              value={filters.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Star Ratings Level */}
      <div id="filter-section-ratings" className="space-y-3 border-t border-gray-100 dark:border-neutral-800/60 pt-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500" />
          Minimum Vendor Star
        </h3>
        <div className="flex gap-1.5 justify-between">
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => onChange({ minRating: filters.minRating === star ? null : star })}
              className={cn(
                "flex-grow flex items-center justify-center gap-0.5 py-2 border rounded-xl text-xs font-black transition-all",
                filters.minRating === star
                  ? "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-500"
                  : "bg-gray-50 dark:bg-neutral-950/40 border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-700 dark:hover:text-neutral-300"
              )}
            >
              <span>{star}</span>
              <Star className="w-2.5 h-2.5 fill-current" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
