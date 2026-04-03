import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, PlusCircle, MessageSquare, Heart, Moon, Sun, Shield, AlertCircle, Bell, Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth, db } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { sendEmailVerification } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { Chatbot } from './Chatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user || !user.uid) {
      setUnreadNotifications(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      if (auth.currentUser?.emailVerified) {
        toast.success('Email verified successfully!');
      } else {
        toast.error('Email not yet verified. Please check your inbox.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setRefreshing(false);
    }
  };
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/listings?type=product' },
    { name: 'Services', path: '/listings?type=service' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'About Us', path: '/about' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-primary text-white py-1 px-4 text-center text-xs font-medium">
        HudumaLink Kenya - Connecting Kenya's Best Service Providers & Sellers
      </div>

      {/* Email Verification Banner */}
      {user && !auth.currentUser?.emailVerified && (
        <div className="bg-yellow-500 text-white py-2 px-4 text-center text-sm font-bold flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Please verify your email to unlock all features.</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="underline hover:no-underline disabled:opacity-50"
            >
              {resendingEmail ? 'Sending...' : 'Resend Email'}
            </button>
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white text-yellow-600 px-3 py-1 rounded-full text-xs hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {refreshing ? 'Checking...' : "I've Verified"}
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 kenyan-gradient rounded-lg flex items-center justify-center text-white font-bold">
                HL
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">
                Huduma<span className="text-secondary">Link</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === link.path ? "text-primary" : "text-gray-500 dark:text-gray-400 dark:hover:text-primary"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {user.role !== 'customer' && (
                    <Link to="/create-listing" className="flex items-center space-x-1 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all">
                      <PlusCircle className="w-4 h-4" />
                      <span>Post Ad</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" title="Admin Dashboard">
                      <Shield className="w-5 h-5" />
                    </Link>
                  )}
                  <Link to="/messages" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link to="/notifications" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link to="/profile" className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 dark:border-neutral-700 hover:border-primary transition-all">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 dark:text-gray-400 hover:text-secondary transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-sm font-medium text-primary hover:underline">
                  Sign In / Register
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500 dark:text-gray-400">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-md"
                  >
                    {link.name}
                  </Link>
                ))}
                {user ? (
                  <>
                    {user.role !== 'customer' && (
                      <Link to="/create-listing" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">
                        Post Ad
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">
                        Admin Dashboard
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300">
                      My Profile
                    </Link>
                    <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 relative">
                      Notifications
                      {unreadNotifications > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-secondary rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-secondary">
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">
                    Sign In / Register
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* AI Chatbot */}
      <Chatbot />

      {/* Footer */}
      <footer className="bg-accent text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <span className="text-2xl font-bold tracking-tight text-white">
                Huduma<span className="text-secondary">Link</span> Kenya
              </span>
              <p className="mt-4 text-gray-400 max-w-xs">
                The most trusted digital marketplace in Kenya. Connecting millions of buyers and sellers across all 47 counties.
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="https://facebook.com/hudumalink" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/hudumalink" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-secondary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://tiktok.com/@hudumalink" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-black transition-colors">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a6.738 6.738 0 01-6.74 6.74c-1.4-.01-2.82-.44-3.99-1.25a6.744 6.744 0 01-2.75-5.49c-.01-1.4.44-2.82 1.25-3.99a6.744 6.744 0 015.49-2.75c.01 0 .01 0 .02 0v4.03c-1.49.06-2.71 1.28-2.77 2.77-.06 1.49 1.28 2.71 2.77 2.77 1.49.06 2.71-1.28 2.77-2.77V.02z" />
                  </svg>
                </a>
                <a href="https://x.com/hudumalink" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-neutral-800 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-green-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/listings?type=product" className="text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/listings?type=service" className="text-gray-400 hover:text-white transition-colors">Services</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/safety" className="text-gray-400 hover:text-white transition-colors">Safety Tips</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} HudumaLink Kenya. All rights reserved. Built for Kenya.
          </div>
        </div>
      </footer>
    </div>
  );
};
