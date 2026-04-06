import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError, handleValidationError } from '../lib/error-handler';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, runTransaction, increment, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Listing, User, Transaction } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Package, Briefcase, Star, MapPin, Edit3, ShieldCheck, Trash2, Camera, Loader2, Zap, Gift, Shield, TrendingUp, ShoppingBag, Truck, ChevronRight, CheckCircle2, Clock, X, Wallet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { KENYAN_COUNTIES, TOWNS } from '../constants';

const Profile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myOrders, setMyOrders] = useState<Transaction[]>([]);
  const [myWithdrawals, setMyWithdrawals] = useState<any[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBecomeProviderModal, setShowBecomeProviderModal] = useState(false);
  const [showGiveUpProviderModal, setShowGiveUpProviderModal] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [giveUpReason, setGiveUpReason] = useState('');
  const [giveUpConsent, setGiveUpConsent] = useState(false);
  const [submittingRoleChange, setSubmittingRoleChange] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [withdrawDetails, setWithdrawDetails] = useState({ phoneNumber: '', bankName: '', accountNumber: '' });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    county: user?.location?.county || '',
    town: user?.location?.town || '',
    lat: user?.location?.lat || undefined as number | undefined,
    lng: user?.location?.lng || undefined as number | undefined,
    role: user?.role || 'customer',
    photoURL: user?.photoURL || '',
    completedPaymentsCount: (user as any).completedPaymentsCount || 0,
    dob: user?.dob || '',
    countyOfBirth: user?.countyOfBirth || '',
    residence: user?.residence || '',
    area: user?.area || '',
    gender: user?.gender || '' as any,
    occupation: user?.occupation || ''
  });

  const handleBecomeProvider = async () => {
    if (!user || !agreeToTerms) return;
    setSubmittingRoleChange(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'provider'
      });
      toast.success('Congratulations! You are now a Provider. You can now post listings.');
      setEditData(prev => ({ ...prev, role: 'provider' }));
      setShowBecomeProviderModal(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSubmittingRoleChange(false);
    }
  };

  const handleGiveUpProvider = async () => {
    if (!user || !giveUpConsent) return;
    setSubmittingRoleChange(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'customer'
      });
      
      // Hide all their listings
      const listingsQ = query(collection(db, 'listings'), where('authorId', '==', user.uid));
      const listingsSnapshot = await getDocs(listingsQ);
      const batchPromises = listingsSnapshot.docs.map(listingDoc => 
        updateDoc(doc(db, 'listings', listingDoc.id), { status: 'hidden' })
      );
      await Promise.all(batchPromises);

      toast.success('Your account has been converted back to a Customer account.');
      setEditData(prev => ({ ...prev, role: 'customer' }));
      setShowGiveUpProviderModal(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSubmittingRoleChange(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.uid) return;
      try {
        // Fetch Listings
        const listingsQ = query(collection(db, 'listings'), where('authorId', '==', user.uid));
        let listingsSnapshot;
        try {
          listingsSnapshot = await getDocs(listingsQ);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.LIST, 'listings');
          throw error;
        }
        setMyListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

        // Fetch Orders (Transactions as Buyer)
        const ordersQ = query(collection(db, 'transactions'), where('buyerId', '==', user.uid));
        let ordersSnapshot;
        try {
          ordersSnapshot = await getDocs(ordersQ);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.LIST, 'transactions');
          throw error;
        }
        setMyOrders(ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));

        // Fetch Withdrawals
        const withdrawalsQ = query(
          collection(db, 'withdrawals'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        let withdrawalsSnapshot;
        try {
          withdrawalsSnapshot = await getDocs(withdrawalsQ);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.LIST, 'withdrawals');
          throw error;
        }
        setMyWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error: any) {
        if (!error.operationType) {
          handleFirestoreError(error, OperationType.LIST, 'profile_data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const MAX_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_SIZE) {
      toast.error('Image is too large. Max size is 3MB.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      const uploadPromise = uploadBytes(storageRef, file);
      
      // Add a timeout to the upload
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timed out. Please check your connection.')), 30000)
      );

      const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
      if (!snapshot) throw new Error('Upload failed');

      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setEditData(prev => ({ ...prev, photoURL: downloadURL }));
      
      // If not in editing mode, update immediately
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: downloadURL
        });
        toast.success('Profile picture updated!');
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        throw error;
      }
    } catch (error: any) {
      handleGeneralError(error, 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setEditData(prev => ({
              ...prev,
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }));
            resolve(position);
          },
          (error) => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }),
      {
        loading: 'Getting your location...',
        success: 'Location captured successfully!',
        error: 'Failed to get location. Please ensure location access is enabled.'
      }
    );
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editData.displayName,
        phoneNumber: editData.phoneNumber,
        location: {
          county: editData.county,
          town: editData.town,
          lat: editData.lat,
          lng: editData.lng
        },
        role: editData.role,
        photoURL: editData.photoURL,
        dob: editData.dob,
        countyOfBirth: editData.countyOfBirth,
        residence: editData.residence,
        area: editData.area,
        gender: editData.gender,
        occupation: editData.occupation
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    const fee = withdrawMethod === 'mpesa' ? 15 : 50;
    const totalToDeduct = amount + fee;

    if (totalToDeduct > ((user as any).escrowBalance || 0)) {
      handleValidationError(`Insufficient balance. You need ${formatPrice(totalToDeduct)} (including ${formatPrice(fee)} fee)`);
      return;
    }

    if (amount < 100) {
      handleValidationError('Minimum withdrawal is KES 100');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Use a transaction to ensure balance is deducted and withdrawal is recorded
      try {
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User not found");
          
          const currentBalance = userDoc.data().escrowBalance || 0;
          if (currentBalance < totalToDeduct) throw new Error("Insufficient balance");

          // 1. Deduct from balance
          transaction.update(userRef, {
            escrowBalance: increment(-totalToDeduct)
          });

          // 2. Add withdrawal record
          const withdrawalRef = doc(collection(db, 'withdrawals'));
          transaction.set(withdrawalRef, {
            userId: user.uid,
            userName: user.displayName,
            amount,
            fee,
            totalDeducted: totalToDeduct,
            method: withdrawMethod,
            details: withdrawMethod === 'mpesa' 
              ? { phoneNumber: withdrawDetails.phoneNumber }
              : { bankName: withdrawDetails.bankName, accountNumber: withdrawDetails.accountNumber },
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.WRITE, 'withdrawals');
        throw error;
      }
      
      toast.success('Withdrawal request submitted! Funds have been moved to pending.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error: any) {
      if (!error.operationType) {
        handleGeneralError(error, 'Failed to submit withdrawal');
      }
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* KYC Banner */}
      {user && (user.role === 'provider' || user.role === 'seller') && user.kycStatus !== 'verified' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[2.5rem] border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/5"
        >
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="p-4 bg-primary text-white rounded-3xl shadow-lg shadow-primary/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t('profile.kyc_banner_title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                {t('profile.kyc_banner_desc').replace('{count}', '5')}
              </p>
            </div>
          </div>
          <Link 
            to="/kyc" 
            className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20 text-center"
          >
            {user.kycStatus === 'pending' ? t('profile.kyc_pending') : t('profile.kyc_verify_now')}
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm text-center transition-colors">
            <div className="relative inline-block mb-4 group">
              <div className="relative w-24 h-24 mx-auto">
                {uploading ? (
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center border-4 border-gray-50 dark:border-neutral-800">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : user.photoURL || editData.photoURL ? (
                  <img src={editData.photoURL || user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 dark:border-neutral-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 dark:text-gray-500 border-4 border-gray-50 dark:border-neutral-800 transition-colors">
                    <Star className="w-10 h-10" />
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full border-2 border-white dark:border-neutral-900 shadow-lg hover:scale-110 transition-transform"
                  title="Max size: 3MB"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {user.isVerified && (
                <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white dark:border-neutral-900">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.displayName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
            
            {user.role === 'customer' && !user.isVerified && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">{t('profile.verification_progress')}</span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">{(user as any).completedPaymentsCount || 0}/5</span>
                </div>
                <div className="h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500" 
                    style={{ width: `${Math.min(((user as any).completedPaymentsCount || 0) / 5 * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 leading-tight">
                  {t('profile.verification_help')}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center mt-2 text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold ml-1">{user.rating || 'New'}</span>
            </div>

            {user.role !== 'customer' && (
              <Link 
                to="/seller-dashboard"
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary py-3 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{t('profile.view_analytics')}</span>
              </Link>
            )}

            {user.role === 'provider' && (
              <button 
                onClick={() => setShowGiveUpProviderModal(true)}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-red-500/10 text-red-600 py-3 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all"
              >
                <X className="w-4 h-4" />
                <span>{t('profile.give_up_provider')}</span>
              </button>
            )}

            {user.role === 'customer' && (
              <button 
                onClick={() => setShowBecomeProviderModal(true)}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-secondary text-white py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20"
              >
                <Briefcase className="w-4 h-4" />
                <span>{t('profile.become_provider')}</span>
              </button>
            )}

            {/* Referral & Escrow Stats */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-1 gap-4 text-left">
              <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Gift className="w-3 h-3 mr-1" /> {t('profile.referral_code')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{(user as any).referralCode}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText((user as any).referralCode);
                      toast.success('Code copied!');
                    }}
                    className="text-[10px] text-primary font-bold uppercase hover:underline"
                  >
                    {t('common.copy')}
                  </button>
                </div>
              </div>
              <div className="bg-primary/5 p-4 rounded-2xl">
                <div className="flex items-center text-primary text-xs mb-1 font-bold">
                  <Shield className="w-3 h-3 mr-1" /> {t('profile.escrow_balance')}
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice((user as any).escrowBalance || 0)}
                  </span>
                  <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="text-[10px] text-primary font-bold uppercase hover:underline"
                  >
                    {t('profile.withdraw')}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Funds from completed sales</p>
              </div>
              <div className="bg-secondary/5 p-4 rounded-2xl">
                <div className="flex items-center text-secondary text-xs mb-1 font-bold">
                  <Gift className="w-3 h-3 mr-1" /> {t('profile.referral_earnings')}
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice((user as any).referralEarnings || 0)}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Shield className="w-3 h-3 mr-1" /> {t('profile.kyc_status')}
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-bold uppercase",
                    user.kycStatus === 'verified' ? "text-green-500" : 
                    user.kycStatus === 'pending' ? "text-yellow-500" : 
                    user.kycStatus === 'rejected' ? "text-red-500" : "text-gray-400"
                  )}>
                    {user.kycStatus === 'verified' ? t('profile.kyc_verified') : 
                     user.kycStatus === 'pending' ? t('profile.kyc_pending') :
                     user.kycStatus === 'rejected' ? t('profile.kyc_rejected') : t('profile.kyc_not_verified')}
                  </span>
                  {user.kycStatus !== 'verified' && (
                    <Link to="/kyc" className="text-[10px] text-primary font-bold uppercase hover:underline">
                      {user.kycStatus === 'pending' ? t('common.view') : t('profile.kyc_verify_now')}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 w-full flex items-center justify-center space-x-2 border border-gray-200 dark:border-neutral-800 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>{t('profile.edit_profile')}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Total Listings</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{myListings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Member Since</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{new Date(user.createdAt).getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {isEditing ? (
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 dark:text-gray-100">
                <Edit3 className="w-6 h-6 mr-2 text-primary" /> {t('profile.edit_profile')}
              </h2>
              <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.display_name')}</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.displayName}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.phone_number')}</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.phoneNumber}
                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.county')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.county}
                    onChange={(e) => setEditData({...editData, county: e.target.value, town: ''})}
                  >
                    <option value="" className="dark:bg-neutral-900">{t('profile.county')}</option>
                    {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.town')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.town}
                    onChange={(e) => setEditData({...editData, town: e.target.value})}
                  >
                    <option value="" className="dark:bg-neutral-900">{t('profile.town')}</option>
                    {editData.county && TOWNS[editData.county]?.map(t => <option key={t} value={t} className="dark:bg-neutral-900">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.dob')}</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.dob}
                    onChange={(e) => setEditData({...editData, dob: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.gender')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.gender}
                    onChange={(e) => setEditData({...editData, gender: e.target.value as any})}
                  >
                    <option value="" className="dark:bg-neutral-900">{t('profile.gender')}</option>
                    <option value="male" className="dark:bg-neutral-900">{t('profile.male')}</option>
                    <option value="female" className="dark:bg-neutral-900">{t('profile.female')}</option>
                    <option value="other" className="dark:bg-neutral-900">{t('profile.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.county_of_birth')}</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.countyOfBirth}
                    onChange={(e) => setEditData({...editData, countyOfBirth: e.target.value})}
                  >
                    <option value="" className="dark:bg-neutral-900">{t('profile.county')}</option>
                    {KENYAN_COUNTIES.map(c => <option key={c} value={c} className="dark:bg-neutral-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.occupation')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.occupation}
                    onChange={(e) => setEditData({...editData, occupation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.residence')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Kilimani"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.area}
                    onChange={(e) => setEditData({...editData, area: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.residence_info')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Apartment 4B, Green Court"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                    value={editData.residence}
                    onChange={(e) => setEditData({...editData, residence: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className={cn(
                      "w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all font-bold text-sm",
                      editData.lat ? "bg-green-50 dark:bg-green-900/10 border-green-500 text-green-600" : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    {editData.lat ? t('profile.location_captured') : t('profile.use_location')}
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">{t('profile.location_help')}</p>
                </div>
                <div className="md:col-span-2 flex space-x-4 pt-4">
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all">
                    {t('profile.save_changes')}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all">
                    {t('profile.cancel')}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Listings Management */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100">
                    <Package className="w-6 h-6 mr-2 text-primary" /> {t('profile.my_listings')}
                  </h2>
                  {user.role !== 'customer' && (
                    <Link to="/create-listing" className="text-primary font-bold hover:underline">
                      {t('profile.post_new')}
                    </Link>
                  )}
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 dark:bg-neutral-800 animate-pulse rounded-xl"></div>)}
                  </div>
                ) : myListings.length > 0 ? (
                  <div className="space-y-4">
                    {myListings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary dark:hover:border-primary transition-all">
                        <div className="flex items-center space-x-4">
                          <img src={listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{listing.title}</h3>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mr-2",
                                listing.status === 'active' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400"
                              )}>
                                {listing.status}
                              </span>
                              {listing.isPromoted && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mr-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 flex items-center">
                                  <Zap className="w-3 h-3 mr-1" /> {t('listing.promoted')}
                                </span>
                              )}
                              <span>{formatDate(listing.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {listing.status === 'active' && !listing.isPromoted && (
                            <Link 
                              to={`/promote/${listing.id}`}
                              className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs font-bold hover:bg-yellow-600 transition-colors flex items-center"
                            >
                              <Zap className="w-3 h-3 mr-1" /> {t('profile.promote')}
                            </Link>
                          )}
                          {listing.status === 'active' && (
                            <button 
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, 'listings', listing.id), { status: 'sold' });
                                  setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'sold' } : l));
                                  toast.success('Listing marked as sold!');
                                } catch (error) {
                                  toast.error('Failed to update listing');
                                }
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                            >
                              {t('profile.mark_sold')}
                            </button>
                          )}
                          <Link to={`/listing/${listing.id}`} className="p-2 text-gray-400 hover:text-primary transition-colors">
                            <Edit3 className="w-5 h-5" />
                          </Link>
                          <button 
                            onClick={async () => {
                              if (window.confirm(t('profile.delete_confirm'))) {
                                try {
                                  await updateDoc(doc(db, 'listings', listing.id), { status: 'removed' });
                                  setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: 'removed' } : l));
                                  toast.success('Listing removed');
                                } catch (error) {
                                  toast.error('Failed to remove listing');
                                }
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-secondary transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{t('profile.no_listings')}</p>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-2xl font-bold mb-8 flex items-center text-gray-900 dark:text-gray-100">
                  <Star className="w-6 h-6 mr-2 text-yellow-500" /> {t('profile.reviews_ratings')}
                </h2>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>{t('profile.no_reviews')}</p>
                </div>
              </div>

              {/* Orders & Tracking */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100">
                    <ShoppingBag className="w-6 h-6 mr-2 text-primary" /> {t('profile.my_orders')}
                  </h2>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 dark:bg-neutral-800 animate-pulse rounded-xl"></div>)}
                  </div>
                ) : myOrders.length > 0 ? (
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <div key={order.id} className="p-6 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary dark:hover:border-primary transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                              <Package className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('profile.order_id').replace('{id}', order.id.slice(0, 8))}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.amount')}: {formatPrice(order.amount)} • {formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                              order.status === 'completed' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                              order.status === 'deposited' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                              "bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400"
                            )}>
                              {order.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                              {order.status}
                            </div>
                            
                            {(order as any).delivery && (
                              <div className="flex items-center text-xs font-bold text-secondary">
                                <Truck className="w-4 h-4 mr-1" />
                                <span>{(order as any).delivery.provider}</span>
                              </div>
                            )}
                            
                            <Link to={`/listing/${order.listingId}`} className="p-2 text-gray-400 hover:text-primary transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                        
                        {(order as any).milestones && (
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{t('profile.milestone_progress')}</p>
                            <div className="flex gap-2">
                              {(order as any).milestones.map((m: any, idx: number) => (
                                <div key={idx} className="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                  <div className={cn(
                                    "h-full transition-all",
                                    m.status === 'released' ? "bg-green-500 w-full" :
                                    m.status === 'completed' ? "bg-blue-500 w-full" : "bg-gray-300 dark:bg-neutral-600 w-0"
                                  )} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No orders yet. Start shopping to see your tracking info here!</p>
                  </div>
                )}
              </div>
              {/* Withdrawal History */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-gray-100">
                    <Wallet className="w-6 h-6 mr-2 text-primary" /> Withdrawal History
                  </h2>
                </div>

                {myWithdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {myWithdrawals.map((w) => (
                      <div key={w.id} className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{formatPrice(w.amount)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {w.method === 'mpesa' ? `M-Pesa: ${w.details.phoneNumber}` : `Bank: ${w.details.bankName}`}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{formatDate(w.createdAt)}</p>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                            w.status === 'completed' ? "bg-green-100 text-green-700" :
                            w.status === 'rejected' ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          )}>
                            {w.status}
                          </div>
                        </div>
                        {w.rejectionReason && (
                          <p className="mt-2 text-xs text-red-500 italic">Reason: {w.rejectionReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No withdrawal history yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)}
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
                  <Wallet className="w-5 h-5 mr-2 text-primary" /> Withdraw Funds
                </h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleWithdraw} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (KSh)</label>
                  <input 
                    type="number"
                    required
                    min="100"
                    max={user?.escrowBalance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Available: KSh {user?.escrowBalance?.toLocaleString() || 0}</p>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                      Note: A fee of {withdrawMethod === 'mpesa' ? 'KES 15' : 'KES 50'} applies for {withdrawMethod === 'mpesa' ? 'M-Pesa' : 'Bank'} withdrawals.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Withdrawal Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('mpesa')}
                      className={cn(
                        "py-3 rounded-xl border font-medium transition-all",
                        withdrawMethod === 'mpesa' 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "border-gray-200 dark:border-neutral-800 text-gray-500"
                      )}
                    >
                      M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={cn(
                        "py-3 rounded-xl border font-medium transition-all",
                        withdrawMethod === 'bank' 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "border-gray-200 dark:border-neutral-800 text-gray-500"
                      )}
                    >
                      Bank Transfer
                    </button>
                  </div>
                </div>

                {withdrawMethod === 'mpesa' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">M-Pesa Phone Number</label>
                    <input 
                      type="tel"
                      required
                      value={withdrawDetails.phoneNumber}
                      onChange={(e) => setWithdrawDetails({...withdrawDetails, phoneNumber: e.target.value})}
                      placeholder="e.g. 0712345678"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
                      <input 
                        type="text"
                        required
                        value={withdrawDetails.bankName}
                        onChange={(e) => setWithdrawDetails({...withdrawDetails, bankName: e.target.value})}
                        placeholder="e.g. Equity Bank"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                      <input 
                        type="text"
                        required
                        value={withdrawDetails.accountNumber}
                        onChange={(e) => setWithdrawDetails({...withdrawDetails, accountNumber: e.target.value})}
                        placeholder="Enter account number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submittingWithdraw || !withdrawAmount}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingWithdraw ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Become Provider Modal */}
        {showBecomeProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.become_provider_title')}</h2>
                <button onClick={() => setShowBecomeProviderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-primary/5 rounded-2xl flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.become_provider_confirm')}
                  </p>
                </div>
                
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-neutral-700 checked:bg-primary transition-all"
                    />
                    <CheckCircle2 className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    {t('profile.become_provider_terms').replace('{terms}', '')}
                    <Link to="/terms" className="text-primary font-bold hover:underline">{t('profile.terms_link')}</Link>
                  </span>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowBecomeProviderModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleBecomeProvider}
                  disabled={!agreeToTerms || submittingRoleChange}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {submittingRoleChange ? <Loader2 className="w-4 h-4 animate-spin" /> : t('profile.become_provider')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Give Up Provider Modal */}
        {showGiveUpProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.give_up_provider')}</h2>
                <button onClick={() => setShowGiveUpProviderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-bold mb-1">{t('profile.give_up_title')}</p>
                    <p className="text-xs opacity-80">{t('profile.give_up_desc')}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('profile.give_up_reason')}</label>
                  <textarea 
                    value={giveUpReason}
                    onChange={(e) => setGiveUpReason(e.target.value)}
                    placeholder="Tell us why..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-red-500 transition-colors min-h-[100px] resize-none"
                  />
                </div>
                
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      checked={giveUpConsent}
                      onChange={(e) => setGiveUpConsent(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 dark:border-neutral-700 checked:bg-red-500 transition-all"
                    />
                    <CheckCircle2 className="absolute h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    {t('profile.give_up_consent')}
                  </span>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowGiveUpProviderModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleGiveUpProvider}
                  disabled={!giveUpConsent || submittingRoleChange}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {submittingRoleChange ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
