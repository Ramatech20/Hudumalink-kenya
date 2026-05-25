import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import { Gift, Users, Copy, CheckCircle2, Clock, AlertCircle, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ReferredUser {
  uid: string;
  displayName: string;
  createdAt: string;
  maxSingleSpend?: number;
  totalSpend?: number;
  hasTriggeredReferral?: boolean;
}

export default function Referrals() {
  const { user } = useAuth();
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch public profiles of users referred by the current user
    const refQuery = query(
      collection(db, 'users_public'),
      where('referredBy', '==', user.uid)
    );

    const unsubscribe = onSnapshot(refQuery, (snapshot) => {
      const users: ReferredUser[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          displayName: data.displayName || 'Anonymous User',
          createdAt: data.createdAt || new Date().toISOString(),
          maxSingleSpend: data.maxSingleSpend || 0,
          totalSpend: data.totalSpend || 0,
          hasTriggeredReferral: data.maxSingleSpend >= 1000
        });
      });
      
      // Sort: progressing users first, then oldest/newest
      users.sort((a, b) => {
        if (a.hasTriggeredReferral !== b.hasTriggeredReferral) {
          return a.hasTriggeredReferral ? 1 : -1; // showing active/pending tasks first
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setReferredUsers(users);
      setLoading(false);
    }, (error) => {
      console.error('Error loading referred users', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const copyReferralCode = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    const link = `${window.location.origin}/auth?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  // Helper to mask display names respecting privacy: Alice -> A****, John -> Jo**
  const maskName = (name: string) => {
    if (!name) return 'user *******';
    if (name.toLowerCase().includes('anonymous')) return 'user *******';
    const split = name.split(' ');
    const firstWord = split[0];
    if (firstWord.length <= 1) return firstWord + '*****';
    if (firstWord.length === 2) return firstWord + '***';
    return firstWord.substring(0, 2) + '*'.repeat(Math.max(4, firstWord.length - 2));
  };

  const formatJoinedDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const formatPrice = (amount: number) => {
    return 'KSh ' + amount.toLocaleString('en-US');
  };

  const countSuccessful = referredUsers.filter(u => u.hasTriggeredReferral).length;
  const countPending = referredUsers.filter(u => !u.hasTriggeredReferral).length;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Referral Dashboard | HudumaLink Escrow</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl border border-white/15">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary-dark/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-primary-light">
              <Sparkles className="w-3.5 h-3.5" /> Invite & Earn Safely
            </span>
            <h1 className="text-3xl font-black tracking-tight leading-none sm:text-4xl">
              HudumaLink Referral Hub
            </h1>
            <p className="text-sm sm:text-base text-gray-200/90 max-w-xl leading-relaxed">
              Earn withdrawable bonuses when colleagues join HudumaLink with your code. Payouts clear automatically when they commit their first Escrow contract or buy items worth KSh 1,000!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Copy Code */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-300">Your Referral Code</p>
                  <p className="text-xl font-black font-mono mt-0.5 tracking-wider">{user?.referralCode || '------'}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all"
                  title="Copy Code"
                >
                  <Copy className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Copy Link */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-300">Referral Sign-Up Link</p>
                  <p className="text-xs font-semibold truncate max-w-[180px] mt-2 text-white/90">hudumalink.com/auth?ref=...</p>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-3 bg-white text-primary hover:bg-opacity-95 text-xs font-extrabold rounded-xl transition-all active:scale-95"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3.5 bg-primary/10 rounded-xl text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Referrals</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">{referredUsers.length}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3.5 bg-green-500/10 rounded-xl text-green-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cleared Rewards</p>
              <h3 className="text-2xl font-black text-green-600 dark:text-green-400 mt-1">{countSuccessful}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-6 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3.5 bg-amber-500/10 rounded-xl text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pending Progress</p>
              <h3 className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">{countPending}</h3>
            </div>
          </div>
        </div>

        {/* Detailed Referral Progress Dashboard */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-800/10">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Live Referral Tracker</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track real-time spending progress & reward qualification</p>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 rounded-full font-mono">
              {referredUsers.length} Users
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Retrieving your referral network...</p>
            </div>
          ) : referredUsers.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Gift className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">No Referrals Registered Yet</h4>
              <p className="text-xs text-gray-400 mt-2">
                Share your unique code with service providers, merchants, or customers to start tracking progress.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-neutral-800">
              {referredUsers.map((refUser) => {
                const maxSpend = refUser.maxSingleSpend || 0;
                const progressPct = Math.min(100, Math.round((maxSpend / 1000) * 100));
                
                return (
                  <div key={refUser.uid} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/30 dark:hover:bg-neutral-800/10 transition-colors">
                    
                    {/* Public Profile Metadata */}
                    <div className="flex-shrink-0 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {maskName(refUser.displayName)}
                        </span>
                        {refUser.hasTriggeredReferral ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-green-500/10 text-green-600 dark:text-green-400 rounded-md">
                            Bonded & Cleared
                          </span>
                        ) : maxSpend > 0 ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-500 rounded-md">
                            Progressing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-gray-100 dark:bg-neutral-800 text-gray-400 rounded-md">
                            Registered
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Joined HudumaLink: {formatJoinedDate(refUser.createdAt)}
                      </p>
                    </div>

                    {/* Progress details representing the criteria for payout clearance */}
                    <div className="flex-grow max-w-xs space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-medium">Single Spend Target:</span>
                        <span className={`${refUser.hasTriggeredReferral ? 'text-green-500 font-black' : 'text-gray-600 dark:text-gray-300 font-bold'}`}>
                          {formatPrice(maxSpend)} / {formatPrice(1000)}
                        </span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-2 bg-gray-50 dark:bg-neutral-800 rounded-full overflow-hidden border border-gray-100 dark:border-neutral-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            refUser.hasTriggeredReferral 
                              ? 'bg-green-500' 
                              : maxSpend > 0 
                                ? 'bg-amber-500' 
                                : 'bg-gray-200 dark:bg-neutral-700'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Real-time Human/Status Messages matching spec */}
                    <div className="sm:text-right flex-shrink-0 min-w-[190px]">
                      {refUser.hasTriggeredReferral ? (
                        <div className="text-green-600 dark:text-green-400 flex sm:justify-end items-center space-x-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span className="text-xs">Reward Disbursed!</span>
                        </div>
                      ) : maxSpend > 0 ? (
                        <div className="text-amber-500 text-xs font-bold leading-normal">
                          <p>User is at <span className="font-mono font-black">{maxSpend}</span>/1000 KSh</p>
                          <p className="text-[10px] text-gray-400 font-medium font-sans">Awaiting high value Escrow</p>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs font-bold leading-normal flex items-start gap-1 justify-start sm:justify-end">
                          <Clock className="w-3.5 h-3.5 mt-0.5 text-gray-300 flex-shrink-0" />
                          <div>
                            <p>Waiting for user...</p>
                            <p className="text-[10px] text-gray-400 font-medium font-sans">To take a task worth 1000 KSh</p>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Policy & Rules FAQ Accordion Card */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-gray-900 dark:text-gray-100">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="font-black text-sm uppercase tracking-wide">Referral Program Rules</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            <div className="p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">🎯 Single-Transaction Requirement</p>
              To claim referral bonuses, the invitee must complete a single listing checkout or contractor task worth <strong>KSh 1,000 or greater</strong>. Cumulative smaller checkouts do not trigger the bonus automatically, but their highest single transaction is safely saved to log progress in real-time.
            </div>
            <div className="p-4 bg-gray-50 dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">🛡️ Anti-Collusion System</p>
              To protect HudumaLink's secure liquidity, transactions between the referrer and invitee are blocked from triggering referral payouts. Accounts logging matched machine ids or IP ranges are strictly scrutinized and locked by our fintech-grade fraud systems.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
