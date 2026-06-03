import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection, onSnapshot, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { Transaction, Listing, User } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { releaseEscrowFunds } from '../services/paymentService';
import { uploadWithFallback } from '../lib/upload-helper';
import { ShieldCheck, Package, Clock, CheckCircle2, AlertTriangle, ArrowLeft, MessageCircle, Phone, MapPin, Truck, Loader2, Info, ShieldAlert, CheckCircle, Upload, CheckCircle2 as Checked, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

const TransactionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Dispute resolution flow enhancements
  const [dispute, setDispute] = useState<any | null>(null);
  const [submittingSay, setSubmittingSay] = useState(false);
  const [sellerSayText, setSellerSayText] = useState('');
  const [sellerSayEvidence, setSellerSayEvidence] = useState<File | null>(null);

  // Buyer Ratings & Reviews feedback states
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (!id || !user) return;
    const disputesRef = collection(db, 'disputes');
    const q = query(disputesRef, where('transactionId', '==', id), limit(1));
    const unsubDispute = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const disputeDoc = snapshot.docs[0];
        setDispute({ id: disputeDoc.id, ...disputeDoc.data() });
      } else {
        setDispute(null);
      }
    });
    return () => unsubDispute();
  }, [id, user]);

  const handleSellerSubmitSay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute || !user || !sellerSayText) return;
    setSubmittingSay(true);

    try {
      let finalEvidenceUrl = '';
      if (sellerSayEvidence) {
        toast.info('Uploading supporting evidence...');
        finalEvidenceUrl = await uploadWithFallback(`disputes/${transaction?.id}/seller_${Date.now()}_${sellerSayEvidence.name}`, sellerSayEvidence);
      }

      await updateDoc(doc(db, 'disputes', dispute.id), {
        sellerResponse: sellerSayText,
        sellerEvidenceUrls: finalEvidenceUrl ? [finalEvidenceUrl] : [],
        sellerRespondedAt: new Date().toISOString(),
        status: 'seller_responded'
      });

      // Notify Buyer
      if (transaction?.buyerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: transaction.buyerId,
          title: '⚖️ Dispute Update: Seller has responded',
          message: `The seller/provider has submitted their response statement in the active dispute. The Administration will review both arguments shortly.`,
          type: 'info',
          link: `/profile`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      // Simulated email notification
      console.log(`[SMTP SIMULATOR] Sent dispute response submission email to Buyer (${transaction?.buyerId}) and Administrator.`);

      toast.success('Your statement was submitted successfully! Admin review in progress.');
      setSellerSayText('');
      setSellerSayEvidence(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `disputes/${dispute.id}`);
    } finally {
      setSubmittingSay(false);
    }
  };

  useEffect(() => {
    if (!id || !user) return;
    setLoading(true);

    const unsubscribe = onSnapshot(doc(db, 'transactions', id), async (txDoc) => {
      try {
        if (txDoc.exists()) {
          const txData = { id: txDoc.id, ...txDoc.data() } as Transaction;
          
          // Security check: only buyer or seller can view
          if (txData.buyerId !== user.uid && txData.sellerId !== user.uid) {
            toast.error('Unauthorized access');
            navigate('/dashboard');
            return;
          }
          
          setTransaction(txData);

          // Fetch listing
          if (txData.listingId === 'multi_order_cart') {
            const txItems = (txData as any).items || [];
            const isService = (txData as any).type === 'service';
            setListing({
              id: 'multi_order_cart',
              title: (txData as any).listingTitle || `${txItems.length} items from seller`,
              price: txData.amount,
              images: [txItems[0]?.image || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=300'],
              status: 'active',
              type: isService ? 'service' : 'product',
              authorId: txData.sellerId,
              authorName: (txData as any).sellerName || 'Vendor',
              location: { county: 'Nairobi', subcounty: 'CBD' }
            } as any);
          } else {
            const listingDoc = await getDoc(doc(db, 'listings', txData.listingId));
            if (listingDoc.exists()) {
              setListing({ id: listingDoc.id, ...listingDoc.data() } as Listing);
            }
          }

          // Fetch other user info
          const otherUserId = user.uid === txData.buyerId ? txData.sellerId : txData.buyerId;
          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          if (otherUserDoc.exists()) {
            setOtherUser(otherUserDoc.data() as User);
          }
        } else {
          toast.error('Transaction not found');
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Error fetching transaction updater:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `transactions/${id}`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, user, navigate]);

  const simulateClientSidePayment = async () => {
    if (!id || !transaction) return;
    const generatedReceipt = 'MOCK' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    const { doc, updateDoc, collection, addDoc } = await import('firebase/firestore');
    
    await updateDoc(doc(db, 'transactions', id), {
      status: 'deposited',
      updatedAt: new Date().toISOString(),
      mpesaReceiptNumber: generatedReceipt
    });

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: transaction.buyerId,
        title: 'Payment Successful (Sandbox Simulation)',
        message: `Your simulated payment of KES ${transaction.amount} has been deposited into Escrow.`,
        type: 'success',
        read: false,
        link: `/profile`,
        createdAt: new Date().toISOString()
      });

      if (transaction.sellerId) {
        await addDoc(collection(db, 'notifications'), {
          userId: transaction.sellerId,
          title: 'Payment Deposited (Sandbox Simulation)',
          message: `A simulated payment of KES ${transaction.amount} has been deposited into Escrow for your listing.`,
          type: 'success',
          read: false,
          link: `/profile`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (notifErr) {
      console.warn('Simulation notification skipped:', notifErr);
    }

    toast.success('Simulation completed! Payment deposited.');
  };

  const handleSimulatePayment = async () => {
    if (!id) return;
    setSimulating(true);
    try {
      const response = await fetch('/api/mpesa/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('M-Pesa payment simulation successful! Status updated.');
      } else {
        console.warn('Backend payment simulation callback failed, executing direct client-side fallback update:', data.error);
        await simulateClientSidePayment();
      }
    } catch (err: any) {
      console.warn('Backend payment simulation network error, executing direct client-side fallback update:', err);
      try {
        await simulateClientSidePayment();
      } catch (fallbackErr: any) {
        console.error('Client-side fallback simulation failed:', fallbackErr);
        toast.error('Network error during sandbox payment simulation.');
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!transaction) return;
    if (user && !user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to confirm delivery.');
      return;
    }
    setProcessing(true);
    try {
      const success = await releaseEscrowFunds(transaction.id);
      if (success) {
        setTransaction(prev => prev ? { ...prev, status: 'released' } : null);
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleLeaveTransactionReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !listing || !user || rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      // 1. Save to reviews collection
      const reviewData = {
        authorId: user.uid,
        targetId: transaction.sellerId,
        rating: rating,
        comment: comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);

      // 2. Fetch seller profile to update overall rating/reviewCount
      const sellerRef = doc(db, 'users', transaction.sellerId);
      const sellerDoc = await getDoc(sellerRef);
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        const newReviewCount = (sellerData.reviewCount || 0) + 1;
        const newRatingVal = ((sellerData.rating || 0) * (sellerData.reviewCount || 0) + rating) / newReviewCount;
        await updateDoc(sellerRef, {
          rating: parseFloat(newRatingVal.toFixed(1)),
          reviewCount: newReviewCount
        });
      }

      // 3. Mark the transaction as reviewed
      await updateDoc(doc(db, 'transactions', transaction.id), {
        reviewSubmitted: true,
        reviewRating: rating,
        reviewComment: comment,
        updatedAt: new Date().toISOString()
      });

      // 4. Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: transaction.sellerId,
        title: 'New Review Received!',
        message: `${user.displayName || 'A buyer'} left you a ${rating}-star review for "${listing.title}".`,
        type: 'info',
        read: false,
        link: `/listing/${listing.id}`,
        createdAt: new Date().toISOString()
      });

      toast.success('Your review has been saved successfully!');
      setTransaction(prev => prev ? { ...prev, reviewSubmitted: true, reviewRating: rating, reviewComment: comment } : null);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transaction || !listing) return null;

  const isBuyer = user?.uid === transaction.buyerId;
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    deposited: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    released: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20',
    disputed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-400'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[transaction.status]}`}>
                  {transaction.status}
                </span>
                <h1 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">Order Details</h1>
                <p className="text-sm text-gray-500 mt-1">Order ID: {transaction.id}</p>
              </div>
              <ShieldCheck className="w-10 h-10 text-primary opacity-20" />
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl mb-8">
              <img 
                src={listing.images[0]} 
                alt={listing.title} 
                className="w-20 h-20 rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{listing.title}</h3>
                <p className="text-primary font-bold">{formatPrice(transaction.amount)}</p>
                {transaction.tipAmount && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-1">
                    Includes {formatPrice(transaction.tipAmount)} tip
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Purchased on {formatDate(transaction.createdAt)}</p>
              </div>
            </div>

            {transaction.listingId === 'multi_order_cart' && (transaction as any).items && (
              <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <div className="bg-gray-50 dark:bg-neutral-800 px-5 py-3 border-b border-gray-100 dark:border-neutral-800">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Cart Items Breakdown ({((transaction as any).items || []).length})</span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-neutral-800 max-h-[300px] overflow-y-auto">
                  {((transaction as any).items || []).map((item: any) => (
                    <div key={item.id} className="p-4 flex items-center justify-between bg-white dark:bg-neutral-900 hover:bg-gray-50/50 dark:hover:bg-neutral-800/20 transition-all">
                      <div className="flex items-center space-x-3">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-gray-100 dark:border-neutral-800" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-400">Qty: {item.quantity || 1} × {formatPrice(item.price || 0)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-gray-950 dark:text-gray-50">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Status Timeline</h2>
              <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-neutral-800">
                <div className="relative pl-10">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900 z-10 ${transaction.status !== 'pending' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Payment Initiated</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>

                {(transaction.status === 'deposited' || transaction.status === 'released' || transaction.status === 'completed') && (
                  <div className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900 z-10 ${transaction.status !== 'deposited' ? 'bg-green-500' : 'bg-primary animate-pulse'}`} />
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Funds in Escrow</p>
                      <p className="text-xs text-gray-500">Securely held by HudumaLink</p>
                    </div>
                  </div>
                )}

                {(transaction.status === 'released' || transaction.status === 'completed') && (
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900 z-10 bg-green-500" />
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Funds Released</p>
                      <p className="text-xs text-gray-500">Transaction completed successfully</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dispute resolution progression dashboard */}
          {dispute && (
            <div className="bg-white dark:bg-neutral-900 border border-red-100 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <h3 className="text-lg font-black uppercase tracking-wider">Active Dispute Resolution Portal</h3>
              </div>

              {isBuyer && (
                <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/10 dark:border-neutral-800 p-4 rounded-2xl text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                  <p className="font-extrabold text-red-500 uppercase tracking-widest text-[9px] mb-0.5">Status Update:</p>
                  The dispute is under review. You will be contacted for more details or in case of a verdict.
                </div>
              )}

              <div className="bg-red-50/50 dark:bg-red-950/10 p-5 rounded-2xl border border-red-100/30">
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-400 block pb-1">DISPUTE STATUS</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded font-extrabold uppercase text-[11px] border border-red-200">
                      {dispute.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block pb-1">RAISED ON</span>
                    <span className="text-gray-950 dark:text-gray-50 font-bold">
                      {formatDate(dispute.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step By Step Interactive Flow Representation */}
              <div className="space-y-8 border-l border-gray-100 dark:border-neutral-800 pl-6 ml-2">
                
                {/* Step 1: Buyer claim */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-red-500" />
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Step 1: Buyer Claim Submitted</p>
                  <p className="text-xs text-gray-500 font-medium">Reason: <span className="text-red-600 dark:text-red-400 font-bold">{dispute.reason}</span></p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl mt-1">
                    "{dispute.details}"
                  </p>
                  {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Buyer Supporting Evidence</p>
                      <div className="flex gap-2">
                        {dispute.evidenceUrls.map((url: string, idx: number) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-100 dark:border-neutral-800 hover:opacity-80 transition-opacity">
                            <img src={url} alt="Buyer Evidence" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Admin validation */}
                <div className="relative space-y-2">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${
                    dispute.status !== 'open' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Step 2: Administrative Review & Confirmation</p>
                  {dispute.status === 'open' ? (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-xl col">
                      ⌛ Waiting for platform administrator to confirm the dispute. The escrow balance is safely frozen.
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 dark:text-green-400 bg-green-500/5 dark:bg-green-950/20 p-3 rounded-xl border border-green-500/10">
                      ✓ Admin has confirmed this claim. The dispute details are now routed to the provider for their statement.
                    </p>
                  )}
                </div>

                {/* Step 3: Provider rebuttal */}
                <div className="relative space-y-2">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${
                    dispute.sellerResponse ? 'bg-green-500' : (dispute.status === 'seller_say_pending' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300')
                  }`} />
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Step 3: Service Provider Reply Statement</p>
                  
                  {dispute.sellerResponse ? (
                    <div className="space-y-2 mt-1">
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Statement submitted on {dispute.sellerRespondedAt ? formatDate(dispute.sellerRespondedAt) : 'recently'}:
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl">
                        "{dispute.sellerResponse}"
                      </p>
                      {dispute.sellerEvidenceUrls && dispute.sellerEvidenceUrls.length > 0 && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Provider Supporting Evidence</p>
                          <div className="flex gap-2">
                            {dispute.sellerEvidenceUrls.map((url: string, idx: number) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-100 dark:border-neutral-800 hover:opacity-80 transition-opacity">
                                <img src={url} alt="Seller Evidence" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 mt-1">
                      {dispute.status === 'seller_say_pending' ? (
                        <>
                          {user?.uid === transaction?.sellerId ? (
                            <form onSubmit={handleSellerSubmitSay} className="space-y-3 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-2xl border border-yellow-250 dark:border-neutral-800 mt-2">
                              <p className="text-xs font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wider flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" /> Action Required: Submit Your Say
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                Provide your version of events and upload supporting documents (e.g. photos, tracking details, or screenshots of chats) below.
                              </p>
                              <textarea
                                required
                                value={sellerSayText}
                                onChange={(e) => setSellerSayText(e.target.value)}
                                placeholder="Describe details of service execution or product shipment..."
                                className="w-full p-4 text-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl outline-none focus:border-red-500 text-gray-900 dark:text-gray-50"
                                rows={3}
                              />
                              <div>
                                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Supporting Attachment Image</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files && setSellerSayEvidence(e.target.files[0])}
                                  className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={submittingSay}
                                className="w-full py-3 bg-red-650 hover:bg-red-700 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center space-x-2"
                              >
                                {submittingSay ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Official Statement</span>}
                              </button>
                            </form>
                          ) : (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-xl">
                              ⌛ Seller has been requested to submit their defense statement. The provider is allowed up to 48 hours to submit statements before the admin rules on a verdict.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-gray-450 italic bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-800">
                          Waiting for administrative review.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 4: Admin final verdict */}
                <div className="relative space-y-2">
                  <div className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full ${
                    dispute.status === 'resolved' || dispute.status === 'refunded' ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                  <p className="font-bold text-sm text-gray-900 dark:text-white">Step 4: Platform Ruling & Resolution</p>
                  
                  {dispute.status === 'resolved' || dispute.status === 'refunded' ? (
                    <div className="space-y-4 bg-primary/5 border border-primary/20 p-5 rounded-2xl mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-400">ADMINISTRATIVE VERDICT</span>
                        <span className="px-3 py-1 bg-primary text-white font-black uppercase rounded text-[10px] tracking-widest leading-none border">
                          {dispute.resolution || 'Resolved'}
                        </span>
                      </div>
                      
                      {dispute.adminVerdictNotes && (
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verdict Explanation & Illustrations:</p>
                          <p className="text-xs text-gray-850 dark:text-gray-200 mt-1.5 p-4 bg-white dark:bg-neutral-900 border border-primary/10 rounded-xl leading-relaxed whitespace-pre-wrap">
                            {dispute.adminVerdictNotes}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest pt-2 border-t border-primary/10">
                        ⚖️ Decision officially delivered to both parties via Email and In-App notification logs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 italic">
                        The platform Administrator is meditating. Platform rules stipulate that there can be a phone call, messages, or a WhatsApp chat before a final verdict is submitted.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a href={`tel:+254700000000`} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                          <Phone className="w-3.5 h-3.5" /> Speak to Resolution Rep
                        </a>
                        <a href={`https://wa.me/254700000000`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Dispute Mediate
                        </a>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {transaction.status === 'pending' && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-3xl p-8 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">M-Pesa Sandbox Intermission</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                    Safaricom's Sandbox environment does not trigger real physical payment prompts on unregistered phone numbers. 
                    To continue testing your marketplace flow with escrow and delivery verification, click the simulator button below to mock a successful payment confirm trigger!
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-neutral-900 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {simulating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 animate-pulse" />
                    <span>Simulate Successful M-Pesa Payment Callback</span>
                  </>
                )}
              </button>
            </div>
          )}

          {isBuyer && transaction.status === 'deposited' && (
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Confirm Delivery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Please confirm only after you have received the item or the service has been completed to your satisfaction.
                  </p>
                </div>
              </div>
              <button 
                onClick={handleConfirmDelivery}
                disabled={processing}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm & Release Funds'}
              </button>
              <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">
                HudumaLink Escrow Protection Active
              </p>
            </div>
          )}

          {/* Rate Experience & Buy Again / Hire Again segment */}
          {isBuyer && (transaction.status === 'released' || transaction.status === 'completed') && (
            <div className="bg-white dark:bg-neutral-900 border border-emerald-500/10 dark:border-neutral-800 rounded-3xl p-8 space-y-6 shadow-sm animate-fadeIn">
              <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-lg font-black uppercase tracking-wider">Order Completed Successfully</h3>
              </div>

              {((transaction as any).reviewSubmitted || transaction.reviewSubmitted) ? (
                <div className="space-y-6">
                  {/* Thank You Note */}
                  <div className="p-6 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15 dark:border-emerald-500/25 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <p className="text-sm font-extrabold text-emerald-950 dark:text-emerald-305">
                      {listing.type === 'service' 
                        ? 'Thank you for hiring with Huduma Link KE!' 
                        : 'Thank you for shopping with Huduma Link KE!'}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Your rating and feedback have been successfully relayed to the provider. It helps build trust in our community.
                    </p>
                  </div>

                  {/* Buy / Hire Again buttons */}
                  <div className="pt-2">
                    <Link
                      to={`/listing/${listing.id}`}
                      className="w-full h-12 flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-md shadow-emerald-500/10"
                    >
                      <span>
                        {listing.type === 'service' ? 'Hire Again' : 'Buy Again'}
                      </span>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLeaveTransactionReview} className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Rate your Experience</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Please leave a rating and review for the seller/provider to complete your overall experience.
                    </p>
                  </div>

                  {/* Star Rating Selectors */}
                  <div className="flex items-center space-x-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transform transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            starVal <= (hoverRating || rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-350 uppercase">Write a Brief Review</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience working with this seller..."
                      required
                      rows={3}
                      className="w-full p-4 text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-150 dark:border-neutral-800 rounded-xl outline-none focus:border-primary text-gray-900 dark:text-gray-50 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview || rating === 0}
                    className="w-full bg-primary text-white py-3 rounded-2xl font-bold hover:bg-opacity-95 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
              {isBuyer ? 'Seller Details' : 'Buyer Details'}
            </h3>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                {otherUser?.photoURL ? (
                  <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-400">{otherUser?.displayName?.[0]}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{otherUser?.displayName}</p>
                <p className="text-xs text-gray-500 capitalize">{otherUser?.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  if (user && !user.emailVerified && !auth.currentUser?.emailVerified) {
                    toast.error('Please verify your email address to chat with providers/sellers.');
                    return;
                  }
                  navigate(`/messages?chatId=${transaction.id}`);
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
              <a 
                href={`tel:${otherUser?.phoneNumber}`}
                className="w-full flex items-center justify-center space-x-2 border border-gray-100 dark:border-neutral-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </a>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-3xl p-6 border border-yellow-100 dark:border-yellow-900/30">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Need Help?
            </h3>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed mb-4">
              If there is an issue with your order, try to resolve it with the {isBuyer ? 'seller' : 'buyer'} first. If you can't reach an agreement, you can raise a dispute.
            </p>
            <button className="text-xs font-bold text-yellow-800 dark:text-yellow-200 underline">
              Learn about our dispute process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
