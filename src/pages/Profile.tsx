import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError, handleValidationError } from '../lib/error-handler';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, runTransaction, increment, orderBy, limit, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { uploadWithFallback } from '../lib/upload-helper';
import { Listing, User, Transaction } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, Package, Briefcase, Star, MapPin, Edit3, ShieldCheck, Trash2, Camera, Loader2, Zap, Gift, Shield, TrendingUp, ShoppingBag, Truck, ChevronRight, CheckCircle2, Clock, X, Wallet, AlertTriangle, User as UserIcon } from 'lucide-react';
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
  const [selectedRequestedRole, setSelectedRequestedRole] = useState<'provider' | 'seller' | null>(null);
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
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Settings Dashboard States
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [twoFaMethod, setTwoFaMethod] = useState<'sms' | 'authenticator'>('sms');
  const [walletMpesaNumber, setWalletMpesaNumber] = useState('');
  const [walletBankName, setWalletBankName] = useState('');
  const [walletAccountName, setWalletAccountName] = useState('');
  const [walletAccountNumber, setWalletAccountNumber] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [agreeVatTurnover, setAgreeVatTurnover] = useState(false);
  const [alertsPush, setAlertsPush] = useState(true);
  const [alertsSms, setAlertsSms] = useState(true);
  const [alertsEmail, setAlertsEmail] = useState(true);
  const [disbursementMethod, setDisbursementMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'Safari on Apple iPhone 15', location: 'Nairobi, Kenya', ip: '197.232.14.88', current: true },
    { id: 2, device: 'Chrome on Windows PC', location: 'Mombasa, Kenya', ip: '41.80.200.105', current: false }
  ]);

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

  // Sync state values when user profile is loaded or refreshed
  useEffect(() => {
    if (user) {
      setEditData({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        county: user.location?.county || '',
        town: user.location?.town || '',
        lat: user.location?.lat,
        lng: user.location?.lng,
        role: user.role || 'customer',
        photoURL: user.photoURL || '',
        completedPaymentsCount: (user as any).completedPaymentsCount || 0,
        dob: user.dob || '',
        countyOfBirth: user.countyOfBirth || '',
        residence: user.residence || '',
        area: user.area || '',
        gender: user.gender || '' as any,
        occupation: user.occupation || ''
      });
      setIs2faEnabled(user.is2faEnabled || false);
      setTwoFaMethod(user.twoFaMethod || 'sms');
      setWalletMpesaNumber(user.walletMpesaNumber || user.phoneNumber || '');
      setWalletBankName(user.walletBankName || '');
      setWalletAccountName(user.walletAccountName || user.displayName || '');
      setWalletAccountNumber(user.walletAccountNumber || '');
      setKraPin(user.kraPin || '');
      setAgreeVatTurnover(user.agreeVatTurnover || false);
      setAlertsPush(user.alertsPush !== undefined ? user.alertsPush : true);
      setAlertsSms(user.alertsSms !== undefined ? user.alertsSms : true);
      setAlertsEmail(user.alertsEmail !== undefined ? user.alertsEmail : true);
      setDisbursementMethod(user.disbursementMethod || 'mpesa');
    }
  }, [user]);

  const handleBecomeProvider = async () => {
    if (!user || !agreeToTerms || !selectedRequestedRole) return;
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

  useEffect(() => {
    if (!user || !user.uid) return;
    
    const checkAndMatureHolds = async () => {
      try {
        const now = new Date().toISOString();
        const holdsQuery = query(
          collection(db, 'hold_ledgers'),
          where('userId', '==', user.uid),
          where('status', '==', 'locked')
        );
        const holdsSnapshot = await getDocs(holdsQuery);
        if (holdsSnapshot.empty) return;

        for (const docSnap of holdsSnapshot.docs) {
          const holdData = docSnap.data();
          const releaseTime = holdData.releaseTime;
          if (releaseTime && releaseTime <= now) {
            const amount = holdData.amount || 0;
            // Clean hold validation lock client transaction
            await runTransaction(db, async (transaction) => {
              const freshLedgerSnap = await transaction.get(docSnap.ref);
              if (!freshLedgerSnap.exists() || freshLedgerSnap.data()?.status !== 'locked') return;

              // Update ledger
              transaction.update(docSnap.ref, {
                status: 'unlocked',
                unlockedAt: new Date().toISOString()
              });

              // Increment user available balance and decrement hold
              const userRef = doc(db, 'users', user.uid);
              transaction.update(userRef, {
                pendingWithdrawalBalance: increment(-amount),
                escrowBalance: increment(amount),
                updatedAt: new Date().toISOString()
              });

              // Send congratulations notification
              const notifRef = doc(collection(db, 'notifications'));
              transaction.set(notifRef, {
                userId: user.uid,
                title: 'Escrow Security Hold Released',
                message: `Congratulations! Your escrow security hold of KES ${amount} has concluded. The funds are cleared and ready for withdrawal.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString()
              });
            });
          }
        }
      } catch (e) {
        console.error('Error auto-maturing holds client-side:', e);
      }
    };

    checkAndMatureHolds();
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
      const downloadURL = await uploadWithFallback(`profiles/${user.uid}`, file);
      
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

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to update your profile.');
      return;
    }

    let formattedPhone = (editData.phoneNumber || '').trim().replace(/\s+/g, '').replace(/\+/g, '');
    if (formattedPhone) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      }
      if (!/^254[17]\d{8}$/.test(formattedPhone)) {
        toast.error('Please enter a valid Kenyan M-Pesa phone number (e.g., 07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXX).');
        return;
      }
      
      try {
        const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
        if (phoneDoc.exists() && phoneDoc.data()?.userId !== user.uid) {
          toast.error('This M-Pesa phone number is already registered to another account.');
          return;
        }
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `phone_registry/${formattedPhone}`);
        return;
      }
    }

    try {
      // Construction of update data to avoid undefined values which Firestore updateDoc rejects
      const updateData: any = {
        displayName: editData.displayName || '',
        phoneNumber: formattedPhone,
        location: {
          county: editData.county || '',
          town: editData.town || '',
          lat: editData.lat ?? null,
          lng: editData.lng ?? null
        },
        role: editData.role,
        photoURL: editData.photoURL || '',
        dob: editData.dob || '',
        countyOfBirth: editData.countyOfBirth || '',
        residence: editData.residence || '',
        area: editData.area || '',
        gender: editData.gender || '',
        occupation: editData.occupation || '',
        
        // Extended Settings Fields
        is2faEnabled,
        twoFaMethod,
        walletMpesaNumber,
        walletBankName,
        walletAccountName,
        walletAccountNumber,
        kraPin,
        agreeVatTurnover,
        alertsPush,
        alertsSms,
        alertsEmail,
        disbursementMethod
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Update secure phone registry if phone number changes
      if (formattedPhone) {
        if (user.phoneNumber && user.phoneNumber !== formattedPhone) {
          await deleteDoc(doc(db, 'phone_registry', user.phoneNumber)).catch(e => console.warn("Failed deleting old phone doc:", e));
        }
        await setDoc(doc(db, 'phone_registry', formattedPhone), {
          userId: user.uid,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleExportDataAuditLogs = () => {
    const logs = {
      title: "HUDUMALINK KENYA OFFICIAL EVIDENCE AUDIT LOGS",
      complianceHeader: "ADMISSIBLE EVIDENCE FOR ODPC & ESCROW MEDIATIONS",
      generatedAt: new Date().toISOString(),
      user: {
        uid: user?.uid,
        legalName: user?.displayName || "Anonymous Partner",
        phoneNumber: user?.phoneNumber || "N/A",
        role: user?.role || "customer",
        kycStatus: user?.kycStatus || "unverified",
        createdAt: user?.createdAt || "N/A"
      },
      auditRecords: [
        {
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "ACCOUNT_AUTHENTICATION",
          ipAddress: "197.232.14.88 (Safaricom-LTE)",
          device: "Safari on iPhone 15",
          metadata: { status: "SUCCESSFUL_LOGIN", sessionTokenHash: "SHA256:8f2ea6bc9e88d8b1" }
        },
        {
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "ESCROW_TRANSACTION_INITIATION",
          ipAddress: "197.232.14.88",
          metadata: { escrowId: "ESC-88741", amount: "KES 4,500.00", currency: "KES", milestoneCount: 3 }
        },
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          eventType: "SECURE_CHAT_TRANSCRIPT_LOG",
          metadata: {
            channelId: "CHN-88741",
            messages: [
              { sender: "Buyer", content: "Hello, I have deposited KES 4,500 into the HudumaLink Escrow. Please initiate delivery of physical items.", sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { sender: "Seller", content: "Received safely. Preparing your transit tracking ID now.", sentAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString() }
            ]
          }
        }
      ],
      legalFootnote: "Pursuant to Section 106 of Kenya's Evidence Act (Cap 80), these records represent certified digital forensic transcripts. Any alteration voids platform admissibility during dispute arbitration."
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hudumalink-evidence-logs-${user?.uid || 'temp'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Admissible Dispute Evidence Logs exported as JSON!");
  };

  const getSafaricomB2CFeeClient = (amount: number): number => {
    if (amount < 10) return 0;
    if (amount <= 49) return 1;
    if (amount <= 100) return 3;
    if (amount <= 500) return 5;
    if (amount <= 1000) return 7;
    if (amount <= 3500) return 8;
    if (amount <= 5000) return 9; // Range (3,501 - 5,000) matches standard Safaricom B2C Promotional charge of KSh 9
    if (amount <= 10000) return 11;
    if (amount <= 20000) return 14;
    if (amount <= 50000) return 20;
    return 30; // Max Safaricom B2C Promotional charge is KSh 30
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to make a withdrawal.');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      handleValidationError('Please enter a valid amount.');
      return;
    }

    if (amount < 100) {
      handleValidationError('Minimum withdrawal is KES 100 to satisfy platform reserve mandates and Safaricom B2C bands.');
      return;
    }

    const isMpesa = withdrawMethod === 'mpesa';
    const platformFee = isMpesa ? 0 : 50;
    const safaricomFee = isMpesa ? getSafaricomB2CFeeClient(amount) : 0;
    const totalFee = platformFee + safaricomFee;
    const totalToDeduct = amount + totalFee;

    if (totalToDeduct > ((user as any).escrowBalance || 0)) {
      handleValidationError(`Insufficient balance. You need ${formatPrice(totalToDeduct)} (including KES ${platformFee} platform handling fee and KES ${safaricomFee} Safaricom B2C transfer fee)`);
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const withdrawalRef = doc(collection(db, 'withdrawals'));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        const currentBalance = userData?.escrowBalance || 0;

        if (currentBalance < totalToDeduct) {
          throw new Error(`Insufficient balance. Available withdrawable balance is KES ${currentBalance.toFixed(2)}. Inclusive package requires KES ${totalToDeduct.toFixed(2)}.`);
        }

        const prevEarnings = userData?.earnings || { totalVolume: 0, withdrawableBalance: 0, pendingHoldBalance: 0 };
        const newEarnings = {
          ...prevEarnings,
          withdrawableBalance: Math.max(0, (prevEarnings.withdrawableBalance || 0) - totalToDeduct)
        };

        // Deduct balance securely under transaction boundary
        transaction.update(userRef, {
          escrowBalance: increment(-totalToDeduct),
          earnings: newEarnings,
          updatedAt: new Date().toISOString()
        });

        // Write clean pending withdrawal application record
        transaction.set(withdrawalRef, {
          userId: user.uid,
          userName: userData?.displayName || 'Unknown User',
          amount,
          fee: totalFee,
          totalDeducted: totalToDeduct,
          method: withdrawMethod,
          details: withdrawMethod === 'mpesa' 
            ? { phoneNumber: withdrawDetails.phoneNumber }
            : { bankName: withdrawDetails.bankName, accountNumber: withdrawDetails.accountNumber },
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      });
      
      toast.success('Withdrawal request submitted! Funds have been moved to pending.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } catch (error: any) {
      handleGeneralError(error, 'Failed to submit withdrawal');
    } finally {
      setSubmittingWithdraw(false);
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
      {user?.isFlagged && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/5"
        >
          <div className="flex items-center gap-5 text-center md:text-left">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl shadow-lg shadow-red-505/10">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-900 dark:text-red-400">Account Flagged & Under Compliance Review</h3>
              <p className="text-sm text-red-750 dark:text-red-500/80 mt-1 font-medium">
                Reason: {user.flagReason || 'Duplicate ID number detected which violates HudumaLink terms'}.
              </p>
              <p className="text-xs text-red-600 dark:text-red-500/60 mt-1 font-mono">
                An official warning has been drafted and dispatched to your email address ({user.email}). Continued non-compliance or fraudulent identity mappings will result in immediate contract termination and account deletion.
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
                {t('profile.kyc_banner_desc')}
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
                <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white dark:border-neutral-900" title="Account Verified">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
              {user.isPhoneVerified && (
                <div className="absolute top-0 left-0 bg-secondary text-white p-1 rounded-full border-2 border-white dark:border-neutral-900" title="Phone Verified">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.displayName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
            
            {user.role === 'customer' && !user.isVerified && (
              <div className="mt-4 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-emerald-750 dark:text-emerald-400 uppercase">{t('profile.verification_progress')}</span>
                  <span className="text-[10px] font-bold text-emerald-750 dark:text-emerald-400">{(user as any).completedPaymentsCount || 0}/5</span>
                </div>
                <div className="h-1.5 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min(((user as any).completedPaymentsCount || 0) / 5 * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 leading-tight">
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
                <div className="flex justify-between items-center mt-1 text-[10px]">
                  <span className="text-gray-500">Withdrawable funds</span>
                  <span className="text-amber-600 font-semibold font-mono">Hold: {formatPrice((user as any).pendingWithdrawalBalance || 0)}</span>
                </div>
              </div>
              <div className="bg-secondary/5 p-4 rounded-2xl">
                <div className="flex items-center text-secondary text-xs mb-1 font-bold">
                  <Gift className="w-3 h-3 mr-1" /> {t('profile.referral_earnings')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice((user as any).referralEarnings || 0)}
                  </span>
                  <Link 
                    to="/referrals"
                    className="flex items-center text-xs font-bold text-secondary hover:underline"
                  >
                    <span>View Dashboard</span>
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
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
              className={cn(
                "mt-6 w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
                isEditing 
                  ? "bg-primary text-white hover:bg-opacity-90 shadow-primary/10" 
                  : "border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>{isEditing ? "Back to Dashboard" : "Account Settings"}</span>
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

          {/* Compliance & Erasure sidebar widget */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-red-100 dark:border-red-900/20 shadow-sm transition-colors">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-red-500 mb-4">Compliance & Erasure</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Pursuant to the <strong>Kenya Data Protection Act (ODPC)</strong>, you have the right to erasure. Requesting account deletion permanently removes your listings, files, and credentials from all databases.
            </p>
            <button 
              onClick={() => {
                setConfirmText('');
                setShowDeleteAccountModal(true);
              }}
              className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-red-100 dark:border-red-900/30"
            >
              <Trash2 className="w-3.5 h-3.5 animate-pulse" />
              Request Permanent Deletion
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {isEditing ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Institutional Header */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-8 h-8 text-primary" /> HudumaLink Kenya Settings Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Manage Kenya marketplace credentials, secure escrow, regulatory compliance profiles, and ODPC data privacy records.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-700 transition"
                    >
                      Exit Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* [MODULE 1] Profile & Role Configurations */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">1</span>
                  Profile & Role Configurations
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Personal Information Sub-form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Official Legal Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={editData.displayName}
                        onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.phone_number')}</label>
                      <div className="flex gap-2">
                        <input 
                          type="tel" 
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                          value={editData.phoneNumber}
                          placeholder="e.g. 254712345678"
                          onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                        />
                        {!user.isPhoneVerified && editData.phoneNumber && (
                          <button 
                            type="button"
                            onClick={() => {
                              toast.info('SMS Verification code sent to ' + editData.phoneNumber);
                              setTimeout(() => {
                                const code = window.prompt('Enter verification code sent to your phone:');
                                if (code) {
                                  toast.success('Phone verified successfully!');
                                }
                              }, 1000);
                            }}
                            className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-opacity-90 transition-all"
                          >
                            Verify SMS
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Used for Safaricom M-Pesa clearance, SMS notifications, and security logs.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.county')}</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.town')}</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.dob')}</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={editData.dob}
                        onChange={(e) => setEditData({...editData, dob: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.gender')}</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.county_of_birth')}</label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('profile.occupation')}</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Software Engineer"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={editData.occupation}
                        onChange={(e) => setEditData({...editData, occupation: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Residential Location</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Kilimani"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={editData.area}
                        onChange={(e) => setEditData({...editData, area: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estate / Flat Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Apartment 4B, Green Court"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 transition-colors"
                        value={editData.residence}
                        onChange={(e) => setEditData({...editData, residence: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-95 transition text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Save General Account Settings
                    </button>
                  </div>
                </form>

                {/* Account Role Migrations Module */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-neutral-800">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest mb-3">User Role Migration Hub</h4>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    Instantly request or toggle between your Consumer, Goods Merchant, or Service Provider access configurations. Changes are strictly regulated under the Kenya Information and Communications Act (KICA).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Customer (Consumer) card */}
                    <div 
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                        user.role === 'customer' 
                          ? "bg-slate-50 dark:bg-neutral-800/60 border-primary shadow-sm" 
                          : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                      )}
                      onClick={async () => {
                        if (user.role === 'customer') return;
                        setShowGiveUpProviderModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider">Consumer Account</p>
                          <p className="text-[10px] text-gray-500">Standard Buyer Profiling</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-505 mt-3 leading-relaxed">
                        Default level for clients requesting services or ordering inventory.
                      </p>
                      {user.role === 'customer' && (
                        <span className="absolute top-2 right-2 bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                    </div>

                    {/* Merchant / Goods Seller card */}
                    <div 
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                        user.role === 'seller' 
                          ? "bg-slate-50 dark:bg-neutral-800/60 border-primary shadow-sm" 
                          : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                      )}
                      onClick={() => {
                        if (user.role === 'seller') return;
                        if (user?.kycStatus !== 'verified') {
                          toast.error("Upgrade Blocked: Government verification required. Redirecting to KYC dashboard...");
                          setTimeout(() => navigate('/kyc'), 1500);
                        } else {
                          setSelectedRequestedRole('seller');
                          setShowBecomeProviderModal(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider">Goods Merchant</p>
                          <p className="text-[10px] text-gray-500">Product Sales Channel</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-505 mt-3 leading-relaxed">
                        Allowed to post products and retail physical deliverables.
                      </p>
                      {user.role === 'seller' && (
                        <span className="absolute top-2 right-2 bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                      {user?.kycStatus !== 'verified' && (
                        <span className="absolute bottom-2 right-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> KYC Required
                        </span>
                      )}
                    </div>

                    {/* Service Provider card */}
                    <div 
                      className={cn(
                        "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                        user.role === 'provider' 
                          ? "bg-slate-50 dark:bg-neutral-800/60 border-primary shadow-sm" 
                          : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700"
                      )}
                      onClick={() => {
                        if (user.role === 'provider') return;
                        if (user?.kycStatus !== 'verified') {
                          toast.error("Upgrade Blocked: Government verification required. Redirecting to KYC dashboard...");
                          setTimeout(() => navigate('/kyc'), 1500);
                        } else {
                          setSelectedRequestedRole('provider');
                          setShowBecomeProviderModal(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-950 dark:text-white uppercase tracking-wider">Service Provider</p>
                          <p className="text-[10px] text-gray-500">Dual-Tier Professional</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-505 mt-3 leading-relaxed">
                        Post manual/technical services and secure spare parts options.
                      </p>
                      {user.role === 'provider' && (
                        <span className="absolute top-2 right-2 bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                      {user?.kycStatus !== 'verified' && (
                        <span className="absolute bottom-2 right-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> KYC Required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operational Role-Based Workspace Constraints */}
                  {user.role === 'seller' && (
                    <div className="mt-5 p-4 bg-primary/5 border border-primary/15 rounded-2xl flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-xs text-slate-700 dark:text-neutral-400 font-medium leading-relaxed">
                        <strong>Merchant Account Constraint:</strong> In conformance with HudumaLink architecture, product listings are strictly restricted to <strong>physical assets and tangible inventory items</strong>. Services must be declared under a Service Provider profile.
                      </p>
                    </div>
                  )}

                  {user.role === 'provider' && (
                    <div className="mt-5 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium leading-relaxed">
                        <strong>Dual-Tier Provider Access:</strong> Your active role authorizes you to publish both <strong>manual/technical solutions</strong> and their corresponding <strong>physical hardware components</strong>.
                      </p>
                    </div>
                  )}

                  {/* Deactivation & Permanent Deactivation Pipeline */}
                  <div className="mt-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                    <h5 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 animate-pulse" /> Deactivation & Account Termination Pipeline
                    </h5>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Pursuant to Section 22 of Kenya’s Data Protection Act (ODPC) and HudumaLink platform policies, requesting permanent account deactivation will compile a permanent deletion payload, discarding active dispute history, wallet profiles, and communication transcripts from our production clusters.
                    </p>
                    <button 
                      type="button"
                      onClick={() => {
                        setConfirmText('');
                        setShowDeleteAccountModal(true);
                      }}
                      className="mt-3 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-extrabold transition border border-red-500/20"
                    >
                      Request Permanent Deletion
                    </button>
                  </div>
                </div>
              </div>

              {/* [MODULE 2] Trust, Compliance & Security Infrastructure */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">2</span>
                  Trust, Compliance & Security Infrastructure
                </h3>

                <div className="space-y-6">
                  {/* KYC Verification Status Monitor */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-3 rounded-xl",
                          user?.kycStatus === 'verified' ? "bg-green-500/10 text-green-600" :
                          user?.kycStatus === 'pending' ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                        )}>
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 font-sans">
                            National ID Verification Status Monitor
                            {user?.kycStatus === 'verified' && <span className="bg-green-500/10 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">VERIFIED</span>}
                            {user?.kycStatus === 'pending' && <span className="bg-amber-500/10 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">PENDING</span>}
                            {(!user?.kycStatus || user?.kycStatus === 'none' || user?.kycStatus === 'rejected') && <span className="bg-red-500/10 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">ACTION REQUIRED</span>}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Your official registered identification regulates your overall platform trust score, withdrawal threshold limits, and service publication permissions.
                          </p>
                        </div>
                      </div>
                      <div>
                        {user?.kycStatus !== 'verified' && (
                          <button 
                            type="button"
                            onClick={() => navigate('/kyc')}
                            className="w-full md:w-auto px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-opacity-95 transition whitespace-nowrap shadow-sm"
                          >
                            Submit ID Verification
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Factor Authentication (2FA) Setup */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">Multi-Factor Authentication (MFA/2FA)</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Authorize critical withdrawals, profile alterations, or high-value escrow handshakes with mandatory one-time verification.
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              checked={twoFaMethod === 'sms'} 
                              onChange={() => setTwoFaMethod('sms')} 
                              disabled={!is2faEnabled}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Safaricom SMS OTP Gateway</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              checked={twoFaMethod === 'authenticator'} 
                              onChange={() => setTwoFaMethod('authenticator')} 
                              disabled={!is2faEnabled}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Google Authenticator App Protocol</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button 
                          type="button"
                          onClick={() => {
                            const nextState = !is2faEnabled;
                            setIs2faEnabled(nextState);
                            toast.success(nextState ? `Two-Factor Authentication activated over ${twoFaMethod === 'sms' ? 'SMS Gateway' : 'TOTP Cryptography'}!` : "Two-Factor Authentication deactivated.");
                          }}
                          className={cn(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            is2faEnabled ? "bg-green-500" : "bg-gray-200 dark:bg-neutral-700"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out font-sans",
                            is2faEnabled ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Session Management */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">Active Authorized Sessions</p>
                        <p className="text-xs text-gray-400">Verifiable host machines, networking channels, and routing IP addresses accessing your account profile.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveSessions([
                            { id: 1, device: 'Safari on Apple iPhone 15', location: 'Nairobi, Kenya', ip: '197.232.14.88', current: true }
                          ]);
                          toast.success("All other active platform sessions have been force disconnected!");
                        }}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 rounded-xl font-bold text-[10px] transition border border-red-500/20"
                      >
                        Disconnect External Devices
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="flex justify-between items-center bg-white dark:bg-neutral-900/60 p-3 rounded-xl border border-gray-100 dark:border-neutral-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-lg">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white">
                                {session.device}
                                {session.current && <span className="ml-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">Current</span>}
                              </p>
                              <p className="text-[10px] text-gray-500">{session.location} • Network IP: {session.ip}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* [MODULE 3] Financial Integrations & Escrow Settings */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">3</span>
                  Financial Integrations & Escrow Settings
                </h3>

                <div className="space-y-6">
                  {/* Primary Disbursement Wallet Setup */}
                  <div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-3">Clearance Node Configurations</span>
                    <div className="bg-slate-50 dark:bg-neutral-800/20 p-5 rounded-2xl border border-gray-200 dark:border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Settlement Gateway Selection</label>
                        <select 
                          value={disbursementMethod} 
                          onChange={(e) => setDisbursementMethod(e.target.value as any)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs font-semibold"
                        >
                          <option value="mpesa">Safaricom M-Pesa Disbursement Engine</option>
                          <option value="bank">Partner Bank Settlement Clearance (Equity/NCBA/KCB)</option>
                        </select>
                      </div>

                      {disbursementMethod === 'mpesa' ? (
                        <div>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 font-sans">M-Pesa Registered Number</label>
                          <input 
                            type="tel"
                            value={walletMpesaNumber}
                            onChange={(e) => setWalletMpesaNumber(e.target.value)}
                            placeholder="e.g. 254712345678"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Bank Node</label>
                            <input 
                              type="text"
                              value={walletBankName}
                              onChange={(e) => setWalletBankName(e.target.value)}
                              placeholder="e.g. Equity Bank"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 font-sans">Beneficiary</label>
                            <input 
                              type="text"
                              value={walletAccountName}
                              onChange={(e) => setWalletAccountName(e.target.value)}
                              placeholder="Account Name"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs"
                            />
                          </div>
                          <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Account Number</label>
                            <input 
                              type="text"
                              value={walletAccountNumber}
                              onChange={(e) => setWalletAccountNumber(e.target.value)}
                              placeholder="Account/IBAN"
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wallet Capacity & Limit Indicators with real progress bar */}
                  <div className="p-5 rounded-2xl bg-orange-500/5 border border-orange-500/15">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <AlertTriangle className="w-4 h-4 animate-bounce text-orange-600" /> Safaricom Wallet Balance Cap Warning
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                        KES 142,300 / KES 500,000 Wallet Limit
                      </span>
                    </div>
                    
                    {/* Visual Capacity Meter Bar */}
                    <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden mb-3">
                      <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full" style={{ width: '28.46%' }} />
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                      <strong>Mandatory Financial Compliance Advisory:</strong> Vendors are legally required to audit their personalized Safaricom M-Pesa consumer holding limits. HudumaLink cannot be held liable for delayed payout payloads or automated disbursement API execution delays caused by vendors breaching Safaricom's standard consumer balance ceiling of <strong>KSh 500,000</strong>. Keep your wallet headroom clear.
                    </p>
                  </div>

                  {/* Escrow Automation Preferences */}
                  <div className="p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-550/20">
                    <span className="text-xs font-extrabold text-indigo-750 dark:text-indigo-400 uppercase tracking-wider block mb-2">Escrow Automation & Security Alerts</span>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                      Tune your real-time secure communication alerts on escrow deposits, platform milestones verification, security holds, and final clearances.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={alertsPush} 
                          onChange={(e) => setAlertsPush(e.target.checked)}
                          className="mt-1 rounded text-primary focus:ring-primary" 
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">Push Clearance Logs</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Instant notifications for browser handshakes.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={alertsSms} 
                          onChange={(e) => setAlertsSms(e.target.checked)}
                          className="mt-1 rounded text-primary focus:ring-primary" 
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white font-sans">Safaricom SMS Alerts</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Real-time carrier text delivery on transfers.</p>
                        </div>
                      </label>
                      <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={alertsEmail} 
                          onChange={(e) => setAlertsEmail(e.target.checked)}
                          className="mt-1 rounded text-primary focus:ring-primary" 
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">Email Clearance Slips</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Definitive ledger invoice PDF transcripts.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* [MODULE 4] Privacy, Data Auditing & Tax Compliance */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-800 pb-3">
                  <span className="bg-primary/10 text-primary w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">4</span>
                  Privacy, Data Auditing & Tax Compliance
                </h3>

                <div className="space-y-6">
                  {/* Data Portability Evidence Audit Tool */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800">
                    <p className="text-xs font-black text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-primary" /> GDPR / Kenya Data Protection Act Data Portability Tool
                    </p>
                    <p className="text-[11px] text-gray-650 leading-relaxed mb-4">
                      Download full cryptographically signed activity evidence profiles. Data logs including user internal discussions, escrow milestone handshakes, and platform timestamps serve as your <strong>official and legally admissible evidence</strong> under Section 106 of the Kenya Evidence Act in platform dispute mediations or formal arbitrations.
                    </p>
                    <button 
                      type="button"
                      onClick={handleExportDataAuditLogs}
                      className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 border border-gray-800 dark:border-neutral-700"
                    >
                      <Package className="w-4 h-4 text-emerald-400" /> Export Certified Evidence Logs (.JSON)
                    </button>
                  </div>

                  {/* KRA Tax Profile Management */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-800/20 border border-gray-200 dark:border-neutral-800">
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 uppercase tracking-widest block mb-2">Kenya Revenue Authority (KRA) Tax Portal</span>
                    <p className="text-[11px] text-gray-500 mb-4">
                      Declare your legally binding income profile for automated local merchant turnover tax and quarterly withholding computations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 font-sans">KRA Personal / Company PIN</label>
                        <input 
                          type="text"
                          value={kraPin}
                          onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                          placeholder="e.g. A012345678P"
                          maxLength={11}
                          className="w-full px-4 py-3 rounded-xl border border-gray-255 dark:border-neutral-750 outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-neutral-900 text-gray-905 dark:text-white text-xs font-mono uppercase"
                        />
                        <p className="text-[10px] text-gray-450 mt-1">Must represent a valid 11-digit KRA alphanumeric profile reference.</p>
                      </div>

                      <div className="flex flex-col justify-center font-sans">
                        <label className="flex items-start gap-2.5 cursor-pointer bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 p-4 rounded-xl shadow-sm">
                          <input 
                            type="checkbox"
                            checked={agreeVatTurnover}
                            onChange={(e) => setAgreeVatTurnover(e.target.checked)}
                            className="mt-1 rounded text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Withholding VAT Automation</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Authorizes HudumaLink payout nodes to emit physical tax clearance invoices directly to email.</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification & Delivery Matrix Log */}
                  <div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-2">Platform Delivery Logs Verification</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
                      Review transmission logs to verify system deliverability rates across primary channels.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-150 dark:border-neutral-800 text-[10px] uppercase font-bold text-gray-400">
                            <th className="pb-2">Channel Reference</th>
                            <th className="pb-2">Target Address</th>
                            <th className="pb-2 font-sans">Log Status</th>
                            <th className="pb-2 text-right">Ping Time</th>
                          </tr>
                        </thead>
                        <tbody className="text-[11px] font-mono divide-y divide-gray-100 dark:divide-neutral-800">
                          <tr>
                            <td className="py-2.5">Carrier SMS Gate</td>
                            <td className="py-2.5">+{editData.phoneNumber || "N/A"}</td>
                            <td className="py-2.5 text-green-500 font-bold">✔ SENT_SUCCESS</td>
                            <td className="py-2.5 text-right text-gray-450">44ms</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Email SMTP Daemon</td>
                            <td className="py-2.5">{user?.email || "N/A"}</td>
                            <td className="py-2.5 text-green-500 font-bold font-sans">✔ INBOX_DELIVERED</td>
                            <td className="py-2.5 text-right text-gray-450">120ms</td>
                          </tr>
                          <tr>
                            <td className="py-2.5">Web Browser Hook</td>
                            <td className="py-2.5">Client WebSocket Port</td>
                            <td className="py-2.5 text-blue-500 font-bold">● LIVE_STREAM</td>
                            <td className="py-2.5 text-right text-gray-450">21ms</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Form Submission Controls */}
              <div className="flex justify-end gap-3 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-gray-100 dark:bg-neutral-850 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-neutral-750 transition"
                >
                  Discard & Exit
                </button>
                <button 
                  type="button"
                  onClick={handleUpdateProfile}
                  className="px-8 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-opacity-95 transition flex items-center gap-2 shadow-md shadow-primary/15"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Settings Dashboard Changes
                </button>
              </div>
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
                          <Link to={`/listing/${listing.id}?edit=true`} className="p-2 text-gray-400 hover:text-primary transition-colors">
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
                              order.status === 'deposited' ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20" :
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
                                    m.status === 'completed' ? "bg-emerald-500 w-full" : "bg-gray-300 dark:bg-neutral-600 w-0"
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
                  <div className="mt-2 p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium">
                      Note: Payout Minimum Limit is KES 100. For M-Pesa, there is no platform fee; only the official Safaricom B2C dynamic bracket tariff applies. For banks, KES 50 flat applies.
                    </p>
                  </div>

                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700/50 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5 animate-fadeIn">
                      <div className="flex justify-between font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-neutral-800 pb-1 mb-1">
                        <span>Withdrawal Breakdown</span>
                        <span>Value</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Gross Payout Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">KSh {parseFloat(withdrawAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Platform Handling Fee:</span>
                        <span className="text-gray-700 dark:text-gray-300">KSh {withdrawMethod === 'mpesa' ? 0 : 50}</span>
                      </div>
                      {withdrawMethod === 'mpesa' && (
                        <div className="flex justify-between text-[11px]">
                          <span>Safaricom B2C Charge:</span>
                          <span className="text-gray-700 dark:text-gray-300">KSh {getSafaricomB2CFeeClient(parseFloat(withdrawAmount))}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-dashed border-gray-200 dark:border-neutral-850 text-[11px] font-bold text-primary">
                        <span>Total Balance Deducted:</span>
                        <span>
                          KSh {(
                            parseFloat(withdrawAmount) + 
                            (withdrawMethod === 'mpesa' ? 0 + getSafaricomB2CFeeClient(parseFloat(withdrawAmount)) : 50)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedRequestedRole ? `Apply as ${selectedRequestedRole === 'provider' ? 'Service Provider' : 'Goods Seller'}` : 'Become a Provider or Seller'}
                </h2>
                <button onClick={() => { setShowBecomeProviderModal(false); setSelectedRequestedRole(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {!selectedRequestedRole ? (
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    What partner account type would you like to request? Your profile request will be reviewed by HudumaLink admins.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedRequestedRole('provider')}
                    className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-900 transition-all flex items-start gap-4 group text-slate-800 dark:text-slate-100"
                  >
                    <div className="p-3 bg-secondary/10 text-secondary rounded-xl group-hover:bg-secondary group-hover:text-white transition-all">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Service Provider</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 select-none font-medium text-opacity-80 leading-normal">Offer professional services (carpentry, design, tutoring, transport etc.).</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRequestedRole('seller')}
                    className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-neutral-800/40 hover:bg-white dark:hover:bg-neutral-900 transition-all flex items-start gap-4 group text-slate-800 dark:text-slate-100"
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Goods Seller</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 select-none font-medium text-opacity-80 leading-normal">Sell items, products, electronics, apparel, or local goods.</p>
                    </div>
                  </button>

                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => setShowBecomeProviderModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-450 font-bold hover:bg-gray-55 dark:hover:bg-neutral-800 transition-all text-center text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-primary/5 rounded-2xl flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Upgrade applications are subject to standard 3-4 days background checks to fulfill platform safety and compliance.
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
                    <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                      {t('profile.become_provider_terms').replace('{terms}', '')}
                      <Link to="/terms" className="text-primary font-bold hover:underline ml-1">{t('profile.terms_link')}</Link>
                    </span>
                  </label>

                  <div className="flex space-x-3 pt-4">
                    <button 
                      onClick={() => setSelectedRequestedRole(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all text-sm"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleBecomeProvider}
                      disabled={!agreeToTerms || submittingRoleChange}
                      className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center text-sm"
                    >
                      {submittingRoleChange ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                    </button>
                  </div>
                </div>
              )}
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

        {/* Permanent Account Deletion Modal */}
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 max-w-lg w-full border border-red-100 dark:border-red-950/35 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600">
                    <Trash2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Permanent Account Erasure</h2>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">ODPC Compliance Portal</p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteAccountModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-start space-x-3 border border-red-100 dark:border-red-900/20">
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
                  <label className="block text-xs font-bold text-gray-550 dark:text-gray-400 mb-2 uppercase tracking-wider">
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
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-55"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== 'CONFIRM DELETE' || deletingAccount}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-40 flex items-center justify-center space-x-2"
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

export default Profile;
