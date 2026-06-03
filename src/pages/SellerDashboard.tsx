import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { collection, query, where, getDocs, orderBy, limit, addDoc, onSnapshot } from 'firebase/firestore';
import { Listing, Transaction, Appeal } from '../types';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { TrendingUp, ShoppingBag, Eye, MousePointer2, Package, ArrowUpRight, ArrowDownRight, Loader2, Calendar, Zap, AlertTriangle, Scale, X, ShieldCheck, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalViews: 0,
    totalSales: 0,
    activeListings: 0
  });

  useEffect(() => {
    if (!user || !user.uid) return;
    setLoading(true);

    let fetchedListings: Listing[] = [];
    let fetchedSales: Transaction[] = [];

    const updateStats = (currentListings: Listing[], currentSales: Transaction[]) => {
      const completedSales = currentSales.filter(s => s.status === 'released' || s.status === 'completed');
      const totalEarnings = completedSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalViews = currentListings.reduce((sum, l) => sum + (l.viewCount || 0), 0);
      const activeListings = currentListings.filter(l => l.status === 'active').length;

      setStats({
        totalEarnings,
        totalViews,
        totalSales: currentSales.length,
        activeListings
      });
    };

    // 1. Listings snapshot listener
    const listingsQ = query(collection(db, 'listings'), where('authorId', '==', user.uid));
    const unsubscribeListings = onSnapshot(listingsQ, (snapshot) => {
      fetchedListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(fetchedListings);
      updateStats(fetchedListings, fetchedSales);
      setLoading(false);
    }, (error) => {
      console.error('Listings listener error on seller dashboard:', error);
    });

    // 2. Sales snapshot listener with client-side sort fallback
    const salesQ = query(
      collection(db, 'transactions'), 
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribeSales = onSnapshot(salesQ, (snapshot) => {
      fetchedSales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setSales(fetchedSales);
      updateStats(fetchedListings, fetchedSales);
      setLoading(false);
    }, (error) => {
      console.warn('Sales listener index fallback configured:', error);
      const simpleSalesQ = query(
        collection(db, 'transactions'), 
        where('sellerId', '==', user.uid)
      );
      onSnapshot(simpleSalesQ, (simpleSnap) => {
        const sortedSales = simpleSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        fetchedSales = sortedSales.slice(0, 20);
        setSales(fetchedSales);
        updateStats(fetchedListings, fetchedSales);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeListings();
      unsubscribeSales();
    };
  }, [user]);

  // Mock data for the chart
  const chartData = [
    { name: 'Mon', views: 400, earnings: 2400 },
    { name: 'Tue', views: 300, earnings: 1398 },
    { name: 'Wed', views: 200, earnings: 9800 },
    { name: 'Thu', views: 278, earnings: 3908 },
    { name: 'Fri', views: 189, earnings: 4800 },
    { name: 'Sat', views: 239, earnings: 3800 },
    { name: 'Sun', views: 349, earnings: 4300 },
  ];

  const handleAppeal = async () => {
    if (!user || !appealReason.trim()) return;
    setSubmittingAppeal(true);
    try {
      const appeal: Omit<Appeal, 'id'> = {
        userId: user.uid,
        reason: appealReason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      try {
        await addDoc(collection(db, 'appeals'), appeal);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.CREATE, 'appeals');
        throw error;
      }
      toast.success('Appeal submitted successfully. Our team will review it.');
      setShowAppealModal(false);
      setAppealReason('');
    } catch (error: any) {
      if (!error.operationType) {
        handleGeneralError(error, 'Failed to submit appeal');
      }
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Seller Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your performance and earnings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">
            <Calendar className="w-4 h-4" />
            <span>Last 7 Days</span>
          </button>
          <Link to="/create-listing" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all">
            Post New Listing
          </Link>
        </div>
      </div>

      {/* Flagged Warning */}
      {user?.isFlagged && (
        <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Account Flagged</h3>
              <p className="text-sm text-red-700 dark:text-red-500/80">
                Reason: {user.flagReason || 'Excessive cancellations'}. Your listings may have reduced visibility.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAppealModal(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all flex items-center"
          >
            <Scale className="w-4 h-4 mr-2" /> Submit Appeal
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="flex items-center text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full uppercase tracking-widest">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%
            </span>
          </div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Earnings</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{formatPrice(stats.totalEarnings)}</h3>
          <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[75%] rounded-full" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-widest">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +8.2%
            </span>
          </div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Profile Views</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.totalViews.toLocaleString()}</h3>
          <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[60%] rounded-full" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 dark:bg-neutral-800 rounded-2xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="flex items-center text-[10px] font-black text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-1 rounded-full uppercase tracking-widest">
              <ArrowUpRight className="w-3 h-3 mr-1" /> +5.4%
            </span>
          </div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total Sales</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.totalSales}</h3>
          <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[45%] rounded-full" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-neutral-800 px-2 py-1 rounded-full uppercase tracking-widest">Current</span>
          </div>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Active Listings</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100">{stats.activeListings}</h3>
          <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[90%] rounded-full" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 hover:border-primary hover:bg-primary/5 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Withdraw</span>
        </button>
        <Link to="/create-listing" className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 hover:border-primary hover:bg-primary/5 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Promote</span>
        </Link>
        <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 hover:border-primary hover:bg-primary/5 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Analytics</span>
        </button>
        <button className="flex flex-col items-center justify-center p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 hover:border-primary hover:bg-primary/5 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">Verification</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Active Escrows & Listings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Escrow Transactions */}
          {sales.filter(s => s.status === 'deposited' || s.status === 'disputed').length > 0 && (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary" /> Active Escrow Orders
                </h2>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                  {sales.filter(s => s.status === 'deposited' || s.status === 'disputed').length} Pending
                </span>
              </div>
              <div className="space-y-4">
                {sales.filter(s => s.status === 'deposited' || s.status === 'disputed').map((sale) => (
                  <Link 
                    key={sale.id} 
                    to={`/transactions/${sale.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:border-primary transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        sale.status === 'disputed' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      )}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">Order #{sale.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{formatPrice(sale.amount)} • {formatDate(sale.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        sale.status === 'disputed' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                      )}>
                        {sale.status}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Performance Overview</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary rounded-full mr-2" />
                  <span className="text-xs text-gray-500">Earnings</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2" />
                  <span className="text-xs text-gray-500">Views</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6321" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#fff'
                    }} 
                  />
                  <Area type="monotone" dataKey="earnings" stroke="#FF6321" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  <Area type="monotone" dataKey="views" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Manage My Listings */}
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage My Listings</h2>
              <Link to="/create-listing" className="text-sm font-bold text-primary hover:underline">Add New</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.slice(0, 6).map((listing) => (
                <div key={listing.id} className="flex flex-col p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <img src={listing.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      {listing.isPromoted && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 text-black p-1 rounded-full shadow-md">
                          <Zap className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{listing.title}</h4>
                      <p className="text-xs text-gray-500">{formatPrice(listing.price)}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          listing.status === 'active' ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                        )}>
                          {listing.status}
                        </span>
                        {listing.isPromoted && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <Link 
                      to={`/listing/${listing.id}`} 
                      className="flex-1 py-2 text-center text-xs font-bold bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                    >
                      View
                    </Link>
                    {!listing.isPromoted && (
                      <Link 
                        to={`/promote/${listing.id}`}
                        className="flex-1 py-2 text-center text-xs font-bold bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-all flex items-center justify-center"
                      >
                        <Zap className="w-3 h-3 mr-1 fill-current" /> Promote
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {listings.length > 6 && (
              <button className="w-full mt-6 py-3 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                View All Listings ({listings.length})
              </button>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors h-full">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Recent Activity</h2>
            {sales.length > 0 ? (
              <div className="space-y-6">
                {sales.slice(0, 8).map((sale) => (
                  <Link 
                    key={sale.id} 
                    to={`/transactions/${sale.id}`}
                    className="flex items-start space-x-4 group"
                  >
                    <div className={cn(
                      "p-2 rounded-xl transition-colors",
                      sale.status === 'released' || sale.status === 'completed' ? "bg-green-50 dark:bg-green-900/20 text-green-600" :
                      sale.status === 'cancelled' ? "bg-gray-50 dark:bg-neutral-800 text-gray-400" :
                      "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600"
                    )}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary transition-colors">Order #{sale.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{formatDate(sale.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-bold",
                        sale.status === 'released' || sale.status === 'completed' ? "text-green-600" : "text-gray-400"
                      )}>
                        {sale.status === 'released' || sale.status === 'completed' ? '+' : ''}{formatPrice(sale.amount)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{sale.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No sales yet.</p>
              </div>
            )}
            <button className="w-full mt-8 py-3 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">
              View All Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-neutral-800">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">Submit Appeal</h2>
                </div>
                <button onClick={() => setShowAppealModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Explain why your account should be unflagged. Provide context for the cancellations if possible.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Reason for Appeal</label>
                  <textarea 
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Describe your situation..."
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white resize-none"
                    rows={5}
                  ></textarea>
                </div>

                <button 
                  onClick={handleAppeal}
                  disabled={submittingAppeal || !appealReason.trim()}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {submittingAppeal ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Scale className="w-5 h-5" />
                      Submit Appeal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
