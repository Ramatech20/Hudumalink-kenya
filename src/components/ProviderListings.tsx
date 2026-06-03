import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { MarketplaceCard } from './MarketplaceCard';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProviderListingsProps {
  authorId: string;
  currentListingId: string;
}

export function ProviderListings({ authorId, currentListingId }: ProviderListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authorId) return;

    const fetchProviderListings = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'listings'),
          where('authorId', '==', authorId),
          where('status', '==', 'active'),
          limit(6)
        );
        const querySnapshot = await getDocs(q);
        const fetchedListings: Listing[] = [];
        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as Listing;
          if (data.id !== currentListingId && data.status === 'active') {
            fetchedListings.push(data);
          }
        });
        setListings(fetchedListings);
      } catch (error) {
        console.error('Error fetching provider listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderListings();
  }, [authorId, currentListingId]);

  const handleCardClick = (id: string) => {
    navigate(`/listing/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // If the provider has no other active listings, do not show or show fallback text
  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 py-4 border-t border-slate-850 pt-10">
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-mono font-black tracking-widest uppercase text-slate-300">
          MORE OFFERS FROM THIS VENDOR
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
  );
}
