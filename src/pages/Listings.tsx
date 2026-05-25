import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { Listing } from '../types';
import { formatPrice, cn, getDistance } from '../lib/utils';
import { Search, MapPin, Filter, SlidersHorizontal, X, ChevronRight, ChevronLeft, Loader2, Zap, Tag, DollarSign, ShoppingBag } from 'lucide-react';
import { KENYAN_COUNTIES, CATEGORIES } from '../constants';
import { motion } from 'motion/react';
import { ListingSkeleton } from '../components/Skeleton';
import { useLanguage } from '../LanguageContext';

const LISTINGS_PER_PAGE = 12;

const Listings = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const qParam = searchParams.get('q') || '';
  const countyParam = searchParams.get('county') || '';
  const categoryParam = searchParams.get('category') || '';
  const typeParam = searchParams.get('type') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';

  useEffect(() => {
    fetchListings(true);
  }, [qParam, countyParam, categoryParam, typeParam, sortBy, minPriceParam, maxPriceParam, userLocation]);

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
        // Distance sorting is done client-side below
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
      
      // Client-side search for keyword (Firestore limitation)
      let filteredDocs = newDocs;
      if (qParam) {
        filteredDocs = newDocs.filter(doc => 
          doc.title.toLowerCase().includes(qParam.toLowerCase()) || 
          doc.description.toLowerCase().includes(qParam.toLowerCase())
        );
      }

      // Sort by promoted status and tier first, then by the chosen sort order
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

        return 0; // Keep original sort order for items with same promoted status
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

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className={cn(
          "w-full md:w-64 space-y-8 md:block transition-colors",
          showFilters ? "block" : "hidden"
        )}>
          <div className="flex justify-between items-center md:hidden">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('listings.filters')}</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 dark:text-gray-400"><X className="w-6 h-6" /></button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('listings.location')}</h3>
            {countyParam && (
              <button onClick={() => updateFilter('county', '')} className="text-[10px] font-bold text-primary hover:underline uppercase">{t('listings.clear')}</button>
            )}
          </div>
          <select 
            className="w-full p-3 border border-gray-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-all shadow-sm"
            value={countyParam}
            onChange={(e) => updateFilter('county', e.target.value)}
          >
            <option value="" className="dark:bg-neutral-900">{t('listings.all_counties')}</option>
            {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
          </select>

          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center">
                <Tag className="w-3 h-3 mr-2" /> {t('listings.category')}
              </h3>
              {categoryParam && (
                <button onClick={() => updateFilter('category', '')} className="text-[10px] font-bold text-primary hover:underline uppercase">{t('listings.clear')}</button>
              )}
            </div>
            <select 
              className="w-full p-3 border border-gray-100 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-all shadow-sm text-sm"
              value={categoryParam}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="" className="dark:bg-neutral-900">{t('listings.all_categories')}</option>
              <optgroup label={t('nav.services')} className="dark:bg-neutral-900">
                {CATEGORIES.services.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </optgroup>
              <optgroup label={t('nav.marketplace')} className="dark:bg-neutral-900">
                {CATEGORIES.marketplace.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center">
                <DollarSign className="w-3 h-3 mr-2" /> {t('listings.price_range')}
              </h3>
              {(minPriceParam || maxPriceParam) && (
                <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }} className="text-[10px] font-bold text-primary hover:underline uppercase">{t('listings.clear')}</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{t('listings.min')}</span>
                <input 
                  type="number" 
                  className="w-full pl-10 pr-3 py-3 border border-gray-100 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-all shadow-sm text-sm"
                  value={minPriceParam}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{t('listings.max')}</span>
                <input 
                  type="number" 
                  className="w-full pl-10 pr-3 py-3 border border-gray-100 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-all shadow-sm text-sm"
                  value={maxPriceParam}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center">
              <ShoppingBag className="w-3 h-3 mr-2" /> {t('listings.type')}
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { id: '', label: t('listings.all_types') },
                { id: 'product', label: t('listings.products_only') },
                { id: 'service', label: t('listings.services_only') }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateFilter('type', t.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                    typeParam === t.id 
                      ? "bg-primary/10 border-primary text-primary shadow-sm" 
                      : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:border-primary/50"
                  )}
                >
                  {t.label}
                  {typeParam === t.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          {(qParam || countyParam || categoryParam || typeParam || minPriceParam || maxPriceParam) && (
            <button 
              onClick={() => setSearchParams({})}
              className="w-full py-3 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
            >
              {t('listings.reset_filters')}
            </button>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-grow space-y-6">
          {/* Search Bar & Mobile Filter Toggle */}
          <div className="flex gap-2">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('listings.search_placeholder')} 
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-neutral-800 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors"
                value={qParam}
                onChange={(e) => updateFilter('q', e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(true)}
              className="md:hidden p-3 border border-gray-200 dark:border-neutral-800 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <SlidersHorizontal className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Results Info & Sorting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-gray-500 dark:text-gray-400">
              {t('listings.showing_results').replace('{count}', listings.length.toString())}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('listings.sort_by')}</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-bold bg-transparent border-none outline-none text-primary cursor-pointer"
              >
                <option value="newest">{t('listings.sort_newest')}</option>
                <option value="price_low">{t('listings.sort_price_low')}</option>
                <option value="price_high">{t('listings.sort_price_high')}</option>
                <option value="distance">{t('listings.sort_distance')}</option>
              </select>
              {sortBy === 'distance' && !userLocation && (
                <button 
                  onClick={handleGetLocation}
                  className="text-[10px] font-bold text-primary hover:underline ml-2 uppercase"
                >
                  {locating ? t('listings.locating') : t('listings.enable_location')}
                </button>
              )}
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <ListingSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link 
                    key={listing.id} 
                    to={`/listing/${listing.id}`}
                    className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:shadow-xl transition-all"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={listing.images[0] || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'} 
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {listing.isOffer && (
                          <div className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[9px] font-black tracking-widest flex items-center shadow-lg uppercase">
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            SPECIAL DEAL
                          </div>
                        )}
                        {listing.isPromoted && (
                          <div className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-black flex items-center shadow-lg animate-pulse",
                            listing.promotionTier === 'elite' ? "bg-purple-600 text-white" :
                            listing.promotionTier === 'premium' ? "bg-primary text-white" : "bg-yellow-400 text-black"
                          )}>
                            <Zap className="w-3 h-3 mr-1 fill-current" /> 
                            {listing.promotionTier?.toUpperCase() || 'FEATURED'}
                          </div>
                        )}
                        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary">
                          {listing.type === 'service' ? t('nav.services').toUpperCase() : t('nav.marketplace').toUpperCase()}
                        </div>
                        {listing.type === 'product' && listing.stock !== undefined && (
                          <div className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold text-white",
                            listing.stock > 0 ? "bg-green-500/90" : "bg-red-500/90"
                          )}>
                            {listing.stock > 0 ? t('listings.in_stock') : t('listings.out_of_stock')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {listing.location.town}, {listing.location.county}
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <div className="mt-4">
                        {listing.originalPrice && listing.price && listing.originalPrice > listing.price && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-0.5 font-medium">
                            <span className="line-through">{formatPrice(listing.originalPrice)}</span>
                            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[9px] px-1 rounded-md">
                              -{Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)}%
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-extrabold text-primary">
                            {listing.price ? formatPrice(listing.price) : t('listings.contact_price')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {listings.length > 0 && hasMore && (
                <div className="pt-8 text-center">
                  <button 
                    onClick={() => fetchListings()}
                    disabled={loadingMore}
                    className="px-8 py-3 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center justify-center mx-auto"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('common.load_more')
                    )}
                  </button>
                </div>
              )}

              {listings.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-full py-20 text-center bg-white dark:bg-neutral-900 rounded-[3rem] border border-gray-100 dark:border-neutral-800 shadow-sm px-6"
                >
                  <div className="bg-primary/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-colors">
                    <Search className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{t('listings.no_listings')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-md mx-auto leading-relaxed">
                    {t('listings.no_listings_desc')}
                  </p>
                  
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => setSearchParams({})}
                      className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                      {t('listings.reset_filters')}
                    </button>
                    <Link 
                      to="/create-listing"
                      className="w-full sm:w-auto px-10 py-4 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
                    >
                      {t('listings.post_listing')}
                    </Link>
                  </div>

                  <div className="mt-16 pt-16 border-t border-gray-100 dark:border-neutral-800">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">{t('listings.popular_categories')}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {CATEGORIES.services.slice(0, 3).concat(CATEGORIES.marketplace.slice(0, 3)).map(cat => (
                        <button 
                          key={cat}
                          onClick={() => updateFilter('category', cat)}
                          className="px-6 py-2.5 bg-gray-50 dark:bg-neutral-800/50 text-gray-600 dark:text-gray-400 rounded-full text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all border border-gray-100 dark:border-neutral-800"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listings;
