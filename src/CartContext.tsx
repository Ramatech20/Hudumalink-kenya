import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Listing } from './types';
import { toast } from 'sonner';

export interface CartItem {
  listing: Listing;
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  sellerId: string | null;
  sellerName: string | null;
  addToCart: (listing: Listing, quantity?: number) => void;
  removeFromCart: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  showConflictModal: boolean;
  conflictingListing: Listing | null;
  confirmClearAndAdd: () => void;
  closeConflictModal: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerName, setSellerName] = useState<string | null>(null);

  // States for handling multiple vendor conflict dialog smoothly inside React (prevents iframe alerts)
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingListing, setConflictingListing] = useState<Listing | null>(null);

  const storageKey = user ? `hudumalink_cart_${user.uid}` : 'hudumalink_cart_guest';

  // Load cart from localStorage on mount or user shift
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCartItems(parsed.items || []);
        setSellerId(parsed.sellerId || null);
        setSellerName(parsed.sellerName || null);
      } catch (e) {
        console.error('Failed to parse cart data', e);
      }
    } else {
      setCartItems([]);
      setSellerId(null);
      setSellerName(null);
    }
  }, [storageKey]);

  // Save cart to localStorage helper
  const saveCart = (items: CartItem[], sId: string | null, sName: string | null) => {
    setCartItems(items);
    setSellerId(sId);
    setSellerName(sName);
    localStorage.setItem(storageKey, JSON.stringify({ items, sellerId: sId, sellerName: sName }));
  };

  const addToCart = (listing: Listing, quantity = 1) => {
    // Determine active seller mismatch
    if (sellerId && sellerId !== listing.authorId) {
      setConflictingListing(listing);
      setShowConflictModal(true);
      return;
    }

    const updatedItems = [...cartItems];
    const existingIndex = updatedItems.findIndex(item => item.listing.id === listing.id);

    if (existingIndex > -1) {
      updatedItems[existingIndex].quantity += quantity;
    } else {
      updatedItems.push({ listing, quantity });
    }

    const sId = listing.authorId;
    const sName = (listing as any).authorName || 'Vendor';

    saveCart(updatedItems, sId, sName);
    toast.success(`"${listing.title}" added to your cart.`);
  };

  const confirmClearAndAdd = () => {
    if (!conflictingListing) return;
    
    // Clear and add the new vendor's listing
    const updatedItems = [{ listing: conflictingListing, quantity: 1 }];
    const sId = conflictingListing.authorId;
    const sName = (conflictingListing as any).authorName || 'Vendor';

    saveCart(updatedItems, sId, sName);
    setShowConflictModal(false);
    setConflictingListing(null);

    toast.success(`Cleared old seller's cart. Added "${conflictingListing.title}" for this seller.`);
  };

  const closeConflictModal = () => {
    setShowConflictModal(false);
    setConflictingListing(null);
  };

  const removeFromCart = (listingId: string) => {
    const updatedItems = cartItems.filter(item => item.listing.id !== listingId);
    if (updatedItems.length === 0) {
      saveCart([], null, null);
    } else {
      saveCart(updatedItems, sellerId, sellerName);
    }
    toast.info('Item removed from cart.');
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(listingId);
      return;
    }
    const updatedItems = cartItems.map(item => {
      if (item.listing.id === listingId) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(updatedItems, sellerId, sellerName);
  };

  const clearCart = () => {
    saveCart([], null, null);
  };

  const totalAmount = cartItems.reduce((acc, item) => {
    const price = item.listing.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      sellerId,
      sellerName,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      showConflictModal,
      conflictingListing,
      confirmClearAndAdd,
      closeConflictModal
    }}>
      {children}

      {/* Modern Vendor Shift Conflict Warning Dialogue Screen */}
      {showConflictModal && conflictingListing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-neutral-800 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">
              Start a new cart?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Your cart already contains items from <strong className="text-primary">{sellerName}</strong>. 
              HudumaLink limits each checkout cart to a single vendor to guarantee escrow transaction accuracy.
              <br /><br />
              Would you like to clear your current cart and add <strong className="text-secondary">"{conflictingListing.title}"</strong> instead?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={closeConflictModal}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-opacity-80 transition-all text-sm"
              >
                No, Keep Old Cart
              </button>
              <button
                onClick={confirmClearAndAdd}
                className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 transition-all text-sm"
              >
                Yes, Clear & Add New
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
};
