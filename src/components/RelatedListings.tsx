import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { MarketplaceCard } from './MarketplaceCard';
import { Sparkles, Compass, Flame, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RelatedListingsProps {
  category: string;
  currentListingId: string;
  county: string;
}

export function RelatedListings({ category, currentListingId, county }: RelatedListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [nearbyListings, setNearbyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        // Query 1: Category Matching
        const categoryQuery = query(
          collection(db, 'listings'),
          where('category', '==', category),
          where('status', '==', 'active'),
          limit(8)
        );
        const categorySnap = await getDocs(categoryQuery);
        const fetchedCategory: Listing[] = [];
        categorySnap.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Listing;
          if (data.id !== currentListingId && data.status === 'active') {
            fetchedCategory.push(data);
          }
        });

        // Query 2: County/Nearby Providers
        const nearbyQuery = query(
          collection(db, 'listings'),
          where('location.county', '==', county),
          where('status', '==', 'active'),
          limit(8)
        );
        const nearbySnap = await getDocs(nearbyQuery);
        const fetchedNearby: Listing[] = [];
        nearbySnap.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Listing;
          if (data.id !== currentListingId && data.status === 'active') {
            fetchedNearby.push(data);
          }
        });

        // Fallback: If no related found, query arbitrary listings as recommended
        if (fetchedCategory.length === 0) {
          const fallbackQuery = query(
            collection(db, 'listings'),
            where('status', '==', 'active'),
            limit(6)
          );
          const fallbackSnap = await getDocs(fallbackQuery);
          fallbackSnap.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as Listing;
            if (data.id !== currentListingId && data.status === 'active') {
              fetchedCategory.push(data);
            }
          });
        }

        setListings(fetchedCategory);
        setNearbyListings(fetchedNearby.length > 0 ? fetchedNearby : fetchedCategory.slice(0, 4));
      } catch (error) {
        console.error('Error fetching related listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [category, currentListingId, county]);

  const handleCardClick = (id: string) => {
    navigate(`/listing/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-6 py-6 animate-pulse">
        <div className="h-6 bg-slate-805 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-4">
      {/* Grid Row 1: Related / Similar items */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-mono font-black tracking-widest uppercase text-slate-300">
            SIMILAR ALTERNATIVE OFFERS
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {listings.slice(0, 4).map((item) => (
            <div 
              key={item.id} 
              className="cursor-pointer"
              onClick={() => handleCardClick(item.id)}
            >
              <MarketplaceCard
                id={item.id}
                title={item.title}
                price={item.price || 0}
                location={`${item.location.town}, ${item.location.county}`}
                imageUrl={item.images?.[0]}
                category={item.category}
                isOffer={item.isOffer}
                isPromoted={item.isPromoted}
                promotionTier={item.promotionTier}
                originalPrice={item.originalPrice}
                type={item.type}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Grid Row 2: Near Providers */}
      {nearbyListings.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-mono font-black tracking-widest uppercase text-slate-300">
              NEARBY VENDORS IN {county.toUpperCase()}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {nearbyListings.slice(0, 4).map((item) => (
              <div 
                key={item.id} 
                className="cursor-pointer"
                onClick={() => handleCardClick(item.id)}
              >
                <MarketplaceCard
                  id={item.id}
                  title={item.title}
                  price={item.price || 0}
                  location={`${item.location.town}, ${item.location.county}`}
                  imageUrl={item.images?.[0]}
                  category={item.category}
                  isOffer={item.isOffer}
                  isPromoted={item.isPromoted}
                  promotionTier={item.promotionTier}
                  originalPrice={item.originalPrice}
                  type={item.type}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
