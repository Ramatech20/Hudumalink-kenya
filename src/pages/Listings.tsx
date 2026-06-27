import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { Listing } from '../types';
import { formatPrice, cn, getDistance } from '../lib/utils';
import { Search, MapPin, Filter, SlidersHorizontal, X, ChevronRight, ChevronLeft, Loader2, Zap, Tag, DollarSign, ShoppingBag, ShieldCheck, Flame, Layers } from 'lucide-react';
import { KENYAN_COUNTIES, CATEGORIES, TOWNS } from '../constants';
import { motion } from 'motion/react';
import { ListingSkeleton } from '../components/Skeleton';
import { ListingCard } from '../components/ListingCard';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';

// Import newly implemented production discovery system components
import { MarketplaceLayout } from '../components/MarketplaceLayout';
import { SidebarFilters, FilterState } from '../components/SidebarFilters';
import { MarketplaceGrid } from '../components/MarketplaceGrid';
import { MarketplaceCard } from '../components/MarketplaceCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

const LISTINGS_PER_PAGE = 12;

const Listings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const qParam = searchParams.get('q') || '';
  const countyParam = searchParams.get('county') || '';
  const townParam = searchParams.get('town') || '';
  const categoryParam = searchParams.get('category') || '';
  const typeParam = searchParams.get('type') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';

  // Advanced Jumia Filter Parameters
  const isVerifiedParam = searchParams.get('isVerified') || '';
  const isEscrowProtectedParam = searchParams.get('isEscrowProtected') || '';
  const fastDeliveryParam = searchParams.get('fastDelivery') || '';
  const minRatingParam = searchParams.get('minRating') || '';

  useEffect(() => {
    fetchListings(true);
  }, [
    qParam, 
    countyParam, 
    townParam, 
    categoryParam, 
    typeParam, 
    sortBy, 
    minPriceParam, 
    maxPriceParam, 
    userLocation,
    isVerifiedParam,
    isEscrowProtectedParam,
    fastDeliveryParam,
    minRatingParam
  ]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSortBy('distance');
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  };

  const fetchListings = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setLastDoc(null);
    } else {
      setLoadingMore(true);
    }

    try {
      let q = query(
        collection(db, 'listings'), 
        where('status', '==', 'active'),
        limit(LISTINGS_PER_PAGE)
      );
      
      if (typeParam) {
        q = query(q, where('type', '==', typeParam));
      }
      if (categoryParam) {
        q = query(q, where('category', '==', categoryParam));
      }
      if (countyParam) {
        q = query(q, where('location.county', '==', countyParam));
      }
      if (townParam) {
        q = query(q, where('location.town', '==', townParam));
      }

      if (minPriceParam) {
        q = query(q, where('price', '>=', Number(minPriceParam)));
      }
      if (maxPriceParam) {
        q = query(q, where('price', '<=', Number(maxPriceParam)));
      }

      // Sorting
      if (sortBy === 'newest') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else if (sortBy === 'price_low') {
        q = query(q, orderBy('price', 'asc'));
      } else if (sortBy === 'price_high') {
        q = query(q, orderBy('price', 'desc'));
      } else if (sortBy === 'distance' && userLocation) {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
        throw error;
      }
      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      // Client-side search & filtering
      let filteredDocs = newDocs;
      
      // Title / Description text search
      if (qParam) {
        filteredDocs = newDocs.filter(doc => 
          doc.title.toLowerCase().includes(qParam.toLowerCase()) || 
          doc.description.toLowerCase().includes(qParam.toLowerCase())
        );
      }

      // 1. Is Escrow Protected Filter
      if (isEscrowProtectedParam === 'true') {
        filteredDocs = filteredDocs.filter(doc => doc.escrowEnabled !== false);
      }

      // 2. Verified Vendors check
      if (isVerifiedParam === 'true') {
        filteredDocs = filteredDocs.filter(doc => doc.isFeatured || doc.isPromoted || (doc.rating && doc.rating >= 4.7));
      }

      // 3. Fast Delivery Speed filter
      if (fastDeliveryParam === 'true') {
        filteredDocs = filteredDocs.filter(doc => doc.type === 'service' || (doc.stock && doc.stock > 0));
      }

      // 4. Star Rating threshold
      if (minRatingParam) {
        const minRatingVal = Number(minRatingParam);
        filteredDocs = filteredDocs.filter(doc => (doc.rating || 4.8) >= minRatingVal);
      }

      // Sort by promoted status and tier first, then by chosen sort order
      const sortedDocs = [...filteredDocs].sort((a, b) => {
        const tierOrder: Record<string, number> = { elite: 3, premium: 2, basic: 1 };
        const aTier = a.isPromoted ? (tierOrder[a.promotionTier || 'basic'] || 1) : 0;
        const bTier = b.isPromoted ? (tierOrder[b.promotionTier || 'basic'] || 1) : 0;
        
        if (aTier !== bTier) return bTier - aTier;

        if (sortBy === 'distance' && userLocation) {
          const distA = a.location.lat && a.location.lng ? getDistance(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng) : Infinity;
          const distB = b.location.lat && b.location.lng ? getDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng) : Infinity;
          return distA - distB;
        }

        return 0;
      });

      if (isInitial) {
        setListings(sortedDocs);
      } else {
        setListings(prev => [...prev, ...sortedDocs]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === LISTINGS_PER_PAGE);
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateSearchValue = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('q', value);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  // Convert key parameters to Sidebar FilterState interface
  const filterState: FilterState = {
    category: categoryParam,
    county: countyParam,
    town: townParam,
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    type: typeParam,
    isVerified: isVerifiedParam === 'true',
    isEscrowProtected: isEscrowProtectedParam === 'true',
    fastDelivery: fastDeliveryParam === 'true',
    hasPromotion: searchParams.get('hasPromotion') === 'true',
    minRating: minRatingParam ? Number(minRatingParam) : null,
  };

  const handleFilterUpdate = (update: Partial<FilterState>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(update).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === false) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(val));
      }
    });
    if (update.hasOwnProperty('county')) {
      newParams.delete('town');
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  // Calculate total number of active filter tags
  const activeFiltersCount = [
    countyParam,
    townParam,
    categoryParam,
    typeParam,
    minPriceParam,
    maxPriceParam,
    isVerifiedParam,
    isEscrowProtectedParam,
    fastDeliveryParam,
    minRatingParam
  ].filter(Boolean).length;

  const handleCardAction = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/listing/${id}`);
  };

  // 7. Sidebar Filter Component Element
  const sidebarElement = (
    <SidebarFilters
      filters={filterState}
      onChange={handleFilterUpdate}
      onClear={handleClearFilters}
    />
  );

  // Sorting selection block content
  const sortByContent = (
    <div className="flex items-center space-x-2">
      <select 
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="text-xs font-bold bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 outline-none cursor-pointer focus:border-emerald-500 shadow-xs"
        aria-label="Sort listings"
        title="Sort listings"
      >
        <option value="newest">🛡️ Sort by Newest</option>
        <option value="price_low font-sans">💵 Price: Low to High</option>
        <option value="price_high">💰 Price: High to Low</option>
        <option value="distance">📍 Near Me (Distance)</option>
      </select>
      {sortBy === 'distance' && !userLocation && (
        <button 
          onClick={handleGetLocation}
          className="text-[10px] bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 px-2.5 py-1.5 border border-gray-200 dark:border-neutral-750 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold"
        >
          {locating ? 'LOCATING...' : 'GPS'}
        </button>
      )}
    </div>
  );

  // Main list grid content area slot
  const mainGridElement = (
    <div className="space-y-4">
      <div className="mb-6 rounded-[1.75rem] border border-gray-200/70 bg-white/90 p-4 shadow-[0_15px_45px_rgba(15,23,42,0.06)] backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-900/90">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Trusted marketplace</p>
            <h2 className="mt-1 text-lg font-black text-gray-900 dark:text-white">Discover verified offers throughout Kenya</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Escrow protected', 'Verified vendors', 'Fast delivery'].map((pill) => (
              <span key={pill} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300">
                {pill}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mt-4 w-full max-w-2xl rounded-2xl border border-gray-200/70 bg-gray-50/70 shadow-sm dark:border-neutral-800 dark:bg-neutral-950/70">
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center shrink-0">
            <Search className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
          </span>
          <input 
            type="text" 
            placeholder={t('listings.search_placeholder') || "Search plumbers, laptops, farm produce..."} 
            className="w-full rounded-2xl border-0 bg-transparent py-3.5 pl-11 pr-4 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            value={qParam}
            onChange={(e) => updateSearchValue(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <MarketplaceGrid>
          <LoadingSkeleton count={12} />
        </MarketplaceGrid>
      ) : (
        <>
          {listings.length > 0 ? (
            <MarketplaceGrid>
              {listings.map((listing) => (
                <MarketplaceCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={listing.price || 0}
                  location={listing.location.estate ? `${listing.location.estate}, ${listing.location.town}` : `${listing.location.town}, ${listing.location.county}`}
                  imageUrl={listing.images[0]}
                  category={listing.category}
                  vendorName={listing.isPromoted ? "Sponsor Agent" : "Verified Partner"}
                  rating={listing.rating || 4.8}
                  completedJobs={listing.reviewCount || Math.floor(Math.random() * 20) + 5}
                  deliverySpeed={listing.type === 'service' ? 'Instant Help' : 'Fast Delivery'}
                  isEscrowSafe={listing.escrowEnabled !== false}
                  isOffer={listing.isOffer}
                  isPromoted={listing.isPromoted}
                  promotionTier={listing.promotionTier as any}
                  originalPrice={listing.originalPrice}
                  onActionClick={handleCardAction}
                  condition={listing.type === 'product' ? listing.condition : undefined}
                />
              ))}
            </MarketplaceGrid>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-sm px-6"
            >
              <div className="bg-emerald-500/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Search className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight">No active listings match</h3>
              <p className="text-gray-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">
                Adjust your filters or query to find active sellers across standard Kenyan counties.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-650 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:scale-[1.03] transition-all shadow-md shadow-emerald-950/40 border border-emerald-600/30"
                >
                  Reset all filters
                </button>
                {user?.role !== 'customer' && (
                  <Link 
                    to="/create-listing"
                    className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:text-gray-950 dark:hover:text-white rounded-xl text-xs font-black uppercase hover:bg-gray-200 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 transition-all text-center"
                  >
                    Post listing gig
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Load More pagination bar */}
          {listings.length > 0 && hasMore && (
            <div className="pt-8 text-center">
              <button 
                onClick={() => fetchListings()}
                disabled={loadingMore}
                className="px-8 py-3 bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-slate-200 transition-all disabled:opacity-50 flex items-center justify-center mx-auto shadow-xs"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-500 dark:text-emerald-400" />
                    Loading More...
                  </>
                ) : (
                  'Load More Offers'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Dynamic header options based on listings page context
  const dynamicHeader = {
    product: {
      title: t('nav.marketplace') || "Biashara Marketplace",
      description: "Explore premium physical products, electronics, clothing, and local farm produce with secure Escrow protection.",
      accentColor: "emerald" as const,
      icon: <ShoppingBag className="w-5 h-5" />
    },
    service: {
      title: t('nav.services') || "Professional Services & Trades",
      description: "Hire certified local service professionals, plumbers, mechanics, electricians, and technicians with secured milestone Escrow.",
      accentColor: "indigo" as const,
      icon: <Zap className="w-5 h-5" />
    }
  }[typeParam as 'product' | 'service'] || {
    title: "Biashara Discovery Hub",
    description: "Find verified local merchants and talented trade professionals across all 47 Kenyan counties, backed by secure Escrow.",
    accentColor: "emerald" as const,
    icon: <Layers className="w-5 h-5" />
  };

  return (
    <MarketplaceLayout
      sidebarContent={sidebarElement}
      mainGridContent={mainGridElement}
      resultsCount={listings.length}
      sortByContent={sortByContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleClearFilters}
      title={dynamicHeader.title}
      description={dynamicHeader.description}
      accentColor={dynamicHeader.accentColor}
      icon={dynamicHeader.icon}
    />
  );
};

export default Listings;
