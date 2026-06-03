import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Tag, Zap } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';

export interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl?: string;
  isOffer?: boolean;
  isPromoted?: boolean;
  promotionTier?: string;
  type?: string;
  stock?: number;
  originalPrice?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  location,
  imageUrl,
  isOffer = false,
  isPromoted = false,
  promotionTier,
  type,
  stock,
  originalPrice,
}) => {
  const finalImage = imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      id={`listing-card-${id}`}
      to={`/listing/${id}`}
      className="group flex flex-col h-full max-h-[260px] sm:max-h-none bg-white dark:bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:shadow-xl transition-all select-none"
    >
      {/* Aspect-square Thumbnail Container */}
      <div className="relative w-full aspect-square overflow-hidden shrink-0">
        <img
          src={finalImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Absolute Metadata Tags Layer */}
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col items-end gap-1">
          {isOffer && (
            <div className="bg-rose-600 text-white px-1.5 py-0.5 rounded sm:rounded-lg text-[7px] sm:text-[9px] font-black tracking-wider sm:tracking-widest flex items-center shadow-md uppercase">
              <Tag className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1" />
              DEAL
            </div>
          )}
          {isPromoted && (
            <div className={cn(
              "px-1.5 py-0.5 rounded sm:rounded-lg text-[7px] sm:text-[9px] font-black flex items-center shadow-md animate-pulse uppercase",
              promotionTier === 'elite' ? "bg-purple-600 text-white" :
              promotionTier === 'premium' ? "bg-primary text-white" : "bg-yellow-400 text-black"
            )}>
              <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5 sm:mr-1 fill-current" />
              {promotionTier?.toUpperCase() || 'AD'}
            </div>
          )}
          {type && (
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-1 py-0.5 rounded text-[7px] sm:text-[9px] font-bold text-primary">
              {type.toUpperCase()}
            </div>
          )}
          {stock !== undefined && (
            <div className={cn(
              "px-1 py-0.5 rounded text-[7px] sm:text-[9px] font-bold text-white",
              stock > 0 ? "bg-green-500/90" : "bg-red-500/90"
            )}>
              {stock > 0 ? 'IN STOCK' : 'OUT'}
            </div>
          )}
        </div>
      </div>

      {/* Structured Compact Text Area */}
      <div className="p-1.5 sm:p-3 flex flex-col justify-between flex-grow min-w-0">
        <div>
          {/* Defensive Geolocation String */}
          <div className="flex items-center text-[9px] sm:text-xs text-gray-400 dark:text-gray-500 leading-none mb-0.5 sm:mb-1 truncate">
            <MapPin className="w-2.5 h-2.5 mr-0.5 text-gray-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {/* Defensive Line-Clamped Title */}
          <h3 className="text-[10px] sm:text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.4em] sm:min-h-[2.8em] tracking-tight">
            {title}
          </h3>
        </div>

        {/* Pricing block + View Offer Footer */}
        <div className="mt-1 sm:mt-2.5">
          {originalPrice && price && originalPrice > price && (
            <div className="flex items-center gap-1 text-[8px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium">
              <span className="line-through">{formatPrice(originalPrice)}</span>
              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[8px] sm:text-[9px] px-0.5 sm:px-1 rounded">
                -{Math.round(((originalPrice - price) / originalPrice) * 105)}%
              </span>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 pt-0.5">
            {/* Formatted Price */}
            <span className="text-[10px] sm:text-base font-extrabold text-primary leading-none truncate block">
              {price ? formatPrice(price) : 'Contact Price'}
            </span>

            {/* HudumaLink Green CTA Button */}
            <span className="inline-flex items-center justify-center py-1 sm:py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[8px] sm:text-xs font-bold transition-colors shadow-sm select-none hover:scale-102 active:scale-98 shrink-0">
              View Offer
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
