import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { handleAuthError, handleGeneralError, handleValidationError } from '../lib/error-handler';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { User, Gift } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState<'customer' | 'provider' | 'seller'>('customer');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    if (!isLogin && !agreeToTerms) {
      toast.error('Please agree to our Terms, Privacy Policy, and Safety Tips to continue.');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const newReferralCode = user.uid.substring(0, 6).toUpperCase();
        const isAdminEmail = user.email === 'ramadhanwambia83@gmail.com';
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous User',
            email: user.email,
            photoURL: user.photoURL || '',
            role: isAdminEmail ? 'admin' : 'customer',
            isVerified: isAdminEmail,
            referralCode: newReferralCode,
            referralEarnings: 0,
            escrowBalance: 0,
            emailVerified: user.emailVerified,
            createdAt: new Date().toISOString(),
          }, { merge: true });

          // Create public referral code mapping
          await setDoc(doc(db, 'referral_codes', newReferralCode), {
            userId: user.uid,
            createdAt: new Date().toISOString()
          });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.WRITE, 'users/referral_codes');
          return;
        }
      }
      toast.success('Successfully signed in!');
      navigate('/');
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !agreeToTerms) {
      handleValidationError('Please agree to our Terms, Privacy Policy, and Safety Tips to continue.');
      return;
    }
    setLoading(true);
    if (!isLogin && password !== confirmPassword) {
      handleValidationError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          toast.success('Welcome back!');
        } catch (error: any) {
          handleAuthError(error);
          setLoading(false);
          return;
        }
      } else {
        // Check if referral code is valid if provided
        let referredBy = null;
        if (referralCode) {
          try {
            const refDoc = await getDoc(doc(db, 'referral_codes', referralCode.toUpperCase()));
            if (!refDoc.exists()) {
              handleValidationError('Invalid referral code');
              setLoading(false);
              return;
            }
            referredBy = refDoc.data().userId;
          } catch (error: any) {
            handleFirestoreError(error, OperationType.GET, `referral_codes/${referralCode}`);
            setLoading(false);
            return;
          }
        }

        let result;
        try {
          result = await createUserWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
          handleAuthError(error);
          setLoading(false);
          return;
        }

        const newReferralCode = result.user.uid.substring(0, 6).toUpperCase();
        const isAdminEmail = email === 'ramadhanwambia83@gmail.com';
        
        try {
          // Create user profile
          await setDoc(doc(db, 'users', result.user.uid), {
            uid: result.user.uid,
            displayName: displayName || 'Anonymous User',
            email,
            photoURL: '',
            role: isAdminEmail ? 'admin' : role,
            isVerified: isAdminEmail,
            referralCode: newReferralCode,
            referredBy,
            referralEarnings: 0,
            escrowBalance: 0,
            emailVerified: false,
            createdAt: new Date().toISOString(),
          }, { merge: true });

          // Create public referral code mapping
          await setDoc(doc(db, 'referral_codes', newReferralCode), {
            userId: result.user.uid,
            createdAt: new Date().toISOString()
          });
        } catch (error: any) {
          handleFirestoreError(error, OperationType.WRITE, 'users/referral_codes');
          setLoading(false);
          return;
        }

        await sendEmailVerification(result.user);
        toast.success('Account created! Please check your email for verification.');
      }
      navigate('/');
    } catch (error: any) {
      // Catch-all for unexpected errors
      handleGeneralError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-neutral-800 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {isLogin ? 'Sign in to access your marketplace' : 'Join Kenya\'s biggest digital marketplace'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a...</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="customer">Customer / Buyer</option>
                  <option value="provider">Service Provider</option>
                  <option value="seller">Seller / Merchant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <Gift className="w-4 h-4 mr-2 text-primary" /> Referral Code (Optional)
                </label>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors uppercase"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start space-x-3 py-2">
              <input 
                id="terms"
                type="checkbox" 
                required
                className="mt-1 w-5 h-5 rounded border-gray-200 dark:border-neutral-700 text-primary focus:ring-primary transition-all cursor-pointer"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer select-none">
                I have read and agree to the{' '}
                <a href="/terms" target="_blank" className="text-primary font-bold hover:underline">Terms of Service</a>,{' '}
                <a href="/privacy" target="_blank" className="text-primary font-bold hover:underline">Privacy Policy</a>, and{' '}
                <a href="/safety" target="_blank" className="text-primary font-bold hover:underline">Safety Tips</a>.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400 transition-colors">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center space-x-2 border border-gray-200 dark:border-neutral-700 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all text-gray-900 dark:text-white"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span>Google</span>
        </button>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="ml-1 text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
