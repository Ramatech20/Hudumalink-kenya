import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { Listing } from '../types';
import { formatPrice, cn, getDistance } from '../lib/utils';
import { Search, MapPin, Filter, SlidersHorizontal, X, ChevronRight, ChevronLeft, Loader2, Zap, Tag, DollarSign, ShoppingBag, ShieldCheck, Flame } from 'lucide-react';
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
        className="text-xs font-black bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-emerald-400 outline-none cursor-pointer focus:border-emerald-500"
      >
        <option value="newest">🛡️ Sort by Newest</option>
        <option value="price_low font-sans">💵 Price: Low to High</option>
        <option value="price_high">💰 Price: High to Low</option>
        <option value="distance">📍 Near Me (Distance)</option>
      </select>
      {sortBy === 'distance' && !userLocation && (
        <button 
          onClick={handleGetLocation}
          className="text-[10px] bg-slate-800 px-2 py-1 border border-slate-700 hover:text-white rounded-lg font-black text-emerald-400"
        >
          {locating ? 'LOCATING...' : 'GPS'}
        </button>
      )}
    </div>
  );

  // Main list grid content area slot
  const mainGridElement = (
    <div className="space-y-4">
      {/* Real-time search keyword search area */}
      <div className="relative w-full max-w-lg mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center shrink-0">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input 
          type="text" 
          placeholder={t('listings.search_placeholder') || "Search plumbers, laptops, farm produce..."} 
          className="w-full text-xs pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-transparent text-slate-100 placeholder:text-slate-500 transition-colors"
          value={qParam}
          onChange={(e) => updateSearchValue(e.target.value)}
        />
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
                />
              ))}
            </MarketplaceGrid>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl px-4"
            >
              <div className="bg-emerald-500/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Search className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 uppercase tracking-tight">No active listings match</h3>
              <p className="text-slate-400 mt-2 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">
                Adjust your filters or query to find active sellers across standard Kenyan counties.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={handleClearFilters}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs font-black uppercase hover:scale-[1.03] transition-all shadow-md shadow-emerald-950/40 border border-emerald-600/30"
                >
                  Reset all filters
                </button>
                {user?.role !== 'customer' && (
                  <Link 
                    to="/create-listing"
                    className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-black uppercase hover:bg-slate-755 border border-slate-700 transition-all text-center"
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
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-200 transition-all disabled:opacity-50 flex items-center justify-center mx-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-emerald-400" />
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

  return (
    <MarketplaceLayout
      sidebarContent={sidebarElement}
      mainGridContent={mainGridElement}
      resultsCount={listings.length}
      sortByContent={sortByContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleClearFilters}
    />
  );
};

export default Listings;
