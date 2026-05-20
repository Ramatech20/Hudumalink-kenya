import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc, getCountFromServer, orderBy, increment, limit } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { useAuth } from '../AuthContext';
import { sendNotification } from '../lib/notifications';
import { Listing, User, Report, UserKYC, Dispute, WithdrawalRequest, Appeal, Transaction, UserRole } from '../types';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield, User as UserIcon, Package, AlertTriangle, ExternalLink, Flag, Trash2, Eye, Wallet, Gavel, Clock, ArrowUpRight, Scale, TrendingUp, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [kycRequests, setKycRequests] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [kycDataMap, setKycDataMap] = useState<Record<string, UserKYC>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'users' | 'reports' | 'kyc' | 'disputes' | 'withdrawals' | 'appeals' | 'promotions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'unverified' | 'flagged' | 'provider' | 'seller'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalTransactions: 0,
    totalEscrow: 0,
    pendingKYC: 0,
    openDisputes: 0
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [newUserData, setNewUserData] = useState({
    email: '',
    displayName: '',
    role: 'customer' as UserRole,
    phoneNumber: ''
  });

  const [newPromoData, setNewPromoData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target: 'all' as 'all' | 'providers' | 'sellers' | 'customers',
    sendSmsPlaceholder: false
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user || !user.uid) {
        navigate('/login');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          throw error;
        }
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          fetchOverviewStats();
        } else {
          handleGeneralError(new Error('Access denied. Admin only.'), 'Access Denied');
          navigate('/');
        }
      } catch (error: any) {
        if (!error.operationType) {
          handleGeneralError(error, 'Error checking admin status');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTabData();
    }
  }, [activeTab, isAdmin]);

  const fetchOverviewStats = async () => {
    try {
      let usersCount, listingsCount, txCount, disputesCount, kycCount;
      try {
        [
          usersCount,
          listingsCount,
          txCount,
          disputesCount,
          kycCount
        ] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'listings')),
          getCountFromServer(collection(db, 'transactions')),
          getCountFromServer(query(collection(db, 'disputes'), where('status', '==', 'open'))),
          getCountFromServer(query(collection(db, 'users'), where('kycStatus', '==', 'pending')))
        ]);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, 'overview_stats_counts');
        throw error;
      }
      
      const balanceQuery = query(collection(db, 'users'), where('escrowBalance', '>', 0));
      let balanceSnapshot;
      try {
        balanceSnapshot = await getDocs(balanceQuery);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'users_with_balance');
        throw error;
      }
      
      let totalEscrow = 0;
      balanceSnapshot.docs.forEach(doc => {
        totalEscrow += (doc.data().escrowBalance || 0);
      });

      // Fetch recent activity (last 10 transactions)
      const recentTxQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(10));
      let recentTxSnapshot;
      try {
        recentTxSnapshot = await getDocs(recentTxQuery);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'recent_transactions');
        throw error;
      }
      setRecentActivity(recentTxSnapshot.docs.map(doc => ({ id: doc.id, type: 'transaction', ...doc.data() })));

      setStats({
        totalUsers: usersCount.data().count,
        totalListings: listingsCount.data().count,
        totalTransactions: txCount.data().count,
        totalEscrow,
        pendingKYC: kycCount.data().count,
        openDisputes: disputesCount.data().count
      });
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.GET, 'overview_stats');
      }
    }
  };

  const fetchTabData = async () => {
    setIsDataLoading(true);
    setSelectedItems([]); // Reset selection on tab change
    try {
      switch (activeTab) {
        case 'overview':
          await fetchOverviewStats();
          break;
        case 'listings':
          const listingsQuery = query(collection(db, 'listings'), where('status', '==', 'pending'));
          let listingsSnapshot;
          try {
            listingsSnapshot = await getDocs(listingsQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'listings/pending');
            throw error;
          }
          setPendingListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
          break;
        case 'users':
          let usersQuery;
          if (userFilter === 'unverified') {
            usersQuery = query(collection(db, 'users'), where('isVerified', '==', false));
          } else if (userFilter === 'flagged') {
            usersQuery = query(collection(db, 'users'), where('isFlagged', '==', true));
          } else if (userFilter === 'provider') {
            usersQuery = query(collection(db, 'users'), where('role', '==', 'provider'));
          } else if (userFilter === 'seller') {
            usersQuery = query(collection(db, 'users'), where('role', '==', 'seller'));
          } else {
            usersQuery = query(collection(db, 'users'), limit(100));
          }
          
          let usersSnapshot;
          try {
            usersSnapshot = await getDocs(usersQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'users');
            throw error;
          }
          setUnverifiedUsers(usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
          break;
        case 'reports':
          const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'));
          let reportsSnapshot;
          try {
            reportsSnapshot = await getDocs(reportsQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'reports/pending');
            throw error;
          }
          setReports(reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
          break;
        case 'kyc':
          const kycQuery = query(collection(db, 'users'), where('kycStatus', '==', 'pending'));
          let kycSnapshot;
          try {
            kycSnapshot = await getDocs(kycQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'users/kyc_pending');
            throw error;
          }
          const users = kycSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
          setKycRequests(users);
          const dataMap: Record<string, UserKYC> = {};
          try {
            await Promise.all(users.map(async (u) => {
              const dataDoc = await getDoc(doc(db, 'users', u.uid, 'kyc', 'data'));
              if (dataDoc.exists()) {
                dataMap[u.uid] = dataDoc.data() as UserKYC;
              }
            }));
          } catch (error: any) {
            handleFirestoreError(error, OperationType.GET, 'kyc_data');
            throw error;
          }
          setKycDataMap(dataMap);
          break;
        case 'disputes':
          const disputesQuery = query(collection(db, 'disputes'), where('status', '==', 'open'));
          let disputesSnapshot;
          try {
            disputesSnapshot = await getDocs(disputesQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'disputes/open');
            throw error;
          }
          setDisputes(disputesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute)));
          break;
        case 'withdrawals':
          const withdrawalsQuery = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
          let withdrawalsSnapshot;
          try {
            withdrawalsSnapshot = await getDocs(withdrawalsQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'withdrawals/pending');
            throw error;
          }
          setWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));
          break;
        case 'appeals':
          const appealsQuery = query(collection(db, 'appeals'), where('status', '==', 'pending'));
          let appealsSnapshot;
          try {
            appealsSnapshot = await getDocs(appealsQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'appeals/pending');
            throw error;
          }
          setAppeals(appealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appeal)));
          break;
        case 'promotions':
          const promotionsQuery = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
          let promotionsSnapshot;
          try {
            promotionsSnapshot = await getDocs(promotionsQuery);
          } catch (error: any) {
            handleFirestoreError(error, OperationType.LIST, 'promotions');
            throw error;
          }
          setPromotions(promotionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          break;
      }
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.LIST, activeTab);
      }
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'verify') => {
    if (selectedItems.length === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedItems.length} items?`;
    if (!window.confirm(confirmMessage)) return;

    setIsDataLoading(true);
    try {
      await Promise.all(selectedItems.map(async (id) => {
        if (activeTab === 'listings') {
          if (action === 'approve') await approveListing(id);
          else if (action === 'reject') await rejectListing(id);
        } else if (activeTab === 'users') {
          if (action === 'verify') await verifyUser(id);
        } else if (activeTab === 'kyc') {
          if (action === 'approve') await approveKYC(id);
          // Rejection requires a reason, so bulk rejection is tricky
        }
      }));
      toast.success(`Bulk ${action} completed`);
      setSelectedItems([]);
      fetchTabData();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Some actions failed. Please check the logs.');
    } finally {
      setIsDataLoading(false);
    }
  };

  const filteredUsers = unverifiedUsers.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.uid.includes(searchQuery)
  );

  const filteredListings = pendingListings.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.id.includes(searchQuery)
  );

  const handleResolveAppeal = async (appealId: string, action: 'approve' | 'reject') => {
    try {
      const appeal = appeals.find(a => a.id === appealId);
      if (!appeal) return;

      try {
        await updateDoc(doc(db, 'appeals', appealId), {
          status: action === 'approve' ? 'approved' : 'rejected',
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `appeals/${appealId}`);
        throw error;
      }

      if (action === 'approve') {
        try {
          await updateDoc(doc(db, 'users', appeal.userId), {
            isFlagged: false,
            cancellationCount: 0,
            flagReason: null
          });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${appeal.userId}`);
          throw error;
        }
      }

      await sendNotification(
        appeal.userId,
        `Appeal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        action === 'approve' 
          ? 'Your appeal has been approved. Your account restrictions have been lifted.' 
          : 'Your appeal has been rejected after review. The original decision stands.',
        action === 'approve' ? 'success' : 'error',
        '/profile'
      );

      toast.success(`Appeal ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchTabData();
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `appeals/${appealId}`);
      }
    }
  };

  const flagUser = async (uid: string) => {
    if (!flagReason) {
      toast.error('Please provide a reason for flagging');
      return;
    }
    try {
      try {
        await updateDoc(doc(db, 'users', uid), {
          isFlagged: true,
          flagReason: flagReason,
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        throw error;
      }
      toast.success('User flagged successfully');
      
      await sendNotification(
        uid,
        'Account Flagged',
        `Your account has been flagged by an admin. Reason: ${flagReason}. Please contact support if you believe this is an error.`,
        'error',
        '/profile'
      );

      setFlagReason('');
      setShowUserModal(false);
      fetchTabData();
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    }
  };

  const unflagUser = async (uid: string) => {
    try {
      try {
        await updateDoc(doc(db, 'users', uid), {
          isFlagged: false,
          flagReason: null,
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        throw error;
      }
      toast.success('User unflagged successfully');
      
      await sendNotification(
        uid,
        'Account Unflagged',
        'Your account has been reviewed and unflagged by an admin. You can now use all platform features.',
        'success',
        '/profile'
      );

      setShowUserModal(false);
      fetchTabData();
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    }
  };

  const approveListing = async (id: string) => {
    try {
      const listingDocRef = doc(db, 'listings', id);
      let listingDoc;
      try {
        listingDoc = await getDoc(listingDocRef);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `listings/${id}`);
        throw error;
      }
      
      if (!listingDoc.exists()) return;
      const listingData = listingDoc.data() as Listing;

      try {
        await updateDoc(listingDocRef, { status: 'active' });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
        throw error;
      }
      
      setPendingListings(prev => prev.filter(l => l.id !== id));
      
      await sendNotification(
        listingData.authorId,
        'Listing Approved!',
        `Your listing "${listingData.title}" has been approved and is now live.`,
        'success',
        `/listing/${id}`
      );

      toast.success('Listing approved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
    }
  };

  const rejectListing = async (id: string) => {
    try {
      const listingDocRef = doc(db, 'listings', id);
      let listingDoc;
      try {
        listingDoc = await getDoc(listingDocRef);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `listings/${id}`);
        throw error;
      }
      
      if (!listingDoc.exists()) return;
      const listingData = listingDoc.data() as Listing;

      try {
        await updateDoc(listingDocRef, { status: 'removed' });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
        throw error;
      }
      
      setPendingListings(prev => prev.filter(l => l.id !== id));

      await sendNotification(
        listingData.authorId,
        'Listing Rejected',
        `Your listing "${listingData.title}" was rejected by an admin.`,
        'error'
      );

      toast.success('Listing rejected');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
    }
  };

  const verifyUser = async (uid: string) => {
    try {
      try {
        await updateDoc(doc(db, 'users', uid), { isVerified: true });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        throw error;
      }
      setUnverifiedUsers(prev => prev.filter(u => u.uid !== uid));
      
      await sendNotification(
        uid,
        'Account Verified!',
        'Your account has been verified by an admin. You now have the verified badge!',
        'success',
        '/profile'
      );

      toast.success('User verified!');
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    }
  };

  const approveKYC = async (uid: string) => {
    try {
      try {
        await updateDoc(doc(db, 'users', uid), { 
          kycStatus: 'verified',
          isVerified: true 
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        throw error;
      }
      setKycRequests(prev => prev.filter(u => u.uid !== uid));

      await sendNotification(
        uid,
        'KYC Approved!',
        'Your identity verification (KYC) has been approved. Your account is now fully verified.',
        'success',
        '/profile'
      );

      toast.success('KYC approved and user verified!');
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    }
  };

  const rejectKYC = async (uid: string) => {
    if (!rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      try {
        await updateDoc(doc(db, 'users', uid), { 
          kycStatus: 'rejected'
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
        throw error;
      }
      
      try {
        await updateDoc(doc(db, 'users', uid, 'kyc', 'data'), {
          rejectionReason: rejectionReason
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/kyc/data`);
        throw error;
      }
      
      setKycRequests(prev => prev.filter(u => u.uid !== uid));

      await sendNotification(
        uid,
        'KYC Rejected',
        `Your identity verification was rejected. Reason: ${rejectionReason}`,
        'error',
        '/kyc'
      );

      toast.success('KYC rejected');
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDataLoading(true);
    try {
      // In a real app, you'd use Firebase Admin SDK or a cloud function to create the auth user
      // For this demo, we'll just simulate by adding a document to the users collection if it doesn't exist
      // Usually admins invite users or use a specific API.
      
      const userId = `admin_created_${Date.now()}`;
      const userRef = doc(db, 'users', userId);
      
      const userData = {
        uid: userId,
        email: newUserData.email,
        displayName: newUserData.displayName,
        role: newUserData.role,
        phoneNumber: newUserData.phoneNumber,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        referralEarnings: 0,
        escrowBalance: 0,
        createdAt: new Date().toISOString(),
        isVerified: true, // Admin created users can be pre-verified
        kycStatus: 'none'
      };

      await addDoc(collection(db, 'users'), userData);
      toast.success('User created successfully');
      setShowCreateUserModal(false);
      fetchTabData();
    } catch (error: any) {
      handleGeneralError(error, 'Failed to create user');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSendMassMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDataLoading(true);
    try {
      let usersQuery;
      if (newPromoData.target === 'all') {
        usersQuery = query(collection(db, 'users'));
      } else if (newPromoData.target === 'providers') {
        usersQuery = query(collection(db, 'users'), where('role', '==', 'provider'));
      } else if (newPromoData.target === 'sellers') {
        usersQuery = query(collection(db, 'users'), where('role', '==', 'seller'));
      } else {
        usersQuery = query(collection(db, 'users'), where('role', '==', 'customer'));
      }

      const usersSnapshot = await getDocs(usersQuery);
      const batchPromises = usersSnapshot.docs.map(userDoc => 
        sendNotification(
          userDoc.id,
          newPromoData.title,
          newPromoData.message,
          newPromoData.type,
          '/promotions'
        )
      );

      await Promise.all(batchPromises);
      
      if (newPromoData.sendSmsPlaceholder) {
        toast.info('SMS Notifications queued (Placeholder)');
      }

      toast.success(`Broadcasting to ${usersSnapshot.size} users completed`);
      setShowCreatePromoModal(false);
      setNewPromoData({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
        sendSmsPlaceholder: false
      });
    } catch (error: any) {
      handleGeneralError(error, 'Failed to send mass messages');
    } finally {
      setIsDataLoading(false);
    }
  };

  const resolveReport = async (reportId: string, listingId: string, action: 'remove' | 'dismiss') => {
    try {
      const report = reports.find(r => r.id === reportId);
      const listingDocRef = doc(db, 'listings', listingId);
      let listingDoc;
      try {
        listingDoc = await getDoc(listingDocRef);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `listings/${listingId}`);
        throw error;
      }
      
      const listing = listingDoc.exists() ? { id: listingDoc.id, ...listingDoc.data() } as Listing : null;

      if (action === 'remove') {
        try {
          await updateDoc(listingDocRef, { status: 'removed' });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.UPDATE, `listings/${listingId}`);
          throw error;
        }
        
        // Notify listing owner
        if (listing) {
          await sendNotification(
            listing.authorId,
            'Listing Removed',
            `Your listing "${listing.title}" has been removed due to reports of policy violations.`,
            'error',
            '/profile'
          );
        }
        
        toast.success('Listing removed and report resolved');
      } else {
        toast.success('Report dismissed');
      }
      
      // Notify reporter if they are logged in
      if (report?.reporterId) {
        await sendNotification(
          report.reporterId,
          'Report Resolved',
          `Your report for listing "${listing?.title || 'a listing'}" has been ${action === 'remove' ? 'resolved and the listing removed' : 'dismissed after review'}.`,
          'info',
          '/profile'
        );
      }

      try {
        await updateDoc(doc(db, 'reports', reportId), { status: action === 'remove' ? 'resolved' : 'dismissed' });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
        throw error;
      }
      
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
      }
    }
  };

  const resolveDispute = async (disputeId: string, transactionId: string, action: 'refund' | 'release') => {
    try {
      const txRef = doc(db, 'transactions', transactionId);
      let txDoc;
      try {
        txDoc = await getDoc(txRef);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.GET, `transactions/${transactionId}`);
        throw error;
      }
      
      if (!txDoc.exists()) {
        toast.error('Transaction not found');
        return;
      }

      const txData = txDoc.data() as Transaction;

      if (action === 'refund') {
        // 1. Get buyer info
        const buyerRef = doc(db, 'users', txData.buyerId);
        let buyerDoc;
        try {
          buyerDoc = await getDoc(buyerRef);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `users/${txData.buyerId}`);
          throw error;
        }
        
        if (!buyerDoc.exists()) {
          toast.error('Buyer not found');
          return;
        }

        const buyerData = buyerDoc.data() as User;

        // 2. Initiate M-Pesa Refund (B2C)
        const token = await auth.currentUser?.getIdToken();
        const headers: any = { 
          'Content-Type': 'application/json',
          'X-Admin-ID': user?.uid || ''
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const payoutRes = await fetch('/api/admin/payout', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId: txData.buyerId,
            amount: txData.amount,
            phoneNumber: buyerData.phoneNumber?.replace(/\+/g, ''),
            reason: `Refund for dispute on transaction ${transactionId}`,
            type: 'Refund'
          })
        });

        const payoutData = await payoutRes.json();
        if (payoutRes.status !== 200) {
          throw new Error(payoutData.error || 'Refund failed');
        }

        // 3. Notify both parties
        await sendNotification(
          txData.buyerId,
          'Dispute Resolved: Refunded',
          `Your refund of KES ${txData.amount} for transaction ${transactionId} has been processed following a dispute resolution.`,
          'success',
          '/profile'
        );
        await sendNotification(
          txData.sellerId,
          'Dispute Resolved: Refunded to Buyer',
          `The dispute for transaction ${transactionId} has been resolved. The funds (KES ${txData.amount}) have been refunded to the buyer.`,
          'info',
          '/profile'
        );
      } else {
        // Release funds to seller
        const sellerRef = doc(db, 'users', txData.sellerId);
        let sellerDoc;
        try {
          sellerDoc = await getDoc(sellerRef);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `users/${txData.sellerId}`);
          throw error;
        }
        
        if (sellerDoc.exists()) {
          const currentBalance = sellerDoc.data().escrowBalance || 0;
          try {
            await updateDoc(sellerRef, {
              escrowBalance: currentBalance + txData.amount
            });
          } catch (error: any) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${txData.sellerId}`);
            throw error;
          }
        }

        // 3. Notify both parties
        await sendNotification(
          txData.sellerId,
          'Dispute Resolved: Funds Released',
          `The funds (KES ${txData.amount}) for transaction ${transactionId} have been released to your balance following a dispute resolution.`,
          'success',
          '/profile'
        );
        await sendNotification(
          txData.buyerId,
          'Dispute Resolved: Funds Released to Seller',
          `The dispute for transaction ${transactionId} has been resolved. The funds have been released to the seller.`,
          'info',
          '/profile'
        );
      }

      try {
        await updateDoc(txRef, { 
          status: action === 'refund' ? 'cancelled' : 'completed',
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
        throw error;
      }
      
      try {
        await updateDoc(doc(db, 'disputes', disputeId), { 
          status: action === 'refund' ? 'refunded' : 'resolved',
          resolution: `Admin resolved by ${action === 'refund' ? 'refunding buyer' : 'releasing funds to seller'}`,
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `disputes/${disputeId}`);
        throw error;
      }

      setDisputes(prev => prev.filter(d => d.id !== disputeId));
      toast.success(`Dispute resolved: ${action}`);
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `disputes/${disputeId}`);
      }
    }
  };

  const handleWithdrawal = async (withdrawalId: string, userId: string, amount: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const userRef = doc(db, 'users', userId);
        let userDoc;
        try {
          userDoc = await getDoc(userRef);
        } catch (error: any) {
          handleFirestoreError(error, OperationType.GET, `users/${userId}`);
          throw error;
        }
        
        if (!userDoc.exists()) {
          toast.error('User not found');
          return;
        }

        const userData = userDoc.data() as User;
        const currentBalance = userData.escrowBalance || 0;

        if (currentBalance < amount) {
          toast.error('Insufficient user balance');
          return;
        }

        // 1. Initiate M-Pesa Payout (B2C)
        const token = await auth.currentUser?.getIdToken();
        const headers: any = { 
          'Content-Type': 'application/json',
          'X-Admin-ID': user?.uid || ''
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const payoutRes = await fetch('/api/admin/payout', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId,
            amount,
            phoneNumber: userData.phoneNumber?.replace(/\+/g, ''),
            reason: 'Withdrawal from HudumaLink',
            type: 'Withdrawal'
          })
        });

        const payoutData = await payoutRes.json();
        if (payoutRes.status !== 200) {
          throw new Error(payoutData.error || 'Payout failed');
        }

        // 2. Deduct from user balance
        try {
          await updateDoc(userRef, {
            escrowBalance: currentBalance - amount
          });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
          throw error;
        }

        // 3. Notify user
        await sendNotification(
          userId,
          'Withdrawal Approved',
          `Your withdrawal of KES ${amount} has been approved and sent to your M-Pesa.`,
          'success',
          '/profile'
        );
      } else {
        // Reject withdrawal - refund the balance
        if (!rejectionReason) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        
        const userRef = doc(db, 'users', userId);
        try {
          await updateDoc(userRef, {
            escrowBalance: increment(amount)
          });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
          throw error;
        }

        // Notify user
        await sendNotification(
          userId,
          'Withdrawal Rejected',
          `Your withdrawal of KES ${amount} was rejected. Reason: ${rejectionReason}. Funds have been returned to your escrow balance.`,
          'error',
          '/profile'
        );
      }
      
      try {
        await updateDoc(doc(db, 'withdrawals', withdrawalId), { 
          status: action === 'approve' ? 'completed' : 'rejected',
          rejectionReason: action === 'reject' ? rejectionReason : null,
          updatedAt: new Date().toISOString()
        });
      } catch (error: any) {
        handleFirestoreError(error, OperationType.UPDATE, `withdrawals/${withdrawalId}`);
        throw error;
      }

      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      toast.success(`Withdrawal ${action}d`);
      setRejectionReason('');
    } catch (error: any) {
      if (!error.operationType) {
        handleFirestoreError(error, OperationType.UPDATE, `withdrawals/${withdrawalId}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary" /> Admin Dashboard
            {isDataLoading && <Loader2 className="w-5 h-5 ml-4 animate-spin text-primary" />}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage listings and verify service providers.</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline-block mr-2" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'listings' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-2" />
            Pending Listings ({pendingListings.length})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <UserIcon className="w-4 h-4 inline-block mr-2" />
            Verification Requests ({unverifiedUsers.length})
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'reports' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Flag className="w-4 h-4 inline-block mr-2" />
            Reports ({reports.length})
          </button>
          <button 
            onClick={() => setActiveTab('kyc')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'kyc' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Shield className="w-4 h-4 inline-block mr-2" />
            KYC ({kycRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'disputes' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Gavel className="w-4 h-4 inline-block mr-2" />
            Disputes ({disputes.length})
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'withdrawals' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Wallet className="w-4 h-4 inline-block mr-2" />
            Withdrawals ({withdrawals.length})
          </button>
          <button 
            onClick={() => setActiveTab('appeals')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'appeals' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Scale className="w-4 h-4 inline-block mr-2" />
            Appeals ({appeals.length})
          </button>
          <button 
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'promotions' 
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 inline-block mr-2" />
            Promotions ({promotions.length})
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <UserIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12%
                </span>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                  <Package className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-500 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +5%
                </span>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Listings</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalListings}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-primary">Active Escrow</span>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Escrow Funds</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatPrice(stats.totalEscrow)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                  <Zap className="w-5 h-5 mr-2 text-primary" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => setActiveTab('listings')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group"
                  >
                    <Package className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Review Listings</span>
                    <span className="text-[10px] text-gray-500 mt-1">{pendingListings.length} pending</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('kyc')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group"
                  >
                    <Shield className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Verify KYC</span>
                    <span className="text-[10px] text-gray-500 mt-1">{stats.pendingKYC} pending</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('disputes')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group"
                  >
                    <Gavel className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Resolve Disputes</span>
                    <span className="text-[10px] text-gray-500 mt-1">{stats.openDisputes} open</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('withdrawals')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group"
                  >
                    <Wallet className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Withdrawals</span>
                    <span className="text-[10px] text-gray-500 mt-1">{withdrawals.length} pending</span>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                  <Clock className="w-5 h-5 mr-2 text-primary" /> Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-center py-8 text-gray-500">No recent activity found.</p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                        <div className="flex items-center">
                          <div className={cn(
                            "p-2 rounded-xl mr-4",
                            activity.status === 'completed' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                          )}>
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Transaction {activity.id.slice(0, 8)}...</p>
                            <p className="text-[10px] text-gray-500">{formatDate(activity.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(activity.amount)}</p>
                          <p className={cn(
                            "text-[10px] font-bold uppercase",
                            activity.status === 'completed' ? "text-green-500" : "text-yellow-500"
                          )}>{activity.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> Action Required
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending KYC</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{stats.pendingKYC}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Disputes</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{stats.openDisputes}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Listings</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{pendingListings.length}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('listings')}
                  className="mt-6 w-full py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition-all"
                >
                  Go to Tasks
                </button>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                  <Zap className="w-5 h-5 mr-2 text-primary" /> Platform Health
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">User Growth</span>
                      <span className="font-bold text-green-500">+12%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[75%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Tx Success Rate</span>
                      <span className="font-bold text-primary">98.5%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[98.5%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'listings' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Search listings by title or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
              />
              <Eye className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => handleBulkAction('approve')}
                disabled={selectedItems.length === 0}
                className="flex-1 md:flex-none px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
              >
                Approve Selected ({selectedItems.length})
              </button>
              <button 
                onClick={() => handleBulkAction('reject')}
                disabled={selectedItems.length === 0}
                className="flex-1 md:flex-none px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
              >
                Reject Selected
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredListings.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No listings found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search query.</p>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div key={listing.id} className={cn(
                  "bg-white dark:bg-neutral-900 rounded-2xl p-6 border transition-all flex flex-col md:flex-row gap-6 items-start",
                  selectedItems.includes(listing.id) ? "border-primary ring-1 ring-primary" : "border-gray-100 dark:border-neutral-800"
                )}>
                  <div className="flex items-center self-stretch">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(listing.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems([...selectedItems, listing.id]);
                        else setSelectedItems(selectedItems.filter(id => id !== listing.id));
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{listing.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{listing.description}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">{listing.price ? formatPrice(listing.price) : 'Contact for Price'}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded uppercase font-bold text-xs">{listing.type}</span>
                    <span>{listing.category}</span>
                    <span>{listing.location.town}, {listing.location.county}</span>
                    {listing.aiModerationResult && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        listing.aiModerationResult.isSafe 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        AI: {listing.aiModerationResult.isSafe ? 'SAFE' : 'FLAGGED'}
                        {!listing.aiModerationResult.isSafe && ` - ${listing.aiModerationResult.reason}`}
                      </span>
                    )}
                  </div>
                </div>
                  <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <Link 
                    to={`/listing/${listing.id}`} 
                    className="flex-grow md:w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm text-center hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> View
                  </Link>
                  <button 
                    onClick={() => approveListing(listing.id)}
                    className="flex-grow md:w-full px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </button>
                  <button 
                    onClick={() => rejectListing(listing.id)}
                    className="flex-grow md:w-full px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      ) : activeTab === 'users' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Search users by name, email or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary"
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value as any)}
                className="px-4 py-2 bg-gray-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="all">All Users</option>
                <option value="unverified">Unverified Only</option>
                <option value="flagged">Flagged Only</option>
                <option value="provider">Providers Only</option>
                <option value="seller">Sellers Only</option>
              </select>
              
              <button 
                onClick={() => handleBulkAction('verify')}
                disabled={selectedItems.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Verify Selected ({selectedItems.length})
              </button>
              
              <button 
                onClick={() => setShowCreateUserModal(true)}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:bg-secondary/90 transition-colors flex items-center"
              >
                <UserIcon className="w-4 h-4 mr-2" /> Add Member
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
                <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">No users found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filters.</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.uid} className={cn(
                  "bg-white dark:bg-neutral-900 rounded-2xl p-6 border transition-all flex flex-col items-center text-center relative",
                  selectedItems.includes(user.uid) ? "border-primary ring-1 ring-primary" : "border-gray-100 dark:border-neutral-800"
                )}>
                  <div className="absolute top-4 left-4">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(user.uid)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems([...selectedItems, user.uid]);
                        else setSelectedItems(selectedItems.filter(id => id !== user.uid));
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-primary/20">
                    <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.displayName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
                  <div className="flex gap-1 mb-4">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded text-[10px] font-bold uppercase text-gray-500">{user.role}</span>
                    {user.isVerified && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">Verified</span>}
                  </div>
                  {user.isFlagged && (
                    <div className="mb-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold uppercase flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Flagged: {user.flagReason || 'Excessive Cancellations'}
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    {!user.isVerified && (
                      <button 
                        onClick={() => verifyUser(user.uid)}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Verify
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'kyc' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" /> Pending KYC ({kycRequests.length})
            </h3>
            <button 
              onClick={() => handleBulkAction('approve')}
              disabled={selectedItems.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
            >
              Approve Selected ({selectedItems.length})
            </button>
          </div>

          {kycRequests.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending KYC requests</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All identity verifications are up to date.</p>
            </div>
          ) : (
            kycRequests.map((u) => (
              <div key={u.uid} className={cn(
                "bg-white dark:bg-neutral-900 rounded-2xl p-6 border transition-all",
                selectedItems.includes(u.uid) ? "border-primary ring-1 ring-primary" : "border-gray-100 dark:border-neutral-800"
              )}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(u.uid)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems([...selectedItems, u.uid]);
                        else setSelectedItems(selectedItems.filter(id => id !== u.uid));
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center space-x-4 mb-4">
                      <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{u.displayName}</h3>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">ID Type</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{kycDataMap[u.uid]?.idType}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">ID Number</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{kycDataMap[u.uid]?.idNumber}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Submitted At</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{kycDataMap[u.uid]?.submittedAt ? formatDate(kycDataMap[u.uid].submittedAt) : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500">ID Front</p>
                        <a href={kycDataMap[u.uid]?.idFrontUrl} target="_blank" rel="noreferrer" className="block h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
                          <img src={kycDataMap[u.uid]?.idFrontUrl} className="w-full h-full object-cover" />
                        </a>
                      </div>
                      {kycDataMap[u.uid]?.idBackUrl && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-gray-500">ID Back</p>
                          <a href={kycDataMap[u.uid]?.idBackUrl} target="_blank" rel="noreferrer" className="block h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
                            <img src={kycDataMap[u.uid]?.idBackUrl} className="w-full h-full object-cover" />
                          </a>
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500">Selfie with ID</p>
                        <a href={kycDataMap[u.uid]?.selfieUrl} target="_blank" rel="noreferrer" className="block h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
                          <img src={kycDataMap[u.uid]?.selfieUrl} className="w-full h-full object-cover" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-64 space-y-3">
                    <button 
                      onClick={() => approveKYC(u.uid)}
                      className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve KYC
                    </button>
                    <div className="space-y-2">
                      <textarea 
                        placeholder="Reason for rejection..."
                        value={selectedUser?.uid === u.uid ? rejectionReason : ''}
                        onChange={(e) => {
                          setSelectedUser(u);
                          setRejectionReason(e.target.value);
                        }}
                        className="w-full p-3 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                      />
                      <button 
                        onClick={() => rejectKYC(u.uid)}
                        className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject KYC
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'disputes' ? (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Gavel className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No active disputes</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Everything is running smoothly.</p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <div key={dispute.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {dispute.reason.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(dispute.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-bold text-gray-900 dark:text-gray-100">Details:</span> {dispute.details}
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-xs text-gray-400">Transaction: {dispute.transactionId}</span>
                      <span className="text-xs text-gray-400">Raised By: {dispute.raisedById}</span>
                    </div>
                    {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Evidence Uploaded:</p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidenceUrls.map((url, idx) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-700 hover:opacity-80 transition-opacity"
                            >
                              {url.includes('.mp4') || url.includes('.mov') ? (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white text-[10px]">VIDEO</div>
                              ) : (
                                <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                    <button 
                      onClick={() => resolveDispute(dispute.id, dispute.transactionId, 'refund')}
                      className="w-full py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                    >
                      Refund Buyer
                    </button>
                    <button 
                      onClick={() => resolveDispute(dispute.id, dispute.transactionId, 'release')}
                      className="w-full py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                    >
                      Release to Seller
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'withdrawals' ? (
        <div className="space-y-4">
          {withdrawals.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending withdrawals</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All requests have been processed.</p>
            </div>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">KSh {w.amount.toLocaleString()}</h3>
                          <p className="text-xs text-gray-500">Requested by {(w as any).userName || w.userId}</p>
                        </div>
                      </div>
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {w.method}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-xl text-sm">
                      {w.method === 'mpesa' ? (
                        <p className="text-gray-600 dark:text-gray-400">Phone: <span className="font-bold text-gray-900 dark:text-white">{w.details.phoneNumber}</span></p>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-gray-600 dark:text-gray-400">Bank: <span className="font-bold text-gray-900 dark:text-white">{w.details.bankName}</span></p>
                          <p className="text-gray-600 dark:text-gray-400">Account: <span className="font-bold text-gray-900 dark:text-white">{w.details.accountNumber}</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                    <button 
                      onClick={() => handleWithdrawal(w.id, w.userId, w.amount, 'approve')}
                      className="w-full py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                    >
                      Approve & Pay
                    </button>
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      />
                      <button 
                        onClick={() => handleWithdrawal(w.id, w.userId, w.amount, 'reject')}
                        className="w-full py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'reports' ? (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Flag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending reports</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">The platform is safe!</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {report.reason}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-bold text-gray-900 dark:text-gray-100">Details:</span> {report.details || 'No additional details provided.'}
                  </p>
                  <div className="flex items-center space-x-4">
                    <Link to={`/listing/${report.listingId}`} className="text-xs text-primary font-bold flex items-center hover:underline">
                      <Eye className="w-3 h-3 mr-1" /> View Listing
                    </Link>
                    <span className="text-xs text-gray-400">Reporter ID: {report.reporterId}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => resolveReport(report.id, report.listingId, 'remove')}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove Listing
                  </button>
                  <button 
                    onClick={() => resolveReport(report.id, report.listingId, 'dismiss')}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors flex items-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'appeals' ? (
        <div className="space-y-4">
          {appeals.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Scale className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending appeals</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All accounts are in good standing.</p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <div key={appeal.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Appeal from {appeal.userId}</h3>
                        <p className="text-xs text-gray-500">Submitted on {formatDate(appeal.createdAt)}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reason for Appeal:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{appeal.reason}"</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                    <button 
                      onClick={() => handleResolveAppeal(appeal.id, 'approve')}
                      className="w-full py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                    >
                      Approve Appeal
                    </button>
                    <button 
                      onClick={() => handleResolveAppeal(appeal.id, 'reject')}
                      className="w-full py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                    >
                      Reject Appeal
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'promotions' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Promotions & Campaigns</h2>
              <p className="text-sm text-gray-500">Send mass notifications and manage paid promotions.</p>
            </div>
            <button 
              onClick={() => setShowCreatePromoModal(true)}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center shadow-lg shadow-primary/20"
            >
              <Zap className="w-5 h-5 mr-2" /> Create Broadcast
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <h4 className="text-gray-500 text-xs font-bold uppercase mb-2">Active Campaigns</h4>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{promotions.filter(p => p.status === 'completed').length}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <h4 className="text-gray-500 text-xs font-bold uppercase mb-2">Total Promotion Revenue</h4>
              <p className="text-2xl font-black text-primary">{formatPrice(promotions.reduce((acc, p) => acc + (p.amount || 0), 0))}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
              <h4 className="text-gray-500 text-xs font-bold uppercase mb-2">Pending Promotions</h4>
              <p className="text-2xl font-black text-yellow-500">{promotions.filter(p => p.status === 'pending').length}</p>
            </div>
          </div>
          {isDataLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300 opacity-20" />
              <p className="text-gray-500 dark:text-gray-400">No promotions found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                      promo.status === 'completed' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {promo.status}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(promo.amount)}</div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      promo.tier === 'elite' ? "bg-purple-100 text-purple-700" :
                      promo.tier === 'premium' ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {promo.tier}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">Listing: {promo.listingId}</h3>
                    <p className="text-[10px] text-gray-500">User: {promo.userId}</p>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 border-t border-gray-100 dark:border-neutral-800 pt-4">
                    <span>{promo.durationDays} days</span>
                    <span>Expires: {promo.expiresAt ? formatDate(promo.expiresAt) : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Modals */}
      <AnimatePresence>
        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-primary" /> User Details
                </h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-grow">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-primary/10 flex-shrink-0 mx-auto md:mx-0">
                    <img 
                      src={selectedUser.photoURL || `https://ui-avatars.com/api/?name=${selectedUser.displayName}`} 
                      alt={selectedUser.displayName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.displayName}</h3>
                      <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Role</p>
                        <p className="text-sm font-bold text-primary uppercase">{selectedUser.role}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                        <p className={cn(
                          "text-sm font-bold uppercase",
                          selectedUser.isVerified ? "text-green-500" : "text-yellow-500"
                        )}>
                          {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Escrow Balance</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(selectedUser.escrowBalance || 0)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">KYC Status</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{selectedUser.kycStatus || 'None'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  {selectedUser.role === 'customer' && (
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-primary" /> Verification Progress
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-gray-600 dark:text-gray-400">Completed Payments</span>
                          <span className="text-primary">{selectedUser.completedPaymentsCount || 0} / 5</span>
                        </div>
                        <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${Math.min(((selectedUser.completedPaymentsCount || 0) / 5) * 100, 100)}%` }}
                          ></div>
                        </div>
                        {(selectedUser.completedPaymentsCount || 0) >= 5 ? (
                          <p className="text-sm text-green-500 font-bold mt-2">This user has met the 5-payment requirement for verification.</p>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">User needs {5 - (selectedUser.completedPaymentsCount || 0)} more payments to be eligible for verification.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20">
                    <h4 className="font-bold text-red-700 dark:text-red-400 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" /> Account Moderation
                    </h4>
                    <div className="flex gap-2 mb-4">
                      {!selectedUser.isVerified && (
                        <button 
                          onClick={() => {
                            verifyUser(selectedUser.uid);
                            setShowUserModal(false);
                          }}
                          className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                        >
                          Verify User
                        </button>
                      )}
                      {selectedUser.kycStatus === 'pending' && (
                        <button 
                          onClick={() => {
                            approveKYC(selectedUser.uid);
                            setShowUserModal(false);
                          }}
                          className="flex-1 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-all"
                        >
                          Approve KYC
                        </button>
                      )}
                    </div>
                    {selectedUser.isFlagged ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-red-200 dark:border-red-900/30">
                          <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Reason for Flagging:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{selectedUser.flagReason || 'No reason provided.'}</p>
                        </div>
                        <button 
                          onClick={() => unflagUser(selectedUser.uid)}
                          className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                        >
                          Unflag Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea
                          placeholder="Reason for flagging this user..."
                          value={flagReason}
                          onChange={(e) => setFlagReason(e.target.value)}
                          className="w-full p-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500 transition-all"
                          rows={3}
                        />
                        <button 
                          onClick={() => flagUser(selectedUser.uid)}
                          className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          Flag Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Member</h2>
                <button onClick={() => setShowCreateUserModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input 
                    type="text" required
                    placeholder="John Doe"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    value={newUserData.displayName}
                    onChange={(e) => setNewUserData({...newUserData, displayName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input 
                    type="email" required
                    placeholder="john@example.com"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="254712345678"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    value={newUserData.phoneNumber}
                    onChange={(e) => setNewUserData({...newUserData, phoneNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Role</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value as UserRole})}
                  >
                    <option value="customer">Customer</option>
                    <option value="provider">Provider</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isDataLoading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isDataLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Create Broadcast Modal */}
        {showCreatePromoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-800/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Mass Broadcast</h2>
                <button onClick={() => setShowCreatePromoModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSendMassMessage} className="p-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                  <select 
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    value={newPromoData.target}
                    onChange={(e) => setNewPromoData({...newPromoData, target: e.target.value as any})}
                  >
                    <option value="all">Every User</option>
                    <option value="providers">All Providers</option>
                    <option value="sellers">All Sellers</option>
                    <option value="customers">All Customers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Broadcast Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. New Feature Released!"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary font-bold"
                    value={newPromoData.title}
                    onChange={(e) => setNewPromoData({...newPromoData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Content</label>
                  <textarea 
                    required
                    placeholder="Type your message here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    value={newPromoData.message}
                    onChange={(e) => setNewPromoData({...newPromoData, message: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <input 
                    type="checkbox"
                    id="sendSms"
                    checked={newPromoData.sendSmsPlaceholder}
                    onChange={(e) => setNewPromoData({...newPromoData, sendSmsPlaceholder: e.target.checked})}
                    className="w-4 h-4 text-primary focus:ring-primary rounded"
                  />
                  <label htmlFor="sendSms" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Also send via SMS (Placeholder)
                  </label>
                </div>
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isDataLoading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isDataLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Broadcast Message'}
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

export default Admin;
