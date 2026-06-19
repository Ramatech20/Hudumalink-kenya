import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, limit, startAfter, QueryDocumentSnapshot, DocumentData, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Listing, Transaction } from '../types';
import { handleAppError, retryWithBackoff } from '../lib/error-handler';

// Simple in-memory cache to support SWR-like immediate render and revalidation
const profileDataCache: {
  listings?: Listing[];
  orders?: Transaction[];
  withdrawals?: any[];
  lastDocListings?: QueryDocumentSnapshot<DocumentData>;
  lastDocOrders?: QueryDocumentSnapshot<DocumentData>;
  userId?: string;
} = {};

export const useProfileData = (userId: string | undefined) => {
  const [listings, setListings] = useState<Listing[]>(
    profileDataCache.userId === userId && profileDataCache.listings ? profileDataCache.listings : []
  );
  const [orders, setOrders] = useState<Transaction[]>(
    profileDataCache.userId === userId && profileDataCache.orders ? profileDataCache.orders : []
  );
  const [withdrawals, setWithdrawals] = useState<any[]>(
    profileDataCache.userId === userId && profileDataCache.withdrawals ? profileDataCache.withdrawals : []
  );
  
  const [listingsLoading, setListingsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  const [hasMoreListings, setHasMoreListings] = useState(true);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreWithdrawals, setHasMoreWithdrawals] = useState(true);

  const [lastListingsDoc, setLastListingsDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    profileDataCache.userId === userId && profileDataCache.lastDocListings ? profileDataCache.lastDocListings : null
  );
  const [lastOrdersDoc, setLastOrdersDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    profileDataCache.userId === userId && profileDataCache.lastDocOrders ? profileDataCache.lastDocOrders : null
  );

  const fetchListings = useCallback(async (isLoadMore = false) => {
    if (!userId) return;
    try {
      if (!isLoadMore) setListingsLoading(true);
      
      let q = query(
        collection(db, 'listings'),
        where('authorId', '==', userId),
        limit(10)
      );

      if (isLoadMore && lastListingsDoc) {
        q = query(
          collection(db, 'listings'),
          where('authorId', '==', userId),
          startAfter(lastListingsDoc),
          limit(10)
        );
      }

      const listingsSnap = await retryWithBackoff(async () => {
        try {
          return await getDocs(q);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'listings');
          throw error;
        }
      });

      const items = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      setListings(prev => {
        const nextList = isLoadMore ? [...prev, ...items] : items;
        profileDataCache.listings = nextList;
        profileDataCache.userId = userId;
        return nextList;
      });

      const lastDoc = listingsSnap.docs[listingsSnap.docs.length - 1];
      setLastListingsDoc(lastDoc || null);
      profileDataCache.lastDocListings = lastDoc || undefined;
      setHasMoreListings(listingsSnap.size === 10);
    } catch (err) {
      handleAppError(err, 'useProfileData:fetchListings');
    } finally {
      setListingsLoading(false);
    }
  }, [userId, lastListingsDoc]);

  const fetchOrders = useCallback(async (isLoadMore = false) => {
    if (!userId) return;
    try {
      if (!isLoadMore) setOrdersLoading(true);

      let q = query(
        collection(db, 'transactions'),
        where('buyerId', '==', userId),
        limit(10)
      );

      if (isLoadMore && lastOrdersDoc) {
        q = query(
          collection(db, 'transactions'),
          where('buyerId', '==', userId),
          startAfter(lastOrdersDoc),
          limit(10)
        );
      }

      const ordersSnap = await retryWithBackoff(async () => {
        try {
          return await getDocs(q);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'transactions');
          throw error;
        }
      });

      const items = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

      setOrders(prev => {
        const nextOrders = isLoadMore ? [...prev, ...items] : items;
        profileDataCache.orders = nextOrders;
        profileDataCache.userId = userId;
        return nextOrders;
      });

      const lastDoc = ordersSnap.docs[ordersSnap.docs.length - 1];
      setLastOrdersDoc(lastDoc || null);
      profileDataCache.lastDocOrders = lastDoc || undefined;
      setHasMoreOrders(ordersSnap.size === 10);
    } catch (err) {
      handleAppError(err, 'useProfileData:fetchOrders');
    } finally {
      setOrdersLoading(false);
    }
  }, [userId, lastOrdersDoc]);

  const fetchWithdrawals = useCallback(async (limitCount = 10) => {
    if (!userId) return;
    try {
      setWithdrawalsLoading(true);
      const q = query(
        collection(db, 'withdrawals'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const withdrawalsSnap = await retryWithBackoff(async () => {
        try {
          return await getDocs(q);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'withdrawals');
          throw error;
        }
      });

      const items = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWithdrawals(items);
      profileDataCache.withdrawals = items;
      profileDataCache.userId = userId;
      setHasMoreWithdrawals(withdrawalsSnap.size === limitCount);
    } catch (err) {
      handleAppError(err, 'useProfileData:fetchWithdrawals');
    } finally {
      setWithdrawalsLoading(false);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    if (!userId) return;
    setListingsLoading(true);
    setOrdersLoading(true);
    setWithdrawalsLoading(true);
    
    await Promise.all([
      fetchListings(false),
      fetchOrders(false),
      fetchWithdrawals(10)
    ]);
  }, [userId, fetchListings, fetchOrders, fetchWithdrawals]);

  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId]);

  return {
    listings,
    orders,
    withdrawals,
    listingsLoading,
    ordersLoading,
    withdrawalsLoading,
    hasMoreListings,
    hasMoreOrders,
    hasMoreWithdrawals,
    loadMoreListings: () => fetchListings(true),
    loadMoreOrders: () => fetchOrders(true),
    loadMoreWithdrawals: (count: number) => fetchWithdrawals(count),
    refreshAll
  };
};
