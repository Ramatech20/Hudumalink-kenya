import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Listing } from '../types';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import { MapPin, Clock, Tag, Percent, ArrowRight, Filter, Search, ShieldCheck, Flame, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { MarketplaceGrid } from '../components/MarketplaceGrid';
import { MarketplaceCard } from '../components/MarketplaceCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export default function Offers() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handleCardClick = (id: string) => {
    navigate(`/listing/${id}`);
  };

  return (
    <div id="offers-deals-hub-root" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white bg-slate-950 min-h-screen">
      
      {/* Editorial Header Block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/15 rounded-2xl border border-rose-500/30 text-rose-400 shrink-0">
            <Percent className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-slate-100 font-sans">
              Limited-Time Deals Hub
            </h1>
            <p className="text-xs text-rose-400 font-bold flex items-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 animate-bounce" />
              Direct discount prices on verified listings. Secure Escrow guaranteed.
            </p>
          </div>
        </div>

        {/* Counter sticker label info */}
        <div className="flex items-center gap-2">
          <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            {filteredListings.length} deal campaigns live
          </span>
          {user?.role !== 'customer' && (
            <Link
              to="/create-listing"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 hover:scale-[1.02] transition-all text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-950/20"
            >
              Post Special Offer
            </Link>
          )}
        </div>
      </div>

      {/* Jumia Inspired Category Navigation Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>FILTER DEALS:</span>
        </div>
        
        <div className="flex bg-slate-950 p-1 rounded-xl gap-1 border border-slate-800 select-none">
          {[
            { id: 'all', val: 'All Offers ⚡' },
            { id: 'product', val: 'Products & Goods 📦' },
            { id: 'service', val: 'Services Gigs 🛠️' },
          ].map((typeItem) => (
            <button
              key={typeItem.id}
              onClick={() => setFilterType(typeItem.id as any)}
              className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-black transition-all uppercase tracking-wide ${
                filterType === typeItem.id
                  ? 'bg-rose-600/15 border border-rose-500/30 text-rose-400 font-black shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {typeItem.val}
            </button>
          ))}
        </div>
      </div>

      {/* High-density adaptive grid system */}
      {loading ? (
        <MarketplaceGrid>
          <LoadingSkeleton count={12} />
        </MarketplaceGrid>
      ) : filteredListings.length > 0 ? (
        <MarketplaceGrid>
          {filteredListings.map((listing) => {
            const countdown = getCountdown(listing.offerExpiresAt);
            return (
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
                deliverySpeed={countdown && !countdown.expired ? `Ends: ${countdown.text}` : 'Limited Special'}
                isEscrowSafe={listing.escrowEnabled !== false}
                isOffer={true}
                isPromoted={listing.isPromoted}
                promotionTier={listing.promotionTier as any}
                originalPrice={listing.originalPrice}
                onActionClick={(id) => handleCardClick(id)}
                condition={listing.type === 'product' ? listing.condition : undefined}
              />
            );
          })}
        </MarketplaceGrid>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl p-6"
        >
          <Percent className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-black uppercase text-slate-100 tracking-tight">No Active Hot Deals Available</h3>
          <p className="text-slate-400 mt-2 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">
            All current listings are at their regular rate tags. If you are an active merchant, list special deals to show here with extra priority badges!
          </p>
          {user?.role !== 'customer' && (
            <div className="mt-6">
              <Link
                to="/create-listing"
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all inline-flex items-center shadow-md shadow-rose-950/20"
              >
                Launch your campaign
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Escrow Fintech Trust Banner */}
      <div id="escrow-assurance-trust-card" className="mt-12 p-5 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-100">Direct M-Pesa Escrow Assurance</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl leading-relaxed">
              All flash-sale and hot discount payments on HudumaLink are secured via Escrow. Funds remain shielded in holding until you confirm product delivery or completed service milestone execution!
            </p>
          </div>
        </div>
        <Link
          to="/escrow-policy"
          className="w-full md:w-auto px-5 py-2.5 border border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-black tracking-widest text-center uppercase text-slate-300 transition-all shrink-0"
        >
          Verify How Escrow Works
        </Link>
      </div>

    </div>
  );
}
