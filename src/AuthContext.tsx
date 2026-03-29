import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
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
    
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      // Sync emailVerified if it changed in Firebase Auth
      if (auth.currentUser.emailVerified && !userData.emailVerified) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          emailVerified: true
        });
        setUser({ ...userData, emailVerified: true });
      } else {
        setUser(userData);
      }
    }
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set up real-time listener for user profile
        unsubscribeSnapshot = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            
            // One-time upgrade for bootstrap admin
            if (firebaseUser.email === 'ramadhanwambia83@gmail.com' && userData.role !== 'admin') {
              try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  role: 'admin',
                  isVerified: true
                });
                setUser({ ...userData, role: 'admin', isVerified: true });
              } catch (error) {
                console.error("Failed to upgrade admin role:", error);
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
              referralCode: firebaseUser.uid.substring(0, 6).toUpperCase(),
              referralEarnings: 0,
              escrowBalance: 0,
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser, { merge: true });
            setUser(newUser);
          }
          setLoading(false);
          setIsAuthReady(true);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUser(null);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
