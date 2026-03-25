import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { Search, MapPin, Filter, SlidersHorizontal, X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { KENYAN_COUNTIES, CATEGORIES } from '../constants';

const LISTINGS_PER_PAGE = 12;

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const qParam = searchParams.get('q') || '';
  const countyParam = searchParams.get('county') || '';
  const categoryParam = searchParams.get('category') || '';
  const typeParam = searchParams.get('type') || '';

  useEffect(() => {
    fetchListings(true);
  }, [qParam, countyParam, categoryParam, typeParam, sortBy]);

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

      // Sorting
      if (sortBy === 'newest') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else if (sortBy === 'price_low') {
        q = query(q, orderBy('price', 'asc'));
      } else if (sortBy === 'price_high') {
        q = query(q, orderBy('price', 'desc'));
      }

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const newDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      // Client-side search for keyword (Firestore limitation)
      // Note: In a real production app with 10k+ listings, we would use Algolia here.
      let filteredDocs = newDocs;
      if (qParam) {
        filteredDocs = newDocs.filter(doc => 
          doc.title.toLowerCase().includes(qParam.toLowerCase()) || 
          doc.description.toLowerCase().includes(qParam.toLowerCase())
        );
      }

      if (isInitial) {
        setListings(filteredDocs);
      } else {
        setListings(prev => [...prev, ...filteredDocs]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === LISTINGS_PER_PAGE);
    } catch (error) {
      console.error(error);
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 dark:text-gray-400"><X className="w-6 h-6" /></button>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Location</h3>
            <select 
              className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors"
              value={countyParam}
              onChange={(e) => updateFilter('county', e.target.value)}
            >
              <option value="" className="dark:bg-neutral-900">All Counties</option>
              {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Category</h3>
            <select 
              className="w-full p-2 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 transition-colors"
              value={categoryParam}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              <option value="" className="dark:bg-neutral-900">All Categories</option>
              <optgroup label="Services" className="dark:bg-neutral-900">
                {CATEGORIES.services.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </optgroup>
              <optgroup label="Marketplace" className="dark:bg-neutral-900">
                {CATEGORIES.marketplace.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </optgroup>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Type</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input 
                  type="radio" 
                  name="type" 
                  checked={!typeParam} 
                  onChange={() => updateFilter('type', '')}
                  className="text-primary focus:ring-primary dark:bg-neutral-800 dark:border-neutral-700"
                />
                <span className="text-sm">All</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input 
                  type="radio" 
                  name="type" 
                  checked={typeParam === 'product'} 
                  onChange={() => updateFilter('type', 'product')}
                  className="text-primary focus:ring-primary dark:bg-neutral-800 dark:border-neutral-700"
                />
                <span className="text-sm">Products</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input 
                  type="radio" 
                  name="type" 
                  checked={typeParam === 'service'} 
                  onChange={() => updateFilter('type', 'service')}
                  className="text-primary focus:ring-primary dark:bg-neutral-800 dark:border-neutral-700"
                />
                <span className="text-sm">Services</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow space-y-6">
          {/* Search Bar & Mobile Filter Toggle */}
          <div className="flex gap-2">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search listings..." 
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
              Showing <span className="font-bold text-gray-900 dark:text-gray-100">{listings.length}</span> results
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-bold bg-transparent border-none outline-none text-primary cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-neutral-800 animate-pulse h-80 rounded-2xl"></div>
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
                        <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary">
                          {listing.type === 'service' ? 'SERVICE' : 'PRODUCT'}
                        </div>
                        {listing.type === 'product' && listing.stock !== undefined && (
                          <div className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold text-white",
                            listing.stock > 0 ? "bg-green-500/90" : "bg-red-500/90"
                          )}>
                            {listing.stock > 0 ? `${listing.stock} IN STOCK` : 'OUT OF STOCK'}
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
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-lg font-extrabold text-primary">
                          {listing.price ? formatPrice(listing.price) : 'Contact for Price'}
                        </span>
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
                        Loading...
                      </>
                    ) : (
                      'Load More Listings'
                    )}
                  </button>
                </div>
              )}

              {listings.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="bg-gray-50 dark:bg-neutral-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                    <Search className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">No results found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or search query.</p>
                  <button 
                    onClick={() => setSearchParams({})}
                    className="mt-6 text-primary font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Listings;
