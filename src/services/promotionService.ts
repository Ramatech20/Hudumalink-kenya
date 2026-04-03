import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export interface PromotionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  tier: 'basic' | 'premium' | 'elite';
  features: string[];
}

export const PROMOTION_PLANS: PromotionPlan[] = [
  {
    id: 'basic',
    name: 'Basic Boost',
    price: 49,
    durationDays: 3,
    tier: 'basic',
    features: ['Highlighted listing', 'Top of category search', '3 days duration']
  },
  {
    id: 'premium',
    name: 'Premium Reach',
    price: 149,
    durationDays: 7,
    tier: 'premium',
    features: ['Featured badge', 'Top of all search results', '7 days duration', 'Social media mention']
  },
  {
    id: 'elite',
    name: 'Elite Visibility',
    price: 499,
    durationDays: 30,
    tier: 'elite',
    features: ['Elite badge', 'Homepage spotlight', '30 days duration', 'Priority support', 'Analytics report']
  }
];

export const initiatePromotionPayment = async (params: {
  phoneNumber: string;
  planId: string;
  listingId: string;
  userId: string;
}) => {
  const plan = PROMOTION_PLANS.find(p => p.id === params.planId);
  if (!plan) throw new Error('Invalid promotion plan');

  try {
    // 1. Create a promotion transaction record
    const transactionRef = await addDoc(collection(db, 'transactions'), {
      type: 'promotion',
      planId: params.planId,
      listingId: params.listingId,
      buyerId: params.userId,
      sellerId: 'system', // System receives the payment
      amount: plan.price,
      status: 'pending',
      phoneNumber: params.phoneNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. Simulate M-Pesa STK Push
    console.log(`Simulating M-Pesa STK Push to ${params.phoneNumber} for KES ${plan.price}`);
    
    return transactionRef.id;
  } catch (error) {
    console.error('Error initiating promotion payment:', error);
    throw error;
  }
};

export const activatePromotion = async (transactionId: string) => {
  try {
    const txDoc = await getDoc(doc(db, 'transactions', transactionId));
    if (!txDoc.exists()) throw new Error('Transaction not found');
    
    const txData = txDoc.data();
    const plan = PROMOTION_PLANS.find(p => p.id === txData.planId);
    if (!plan) throw new Error('Plan not found');

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + plan.durationDays);

    // 1. Update listing
    await updateDoc(doc(db, 'listings', txData.listingId), {
      isPromoted: true,
      promotionTier: plan.tier,
      featuredUntil: featuredUntil.toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 2. Update transaction
    await updateDoc(doc(db, 'transactions', transactionId), {
      status: 'completed',
      updatedAt: new Date().toISOString()
    });

    // 3. Notify user
    await addDoc(collection(db, 'notifications'), {
      userId: txData.buyerId,
      title: 'Listing Promoted!',
      message: `Your listing has been successfully promoted to ${plan.name} for ${plan.durationDays} days.`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString()
    });

    toast.success(`Promotion activated: ${plan.name}`);
    return true;
  } catch (error) {
    console.error('Error activating promotion:', error);
    toast.error('Failed to activate promotion');
    return false;
  }
};
