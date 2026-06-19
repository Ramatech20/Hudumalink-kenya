import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
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
 * Handles IntaSend checkout link creation and escrow transaction creation.
 */
export const initiateEscrowPayment = async (request: PaymentRequest): Promise<string | null> => {
  try {
    const authUser = auth.currentUser;
    const email = authUser?.email || 'customer@hudumalink.co.ke';
    const displayName = authUser?.displayName || 'HudumaLink Customer';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts[1] || 'Guest';

    // 1. Create the transaction in Firestore with 'pending_payment' status
    const transactionData: any = {
      listingId: request.listingId,
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      amount: request.amount,
      tipAmount: request.tipAmount,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'intasend',
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

    // 2. Call backend to create IntaSend checkout link
    try {
      const idToken = authUser ? await authUser.getIdToken() : '';
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          transactionId: transactionId,
          amount: request.amount + (request.tipAmount || 0),
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: request.phoneNumber,
          redirectUrl: `${window.location.origin}/transactions/${transactionId}`
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout link');
      }

      if (data.url) {
        toast.success('Redirecting to secure IntaSend checkout gateway...');
        // Execute redirect
        window.location.href = data.url;
      }
    } catch (apiError: any) {
      console.error('API Error generating checkout:', apiError);
      toast.error('Payment channel error: ' + apiError.message);
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
 * Handles the payment confirmation callback (Simulation placeholder check).
 */
export const processPaymentSuccess = async (transactionId: string) => {
  console.log(`IntaSend Webhook handles payment confirmation for ${transactionId}`);
};

/**
 * Releases funds from escrow to the seller.
 * Calls backend to calculate commission, deduct and initiate transfer withrequires_approval = 'YES'.
 */
export const releaseEscrowFunds = async (transactionId: string): Promise<boolean> => {
  try {
    const authUser = auth.currentUser;
    if (!authUser) {
      toast.error('You must be logged in to release funds');
      return false;
    }

    const idToken = await authUser.getIdToken();
    const response = await fetch('/api/release-payment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ transactionId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to request Escrow release');
    }

    toast.success('Satisfaction confirmed! Payout transfer created and awaits administrator final review.');
    return true;
  } catch (error: any) {
    console.error('Error in releaseEscrowFunds:', error);
    toast.error('Release failed: ' + error.message);
    return false;
  }
};

