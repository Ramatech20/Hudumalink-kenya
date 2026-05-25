import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Listing, User } from '../types';
import { formatPrice, formatDate } from '../lib/utils';
import { releaseEscrowFunds } from '../services/paymentService';
import { ShieldCheck, Package, Clock, CheckCircle2, AlertTriangle, ArrowLeft, MessageCircle, Phone, MapPin, Truck, Loader2, Info } from 'lucide-react';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        let txDoc;
        try {
          txDoc = await getDoc(doc(db, 'transactions', id));
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `transactions/${id}`);
          throw error;
        }
        
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
            try {
              const listingDoc = await getDoc(doc(db, 'listings', txData.listingId));
              if (listingDoc.exists()) {
                setListing({ id: listingDoc.id, ...listingDoc.data() } as Listing);
              }
            } catch (error: any) {
              handleFirestoreError(error, OperationType.GET, `listings/${txData.listingId}`);
            }
          }

          // Fetch other user info
          const otherUserId = user.uid === txData.buyerId ? txData.sellerId : txData.buyerId;
          try {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
              setOtherUser(otherUserDoc.data() as User);
            }
          } catch (error: any) {
            handleFirestoreError(error, OperationType.GET, `users/${otherUserId}`);
          }
        } else {
          toast.error('Transaction not found');
          navigate('/dashboard');
        }
      } catch (error: any) {
        if (!error.operationType) {
          console.error('Error fetching transaction:', error);
          toast.error('Failed to load transaction details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleConfirmDelivery = async () => {
    if (!transaction) return;
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
    released: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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
                onClick={() => navigate(`/messages?chatId=${transaction.id}`)}
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
