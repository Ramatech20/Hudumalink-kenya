import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit, addDoc, updateDoc, increment, orderBy, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { uploadWithFallback } from '../lib/upload-helper';
import { handleApiError, handleNetworkError, handleGeneralError } from '../lib/error-handler';
import { Listing, User, Review, Transaction, Milestone } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { sendNotification } from '../lib/notifications';
import { getDeliveryQuotes, DeliveryQuote } from '../services/deliveryService';
import { initiateEscrowPayment, processPaymentSuccess, releaseEscrowFunds } from '../services/paymentService';
import { MapPin, Phone, MessageCircle, ShieldCheck, Share2, Heart, ArrowLeft, Star, Zap, Send, Flag, AlertTriangle, X as CloseIcon, Loader2, Shield, CheckCircle2, Bell, Box, Layers, Settings, Truck, CreditCard, ChevronRight, Info, ShoppingCart, Briefcase, DollarSign, Trash2, Upload, Tag, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';

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
  const navigate = useNavigate();

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
  const [updatingManage, setUpdatingManage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      handleFirestoreError(error, OperationType.CREATE, 'reports');
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
      
      // Update transaction status to indicate dispute
      await updateDoc(doc(db, 'transactions', transaction.id), {
        status: 'disputed',
        updatedAt: new Date().toISOString()
      });

      toast.success('Dispute raised. Our team will review the evidence.');
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
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transaction?.id}`);
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
        
        const authorDoc = await getDoc(doc(db, 'users_public', listingData.authorId));
        if (authorDoc.exists()) {
          setAuthor(authorDoc.data() as User);
        }

        // Fetch transaction if user is logged in
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

        // Increment view count
        try {
          await updateDoc(doc(db, 'listings', id), {
            viewCount: increment(1)
          });
        } catch (error) {
          // Non-critical error
          console.warn('Failed to increment view count:', error);
        }

        // Fetch reviews for the author
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
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `listings/${id}`);
    } finally {
      setLoading(false);
    }
    };
    fetchData();
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
      const updatedStock = manageStock ? parseInt(manageStock, 10) : undefined;

      const updateData: any = {
        title: manageTitle,
        description: manageDescription,
        price: updatedPrice !== undefined ? updatedPrice : null,
        originalPrice: updatedOriginalPrice !== undefined ? updatedOriginalPrice : null,
        offerText: manageOfferText || null,
        giftText: manageGiftText || null,
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
          images: finalImages,
          stock: updatedStock,
          status: manageStatus
        };
      });

      // Reset file upload state
      setNewImageFiles([]);
      setManageImages(finalImages);

      toast.success('Listing updated successfully!');
      setShowManageModal(false);
      
      // Clear URL query parameter
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

  const handleEscrowPayment = async () => {
    if (!user || !listing) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }
    
    // Ask for phone number if not in profile
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
        
        // Notify seller about pending order
        await sendNotification(
          listing.authorId,
          'New Order Initiated',
          `A buyer has initiated a payment for your listing "${listing.title}". Funds will be held in escrow.`,
          'info',
          `/listing/${listing.id}`
        );

        // Process payment success after 10 seconds (in a real app, this would be a webhook)
        setTimeout(async () => {
          await processPaymentSuccess(transactionId);
          
          // Notify both parties about successful deposit
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

          // Refresh transaction state
          const txDoc = await getDoc(doc(db, 'transactions', transactionId));
          if (txDoc.exists()) {
            setTransaction({ id: txDoc.id, ...txDoc.data() } as Transaction);
          }
        }, 10000);

        // Update local state to show pending payment
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
    try {
      const success = await releaseEscrowFunds(transaction.id);
      if (success) {
        setTransaction(prev => prev ? { ...prev, status: 'released' } : null);
        setHasCompletedTransaction(true);

        // Notify seller about funds release
        await sendNotification(
          listing.authorId,
          'Funds Released!',
          `The buyer has confirmed delivery for "${listing.title}". KES ${transaction.amount} has been added to your escrow balance.`,
          'success',
          '/profile'
        );
      }
    } catch (error: any) {
      if (error.operationType) {
        // Already handled by handleFirestoreError inside releaseEscrowFunds if applicable
        // But here we might want to catch it if it's a general error from releaseEscrowFunds
        return;
      }
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

      try {
        await updateDoc(doc(db, 'users', author.uid), {
          rating: parseFloat(newRatingVal.toFixed(1)),
          reviewCount: newReviewCount
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${author.uid}`);
        throw error;
      }

      // Notify seller about new review
      await sendNotification(
        author.uid,
        'New Review Received!',
        `${user.displayName} left you a ${newRating}-star review for "${listing.title}".`,
        'info',
        `/listing/${listing.id}`
      );

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
      try {
        const reviewsSnapshot = await getDocs(reviewsQuery);
        setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
        throw error;
      }
    } catch (error: any) {
      if (!error.operationType) {
        toast.error('Error submitting review: ' + error.message);
      }
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
            <Zap className="w-4 h-4 mr-2" /> {t('listing.under_review')}
          </p>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> {t('listing.back')}
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
                  title={t('listing.share')}
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {user && user.uid !== listing.authorId && (
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="p-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur rounded-full shadow-lg hover:text-secondary transition-colors text-gray-900 dark:text-gray-100"
                    title={t('listing.report')}
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
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] flex items-center font-bold uppercase",
                        listing.promotionTier === 'elite' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                        listing.promotionTier === 'premium' ? "bg-primary/10 text-primary" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      )}>
                        <Zap className="w-3 h-3 mr-1" /> {listing.promotionTier?.toUpperCase() || t('listing.promoted')}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{listing.title}</h1>
                <div className="flex flex-col mt-2">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location.town}, {listing.location.county}
                    <span className="mx-2 text-gray-300 dark:text-neutral-700">|</span>
                    <span>{t('listing.posted')} {formatDate(listing.createdAt)}</span>
                  </div>
                  {user?.uid === listing.authorId && !listing.isPromoted && (
                    <Link 
                      to={`/promote/${listing.id}`}
                      className="flex items-center text-xs font-bold text-yellow-600 hover:text-yellow-700 mt-2 transition-colors"
                    >
                      <Zap className="w-3 h-3 mr-1 fill-current" /> {t('listing.promote_cta')}
                    </Link>
                  )}
                  {listing.isPromoted && listing.featuredUntil && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {t('listing.promotion_until')} {formatDate(listing.featuredUntil)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {listing.originalPrice && listing.price && listing.originalPrice > listing.price ? (
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-medium">
                      {formatPrice(listing.originalPrice)}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black px-2 py-0.5 rounded-full flex items-center shadow-sm">
                        {Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)}% OFF
                      </span>
                      <span className="text-3xl font-extrabold text-primary">
                        {formatPrice(listing.price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-extrabold text-primary">
                    {listing.price ? formatPrice(listing.price) : t('listings.contact_price')}
                  </div>
                )}
              </div>
            </div>

            {(listing.offerText || listing.giftText) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 pb-3">
                {listing.offerText && (
                  <div className="relative overflow-hidden bg-amber-50 dark:bg-amber-950/15 border border-amber-200/40 dark:border-amber-900/20 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
                    <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Tag className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Special Offer / Deal</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-amber-100/95 mt-1">
                        {listing.offerText}
                      </p>
                    </div>
                  </div>
                )}
                {listing.giftText && (
                  <div className="relative overflow-hidden bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-200/40 dark:border-emerald-900/20 p-4 rounded-2xl flex items-start space-x-3 shadow-sm">
                    <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Free Gift Included! 🎁</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-emerald-100/95 mt-1">
                        {listing.giftText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr className="border-gray-100 dark:border-neutral-800" />
            
            {/* Delivery Info */}
            {listing.deliveryInfo && (listing.deliveryInfo.freeDeliveryPlaces || listing.deliveryInfo.deliveryTimeFrame) && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
                  <Truck className="w-5 h-5 mr-2 text-primary" /> {t('listing.delivery_options')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.deliveryInfo.freeDeliveryPlaces && listing.deliveryInfo.freeDeliveryPlaces.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20">
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider mb-1">{t('listing.free_delivery')}</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {listing.deliveryInfo.freeDeliveryPlaces.join(', ')}
                      </p>
                    </div>
                  )}
                  {listing.deliveryInfo.deliveryTimeFrame && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">{t('listing.delivery_time')}</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {listing.deliveryInfo.deliveryTimeFrame}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Specifics */}
            {(listing.stock !== undefined || (listing.sizes && listing.sizes.length > 0) || (listing.specifications && Object.keys(listing.specifications).length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {listing.stock !== undefined && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Box className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('listing.availability')}</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {listing.stock > 0 ? t('listing.units_left').replace('{count}', listing.stock.toString()) : t('listing.out_of_stock')}
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
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{t('listing.available_sizes')}</p>
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
                  <Settings className="w-5 h-5 mr-2 text-primary" /> {t('listing.specifications')}
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
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('listing.description')}</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Tipping Section */}
            {listing.tipEnabled && !transaction && (
              <div className="pt-6 border-t border-gray-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-primary" /> {t('listing.tip_seller')}
                    </h3>
                    <p className="text-sm text-gray-500">{t('listing.tip_desc')}</p>
                  </div>
                  {tipAmount > 0 && (
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                      + {formatPrice(tipAmount)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 200, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTipAmount(amount)}
                      className={cn(
                        "px-4 py-2 rounded-xl border font-bold transition-all",
                        tipAmount === amount 
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                          : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:border-primary"
                      )}
                    >
                      {formatPrice(amount)}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowTipModal(true)}
                    className={cn(
                      "px-4 py-2 rounded-xl border font-bold transition-all",
                      tipAmount > 0 && ![50, 100, 200, 500].includes(tipAmount)
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:border-primary"
                    )}
                  >
                    {tipAmount > 0 && ![50, 100, 200, 500].includes(tipAmount) ? formatPrice(tipAmount) : t('listing.custom_tip')}
                  </button>
                  {tipAmount > 0 && (
                    <button
                      onClick={() => setTipAmount(0)}
                      className="px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all font-bold"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-gray-100">
              <Star className="w-6 h-6 mr-2 text-yellow-500" /> {t('listing.reviews')}
            </h2>

            {/* Review Form */}
            {user && user.uid !== listing.authorId && hasCompletedTransaction && (
              <form onSubmit={handleLeaveReview} className="mb-10 p-6 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">{t('listing.leave_review')}</h3>
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
                  placeholder={t('listing.review_placeholder')}
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
                  <span>{reviewing ? t('common.submitting') : t('listing.submit_review')}</span>
                </button>
              </form>
            )}

            {/* Review List */}
            <div className="space-y-6">
              {!hasCompletedTransaction && user && user.uid !== listing.authorId && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-400 flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  <span>{t('listing.review_restriction')}</span>
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
                  <p>{t('listing.no_reviews')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Seller Info & Actions */}
        <div className="space-y-6">
          {/* Seller Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-gray-100">{t('listing.seller_info')}</h2>
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

            <div className="space-y-6">
              {/* Transaction Status (Visible to both) */}
              {transaction && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('listing.transaction_status')}</h3>
                  {transaction.status === 'pending' && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('listing.payment_pending')}
                      </p>
                    </div>
                  )}
                  
                  {transaction.status === 'deposited' && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                      <p className="text-sm text-green-800 dark:text-green-200 font-medium flex items-center">
                        <ShieldCheck className="w-4 h-4 mr-2" /> {t('listing.funds_safe')}
                      </p>
                    </div>
                  )}

                  {transaction.status === 'released' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> {t('listing.completed')}
                      </p>
                    </div>
                  )}

                  {transaction.status === 'disputed' && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                      <p className="text-sm text-red-800 dark:text-red-200 font-medium flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> {t('listing.disputed')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Buyer Actions */}
              {user?.uid !== listing.authorId && (
                <div className="space-y-4">
                  {/* CRITICAL SAFETY WARNING */}
                  {!transaction && (
                    <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-600 rounded-2xl animate-pulse shadow-xl shadow-red-500/20 ring-4 ring-red-500/10">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-600 rounded-full flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-tighter mb-1">
                            {t('listing.safety_warning')}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-bold">
                            {t('listing.safety_warning_desc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!transaction && (
                    <button 
                      onClick={handleEscrowPayment}
                      disabled={processingPayment || listing.status !== 'active'}
                      className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {processingPayment ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : listing.type === 'product' ? (
                        <ShoppingCart className="w-5 h-5" />
                      ) : (
                        <Briefcase className="w-5 h-5" />
                      )}
                      <span>{listing.type === 'product' ? t('listing.buy_escrow') : t('listing.hire_escrow')}</span>
                    </button>
                  )}
                  
                  {!transaction && (
                    <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 px-4">
                      {t('listing.terms_agree').split('{terms}')[0]}
                      <Link to="/terms" className="underline">{t('footer.terms')}</Link>
                      {t('listing.terms_agree').split('{terms}')[1]}
                    </p>
                  )}

                  {transaction?.status === 'deposited' && (
                    <div className="space-y-2">
                      <button 
                        onClick={handleConfirmDelivery}
                        className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{t('listing.confirm_delivery')}</span>
                      </button>
                      <button 
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-neutral-800 text-red-500 border border-red-100 dark:border-red-900/30 py-3 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>{t('listing.raise_dispute')}</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href={`tel:${listing.contact.phone}`}
                      className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{t('listing.call')}</span>
                    </a>
                    <button 
                      onClick={() => navigate(`/messages?listingId=${listing.id}`)}
                      className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('listing.chat')}</span>
                    </button>
                  </div>

                  {listing.contact.whatsapp && (
                    <a 
                      href={`https://wa.me/${listing.contact.whatsapp.replace(/\+/g, '')}?text=Hi, I'm interested in your listing: ${listing.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{t('listing.whatsapp')}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Seller Actions */}
              {user?.uid === listing.authorId && (
                <div className="space-y-3">
                  <Link 
                    to={`/promote/${listing.id}`}
                    className="w-full flex items-center justify-center space-x-2 bg-secondary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20"
                  >
                    <Zap className="w-5 h-5" />
                    <span>{t('listing.boost')}</span>
                  </Link>
                   <button 
                    onClick={() => setShowManageModal(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer"
                  >
                    <Settings className="w-5 h-5" />
                    <span>{t('listing.manage')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl p-6 border border-yellow-100 dark:border-yellow-900/20 transition-colors">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-4 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" />
              {t('listing.safety_tips')}
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300/80 space-y-3">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>{t('listing.safety_tip_1')}</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="font-bold text-red-600 dark:text-red-400">{t('listing.safety_tip_2')}</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>{t('listing.safety_tip_3')}</span>
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>{t('listing.safety_tip_4')}</span>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-yellow-200 dark:border-yellow-900/30">
              <Link to="/safety" className="text-xs font-bold text-yellow-800 dark:text-yellow-200 hover:underline flex items-center">
                {t('listing.view_safety')} <ChevronRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Listing Modal */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManageModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {showDeleteConfirm ? (
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Listing Permanently?</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                      Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white font-semibold">"{listing?.title}"</strong>? This action is absolutely irreversible and will remove all associated details, files, and statistics from HudumaLink Ke entirely.
                    </p>
                  </div>
                  <div className="flex w-full gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteListing}
                      disabled={updatingManage}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/10"
                    >
                      {updatingManage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                        </>
                      ) : (
                        "Yes, Delete Listing"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/30">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-primary" /> {t('listing.manage')}
                    </h3>
                    <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                      <CloseIcon className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateListing} className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Listing Title</label>
                      <input
                        type="text"
                        required
                        value={manageTitle}
                        onChange={(e) => setManageTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                        placeholder="Enter short, description title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                      <textarea
                        rows={3}
                        required
                        value={manageDescription}
                        onChange={(e) => setManageDescription(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                        placeholder="Provide details about your service/product"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-400" /> Price (KES)
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={managePrice}
                          onChange={(e) => setManagePrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                          placeholder="e.g. 500"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Specify 0 if price is negotiable</span>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                          <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-gray-400" /> Original Price (Was)</span>
                          {manageOriginalPrice && managePrice && parseFloat(manageOriginalPrice) > parseFloat(managePrice) && (
                            <span className="text-[10px] bg-red-500/10 text-red-600 font-extrabold px-1.5 py-0.5 rounded">
                              -{Math.round(((parseFloat(manageOriginalPrice) - parseFloat(managePrice)) / parseFloat(manageOriginalPrice)) * 100)}%
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={manageOriginalPrice}
                          onChange={(e) => setManageOriginalPrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                          placeholder="Price before discount (optional)"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Sets a "Was" price for discount calculation</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {listing?.type === 'product' ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                            <Box className="w-4 h-4 mr-1 text-gray-400" /> Stock Quantity (Restock)
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={manageStock}
                            onChange={(e) => setManageStock(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                            placeholder="e.g. 10"
                          />
                          <span className="text-[10px] text-gray-500 mt-1 block">Current stock quantity</span>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                            <Layers className="w-4 h-4 mr-1 text-gray-400" /> Stock Status
                          </label>
                          <select
                            value={manageStatus === 'sold' ? 'sold' : 'active'}
                            onChange={(e) => setManageStatus(e.target.value as any)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                          >
                            <option value="active">Available (Active)</option>
                            <option value="sold">Fully Booked / Sold Out</option>
                          </select>
                          <span className="text-[10px] text-gray-500 mt-1 block">Toggle service booking status</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                          <Tag className="w-4 h-4 mr-1 text-gray-400" /> Special Offer / Deal
                        </label>
                        <input
                          type="text"
                          value={manageOfferText}
                          onChange={(e) => setManageOfferText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                          placeholder="e.g. SAVE20, Promo, or Buy 2 Get 1 Free"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Add deal guidelines or coupon code</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                        <Gift className="w-4 h-4 mr-1 text-gray-400" /> Free Gift with Purchase (Optional)
                      </label>
                      <input
                        type="text"
                        value={manageGiftText}
                        onChange={(e) => setManageGiftText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                        placeholder="e.g. Free protective case & high-quality charger"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Describe the free item buyers will receive with this purchase</span>
                    </div>

                    {/* Image Manager Section */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Listing Images</label>
                      
                      {/* Current image grid */}
                      {manageImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {manageImages.map((imgUrl, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-neutral-800 group shadow-sm">
                              <img src={imgUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setManageImages(prev => prev.filter((_, idx) => idx !== index))}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Selected/new files list */}
                      {newImageFiles.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-bold text-primary flex items-center">
                            <Upload className="w-3.5 h-3.5 mr-1" /> Pending uploads ({newImageFiles.length}):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {newImageFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full border border-gray-200/50 dark:border-neutral-700">
                                <span className="truncate max-w-[120px]">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => setNewImageFiles(prev => prev.filter((_, i) => i !== idx))}
                                  className="ml-1.5 font-bold hover:text-red-500 cursor-pointer"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Standard file selector upload zone */}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-neutral-800 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-100 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/30 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 mb-1 text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Click to select new good/service images</p>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) {
                                const filesArray = Array.from(e.target.files);
                                setNewImageFiles(prev => [...prev, ...filesArray]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Upload beautiful, high-resolution photos of your item. Deleting an image is committed on saving changes.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Listing Status</label>
                      <div className="grid grid-cols-3 gap-2 col-span-2">
                        {(['active', 'sold', 'removed'] as const).map((statusVal) => (
                          <button
                            key={statusVal}
                            type="button"
                            onClick={() => setManageStatus(statusVal)}
                            className={cn(
                              "py-2.5 rounded-xl text-xs font-bold border capitalize transition-all cursor-pointer",
                              manageStatus === statusVal
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-gray-200 dark:border-neutral-800 bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800/40"
                            )}
                          >
                            {statusVal === 'removed' ? 'Hidden/Draft' : statusVal}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-100 dark:border-orange-900/15">
                        <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed flex gap-2">
                          <Info className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                          <span>Adjusting the price is immediate. Make sure to communicate with running quote buyers if prices change during escrow verification!</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-neutral-850 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={updatingManage}
                        className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Permanent Delete
                      </button>

                      <div className="flex-1 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowManageModal(false)}
                          className="px-5 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatingManage}
                          className="px-6 py-3 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/10"
                        >
                          {updatingManage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
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
                  <AlertTriangle className="w-5 h-5 mr-2 text-secondary" /> {t('listing.report_title')}
                </h3>
                <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.report_reason')}</label>
                  <select 
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">{t('listing.select_reason')}</option>
                    <option value="scam">{t('listing.scam')}</option>
                    <option value="prohibited">{t('listing.prohibited')}</option>
                    <option value="misleading">{t('listing.misleading')}</option>
                    <option value="duplicate">{t('listing.duplicate')}</option>
                    <option value="offensive">{t('listing.offensive')}</option>
                    <option value="other">{t('listing.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.additional_details')}</label>
                  <textarea 
                    rows={4}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder={t('listing.report_placeholder')}
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
                        {t('common.submitting')}
                      </>
                    ) : (
                      t('listing.submit_report')
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
                  <Shield className="w-5 h-5 mr-2 text-primary" /> {t('listing.dispute_title')}
                </h3>
                <button onClick={() => setShowDisputeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleDispute} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.dispute_reason')}</label>
                  <select 
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">{t('listing.select_reason')}</option>
                    <option value="not_received">{t('listing.not_received')}</option>
                    <option value="not_as_described">{t('listing.not_as_described')}</option>
                    <option value="poor_quality">{t('listing.poor_quality')}</option>
                    <option value="incomplete">{t('listing.incomplete')}</option>
                    <option value="other">{t('listing.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.additional_details')}</label>
                  <textarea 
                    required
                    rows={4}
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    placeholder={t('listing.report_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.upload_evidence')}</label>
                  <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={(e) => setDisputeEvidence(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{t('listing.upload_desc')}</p>
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
                        {t('common.submitting')}
                      </>
                    ) : (
                      t('listing.raise_dispute')
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
                  <CloseIcon className="w-5 h-5 mr-2 text-red-500" /> {t('listing.cancel_title')}
                </h3>
                <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCancelOrder} className="p-6 space-y-4">
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/20 text-xs text-red-700 dark:text-red-400">
                  <p className="font-bold mb-1">{t('common.warning')}:</p>
                  <p>{t('listing.cancel_warning')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('listing.cancel_reason')}</label>
                  <select 
                    required
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  >
                    <option value="">{t('listing.select_reason')}</option>
                    <option value="change_of_mind">{t('listing.change_mind')}</option>
                    <option value="found_better_price">{t('listing.better_price')}</option>
                    <option value="seller_not_responding">{t('listing.no_response')}</option>
                    <option value="delivery_delay">{t('listing.delivery_delay')}</option>
                    <option value="other">{t('listing.other')}</option>
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
                        {t('common.submitting')}
                      </>
                    ) : (
                      t('listing.confirm_cancel')
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Tip Modal */}
      <AnimatePresence>
        {showTipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('listing.tip_amount')}</h2>
                <button onClick={() => setShowTipModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KES</span>
                  <input
                    type="number"
                    autoFocus
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all text-xl font-bold"
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setTipAmount(val);
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowTipModal(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Tip Modal */}
      <AnimatePresence>
        {showTipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t('listing.tip_amount')}</h2>
                <button onClick={() => setShowTipModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">KES</span>
                  <input
                    type="number"
                    autoFocus
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all text-xl font-bold"
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) setTipAmount(val);
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowTipModal(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListingDetail;
