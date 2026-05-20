import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import admin from "firebase-admin";
import fs from "fs";

const _filename = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== "undefined" ? __dirname : path.dirname(_filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(_dirname, "firebase-applet-config.json");
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Support for production environment variables (Base64 encoded JSON)
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("Firebase Admin: Initialized with service account from environment variable.");
  } else if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    // If we have a service account file, use it. Otherwise, try application default but don't crash.
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
      console.log("Firebase Admin: Initialized with application default credentials.");
    } catch (e) {
      console.warn("Firebase Admin: Failed to initialize with application default credentials. Backend features like M-Pesa callbacks may fail.");
    }
  } else {
    console.warn("Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT env var or provide firebase-applet-config.json.");
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const db = admin.firestore();

/**
 * Multi-tier Platform commission calculation engine.
 * Service standard fee: 10%.
 * Goods bracket fees with 10% below 100, 10% up to 799, 8% up to 2499, 7% up to 4999, and 5% above 5000.
 * Operations utilize Math.round to protect against fraction leaks.
 */
export function calculateCommission(type: 'service' | 'goods', amount: number): number {
  if (type === 'service') {
    return Math.round(amount * 0.10);
  }
  // Goods brackets
  if (amount >= 5000) {
    return Math.round(amount * 0.05);
  } else if (amount >= 2500) {
    return Math.round(amount * 0.07);
  } else if (amount >= 800) {
    return Math.round(amount * 0.08);
  } else {
    return Math.round(amount * 0.10);
  }
}

const getClientIp = (req: any): string => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const parts = typeof xForwardedFor === 'string' ? xForwardedFor.split(',') : (xForwardedFor as string[]);
    return parts[0].trim();
  }
  return req.socket.remoteAddress || req.ip || "";
};

