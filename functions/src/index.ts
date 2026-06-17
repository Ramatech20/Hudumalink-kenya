import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";

// Automatically initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Define Configuration Parameters / Secrets for Pesapal Integration
const pesapalConsumerKey = defineString("PESAPAL_CONSUMER_KEY", {
  description: "Pesapal API 3.0 Client Consumer Key",
  default: ""
});
const pesapalConsumerSecret = defineString("PESAPAL_CONSUMER_SECRET", {
  description: "Pesapal API 3.0 Client Consumer Secret",
  default: "",
});
const pesapalEnvironment = defineString("PESAPAL_ENVIRONMENT", {
  description: "Pesapal environment: 'sandbox' or 'production'",
  default: "sandbox"
});
const webhookDomain = defineString("WEBHOOK_DOMAIN", {
  description: "Public domain for HTTP call/webhook triggers (e.g. https://your-region-your-project.cloudfunctions.net)",
  default: "https://us-central1-yourproject.cloudfunctions.net"
});
const callbackUrlEnv = defineString("PAYMENT_CALLBACK_URL", {
  description: "Frontend redirection URL upon completing M-Pesa authentication",
  default: "https://hudumalink.co.ke/payment-callback"
});

/**
 * Resolves Pesapal Base URL based on environment config
 */
function getPesapalBaseUrl(): string {
  const env = pesapalEnvironment.value().toLowerCase();
  return env === "production" 
    ? "https://pay.pesapal.com/v3" 
    : "https://cybspayment.pesapal.com/pesapalv3";
}

/**
 * 0. AUTHENTICATION HELPER: Obtains Pesapal OAuth 2.0 Token (Bearer)
 */
