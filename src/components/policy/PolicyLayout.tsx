import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Scale, Lock, Eye, FileText, AlertTriangle, Handshake, 
  HelpCircle, ChevronRight, Search, Menu, X, ShieldAlert, BookOpen,
  UserCheck, Briefcase, ShoppingBag, Ban, Sliders
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PolicyLayoutProps {
  children: React.ReactNode;
  activeId: string;
}

export const POLICY_TABS = [
  { id: 'terms', label: 'Terms of Service', icon: Scale, path: '/terms', desc: 'Platform rules and eligibility' },
  { id: 'privacy', label: 'Privacy Policy', icon: Lock, path: '/privacy', desc: 'Data protection and rights' },
  { id: 'escrow', label: 'Escrow Policy', icon: Handshake, path: '/escrow-policy', desc: 'Transaction and holding cycles' },
  { id: 'cookies', label: 'Cookie Notice', icon: Eye, path: '/cookies', desc: 'Local storage and session keys' },
  { id: 'safety', label: 'Safety Tips', icon: ShieldCheck, path: '/safety', desc: 'Client and merchant guides' },
  { id: 'buyer-rules', label: 'Buyer Responsibilities', icon: UserCheck, path: '/buyer-rules', desc: 'Guidelines for safe buying' },
  { id: 'seller-rules', label: 'Seller & Listing Standards', icon: ShoppingBag, path: '/seller-rules', desc: 'Merchant inventory quality' },
  { id: 'provider-standards', label: 'Service Provider Standards', icon: Briefcase, path: '/provider-standards', desc: 'Freelance & artisanal codes' },
  { id: 'prohibited-items', label: 'Prohibited Items Policy', icon: Ban, path: '/prohibited-items', desc: 'Banned listings and services' },
  { id: 'dispute-policy', label: 'Dispute Resolution Policy', icon: ShieldAlert, path: '/dispute-policy', desc: 'Mediation and refund arbitrations' },
  { id: 'faq', label: 'Frequently Asked Questions', icon: HelpCircle, path: '/faq', desc: 'Common inquiries answered' },
];

export const PolicyLayout: React.FC<PolicyLayoutProps> = ({ children, activeId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const filteredTabs = POLICY_TABS.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredTabs.length > 0) {
      navigate(filteredTabs[0].path);
    }
  };

  const currentTab = POLICY_TABS.find(t => t.id === activeId);

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300">
      {/* Policy Center Hero */}
      <div className="relative py-16 md:py-24 overflow-hidden border-b border-slate-200/60 dark:border-neutral-900 bg-white dark:bg-neutral-900/40">
        {/* Abstract shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-red-500/10 blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-6"
            >
              <BookOpen className="w-3.5 h-3.5" />
              HudumaLink Policy Center
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-6">
              Legal, Safety & <span className="text-emerald-600 dark:text-emerald-400">Trust Hub</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
              Explore the legal standards, code of conduct, and transaction protocols that safeguard buyers, sellers, and service providers across Kenya.
            </p>

            {/* Quick Policy Search */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search policies, rules, and terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 dark:focus:border-emerald-400 shadow-sm font-sans font-medium text-sm transition-all"
                />
              </div>
              
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 text-left overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-neutral-800 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-2">
                    Found {filteredTabs.length} matching guidelines
                  </div>
                  {filteredTabs.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <Link
                            key={tab.id}
                            to={tab.path}
                            onClick={() => setSearchQuery('')}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors border-b border-slate-100/60 dark:border-neutral-800/40 last:border-0"
                          >
                            <Icon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{tab.label}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tab.desc}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No matching policies found. Try searching "escrow", "seller", or "refund".
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-4 space-y-4 sticky top-28">
            <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-neutral-800 pb-3">
                <Sliders className="w-4 h-4" /> Policy Navigation
              </h2>
              <div className="space-y-1.5">
                {POLICY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeId;
                  return (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      className={cn(
                        "flex items-start gap-3.5 px-4.5 py-3.5 rounded-2xl border transition-all text-left group",
                        isActive 
                          ? "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-sm"
                          : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-800/40"
                      )}
                    >
                      <Icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 mt-0.5",
                        isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                      )} />
                      <div>
                        <div className="font-black text-xs leading-none tracking-tight uppercase mb-1">
                          {tab.label}
                        </div>
                        <p className={cn(
                          "text-[11px] leading-snug font-medium font-sans",
                          isActive ? "text-emerald-600/80 dark:text-emerald-400/70" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {tab.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Need Help CTA */}
            <div className="bg-neutral-950 dark:bg-neutral-900 border border-neutral-900 dark:border-neutral-800 text-white rounded-[2.5rem] p-8 shadow-xl overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-emerald-500/10 blur-3xl pointer-events-none" />
              <ShieldAlert className="w-12 h-12 text-emerald-400 mb-6" />
              <h3 className="text-xl font-black tracking-tight mb-3">Enterprise Mediation</h3>
              <p className="text-neutral-400 text-xs leading-relaxed mb-6 font-sans">
                Are you facing a dispute, transaction failure, or require immediate safety arbitration? Our designated trust & safety team acts as a neutral binding arbiter to verify transactions and process refunds.
              </p>
              <a 
                href="mailto:support@hudumalink.co.ke" 
                className="inline-flex items-center justify-center w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-emerald-900/10"
              >
                Request Arbitration
              </a>
            </div>
          </div>

          {/* Mobile Navigation Trigger & Drawer */}
          <div className="lg:hidden col-span-1">
            <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-900 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                {currentTab && (
                  <>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <currentTab.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Policy</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{currentTab.label}</div>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-850 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Drawer Backdrop */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black z-40"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white dark:bg-neutral-950 z-50 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-900 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                          <span className="font-black text-sm tracking-widest uppercase text-slate-900 dark:text-white">Policy Center</span>
                        </div>
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {POLICY_TABS.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = tab.id === activeId;
                          return (
                            <Link
                              key={tab.id}
                              to={tab.path}
                              className={cn(
                                "flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left",
                                isActive 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                  : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-900/40"
                              )}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-xs uppercase tracking-tight">{tab.label}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{tab.desc}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-900">
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 flex items-center justify-center text-slate-400">
                          <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white tracking-widest uppercase">Safe & Protected</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">HudumaLink Kenya Legal Center</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Core Content Area */}
          <div className="col-span-1 lg:col-span-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {children}
            </motion.div>

            {/* Platform disclaimer - ALWAYS visible at the footer of every policy */}
            <div className="bg-slate-100/60 dark:bg-neutral-900/30 border border-slate-200/60 dark:border-neutral-900 p-8 rounded-[2rem] font-sans">
              <div className="flex gap-4 items-start">
                <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[10px]">
                    Official Platform Disclaimer & Neutral Intermediary Notice
                  </p>
                  <p>
                    <strong>HudumaLink Kenya</strong> is purely a technology-enabled marketplace and intermediary platform connecting registered buyers, merchants, and independent service contractors. HudumaLink does not manufacture, wholesale, or resell listed products, nor does it directly employ, manage, or provide warranty for physical services rendered on this platform.
                  </p>
                  <p>
                    All contracts, engagements, and physical transactions are executed solely and independently between users. Users remain completely responsible and liable for conducting physical safety inspections, confirming delivery, verifying certifications, and declaring personal income taxes under Kenyan statutory laws.
                  </p>
                  <p>
                    To enforce marketplace compliance and protect consumers against fraud, HudumaLink reserves the absolute, unilateral corporate authority to suspend listings, hold payouts, freeze escrow funds, request supplementary physical ownership verifications, or remove user content that violates the terms of this Policy Center.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
