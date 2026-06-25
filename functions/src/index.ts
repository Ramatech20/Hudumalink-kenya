import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";

// Automatically initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Define Configuration Parameters / Secrets for IntaSend Integration
const intasendPublicKey = defineString("INTASEND_PUBLIC_KEY", {
  description: "IntaSend Public Key",
  default: ""
});
const intasendSecretKey = defineString("INTASEND_SECRET_KEY", {
  description: "IntaSend Secret Key",
  default: "",
});
const intasendEnvironment = defineString("INTASEND_ENVIRONMENT", {
  description: "IntaSend environment: 'sandbox' or 'production'",
  default: "sandbox"
});

/**
 * Resolves IntaSend Base URL based on environment config
 */
function getIntasendBaseUrl(): string {
  const env = intasendEnvironment.value().toLowerCase();
  return env === "production" 
    ? "https://payment.intasend.com" 
    : "https://sandbox.intasend.com";
}

/**
 * Format phone to E.164 without leading plus for Safaricom M-Pesa format (e.g., 2547XXXXXXXX)
 */
function formatMpesaPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith("254") && cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

/**
 * 1. initiateIntasendStkPush (HTTPS Callable v2):
 * Registers payment and triggers an M-Pesa STK push via IntaSend
 */
export const initiateIntasendStkPushCall = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to initiate transactions.");
  }

  const { transactionId } = request.data;
  if (!transactionId) {
    throw new HttpsError("invalid-argument", "Missing required transactionId parameter.");
  }

  const txRef = db.doc(`transactions/${transactionId}`);
  const txSnap = await txRef.get();

  if (!txSnap.exists) {
    throw new HttpsError("not-found", `Transaction with ID ${transactionId} does not exist.`);
  }

  const txData = txSnap.data()!;
  
  if (txData.buyerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Unauthorized attempt to access transaction.");
  }

  const amount = txData.amount;
  const phoneNumber = formatMpesaPhoneNumber(txData.phoneNumber || txData.buyerPhone || "");

  const pubKey = intasendPublicKey.value();
  if (!pubKey) {
    throw new HttpsError("failed-precondition", "IntaSend Public Key is missing from configuration.");
  }

  try {
    const baseUrl = getIntasendBaseUrl();
    const pushUrl = `${baseUrl}/api/v1/payment/mpesa-stk-push/`;
    
    logger.info(`Sending STK push request to IntaSend: ${pushUrl} for phone ${phoneNumber}, amount ${amount}`);

    const response = await axios.post(
      pushUrl,
      {
        public_key: pubKey,
        phone_number: phoneNumber,
        amount: amount,
        api_ref: transactionId
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    const data = response.data;
    logger.info("IntaSend STK Push response:", data);

    await txRef.update({
      paymentIntentId: data.invoice?.invoice_id || null,
      status: "pending_payment",
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      data: data
    };
  } catch (error: any) {
    logger.error("IntaSend STK Push failed:", error.response?.data || error.message);
    throw new HttpsError(
      "internal",
      `IntaSend STK Push failed: ${error.response?.data?.message || error.message}`
    );
  }
});

/**
 * 2. intasendWebhookListener (HTTP Webhook IPN Listener Trigger):
 * Public webhook listener for IntaSend notifications
 */
export const intasendWebhookListener = onRequest(async (req, res) => {
  const payload = req.body;
  logger.info("Received IntaSend webhook notification payload:", JSON.stringify(payload, null, 2));

  const { invoice_id, state, api_ref, challenge } = payload;

  // Handle challenge for webhook setup check
  if (challenge) {
    res.status(200).json({ challenge });
    return;
  }

  if (!invoice_id) {
    res.status(400).send("Missing invoice_id.");
    return;
  }

  try {
    // Audit transaction state from the webhook
    const isPaid = state?.toLowerCase() === "complete" || state?.toLowerCase() === "completed";
    
    if (isPaid && api_ref) {
      logger.info(`IntaSend Webhook verifies transaction completed: ${api_ref}`);
      
      const txRef = db.doc(`transactions/${api_ref}`);
      const txSnap = await txRef.get();

      if (txSnap.exists) {
        const txData = txSnap.data()!;
        if (txData.status === "pending" || txData.status === "pending_payment") {
          await txRef.update({
            status: "paid_escrow",
            mpesaReceiptNumber: invoice_id,
            paidAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
          logger.info(`Successfully processed paid_escrow state transitions for Transaction #${api_ref}`);
        }
      } else {
        logger.error(`Transaction record ${api_ref} matching invoice ${invoice_id} could not be found.`);
      }
    }

    res.status(200).json({ status: "processed" });
  } catch (error: any) {
    logger.error("Exception handling IntaSend webhook callback:", error.message);
    res.status(500).send("Error compiling webhook logs.");
  }
});

/**
 * 3. requestPaymentRelease (HTTPS Callable v2):
 * Allows Service Providers to claim outstanding payments when customers maintain high non-responsiveness
 */
export const requestPaymentRelease = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const { transactionId } = request.data;
  if (!transactionId) {
    throw new HttpsError("invalid-argument", "Missing required transactionId parameter.");
  }

  const txRef = db.doc(`transactions/${transactionId}`);
  const txSnap = await txRef.get();

  if (!txSnap.exists) {
    throw new HttpsError("not-found", `Transaction with ID ${transactionId} does not exist.`);
  }

  const txData = txSnap.data()!;

  const isSeller = request.auth.uid === txData.sellerId || request.auth.uid === txData.providerId;
  if (!isSeller) {
    throw new HttpsError("permission-denied", "Only registered Service Providers can request payment release.");
  }

  if (txData.status !== "paid_escrow") {
    throw new HttpsError(
      "failed-precondition", 
      "Funds must be securely locked in escrow status 'paid_escrow' before stating release appeals."
    );
  }

  logger.info(`Service provider requested manually auditing release on unresponsive customer transaction ${transactionId}`);

  await txRef.update({
    status: "pending_release",
    release_requested_at: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return {
    success: true,
    message: "Release request raised successfully. Administration is auditing delivery channels."
  };
});

/**
 * 4. adminForceRelease (HTTPS Callable v2):
 * Secure admin override endpoint for complete offline M-Pesa balance payouts
 */
export const adminForceRelease = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const adminUid = request.auth.uid;
  const userRef = db.doc(`users/${adminUid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("permission-denied", "Authorized administrative security profile not found.");
  }

  const userData = userSnap.data()!;
  const hasAdminPerm = userData.role === "admin" || request.auth.token.email === "ramadhanwambia83@gmail.com";
  
  if (!hasAdminPerm) {
    logger.warn(`Security ALERT: Non-admin account ${request.auth.token.email} attempted force-releasing funds.`);
    throw new HttpsError("permission-denied", "Access denied. Required role permissions missing.");
  }

  const { transactionId } = request.data;
  if (!transactionId) {
    throw new HttpsError("invalid-argument", "Missing required transactionId document parameter.");
  }

  const txRef = db.doc(`transactions/${transactionId}`);
  const txSnap = await txRef.get();

  if (!txSnap.exists) {
    throw new HttpsError("not-found", `Transaction with ID ${transactionId} does not exist.`);
  }

  const txData = txSnap.data()!;

  if (txData.status !== "pending_release" && txData.status !== "paid_escrow") {
    throw new HttpsError(
      "failed-precondition", 
      "Only active escrow balances can be administratively resolved."
    );
  }

  logger.info(`Secured Admin Force-Release processed successfully by Administrator ID ${adminUid} for transaction ${transactionId}`);

  await txRef.update({
    status: "completed",
    admin_released_by: adminUid,
    releasedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return {
    success: true,
    message: `Escrow payouts settled successfully. Transaction status updated to completed.`
  };
});