async function getPesapalBearerToken(): Promise<string> {
  const baseUrl = getPesapalBaseUrl();
  const key = pesapalConsumerKey.value();
  const secret = pesapalConsumerSecret.value();

  if (!key || !secret) {
    logger.error("Pesapal credentials are not configured in environment parameters.");
    throw new HttpsError(
      "failed-precondition", 
      "Server configuration error: Pesapal credentials missing."
    );
  }

  try {
    const authEndpoint = `${baseUrl}/api/Auth/RequestToken`;
    logger.info(`Requesting OAuth token from: ${authEndpoint}`);

    const response = await axios.post(
      authEndpoint,
      {
        consumer_key: key,
        consumer_secret: secret
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    if (response.status === 200 && response.data?.token) {
      logger.info("Successfully authenticated with Pesapal OAuth 2.0");
      return response.data.token;
    } else {
      logger.error("Unexpected token response structure from Pesapal", response.data);
      throw new Error(`Invalid response code: ${response.status}`);
    }
  } catch (error: any) {
    logger.error("Failed to authenticate with Pesapal API:", error.response?.data || error.message);
    throw new HttpsError(
      "internal",
      `Pesapal Auth Failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * IPN REGISTRATION HELPER: Fetches or Registers Instant Payment Notification ID
 */
async function getOrRegisterIpnId(token: string): Promise<string> {
  const baseUrl = getPesapalBaseUrl();
  
  // Enterprise caching pattern: Fetch already registered IPN ID from Firestore setting docs
  const settingsRef = db.doc("settings/pesapal");
  const settingsSnap = await settingsRef.get();
  
  if (settingsSnap.exists) {
    const cachedIpnId = settingsSnap.data()?.ipnId;
    if (cachedIpnId) {
      logger.info(`Reusing cached IPN Notification ID from settings collection: ${cachedIpnId}`);
      return cachedIpnId;
    }
  }

  // Register brand new Webhook IPN Listener URL
  try {
    const listenerUrl = `${webhookDomain.value()}/pesapalWebhookListener`;
    logger.info(`Registering new Pesapal IPN Hook pointing to: ${listenerUrl}`);

    const response = await axios.post(
      `${baseUrl}/api/Services/RegisterIPN`,
      {
        url: listenerUrl,
        ipn_notification_type: "GET" // Pesapal executes standard GET webhook triggers
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    if (response.status === 200 && response.data?.ipn_id) {
      const newIpnId = response.data.ipn_id;
      logger.info(`Successfully registered webhook hook. Received brand new IPN ID: ${newIpnId}`);
      
      // Save in Firestore settings cache
      await settingsRef.set({
        ipnId: newIpnId,
        registeredAt: FieldValue.serverTimestamp(),
        registeredUrl: listenerUrl
      }, { merge: true });

      return newIpnId;
    } else {
      logger.error("Failed to register IPN with Pesapal:", response.data);
      throw new Error(`IPN registration returned status ${response.status}`);
    }
  } catch (error: any) {
    logger.error("Failed to register IPN Notification in Pesapal:", error.response?.data || error.message);
    throw new HttpsError(
      "internal",
      `Pesapal IPN Registration Failed: ${error.response?.data?.message || error.message}`
    );
  }
}

/**
 * 1. initiatePesapalPayment (HTTPS Callable v2):
 * Registers payment and generates redirection URL for frontend integration
 */
export const initiatePesapalPayment = onCall(async (request) => {
  // Enforce customer is signed in
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required to initiate transactions.");
  }

  const { orderId, amount } = request.data;
  if (!orderId || !amount) {
    throw new HttpsError("invalid-argument", "Missing required orderId or amount parameter.");
  }

  // 1. Fetch transaction details from Firestore orders collection
  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError("not-found", `Order with ID ${orderId} does not exist.`);
  }

  const orderData = orderSnap.data()!;
  
  // Security review: verify requesting buyer matches authorized owner of the order payload
  if (orderData.buyerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Unauthorized attempt to pay for an order belonging to another client.");
  }

  // 2. Fetch Bearer Token from Pesapal OAuth API
  const token = await getPesapalBearerToken();

  // 3. Register or Retrieve Instant Payment Notification (IPN) id
  const ipnId = await getOrRegisterIpnId(token);

  // 4. Submit Order Request to Pesapal Gateway
  const baseUrl = getPesapalBaseUrl();
  const callbackUrl = callbackUrlEnv.value();

  const orderPayload = {
    id: orderId, // Our unique Merchant Reference ID
    currency: "KES",
    amount: parseFloat(amount),
    description: orderData.description || `HudumaLink Escrow Payment for Order #${orderId}`,
    callback_url: callbackUrl,
    notification_id: ipnId,
    billing_address: {
      email_address: orderData.buyerEmail || orderData.buyerEmailAddress || "info@hudumalink.co.ke",
      phone_number: orderData.buyerPhone || orderData.buyerPhoneNumber || "0700000000",
      country_code: "KE",
      first_name: orderData.buyerFirstName || "Buyer",
      last_name: orderData.buyerLastName || ""
    }
  };

  try {
    logger.info(`Submitting order request to Pesapal for Order #${orderId}`);
    const response = await axios.post(
      `${baseUrl}/api/Transactions/SubmitOrderRequest`,
      orderPayload,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    );

    if (response.status === 200 && response.data?.redirect_url) {
      const { order_tracking_id, redirect_url } = response.data;
      
      // Update our database state to reflect initialized Pesapal state
      await orderRef.update({
        pesapalTrackingId: order_tracking_id,
        escrow_status: "awaiting_payment",
        payment_initialized_at: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      logger.info(`Transaction successfully submitted for order ${orderId}. URL: ${redirect_url}`);

      return {
        success: true,
        orderTrackingId: order_tracking_id,
        redirectUrl: redirect_url
      };
    } else {
      logger.error("Failed response from SubmitOrderRequest:", response.data);
      throw new Error(`Pesapal submit order returned code ${response.status}`);
    }
  } catch (error: any) {
    logger.error("Exception during Pesapal SubmitOrderRequest submission:", error.response?.data || error.message);
    throw new HttpsError(
      "internal",
      `Pesapal payment setup failed: ${error.response?.data?.message || error.message}`
    );
  }
});

/**
 * 2. pesapalWebhookListener (HTTP Webhook / IPN Listener Trigger):
 * Acts as the public callback endpoint triggered on state transaction updates
 */
export const pesapalWebhookListener = onRequest(async (req, res) => {
  // Pesapal sends IPN notification triggers as standard GET queries with tracking identifiers:
  // e.g. /pesapalWebhookListener?OrderTrackingId=XXXX&OrderMerchantReference=YYYY&OrderNotificationType=ZZZZ
  const orderTrackingId = req.query.OrderTrackingId as string;
  const orderMerchantReference = req.query.OrderMerchantReference as string;
  const orderNotificationType = req.query.OrderNotificationType as string;

  logger.info("M-Pesa Pesapal Webhook endpoint triggered. Payload incoming params:", {
    orderTrackingId,
    orderMerchantReference,
    orderNotificationType
  });

  if (!orderTrackingId || !orderMerchantReference) {
    logger.warn("Payload missing required identification query strings. Denying webhook request.");
    res.status(400).send("Bad request parameters.");
    return;
  }

  try {
    // 1. Authenticate to secure a valid token
    const token = await getPesapalBearerToken();

    // 2. Poll transaction validation status from Pesapal GetTransactionStatus API
    const baseUrl = getPesapalBaseUrl();
    const queryUrl = `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
    
    logger.info(`Fetching verified transaction details directly from Pesapal status api: ${queryUrl}`);
    const statusResponse = await axios.get(queryUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    const txDetails = statusResponse.data;
    logger.info(`Pesapal transaction audit result for Merchant Ref #${orderMerchantReference}:`, txDetails);

    // According to Pesapal 3.0 specs, payment status can be verified by 'status_code' or 'payment_status_description'
    // Usually status_code === 1 indicates "COMPLETED" or success
    const isCompleted = txDetails.status_code === 1 || 
                        txDetails.payment_status_description?.toUpperCase() === "COMPLETED";

    if (isCompleted) {
      logger.info(`Transaction COMPLETED. Safe Escrow Balance state execution for project: ${orderMerchantReference}`);
      
      const orderRef = db.doc(`orders/${orderMerchantReference}`);
      const orderSnap = await orderRef.get();

      if (orderSnap.exists) {
        // Enforce secure schema transitions: Set correct escrow state & trigger escrow holding holds
        await orderRef.update({
          escrow_status: "funds_held",
          payment_status: "paid",
          pesapalConfirmationCode: txDetails.confirmation_code || "",
          paymentMethod: txDetails.payment_method || "M-Pesa",
          paidAmount: txDetails.amount || null,
          payment_received_at: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        logger.info(`Successfully processed funds lock for Order #${orderMerchantReference}. State holds active.`);
      } else {
        logger.error(`Document mismatch: Order with ID ${orderMerchantReference} referenced in billing does not exist in Firestore database.`);
      }
    } else {
      logger.warn(`Transaction for Ref #${orderMerchantReference} is currently: ${txDetails.payment_status_description || "PENDING/FAILD"}`);
    }

    // Explicitly return custom JSON response conforming to Pesapal's acknowledgement protocol
    res.status(200).json({
      ResponseCode: "200",
      Status: "Success"
    });
  } catch (error: any) {
    logger.error(`CRITICAL error attempting webhook operation matching tracking ID ${orderTrackingId}:`, error.response?.data || error.message);
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

  const { orderId } = request.data;
  if (!orderId) {
    throw new HttpsError("invalid-argument", "Missing required orderId parameter.");
  }

  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError("not-found", `Order with ID ${orderId} does not exist.`);
  }

  const orderData = orderSnap.data()!;

  // Verify caller identity as authorized service provider/seller
  const isSeller = request.auth.uid === orderData.sellerId || request.auth.uid === orderData.providerId;
  if (!isSeller) {
    throw new HttpsError("permission-denied", "Only registered Service Providers can request payment release.");
  }

  // Verify that payment exists within correct state
  if (orderData.escrow_status !== "funds_held") {
    throw new HttpsError(
      "failed-precondition", 
      "Funds must be securely locked in escrow status 'funds_held' before stating release appeals."
    );
  }

  logger.info(`Service provider requested manually auditing release on unresponsive customer order ${orderId}`);

  // Flag and queue record in Firestore for Admin panel tracking
  await orderRef.update({
    escrow_status: "release_requested",
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
  
  // Look up user profile role parameters in our secure users collection
  const userRef = db.doc(`users/${adminUid}`);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("permission-denied", "Authorized administrative security profile not found.");
  }

  const userData = userSnap.data()!;
  
  // Custom auth matching or administrator check
  const hasAdminPerm = userData.role === "admin" || request.auth.token.email === "ramadhanwambia83@gmail.com";
  if (!hasAdminPerm) {
    logger.warn(`Security ALERT: Non-admin account ${request.auth.token.email} of UID ${adminUid} attempted force-releasing funds.`);
    throw new HttpsError("permission-denied", "Access denied. Required role permissions missing.");
  }

  const { orderId } = request.data;
  if (!orderId) {
    throw new HttpsError("invalid-argument", "Missing required orderId document parameter.");
  }

  const orderRef = db.doc(`orders/${orderId}`);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError("not-found", `Order with ID ${orderId} does not exist.`);
  }

  const orderData = orderSnap.data()!;

  if (orderData.escrow_status !== "release_requested" && orderData.escrow_status !== "funds_held") {
    throw new HttpsError(
      "failed-precondition", 
      "Only active escrow balances ('funds_held' or 'release_requested') can be administratively resolved."
    );
  }

  logger.info(`Secured Admin Force-Release processed successfully by Administrator ID ${adminUid} for order ${orderId}`);

  // Manually release secure M-Pesa escrow balances directly to our claimant balances
  await orderRef.update({
    escrow_status: "released_to_provider",
    status: "released",
    admin_released_by: adminUid,
    released_at: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return {
    success: true,
    message: `Escrow payouts settled beautifully. Order status updated to released_to_provider.`
  };
});
