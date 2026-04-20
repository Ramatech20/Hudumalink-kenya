import { collection, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
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
 * Simulates an M-Pesa STK Push and handles the escrow transaction creation.
 * In a real app, this would call a backend API that interfaces with Safaricom Daraja.
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

    if (request.deliveryQuote) {
      transactionData.delivery = {
        ...request.deliveryQuote,
        status: 'pending'
      };
    }

    let docRef;
    try {
      docRef = await addDoc(collection(db, 'transactions'), transactionData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
      throw error;
    }
    const transactionId = docRef.id;

    // 2. Simulate the STK Push request to the user's phone
    // In a real app, you'd call your backend here:
    // const response = await fetch('/api/payments/stkpush', { ... });
    
    console.log(`Initiating M-Pesa STK Push for ${request.phoneNumber} - Amount: ${request.amount}`);
    
    // Simulate a short delay for the network request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 3. Update transaction with a simulated checkout request ID
    const checkoutRequestId = `ws_CO_${Math.random().toString(36).substring(2, 15)}`;
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        checkoutRequestId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
      throw error;
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
 * Simulates the M-Pesa callback that confirms a successful payment.
 * This would normally be handled by a webhook on your server.
 */
export const simulatePaymentSuccess = async (transactionId: string) => {
  try {
    const txRef = doc(db, 'transactions', transactionId);
    let txSnap;
    try {
      txSnap = await getDoc(txRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `transactions/${transactionId}`);
      throw error;
    }
    
    if (!txSnap.exists()) return;
    
    const txData = txSnap.data() as Transaction;

    // Update transaction status to 'deposited' (funds are now in escrow)
    try {
      await updateDoc(txRef, {
        status: 'deposited',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
      throw error;
    }

    // Notify the seller
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: txData.sellerId,
        title: 'Payment Received (Escrow)',
        message: `A payment of KES ${txData.amount} has been deposited into escrow for your listing. Please prepare for delivery/service.`,
        type: 'success',
        read: false,
        link: `/transactions/${transactionId}`,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
      throw error;
    }

    toast.success('Payment confirmed! Funds are now held securely in escrow.');
  } catch (error: any) {
    if (error.operationType) {
      // Already handled by handleFirestoreError
    } else {
      console.error('Error simulating payment success:', error);
    }
  }
};

/**
 * Releases funds from escrow to the seller.
 */
export const releaseEscrowFunds = async (transactionId: string) => {
  try {
    const txRef = doc(db, 'transactions', transactionId);
    let txSnap;
    try {
      txSnap = await getDoc(txRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `transactions/${transactionId}`);
      throw error;
    }
    
    if (!txSnap.exists()) return false;
    
    const txData = txSnap.data() as Transaction;
    if (txData.status !== 'deposited') {
      toast.error('Funds can only be released from "deposited" status.');
      return false;
    }

    // 1. Update transaction status
    try {
      await updateDoc(txRef, {
        status: 'released',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${transactionId}`);
      throw error;
    }

    // 2. Update seller's balance
    const sellerRef = doc(db, 'users', txData.sellerId);
    try {
      await updateDoc(sellerRef, {
        escrowBalance: increment(txData.amount)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${txData.sellerId}`);
      throw error;
    }

    // 3. Notify the seller
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: txData.sellerId,
        title: 'Funds Released!',
        message: `The buyer has confirmed delivery. KES ${txData.amount} has been added to your balance.`,
        type: 'success',
        read: false,
        link: `/dashboard/wallet`,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'notifications');
      throw error;
    }

    return true;
  } catch (error: any) {
    if (error.operationType) {
      // Already handled by handleFirestoreError
    } else {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds.');
    }
    return false;
  }
};
