import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Listing } from '../types';
import { useLanguage } from '../LanguageContext';
import { MapPin, Clock, Tag, Percent, ArrowRight, Filter, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Offers() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Interval to update countdowns in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'listings'),
          where('isOffer', '==', true),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(docs);
      } catch (error: any) {
        console.error("Error fetching offers: ", error);
        handleFirestoreError(error, OperationType.LIST, 'listings');
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Helper to parse and calculate countdowns
  const getCountdown = (expiresAtStr?: string) => {
    if (!expiresAtStr) return null;
    const expiry = new Date(expiresAtStr).getTime();
    const diff = expiry - currentTime;

    if (diff <= 0) {
      return { expired: true, text: 'Expired' };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { expired: false, text: `${days}d left` };
    }

    return {
      expired: false,
      text: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    };
  };

  const filteredListings = listings.filter(item => {
    // Check if offer expired already
    const countdown = getCountdown(item.offerExpiresAt);
    if (countdown && countdown.expired) return false;

    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors">
      
      {/* Editorial Hero Block */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center space-x-2 bg-rose-500/10 dark:bg-rose-500/20 px-4 py-2 rounded-full text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-6 border border-rose-500/20"
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Limited-Time Price Cuts & Special Deals</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight"
        >
          Huduma<span className="text-rose-500">Link</span> Deals Hub
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400 mt-4 text-lg font-medium"
        >
          Discover direct discount prices on products and physical services offered by local verified Kenyan businesses. Direct secure Escrow-protected payments!
        </motion.p>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-100 dark:border-neutral-800 gap-4 mb-10">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Filter By Type:</span>
        </div>
        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-neutral-900 text-rose-500 shadow-md shadow-rose-500/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            All Offers
          </button>
          <button
            onClick={() => setFilterType('product')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'product'
                ? 'bg-white dark:bg-neutral-900 text-rose-500 shadow-md shadow-rose-500/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Goods / Products
          </button>
          <button
            onClick={() => setFilterType('service')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'service'
                ? 'bg-white dark:bg-neutral-900 text-rose-500 shadow-md shadow-rose-500/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Local Services
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-neutral-850 h-80 rounded-2xl border border-gray-200 dark:border-neutral-800"></div>
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredListings.map((listing) => {
            const countdown = getCountdown(listing.offerExpiresAt);
            const discountPercent = listing.originalPrice && listing.price
              ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
              : null;

            return (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="group relative bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:shadow-2xl transition-all duration-300 flex flex-col hover:-translate-y-1"
              >
                {/* Visual Banner on top image */}
                <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-neutral-850">
                  <img
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Left Pill - Deal Status */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="bg-rose-600 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full shadow-lg uppercase flex items-center">
                      <Percent className="w-3 h-3 mr-1" />
                      SPECIAL DEAL
                    </span>
                    {listing.offerText && (
                      <span className="bg-amber-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow">
                        {listing.offerText.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Right Pill - Live Expiry Countdown */}
                  {countdown && !countdown.expired && (
                    <div className="absolute top-3 right-3 bg-neutral-950/90 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-black tracking-wider flex items-center space-x-1 border border-white/10 shadow-lg">
                      <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>ENDS IN: {countdown.text}</span>
                    </div>
                  )}

                  {/* Category overlay */}
                  <div className="absolute bottom-3 left-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-2.5 py-1 rounded-lg text-[9px] font-bold text-gray-700 dark:text-gray-300">
                    {listing.type === 'service' ? t('nav.services').toUpperCase() : t('nav.marketplace').toUpperCase()}
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    {/* Location strip */}
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-3 font-semibold">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-rose-500" />
                      {listing.location.town}, {listing.location.county}
                    </div>

                    <h3 className="font-extrabold text-gray-900 dark:text-white text-md tracking-tight group-hover:text-rose-500 transition-colors line-clamp-1 mb-2">
                      {listing.title}
                    </h3>
                    
                    <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 leading-relaxed mb-4">
                      {listing.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                    <div className="flex flex-col">
                      {/* Original Was Price & Discount Percentage */}
                      {listing.originalPrice && (
                        <div className="flex items-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500 line-through">
                          <span>{formatPrice(listing.originalPrice)}</span>
                          {discountPercent && (
                            <span className="text-[10px] text-rose-600 bg-rose-500/10 font-bold px-1.5 py-0.2 rounded-md">
                              -{discountPercent}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Active Offer Price */}
                      <span className="text-xl font-black text-rose-600 tracking-tight mt-0.5">
                        {listing.price ? formatPrice(listing.price) : t('listings.contact_price')}
                      </span>
                    </div>

                    <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 text-center bg-gray-50 dark:bg-neutral-900 border border-gray-200/50 dark:border-neutral-800 rounded-3xl p-8"
        >
          <Percent className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">No active special deals right now</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            All active listings are currently regular-priced. If you are a seller, list your product or service as a special discount to be featured here first!
          </p>
          <div className="mt-8">
            <Link
              to="/create-listing"
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-rose-500/20 inline-flex items-center"
            >
              Post a Special Offer
            </Link>
          </div>
        </motion.div>
      )}

      {/* Escrow assurance banner */}
      <div className="mt-16 p-6 bg-gradient-to-r from-neutral-900 to-neutral-850 border border-neutral-800 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 dark:from-neutral-950 dark:to-neutral-900">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-extrabold text-base">Direct M-Pesa Escrow Safeguarding</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              All special flash-sale payments are safely processed through our Escrow service. We hold the funds until the product delivery is verified by you!
            </p>
          </div>
        </div>
        <Link
          to="/escrow-policy"
          className="w-full md:w-auto px-6 py-3 border border-white/10 hover:bg-white/5 rounded-2xl text-xs font-black transition-all text-center uppercase tracking-widest"
        >
          How Escrow Works
        </Link>
      </div>

    </div>
  );
}
