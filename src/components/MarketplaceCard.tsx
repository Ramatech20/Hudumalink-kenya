import React, { memo } from 'react';
import { Star, ShieldCheck, Zap, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';

export interface MarketplaceCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl?: string;
  category?: string;
  vendorName?: string;
  rating?: number;
  completedJobs?: number;
  deliverySpeed?: string;
  isEscrowSafe?: boolean;
  isOffer?: boolean;
  isPromoted?: boolean;
  promotionTier?: 'elite' | 'premium' | 'basic';
  originalPrice?: number;
  type?: 'service' | 'product';
  badgeLabel?: string;
  onActionClick?: (id: string, e: React.MouseEvent) => void;
  condition?: string;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = memo(({
  id,
  title,
  price,
  location,
  imageUrl,
  category,
  vendorName = "HudumaLink Partner",
  rating = 4.8,
  completedJobs = 12,
  deliverySpeed = "Instant",
  isEscrowSafe = true,
  isOffer = false,
  isPromoted = false,
  promotionTier = 'basic',
  originalPrice,
  type = 'service',
  badgeLabel,
  onActionClick,
  condition
}) => {
  const conditionLabels: Record<string, string> = {
    'brand-new': 'Brand New',
    'like-new': 'Like New',
    'excellent': 'Excellent',
    'good': 'Good',
    'fair': 'Fair',
    'refurbished': 'Refurbished',
    'second-hand': 'Second Hand',
    'new': 'Brand New',
  };
  const isNewCondition = condition === 'brand-new' || condition === 'like-new' || condition === 'new';
  const conditionLabel = condition ? (conditionLabels[condition] || condition.replace('-', ' ').toUpperCase()) : '';

  const finalImage = imageUrl || 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80';
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <div
      id={`marketplace-card-${id}`}
      className="group flex flex-col w-full h-full max-h-[280px] sm:max-h-none rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:-translate-y-1.5 transition-all duration-300 shadow-xs hover:shadow-md select-none text-gray-900 dark:text-white relative"
    >
      {/* 4. Aspect-ratio Thumbnail / Media Section */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100 dark:bg-neutral-950 shrink-0">
        <img
          src={finalImage}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />

        {/* Absolute Badges Layer */}
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {/* Boosted / Ad indicator */}
          {isPromoted && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-black tracking-wider flex items-center shadow-lg gap-0.5 uppercase backdrop-blur-sm",
              promotionTier === 'elite' ? "bg-purple-600/90 text-white border border-purple-400/25" :
              promotionTier === 'premium' ? "bg-emerald-600/90 text-white border border-emerald-400/25" : 
              "bg-amber-500/95 text-slate-950"
            )}>
              <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current shrink-0" />
              {promotionTier === 'elite' ? 'ELITE' : promotionTier === 'premium' ? 'FEATURED' : 'SPONSORED'}
            </span>
          )}

          {/* Deal/Discount stamp */}
          {isOffer && (
            <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-black tracking-widest flex items-center shadow-lg uppercase border border-rose-500/20">
              DEAL
            </span>
          )}

          {/* Escrow Safe Tag */}
          {isEscrowSafe && (
            <span className="bg-white/95 dark:bg-neutral-950/85 backdrop-blur-md text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded text-[7px] sm:text-[9px] font-extrabold tracking-wider flex items-center gap-0.5 shadow-sm">
              <ShieldCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0 text-emerald-500" />
              ESCROW
            </span>
          )}
        </div>

        {/* Top-Right Badges: Rating/Type */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col gap-1 items-end z-10 pointer-events-none">
          {condition && (
            <span className={cn(
              "backdrop-blur-md border px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-black uppercase shrink-0 shadow-sm",
              isNewCondition 
                ? "bg-green-100/90 dark:bg-green-950/90 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40" 
                : "bg-orange-100/90 dark:bg-orange-950/90 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40"
            )}>
              {conditionLabel}
            </span>
          )}
          {category && (
            <span className="bg-white/95 dark:bg-neutral-950/85 backdrop-blur-md border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-bold uppercase shrink-0 shadow-sm">
              {category}
            </span>
          )}
          {rating && (
            <div className="flex items-center gap-0.5 bg-white/95 dark:bg-neutral-950/85 backdrop-blur-md px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-800 text-[8px] sm:text-[10px] font-black text-amber-500 dark:text-amber-400 shadow-sm">
              <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Discount Overlay bottom of Image */}
        {hasDiscount && (
          <div className="absolute bottom-1.5 left-1.5 bg-rose-600/90 backdrop-blur-sm text-white text-[7px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-rose-500/20 z-10 uppercase shadow-md">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* 5. Marketplace Content Structure */}
      <div className="p-2 sm:p-4 flex flex-col justify-between flex-grow min-w-0">
        <div>
          {/* Geolocation, provider identity, and service rating lines */}
          <div className="flex items-center justify-between text-[8px] sm:text-xs text-gray-500 dark:text-neutral-400 leading-none mb-2 gap-2 min-w-0">
            {/* County Location */}
            <span className="flex items-center shrink-0 max-w-[50%] truncate font-medium">
              <MapPin className="w-3 h-3 mr-0.5 text-gray-400 dark:text-neutral-500 shrink-0" />
              {location}
            </span>
            {/* Vendor Name */}
            <span className="font-semibold text-gray-700 dark:text-neutral-300 truncate max-w-[50%] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              {vendorName}
            </span>
          </div>

          {/* Defensive Line-Clamped Title */}
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-neutral-100 line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-amber-400 transition-colors min-h-[2.4em] sm:min-h-[2.8em] tracking-tight text-left">
            {title}
          </h3>
          
          {/* Metadata features line inside footer content */}
          <div className="hidden sm:flex items-center gap-2 mt-2 px-0.5 text-[10px] text-gray-500 dark:text-neutral-400 font-semibold">
            {condition && (
              <span className={cn(
                "px-1.5 py-0.5 rounded font-black text-[9px] uppercase",
                isNewCondition ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
              )}>
                {conditionLabel}
              </span>
            )}
            <span className="bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-md">{deliverySpeed}</span>
            <span>•</span>
            <span>{completedJobs} completed</span>
          </div>
        </div>

        {/* Pricing block + Escrow View Details bottom action */}
        <div className="mt-2 sm:mt-3 px-0.5 pt-2 border-t border-gray-100 dark:border-neutral-800/40">
          {/* Original price crossout */}
          {hasDiscount && (
            <span className="line-through text-gray-400 dark:text-neutral-550 text-[8px] sm:text-[11px] font-semibold block leading-none mb-1">
              {formatPrice(originalPrice!)}
            </span>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-stretch sm:items-center gap-1.5 sm:gap-2">
            {/* Formatted Price */}
            <span className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none truncate block">
              {price ? formatPrice(price) : 'Contact Price'}
            </span>

            {/* Compact Green CTA Button */}
            <button
              onClick={(e) => {
                if (onActionClick) {
                  onActionClick(id, e);
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center py-1.5 sm:py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-[9px] sm:text-xs font-bold transition-all hover:scale-[1.03] active:scale-95 shrink-0 select-none uppercase tracking-wide border border-emerald-500/20 font-sans shadow-xs"
            >
              View Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MarketplaceCard.displayName = 'MarketplaceCard';
