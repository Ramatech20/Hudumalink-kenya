import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, ShoppingBag, ArrowRight, Star, ShieldCheck, Zap, CheckCircle2, Tag } from 'lucide-react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { Listing } from '../types';
import { formatPrice, cn, getDistance } from '../lib/utils';
import { ListingCard } from '../components/ListingCard';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, KENYAN_COUNTIES } from '../constants';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('isPromoted', 'desc'),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setFeaturedListings(docs);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'listings');
      }
    };
    fetchFeatured();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLoadingNearby(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        fetchNearby(loc);
      },
      () => setLoadingNearby(false),
      { timeout: 10000 }
    );
  };

  const fetchNearby = async (loc: { lat: number, lng: number }) => {
    try {
      // Since Firestore doesn't support geo-queries easily without third-party libs,
      // we fetch recent active listings and sort them client-side for the MVP.
      const q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      // Filter for those with coordinates and sort by distance
      const withCoords = docs.filter(d => d.location.lat && d.location.lng);
      const sorted = withCoords.sort((a, b) => {
        const distA = getDistance(loc.lat, loc.lng, a.location.lat!, a.location.lng!);
        const distB = getDistance(loc.lat, loc.lng, b.location.lat!, b.location.lng!);
        return distA - distB;
      });

      setNearbyListings(sorted.slice(0, 4));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/listings?q=${searchQuery}&county=${selectedCounty}`);
  };

  return (
    <div className="space-y-16 pb-20">
      <Helmet>
        <title>HudumaLink Kenya | Trustworthy Local Marketplace</title>
        <meta name="description" content="The biggest digital marketplace in Kenya connecting skilled service providers, local sellers, and customers across all 47 counties." />
        <meta property="og:title" content="HudumaLink Kenya | Empowering the Digital Economy" />
        <meta property="og:description" content="Connect with trusted fundis and local sellers in Kenya. Secure payments via M-Pesa escrow." />
        <meta property="og:image" content="https://picsum.photos/seed/hudumalink-og/1200/630" />
      </Helmet>

      {/* Profile Completion Banner */}
      {user && (!user.dob || !user.gender || !user.occupation) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-[2.5rem] border border-secondary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-secondary/5"
          >
            <div className="flex items-center gap-5 text-center md:text-left">
              <div className="p-4 bg-secondary text-white rounded-3xl shadow-lg shadow-secondary/30">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('profile.complete_banner')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                  {t('profile.complete_desc')}
                </p>
              </div>
            </div>
            <Link 
              to="/profile" 
              className="w-full md:w-auto px-10 py-4 bg-secondary text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-secondary/20 text-center"
            >
              {t('profile.complete_btn')}
            </Link>
          </motion.div>
        </section>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-neutral-950">
        {/* Background Image Grid */}
        <div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 opacity-50">
          <div className="relative h-full overflow-hidden border-r border-white/5">
            <img 
              src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800" 
              alt="Kenyan Technician" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
          </div>
          <div className="relative h-full overflow-hidden border-r border-white/5">
            <img 
              src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800" 
              alt="Kenyan Seller" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
          </div>
          <div className="relative h-full overflow-hidden border-r border-white/5">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800" 
              alt="Kenyan Buyer" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
          </div>
          <div className="relative h-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800" 
              alt="Kenyan Freelancer" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60"></div>
          </div>
        </div>

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-neutral-950/40 z-5"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-sm font-bold mb-8"
          >
            <Zap className="w-4 h-4 text-secondary" />
            <span>{t('hero.tagline')}</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]"
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSearch}
            className="bg-white dark:bg-neutral-900 p-3 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-3 transition-all max-w-4xl mx-auto border border-white/10"
          >
            <div className="flex-grow flex items-center px-4 w-full">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder={t('hero.search_placeholder')} 
                className="w-full py-3 text-gray-900 dark:text-gray-100 bg-transparent focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center px-4 border-l border-gray-200 dark:border-neutral-800 w-full md:w-auto">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <select 
                className="bg-transparent py-3 text-gray-900 dark:text-gray-100 focus:outline-none w-full"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                <option value="" className="dark:bg-neutral-900">{t('hero.all_counties')}</option>
                {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all">
              {t('hero.search_btn')}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <button 
              onClick={handleGetLocation}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full text-sm font-bold hover:bg-white/20 transition-all"
            >
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{loadingNearby ? t('hero.locating') : t('hero.nearby_btn')}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Nearby Listings */}
      {nearbyListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('section.nearby')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t('section.nearby_desc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyListings.map((listing) => (
              <Link 
                key={listing.id} 
                to={`/listing/${listing.id}`}
                className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:shadow-xl transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center shadow-lg">
                    <MapPin className="w-3 h-3 mr-1" />
                    {userLocation && listing.location.lat && listing.location.lng ? 
                      t('home.km_away').replace('{distance}', getDistance(userLocation.lat, userLocation.lng, listing.location.lat, listing.location.lng).toFixed(1)) : 
                      t('section.nearby')
                    }
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    {listing.location.estate ? `${listing.location.estate}, ` : ''}{listing.location.town}, {listing.location.county}
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
        </section>
      )}

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('section.categories')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('section.categories_desc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...CATEGORIES.services.slice(0, 5), ...CATEGORIES.marketplace.slice(0, 5)].map((cat, i) => (
            <Link 
              key={cat}
              to={`/listings?category=${cat}`}
              className="group bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all text-center"
            >
              <div className="w-12 h-12 bg-gray-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {i < 5 ? <Briefcase className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{cat}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('home.how_it_works')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('home.how_it_works_desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: t('home.step1_title'),
              desc: t('home.step1_desc'),
              icon: <Search className="w-8 h-8 text-primary" />
            },
            {
              step: "02",
              title: t('home.step2_title'),
              desc: t('home.step2_desc'),
              icon: <ShieldCheck className="w-8 h-8 text-secondary" />
            },
            {
              step: "03",
              title: t('home.step3_title'),
              desc: t('home.step3_desc'),
              icon: <CheckCircle2 className="w-8 h-8 text-green-500" />
            }
          ].map((item, i) => (
            <div key={i} className="relative p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all text-center group">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                {item.step}
              </div>
              <div className="mb-6 flex justify-center">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white dark:bg-neutral-950 py-12 border-y border-gray-100 dark:border-neutral-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('home.verified_providers')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.verified_desc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('home.fast_connections')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.fast_desc')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full text-yellow-600 dark:text-yellow-400">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('home.top_rated')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('home.top_rated_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('section.featured')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('section.featured_desc')}</p>
          </div>
          <Link to="/listings" className="text-primary font-bold flex items-center hover:underline">
            {t('home.view_all')} <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
          {featuredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              title={listing.title}
              price={listing.price}
              location={listing.location.estate ? `${listing.location.estate}, ${listing.location.town}` : `${listing.location.town}, ${listing.location.county}`}
              imageUrl={listing.images[0]}
              isOffer={listing.isOffer}
              isPromoted={listing.isPromoted}
              promotionTier={listing.promotionTier}
              type={listing.type === 'service' ? t('listings.services') : t('listings.products')}
              stock={listing.stock}
              originalPrice={listing.originalPrice}
            />
          ))}
          {featuredListings.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400">
              {t('home.no_listings')}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {user?.role !== 'customer' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="kenyan-gradient rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('home.ready_to_grow')}</h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              {t('home.ready_to_grow_desc')}
            </p>
            <Link 
              to="/create-listing" 
              className="inline-block bg-white text-primary px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all"
            >
              {t('home.start_selling')}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
