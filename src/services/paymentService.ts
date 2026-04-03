import { collection, addDoc, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
    // 1. Create the transaction in Firestore with 'pending' status.
    const transactionData: any = {
      listingId: request.listingId,
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      amount: request.amount + (request.deliveryQuote?.price || 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'mpesa',
      phoneNumber: request.phoneNumber,
      listingTitle: request.listingTitle,
      delivery: request.deliveryQuote
        ? { ...request.deliveryQuote, status: 'pending' }
        : undefined,
    };

    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    const transactionId = docRef.id;

    // 2. Trigger real M-Pesa STK Push on backend.
    const response = await fetch('/api/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: request.phoneNumber,
        amount: request.amount + (request.deliveryQuote?.price || 0),
        accountReference: `HUDUMA-${request.listingId}`,
        transactionDesc: `Payment for ${request.listingTitle}`,
        transactionId,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Failed STK Push request:', err);
      toast.error('Could not initiate payment request. Please try again.');
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'cancelled',
        cancellationReason: err,
        updatedAt: new Date().toISOString(),
      });
      return null;
    }

    const data = await response.json();
    if (data.CheckoutRequestID) {
      await updateDoc(doc(db, 'transactions', transactionId), {
        checkoutRequestId: data.CheckoutRequestID,
        updatedAt: new Date().toISOString(),
      });
    }

    toast.success('STK Push sent! Please complete payment on your phone.');
    return transactionId;
  } catch (error: any) {
    console.error('Payment initiation failed:', error);
    toast.error('Failed to initiate payment. Please try again.');
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
    const txSnap = await getDoc(txRef);
    
    if (!txSnap.exists()) return;
    
    const txData = txSnap.data() as Transaction;

    // Update transaction status to 'deposited' (funds are now in escrow)
    await updateDoc(txRef, {
      status: 'deposited',
      updatedAt: new Date().toISOString()
    });

    // Notify the seller
    await addDoc(collection(db, 'notifications'), {
      userId: txData.sellerId,
      title: 'Payment Received (Escrow)',
      message: `A payment of KES ${txData.amount} has been deposited into escrow for your listing. Please prepare for delivery/service.`,
      type: 'success',
      read: false,
      link: `/transactions/${transactionId}`,
      createdAt: new Date().toISOString()
    });

    toast.success('Payment confirmed! Funds are now held securely in escrow.');
  } catch (error) {
    console.error('Error simulating payment success:', error);
  }
};

/**
 * Releases funds from escrow to the seller.
 */
export const releaseEscrowFunds = async (transactionId: string) => {
  try {
    const txRef = doc(db, 'transactions', transactionId);
    const txSnap = await getDoc(txRef);
    
    if (!txSnap.exists()) return false;
    
    const txData = txSnap.data() as Transaction;
    if (txData.status !== 'deposited') {
      toast.error('Funds can only be released from "deposited" status.');
      return false;
    }

    // 1. Update transaction status
    await updateDoc(txRef, {
      status: 'released',
      updatedAt: new Date().toISOString()
    });

    // 2. Update seller's balance
    const sellerRef = doc(db, 'users', txData.sellerId);
    await updateDoc(sellerRef, {
      escrowBalance: increment(txData.amount)
    });

    // 3. Notify the seller
    await addDoc(collection(db, 'notifications'), {
      userId: txData.sellerId,
      title: 'Funds Released!',
      message: `The buyer has confirmed delivery. KES ${txData.amount} has been added to your balance.`,
      type: 'success',
      read: false,
      link: `/dashboard/wallet`,
      createdAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error releasing funds:', error);
    toast.error('Failed to release funds.');
    return false;
  }
};
