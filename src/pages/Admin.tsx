import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Listing, User, Report, UserKYC, Dispute, WithdrawalRequest, Appeal } from '../types';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield, User as UserIcon, Package, AlertTriangle, ExternalLink, Flag, Trash2, Eye, Wallet, Gavel, Clock, ArrowUpRight, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice, formatDate, cn } from '../lib/utils';

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
  const [kycDataMap, setKycDataMap] = useState<Record<string, UserKYC>>({});
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'reports' | 'kyc' | 'disputes' | 'withdrawals' | 'appeals'>('listings');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
          fetchData();
        } else {
          toast.error('Access denied. Admin only.');
          navigate('/');
        }
      } catch (error) {
        console.error(error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch pending listings
      const listingsQuery = query(collection(db, 'listings'), where('status', '==', 'pending'));
      const listingsSnapshot = await getDocs(listingsQuery);
      setPendingListings(listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

      // Fetch unverified or flagged providers/sellers
      const unverifiedQuery = query(collection(db, 'users'), where('isVerified', '==', false));
      const flaggedQuery = query(collection(db, 'users'), where('isFlagged', '==', true));
      
      const [unverifiedSnapshot, flaggedSnapshot] = await Promise.all([
        getDocs(unverifiedQuery),
        getDocs(flaggedQuery)
      ]);

      const unverified = unverifiedSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      const flagged = flaggedSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      
      // Combine and remove duplicates
      const allUsersMap = new Map<string, User>();
      unverified.forEach(u => allUsersMap.set(u.uid, u));
      flagged.forEach(u => allUsersMap.set(u.uid, u));
      
      setUnverifiedUsers(Array.from(allUsersMap.values()));

      // Fetch pending reports
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'));
      const reportsSnapshot = await getDocs(reportsQuery);
      setReports(reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));

      // Fetch KYC requests
      const kycQuery = query(collection(db, 'users'), where('kycStatus', '==', 'pending'));
      const kycSnapshot = await getDocs(kycQuery);
      const users = kycSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setKycRequests(users);

      // Fetch disputes
      const disputesQuery = query(collection(db, 'disputes'), where('status', '==', 'open'));
      const disputesSnapshot = await getDocs(disputesQuery);
      setDisputes(disputesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute)));

      // Fetch withdrawals
      const withdrawalsQuery = query(collection(db, 'withdrawals'), where('status', '==', 'pending'));
      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      setWithdrawals(withdrawalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest)));

      // Fetch appeals
      const appealsQuery = query(collection(db, 'appeals'), where('status', '==', 'pending'));
      const appealsSnapshot = await getDocs(appealsQuery);
      setAppeals(appealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appeal)));

      const dataMap: Record<string, UserKYC> = {};
      await Promise.all(users.map(async (u) => {
        const dataDoc = await getDoc(doc(db, 'users', u.uid, 'kyc', 'data'));
        if (dataDoc.exists()) {
          dataMap[u.uid] = dataDoc.data() as UserKYC;
        }
      }));
      setKycDataMap(dataMap);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch admin data');
    }
  };

  const handleResolveAppeal = async (appealId: string, action: 'approve' | 'reject') => {
    try {
      const appeal = appeals.find(a => a.id === appealId);
      if (!appeal) return;

      await updateDoc(doc(db, 'appeals', appealId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date().toISOString()
      });

      if (action === 'approve') {
        await updateDoc(doc(db, 'users', appeal.userId), {
          isFlagged: false,
          cancellationCount: 0,
          flagReason: null
        });
      }

      toast.success(`Appeal ${action === 'approve' ? 'approved' : 'rejected'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve appeal');
    }
  };

  const approveListing = async (id: string) => {
    try {
      await updateDoc(doc(db, 'listings', id), { status: 'active' });
      setPendingListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing approved!');
    } catch (error) {
      toast.error('Failed to approve listing');
    }
  };

  const rejectListing = async (id: string) => {
    try {
      await updateDoc(doc(db, 'listings', id), { status: 'removed' });
      setPendingListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing rejected');
    } catch (error) {
      toast.error('Failed to reject listing');
    }
  };

  const verifyUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isVerified: true });
      setUnverifiedUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success('User verified!');
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const approveKYC = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { 
        kycStatus: 'verified',
        isVerified: true 
      });
      setKycRequests(prev => prev.filter(u => u.uid !== uid));
      toast.success('KYC approved and user verified!');
    } catch (error) {
      toast.error('Failed to approve KYC');
    }
  };

  const rejectKYC = async (uid: string) => {
    if (!rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { 
        kycStatus: 'rejected'
      });
      await updateDoc(doc(db, 'users', uid, 'kyc', 'data'), {
        rejectionReason: rejectionReason
      });
      setKycRequests(prev => prev.filter(u => u.uid !== uid));
      toast.success('KYC rejected');
      setRejectionReason('');
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to reject KYC');
    }
  };

  const resolveReport = async (reportId: string, listingId: string, action: 'remove' | 'dismiss') => {
    try {
      if (action === 'remove') {
        await updateDoc(doc(db, 'listings', listingId), { status: 'removed' });
        toast.success('Listing removed and report resolved');
      } else {
        toast.success('Report dismissed');
      }
      
      await updateDoc(doc(db, 'reports', reportId), { status: action === 'remove' ? 'resolved' : 'dismissed' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  const resolveDispute = async (disputeId: string, transactionId: string, action: 'refund' | 'release') => {
    try {
      // In a real app, you'd handle the actual money movement here
      await updateDoc(doc(db, 'transactions', transactionId), { 
        status: action === 'refund' ? 'cancelled' : 'completed',
        updatedAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, 'disputes', disputeId), { 
        status: action === 'refund' ? 'refunded' : 'resolved',
        resolution: `Admin resolved by ${action === 'refund' ? 'refunding buyer' : 'releasing funds to seller'}`
      });

      setDisputes(prev => prev.filter(d => d.id !== disputeId));
      toast.success(`Dispute resolved: ${action}`);
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  const handleWithdrawal = async (withdrawalId: string, userId: string, amount: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        // Deduct from user balance
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentBalance = userDoc.data().escrowBalance || 0;
          await updateDoc(userRef, {
            escrowBalance: currentBalance - amount
          });
        }
      }
      
      await updateDoc(doc(db, 'withdrawals', withdrawalId), { 
        status: action === 'approve' ? 'completed' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReason : null
      });

      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      toast.success(`Withdrawal ${action}d`);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to process withdrawal');
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
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage listings and verify service providers.</p>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
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
        </div>
      </div>

      {activeTab === 'listings' ? (
        <div className="grid grid-cols-1 gap-6">
          {pendingListings.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending listings</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All listings have been reviewed.</p>
            </div>
          ) : (
            pendingListings.map((listing) => (
              <div key={listing.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row gap-6 items-start">
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
      ) : activeTab === 'users' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unverifiedUsers.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No verification requests</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All providers are verified.</p>
            </div>
          ) : (
            unverifiedUsers.map((user) => (
              <div key={user.uid} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-primary/20">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.displayName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{user.email}</p>
                {user.isFlagged && (
                  <div className="mb-4 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold uppercase flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Flagged: {user.flagReason || 'Excessive Cancellations'}
                  </div>
                )}
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => verifyUser(user.uid)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Verify
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'kyc' ? (
        <div className="space-y-6">
          {kycRequests.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No pending KYC requests</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">All identity verifications are up to date.</p>
            </div>
          ) : (
            kycRequests.map((u) => (
              <div key={u.uid} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800">
                <div className="flex flex-col md:flex-row gap-6">
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
      ) : null}
    </div>
  );
};

export default Admin;
