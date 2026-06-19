import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { User, Gift, Check, Shield, AlertCircle, Sparkles, ShoppingBag, Briefcase, Users } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Onboarding = () => {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'customer' | 'provider' | 'seller'>('customer');
  const [referralCode, setReferralCode] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set initial states once user is loaded
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      // If the user somehow completed onboarding, send them back
      if (user.isOnboardingCompleted && !user.needsOnboarding) {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      toast.error('Please enter your full legal name');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('M-Pesa phone number is required');
      return;
    }

    if (!agreeToTerms) {
      toast.error('You must agree to our Terms of Service & Privacy Policy.');
      return;
    }

    // Format phone number exactly like registration
    let formattedPhone = phoneNumber.trim().replace(/\s+/g, '').replace(/\+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    }

    if (!/^254[17]\d{8}$/.test(formattedPhone)) {
      toast.error('Please enter a valid Kenyan M-Pesa phone number (e.g., 07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXX).');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify phone uniqueness in secure phone registry
      const phoneDoc = await getDoc(doc(db, 'phone_registry', formattedPhone));
      if (phoneDoc.exists() && phoneDoc.data().userId !== user.uid) {
        toast.error('This M-Pesa phone number is already registered to another account.');
        setLoading(false);
        return;
      }

      // 2. Verify referral code if provided
      let referredBy = null;
      if (referralCode) {
        const refDoc = await getDoc(doc(db, 'referral_codes', referralCode.toUpperCase()));
        if (!refDoc.exists()) {
          toast.error('The referral code entered is invalid or does not exist.');
          setLoading(false);
          return;
        }
        referredBy = refDoc.data().userId;
        if (referredBy === user.uid) {
          toast.error('You cannot refer yourself.');
          setLoading(false);
          return;
        }
      }

      // 3. Save profile details in Firestore
      const userRef = doc(db, 'users', user.uid);
      const updatedProfile: any = {
        displayName: displayName.trim(),
        phoneNumber: formattedPhone,
        role: user.role === 'admin' ? 'admin' : role,
        needsOnboarding: false,
        isOnboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };

      if (referredBy) {
        updatedProfile.referredBy = referredBy;
      }

      await updateDoc(userRef, updatedProfile);

      // Register or update phone mapping in phone_registry
      await setDoc(doc(db, 'phone_registry', formattedPhone), {
        userId: user.uid,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Build out or clean referral map
      const finalReferralCode = user.referralCode || user.uid.substring(0, 6).toUpperCase();
      await setDoc(doc(db, 'referral_codes', finalReferralCode), {
        userId: user.uid,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Refresh auth context
      await refreshUser();

      toast.success('Onboarding complete! Welcome to HudumaLink Kenya 🇰🇪');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, `users/${user?.uid}`);
      toast.error('Failed to complete onboarding: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500">Loading user credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-neutral-950 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-xl p-8 md:p-10 border border-gray-100 dark:border-neutral-800"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary/10 rounded-3xl text-primary mb-4">
            <Sparkles className="w-8 h-8 animate-pulse text-primary" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Complete Registration 🇰🇪
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            Welcome to HudumaLink Kenya, {user.displayName}! Set up your service role and phone number details to access escrow security.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-Only Google Email */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Registered Email (Google Verified)
            </label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/40 text-gray-500 cursor-not-allowed outline-none text-sm font-semibold"
              value={user.email}
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Full Legal Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Kamau"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-450 mt-1.5 font-medium">
              Please enter your legal name as it appears on official documents (National ID, Passport, etc.) for validation.
            </p>
          </div>

          {/* Role Choice Visual Cards */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Select Your Profile Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Customer */}
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2.5 transition-all text-sm font-semibold cursor-pointer ${
                  role === 'customer'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'customer' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Customer</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-snug">
                    Hire professionals and buy goods.
                  </p>
                </div>
              </button>

              {/* Service Provider */}
              <button
                type="button"
                onClick={() => setRole('provider')}
                className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2.5 transition-all text-sm font-semibold cursor-pointer ${
                  role === 'provider'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'provider' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400'}`}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Service Provider</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-snug">
                    Offer custom skills and earn securely.
                  </p>
                </div>
              </button>

              {/* Seller */}
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`p-4 rounded-2xl border text-left flex flex-col items-start gap-2.5 transition-all text-sm font-semibold cursor-pointer ${
                  role === 'seller'
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className={`p-2 rounded-xl ${role === 'seller' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400'}`}>
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Merchant Seller</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-snug">
                    List goods, physical items & products.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* M-Pesa Phone Number */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Kenyan M-Pesa Mobile Number
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 07XXXXXXXX or 254XXXXXXXX"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-450 mt-1.5 font-medium">
              Necessary for receiving payout releases, escrow refunds, and verification protocols.
            </p>
          </div>

          {/* Referral Code (Optional) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-primary" /> Referral Code (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit referral code"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors uppercase"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="flex items-start gap-3 py-1">
            <input
              id="onboard_terms"
              type="checkbox"
              required
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-200 dark:border-neutral-700 text-primary focus:ring-primary transition-all cursor-pointer"
            />
            <label htmlFor="onboard_terms" className="text-xs text-gray-500 dark:text-gray-400 leading-normal cursor-pointer select-none">
              I certify that I have read and explicitly agree to the{' '}
              <a href="/terms" target="_blank" className="text-primary font-bold hover:underline">Terms of Service</a>,{' '}
              <a href="/privacy" target="_blank" className="text-primary font-bold hover:underline">Privacy Policy</a>, and{' '}
              <a href="/safety" target="_blank" className="text-primary font-bold hover:underline">Safety Guidelines</a> on HudumaLink.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-opacity-95 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/10 disabled:opacity-50 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Securing Environment...</span>
              </>
            ) : (
              <span>Complete Profile Setup</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
