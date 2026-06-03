import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { useAuth } from '../AuthContext';
import { Listing } from '../types';
import { PROMOTION_TIERS } from '../constants';
import { formatPrice, cn } from '../lib/utils';
import { handleGeneralError, handleApiError } from '../lib/error-handler';
import { initiatePromotionPayment, activatePromotion, PROMOTION_PLANS } from '../services/promotionService';
import { Zap, ArrowLeft, Check, Loader2, ShieldCheck, Phone, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const PromoteListing = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(PROMOTION_PLANS[0].id);
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Tier, 2: Payment

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `listings/${id}`);
          throw error;
        }
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Listing;
          if (data.authorId !== user?.uid) {
            toast.error('You do not have permission to promote this listing');
            navigate('/seller-dashboard');
            return;
          }
          setListing({ id: docSnap.id, ...data });
        } else {
          toast.error('Listing not found');
          navigate('/seller-dashboard');
        }
      } catch (error: any) {
        if (!error.operationType) {
          handleGeneralError(error, 'Failed to fetch listing');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, user, navigate]);

  const handlePromote = async () => {
    if (!listing || !user) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to promote listings.');
      return;
    }
    
    const plan = PROMOTION_PLANS.find(p => p.id === selectedTier);
    if (!plan) return;

    if (!phoneNumber.match(/^(254|0)(7|1)\d{8}$/)) {
      toast.error('Please enter a valid M-Pesa phone number');
      return;
    }

    // Format phone to 254...
    let formattedPhone = phoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = '254' + formattedPhone;
    }

    setIsProcessing(true);
    try {
      const transactionId = await initiatePromotionPayment({
        phoneNumber: formattedPhone,
        planId: plan.id,
        listingId: listing.id,
        userId: user.uid
      });

      if (transactionId) {
        toast.success('STK Push sent! Please enter your M-Pesa PIN to complete the promotion.');
        
        // Process payment success after 10 seconds
        setTimeout(async () => {
          const success = await activatePromotion(transactionId);
          if (success) {
            navigate('/seller-dashboard');
          }
        }, 10000);
      }
    } catch (error) {
      handleGeneralError(error, 'Promotion payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) return null;

  const currentTier = PROMOTION_PLANS.find(t => t.id === selectedTier)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12 px-4 transition-colors">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Promote Your Listing</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Get more views and sales by boosting your listing to the top of search results.</p>

              <div className="space-y-4">
                {PROMOTION_PLANS.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={cn(
                      "w-full text-left p-6 rounded-2xl border-2 transition-all flex items-start justify-between group",
                      selectedTier === tier.id 
                        ? "border-primary bg-primary/5 ring-4 ring-primary/10" 
                        : "border-gray-100 dark:border-neutral-800 hover:border-primary/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tier.name}</h3>
                        {tier.id === 'premium' && (
                          <span className="ml-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Most Popular</span>
                        )}
                      </div>
                      <ul className="space-y-2 mb-4">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                            <Check className="w-3 h-3 mr-2 text-green-500" /> {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-primary">{formatPrice(tier.price)}</div>
                      <div className="text-xs text-gray-500">{tier.durationDays} days</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTier && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-primary" /> Payment Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">M-Pesa Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="tel"
                        placeholder="0712345678"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Enter the number that will receive the M-Pesa STK push.</p>
                  </div>

                  <button
                    onClick={handlePromote}
                    disabled={isProcessing}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        Pay {formatPrice(currentTier.price)} & Promote
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors overflow-hidden">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Listing Preview</h3>
                <div className="relative rounded-2xl overflow-hidden aspect-square mb-4">
                  <img src={listing.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold flex items-center shadow-sm">
                    <Zap className="w-3 h-3 mr-1 text-yellow-500 fill-current" /> PROMOTED
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{listing.title}</h4>
                <p className="text-primary font-bold">{formatPrice(listing.price)}</p>
              </div>

              <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">Secure Payment</h4>
                    <p className="text-[10px] text-gray-500">Encrypted M-Pesa transaction</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Your promotion will be activated immediately after the payment is confirmed. Promoted listings appear at the top of search results and category pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoteListing;
