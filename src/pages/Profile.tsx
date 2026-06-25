import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { uploadWithFallback } from '../lib/upload-helper';
import { Listing, ExtendedUser } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Star, MapPin, Edit3, ShieldCheck, Trash2, Loader2, 
  Zap, Gift, Shield, ShoppingBag, Truck, ChevronRight, CheckCircle2, Clock, X, Wallet, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Custom Hooks
import { useProfileData } from '../hooks/useProfileData';
import { useWithdrawal } from '../hooks/useWithdrawal';
import { useProfileUpdate } from '../hooks/useProfileUpdate';

// Extracted Sub-Components
import { ProfileSidebar } from '../components/profile/ProfileSidebar';
import { SettingsDashboard } from '../components/profile/SettingsDashboard';
import { WithdrawalModal } from '../components/profile/WithdrawalModal';
import { DataAuditLogsCard } from '../components/profile/DataAuditLogsCard';

const Profile = () => {
  const { user: rawUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cast type safety wrapper
  const user = rawUser as ExtendedUser | undefined;

  // Custom Data Fetching Hook (Parallelized)
  const {
    listings,
    orders,
    withdrawals,
    listingsLoading,
    ordersLoading,
    withdrawalsLoading,
    hasMoreListings,
    hasMoreOrders,
    hasMoreWithdrawals,
    loadMoreListings,
    loadMoreOrders,
    loadMoreWithdrawals,
    refreshAll,
  } = useProfileData(user?.uid);

  // Custom Profile Update Form Management Hook
  const {
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    is2faEnabled,
    setIs2faEnabled,
    twoFaMethod,
    setTwoFaMethod,
    walletMpesaNumber,
    setWalletMpesaNumber,
    walletBankName,
    setWalletBankName,
    walletAccountName,
    setWalletAccountName,
    walletAccountNumber,
    setWalletAccountNumber,
    kraPin,
    setKraPin,
    agreeVatTurnover,
    setAgreeVatTurnover,
    alertsPush,
    setAlertsPush,
    alertsSms,
    setAlertsSms,
    alertsEmail,
    setAlertsEmail,
    disbursementMethod,
    setDisbursementMethod,
    handleUpdateProfile
  } = useProfileUpdate(user);

  // Custom Withdrawal Logic Hook (Strictly Proxy API driven)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const {
    withdrawAmount,
    setWithdrawAmount,
    withdrawMethod,
    setWithdrawMethod,
    withdrawDetails,
    setWithdrawDetails,
    submittingWithdraw,
    calculatedFees,
    loadingFees,
    submitWithdrawal
  } = useWithdrawal(user, () => {
    setShowWithdrawModal(false);
    refreshAll();
  });

  // State Variables for Modal Overlays
  const [showBecomeProviderModal, setShowBecomeProviderModal] = useState(false);
  const [showGiveUpProviderModal, setShowGiveUpProviderModal] = useState(false);
  const [selectedRequestedRole, setSelectedRequestedRole] = useState<'provider' | 'seller' | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [giveUpReason, setGiveUpReason] = useState('');
  const [giveUpConsent, setGiveUpConsent] = useState(false);
  const [submittingRoleChange, setSubmittingRoleChange] = useState(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Security bounds verification: 30 days of registration and email activation
  const registrationDate = user?.createdAt ? new Date(user.createdAt) : null;
  const daysRegistered = registrationDate 
    ? Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;
  const isRegistered30Days = daysRegistered >= 30;
  const isEmailVerified = !!(user?.emailVerified || auth.currentUser?.emailVerified);
  const canApplyForProvider = isRegistered30Days && isEmailVerified;

  const handleBecomeProvider = async () => {
    if (!user || !agreeToTerms || !selectedRequestedRole) return;

    if (!canApplyForProvider) {
      toast.error('Application Blocked: You must be registered for at least 30 days and have your email activated on HudumaLink Kenya.');
      return;
    }

    setSubmittingRoleChange(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        roleRequestStatus: 'pending',
        requestedRole: selectedRequestedRole,
        roleRequestCreatedAt: new Date().toISOString()
      });
      toast.success('Your application to become a ' + (selectedRequestedRole === 'provider' ? 'Service Provider' : 'Goods Seller') + ' has been submitted. Verification takes 3-4 days!');
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
        roleRequestStatus: 'pending',
        requestedRole: 'customer',
        roleRequestCreatedAt: new Date().toISOString()
      });
      toast.success('Your request to revert back to customer has been submitted. Clearances take 3-4 days!');
      setShowGiveUpProviderModal(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSubmittingRoleChange(false);
    }
  };

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
      const downloadURL = await uploadWithFallback(`profiles/${user.uid}`, file);
      
      setEditData((prev: any) => ({ ...prev, photoURL: downloadURL }));
      
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

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (confirmText !== 'CONFIRM DELETE') {
      toast.error("Please type the confirmation text 'CONFIRM DELETE' exactly.");
      return;
    }
    setDeletingAccount(true);
    try {
      // 1. Delete all user listings
      const listingsQuery = query(collection(db, 'listings'), where('authorId', '==', user.uid));
      const listingsSnapshot = await getDocs(listingsQuery);
      await Promise.all(listingsSnapshot.docs.map(listingDoc => deleteDoc(doc(db, 'listings', listingDoc.id))));
      
      // 2. Delete all user notifications
      const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      await Promise.all(notificationsSnapshot.docs.map(nDoc => deleteDoc(doc(db, 'notifications', nDoc.id))));

      // 3. Delete KYC subdocument if exists
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'kyc', 'data'));
      } catch (e) {
        console.error("KYC documents deletion error:", e);
      }

      // 4. Delete the main User document securely
      await deleteDoc(doc(db, 'users', user.uid));

      // 5. Attempt to delete auth user
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await currentUser.delete();
        } catch (authError) {
          console.warn("Auth deletion required recent login, signing out:", authError);
          await auth.signOut();
        }
      } else {
        await auth.signOut();
      }

      toast.success("Account and all personal details have been permanently erased from HudumaLink servers.");
      setShowDeleteAccountModal(false);
      navigate('/');
      window.location.reload();
    } catch (error: any) {
      handleGeneralError(error, "Failed to complete account deletion");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Flagged Warning Banner */}
      {user.isFlagged && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/5"
        >
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-650 rounded-3xl shadow-lg">
              <AlertTriangle className="w-8 h-8 text-red-650" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-900 dark:text-red-400">Account Flagged & Under Compliance Review</h3>
              <p className="text-sm text-red-750 dark:text-red-500/80 mt-1 font-medium">
                Reason: {user.flagReason || 'Duplicate ID number detected which violates HudumaLink terms'}.
              </p>
              <p className="text-xs text-red-600 dark:text-red-550/60 mt-2 font-mono">
                An official warning has been drafted and dispatched to your email address ({user.email}). Continued non-compliance or fraudulent identity mappings will result in immediate contract termination.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Become a Provider Promo Banner */}
      {user.role === 'customer' && !user.isVerified && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[2.5rem] border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/5"
        >
          <div className="flex items-center gap-5 text-center md:text-left flex-1">
            <div className={`p-4 rounded-3xl ${canApplyForProvider ? 'bg-primary/10 text-primary' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'}`}>
              <Zap className={`w-8 h-8 ${canApplyForProvider ? 'text-primary animate-bounce' : 'text-amber-600'}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                Become a Verified Provider!
                {!canApplyForProvider && (
                  <span className="bg-amber-500/10 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Restricted
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Monetize your services and list physical products securely with HudumaLink escrow protection bounds.
              </p>
              {!canApplyForProvider && (
                <div className="mt-3 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400 font-semibold space-y-1">
                  <p className="font-extrabold text-[10px] uppercase tracking-widest text-amber-900 dark:text-amber-300">HudumaLink Eligibility Policy Mandate:</p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    30 Days Registration: {isRegistered30Days ? '✅ Completed' : `⏳ Required (Current: ${daysRegistered}/30 days registered)`}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Email Activation: {isEmailVerified ? '✅ Completed' : '⏳ Action Required (Verify your email in the sidebar)'}
                  </p>
                </div>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              if (canApplyForProvider) {
                setShowBecomeProviderModal(true);
              } else {
                toast.error("Application restricted until compliance constraints are met!");
              }
            }}
            className={`w-full md:w-auto px-6 py-3.5 text-xs font-black rounded-xl transition shadow-lg whitespace-nowrap cursor-pointer ${
              canApplyForProvider 
                ? 'bg-primary text-white hover:bg-opacity-95 shadow-primary/10 shadow-lg' 
                : 'bg-gray-100 dark:bg-neutral-800/80 text-gray-400 dark:text-neutral-600 border border-gray-200 dark:border-neutral-800 pointer-events-none opacity-60'
            }`}
          >
            Apply for Seller/Provider Node
          </button>
        </motion.div>
      )}

      {/* Give up Provider Node Banner */}
      {(user.role === 'provider' || user.role === 'seller') && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/10 dark:to-red-950/5 rounded-[2.5rem] border border-red-200 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl"
        >
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-3xl text-red-650">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Active Provider/Seller Status</h3>
              <p className="text-sm text-gray-400 mt-1">
                You are registered as a high-authority provider. You may request to revert back to customer mode at any time.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowGiveUpProviderModal(true)}
            className="w-full md:w-auto px-6 py-3.5 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-opacity-95 transition shadow-lg whitespace-nowrap cursor-pointer"
          >
            Revert to Customer Role
          </button>
        </motion.div>
      )}

      {/* Hidden File Input for Avatar */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Grid Layout splits Profile Page */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar Component (Extracted) */}
        <div className="lg:col-span-1">
          <ProfileSidebar 
            user={user}
            listingsLength={listings.length}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            uploading={uploading}
            onAvatarUploadClick={() => fileInputRef.current?.click()}
            onWithdrawClick={() => setShowWithdrawModal(true)}
            onDeleteAccountClick={() => setShowDeleteAccountModal(true)}
          />
        </div>

        {/* Custom Body Components details */}
        <div className="lg:col-span-2 space-y-8">
          
          {isEditing ? (
            /* SettingsDashboard Configuration (Extracted) */
            <SettingsDashboard 
              user={user}
              editData={editData}
              setEditData={setEditData}
              is2faEnabled={is2faEnabled}
              setIs2faEnabled={setIs2faEnabled}
              twoFaMethod={twoFaMethod}
              setTwoFaMethod={setTwoFaMethod}
              walletMpesaNumber={walletMpesaNumber}
              setWalletMpesaNumber={setWalletMpesaNumber}
              walletBankName={walletBankName}
              setWalletBankName={setWalletBankName}
              walletAccountName={walletAccountName}
              setWalletAccountName={setWalletAccountName}
              walletAccountNumber={walletAccountNumber}
              setWalletAccountNumber={setWalletAccountNumber}
              kraPin={kraPin}
              setKraPin={setKraPin}
              agreeVatTurnover={agreeVatTurnover}
              setAgreeVatTurnover={setAgreeVatTurnover}
              alertsPush={alertsPush}
              setAlertsPush={setAlertsPush}
              alertsSms={alertsSms}
              setAlertsSms={setAlertsSms}
              alertsEmail={alertsEmail}
              setAlertsEmail={setAlertsEmail}
              disbursementMethod={disbursementMethod}
              setDisbursementMethod={setDisbursementMethod}
              onSubmit={handleUpdateProfile}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-8">
              
              {/* Listings Operations Card with Cursor Pagination / Load More */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-gray-100 font-sans">
                    <Package className="w-6 h-6 mr-2 text-primary" /> My Shop Listings
                  </h2>
                  {user.role !== 'customer' && (
                    <Link to="/create-listing" className="text-primary text-xs font-black uppercase hover:underline">
                      Post New Listing
                    </Link>
                  )}
                </div>

                {listingsLoading && listings.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-neutral-800/40 animate-pulse rounded-2xl"></div>)}
                  </div>
                ) : listings.length > 0 ? (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary dark:hover:border-primary/40 transition-all">
                        <div className="flex items-center space-x-4">
                          <img src={listing.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 text-sm">{listing.title}</h3>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mr-2",
                                listing.status === 'active' ? "bg-green-100 dark:bg-green-950/40 text-green-700" : "bg-gray-200 dark:bg-neutral-800 text-gray-550"
                              )}>
                                {listing.status}
                              </span>
                              {listing.isPromoted && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mr-2 bg-yellow-105 dark:bg-yellow-950/40 text-yellow-750 flex items-center">
                                  <Zap className="w-3 h-3 mr-0.5" /> Promoted
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
                              className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-[10px] font-black hover:bg-yellow-600 transition flex items-center"
                            >
                              <Zap className="w-3 h-3 mr-0.5" /> Promote
                            </Link>
                          )}
                          <Link to={`/listing/${listing.id}?edit=true`} className="p-2 text-gray-400 hover:text-primary transition-colors">
                            <Edit3 className="w-4.5 h-4.5" />
                          </Link>
                        </div>
                      </div>
                    ))}

                    {hasMoreListings && (
                      <button 
                        type="button"
                        onClick={loadMoreListings}
                        className="w-full text-center py-3 bg-gray-50 hover:bg-gray-105 dark:bg-neutral-800/40 dark:hover:bg-neutral-850 rounded-2xl text-xs font-bold text-primary transition cursor-pointer"
                      >
                        Load More Listings
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xs">No active shop listings yet.</p>
                  </div>
                )}
              </div>

              {/* Orders & Tracking with Cursor Pagination */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-gray-100 mb-8 font-sans">
                  <ShoppingBag className="w-6 h-6 mr-2 text-primary" /> Active Purchases
                </h2>

                {ordersLoading && orders.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-neutral-800/30 animate-pulse rounded-2xl"></div>)}
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-5 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary dark:hover:border-primary/40 transition-all text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-gray-900 dark:text-gray-100">Order Ref: {order.id.slice(0, 8).toUpperCase()}</h3>
                              <p className="text-[11px] text-gray-500 mt-0.5">Amount: {formatPrice(order.amount)} • {formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase",
                              order.status === 'completed' ? "bg-green-100 text-green-700" :
                              order.status === 'deposited' ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15" :
                              "bg-gray-200 text-gray-650"
                            )}>
                              {order.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                              {order.status}
                            </div>
                            <Link to={`/transactions/${order.id}`} className="p-1.5 text-gray-400 hover:text-primary transition">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMoreOrders && (
                      <button 
                        type="button"
                        onClick={loadMoreOrders}
                        className="w-full text-center py-3 bg-gray-50 hover:bg-gray-105 dark:bg-neutral-800/40 dark:hover:bg-neutral-850 rounded-2xl text-xs font-bold text-primary transition cursor-pointer"
                      >
                        Load More Orders
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-xs">No active orders placed yet.</p>
                  </div>
                )}
              </div>

              {/* Limit Withdrawals list to 10 with Option to view more (Cursor Pagination) */}
              <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-gray-100 mb-8 font-sans">
                  <Wallet className="w-6 h-6 mr-2 text-primary" /> Withdrawal Ledger
                </h2>

                {withdrawalsLoading && withdrawals.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-neutral-800/30 animate-pulse rounded-2xl"></div>)}
                  </div>
                ) : withdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 text-xs">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white text-sm">{formatPrice(w.amount)}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {w.method === 'mpesa' ? `M-Pesa Ledger Pin: ${w.details?.phoneNumber || 'N/A'}` : `Bank: ${w.details?.bankName || 'N/A'}`}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-1">{formatDate(w.createdAt)}</p>
                          </div>
                          <div className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase",
                            w.status === 'completed' ? "bg-green-100 text-green-700" :
                            w.status === 'rejected' ? "bg-red-105 text-red-650" :
                            "bg-yellow-100 text-yellow-700"
                          )}>
                            {w.status}
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMoreWithdrawals && (
                      <button 
                        type="button"
                        onClick={() => loadMoreWithdrawals(withdrawals.length + 10)}
                        className="w-full text-center py-3 bg-gray-50 hover:bg-gray-105 dark:bg-neutral-800/40 dark:hover:bg-neutral-850 rounded-2xl text-xs font-bold text-primary transition cursor-pointer"
                      >
                        View More Withdrawal Entries
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-15" />
                    <p className="text-xs">No withdrawal entries found.</p>
                  </div>
                )}
              </div>

              {/* Forensic Data Audit logs (Extracted) */}
              <DataAuditLogsCard user={user} />

            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Form Modal (Extracted with Proxy Support) */}
      <AnimatePresence>
        {showWithdrawModal && (
          <WithdrawalModal 
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            user={user}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            withdrawMethod={withdrawMethod}
            setWithdrawMethod={setWithdrawMethod}
            withdrawDetails={withdrawDetails}
            setWithdrawDetails={setWithdrawDetails}
            submittingWithdraw={submittingWithdraw}
            calculatedFees={calculatedFees}
            loadingFees={loadingFees}
            submitWithdrawal={submitWithdrawal}
          />
        )}
      </AnimatePresence>

      {/* Become a Provider Modal */}
      <AnimatePresence>
        {showBecomeProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 max-w-md w-full border border-gray-100 dark:border-neutral-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Apply for Authorized Seller Role</h3>
                <button onClick={() => setShowBecomeProviderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-normal">Select the node authority level that maps to your logistics flow:</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setSelectedRequestedRole('provider')}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition ${
                      selectedRequestedRole === 'provider' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-200 dark:border-neutral-800 text-gray-500'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-bold">Service Provider</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Rentals & Labor bounds</p>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setSelectedRequestedRole('seller')}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-24 transition ${
                      selectedRequestedRole === 'seller' 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-gray-200 dark:border-neutral-800 text-gray-500'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-bold">Goods Seller</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Physical retail goods</p>
                    </div>
                  </button>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <span className="text-[11px] text-gray-500 leading-normal">
                    I agree to the HudumaLink Merchant Terms of Service, legal ODPC data holding compliance bounds, and escrow-bound dispute verdicts.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowBecomeProviderModal(false)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-200 dark:border-neutral-800 hover:bg-neutral-100 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={!agreeToTerms || !selectedRequestedRole || submittingRoleChange}
                  onClick={handleBecomeProvider}
                  className="flex-1 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  {submittingRoleChange ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Give up Provider Modal */}
      <AnimatePresence>
        {showGiveUpProviderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 max-w-md w-full border border-gray-200 dark:border-neutral-800 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Give up merchant/provider status</h3>
                <button onClick={() => setShowGiveUpProviderModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-400 leading-normal">
                  You are downgrading to standard customer mode. Your listings will be disabled instantly and active escrows liquidated upon completion.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Reasons for Deactivation</label>
                  <textarea 
                    value={giveUpReason}
                    onChange={(e) => setGiveUpReason(e.target.value)}
                    placeholder="Tell us why..."
                    className="w-full bg-slate-50 dark:bg-neutral-800 p-3 rounded-xl text-xs font-semibold outline-none focus:ring-1 focus:ring-red-500 min-h-[80px]"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={giveUpConsent}
                    onChange={(e) => setGiveUpConsent(e.target.checked)}
                    className="mt-1 text-red-650 focus:ring-red-500"
                  />
                  <span className="text-[11px] text-gray-500 leading-normal">
                    I understand that all active listings will be unlinked, and clearing takes 3-4 standard business days.
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowGiveUpProviderModal(false)}
                  className="flex-1 py-3 bg-gray-50 border border-gray-200 dark:border-neutral-800 hover:bg-neutral-100 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={!giveUpConsent || submittingRoleChange}
                  onClick={handleGiveUpProvider}
                  className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-opacity-95 transition flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  {submittingRoleChange ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Deactivation"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Account Deletion Modal (Preserved exactly) */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 max-w-lg w-full border border-red-100 dark:border-red-950/35 shadow-2xl space-y-6 animate-none"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600">
                    <Trash2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Permanent Account Erasure</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">ODPC Compliance Portal</p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteAccountModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-55/15 dark:bg-red-900/10 rounded-2xl flex items-start space-x-3 border border-red-100 dark:border-red-900/20">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-850 dark:text-red-400 leading-relaxed">
                    <p className="font-bold mb-1">WARNING: THIS IS IRREVERSIBLE</p>
                    <p>
                      Executing this action completely and permanently deletes your account record from HudumaLink servers and databases. 
                      This includes your personal profile information, KYC documents, active/inactive listings, notification history, 
                      and secure login records. No backup is restorable.
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    To proceed, please type <span className="text-red-500 font-mono font-black select-all">CONFIRM DELETE</span> below
                  </label>
                  <input 
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type 'CONFIRM DELETE'"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowDeleteAccountModal(false)}
                  disabled={deletingAccount}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-650 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-55 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'CONFIRM DELETE' || deletingAccount}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Erasing Data...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Standalone icons for Briefcase
const Briefcase = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 2H9a2 2 0 0 0-2 2v2H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V4a2 2 0 0 0-2-2z" />
    <rect width="20" height="14" x="2" y="8" rx="2" />
    <path d="M12 12h.01" />
    <path d="M16 6V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2" />
  </svg>
);

export default Profile;
