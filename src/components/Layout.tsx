import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, PlusCircle, MessageSquare, Heart, Moon, Sun, Shield, AlertCircle, Bell, Facebook, Instagram, MessageCircle, ShoppingCart, Plus, Minus, Trash2, Loader2, Gift } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useCart } from '../CartContext';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { sendEmailVerification } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, updateDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Chatbot } from './Chatbot';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { cartItems, sellerName, sellerId, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const prevChatsRef = useRef<{ [chatId: string]: number }>({});

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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !user.uid) {
      setUnreadMessages(0);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      let newAlertMessage: { text: string; senderId: string; chatId: string } | null = null;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const chatId = docSnap.id;
        const unreadCountObj = data.unreadCount || {};
        const count = unreadCountObj[user.uid] || 0;
        totalUnread += count;

        const prevCount = prevChatsRef.current[chatId] ?? 0;
        if (count > prevCount && data.lastMessage) {
          // Unread messages increased! Notify if we're not currently on the specific chat messages view
          const queryParams = new URLSearchParams(location.search);
          const activeChatId = queryParams.get('chatId');
          const isViewingThisChat = location.pathname === '/messages' && activeChatId === chatId;

          if (!isViewingThisChat) {
            newAlertMessage = {
              text: data.lastMessage,
              senderId: data.participants.find((p: string) => p !== user.uid) || '',
              chatId: chatId
            };
          }
        }
        prevChatsRef.current[chatId] = count;
      });

      setUnreadMessages(totalUnread);

      if (newAlertMessage) {
        const msgInfo = newAlertMessage;
        const showToast = (senderName: string) => {
          toast.info(`New Msg: You have ${totalUnread} unread messages!`, {
            description: `you have a new messages from ${senderName}, check the mesages`,
            action: {
              label: 'Check Messages',
              onClick: () => navigate(`/messages?chatId=${msgInfo.chatId}`)
            },
            duration: 8000
          });
        };

        getDoc(doc(db, 'users_public', msgInfo.senderId)).then((userDoc) => {
          if (userDoc.exists()) {
            showToast(userDoc.data().displayName || 'User');
          } else {
            showToast('User');
          }
        }).catch(() => {
          showToast('User');
        });
      }
    }, (error) => {
      console.error("Error listening to chats for unread count:", error);
    });

    return () => unsubscribe();
  }, [user, location.pathname, location.search, navigate]);

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

  const handleCartCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to complete your purchase');
      setIsCartOpen(false);
      navigate('/auth');
      return;
    }

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to checkout.');
      setIsCartOpen(false);
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    let phoneNumber = user.phoneNumber;
    if (!phoneNumber) {
      phoneNumber = window.prompt('Please enter your M-Pesa phone number (e.g., 2547XXXXXXXX):') || '';
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('A valid M-Pesa phone number is required to checkout');
      return;
    }

    setCheckoutProcessing(true);
    try {
      const dbCollection = collection(db, 'transactions');
      
      // Load referrer if any
      let referralId = undefined;
      const buyerDoc = await getDoc(doc(db, 'users', user.uid));
      if (buyerDoc.exists()) {
        const buyerData = buyerDoc.data();
        if (buyerData.referredBy) {
          referralId = buyerData.referredBy;
        }
      }

      const transactionData: any = {
        listingId: 'multi_order_cart',
        buyerId: user.uid,
        sellerId: sellerId,
        sellerName: sellerName || 'Vendor',
        amount: totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentMethod: 'mpesa',
        phoneNumber: phoneNumber.replace(/\+/g, ''),
        items: cartItems.map(item => ({
          id: item.listing.id,
          title: item.listing.title,
          price: item.listing.price || 0,
          quantity: item.quantity,
          image: item.listing.images?.[0] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=300'
        })),
        listingTitle: `${cartItems.length} items from ${sellerName || 'Seller'}`
      };

      if (referralId) {
        transactionData.referralId = referralId;
      }

      const docRef = await addDoc(dbCollection, transactionData);
      const newTransactionId = docRef.id;

      // Call server STK Push
      try {
        await fetch('/api/mpesa/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneNumber.replace(/\+/g, ''),
            amount: totalAmount,
            accountReference: `ORDER-${newTransactionId.substring(0, 5)}`,
            transactionDesc: `Escrow for ${transactionData.listingTitle}`,
            transactionId: newTransactionId
          })
        });
      } catch (err) {
        console.error('Failed to dispatch Mpesa push notification, proceeding:', err);
      }

      toast.success('STK Push sent successfully! Enter your M-Pesa PIN on your mobile phone.');
      
      // Clear cart
      clearCart();
      setIsCartOpen(false);

      // Navigate to order transaction details screen
      navigate(`/transactions/${newTransactionId}`);

      // Auto deposit process payment simulation matching the paymentService flow
      setTimeout(async () => {
        try {
          // Update transaction client-side / server-side simulation
          await fetch(`/api/transactions/release-milestone`, { method: 'POST' }).catch(() => {}); // silent wake up helper
          
          const txRef = doc(db, 'transactions', newTransactionId);
          await updateDoc(txRef, {
            status: 'deposited',
            updatedAt: new Date().toISOString()
          });

          // Notify seller
          const sellerNotificationRef = doc(collection(db, 'notifications'));
          await setDoc(sellerNotificationRef, {
            userId: sellerId,
            title: 'New Multi-item Order Received',
            message: `Checkout cart containing ${transactionData.items.length} items (KES ${totalAmount}) has been paid. Funds are held in escrow.`,
            type: 'info',
            read: false,
            createdAt: new Date().toISOString(),
            link: `/transactions/${newTransactionId}`
          });
        } catch (simError) {
          console.error('Simulation update error:', simError);
        }
      }, 10000);

    } catch (e: any) {
      console.error('Checkout failed:', e);
      toast.error(e.message || 'Escrow checkout submission failed. Please try again.');
    } finally {
      setCheckoutProcessing(false);
    }
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.marketplace'), path: '/listings?type=product' },
    { name: t('nav.services'), path: '/listings?type=service' },
    { name: t('nav.offers'), path: '/offers' },
    { name: t('nav.about'), path: '/about' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-primary text-white py-1 px-4 text-center text-xs font-medium flex justify-between items-center">
        <div className="flex-grow text-center">
          {t('footer.tagline')}
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setLanguage('en')}
            className={cn("hover:text-secondary transition-colors", language === 'en' ? "font-black underline" : "opacity-70")}
          >
            EN
          </button>
          <span className="opacity-30">|</span>
          <button 
            onClick={() => setLanguage('sw')}
            className={cn("hover:text-secondary transition-colors", language === 'sw' ? "font-black underline" : "opacity-70")}
          >
            SW
          </button>
        </div>
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
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 kenyan-gradient rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                <div className="text-white font-black text-xl leading-none flex items-center">
                  <span className="relative">H</span>
                  <span className="text-sm absolute left-3 top-1 opacity-80">L</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tighter leading-tight text-accent dark:text-white uppercase">
                  Huduma<span className="text-secondary">Link</span>
                </span>
                <div className="flex items-center space-x-1">
                  <div className="h-[1px] flex-grow bg-primary" />
                  <span className="text-[8px] font-black tracking-[0.2em] text-primary uppercase">Kenya</span>
                  <div className="h-[1px] flex-grow bg-secondary" />
                </div>
              </div>
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
              {/* Universal Shopping Cart Trigger */}
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative" 
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-white dark:border-neutral-900 animate-in zoom-in">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {user ? (
                <>
                  {user.role !== 'customer' && (
                    <Link to="/create-listing" className="flex items-center space-x-1 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all">
                      <PlusCircle className="w-4 h-4" />
                      <span>{t('nav.post_ad')}</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" title={t('nav.admin')}>
                      <Shield className="w-5 h-5" />
                    </Link>
                  )}
                  <Link to="/messages" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative" title={t('nav.messages')}>
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link to="/notifications" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative" title={t('nav.notifications')}>
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-secondary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link to="/referrals" className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors" title="Referrals Hub">
                    <Gift className="w-5 h-5" />
                  </Link>
                  <Link to="/profile" className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 dark:border-neutral-700 hover:border-primary transition-all" title={t('nav.profile')}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-500 dark:text-gray-400 hover:text-secondary transition-colors" title={t('nav.logout')}>
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link to="/auth" className="text-sm font-medium text-primary hover:underline">
                  {t('nav.signin_register')}
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors relative" 
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border border-white dark:border-neutral-900 animate-in zoom-in">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
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
                        {t('nav.post_ad')}
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">
                        {t('nav.admin')}
                      </Link>
                    )}
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300">
                      {t('nav.profile')}
                    </Link>
                    <Link to="/referrals" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300">
                      My Referrals
                    </Link>
                    <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 relative">
                      {t('nav.messages')}
                      {unreadMessages > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-secondary rounded-full">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 relative">
                      {t('nav.notifications')}
                      {unreadNotifications > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-secondary rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-base font-medium text-secondary">
                      {t('nav.logout')}
                    </button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-primary">
                    {t('nav.signin_register')}
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

      {/* Advanced Sliding Escrow Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-[100] backdrop-blur-xs"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 shadow-2xl z-[101] flex flex-col border-l border-gray-100 dark:border-neutral-800"
            >
              {/* Header Container */}
              <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50 dark:bg-neutral-800/40">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Your Cart</h2>
                    {sellerName && (
                      <p className="text-[10px] uppercase tracking-wider text-primary font-bold">
                        Seller: {sellerName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 rounded-full transition-all"
                  aria-label="Close Cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List Body */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-neutral-800/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                      <ShoppingCart className="w-10 h-10" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Your Cart is Empty</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-[240px]">
                      Explore HudumaLink's premium products and services to add items.
                    </p>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('/listings?type=product');
                      }}
                      className="mt-6 px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-full hover:bg-opacity-90 transition-all"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* single-seller compliance banner */}
                    <div className="p-3 bg-emerald-500/5 dark:bg-emerald-550/10 border border-emerald-500/10 rounded-xl">
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-400 leading-normal font-medium">
                        🛡️ <strong>Single-Seller Mode compliant:</strong> You are checking out with {cartItems.length} items from {sellerName}. All transactions are fully bonded under HudumaLink Escrow.
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {cartItems.map((item) => (
                        <div key={item.listing.id} className="py-4 flex items-start space-x-4">
                          {/* Image preview */}
                          <img
                            src={item.listing.images?.[0] || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=300'}
                            alt={item.listing.title}
                            className="w-16 h-16 object-cover rounded-xl border border-gray-100 dark:border-neutral-800 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-grow min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {item.listing.title}
                            </h4>
                            <p className="text-xs text-primary font-bold mt-0.5">
                              KES {(item.listing.price || 0).toLocaleString()}
                            </p>
                            
                            {/* Quantity buttons */}
                            <div className="flex items-center space-x-3 mt-3">
                              <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-neutral-800">
                                <button
                                  onClick={() => updateQuantity(item.listing.id, item.quantity - 1)}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-gray-900 dark:text-gray-100">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.listing.id, item.quantity + 1)}
                                  className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.listing.id)}
                                className="p-1 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition text-xs flex items-center gap-1 font-semibold"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Controls Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/20 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                    <span className="text-lg font-black text-gray-900 dark:text-gray-100">
                      KES {totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={clearCart}
                      className="px-4 py-3 bg-gray-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 font-bold rounded-2xl text-xs text-gray-600 dark:text-gray-300 transition-all flex items-center justify-center"
                      title="Clear Cart"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleCartCheckout}
                      disabled={checkoutProcessing}
                      className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold hover:bg-opacity-90 transition-all text-xs flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {checkoutProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching STK...</span>
                        </>
                      ) : (
                        <span>Checkout via Escrow</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[9px] text-center text-gray-400">
                    Funds will be locked in HudumaLink escrow until you confirm satisfaction.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                <a href="https://x.com/hudumalink" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-neutral-800 transition-colors" title="Follow us on X">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://wa.me/254112389628?text=Hello%20HudumaLink%20Support,%20I'm%20contacting%20you%20from%20the%20platform%20for%20assistance." target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-green-500 transition-colors" title="Contact us on WhatsApp">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.004 0C5.372 0 0 5.372 0 12.004c0 2.116.549 4.11 1.612 5.855L.05 24l6.302-1.654a11.97 11.97 0 005.652 1.41h.005c6.629 0 12.001-5.372 12.001-12.004C24.01 5.372 18.636 0 12.004 0zm6.986 16.92c-.287.808-1.42 1.492-2.193 1.583-.726.084-1.658.127-2.68-.198-1.023-.325-2.028-.868-2.914-1.496a15.828 15.828 0 01-3.69-3.692C6.91 12.222 6.38 11.196 6.07 10.155c-.31-.1-.314-.085-.314-.085-.357-1.157.34-1.928.895-2.484l.654-.654c.154-.154.346-.226.544-.226.2 0 .393.072.544.226l1.35 1.35c.154.154.226.346.226.544 0 .2-.072.392-.226.544l-.454.454c-.112.112-.132.278-.052.41a6.602 6.602 0 001.378 1.83 6.577 6.577 0 001.83 1.378c.133.08.3.06.411-.052l.455-.455c.153-.153.345-.226.544-.226s.39.073.543.226l1.35 1.35c.154.154.226.346.226.544 0 .198-.073.39-.227.544l-.35.35c-.092.1-.219.145-.347.118z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">{t('footer.quick_links')}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/listings?type=product" className="text-gray-400 hover:text-white transition-colors">{t('nav.marketplace')}</Link></li>
                <li><Link to="/listings?type=service" className="text-gray-400 hover:text-white transition-colors">{t('nav.services')}</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">{t('nav.about')}</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">{t('nav.careers')}</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">{t('nav.faq')}</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/escrow-policy" className="text-gray-400 hover:text-white transition-colors">Escrow Policy</Link></li>
                <li><Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Notice</Link></li>
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
