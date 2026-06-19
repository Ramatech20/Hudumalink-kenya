import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { ExtendedUser } from '../../types';
import { formatPrice, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, Star, TrendingUp, Gift, Shield, 
  Settings, Camera, Loader2, AlertTriangle, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSidebarProps {
  user: ExtendedUser;
  listingsLength: number;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  uploading: boolean;
  onAvatarUploadClick: () => void;
  onWithdrawClick: () => void;
  onDeleteAccountClick: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  user,
  listingsLength,
  isEditing,
  setIsEditing,
  uploading,
  onAvatarUploadClick,
  onWithdrawClick,
  onDeleteAccountClick
}) => {
  const { t } = useLanguage();

  const handleCopyReferral = () => {
    if (user.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast.success('Referral code copied!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Bio / Main Identity Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors text-center relative overflow-hidden">
        <div className="relative w-32 h-32 mx-auto mb-4 group">
          <div className="w-full h-full rounded-[2.25rem] overflow-hidden border-4 border-gray-50 dark:border-neutral-800 shadow-inner bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-4xl font-black text-gray-400 dark:text-neutral-600">
                {user.displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button 
            type="button"
            disabled={uploading}
            onClick={onAvatarUploadClick}
            className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-[1.25rem] hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>

        {user.isVerified && (
          <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full border border-white dark:border-neutral-900" title="Account Verified">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}

        {user.isPhoneVerified && (
          <div className="absolute top-4 left-4 bg-secondary text-white p-1 rounded-full border border-white dark:border-neutral-900" title="Phone Verified">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.displayName}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>

        {user.role === 'customer' && !user.isVerified && (
          <div className="mt-4 p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Verification Progress</span>
              <span className="text-[10px] font-bold text-emerald-750 dark:text-emerald-400">{user.completedPaymentsCount || 0}/5</span>
            </div>
            <div className="h-1.5 bg-neutral-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(((user.completedPaymentsCount || 0) / 5) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 leading-tight">
              Complete 5 escrow handshakes to auto-unlock Verified Customer badge!
            </p>
          </div>
        )}

        <div className="flex items-center justify-center mt-2 text-yellow-500">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-bold ml-1">{user.rating || 'New'}</span>
        </div>

        {user.role !== 'customer' && (
          <Link 
            to="/seller-dashboard"
            className="mt-4 w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary py-3 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>View Analytics</span>
          </Link>
        )}

        {/* Finance, Escrow and Referral Stats */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-neutral-800 grid grid-cols-1 gap-4 text-left">
          <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Gift className="w-3 h-3 mr-1" /> Referral Code
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-white font-mono">{user.referralCode}</span>
              <button 
                type="button"
                onClick={handleCopyReferral}
                className="text-[10px] text-primary font-bold uppercase hover:underline"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl">
            <div className="flex items-center text-primary text-xs mb-1 font-bold">
              <Shield className="w-3 h-3 mr-1" /> Escrow Balance
            </div>
            <div className="flex items-end justify-between">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(user.escrowBalance || 0)}
              </span>
              <button 
                type="button"
                onClick={onWithdrawClick}
                className="text-[10px] text-primary font-bold uppercase hover:underline"
              >
                Withdraw
              </button>
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px]">
              <span className="text-gray-500">Withdrawable funds</span>
              <span className="text-amber-600 font-semibold font-mono">
                Hold: {formatPrice(user.pendingWithdrawalBalance || 0)}
              </span>
            </div>
          </div>

          <div className="bg-secondary/5 p-4 rounded-2xl">
            <div className="flex items-center text-secondary text-xs mb-1 font-bold">
              <Gift className="w-3 h-3 mr-1" /> Referral Earnings
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(user.referralEarnings || 0)}
              </span>
              <Link 
                to="/referrals"
                className="flex items-center text-xs font-bold text-secondary hover:underline"
              >
                <span>View Dashboard</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Shield className="w-3 h-3 mr-1" /> KYC Compliance
            </div>
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-bold uppercase",
                user.kycStatus === 'verified' ? "text-green-500" : 
                user.kycStatus === 'pending' ? "text-yellow-500" : 
                user.kycStatus === 'rejected' ? "text-red-500" : "text-gray-400"
              )}>
                {user.kycStatus === 'verified' ? "KYC Verified" : 
                 user.kycStatus === 'pending' ? "KYC Pending" :
                 user.kycStatus === 'rejected' ? "KYC Rejected" : "Not Verified"}
              </span>
              {user.kycStatus !== 'verified' && (
                <Link to="/kyc" className="text-[10px] text-primary font-bold uppercase hover:underline">
                  {user.kycStatus === 'pending' ? "View" : "Verify Now"}
                </Link>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "mt-6 w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all shadow-sm",
            isEditing 
              ? "bg-primary text-white hover:bg-opacity-90 shadow-primary/10" 
              : "border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>{isEditing ? "Back to Dashboard" : "Account Settings"}</span>
        </button>
      </div>

      {/* Account Stats Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm transition-colors">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Account Stats</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Total Listings</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{listingsLength}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Member Since</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">{new Date(user.createdAt).getFullYear()}</span>
          </div>
        </div>
      </div>

      {/* Compliance & Erasure sidebar widget */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-red-100 dark:border-red-900/20 shadow-sm transition-colors">
        <div className="flex items-center space-x-2 text-red-500 mb-4">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest">Compromise & Deletion</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          HudumaLink operates under full ODPC compliance. You may invoke GDPR erasure to wipe transactional ledger snapshots, device fingerprints, and telemetry traces under formal settlement rules.
        </p>
        <button 
          onClick={onDeleteAccountClick}
          className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 py-3 rounded-xl text-xs font-bold transition-all border border-red-100/30 cursor-pointer"
        >
          Invoke Account Purge
        </button>
      </div>
    </div>
  );
};
