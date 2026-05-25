import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Initialize admin app if it has not been initialized already
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Calculates a provider's health score (0-100) based on response rate,
 * response latency, order completion rate, and dispute rate.
 */
export function calculateProviderHealthScore(
  responseRate: number,       // 0 - 100%
  avgLatencyMinutes: number,  // in minutes
  completionRate: number,     // 0 - 100%
  disputeRate: number         // 0 - 100%
): number {
  let score = 100;

  // 1. Latency penalty (Max penalty of -40)
  if (avgLatencyMinutes <= 15) {
    score -= 0;
  } else if (avgLatencyMinutes <= 60) {
    score -= 10;
  } else if (avgLatencyMinutes <= 180) {
    score -= 20;
  } else {
    score -= 40;
  }

  // 2. Response rate penalty (Max penalty of -20)
  if (responseRate < 90) {
    const penalty = Math.round((90 - responseRate) * 1);
    score -= Math.min(20, penalty);
  }

  // 3. Order Completion Rate penalty (Max penalty of -25)
  if (completionRate < 95) {
    const penalty = Math.round((95 - completionRate) * 0.5);
    score -= Math.min(25, penalty);
  }

  // 4. Dispute Rate penalty (Max penalty of -15)
  if (disputeRate > 2) {
    const penalty = Math.round((disputeRate - 2) * 2);
    score -= Math.min(15, penalty);
  }

  // Enforce rigid boundary limits (0 to 100)
  return Math.max(0, Math.min(100, score));
}

/**
 * Triggered when a new message is posted.
 * Updates rolling average of response latency and reaction metrics.
 */
export const onMessagePosted = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const messageData = snapshot.data();
  const chatId = event.params.chatId;

  // Fetch the chat metadata to know participants
  const chatRef = db.collection('chats').doc(chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) return;

  const chatData = chatSnap.data();
  if (!chatData) return;

  const participants = chatData.participants || [];
  const senderId = messageData.senderId;

  // Find the other participant who might be the provider or buyer
  const receiverId = participants.find((p: string) => p !== senderId);
  if (!receiverId) return;

  // Get the last 20 messages to calculate latency
  const messagesQuery = await db.collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  const messages = messagesQuery.docs.map(doc => doc.data()).reverse();

  // Segment latency calculations
  let latencySum = 0;
  let responseCount = 0;
  let respondedToCustomerCount = 0;
  let totalCustomerMessages = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    // If customer sent previous, and provider sent current, calculate response latency
    if (prev.senderId !== curr.senderId) {
      const prevTime = new Date(prev.createdAt).getTime();
      const currTime = new Date(curr.createdAt).getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);

      if (diffMinutes >= 0 && diffMinutes < 1440) { // filter outliers > 24 hours
        latencySum += diffMinutes;
        responseCount++;
      }
    }
  }

  // Calculate Response Rate: did receiver reply to sender's messages?
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.senderId !== receiverId) {
      totalCustomerMessages++;
      // Check if subsequent message is a reply from receiverId
      const hasReply = messages.slice(i + 1).some(m => m.senderId === receiverId);
      if (hasReply) {
        respondedToCustomerCount++;
      }
    }
  }

  const avgLatency = responseCount > 0 ? (latencySum / responseCount) : 15; // default to 15 mins
  const responseRate = totalCustomerMessages > 0 ? (respondedToCustomerCount / totalCustomerMessages) * 100 : 100;

  // We need to determine if receiverId is a Provider. If so, update their health metrics!
  const userRef = db.collection('users').doc(receiverId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const userData = userSnap.data();
  if (!userData || (userData.role !== 'provider' && userData.role !== 'seller')) return;

  // Retrieve current stats or compute with defaults
  const meta = userData.metadata || {
    healthScore: 100,
    responseLatency: 15,
    responseRate: 100,
    orderCompletionRate: 100,
    disputeRate: 0
  };

  // Perform rolling merge: update latency and response percentage
  const updatedLatency = parseFloat(((meta.responseLatency * 4 + avgLatency) / 5).toFixed(1));
  const updatedResponseRate = parseFloat(((meta.responseRate * 4 + responseRate) / 5).toFixed(1));

  const finalScore = calculateProviderHealthScore(
    updatedResponseRate,
    updatedLatency,
    meta.orderCompletionRate || 100,
    meta.disputeRate || 0
  );

  await userRef.update({
    'metadata.responseLatency': updatedLatency,
    'metadata.responseRate': updatedResponseRate,
    'metadata.healthScore': finalScore,
    updatedAt: new Date().toISOString()
  });
});

/**
 * Triggered when a Transaction document changes state.
 * Realizes actual order completion and dispute rate calculations.
 */
export const onTransactionStateUpdated = onDocumentUpdated('transactions/{transactionId}', async (event) => {
  const after = event.data?.after;
  const before = event.data?.before;
  if (!after || !before) return;

  const afterData = after.data();
  const beforeData = before.data();
  if (!afterData || !beforeData) return;

  // Run calculation only if status transitions
  if (afterData.status === beforeData.status) return;

  const providerId = afterData.sellerId;
  const providerRef = db.collection('users').doc(providerId);
  const providerSnap = await providerRef.get();
  if (!providerSnap.exists) return;

  const providerData = providerSnap.data();
  if (!providerData) return;

  // Query historical transactions for this provider to compute real rate metrics
  const txQuery = await db.collection('transactions')
    .where('sellerId', '==', providerId)
    .get();

  let completed = 0;
  let cancelled = 0;
  let disputed = 0;
  const total = txQuery.docs.length;

  txQuery.docs.forEach((doc) => {
    const tx = doc.data();
    if (tx.status === 'completed' || tx.status === 'released') {
      completed++;
    } else if (tx.status === 'cancelled') {
      cancelled++;
    } else if (tx.status === 'disputed') {
      disputed++;
    }
  });

  const divisor = completed + cancelled + disputed;
  const completionRate = divisor > 0 ? (completed / divisor) * 100 : 100;
  const disputeRate = total > 0 ? (disputed / total) * 100 : 0;

  const meta = providerData.metadata || {
    healthScore: 100,
    responseLatency: 15,
    responseRate: 100,
    orderCompletionRate: 100,
    disputeRate: 0
  };

  const finalScore = calculateProviderHealthScore(
    meta.responseRate || 100,
    meta.responseLatency || 15,
    completionRate,
    disputeRate
  );

  await providerRef.update({
    'metadata.orderCompletionRate': parseFloat(completionRate.toFixed(1)),
    'metadata.disputeRate': parseFloat(disputeRate.toFixed(1)),
    'metadata.healthScore': finalScore,
    updatedAt: new Date().toISOString()
  });
});
