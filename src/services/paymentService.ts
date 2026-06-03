import { collection, addDoc, updateDoc, doc, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Listing, User } from '../types';
import { toast } from 'sonner';

export interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listingTitle: string;
  type: 'product' | 'service';
  tipAmount?: number;
  deliveryQuote?: {
    provider: string;
    price: number;
  };
}

/**
 * Handles the M-Pesa STK Push and escrow transaction creation.
 */
export const initiateEscrowPayment = async (request: PaymentRequest): Promise<string | null> => {
  try {
    // 1. Create the transaction in Firestore with 'pending' status
    const transactionData: any = {
      listingId: request.listingId,
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      amount: request.amount,
      tipAmount: request.tipAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'mpesa',
      phoneNumber: request.phoneNumber,
    };

    // Clean undefined fields to avoid Firestore serialize errors
    Object.keys(transactionData).forEach(key => {
      if (transactionData[key] === undefined) {
        delete transactionData[key];
      }
    });

    if (request.deliveryQuote) {
      transactionData.delivery = {
        ...request.deliveryQuote,
        status: 'pending'
      };
    }

    // Check if buyer was referred
    const buyerDoc = await getDoc(doc(db, 'users', request.buyerId));
    if (buyerDoc.exists()) {
      const buyerData = buyerDoc.data();
      if (buyerData.referredBy) {
        transactionData.referralId = buyerData.referredBy;
      }
    }

    let docRef;
    try {
      docRef = await addDoc(collection(db, 'transactions'), transactionData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
      throw error;
    }
    const transactionId = docRef.id;

    // 2. Call backend to initiate STK Push
    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          amount: request.amount,
          accountReference: `ORDER-${transactionId.substring(0, 5)}`,
          transactionDesc: `Escrow for ${request.listingTitle}`,
          transactionId: transactionId
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate STK Push');
      }
    } catch (apiError) {
      console.error('API Error initiating STK Push:', apiError);
      // We continue since the transaction was created, but warn the user
    }

    return transactionId;
  } catch (error: any) {
    if (error.operationType) {
      // Already handled by handleFirestoreError
    } else {
      console.error('Payment initiation failed:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
    return null;
  }
};

/**
 * Handles the payment confirmation callback (Simulation for dev).
 */
export const processPaymentSuccess = async (transactionId: string) => {
  // In production, this is handled by /api/mpesa/callback
  // We'll keep a mock version for UI simulation if needed, but it should ideally call an admin-authorized API
  console.log(`Simulation: Payment success for ${transactionId}`);
};

/**
 * Releases funds from escrow to the seller.
 * Calls backend for secure settlement.
 */
export const releaseEscrowFunds = async (transactionId: string) => {
  try {
    const authUser = auth.currentUser;
    if (!authUser) {
      toast.error('You must be logged in to release funds');
      return false;
    }

    const txRef = doc(db, 'transactions', transactionId);
    
    const result = await runTransaction(db, async (transaction) => {
      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists()) {
        throw new Error('Transaction not found');
      }

      const txData = txDoc.data();
      if (!txData) {
        throw new Error('Data empty or invalid');
      }

      if (txData.status === 'completed' || txData.status === 'released') {
        throw new Error('Transaction is already completed');
      }

      // 1. Convert Transaction status to completed/released
      transaction.update(txRef, {
        status: 'released',
        releasedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Increment seller's escrowBalance directly!
      const sellerRef = doc(db, 'users', txData.sellerId);
      transaction.update(sellerRef, {
        escrowBalance: increment(txData.amount),
        completedPaymentsCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      // Merge on public profile
      const publicRef = doc(db, 'users_public', txData.sellerId);
      transaction.set(publicRef, {
        completedPaymentsCount: increment(1),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Create hold ledger or other records
      const holdLedgerRef = doc(collection(db, 'hold_ledgers'));
      transaction.set(holdLedgerRef, {
        userId: txData.sellerId,
        transactionId: transactionId,
        amount: txData.amount,
        releaseTime: new Date().toISOString(),
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      // Create notifications for buyer and seller
      const sellerNotifRef = doc(collection(db, 'notifications'));
      transaction.set(sellerNotifRef, {
        userId: txData.sellerId,
        title: 'Funds Released!',
        message: `The buyer has confirmed delivery. KES ${txData.amount} has been added to your escrow balance.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });

      const buyerNotifRef = doc(collection(db, 'notifications'));
      transaction.set(buyerNotifRef, {
        userId: txData.buyerId,
        title: 'Transaction Confirmed',
        message: `You have successfully released KES ${txData.amount} to the service provider.`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });

      return true;
    });

    if (result) {
      toast.success('Funds released successfully!');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Error in releaseEscrowFunds client-side:', error);
    toast.error('Failed to release funds: ' + error.message);
    return false;
  }
};