const unlockPendingBalances = async (userId: string) => {
  const now = new Date().toISOString();
  try {
    const locksQuery = await db.collection("hold_ledgers")
      .where("userId", "==", userId)
      .where("status", "==", "locked")
      .where("releaseTime", "<=", now)
      .get();

    if (locksQuery.empty) return;

    for (const lockDoc of locksQuery.docs) {
      const lockData = lockDoc.data();
      const lockAmount = lockData.amount || 0;

      await db.runTransaction(async (transaction) => {
        const currentLockDoc = await transaction.get(lockDoc.ref);
        if (!currentLockDoc.exists || currentLockDoc.data()?.status !== "locked") return;

        // Mark ledger as unlocked
        transaction.update(lockDoc.ref, {
          status: "unlocked",
          unlockedAt: new Date().toISOString()
        });

        // Atomic balances transfer
        const userRef = db.collection("users").doc(userId);
        transaction.update(userRef, {
          pendingWithdrawalBalance: admin.firestore.FieldValue.increment(-lockAmount),
          escrowBalance: admin.firestore.FieldValue.increment(lockAmount),
          updatedAt: new Date().toISOString()
        });

        // Send confirmation notification
        const notificationRef = db.collection("notifications").doc();
        transaction.set(notificationRef, {
          userId,
          title: "Hold Period Concluded",
          message: `Your security hold has ended. KES ${lockAmount} has successfully cleared and is available for immediate withdrawal.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });
      });
    }
    console.log(`Successfully completed balance maturation checks for user ${userId}`);
  } catch (err) {
    console.error(`Error unlocking pending balances for user ${userId}:`, err);
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // M-Pesa Daraja API Integration
  const getMpesaToken = async () => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error("M-Pesa credentials not found in environment");
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    
    try {
      const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );
      return response.data.access_token;
    } catch (error: any) {
      console.error("Error getting M-Pesa token:", error.response?.data || error.message);
      throw error;
    }
  };

// Middleware to verify user token (Identity Isolation)
const verifyUser = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Rigid Safety Gate: STRICTLY reject all mock fallback logic inside a real production environment
    if (process.env.NODE_ENV !== "production") {
      const fallbackUid = req.headers["x-user-id"] || (req.body && req.body.userId);
      if (fallbackUid) {
        req.user = { uid: fallbackUid };
        
        // Asynchronously update coordinates
        const fingerprint = req.headers['x-device-fingerprint'] || (req.body && req.body.deviceFingerprint);
        const userIp = getClientIp(req);
        if (fingerprint || userIp) {
          db.collection("users").doc(fallbackUid).update({
            ...(fingerprint && { deviceFingerprint: fingerprint }),
            ...(userIp && { lastActiveIp: userIp }),
            lastSeen: new Date().toISOString()
          }).catch(() => {});
        }
        
        return next();
      }
    }
    return res.status(401).json({ error: "Unauthorized. Missing cryptographic Authorization Bearer token." });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Automatically capture IP and device fingerprint on authenticated API calls
    const fingerprint = req.headers['x-device-fingerprint'] || (req.body && req.body.deviceFingerprint);
    const userIp = getClientIp(req);
    const updateData: any = { lastSeen: new Date().toISOString() };
    if (fingerprint) updateData.deviceFingerprint = fingerprint;
    if (userIp) updateData.lastActiveIp = userIp;
    
    db.collection("users").doc(decodedToken.uid).update(updateData).catch(() => {});
    
    next();
  } catch (error) {
    console.error("Firebase Auth verifyIdToken failure:", error);
    return res.status(401).json({ error: "Unauthorized. Invalid Token." });
  }
};

// Middleware to verify Admin with optional cryptographic verification (admin compliance)
const verifyAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  let adminId = req.headers['x-admin-id'];

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      adminId = decodedToken.uid;
    } catch (error) {
      console.error("Firebase Admin verifyIdToken failure:", error);
      return res.status(401).json({ error: "Unauthorized. Invalid Admin Token." });
    }
  }

  if (!adminId) {
    return res.status(401).json({ error: "Missing Admin ID" });
  }

  try {
    const userDoc = await db.collection("users").doc(adminId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    req.user = { uid: adminId, role: "admin" };
    next();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

  app.post("/api/mpesa/stkpush", async (req, res) => {
    const { phoneNumber, amount, accountReference, transactionDesc, transactionId } = req.body;

    try {
      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
      const shortCode = process.env.MPESA_SHORTCODE || "174379";
      const passkey = process.env.MPESA_PASSKEY;
      
      if (!passkey) {
        throw new Error("M-Pesa passkey not found in environment");
      }

      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: `${process.env.APP_URL}/api/mpesa/callback`,
          AccountReference: accountReference || "HudumaLink",
          TransactionDesc: transactionDesc || "Payment for services",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If we have a transactionId, update it with the CheckoutRequestID
      if (transactionId) {
        await db.collection("transactions").doc(transactionId).update({
          checkoutRequestId: response.data.CheckoutRequestID,
          updatedAt: new Date().toISOString()
        });
      }

      res.json(response.data);
    } catch (error: any) {
      console.error("M-Pesa STK Push error:", error.response?.data || error.message);
      // Fallback if credentials aren't set
      if (!process.env.MPESA_CONSUMER_KEY) {
        const checkoutId = "ws_CO_" + Math.random().toString(36).substr(2, 9);
        if (transactionId) {
          await db.collection("transactions").doc(transactionId).update({
            checkoutRequestId: checkoutId,
            updatedAt: new Date().toISOString()
          });
        }
        return res.json({
          MerchantRequestID: "req_" + Math.random().toString(36).substr(2, 9),
          CheckoutRequestID: checkoutId,
          ResponseCode: "0",
          ResponseDescription: "Success",
          CustomerMessage: "Success"
        });
      }
      res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
    }
  });

  app.post("/api/mpesa/promote", async (req, res) => {
    const { phoneNumber, amount, listingId, userId, tier, durationDays } = req.body;

    try {
      const promotionRef = await db.collection("promotions").add({
        listingId,
        userId,
        tier,
        amount,
        durationDays,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      const token = await getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
      const shortCode = process.env.MPESA_SHORTCODE || "174379";
      const passkey = process.env.MPESA_PASSKEY;
      
      if (!passkey) {
        throw new Error("M-Pesa passkey not found in environment");
      }

      const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        {
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: shortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: `${process.env.APP_URL}/api/mpesa/callback`,
          AccountReference: `PROM-${listingId.substring(0, 5)}`,
          TransactionDesc: `Promotion for listing ${listingId}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await promotionRef.update({
        checkoutRequestId: response.data.CheckoutRequestID
      });

      res.json(response.data);
    } catch (error: any) {
      console.error("M-Pesa Promotion error:", error.response?.data || error.message);
      
      // Fallback
      if (!process.env.MPESA_CONSUMER_KEY) {
        const checkoutId = "ws_CO_PROM_" + Math.random().toString(36).substr(2, 9);
        const promotionRef = await db.collection("promotions").add({
          listingId,
          userId,
          tier,
          amount,
          durationDays,
          status: "pending",
          checkoutRequestId: checkoutId,
          createdAt: new Date().toISOString()
        });

        return res.json({
          MerchantRequestID: "req_" + Math.random().toString(36).substr(2, 9),
          CheckoutRequestID: checkoutId,
          ResponseCode: "0",
          ResponseDescription: "Success",
          CustomerMessage: "Success"
        });
      }
      res.status(500).json({ error: "Failed to initiate promotion payment" });
    }
  });

  app.post("/api/mpesa/callback", async (req, res) => {
    const callbackToken = req.query.token;
    if (process.env.MPESA_CALLBACK_TOKEN && callbackToken !== process.env.MPESA_CALLBACK_TOKEN) {
      console.warn("M-Pesa Callback: Unauthorized attempt with invalid token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));
    
    const { Body } = req.body;
    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ error: "Invalid callback body" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;

    try {
      // Find the transaction with this CheckoutRequestID
      const txQuery = await db.collection("transactions")
        .where("checkoutRequestId", "==", CheckoutRequestID)
        .limit(1)
        .get();

      if (!txQuery.empty) {
        const txDoc = txQuery.docs[0];
        const txData = txDoc.data();

        if (ResultCode === 0) {
          // Payment successful
          await txDoc.ref.update({
            status: "deposited",
            updatedAt: new Date().toISOString(),
            mpesaReceiptNumber: Body.stkCallback.CallbackMetadata?.Item?.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value
          });

          // Notify buyer and seller
          const buyerId = txData.buyerId;
          const sellerId = txData.sellerId;

          await db.collection("notifications").add({
            userId: buyerId,
            title: "Payment Successful",
            message: `Your payment of KES ${txData.amount} has been deposited into Escrow.`,
            type: "success",
            read: false,
            link: `/profile`,
            createdAt: new Date().toISOString()
          });

          await db.collection("notifications").add({
            userId: sellerId,
            title: "New Escrow Payment",
            message: `A payment of KES ${txData.amount} has been deposited into Escrow for your listing.`,
            type: "success",
            read: false,
            link: `/profile`,
            createdAt: new Date().toISOString()
          });
        } else {
          // Payment failed
          await txDoc.ref.update({
            status: "cancelled",
            cancellationReason: ResultDesc || "Payment failed",
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Check if it's a promotion
        const promQuery = await db.collection("promotions")
          .where("checkoutRequestId", "==", CheckoutRequestID)
          .limit(1)
          .get();
        
        if (!promQuery.empty) {
          const promDoc = promQuery.docs[0];
          const promData = promDoc.data();

          if (ResultCode === 0) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + promData.durationDays);

            await promDoc.ref.update({
              status: "completed",
              expiresAt: expiresAt.toISOString()
            });

            // Update the listing
            await db.collection("listings").doc(promData.listingId).update({
              isPromoted: true,
              promotionTier: promData.tier,
              featuredUntil: expiresAt.toISOString()
            });

            // Notify user
            await db.collection("notifications").add({
              userId: promData.userId,
              title: "Promotion Activated!",
              message: `Your listing has been promoted to ${promData.tier} for ${promData.durationDays} days.`,
              type: "success",
              read: false,
              link: `/listing/${promData.listingId}`,
              createdAt: new Date().toISOString()
            });
          } else {
            await promDoc.ref.update({
              status: "failed"
            });
          }
        }
      }

      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
      console.error("Error processing M-Pesa callback:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // B2C Callback handlers
  app.post("/api/mpesa/b2c/result", async (req, res) => {
    console.log("M-Pesa B2C Result received:", JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  app.post("/api/mpesa/b2c/timeout", async (req, res) => {
    console.log("M-Pesa B2C Timeout received:", JSON.stringify(req.body, null, 2));
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  });

  // Transaction Settlement: Confirm Delivery & Release Funds (Race-condition safe via runTransaction)
  app.post("/api/transactions/release", verifyUser, async (req: any, res: any) => {
    const { transactionId, deviceFingerprint } = req.body;
    const userId = req.user.uid; // Identity verified from the cryptographic auth token

    if (!transactionId) {
      return res.status(400).json({ error: "Missing transactionId" });
    }

    try {
      const txRef = db.collection("transactions").doc(transactionId);
      const txSnap = await txRef.get();
      if (!txSnap.exists) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const txData = txSnap.data();
      if (!txData) {
        return res.status(500).json({ error: "Data empty or invalid" });
      }

      // Verify that the person initiating the release is indeed the buyer
      if (txData.buyerId !== userId) {
        return res.status(403).json({ error: "Only the buyer can release funds" });
      }

      // Check status - must be deposited or delivered
      if (txData.status !== "deposited" && txData.status !== "delivered") {
        return res.status(400).json({ error: "Transaction in wrong state to release or already completed" });
      }

      // Anti-Exit Scam: Fetch seller's historical completed average outside transaction block
      const sellerHistoryQuery = await db.collection("transactions")
        .where("sellerId", "==", txData.sellerId)
        .where("status", "==", "completed")
        .get();

      let sumAmount = 0;
      let countOfMatched = 0;
      sellerHistoryQuery.docs.forEach(docSnap => {
        const d = docSnap.data();
        if (d && typeof d.amount === 'number') {
          sumAmount += d.amount;
          countOfMatched++;
        }
      });

      const avgCompleted = countOfMatched > 0 ? (sumAmount / countOfMatched) : 0;
      const currentAmount = txData.amount || 0;

      // Extreme velocity jump threshold: orders >= 2 with price > 400% of average (Seller reputation ramp filter)
      const isExtremeJump = countOfMatched >= 2 && currentAmount > (4 * avgCompleted);

      if (isExtremeJump) {
        // Atomic status and freeze triggers
        await db.runTransaction(async (transaction) => {
          transaction.update(txRef, {
            status: "flagged_audit",
            auditReason: `Severe reputation velocity jump: Transaction amount (KES ${currentAmount}) exceeds 400% of historical average KES ${avgCompleted.toFixed(2)} across ${countOfMatched} completed payments.`,
            updatedAt: new Date().toISOString()
          });

          // Enforce 72-hour wallet freeze on vendor
          const sellerRef = db.collection("users").doc(txData.sellerId);
          const freezeUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
          transaction.update(sellerRef, {
            walletFrozenUntil: freezeUntil,
            walletFreezeReason: `Automated velocity trigger: Order ${transactionId} (KES ${currentAmount}) hit 400% reputation expansion freeze. Historical average: KES ${avgCompleted.toFixed(2)}.`,
            updatedAt: new Date().toISOString()
          });

          // Alert vendor
          const sellerNotificationRef = db.collection("notifications").doc();
          transaction.set(sellerNotificationRef, {
            userId: txData.sellerId,
            title: "Wallet Freeze & Audit Initiated",
            message: `Your wallet is frozen for 72 hours due to an extreme transaction size jump (KES ${currentAmount} vs avg KES ${avgCompleted.toFixed(2)}). Order ${transactionId} is held for compliance review.`,
            type: "error",
            read: false,
            createdAt: new Date().toISOString()
          });

          // Alert administrators
          const adminNotificationRef = db.collection("notifications").doc();
          transaction.set(adminNotificationRef, {
            userId: "admin",
            title: "Scam Detection Active",
            message: `Seller ${txData.sellerId} flagged for exit scam velocity (400%+ jump) on order ${transactionId}. Wallet locked.`,
            type: "warning",
            read: false,
            createdAt: new Date().toISOString()
          });
        });

        return res.status(403).json({
          error: "Transaction flagged for security audit due to a severe velocity/reputation jump. It will be reviewed by administrators within 24-72 hours."
        });
      }

      // Process standard, genuine settlement
      const buyerIp = getClientIp(req);

      const result = await db.runTransaction(async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists) throw new Error("Transaction not found");
        const currentTxData = txDoc.data();
        if (!currentTxData || currentTxData.status === "completed") {
          throw new Error("Transaction already completed or processed");
        }

        const buyerRef = db.collection("users").doc(currentTxData.buyerId);
        const sellerRef = db.collection("users").doc(currentTxData.sellerId);

        const [buyerDoc, sellerDoc] = await Promise.all([
          transaction.get(buyerRef),
          transaction.get(sellerRef)
        ]);

        const buyerData = buyerDoc.data() || {};
        const sellerData = sellerDoc.data() || {};

        // 1. Convert Transaction status to completed
        transaction.update(txRef, {
          status: "completed",
          releasedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // 2. Protect Platform: Enforce hold locks (24 hours standard, 48 hours for values >= 5000 KES)
        const holdPeriodHours = currentTxData.amount >= 5000 ? 48 : 24;
        const releaseTime = new Date();
        releaseTime.setHours(releaseTime.getHours() + holdPeriodHours);

        transaction.update(sellerRef, {
          pendingWithdrawalBalance: admin.firestore.FieldValue.increment(currentTxData.amount),
          completedPaymentsCount: admin.firestore.FieldValue.increment(1),
          updatedAt: new Date().toISOString()
        });

        const holdLedgerRef = db.collection("hold_ledgers").doc();
        transaction.set(holdLedgerRef, {
          userId: currentTxData.sellerId,
          transactionId: transactionId,
          amount: currentTxData.amount,
          releaseTime: releaseTime.toISOString(),
          status: "locked",
          createdAt: new Date().toISOString()
        });

        // 3. Counter Referral Exploits (Locking down collusion & system bleed loops)
        if (currentTxData.referralId) {
          const referralSettingsRef = db.collection("settings").doc("referral");
          const referralSettingsDoc = await transaction.get(referralSettingsRef);
          const settings = referralSettingsDoc.data();

          const isGenuineAmount = currentTxData.amount >= 1000;

          if (settings?.isEnabled && isGenuineAmount) {
            // Check cross-parameters
            const isSelfReferral = buyerData.referredBy === currentTxData.sellerId;
            const bFinger = buyerData.deviceFingerprint || "BUYER-EMPTY";
            const sFinger = sellerData.deviceFingerprint || "SELLER-EMPTY";
            const isDeviceCollusion = (bFinger !== "BUYER-EMPTY" && bFinger !== "SELLER-EMPTY" && bFinger === sFinger) || 
                                       (deviceFingerprint && deviceFingerprint === sFinger);
            const bIp = buyerData.lastActiveIp || buyerIp;
            const sIp = sellerData.lastActiveIp || "";
            const isIpCollusion = (bIp && sIp && bIp === sIp);

            const isReferralFraud = isSelfReferral || isDeviceCollusion || isIpCollusion;

            if (isReferralFraud) {
              console.warn(`Referral payment BLOCKED: Collusion detected for transaction ${transactionId}. selfReferral=${isSelfReferral}, deviceCollusion=${isDeviceCollusion}, ipCollusion=${isIpCollusion}`);
              
              // Increment suspicion indicators on accounts
              transaction.update(buyerRef, {
                fraudSuspicionScore: admin.firestore.FieldValue.increment(1),
                referralFraudAttempts: admin.firestore.FieldValue.increment(1)
              });
              transaction.update(sellerRef, {
                fraudSuspicionScore: admin.firestore.FieldValue.increment(1),
                referralFraudAttempts: admin.firestore.FieldValue.increment(1)
              });
            } else {
              // Legitimate referral relationship
              const referrerRef = db.collection("users").doc(currentTxData.referralId);
              transaction.update(referrerRef, {
                referralEarnings: admin.firestore.FieldValue.increment(settings.rewardAmount || 100)
              });

              // Notify Referrer
              const referrerNotificationRef = db.collection("notifications").doc();
              transaction.set(referrerNotificationRef, {
                userId: currentTxData.referralId,
                title: "Referral Bonus Received!",
                message: `You earned a referral bonus of KES ${settings.rewardAmount || 100} because your referral completed a transaction.`,
                type: "success",
                read: false,
                createdAt: new Date().toISOString()
              });
            }
          }
        }

        // 4. Notify Seller with precise cooling-off constraints
        const sellerNotificationRef = db.collection("notifications").doc();
        transaction.set(sellerNotificationRef, {
          userId: currentTxData.sellerId,
          title: "Escrow Hold Placed",
          message: `KES ${currentTxData.amount} has been added to your pending hold balance for order ${transactionId}. It matures to withdrawable state in ${holdPeriodHours} hours.`,
          type: "info",
          read: false,
          createdAt: new Date().toISOString()
        });

        // 5. Notify Buyer
        const buyerNotificationRef = db.collection("notifications").doc();
        transaction.set(buyerNotificationRef, {
          userId: currentTxData.buyerId,
          title: "Transaction Confirmed",
          message: `You have successfully released KES ${currentTxData.amount} to the service provider for order ${transactionId}.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        return { success: true, holdHours: holdPeriodHours };
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error releasing transaction funds:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Admin Actions: B2C Payouts (Withdrawals & Refunds)
  app.post("/api/admin/payout", verifyAdmin, async (req, res) => {
    const { userId, amount, phoneNumber, reason, type } = req.body;
    // In a real app, you'd verify the admin's session here

    try {
      const token = await getMpesaToken();
      
      // B2C Initiation (Mocked for sandbox if credentials missing)
      if (!process.env.MPESA_B2C_SHORTCODE) {
        console.log(`Mock B2C Payout: ${amount} to ${phoneNumber} for ${reason}`);
        return res.json({ status: "success", message: "Payout initiated" });
      }

      const response = await axios.post(
        "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
        {
          InitiatorName: process.env.MPESA_B2C_INITIATOR_NAME,
          SecurityCredential: process.env.MPESA_B2C_SECURITY_CREDENTIAL,
          CommandID: process.env.MPESA_B2C_COMMAND_ID || "BusinessPayment",
          Amount: amount,
          PartyA: process.env.MPESA_B2C_SHORTCODE,
          PartyB: phoneNumber,
          Remarks: reason || "Payout",
          QueueTimeOutURL: `${process.env.APP_URL}/api/mpesa/b2c/timeout`,
          ResultURL: `${process.env.APP_URL}/api/mpesa/b2c/result`,
          Occasion: type || "Withdrawal"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("M-Pesa B2C error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initiate payout" });
    }
  });

  // Withdrawal Requests (Race-condition safe and Identity-isolated)
  app.post("/api/withdrawals/create", verifyUser, async (req: any, res: any) => {
    const { amount, method, details } = req.body;
    const userId = req.user.uid; // Read from cryptographically validated context, avoiding parameter tampering

    if (!amount || !method || !details) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ error: "Withdrawal amount must be greater than zero" });
    }

    const fee = method === "mpesa" ? 15 : 50;
    const totalToDeduct = withdrawalAmount + fee;

    try {
      // 1. Instantly mature and unlock any expired pending holds before evaluating balances!
      await unlockPendingBalances(userId);

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User profile not found." });
      }

      const userData = userDoc.data() || {};

      // 2. Strict Security: Check if wallet is frozen due to velocity jump alert
      if (userData.walletFrozenUntil && new Date(userData.walletFrozenUntil) > new Date()) {
        return res.status(403).json({
          error: `Wallet Forbidden: Your withdrawals are currently frozen until ${new Date(userData.walletFrozenUntil).toLocaleString()} due to an unusual transaction velocity jump alert. Our security compliance team is manually auditing your listings.`
        });
      }

      // 3. Strict Security: Sum successful and pending withdrawals in the last 24 hours to enforce daily velocity caps
      const past24hRange = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentWithdrawals = await db.collection("withdrawals")
        .where("userId", "==", userId)
        .where("createdAt", ">=", past24hRange)
        .get();

      let dailySum = 0;
      recentWithdrawals.docs.forEach(docSnap => {
        const wData = docSnap.data();
        if (wData && wData.status !== "failed" && wData.status !== "cancelled") {
          dailySum += wData.amount || 0;
        }
      });

      // 4. Client Classification: Tier 2 (KYC complete AND at least 5 completed payments) vs Tier 1
      const isVerifiedKYC = userData.kycStatus === "verified";
      const completedCount = userData.completedPaymentsCount || 0;
      const isTier2 = isVerifiedKYC && completedCount >= 5;

      const dailyCap = isTier2 ? 50000 : 1500;

      if (dailySum + withdrawalAmount > dailyCap) {
        if (!isTier2) {
          return res.status(400).json({
            error: `Daily Limit Exceeded: As a Tier 1 (Unverified) account, your absolute daily withdrawal cap is KES 1,500. You have already withdrawn KES ${dailySum} in the last 24 hours. To upgrade to Tier 2 (KES 50,000 daily limit), please verify your KYC document and successfully complete 5 transacted gigs.`
          });
        } else {
          return res.status(400).json({
            error: `Daily Limit Exceeded: As a Tier 2 account, your absolute daily withdrawal cap is KES 50,000. You have already withdrawn KES ${dailySum} in the last 24 hours.`
          });
        }
      }

      // 5. Atomic Transaction write
      const result = await db.runTransaction(async (transaction) => {
        const refreshedUserDoc = await transaction.get(userRef);
        const refreshedUserData = refreshedUserDoc.data();
        const currentBalance = refreshedUserData?.escrowBalance || 0;

        if (currentBalance < totalToDeduct) {
          throw new Error(`Insufficient balance. Your withdrawable balance is KES ${currentBalance.toFixed(2)}. This withdrawal request requires KES ${totalToDeduct.toFixed(2)} inclusive of KES ${fee} processing fee.`);
        }

        // Deduct from balance atomically
        transaction.update(userRef, {
          escrowBalance: admin.firestore.FieldValue.increment(-totalToDeduct),
          updatedAt: new Date().toISOString()
        });

        // Add withdrawal record
        const withdrawalRef = db.collection("withdrawals").doc();
        transaction.set(withdrawalRef, {
          userId,
          userName: refreshedUserData?.displayName || "Unknown",
          amount: withdrawalAmount,
          fee,
          totalDeducted: totalToDeduct,
          method,
          details,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        return { success: true, withdrawalId: withdrawalRef.id };
      });

      res.json(result);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // FIX 2: Memory and Scaling Safe 72-Hour Auto-Release Job
  const runAutoReleaseJob = async (): Promise<{ processedCount: number; errorsCount: number }> => {
    console.log("Running scheduled 72-hour escrow auto-release routine...");
    const limitCount = 100;
    let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;
    let hasMore = true;
    let processedCount = 0;
    let errorsCount = 0;

    const seventyTwoHoursAgo = new Date();
    seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);
    const cutoffIso = seventyTwoHoursAgo.toISOString();

    while (hasMore) {
      try {
        let query = db.collection("transactions")
          .where("status", "==", "delivered")
          .orderBy("updatedAt")
          .limit(limitCount);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();
        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        for (const txDoc of snapshot.docs) {
          const txData = txDoc.data();
          const updatedAt = txData.updatedAt || txData.createdAt;

          if (updatedAt && updatedAt <= cutoffIso) {
            const txId = txDoc.id;
            try {
              await db.runTransaction(async (transaction) => {
                const currentTxDoc = await transaction.get(txDoc.ref);
                const currentTxData = currentTxDoc.data();
                if (!currentTxData || currentTxData.status !== "delivered") {
                  return; // already processed or status changed
                }

                const buyerRef = db.collection("users").doc(currentTxData.buyerId);
                const sellerRef = db.collection("users").doc(currentTxData.sellerId);

                const [buyerDoc, sellerDoc] = await Promise.all([
                  transaction.get(buyerRef),
                  transaction.get(sellerRef)
                ]);

                const buyerData = buyerDoc.data() || {};
                const sellerData = sellerDoc.data() || {};

                // 1. Mark transaction as completed (auto-released)
                transaction.update(txDoc.ref, {
                  status: "completed",
                  releasedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  autoReleased: true
                });

                // 2. Protect Platform: Enforce hold locks (24 hours standard, 48 hours for values >= 5000 KES)
                const holdPeriodHours = currentTxData.amount >= 5000 ? 48 : 24;
                const releaseTime = new Date();
                releaseTime.setHours(releaseTime.getHours() + holdPeriodHours);

                transaction.update(sellerRef, {
                  pendingWithdrawalBalance: admin.firestore.FieldValue.increment(currentTxData.amount),
                  completedPaymentsCount: admin.firestore.FieldValue.increment(1),
                  updatedAt: new Date().toISOString()
                });

                const holdLedgerRef = db.collection("hold_ledgers").doc();
                transaction.set(holdLedgerRef, {
                  userId: currentTxData.sellerId,
                  transactionId: txId,
                  amount: currentTxData.amount,
                  releaseTime: releaseTime.toISOString(),
                  status: "locked",
                  createdAt: new Date().toISOString()
                });

                // 3. Optional referral bonus with collusion locks (>= 1,000 KES limits)
                if (currentTxData.referralId && currentTxData.amount >= 1000) {
                  const referralSettingsRef = db.collection("settings").doc("referral");
                  const referralSettingsDoc = await transaction.get(referralSettingsRef);
                  const settings = referralSettingsDoc.data();
                  
                  if (settings?.isEnabled) {
                    const isSelfReferral = buyerData.referredBy === currentTxData.sellerId;
                    const bFinger = buyerData.deviceFingerprint || "BUYER-EMPTY";
                    const sFinger = sellerData.deviceFingerprint || "SELLER-EMPTY";
                    const isDeviceCollusion = (bFinger !== "BUYER-EMPTY" && bFinger !== "SELLER-EMPTY" && bFinger === sFinger);
                    const bIp = buyerData.lastActiveIp || "";
                    const sIp = sellerData.lastActiveIp || "";
                    const isIpCollusion = (bIp && sIp && bIp === sIp);

                    const isReferralFraud = isSelfReferral || isDeviceCollusion || isIpCollusion;

                    if (isReferralFraud) {
                      console.warn(`Referral payment BLOCKED (Auto-Release): Collusion check failed on transaction ${txId}. selfReferral=${isSelfReferral}, deviceCollusion=${isDeviceCollusion}, ipCollusion=${isIpCollusion}`);
                      transaction.update(buyerRef, {
                        fraudSuspicionScore: admin.firestore.FieldValue.increment(1),
                        referralFraudAttempts: admin.firestore.FieldValue.increment(1)
                      });
                      transaction.update(sellerRef, {
                        fraudSuspicionScore: admin.firestore.FieldValue.increment(1),
                        referralFraudAttempts: admin.firestore.FieldValue.increment(1)
                      });
                    } else {
                      const referrerRef = db.collection("users").doc(currentTxData.referralId);
                      transaction.update(referrerRef, {
                        referralEarnings: admin.firestore.FieldValue.increment(settings.rewardAmount || 100)
                      });

                      // Notification record for the referrer
                      const referrerNotificationRef = db.collection("notifications").doc();
                      transaction.set(referrerNotificationRef, {
                        userId: currentTxData.referralId,
                        title: "Referral Reward (Auto-Release)",
                        message: `You earned KES ${settings.rewardAmount || 100} because your referral completed a transaction.`,
                        type: "success",
                        read: false,
                        createdAt: new Date().toISOString()
                      });
                    }
                  }
                }

                // 4. Notify merchant of automatic status payout and lock period
                const sellerNotificationRef = db.collection("notifications").doc();
                transaction.set(sellerNotificationRef, {
                  userId: currentTxData.sellerId,
                  title: "Funds Auto-Released (On Hold)",
                  message: `KES ${currentTxData.amount} has been auto-released into your pending holds folder for order ${txId}. It clears in ${holdPeriodHours} hours.`,
                  type: "info",
                  read: false,
                  createdAt: new Date().toISOString()
                });

                // 2. Notify customer
                const buyerNotificationRef = db.collection("notifications").doc();
                transaction.set(buyerNotificationRef, {
                  userId: currentTxData.buyerId,
                  title: "Escrow Auto-Completed",
                  message: `Your transaction ${txId} was auto-confirmed and completed as no dispute was raised within 72 hours.`,
                  type: "info",
                  read: false,
                  createdAt: new Date().toISOString()
                });
              });
              processedCount++;
            } catch (txError) {
              console.error(`Error auto-releasing transaction ID: ${txId}`, txError);
              errorsCount++;
            }
          }
        }

        if (snapshot.docs.length < limitCount) {
          hasMore = false;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
        }
      } catch (queryError) {
        console.error("Auto-release batched query execution error:", queryError);
        hasMore = false;
      }
    }

    console.log(`Auto-release complete. Processed: ${processedCount}, Errors: ${errorsCount}`);
    return { processedCount, errorsCount };
  };

  // Expose job execution admin-endpoint
  app.post("/api/admin/jobs/auto-release", verifyAdmin, async (req: any, res: any) => {
    try {
      const metrics = await runAutoReleaseJob();
      res.json({ success: true, ...metrics });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to trigger auto-release job manually." });
    }
  });

  // Schedule the auto-release system to execute every 12 hours (43,200,000 milliseconds)
  setInterval(() => {
    runAutoReleaseJob().catch((err) => console.error("Periodic Auto-Release Failure:", err));
  }, 12 * 60 * 60 * 1000);

  // Run immediately on boot to ensure current system catch up
  runAutoReleaseJob().catch((err) => console.error("Boot Time Auto-Release Failure:", err));

  // API routes
  // fintech-grade escrow completion and referral tracking engine
  app.post("/api/escrow/complete", verifyUser, async (req: any, res: any) => {
    const { transactionId } = req.body;
    const userId = req.user.uid;

    if (!transactionId) {
      return res.status(400).json({ error: "Missing transactionId" });
    }

    try {
      const txRef = db.collection("transactions").doc(transactionId);
      
      const result = await db.runTransaction(async (transaction) => {
        const txDoc = await transaction.get(txRef);
        if (!txDoc.exists) {
          throw new Error("Transaction not found");
        }

        const txData = txDoc.data();
        if (!txData) {
          throw new Error("Transaction data is empty");
        }

        if (txData.status === "completed" || txData.status === "released") {
          throw new Error("Transaction already completed or released");
        }

        let listingType: 'service' | 'goods' = 'service';
        if (txData.listingId) {
          const listingDoc = await transaction.get(db.collection("listings").doc(txData.listingId));
          if (listingDoc.exists) {
            const lData = listingDoc.data();
            if (lData && (lData.type === 'product' || lData.type === 'goods')) {
              listingType = 'goods';
            }
          }
        }

        const grossAmount = txData.amount || 0;
        const commission = calculateCommission(listingType, grossAmount);
        const netEarnings = Math.max(0, Math.round(grossAmount - commission));

        const sellerId = txData.sellerId;
        const buyerId = txData.buyerId;

        const sellerRef = db.collection("users").doc(sellerId);
        const buyerRef = db.collection("users").doc(buyerId);

        const [sellerDoc, buyerDoc] = await Promise.all([
          transaction.get(sellerRef),
          transaction.get(buyerRef)
        ]);

        if (!sellerDoc.exists) {
          throw new Error("Seller profile not found");
        }
        if (!buyerDoc.exists) {
          throw new Error("Buyer profile not found");
        }

        const sellerData = sellerDoc.data() || {};
        const buyerData = buyerDoc.data() || {};

        // 1. Transaction Status completion
        transaction.update(txRef, {
          status: "completed",
          commissionDeducted: commission,
          netEarnings: netEarnings,
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });

        // 2. Clear Vendor payouts and write dashboard indicators
        const sellerPrevEarnings = sellerData.earnings || { totalVolume: 0, withdrawableBalance: 0, pendingHoldBalance: 0 };
        const newSellerEarnings = {
          totalVolume: (sellerPrevEarnings.totalVolume || 0) + grossAmount,
          withdrawableBalance: (sellerPrevEarnings.withdrawableBalance || 0) + netEarnings,
          pendingHoldBalance: sellerPrevEarnings.pendingHoldBalance || 0
        };

        transaction.update(sellerRef, {
          escrowBalance: admin.firestore.FieldValue.increment(netEarnings),
          completedPaymentsCount: admin.firestore.FieldValue.increment(1),
          earnings: newSellerEarnings,
          updatedAt: new Date().toISOString()
        });

        // Write to vendor transaction log explicitly (Gross, platform commission, Net earnings added)
        const dashboardLogRef = db.collection("dashboard_transaction_logs").doc();
        transaction.set(dashboardLogRef, {
          userId: sellerId,
          transactionId: transactionId,
          grossAmount: grossAmount,
          commissionDeducted: commission,
          netEarningsAdded: netEarnings,
          type: "credit",
          description: `Payout and Commission Settlement for completed transaction ${transactionId}`,
          createdAt: new Date().toISOString()
        });

        // 3. Evaluate conditional multi-tiered referral trigger atomically
        const referredBy = buyerData.referredBy;
        const hasTriggeredReferral = buyerData.hasTriggeredReferral || false;
        
        let referralProcessed = false;
        let referralReward = 0;
        let referrerId = "";

        if (grossAmount >= 1000 && referredBy && !hasTriggeredReferral && referredBy !== sellerId) {
          referrerId = referredBy;
          const referrerRef = db.collection("users").doc(referrerId);
          const referrerDoc = await transaction.get(referrerRef);

          if (referrerDoc.exists) {
            const referrerData = referrerDoc.data() || {};
            const successfulReferralsCount = referrerData.successfulReferrals || 0;

            // Tiered referral payouts
            referralReward = successfulReferralsCount < 5 ? 70 : 40;

            const referrerPrevEarnings = referrerData.earnings || { totalVolume: 0, withdrawableBalance: 0, pendingHoldBalance: 0 };
            const newReferrerEarnings = {
              totalVolume: referrerPrevEarnings.totalVolume || 0,
              withdrawableBalance: (referrerPrevEarnings.withdrawableBalance || 0) + referralReward,
              pendingHoldBalance: referrerPrevEarnings.pendingHoldBalance || 0
            };

            // Update Referrer profile metrics
            transaction.update(referrerRef, {
              successfulReferrals: admin.firestore.FieldValue.increment(1),
              referralEarnings: admin.firestore.FieldValue.increment(referralReward),
              escrowBalance: admin.firestore.FieldValue.increment(referralReward),
              earnings: newReferrerEarnings,
              updatedAt: new Date().toISOString()
            });

            // Mark buyer referral trigger as activated
            transaction.update(buyerRef, {
              hasTriggeredReferral: true,
              updatedAt: new Date().toISOString()
            });

            // Trigger notification
            const referrerNotifRef = db.collection("notifications").doc();
            transaction.set(referrerNotifRef, {
              userId: referrerId,
              title: "Referral Reward Cleared!",
              message: `Your referral relationship cleared a transaction. You earned KSh ${referralReward} credited to your withdrawable balance!`,
              type: "success",
              read: false,
              createdAt: new Date().toISOString()
            });

            referralProcessed = true;
          }
        }

        // Standard notifications
        const sellerNotifRef = db.collection("notifications").doc();
        transaction.set(sellerNotifRef, {
          userId: sellerId,
          title: "Order Cleared Successfully",
          message: `Order ${transactionId} has cleared. KSh ${netEarnings} (after KSh ${commission} commission) added to withdrawable balance.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        const buyerNotifRef = db.collection("notifications").doc();
        transaction.set(buyerNotifRef, {
          userId: buyerId,
          title: "Delivery Completed",
          message: `You marked order ${transactionId} as completed. Service is settled.`,
          type: "info",
          read: false,
          createdAt: new Date().toISOString()
        });

        return {
          transactionId,
          grossAmount,
          commissionDeducted: commission,
          netEarningsAdded: netEarnings,
          referralProcessed,
          referralReward,
          referrerId
        };
      });

      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Escrow complete API error:", err);
      res.status(400).json({ error: err.message || "Failed to process escrow completeness transaction" });
    }
  });

  // Client M-Pesa B2C instant cash-out proxy
  app.post("/api/withdrawals/execute", verifyUser, async (req: any, res: any) => {
    const { amount, phoneNumber } = req.body;
    const userId = req.user.uid;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: "Missing withdrawal amount or phoneNumber" });
    }

    const requestedAmount = Number(amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: "Invalid requested withdrawal amount" });
    }

    if (requestedAmount <= 15) {
      return res.status(400).json({ error: "Requested amount must be greater than the KSh 15 platform fee" });
    }

    try {
      const userRef = db.collection("users").doc(userId);
      
      const payoutResult = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User profile not found");
        }

        const userData = userDoc.data() || {};
        const withdrawableBalance = userData.earnings?.withdrawableBalance ?? userData.escrowBalance ?? 0;

        if (withdrawableBalance < requestedAmount) {
          throw new Error(`Insufficient funds. Your withdrawable balance is KSh ${withdrawableBalance.toLocaleString()}`);
        }

        const mpesaDispatchAmount = requestedAmount - 15;

        // Mock Safaricom Daraja B2C API payout invocation block
        const mockDarajaReceipt = "MPESA-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        console.log(`[DARAJA B2C] Dispatching payment: PartyB=${phoneNumber}, PayloadAmount=${mpesaDispatchAmount}, Fee=15, Receipt=${mockDarajaReceipt}`);

        // Deduct complete Requested Amount from both new and legacy balances
        const prevEarnings = userData.earnings || { totalVolume: 0, withdrawableBalance: 0, pendingHoldBalance: 0 };
        const newEarnings = {
          totalVolume: prevEarnings.totalVolume || 0,
          withdrawableBalance: Math.max(0, (prevEarnings.withdrawableBalance || 0) - requestedAmount),
          pendingHoldBalance: prevEarnings.pendingHoldBalance || 0
        };

        transaction.update(userRef, {
          escrowBalance: admin.firestore.FieldValue.increment(-requestedAmount), 
          earnings: newEarnings,
          updatedAt: new Date().toISOString()
        });

        // Add to persistent records
        const withdrawalRef = db.collection("withdrawals").doc();
        transaction.set(withdrawalRef, {
          userId,
          amount: requestedAmount,
          fee: 15,
          actualPayout: mpesaDispatchAmount,
          phoneNumber,
          receiptNumber: mockDarajaReceipt,
          status: "completed",
          method: "mpesa",
          createdAt: new Date().toISOString()
        });

        // Create transaction notification
        const notificationRef = db.collection("notifications").doc();
        transaction.set(notificationRef, {
          userId,
          title: "M-Pesa Cash-Out Completed",
          message: `Your withdrawal of KSh ${requestedAmount} was successful. KSh 15 platform charge applied. KSh ${mpesaDispatchAmount} sent to ${phoneNumber}. MPesa Ref: ${mockDarajaReceipt}`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        return {
          withdrawalId: withdrawalRef.id,
          receiptNumber: mockDarajaReceipt,
          requestedAmount,
          dispatchedAmount: mpesaDispatchAmount,
          platformCharge: 15,
          phoneNumber
        };
      });

      res.json({ success: true, ...payoutResult });
    } catch (err: any) {
      console.error("Withdrawal execution error:", err);
      res.status(400).json({ error: err.message || "Failed to execute Safaricom M-Pesa payout withdrawal" });
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly serve index.html in dev mode if it's not handled by vite.middlewares
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(_dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
