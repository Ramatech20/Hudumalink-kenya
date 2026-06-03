import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, updateDoc, increment, orderBy, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { uploadWithFallback } from '../lib/upload-helper';
import { handleApiError, handleNetworkError, handleGeneralError } from '../lib/error-handler';
import { Listing, User, Review, Transaction, Milestone } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { sendNotification } from '../lib/notifications';
import { getDeliveryQuotes, DeliveryQuote } from '../services/deliveryService';
import { initiateEscrowPayment, processPaymentSuccess, releaseEscrowFunds } from '../services/paymentService';
import { 
  MapPin, Phone, MessageCircle, ShieldCheck, Share2, Heart, ArrowLeft, Star, Zap, Send, Flag, 
  AlertTriangle, X as CloseIcon, Loader2, Shield, CheckCircle2, Bell, Box, Layers, Settings, 
  Truck, CreditCard, ChevronRight, Info, ShoppingCart, Briefcase, DollarSign, Trash2, Upload, Tag, Gift, Award 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useCart } from '../CartContext';

// Import newly designed sub-components
import { ListingGallery } from '../components/ListingGallery';
import { StickyPurchasePanel } from '../components/StickyPurchasePanel';
import { ProviderTrustCard } from '../components/ProviderTrustCard';
import { EscrowTimeline } from '../components/EscrowTimeline';
import { ReviewsSection } from '../components/ReviewsSection';
import { RelatedListings } from '../components/RelatedListings';
import { ProviderListings } from '../components/ProviderListings';

const ListingDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState<File | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [hasCompletedTransaction, setHasCompletedTransaction] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [requestingService, setRequestingService] = useState(false);
  const [deliveryQuotes, setDeliveryQuotes] = useState<DeliveryQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<DeliveryQuote | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [useMilestones, setUseMilestones] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [showTipModal, setShowTipModal] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    const key = user ? `hudumalink_favorites_${user.uid}` : 'hudumalink_favorites_guest';
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    setIsFavorited(favorites.includes(id));
  }, [id, user]);

  const toggleFavorite = () => {
    if (!id) return;
    const key = user ? `hudumalink_favorites_${user.uid}` : 'hudumalink_favorites_guest';
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    
    let updatedFavorites: string[] = [];
    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter((favId: string) => favId !== id);
      setIsFavorited(false);
      toast.success('Removed from favorites');
    } else {
      updatedFavorites = [...favorites, id];
      setIsFavorited(true);
      toast.success('Saved to your favorites!');
    }
    localStorage.setItem(key, JSON.stringify(updatedFavorites));
  };

  // Management Modal states
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTitle, setManageTitle] = useState('');
  const [manageDescription, setManageDescription] = useState('');
  const [managePrice, setManagePrice] = useState('');
  const [manageOriginalPrice, setManageOriginalPrice] = useState('');
  const [manageOfferText, setManageOfferText] = useState('');
  const [manageGiftText, setManageGiftText] = useState('');
  const [manageImages, setManageImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [manageStock, setManageStock] = useState('');
  const [manageStatus, setManageStatus] = useState<'active' | 'pending' | 'sold' | 'removed'>('active');
  const [manageIsOffer, setManageIsOffer] = useState(false);
  const [manageOfferDuration, setManageOfferDuration] = useState('24');
  const [updatingManage, setUpdatingManage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || !id) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to report a listing.');
      return;
    }

    setSubmittingReport(true);
    try {
      const reportData = {
        listingId: id,
        reporterId: user.uid,
        reason: reportReason,
        details: reportDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reports'), reportData);
      
      await updateDoc(doc(db, 'listings', id), {
        reportsCount: increment(1)
      });

      toast.success('Listing reported. Our team will investigate.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to raise a dispute.');
      return;
    }

    setSubmittingDispute(true);
    try {
      let evidenceUrl = '';
      if (disputeEvidence) {
        evidenceUrl = await uploadWithFallback(`disputes/${transaction.id}/${Date.now()}_${disputeEvidence.name}`, disputeEvidence);
      }

      const disputeData = {
        transactionId: transaction.id,
        raisedById: user.uid,
        reason: disputeReason,
        details: disputeDetails,
        evidenceUrls: evidenceUrl ? [evidenceUrl] : [],
        status: 'open',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'disputes'), disputeData);
      
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'disputed',
        updatedAt: new Date().toISOString()
      });

      // Notify Seller immediately
      if (transaction.sellerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: transaction.sellerId,
          title: '⚠️ Dispute Raised on Order',
          message: `The buyer has raised a dispute on order #${transaction.id}. The escrow balance is frozen. Standard email alerts sent to both parties.`,
          type: 'warning',
          read: false,
          link: `/profile`,
          createdAt: new Date().toISOString()
        });

        // Simulating SMTP log for dispute creation email
        console.log(`[SMTP SIMULATOR] Email sent to Seller (${transaction.sellerId}) & Buyer (${user.uid}) about active dispute initiation for transaction #${transaction.id}.`);
      }

      toast.success('Dispute raised. The dispute is under review; you will be contacted for more details or in case of a verdict.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeDetails('');
      setDisputeEvidence(null);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'disputes');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction || !author || !id) return;
    setSubmittingCancel(true);

    try {
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'cancelled',
        cancellationReason: cancelReason,
        cancelledBy: user.uid,
        updatedAt: new Date().toISOString()
      });

      const newCount = (author.cancellationCount || 0) + 1;
      let updateData: any = { cancellationCount: newCount };

      if (newCount >= 5) {
        updateData.isFlagged = true;
        updateData.flagReason = 'Excessive cancellations (5 or more)';
      }

      await updateDoc(doc(db, 'users', listing?.authorId || ''), updateData);

      await addDoc(collection(db, 'notifications'), {
        userId: listing?.authorId,
        title: 'Order Cancelled',
        message: `An order for "${listing?.title}" was cancelled. Reason: ${cancelReason}`,
        type: 'warning',
        read: false,
        createdAt: new Date().toISOString()
      });

      if (newCount === 3) {
        await addDoc(collection(db, 'notifications'), {
          userId: listing?.authorId,
          title: 'Account Warning',
          message: 'You have reached 3 cancellations. Further cancellations may lead to account flagging.',
          type: 'error',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      if (newCount >= 5) {
        await addDoc(collection(db, 'notifications'), {
          userId: listing?.authorId,
          title: 'Account Flagged',
          message: 'Your account has been flagged due to excessive cancellations. You can appeal this decision.',
          type: 'error',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Order cancelled successfully.');
      setShowCancelModal(false);
      setCancelReason('');
      
      const txQuery = query(
        collection(db, 'transactions'), 
        where('listingId', '==', id),
        where('buyerId', '==', user.uid)
      );
      const txSnap = await getDocs(txQuery);
      if (!txSnap.empty) {
        setTransaction({ id: txSnap.docs[0].id, ...txSnap.docs[0].data() } as Transaction);
      }
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transaction?.id}`);
    } finally {
      setSubmittingCancel(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // 1. One-time view count increment on page mount
    updateDoc(doc(db, 'listings', id), {
      viewCount: increment(1)
    }).catch(err => console.warn('Failed to increment view count:', err));

    // 2. Setup real-time snapshot listener on the listing
    const unsubscribeListing = onSnapshot(doc(db, 'listings', id), async (listingDoc) => {
      try {
        if (listingDoc.exists()) {
          const listingData = { id: listingDoc.id, ...listingDoc.data() } as Listing;
          setListing(listingData);
          setManageTitle(listingData.title || '');
          setManageDescription(listingData.description || '');
          setManagePrice(listingData.price !== undefined && listingData.price !== null ? listingData.price.toString() : '');
          setManageOriginalPrice(listingData.originalPrice !== undefined && listingData.originalPrice !== null ? listingData.originalPrice.toString() : '');
          setManageOfferText(listingData.offerText || '');
          setManageGiftText(listingData.giftText || '');
          setManageImages(listingData.images || []);
          setNewImageFiles([]);
          setManageStock(listingData.stock !== undefined && listingData.stock !== null ? listingData.stock.toString() : '0');
          setManageStatus(listingData.status || 'active');
          setManageIsOffer(listingData.isOffer || false);
          setManageOfferDuration('24');
          
          const authorDoc = await getDoc(doc(db, 'users_public', listingData.authorId));
          if (authorDoc.exists()) {
            setAuthor(authorDoc.data() as User);
          }

          if (user && user.uid) {
            const txQuery = query(
              collection(db, 'transactions'), 
              where('listingId', '==', id),
              where('buyerId', '==', user.uid)
            );
            try {
              const txSnap = await getDocs(txQuery);
              if (!txSnap.empty) {
                const txData = { id: txSnap.docs[0].id, ...txSnap.docs[0].data() } as Transaction;
                setTransaction(txData);
                if (txData.status === 'completed') {
                  setHasCompletedTransaction(true);
                }
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.LIST, 'transactions');
            }
          }

          if (listingData.authorId) {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('targetId', '==', listingData.authorId),
              orderBy('createdAt', 'desc'),
              limit(10)
            );
            try {
              const reviewsSnapshot = await getDocs(reviewsQuery);
              setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
            } catch (error) {
              handleFirestoreError(error, OperationType.LIST, 'reviews');
            }
          }
        } else {
          toast.error('Listing not found');
          navigate('/listings');
        }
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `listings/${id}`);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to listing:', error);
      setLoading(false);
    });

    return () => unsubscribeListing();
  }, [id, navigate, user]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if ((urlParams.get('edit') === 'true' || urlParams.get('manage') === 'true') && listing && user && user.uid === listing.authorId) {
      setShowManageModal(true);
      setShowDeleteConfirm(false);
    }
  }, [listing, user]);

  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setUpdatingManage(true);
    try {
      let finalImages = [...manageImages];
      if (newImageFiles.length > 0) {
        toast.info('Uploading new images...');
        const uploadPromises = newImageFiles.map(async (file) => {
          return uploadWithFallback(`listings/${listing.authorId}/${Date.now()}-${file.name}`, file);
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      if (finalImages.length === 0) {
        toast.error('Listing must have at least one image!');
        setUpdatingManage(false);
        return;
      }

      const updatedPrice = managePrice ? parseFloat(managePrice) : undefined;
      const updatedOriginalPrice = manageOriginalPrice ? parseFloat(manageOriginalPrice) : undefined;
      const updatedStock = listing?.type === 'product' && manageStock ? parseInt(manageStock, 10) : undefined;

      const updateData: any = {
        title: manageTitle,
        description: manageDescription,
        price: updatedPrice !== undefined ? updatedPrice : null,
        originalPrice: updatedOriginalPrice !== undefined ? updatedOriginalPrice : null,
        offerText: manageOfferText || null,
        giftText: manageGiftText || null,
        isOffer: manageIsOffer,
        offerExpiresAt: manageIsOffer ? new Date(Date.now() + parseInt(manageOfferDuration, 10) * 3600 * 1000).toISOString() : null,
        images: finalImages,
        stock: updatedStock !== undefined ? updatedStock : null,
        status: manageStatus,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'listings', listing.id), updateData);
      
      setListing(prev => {
        if (!prev) return null;
        return {
          ...prev,
          title: manageTitle,
          description: manageDescription,
          price: updatedPrice,
          originalPrice: updatedOriginalPrice,
          offerText: manageOfferText,
          giftText: manageGiftText,
          isOffer: manageIsOffer,
          offerExpiresAt: manageIsOffer ? new Date(Date.now() + parseInt(manageOfferDuration, 10) * 3600 * 1000).toISOString() : undefined,
          images: finalImages,
          stock: updatedStock,
          status: manageStatus
        };
      });

      setNewImageFiles([]);
      setManageImages(finalImages);

      toast.success('Listing updated successfully!');
      setShowManageModal(false);
      navigate(`/listing/${listing.id}`, { replace: true });
    } catch (error: any) {
      toast.error('Error updating listing: ' + error.message);
    } finally {
      setUpdatingManage(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    setUpdatingManage(true);
    try {
      await deleteDoc(doc(db, 'listings', listing.id));
      toast.success('Listing permanently deleted!');
      setShowDeleteConfirm(false);
      setShowManageModal(false);
      navigate('/profile');
    } catch (error: any) {
      toast.error('Failed to delete listing: ' + error.message);
    } finally {
      setUpdatingManage(false);
    }
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      if (listing && listing.type === 'product' && user) {
        setLoadingQuotes(true);
        try {
          const quotes = await getDeliveryQuotes(listing.location.county, user.location?.county || 'Nairobi', 1);
          setDeliveryQuotes(quotes);
          setSelectedQuote(quotes[0]);
        } catch (error) {
          console.error('Error fetching delivery quotes:', error);
        } finally {
          setLoadingQuotes(false);
        }
      }
    };
    fetchQuotes();
  }, [listing, user]);

  const handleAddToCart = () => {
    if (!listing) return;
    addToCart(listing, 1);
    toast.success('Added to Cart!');
  };

  const handleEscrowPayment = async () => {
    if (!user || !listing) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to book a service or buy products.');
      return;
    }
    
    let phoneNumber = user.phoneNumber;
    if (!phoneNumber) {
      phoneNumber = window.prompt('Please enter your M-Pesa phone number (e.g., 2547XXXXXXXX):') || '';
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('A valid phone number is required for M-Pesa payment');
      return;
    }

    setProcessingPayment(true);
    try {
      const transactionId = await initiateEscrowPayment({
        phoneNumber: phoneNumber.replace(/\+/g, ''),
        amount: listing.price || 0,
        listingId: listing.id,
        buyerId: user.uid,
        sellerId: listing.authorId,
        listingTitle: listing.title,
        type: listing.type,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
        deliveryQuote: selectedQuote ? {
          provider: selectedQuote.provider,
          price: selectedQuote.price
        } : undefined
      });

      if (transactionId) {
        toast.success('STK Push sent! Please enter your PIN on your phone.');
        
        await sendNotification(
          listing.authorId,
          'New Order Initiated',
          `A buyer has initiated a payment for your listing "${listing.title}". Funds will be held in escrow.`,
          'info',
          `/listing/${listing.id}`
        );

        setTimeout(async () => {
          await processPaymentSuccess(transactionId);
          
          await sendNotification(
            user.uid,
            'Payment Successful',
            `Your payment for "${listing.title}" has been received and is held securely in escrow.`,
            'success',
            `/listing/${listing.id}`
          );
          await sendNotification(
            listing.authorId,
            'Funds Received in Escrow',
            `Payment for "${listing.title}" has been received and is held in escrow. You can now proceed with delivery.`,
            'success',
            `/listing/${listing.id}`
          );

          const txDoc = await getDoc(doc(db, 'transactions', transactionId));
          if (txDoc.exists()) {
            setTransaction({ id: txDoc.id, ...txDoc.data() } as Transaction);
          }
        }, 10000);

        setTransaction({ 
          id: transactionId, 
          status: 'pending',
          listingId: listing.id,
          buyerId: user.uid,
          sellerId: listing.authorId,
          amount: (listing.price || 0) + (selectedQuote?.price || 0) + tipAmount,
          tipAmount: tipAmount > 0 ? tipAmount : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as Transaction);
      }
    } catch (error: any) {
      handleGeneralError(error, 'Payment failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!transaction || !listing) return;
    if (user && !user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to confirm delivery.');
      return;
    }
    try {
      const success = await releaseEscrowFunds(transaction.id);
      if (success) {
        setTransaction(prev => prev ? { ...prev, status: 'released' } : null);
        setHasCompletedTransaction(true);

        await sendNotification(
          listing.authorId,
          'Funds Released!',
          `The buyer has confirmed delivery for "${listing.title}". KES ${transaction.amount} has been added to your escrow balance.`,
          'success',
          '/profile'
        );
      }
    } catch (error: any) {
      toast.error('Error confirming delivery: ' + error.message);
    }
  };

  const handleLeaveReview = async (ratingVal: number, commentVal: string) => {
    if (!user || !listing || !author) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to submit a review.');
      return;
    }

    if (user.uid === listing.authorId) {
      toast.error("You cannot review your own listing");
      return;
    }

    setReviewing(true);
    try {
      const reviewData = {
        authorId: user.uid,
        targetId: listing.authorId,
        rating: ratingVal,
        comment: commentVal,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      const newReviewCount = (author.reviewCount || 0) + 1;
      const newRatingVal = ((author.rating || 0) * (author.reviewCount || 0) + ratingVal) / newReviewCount;

      await updateDoc(doc(db, 'users', author.uid), {
        rating: parseFloat(newRatingVal.toFixed(1)),
        reviewCount: newReviewCount
      });

      await sendNotification(
        author.uid,
        'New Review Received!',
        `${user.displayName} left you a ${ratingVal}-star review for "${listing.title}".`,
        'info',
        `/listing/${listing.id}`
      );

      toast.success('Review submitted successfully!');
      
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('targetId', '==', listing.authorId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    } catch (error: any) {
      toast.error('Error submitting review: ' + error.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `Check out this ${listing.type} on HudumaLink: ${listing.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">Synchronizing Node...</span>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      <Helmet>
        <title>{listing.title} | HudumaLink Kenya</title>
        <meta name="description" content={listing.description.substring(0, 160)} />
        <meta property="og:title" content={`${listing.title} - ${listing.price ? formatPrice(listing.price) : 'Contact for Price'}`} />
        <meta property="og:description" content={listing.description.substring(0, 160)} />
        <meta property="og:image" content={listing.images[0]} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Review Banner Alert */}
      {listing.status === 'pending' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3.5 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Zap className="w-4 h-4" />
            <span>Listing is current under moderator review</span>
          </div>
        </div>
      )}

      {/* Outer Responsive Grid Frame */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upper Breadcrumbs & Navigation actions */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-xs font-mono font-bold tracking-wider text-slate-400 hover:text-emerald-400 transition-colors uppercase gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('listing.back')}</span>
          </button>

          <span className="text-[10px] font-mono text-slate-500 uppercase font-black">
            LID: {listing.id.toUpperCase().substring(0, 8)}
          </span>
        </div>

        {/* Dense split container columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (Primary descriptive blocks) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Interactive Image Gallery slider */}
            <ListingGallery images={listing.images} title={listing.title} />

            {/* Title & Metadata Specifications sheet card */}
            <div className="bg-slate-900 border border-slate-850 rounded-[2rem] p-8 space-y-6 shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
                  <span className="text-emerald-400 uppercase tracking-wider">{listing.category}</span>
                  <span className="text-slate-700">•</span>
                  <span className="text-slate-400 uppercase tracking-wider">{listing.type}</span>
                  {listing.isPromoted && (
                    <>
                      <span className="text-slate-700">•</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase">
                        PROMOTED
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-100 tracking-tight leading-tighter">
                  {listing.title}
                </h1>

                {/* Physical County Location tags strip */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {listing.location.estate ? `${listing.location.estate}, ` : ''}{listing.location.town}, {listing.location.county}
                  </span>
                  <span className="text-slate-800">|</span>
                  <span>Posted {formatDate(listing.createdAt)}</span>
                  <span className="text-slate-800">|</span>
                  <span className="text-emerald-400 font-bold">{listing.viewCount || 12} Views</span>
                </div>
              </div>

              {/* Special promotional offer coupon handles */}
              {(listing.offerText || listing.giftText) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {listing.offerText && (
                    <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                      <Tag className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">ACTIVE DEAL</p>
                        <p className="text-xs text-slate-250 font-semibold mt-0.5">{listing.offerText}</p>
                      </div>
                    </div>
                  )}

                  {listing.giftText && (
                    <div className="bg-emerald-505/5 border border-emerald-500/15 p-4 rounded-2xl flex items-start gap-3">
                      <Gift className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">FREE GIFT INCLUDED</p>
                        <p className="text-xs text-slate-250 font-semibold mt-0.5">{listing.giftText}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <hr className="border-slate-805 border-slate-800" />

              {/* Core Deliverable Spec sheets / Stock variables if applicable */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-black text-slate-400 tracking-widest uppercase">SPECIFICATION SHEET & DELIVERY VARIABLES</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* County availability */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 uppercase">Primary Region</span>
                    <span className="text-slate-200 font-bold">{listing.location.county} (County)</span>
                  </div>

                  {/* Stock Availability for products or hire availability for services */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 uppercase">Availability</span>
                    <span className={cn(
                      "font-bold uppercase",
                      listing.type === 'product'
                        ? (listing.stock && listing.stock > 0 ? "text-emerald-400" : "text-rose-400")
                        : (listing.status === 'active' ? "text-emerald-400" : "text-slate-500")
                    )}>
                      {listing.type === 'product'
                        ? (listing.stock && listing.stock > 0 ? `${listing.stock} Units left` : 'Out of Stock')
                        : 'Available For hire'
                      }
                    </span>
                  </div>

                  {/* Pricing Tiers summary */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 uppercase">Revisions</span>
                    <span className="text-slate-200 font-bold">Unlimited Quality Checks</span>
                  </div>

                  {/* Delivery Turnaround limits */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 uppercase">Standard Turnaround</span>
                    <span className="text-slate-200 font-bold">
                      {listing.deliveryInfo?.deliveryTimeFrame || 'Guaranteed Escrow SLA'}
                    </span>
                  </div>
                </div>

                {/* Additional custom parameters specification table */}
                {listing.specifications && Object.keys(listing.specifications).length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">Technical Specifications Table</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(listing.specifications).map(([key, val]) => (
                        <div key={key} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 flex justify-between text-xs">
                          <span className="text-slate-400 font-medium capitalize">{key}</span>
                          <span className="font-mono text-slate-100 font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-slate-800" />

              {/* Complete written description body */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-mono font-black text-slate-400 tracking-widest uppercase">LISTING COMPREHENSIVE WORK DETAILS</h3>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Horizontal Escrow Transaction Sequence Steps Visualizer */}
            <EscrowTimeline currentStatus={transaction?.status} />

            {/* Interactive Verified Reviews summary & rating cards list */}
            <ReviewsSection 
              reviews={reviews} 
              user={user} 
              authorId={listing.authorId} 
              hasCompletedTransaction={hasCompletedTransaction}
              onLeaveReview={handleLeaveReview}
              reviewing={reviewing}
              t={t}
            />

            {/* More listings created by the SAME merchant/provider */}
            <ProviderListings authorId={listing.authorId} currentListingId={listing.id} />

            {/* Related recommendations grids & category listings matching county filters */}
            <RelatedListings category={listing.category} currentListingId={listing.id} county={listing.location.county} />

          </div>


          {/* Right Column (Sticky purchase/retention mechanics & vendor trust card) */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit">
            
            {/* Dark Fintech checkout actions panel */}
            <StickyPurchasePanel
              listing={listing}
              author={author}
              user={user}
              transaction={transaction}
              isFavorited={isFavorited}
              onToggleFavorite={toggleFavorite}
              onShare={handleShare}
              onAddToCart={handleAddToCart}
              onEscrowPayment={handleEscrowPayment}
              processingPayment={processingPayment}
              onConfirmDelivery={handleConfirmDelivery}
              onShowDisputeModal={() => setShowDisputeModal(true)}
              onShowManageModal={() => setShowManageModal(true)}
              onShowReportModal={() => setShowReportModal(true)}
              t={t}
            />

            {/* KYC Compliance Provider Trust stats score overview */}
            <ProviderTrustCard author={author} t={t} />

            {/* General Safest commerce usage warnings disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-mono font-black text-amber-500 tracking-wider uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>HUDUMALINK TRADE SAFETY</span>
              </h4>
              <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed font-mono">
                <li>• Always demand Escrow activation for services and custom projects.</li>
                <li>• Never agree to pay providers directly through personal M-Pesa. Doing so deletes support.</li>
                <li>• If you encounter discrepancies, please hit 'Raise Dispute' inside your contract control.</li>
              </ul>
            </div>

          </div>

        </div>
      </div>

      {/* Floating Sticky Mobile Buy/Contact Bar */}
      <div id="sticky-mobile-dock" className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-950 border-t border-slate-850 p-4 shrink-0 flex items-center justify-between gap-4 z-50">
        <div className="space-y-0.5">
          <p className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">INVESTMENT</p>
          <span className="text-lg font-black text-emerald-400 tracking-tight">
            {listing.price ? formatPrice(listing.price) : 'Check Negotiable'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={`tel:${listing.contact.phone}`}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </a>
          <button
            onClick={handleEscrowPayment}
            disabled={processingPayment || listing.status !== 'active'}
            className="px-6 py-3.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
          >
            {processingPayment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-slate-950" />
            )}
            <span>{listing.type === 'product' ? 'BUY NOW' : 'HIRE NOW'}</span>
          </button>
        </div>
      </div>

      {/* Manage Listing Modal Custom Settings Suite */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {showDeleteConfirm ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 bg-red-950/20 border border-red-900/40 rounded-full flex items-center justify-center text-red-400">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-100">Delete Listing Permanently?</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Are you sure you want to delete <strong className="text-slate-100 font-bold">"{listing?.title}"</strong>? This will permanently wipe all references.
                    </p>
                  </div>
                  <div className="flex w-full gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold font-mono"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteListing}
                      disabled={updatingManage}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-mono"
                    >
                      {updatingManage ? 'DELETING...' : 'YES, PERMANENT DELETE'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-805 border-slate-800 flex justify-between items-center bg-slate-950">
                    <h3 className="text-sm font-mono font-black text-slate-200 uppercase tracking-widest flex items-center">
                      <Settings className="w-4 h-4 mr-1.5 text-emerald-400" /> MERCHANT CONTROL PANEL
                    </h3>
                    <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                      <CloseIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateListing} className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">Listing Title</label>
                      <input
                        type="text"
                        required
                        value={manageTitle}
                        onChange={(e) => setManageTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">Description details</label>
                      <textarea
                        rows={3}
                        required
                        value={manageDescription}
                        onChange={(e) => setManageDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 outline-none text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">Price KES</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={managePrice}
                          onChange={(e) => setManagePrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">Compare Price ("Was")</label>
                        <input
                          type="number"
                          min={0}
                          value={manageOriginalPrice}
                          onChange={(e) => setManageOriginalPrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 outline-none text-xs"
                        />
                      </div>
                    </div>

                    <div className="col-span-full p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-200 uppercase tracking-wide">ACTIVE OFFER / DISCOUNT DEALS</p>
                          <p className="text-[10px] text-slate-500 leading-normal">Sets secondary tags visible on client displays.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setManageIsOffer(!manageIsOffer)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative flex items-center bg-slate-800",
                            manageIsOffer ? "bg-rose-500" : ""
                          )}
                        >
                          <div className={cn(
                            "w-3.5 h-3.5 rounded-full bg-white transition-all absolute",
                            manageIsOffer ? "left-5.5" : "left-1"
                          )} />
                        </button>
                      </div>

                      {manageIsOffer && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in duration-300">
                          <div>
                            <select
                              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold"
                              value={manageOfferDuration}
                              onChange={(e) => setManageOfferDuration(e.target.value)}
                            >
                              <option value="24">Expires 24 Hours</option>
                              <option value="48">Expires 48 Hours</option>
                              <option value="168">Expires 1 Week</option>
                            </select>
                          </div>
                          <div>
                            <input
                              type="text"
                              value={manageOfferText}
                              onChange={(e) => setManageOfferText(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-200 text-xs"
                              placeholder="e.g. SAVE20"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1.5">Free items / custom Gift additions</label>
                      <input
                        type="text"
                        value={manageGiftText}
                        onChange={(e) => setManageGiftText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 outline-none text-xs"
                        placeholder="e.g. Free dynamic accessories"
                      />
                    </div>

                    {/* Active Upload grid */}
                    <div className="space-y-2">
                      <label className="block text-xs font-mono font-bold text-slate-400 uppercase">Image Attachments</label>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {manageImages.map((imgUrl, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 group">
                            <img src={imgUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setManageImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-[10px] font-bold"
                            >
                              REMOVE
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer bg-slate-950 hover:bg-slate-900 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-5 h-5 text-slate-500 mb-1" />
                            <p className="text-[10px] font-mono text-slate-500 uppercase font-black">DRAG & DROP NEW IMAGES</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                setNewImageFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 gap-2 flex flex-col sm:flex-row justify-between">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-3 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950/40 rounded-xl text-xs font-bold font-mono transition-colors"
                      >
                        PERMANENT WIPE LISTING
                      </button>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowManageModal(false)}
                          className="px-4 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold font-mono"
                        >
                          CANCEL
                        </button>
                        <button
                          type="submit"
                          disabled={updatingManage}
                          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black font-mono shadow-md"
                        >
                          {updatingManage ? 'SAVING...' : 'SAVE PANEL UPDATES'}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-xs font-mono font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> REPORT MERCHANT LISTING
                </h3>
                <button onClick={() => setShowReportModal(false)} className="p-1 hover:bg-slate-850 rounded">
                  <CloseIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">REASON CODE</label>
                  <select
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-400 text-xs rounded-xl outline-none"
                  >
                    <option value="">Select a Violation</option>
                    <option value="scam">Fraud / Scam / Fake Service</option>
                    <option value="prohibited">Illegal or Prohibited listings</option>
                    <option value="misleading">Misleading descriptions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">ADDITIONAL DESCRIPTION DESCRIPTORS</label>
                  <textarea
                    rows={4}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none"
                    placeholder="Provide clear links or reasons for this report"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl text-xs font-black font-mono tracking-wider transition-all"
                >
                  {submittingReport ? 'SUBMITTING...' : 'SUBMIT VIOLATION REPORT'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-xs font-mono font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> DISPUTE ACTIVE ESCROW CONTRACT
                </h3>
                <button onClick={() => setShowDisputeModal(false)} className="p-1 hover:bg-slate-800 rounded">
                  <CloseIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleDispute} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">REASON CODE</label>
                  <select
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-400 text-xs rounded-xl outline-none"
                  >
                    <option value="">Select reason</option>
                    <option value="not_received">Services/Goods not delivered at all</option>
                    <option value="not_as_described">Poor delivery - Not according to outline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">DISPUITE EVIDENCE STATEMENT</label>
                  <textarea
                    required
                    rows={4}
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl outline-none font-mono"
                    placeholder="Provide screenshot references, details log..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-400 uppercase mb-1">UPLOAD PHOTOSPROOF</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDisputeEvidence(e.target.files?.[0] || null)}
                    className="text-xs text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="w-full py-4 bg-red-650 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black font-mono tracking-wider shadow-lg"
                >
                  {submittingDispute ? 'ARBITRATING...' : 'SUBMIT FORMAL ESCROW DISPUTE'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetail;
