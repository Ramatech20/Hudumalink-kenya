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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Sync emailVerified
          if (firebaseUser.emailVerified && !userData.emailVerified) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              emailVerified: true
            });
            setUser({ ...userData, emailVerified: true });
          } else {
            setUser(userData);
          }
        } else {
          // Create a default profile if it doesn't exist
          const newUser: User = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous User',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            role: 'customer',
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            referralEarnings: 0,
            escrowBalance: 0,
            emailVerified: firebaseUser.emailVerified,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
