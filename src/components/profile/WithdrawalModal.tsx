import React from 'react';
import { useLanguage } from '../../LanguageContext';
import { ExtendedUser } from '../../types';
import { X, Smartphone, Landmark, Loader2, DollarSign, HelpCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../../lib/utils';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ExtendedUser;
  // useWithdrawal Hook output
  withdrawAmount: string;
  setWithdrawAmount: (val: string) => void;
  withdrawMethod: 'mpesa' | 'bank';
  setWithdrawMethod: (val: 'mpesa' | 'bank') => void;
  withdrawDetails: { phoneNumber: string; bankName: string; accountNumber: string };
  setWithdrawDetails: React.Dispatch<React.SetStateAction<any>>;
  submittingWithdraw: boolean;
  calculatedFees: {
    safaricomFee: number;
    commission: number;
    bankFee: number;
    totalFees: number;
    totalToDeduct: number;
  };
  loadingFees: boolean;
  submitWithdrawal: () => Promise<void>;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  user,
  withdrawAmount,
  setWithdrawAmount,
  withdrawMethod,
  setWithdrawMethod,
  withdrawDetails,
  setWithdrawDetails,
  submittingWithdraw,
  calculatedFees,
  loadingFees,
  submitWithdrawal,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setWithdrawAmount(val);
    }
  };

  const currentAmount = parseFloat(withdrawAmount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-gray-50 dark:bg-neutral-900/50">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Secure Funds Disbursement</h3>
            <p className="text-xs text-gray-500 mt-1 font-sans">Withdraw available escrow balances into validated accounts.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Main Balance Info */}
          <div className="p-4 bg-primary/5 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase text-primary/80 tracking-wider">Available Balance</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                {formatPrice(user.escrowBalance || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 py-0.5">Disbursal Limit</p>
              <span className="bg-green-500/10 text-green-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                ODPC Tier 1
              </span>
            </div>
          </div>

          {/* Amount Inputs */}
          <div>
            <label className="block text-xs font-bold text-gray-450 dark:text-neutral-500 uppercase tracking-widest mb-2.5">
              Enter Withdrawal Gross Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-sm font-black text-gray-400 dark:text-neutral-500">KES</span>
              <input 
                type="text"
                required
                value={withdrawAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary pl-14 pr-12 py-4 rounded-2xl text-base font-bold font-mono transition select-all"
              />
              {loadingFees && (
                <span className="absolute right-4 top-4.5">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-450 mt-1.5 leading-tight">
              Platform reserve constraint: Minimum KES 100 withdrawal.
            </p>
          </div>

          {/* Dynamic Fee Breakdown Grid (Strict Server Logic) */}
          {currentAmount >= 100 && (
            <div className="p-4 bg-neutral-100/60 dark:bg-neutral-800/30 rounded-2xl space-y-2 border border-gray-150/40 dark:border-neutral-800/40 font-mono text-xs">
              <div className="flex justify-between text-gray-650 dark:text-gray-400">
                <span>Requested Amount (Gross)</span>
                <span className="font-extrabold text-gray-900 dark:text-white">KSh {currentAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-gray-650 dark:text-gray-400">
                <span>Platform Commission / Fee</span>
                <span>KSh {calculatedFees.commission.toLocaleString()}</span>
              </div>

              {withdrawMethod === 'mpesa' && (
                <div className="flex justify-between text-gray-650 dark:text-gray-400">
                  <span>Safaricom B2C dynamic tariff</span>
                  <span>KSh {calculatedFees.safaricomFee.toLocaleString()}</span>
                </div>
              )}

              {withdrawMethod === 'bank' && (
                <div className="flex justify-between text-gray-650 dark:text-gray-400">
                  <span>Standard bank network levy</span>
                  <span>KSh {calculatedFees.bankFee.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-dashed border-gray-300 dark:border-neutral-700 my-2 pt-2 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                <span className="flex items-center gap-1">
                  Total Deducted
                  <span className="text-[10px] font-normal text-gray-400">(Gross + Fees)</span>
                </span>
                <span className="text-secondary text-base">
                  KSh {calculatedFees.totalToDeduct.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Disbursement Channels List */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setWithdrawMethod('mpesa')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition duration-150 align-top ${
                withdrawMethod === 'mpesa' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-gray-200 dark:border-neutral-800 text-gray-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <div>
                <p className="text-xs font-black">Safaricom M-Pesa</p>
                <p className="text-[9px] text-gray-450 mt-0.5 font-normal">Daraja dynamic tiers</p>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => setWithdrawMethod('bank')}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition duration-150 align-top ${
                withdrawMethod === 'bank' 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-gray-200 dark:border-neutral-800 text-gray-500 hover:bg-neutral-50 dark:hover:bg-neutral-850'
              }`}
            >
              <Landmark className="w-5 h-5" />
              <div>
                <p className="text-xs font-black">Bank Transfer</p>
                <p className="text-[9px] text-gray-450 mt-0.5 font-normal">KES 50 flat levy</p>
              </div>
            </button>
          </div>

          {/* Channels Inputs */}
          <div className="space-y-4">
            {withdrawMethod === 'mpesa' ? (
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2 font-sans">
                  Safaricom M-Pesa Phone Number
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 2547XXXXXXXX"
                  value={withdrawDetails.phoneNumber}
                  onChange={(e) => setWithdrawDetails({ ...withdrawDetails, phoneNumber: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition font-mono"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2 font-sans">
                    Bank Brand Name
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Equity Bank"
                    value={withdrawDetails.bankName}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bankName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-xs font-semibold transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest mb-2 font-sans">
                    Bank Account Number
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Account Number"
                    value={withdrawDetails.accountNumber}
                    onChange={(e) => setWithdrawDetails({ ...withdrawDetails, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border-0 focus:ring-2 focus:ring-primary p-4 rounded-2xl text-sm font-semibold transition font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 flex flex-col sm:flex-row justify-end items-center gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 border border-gray-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-gray-650 dark:text-gray-300 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={submittingWithdraw || !withdrawAmount || currentAmount < 100}
            onClick={submitWithdrawal}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-40"
          >
            {submittingWithdraw ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Submit Withdrawal Application"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
