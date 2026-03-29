import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Listing, User, Review, Transaction, Milestone } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { sendNotification } from '../lib/notifications';
import { getDeliveryQuotes, DeliveryQuote } from '../services/deliveryService';
import { MapPin, Phone, MessageCircle, ShieldCheck, Share2, Heart, ArrowLeft, Star, Zap, Send, Flag, AlertTriangle, X as CloseIcon, Loader2, Shield, CheckCircle2, Bell, Box, Layers, Settings, Truck, CreditCard, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';

const ListingDetail = () => {
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
  const navigate = useNavigate();

  const milestones: Milestone[] = [
    { id: '1', title: 'Deposit', amount: (listing?.price || 0) * 0.3, status: 'pending', description: 'Initial deposit to start the project' },
    { id: '2', title: 'Final Payment', amount: (listing?.price || 0) * 0.7, status: 'pending', description: 'Balance upon completion' }
  ];

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || !id) return;

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
      
      // Increment report count on listing
      await updateDoc(doc(db, 'listings', id), {
        reportsCount: increment(1)
      });

      toast.success('Listing reported. Our team will investigate.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error: any) {
      toast.error('Failed to submit report: ' + error.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;

    setSubmittingDispute(true);
    try {
      let evidenceUrl = '';
      if (disputeEvidence) {
        const storageRef = ref(storage, `disputes/${transaction.id}/${Date.now()}_${disputeEvidence.name}`);
        const snapshot = await uploadBytes(storageRef, disputeEvidence);
        evidenceUrl = await getDownloadURL(snapshot.ref);
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
      
      // Update transaction status to indicate dispute
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'cancelled', // Or a new 'disputed' status
        updatedAt: new Date().toISOString()
      });

      toast.success('Dispute raised. Our team will review the evidence.');
      setShowDisputeModal(false);
      setDisputeReason('');
      setDisputeDetails('');
      setDisputeEvidence(null);
    } catch (error: any) {
      toast.error('Failed to raise dispute: ' + error.message);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction || !author || !id) return;
    setSubmittingCancel(true);

    try {
      // Update transaction
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'cancelled',
        cancellationReason: cancelReason,
        cancelledBy: user.uid,
        updatedAt: new Date().toISOString()
      });

      // Update provider's cancellation count
      const newCount = (author.cancellationCount || 0) + 1;
      let updateData: any = { cancellationCount: newCount };

      if (newCount >= 5) {
        updateData.isFlagged = true;
        updateData.flagReason = 'Excessive cancellations (5 or more)';
      }

      await updateDoc(doc(db, 'users', listing?.authorId || ''), updateData);

      // Send notifications
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
      
      // Refresh transaction state
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
      toast.error('Error cancelling order: ' + error.message);
    } finally {
      setSubmittingCancel(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const listingDoc = await getDoc(doc(db, 'listings', id));
        if (listingDoc.exists()) {
          const listingData = { id: listingDoc.id, ...listingDoc.data() } as Listing;
          setListing(listingData);
          
          const authorDoc = await getDoc(doc(db, 'users', listingData.authorId));
          if (authorDoc.exists()) {
            setAuthor(authorDoc.data() as User);
          }

          // Fetch transaction if user is logged in
          if (user) {
            const txQuery = query(
              collection(db, 'transactions'), 
              where('listingId', '==', id),
              where('buyerId', '==', user.uid)
            );
            const txSnap = await getDocs(txQuery);
            if (!txSnap.empty) {
              const txData = { id: txSnap.docs[0].id, ...txSnap.docs[0].data() } as Transaction;
              setTransaction(txData);
              if (txData.status === 'completed') {
                setHasCompletedTransaction(true);
              }
            }
          }

          // Increment view count
          await updateDoc(doc(db, 'listings', id), {
            viewCount: increment(1)
          });

          // Fetch reviews for the author
          const reviewsQuery = query(
            collection(db, 'reviews'),
            where('targetId', '==', listingData.authorId),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
        } else {
          toast.error('Listing not found');
          navigate('/listings');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate, user]);

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

  const handleEscrowPayment = async () => {
    if (!user || !listing) return;
    setProcessingPayment(true);
    try {
      // Simulate M-Pesa Payment
      const newTx: any = {
        listingId: listing.id,
        buyerId: user.uid,
        sellerId: listing.authorId,
        amount: listing.price || 0,
        status: 'deposited',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (useMilestones && listing.type === 'service') {
        newTx.milestones = milestones;
      }

      if (selectedQuote && listing.type === 'product') {
        newTx.delivery = {
          provider: selectedQuote.provider,
          price: selectedQuote.price,
          status: 'pending'
        };
        newTx.amount += selectedQuote.price;
      }
      
      const docRef = await addDoc(collection(db, 'transactions'), newTx);
      setTransaction({ id: docRef.id, ...newTx } as Transaction);
      
      // Send notification to seller
      await sendNotification(
        listing.authorId,
        'New Escrow Payment',
        `${user.displayName} has deposited ${formatPrice(newTx.amount)} into Escrow for your listing: ${listing.title}`,
        'success',
        `/profile`
      );

      toast.success('Payment deposited into Escrow! Seller has been notified.');
    } catch (error: any) {
      toast.error('Payment failed: ' + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!transaction || !listing) return;
    try {
      await updateDoc(doc(db, 'transactions', transaction.id), { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      
      // Release funds to seller
      const sellerRef = doc(db, 'users', listing.authorId);
      await updateDoc(sellerRef, { 
        escrowBalance: increment(transaction.amount) 
      });

      // Handle referral payout if amount >= 1000
      if (transaction.amount >= 1000) {
        const sellerDoc = await getDoc(sellerRef);
        const sellerData = sellerDoc.data() as User;
        if (sellerData.referredBy) {
          const referrerRef = doc(db, 'users', sellerData.referredBy);
          await updateDoc(referrerRef, { 
            referralEarnings: increment(100) // Fixed 100 KES bonus
          });
        }
      }

      setTransaction(prev => prev ? { ...prev, status: 'completed' } : null);
      toast.success('Delivery confirmed! Funds released to seller.');
    } catch (error: any) {
      toast.error('Error confirming delivery: ' + error.message);
    }
  };

  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !listing || !author) return;
    if (user.uid === listing.authorId) {
      toast.error("You cannot review your own listing");
      return;
    }

    setReviewing(true);
    try {
      const reviewData = {
        authorId: user.uid,
        targetId: listing.authorId,
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Update author's rating and reviewCount
      const newReviewCount = (author.reviewCount || 0) + 1;
      const newRatingVal = ((author.rating || 0) * (author.reviewCount || 0) + newRating) / newReviewCount;

      await updateDoc(doc(db, 'users', author.uid), {
        rating: parseFloat(newRatingVal.toFixed(1)),
        reviewCount: newReviewCount
      });

      toast.success('Review submitted successfully!');
      setNewComment('');
      setNewRating(5);
      
      // Refresh reviews
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

  const handleRequestService = async () => {
    if (!user || !listing) {
      toast.error('Please login to request this service');
      navigate('/auth');
      return;
    }
    
    setRequestingService(true);
    try {
      await sendNotification(
        listing.authorId,
        'New Service Request',
        `${user.displayName} is interested in your ${listing.type}: ${listing.title}. Check your messages!`,
        'request',
        `/messages`
      );
      
      toast.success('Request sent! The seller has been notified via SMS, Email, and In-app notification.');
    } catch (error: any) {
      toast.error('Failed to send request: ' + error.message);
    } finally {
      setRequestingService(false);
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
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">Loading...</div>;
  if (!listing) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      <Helmet>
        <title>{listing.title} | HudumaLink Kenya</title>
        <meta name="description" content={listing.description.substring(0, 160)} />
        <meta property="og:title" content={`${listing.title} - ${listing.price ? formatPrice(listing.price) : 'Contact for Price'}`} />
        <meta property="og:description" content={listing.description.substring(0, 160)} />
        <meta property="og:image" content={listing.images[0]} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Pending Review Banner */}
      {listing.status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl py-4 px-6 mb-8 text-center">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center justify-center">
            <Zap className="w-4 h-4 mr-2" /> This listing is currently under review by our team. It will be visible to everyone once approved.
          </p>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Description */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <div className="relative aspect-video">
              <img 
                src={listing.images[0] || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80'} 
                alt={listing.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="p-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full shadow-lg hover:text-secondary transition-colors text-gray-900 dark:text-gray-100">
                  <Heart className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full shadow-lg hover:text-primary transition-colors text-gray-900 dark:text-gray-100"
                  title="Share Listing"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {user && user.uid !== listing.authorId && (
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="p-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full shadow-lg hover:text-secondary transition-colors text-gray-900 dark:text-gray-100"
                    title="Report Listing"
                  >
                    <Flag className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {listing.images.length > 1 && (
              <div className="flex p-4 gap-2 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 border border-transparent dark:border-neutral-800" referrerPolicy="no-referrer" />
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm space-y-6 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 text-sm text-primary font-bold uppercase tracking-wider mb-2">
                  <span>{listing.category}</span>
                  <span className="text-gray-300 dark:text-neutral-700">•</span>
                  <span>{listing.type}</span>
                  {listing.isPromoted && (
                    <>
                      <span className="text-gray-300 dark:text-neutral-700">•</span>
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] flex items-center">
                        <Zap className="w-3 h-3 mr-1" /> PROMOTED
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{listing.title}</h1>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {listing.location.town}, {listing.location.county}
                  <span className="mx-2 text-gray-300 dark:text-neutral-700">|</span>
                  <span>Posted {formatDate(listing.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-primary">
                  {listing.price ? formatPrice(listing.price) : 'Contact for Price'}
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-neutral-800" />
            
            {/* Product Specifics */}
            {(listing.stock !== undefined || (listing.sizes && listing.sizes.length > 0) || (listing.specifications && Object.keys(listing.specifications).length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {listing.stock !== undefined && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Box className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Availability</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {listing.stock > 0 ? `${listing.stock} units left` : 'Out of stock'}
                      </p>
                    </div>
                  </div>
                )}
                
                {listing.sizes && listing.sizes.length > 0 && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Layers className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Available Sizes</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {listing.sizes.map((size, idx) => (
                          <span key={idx} className="bg-white dark:bg-neutral-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200 dark:border-neutral-600">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {listing.specifications && Object.keys(listing.specifications).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
                  <Settings className="w-5 h-5 mr-2 text-primary" /> Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(listing.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-3 bg-gray-50 dark:bg-neutral-800/30 rounded-xl border border-gray-100 dark:border-neutral-800">
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{key}</span>
                      <span className="text-sm text-gray-900 dark:text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-gray-100 dark:border-neutral-800" />

            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-gray-100">
              <Star className="w-6 h-6 mr-2 text-yellow-500" /> Reviews & Ratings
            </h2>

            {/* Review Form */}
            {user && user.uid !== listing.authorId && hasCompletedTransaction && (
              <form onSubmit={handleLeaveReview} className="mb-10 p-6 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Leave a Review</h3>
                <div className="flex items-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className={`p-1 transition-colors ${star <= newRating ? 'text-yellow-500' : 'text-gray-300 dark:text-neutral-700'}`}
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your experience with this seller..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-colors mb-4"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={reviewing}
                  className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{reviewing ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            )}

            {/* Review List */}
            <div className="space-y-6">
              {!hasCompletedTransaction && user && user.uid !== listing.authorId && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-400 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Only buyers who have completed a transaction can leave a review.</span>
                </div>
              )}
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 dark:border-neutral-800 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-current' : 'text-gray-300 dark:text-neutral-700'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Seller Info & Actions */}
        <div className="space-y-6">
          {/* Seller Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">Seller Information</h2>
            <div className="flex items-center space-x-4 mb-6">
              {author?.photoURL ? (
                <img src={author.photoURL} alt={author.displayName} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                  <Star className="w-8 h-8" />
                </div>
              )}
              <div>
                <div className="flex items-center">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{author?.displayName}</h3>
                  {author?.isVerified && <ShieldCheck className="w-4 h-4 text-primary ml-1" />}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{author?.role}</p>
                <div className="flex items-center mt-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold ml-1">{author?.rating || 'New'}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({author?.reviewCount || 0} reviews)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user?.uid === listing.authorId && (
                <button 
                  onClick={async () => {
                    const res = await fetch('/api/mpesa/stkpush', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phoneNumber: '254700000000', amount: 500, accountReference: listing.id })
                    });
                    const data = await res.json();
                    toast.success(data.CustomerMessage);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                >
                  <Zap className="w-5 h-5" />
                  <span>Boost Listing (KES 500)</span>
                </button>
              )}
              {user?.uid !== listing.authorId && (
                <button 
                  onClick={handleRequestService}
                  disabled={requestingService}
                  className="w-full flex items-center justify-center space-x-2 bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                >
                  {requestingService ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                  <span>Request {listing.type === 'service' ? 'Service' : 'Product'}</span>
                </button>
              )}
              <a 
                href={`tel:${listing.contact.phone}`}
                className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
              >
                <Phone className="w-5 h-5" />
                <span>Call Seller</span>
              </a>
              {listing.contact.whatsapp && (
                <a 
                  href={`https://wa.me/${listing.contact.whatsapp.replace(/\+/g, '')}?text=Hi, I'm interested in your listing: ${listing.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {/* Escrow System */}
              {user?.uid !== listing.authorId && (
                <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
                  {!transaction && (
                    <>
                      {/* Delivery Options for Products */}
                      {listing.type === 'product' && (
                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
                          <h3 className="text-sm font-bold mb-3 flex items-center text-gray-900 dark:text-white">
                            <Truck className="w-4 h-4 mr-2 text-primary" /> Delivery Options
                          </h3>
                          {loadingQuotes ? (
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Fetching real-time quotes...</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {deliveryQuotes.map((quote, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedQuote(quote)}
                                  className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                    selectedQuote?.provider === quote.provider
                                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                                      : "border-gray-200 dark:border-neutral-700 hover:border-primary/50"
                                  )}
                                >
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{quote.provider}</p>
                                    <p className="text-xs text-gray-500">{quote.estimatedDays} delivery</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-primary">{formatPrice(quote.price)}</p>
                                    {quote.trackingAvailable && (
                                      <p className="text-[10px] text-green-500 font-bold uppercase">Tracking Incl.</p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Milestone Payments for Services */}
                      {listing.type === 'service' && (
                        <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold flex items-center text-gray-900 dark:text-white">
                              <CreditCard className="w-4 h-4 mr-2 text-primary" /> Milestone Payments
                            </h3>
                            <button 
                              onClick={() => setUseMilestones(!useMilestones)}
                              className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full transition-all",
                                useMilestones ? "bg-primary text-white" : "bg-gray-200 dark:bg-neutral-700 text-gray-500"
                              )}
                            >
                              {useMilestones ? 'ENABLED' : 'DISABLED'}
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 mb-3">Release payments in stages as work is completed.</p>
                          {useMilestones && (
                            <div className="space-y-2">
                              {milestones.map((m) => (
                                <div key={m.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-lg border border-gray-100 dark:border-neutral-700">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.title}</span>
                                  <span className="text-xs font-bold text-primary">{formatPrice(m.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={handleEscrowPayment}
                        disabled={processingPayment}
                        className="w-full flex items-center justify-center space-x-2 bg-accent text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
                      >
                        {processingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        <span>Pay via Escrow ({formatPrice((listing.price || 0) + (selectedQuote?.price || 0))})</span>
                      </button>
                    </>
                  )}

                  {transaction?.status === 'deposited' ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center text-green-700 dark:text-green-400 font-bold text-sm mb-1">
                          <Shield className="w-4 h-4 mr-2" /> Payment in Escrow
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-500">Your funds are safe. Confirm delivery only after you receive the item.</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleConfirmDelivery}
                          className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirm Delivery</span>
                        </button>
                        <button 
                          onClick={() => setShowDisputeModal(true)}
                          className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all"
                          title="Raise Dispute"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setShowCancelModal(true)}
                          className="p-4 bg-gray-500/10 text-gray-500 rounded-2xl hover:bg-gray-500/20 transition-all"
                          title="Cancel Order"
                        >
                          <CloseIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : transaction?.status === 'completed' ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center text-blue-700 dark:text-blue-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Transaction Completed
                    </div>
                  ) : null}
                </div>
              )}

              {user?.uid !== listing.authorId && (
                <button 
                  onClick={async () => {
                    if (!user) {
                      toast.error('Please login to chat with the seller');
                      navigate('/auth');
                      return;
                    }

                    try {
                      // Check if chat already exists
                      const chatsRef = collection(db, 'chats');
                      const q = query(
                        chatsRef, 
                        where('participants', 'array-contains', user.uid)
                      );
                      const querySnapshot = await getDocs(q);
                      
                      let chatId = '';
                      querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.participants.includes(listing.authorId)) {
                          chatId = doc.id;
                        }
                      });

                      if (!chatId) {
                        // Create new chat
                        const newChat = await addDoc(collection(db, 'chats'), {
                          participants: [user.uid, listing.authorId],
                          lastMessage: '',
                          updatedAt: new Date().toISOString(),
                          listingId: listing.id,
                          listingTitle: listing.title
                        });
                        chatId = newChat.id;
                      }

                      navigate(`/messages?chatId=${chatId}`);
                    } catch (error: any) {
                      toast.error('Error starting chat: ' + error.message);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>In-app Chat</span>
                </button>
              )}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl p-6 border border-yellow-100 dark:border-yellow-900/20 transition-colors">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Safety Tips
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300/80 space-y-2 list-disc pl-4">
              <li>Meet in a safe public place</li>
              <li>Don't pay in advance, even for delivery</li>
              <li>Inspect the item before you buy</li>
              <li>Check the seller's profile and ratings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-secondary" /> Report Listing
                </h3>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for reporting</label>
                  <select 
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">Select a reason</option>
                    <option value="scam">Scam or Fraud</option>
                    <option value="prohibited">Prohibited Item</option>
                    <option value="misleading">Misleading Information</option>
                    <option value="duplicate">Duplicate Listing</option>
                    <option value="offensive">Offensive Content</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Details (Optional)</label>
                  <textarea 
                    rows={4}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide more information to help our moderators..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submittingReport || !reportReason}
                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingReport ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDisputeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary" /> Raise Dispute
                </h3>
                <button onClick={() => setShowDisputeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleDispute} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for dispute</label>
                  <select 
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">Select a reason</option>
                    <option value="not_received">Item not received</option>
                    <option value="not_as_described">Item not as described</option>
                    <option value="poor_quality">Poor service quality</option>
                    <option value="incomplete">Incomplete work</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Details</label>
                  <textarea 
                    required
                    rows={4}
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    placeholder="Explain the issue in detail..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Evidence (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => setDisputeEvidence(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Upload photos or videos to support your dispute.</p>
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submittingDispute || !disputeReason}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingDispute ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Raise Dispute'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <CloseIcon className="w-5 h-5 mr-2 text-red-500" /> Cancel Order
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCancelOrder} className="p-6 space-y-4">
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 text-xs text-red-700 dark:text-red-400">
                  <p className="font-bold mb-1">Warning:</p>
                  <p>Cancelling orders frequently may lead to account penalties. Please provide a valid reason.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for cancellation</label>
                  <select 
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">Select a reason</option>
                    <option value="change_of_mind">Changed my mind</option>
                    <option value="found_better_price">Found a better price</option>
                    <option value="seller_not_responding">Seller not responding</option>
                    <option value="delivery_delay">Delivery delay</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submittingCancel || !cancelReason}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingCancel ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetail;
