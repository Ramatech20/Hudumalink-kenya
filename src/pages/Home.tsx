import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, ShoppingBag, ArrowRight, Star, ShieldCheck, Zap } from 'lucide-react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { CATEGORIES, KENYAN_COUNTIES } from '../constants';

const Home = () => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
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
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/listings?q=${searchQuery}&county=${selectedCounty}`);
  };

  return (
    <div className="space-y-16 pb-20">
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
            <span>Kenya's #1 Trusted Marketplace</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]"
          >
            Find Anything, Hire Anyone in <span className="text-primary">Kenya</span> 🇰🇪
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            Connecting skilled fundis, local sellers, and digital freelancers with customers across all 47 counties.
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
                placeholder="What are you looking for?" 
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
                <option value="" className="dark:bg-neutral-900">All Counties</option>
                {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all">
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Browse Categories</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Explore services and products by category</p>
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

      {/* Trust Badges */}
      <section className="bg-white dark:bg-neutral-950 py-12 border-y border-gray-100 dark:border-neutral-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Verified Providers</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">We verify identities for your safety.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Fast Connections</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connect with sellers in minutes.</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full text-yellow-600 dark:text-yellow-400">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Top Rated</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Only the best services for you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Featured Listings</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Handpicked quality services and products</p>
          </div>
          <Link to="/listings" className="text-primary font-bold flex items-center hover:underline">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredListings.map((listing) => (
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
                  {listing.isPromoted && (
                    <div className="bg-yellow-400 text-black px-2 py-1 rounded-lg text-[10px] font-black flex items-center shadow-lg animate-pulse">
                      <Zap className="w-3 h-3 mr-1 fill-current" /> FEATURED
                    </div>
                  )}
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
          {featuredListings.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400">
              No listings found. Be the first to post!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="kenyan-gradient rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to grow your business?</h2>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of Kenyan entrepreneurs who use HudumaLink to reach more customers and grow their sales.
          </p>
          <Link to="/create-listing" className="inline-block bg-white text-primary px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all">
            Start Selling Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
