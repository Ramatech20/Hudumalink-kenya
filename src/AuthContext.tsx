import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { User } from './types';

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
        // Update online status using setDoc with merge to avoid failure if doc doesn't exist yet
        const userPath = `users/${firebaseUser.uid}`;
        setDoc(doc(db, 'users', firebaseUser.uid), {
          isOnline: true,
          lastSeen: new Date().toISOString()
        }, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, userPath));

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
              createdAt: userData.createdAt || new Date().toISOString()
            };
            const publicPath = `users_public/${firebaseUser.uid}`;
            setDoc(doc(db, 'users_public', firebaseUser.uid), publicUser, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, publicPath));

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
              referralEarnings: 0,
              escrowBalance: 0,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date().toISOString(),
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
                createdAt: newUser.createdAt
              };
              await setDoc(doc(db, 'users_public', firebaseUser.uid), publicUser, { merge: true });
              
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
          setDoc(doc(db, 'users', user.uid), {
            isOnline: false,
            lastSeen: new Date().toISOString()
          }, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, userPath));
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
        setDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline,
          lastSeen: new Date().toISOString()
        }, { merge: true }).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
