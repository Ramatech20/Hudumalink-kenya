import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Listing, Transaction, SellerStats } from '../types';
import { formatPrice } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Eye, MessageSquare, 
  ArrowUpRight, ArrowDownRight, Calendar, Package, ChevronRight 
} from 'lucide-react';
import { motion } from 'motion/react';

const SellerDashboard = () => {
  const [stats, setStats] = useState<SellerStats>({
    totalViews: 0,
    totalInquiries: 0,
    totalSales: 0,
    revenue: 0,
    activeListings: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return;

      try {
        // Fetch listings to get total views and active count
        const listingsQuery = query(
          collection(db, 'listings'),
          where('authorId', '==', auth.currentUser.uid)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listings = listingsSnapshot.docs.map(doc => doc.data() as Listing);
        
        const totalViews = listings.reduce((acc, curr) => acc + (curr.viewCount || 0), 0);
        const activeListings = listings.filter(l => l.status === 'active').length;

        // Fetch transactions for sales and revenue
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('sellerId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        
        const totalSales = transactions.filter(t => t.status === 'completed' || t.status === 'released').length;
        const revenue = transactions
          .filter(t => t.status === 'completed' || t.status === 'released')
          .reduce((acc, curr) => acc + curr.amount, 0);

        setStats({
          totalViews,
          totalInquiries: totalViews * 0.15, // Mock inquiry rate
          totalSales,
          revenue,
          activeListings
        });
        setRecentTransactions(transactions.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', views: 400, sales: 240 },
    { name: 'Tue', views: 300, sales: 139 },
    { name: 'Wed', views: 200, sales: 980 },
    { name: 'Thu', views: 278, sales: 390 },
    { name: 'Fri', views: 189, sales: 480 },
    { name: 'Sat', views: 239, sales: 380 },
    { name: 'Sun', views: 349, sales: 430 },
  ];

  const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your business performance and growth.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-2 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <Calendar className="w-5 h-5 text-gray-400 ml-2" />
          <select className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-0">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: <DollarSign />, color: 'text-green-500', trend: '+12.5%' },
          { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: <Eye />, color: 'text-blue-500', trend: '+5.2%' },
          { label: 'Total Sales', value: stats.totalSales, icon: <ShoppingBag />, color: 'text-primary', trend: '+8.1%' },
          { label: 'Active Listings', value: stats.activeListings, icon: <Package />, color: 'text-accent', trend: '0%' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-neutral-800 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-gray-400'}`}>
                {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance Overview</h3>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-gray-500">Views</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="text-gray-500">Sales</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#FF6321" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#FF6321', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#00FF00" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00FF00', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Distribution */}
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Sales by Category</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Services', value: 400 },
                    { name: 'Products', value: 300 },
                    { name: 'Other', value: 100 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {[
              { label: 'Services', value: '50%', color: 'bg-green-500' },
              { label: 'Products', value: '35%', color: 'bg-yellow-500' },
              { label: 'Other', value: '15%', color: 'bg-orange-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
          <button className="text-primary text-sm font-bold hover:underline flex items-center">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
              {recentTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-8 py-4 font-mono text-xs text-gray-500">#{t.id.slice(0, 8)}</td>
                  <td className="px-8 py-4 font-bold text-gray-900 dark:text-white">{formatPrice(t.amount)}</td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'completed' || t.status === 'released' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-500">
                    No transactions yet. Start selling to see data here!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
