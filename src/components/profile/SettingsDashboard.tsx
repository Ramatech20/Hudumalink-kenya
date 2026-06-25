import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { ExtendedUser } from '../../types';
import { KENYAN_COUNTIES, TOWNS } from '../../constants';
import { 
  ShieldCheck, Lock, MapPin, Loader2, Save, X, User as UserIcon, Bell, CreditCard, Moon, Sun, Monitor
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface SettingsDashboardProps {
  user: ExtendedUser;
  // useProfileUpdate Hook state/handlers
  editData: {
    displayName: string;
    phoneNumber: string;
    county: string;
    town: string;
    lat: number | null;
    lng: number | null;
    role: 'customer' | 'provider' | 'seller';
    photoURL: string;
    dob: string;
    countyOfBirth: string;
    residence: string;
    area: string;
    gender: 'male' | 'female' | 'other' | '';
    occupation: string;
  };
  setEditData: React.Dispatch<React.SetStateAction<any>>;
  is2faEnabled: boolean;
  setIs2faEnabled: (val: boolean) => void;
  twoFaMethod: 'sms' | 'authenticator';
  setTwoFaMethod: (val: 'sms' | 'authenticator') => void;
  walletMpesaNumber: string;
  setWalletMpesaNumber: (val: string) => void;
  walletBankName: string;
  setWalletBankName: (val: string) => void;
  walletAccountName: string;
  setWalletAccountName: (val: string) => void;
  walletAccountNumber: string;
  setWalletAccountNumber: (val: string) => void;
  kraPin: string;
  setKraPin: (val: string) => void;
  agreeVatTurnover: boolean;
  setAgreeVatTurnover: (val: boolean) => void;
  alertsPush: boolean;
  setAlertsPush: (val: boolean) => void;
  alertsSms: boolean;
  setAlertsSms: (val: boolean) => void;
  alertsEmail: boolean;
  setAlertsEmail: (val: boolean) => void;
  disbursementMethod: 'mpesa' | 'bank';
  setDisbursementMethod: (val: 'mpesa' | 'bank') => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
  user,
  editData,
  setEditData,
  is2faEnabled,
  setIs2faEnabled,
  twoFaMethod,
  setTwoFaMethod,
  walletMpesaNumber,
  setWalletMpesaNumber,
  walletBankName,
  setWalletBankName,
  walletAccountName,
  setWalletAccountName,
  walletAccountNumber,
  setWalletAccountNumber,
  kraPin,
  setKraPin,
  agreeVatTurnover,
  setAgreeVatTurnover,
  alertsPush,
  setAlertsPush,
  alertsSms,
  setAlertsSms,
  alertsEmail,
  setAlertsEmail,
  disbursementMethod,
  setDisbursementMethod,
  onSubmit,
  onCancel,
}) => {
  const { t } = useLanguage();
  const { theme: currentTheme, setTheme: changeTheme } = useTheme();

  const handleGeoLocationFill = () => {
    if (navigator.geolocation) {
      toast.info("Fetching your device's geolocation details...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setEditData((prev: any) => ({
            ...prev,
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6))
          }));
          toast.success("Coordinates captured successfully!");
        },
        (error) => {
          console.warn(error);
          toast.error("Unable to access geolocation. Please enter coordinates manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* 1. General Profile Segment */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-primary" />
          General Account Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Display Name</label>
            <input 
              type="text"
              required
              value={editData.displayName}
              onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Kenyan M-Pesa Phone (254XXXXXXXXX)</label>
            <input 
              type="text"
              placeholder="07XXXXXXXX"
              value={editData.phoneNumber}
              onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Gender</label>
            <select 
              value={editData.gender}
              onChange={(e) => setEditData({ ...editData, gender: e.target.value as any })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Date of Birth</label>
            <input 
              type="date"
              value={editData.dob}
              onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Primary County</label>
            <select 
              value={editData.county}
              onChange={(e) => setEditData({ ...editData, county: e.target.value, town: '' })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
            >
              <option value="">Select County</option>
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Primary Town</label>
            <select 
              value={editData.town}
              onChange={(e) => setEditData({ ...editData, town: e.target.value })}
              disabled={!editData.county}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition disabled:opacity-50"
            >
              <option value="">Select Town</option>
              {(TOWNS[editData.county] || []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">County of Birth</label>
            <select 
              value={editData.countyOfBirth}
              onChange={(e) => setEditData({ ...editData, countyOfBirth: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
            >
              <option value="">Select County of Birth</option>
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Residence / Estate Name</label>
            <input 
              type="text"
              value={editData.residence}
              onChange={(e) => setEditData({ ...editData, residence: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
              placeholder="e.g. Kilimani, Runda"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Area / Subcounty</label>
            <input 
              type="text"
              value={editData.area}
              onChange={(e) => setEditData({ ...editData, area: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
              placeholder="e.g. Dagoretti North"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Occupation</label>
            <input 
              type="text"
              value={editData.occupation}
              onChange={(e) => setEditData({ ...editData, occupation: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition"
              placeholder="e.g. Plumber, Electrical Engineer"
            />
          </div>
        </div>

        {/* Geolocation Coordinates Picker */}
        <div className="mt-6 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-gray-100 dark:border-neutral-800/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Physical Geolocation Coordinates Pin
              </p>
              <p className="text-xs text-gray-400 mt-1">Used to establish physical proximity and trust indicators for market transactions.</p>
            </div>
            <button 
              type="button" 
              onClick={handleGeoLocationFill}
              className="px-4 py-2 bg-primary/10 text-primary text-xs font-extrabold rounded-xl hover:bg-primary/15 transition duration-150 cursor-pointer"
            >
              Pin Live Device Location
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Latitude</label>
              <input 
                type="number"
                step="any"
                value={editData.lat ?? ''}
                onChange={(e) => setEditData({ ...editData, lat: e.target.value ? Number(e.target.value) : null })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-250 dark:border-neutral-800 focus:ring-2 focus:ring-primary px-3 py-2 rounded-xl text-xs font-semibold select-all font-mono"
                placeholder="e.g. -1.2921"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Longitude</label>
              <input 
                type="number"
                step="any"
                value={editData.lng ?? ''}
                onChange={(e) => setEditData({ ...editData, lng: e.target.value ? Number(e.target.value) : null })}
                className="w-full bg-white dark:bg-neutral-900 border border-gray-250 dark:border-neutral-800 focus:ring-2 focus:ring-primary px-3 py-2 rounded-xl text-xs font-semibold select-all font-mono"
                placeholder="e.g. 36.8219"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Security & Compliance Segment */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Security, MFA & Compliance
        </h3>

        <div className="space-y-6">
          {/* KYC Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 text-green-550 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  National ID (KYC) Verification Status
                  {user.kycStatus === 'verified' && <span className="bg-green-500/10 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">VERIFIED</span>}
                  {user.kycStatus === 'pending' && <span className="bg-amber-500/10 text-amber-750 text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">PENDING</span>}
                  {(!user.kycStatus || user.kycStatus === 'none' || user.kycStatus === 'rejected') && <span className="bg-red-500/10 text-red-650 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">ACTION REQUIRED</span>}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Regulated under Kenya Data Protection Laws. Governs overall platform trust score and withdraw limits.
                </p>
              </div>
            </div>
          </div>

          {/* 2FA Setup */}
          <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-800/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">Multi-Factor Authentication (MFA / 2FA)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Secure critical withdrawals, profile alterations, or high-value escrow handshakes.
                </p>
                
                <div className="mt-4 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="twoFaMethod"
                      checked={twoFaMethod === 'sms'} 
                      onChange={() => setTwoFaMethod('sms')} 
                      disabled={!is2faEnabled}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Safaricom SMS OTP Gateway</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="twoFaMethod"
                      checked={twoFaMethod === 'authenticator'} 
                      onChange={() => setTwoFaMethod('authenticator')} 
                      disabled={!is2faEnabled}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">Google Authenticator App Protocol</span>
                  </label>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const nextState = !is2faEnabled;
                  setIs2faEnabled(nextState);
                  toast.success(nextState ? `Two-Factor Authentication activated over ${twoFaMethod === 'sms' ? 'SMS Gateway' : 'Google Authenticator'}!` : "Two-Factor Authentication deactivated.");
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  is2faEnabled ? "bg-green-500" : "bg-gray-200 dark:bg-neutral-700"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  is2faEnabled ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Theme Preference Segment */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          {currentTheme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          Theme Preference
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
          Personalize your visual workspace. Toggle or synchronize the application appearance instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => changeTheme('light')}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'light'
                ? "border-primary bg-primary/[0.03] text-primary"
                : "border-gray-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/10 text-gray-500 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-neutral-800/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
              currentTheme === 'light' ? "bg-primary/10" : "bg-gray-100 dark:bg-neutral-800 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700"
            )}>
              <Sun className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-sm font-bold block">Light Mode ☀️</span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1 block">Clean and bright contrast</span>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => changeTheme('dark')}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'dark'
                ? "border-primary bg-primary/[0.03] text-primary"
                : "border-gray-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/10 text-gray-500 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-neutral-800/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
              currentTheme === 'dark' ? "bg-primary/10" : "bg-gray-100 dark:bg-neutral-800 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700"
            )}>
              <Moon className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-bold block">Dark Mode 🌙</span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1 block">Elegant, eye-friendly layout</span>
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => changeTheme('system')}
            className={cn(
              "flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary/40",
              currentTheme === 'system'
                ? "border-primary bg-primary/[0.03] text-primary"
                : "border-gray-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/10 text-gray-500 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-neutral-800/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
              currentTheme === 'system' ? "bg-primary/10" : "bg-gray-100 dark:bg-neutral-800 group-hover:bg-gray-200 dark:group-hover:bg-neutral-700"
            )}>
              <Monitor className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-bold block">System Default 💻</span>
            <span className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1 block">Follows device settings</span>
          </button>
        </div>
      </div>



      {/* 4. Notification Preferences Segment */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Alerts & Real-Time Comms
        </h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/20 rounded-xl cursor-pointer">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Push Notifications</span>
            <input 
              type="checkbox"
              checked={alertsPush}
              onChange={(e) => setAlertsPush(e.target.checked)}
              className="text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/20 rounded-xl cursor-pointer">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Safaricom SMS Alerts</span>
            <input 
              type="checkbox"
              checked={alertsSms}
              onChange={(e) => setAlertsSms(e.target.checked)}
              className="text-primary focus:ring-primary"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/20 rounded-xl cursor-pointer">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email System Invoices</span>
            <input 
              type="checkbox"
              checked={alertsEmail}
              onChange={(e) => setAlertsEmail(e.target.checked)}
              className="text-primary focus:ring-primary"
            />
          </label>
        </div>
      </div>

      {/* 5. Trigger Buttons */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
        <button 
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-4 border border-gray-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-gray-650 dark:text-gray-300 font-bold rounded-2xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
};
