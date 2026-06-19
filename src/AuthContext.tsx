import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, query, collection, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { User } from './types';
import { getDeviceFingerprint } from './lib/fingerprint';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  isAuthReady: false,
  refreshUser: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshUser = async () => {
    if (!auth.currentUser) return;
    
    // Reload firebase user to get latest emailVerified status
    await auth.currentUser.reload();
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = { uid: userDoc.id, ...userDoc.data() } as User;
        
        // Sync emailVerified if it changed in Firebase Auth
        if (auth.currentUser.emailVerified && !userData.emailVerified) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              emailVerified: true
            });
            setUser({ ...userData, emailVerified: true });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
          }
        } else {
          setUser(userData);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Update online status and device snapshot
        const userPath = `users/${firebaseUser.uid}`;
        const fingerprint = getDeviceFingerprint();
        updateDoc(doc(db, 'users', firebaseUser.uid), {
          isOnline: true,
          lastSeen: new Date().toISOString(),
          deviceFingerprint: fingerprint
        }).catch(error => {
          // Silent catch since the profile is auto-created or healed below if it doesn't exist yet
          console.warn("Initial online status sync deferred:", error);
        });

        // Set up real-time listener for user profile
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const userData = { uid: docSnap.id, ...docSnap.data() } as User;
            
            // Sync to users_public on every update
            const publicUser = {
              uid: userData.uid,
              displayName: userData.displayName || '',
              photoURL: userData.photoURL || '',
              role: userData.role || 'customer',
              isVerified: userData.isVerified || false,
              isOnline: userData.isOnline || false,
              lastSeen: userData.lastSeen || new Date().toISOString(),
              rating: userData.rating || 0,
              reviewCount: userData.reviewCount || 0,
              kycStatus: userData.kycStatus || 'none',
              referredBy: userData.referredBy || null,
              maxSingleSpend: userData.maxSingleSpend || 0,
              totalSpend: userData.totalSpend || 0,
              completedPaymentsCount: userData.completedPaymentsCount || 0,
              createdAt: userData.createdAt || new Date().toISOString()
            };
            const publicPath = `users_public/${firebaseUser.uid}`;
            setDoc(doc(db, 'users_public', firebaseUser.uid), publicUser, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, publicPath));

            // Self-healing: Check and ensure current user's referral code is registered publicly
            const refCode = userData.referralCode || firebaseUser.uid.substring(0, 6).toUpperCase();
            if (refCode) {
              const refDocRef = doc(db, 'referral_codes', refCode);
              getDoc(refDocRef).then((snap) => {
                if (!snap.exists()) {
                  setDoc(refDocRef, {
                    userId: firebaseUser.uid,
                    createdAt: new Date().toISOString()
                  }).catch(e => console.warn("Referral code backfill skipped:", e));
                }
              }).catch(e => console.warn("Referral doc read skipped:", e));
            }

            // Self-healing: Ensure current user's phone number is registered in phone_registry
            if (userData.phoneNumber) {
              const formattedPhone = userData.phoneNumber.trim().replace(/\s+/g, '').replace(/\+/g, '');
              const phoneDocRef = doc(db, 'phone_registry', formattedPhone);
              getDoc(phoneDocRef).then((snap) => {
                if (!snap.exists()) {
                  setDoc(phoneDocRef, {
                    userId: firebaseUser.uid,
                    createdAt: new Date().toISOString()
                  }).catch(e => console.warn("Phone registry backfill skipped:", e));
                }
              }).catch(e => console.warn("Phone registry read skipped:", e));
            }

            // One-time upgrade for bootstrap admin
            if (firebaseUser.email === 'ramadhanwambia83@gmail.com' && userData.role !== 'admin') {
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  role: 'admin',
                  isVerified: true
                });
                setUser({ ...userData, role: 'admin', isVerified: true });
              } catch (error) {
                handleFirestoreError(error, OperationType.UPDATE, userPath);
                setUser(userData);
              }
            } else {
              setUser(userData);
            }
          } else {
            // Create a default profile if it doesn't exist
            const isAdminEmail = firebaseUser.email === 'ramadhanwambia83@gmail.com';
            const fingerprint = getDeviceFingerprint();
             const newUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'Anonymous User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              role: isAdminEmail ? 'admin' : 'customer',
              isVerified: isAdminEmail, // Auto-verify the admin
              isOnline: true,
              lastSeen: new Date().toISOString(),
              referralCode: firebaseUser.uid.substring(0, 6).toUpperCase(),
              referredBy: '',
              referralEarnings: 0,
              escrowBalance: 0,
              emailVerified: firebaseUser.emailVerified,
              maxSingleSpend: 0,
              totalSpend: 0,
              completedPaymentsCount: 0,
              createdAt: new Date().toISOString(),
              deviceFingerprint: fingerprint,
              needsOnboarding: firebaseUser.providerData.some(p => p.providerId === 'google.com'),
              isOnboardingCompleted: false,
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser, { merge: true });
              
              // Sync to users_public
              const publicUser = {
                uid: newUser.uid,
                displayName: newUser.displayName,
                photoURL: newUser.photoURL,
                role: newUser.role || 'customer',
                isVerified: newUser.isVerified,
                isOnline: newUser.isOnline,
                lastSeen: newUser.lastSeen,
                rating: 0,
                reviewCount: 0,
                kycStatus: 'none',
                referredBy: '',
                maxSingleSpend: 0,
                totalSpend: 0,
                completedPaymentsCount: 0,
                createdAt: newUser.createdAt
              };
              await setDoc(doc(db, 'users_public', firebaseUser.uid), publicUser, { merge: true });
              
              // Create public referral code mapping matching registration flows
              if (newUser.referralCode) {
                await setDoc(doc(db, 'referral_codes', newUser.referralCode), {
                  userId: firebaseUser.uid,
                  createdAt: new Date().toISOString()
                }, { merge: true }).catch(err => {
                  console.warn("New user referral mapping skipped:", err);
                });
              }
              
              setUser(newUser);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, userPath);
            }
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });
      } else {
        if (user?.uid) {
          // Update offline status
          const userPath = `users/${user.uid}`;
          updateDoc(doc(db, 'users', user.uid), {
            isOnline: false,
            lastSeen: new Date().toISOString()
          }).catch(error => {
            if (error instanceof Error && error.message.includes('NOT_FOUND')) return;
            handleFirestoreError(error, OperationType.UPDATE, userPath);
          });
        }
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUser(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    // Handle visibility changes (tab close/background)
    const handleVisibilityChange = async () => {
      if (auth.currentUser) {
        const isOnline = document.visibilityState === 'visible';
        updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline,
          lastSeen: new Date().toISOString()
        }).catch(() => {}); // Silent for visibility change
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // Real-time listener for buyer spending metrics calculation
    const txQuery = query(
      collection(db, 'transactions'),
      where('buyerId', '==', user.uid)
    );

    const unsubscribeTxs = onSnapshot(txQuery, async (snapshot) => {
      let maxSingle = 0;
      let total = 0;

      snapshot.docs.forEach((snap) => {
        const data = snap.data();
        if (['deposited', 'completed', 'released', 'disputed'].includes(data.status)) {
          const amt = data.amount || 0;
          if (amt > maxSingle) maxSingle = amt;
          total += amt;
        }
      });

      const currentMax = user.maxSingleSpend || 0;
      const currentTotal = user.totalSpend || 0;

      if (maxSingle !== currentMax || total !== currentTotal) {
        await updateDoc(doc(db, 'users', user.uid), {
          maxSingleSpend: maxSingle,
          totalSpend: total
        }).catch(err => {
          console.warn("Spend stats sync skipped:", err);
        });
      }
    }, (error) => {
      console.warn("Transactions read skipped (expected during auth shift):", error);
    });

    return () => unsubscribeTxs();
  }, [user?.uid, user?.maxSingleSpend, user?.totalSpend]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
