import { useState, useEffect, useCallback } from 'react';
import { doc, collection, runTransaction, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { toast } from 'sonner';
import { handleAppError } from '../lib/error-handler';
import { ExtendedUser } from '../types';

export const useWithdrawal = (user: ExtendedUser | undefined, onComplete?: () => void) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [withdrawDetails, setWithdrawDetails] = useState({ phoneNumber: '', bankName: '', accountNumber: '' });
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [calculatedFees, setCalculatedFees] = useState<{
    safaricomFee: number;
    commission: number;
    bankFee: number;
    totalFees: number;
    totalToDeduct: number;
  }>({
    safaricomFee: 0,
    commission: 0,
    bankFee: 0,
    totalFees: 0,
    totalToDeduct: 0,
  });
  const [loadingFees, setLoadingFees] = useState(false);

  useEffect(() => {
    if (user && withdrawMethod === 'mpesa' && !withdrawDetails.phoneNumber) {
      setWithdrawDetails(prev => ({
        ...prev,
        phoneNumber: user.phoneNumber || user.walletMpesaNumber || ''
      }));
    }
  }, [user, withdrawMethod]);

  const fetchFees = useCallback(async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setCalculatedFees({ safaricomFee: 0, commission: 0, bankFee: 0, totalFees: 0, totalToDeduct: 0 });
      return;
    }

    setLoadingFees(true);
    try {
      const response = await fetch('/api/withdrawal-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          userRole: user?.role || 'customer',
          orderType: 'product' // default goods/products
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee details');
      }

      const data = await response.json();
      setCalculatedFees({
        safaricomFee: data.safaricomFee || 0,
        commission: data.commission || 0,
        bankFee: data.bankFee || 0,
        totalFees: data.totalFees || 0,
        totalToDeduct: amount + data.totalFees,
      });
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoadingFees(false);
    }
  }, [withdrawAmount, withdrawMethod, user?.role]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFees();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [withdrawAmount, withdrawMethod, fetchFees]);

  const submitWithdrawal = async () => {
    if (!user || !withdrawAmount) return;

    if (!user.emailVerified && !auth.currentUser?.emailVerified) {
      toast.error('Please verify your email address to make a withdrawal.');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal is KES 100 to satisfy platform reserve mandates and Safaricom B2C bands.');
      return;
    }

    const { totalFees, totalToDeduct } = calculatedFees;

    if (totalToDeduct > (user.escrowBalance || 0)) {
      toast.error(`Insufficient balance. You need KES ${totalToDeduct.toLocaleString()} (including KES ${totalFees.toLocaleString()} total fees to process)`);
      return;
    }

    if (withdrawMethod === 'mpesa' && (!withdrawDetails.phoneNumber || withdrawDetails.phoneNumber.length < 9)) {
      toast.error('A valid M-Pesa phone number is required.');
      return;
    }

    if (withdrawMethod === 'bank' && (!withdrawDetails.bankName || !withdrawDetails.accountNumber)) {
      toast.error('Bank details (Name and Account Number) are required.');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const withdrawalRef = doc(collection(db, 'withdrawals'));

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        const currentBalance = userData?.escrowBalance || 0;

        if (currentBalance < totalToDeduct) {
          throw new Error(`Insufficient balance. Available withdrawable balance is KES ${currentBalance.toFixed(2)}. Inclusive package requires KES ${totalToDeduct.toFixed(2)}.`);
        }

        const prevEarnings = userData?.earnings || { totalVolume: 0, withdrawableBalance: 0, pendingHoldBalance: 0 };
        const newEarnings = {
          ...prevEarnings,
          withdrawableBalance: Math.max(0, (prevEarnings.withdrawableBalance || 0) - totalToDeduct)
        };

        // Deduct balance securely under transaction boundary
        transaction.update(userRef, {
          escrowBalance: increment(-totalToDeduct),
          earnings: newEarnings,
          updatedAt: new Date().toISOString()
        });

        // Write clean pending withdrawal application record
        transaction.set(withdrawalRef, {
          userId: user.uid,
          userName: userData?.displayName || 'Unknown User',
          amount,
          fee: totalFees,
          totalDeducted: totalToDeduct,
          method: withdrawMethod,
          details: withdrawMethod === 'mpesa' 
            ? { phoneNumber: withdrawDetails.phoneNumber }
            : { bankName: withdrawDetails.bankName, accountNumber: withdrawDetails.accountNumber },
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      });
      
      toast.success('Withdrawal request submitted! Funds have been moved to pending.');
      setWithdrawAmount('');
      if (onComplete) onComplete();
    } catch (error: any) {
      handleAppError(error, 'useWithdrawal:submitWithdrawal');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return {
    withdrawAmount,
    setWithdrawAmount,
    withdrawMethod,
    setWithdrawMethod,
    withdrawDetails,
    setWithdrawDetails,
    submittingWithdraw,
    calculatedFees,
    loadingFees,
    submitWithdrawal
  };
};
