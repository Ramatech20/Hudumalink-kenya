import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import admin from "firebase-admin";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
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
        return next();
      }
    }
    return res.status(401).json({ error: "Unauthorized. Missing cryptographic Authorization Bearer token." });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
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
    const { transactionId } = req.body;
    const userId = req.user.uid; // Identity verified from the cryptographic auth token

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
        if (!txData) throw new Error("Data error");

        // Verify that the person initiating the release is indeed the buyer
        if (txData.buyerId !== userId) {
          throw new Error("Only the buyer can release funds");
        }

        // Check status - must be deposited or delivered
        if (txData.status !== "deposited" && txData.status !== "delivered") {
          throw new Error("Transaction in wrong state to release or already completed");
        }

        // 1. Update Transaction status atomically
        transaction.update(txRef, {
          status: "completed",
          releasedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // 2. Pay the Seller
        const sellerRef = db.collection("users").doc(txData.sellerId);
        transaction.update(sellerRef, {
          escrowBalance: admin.firestore.FieldValue.increment(txData.amount)
        });

        // 3. Handle Referral Reward (Locking down with genuine-transaction checks)
        if (txData.referralId) {
          const referralSettingsRef = db.collection("settings").doc("referral");
          const referralSettingsDoc = await transaction.get(referralSettingsRef);
          const settings = referralSettingsDoc.data();
          
          // Referrals are eligible ONLY for genuine transactions above threshold (e.g. >= 1000 KES)
          const isGenuineAmount = txData.amount >= 1000;
          
          if (settings?.isEnabled && isGenuineAmount) {
            const referrerRef = db.collection("users").doc(txData.referralId);
            transaction.update(referrerRef, {
              referralEarnings: admin.firestore.FieldValue.increment(settings.rewardAmount || 100)
            });

            // Notify Referrer
            const referrerNotificationRef = db.collection("notifications").doc();
            transaction.set(referrerNotificationRef, {
              userId: txData.referralId,
              title: "Referral Reward Received!",
              message: `You earned a reward of KES ${settings.rewardAmount || 100} because your referral completed a completed transaction.`,
              type: "success",
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        // 4. Notify Seller
        const sellerNotificationRef = db.collection("notifications").doc();
        transaction.set(sellerNotificationRef, {
          userId: txData.sellerId,
          title: "Funds Released",
          message: `KES ${txData.amount} has been added to your balance for order ${transactionId}.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        return { success: true };
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

    if (amount <= 0) {
      return res.status(400).json({ error: "Withdrawal amount must be greater than zero" });
    }

    const fee = method === "mpesa" ? 15 : 50;
    const totalToDeduct = amount + fee;

    try {
      const userRef = db.collection("users").doc(userId);
      
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        
        const userData = userDoc.data();
        const currentBalance = userData?.escrowBalance || 0;
        
        if (currentBalance < totalToDeduct) {
          throw new Error(`Insufficient balance. Available: KES ${currentBalance}`);
        }

        // 1. Deduct from balance atomically
        transaction.update(userRef, {
          escrowBalance: admin.firestore.FieldValue.increment(-totalToDeduct),
          updatedAt: new Date().toISOString()
        });

        // 2. Add withdrawal record
        const withdrawalRef = db.collection("withdrawals").doc();
        transaction.set(withdrawalRef, {
          userId,
          userName: userData?.displayName || "Unknown",
          amount,
          fee,
          totalDeducted: totalToDeduct,
          method,
          details,
          status: "pending",
          createdAt: new Date().toISOString()
        });

        return { success: true };
      });

      res.json(result);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ error: error.message });
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

                // 1. Mark transaction as completed (auto-released)
                transaction.update(txDoc.ref, {
                  status: "completed",
                  releasedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  autoReleased: true
                });

                // 2. Escrow payout directly to seller balance
                const sellerRef = db.collection("users").doc(currentTxData.sellerId);
                transaction.update(sellerRef, {
                  escrowBalance: admin.firestore.FieldValue.increment(currentTxData.amount)
                });

                // 3. Optional referral bonus for high-quality transactions (>= 1,000 KES to prevent referral circle fraud)
                if (currentTxData.referralId && currentTxData.amount >= 1000) {
                  const referralSettingsRef = db.collection("settings").doc("referral");
                  const referralSettingsDoc = await transaction.get(referralSettingsRef);
                  const settings = referralSettingsDoc.data();
                  
                  if (settings?.isEnabled) {
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

                // 4. Notify merchant of manual status payout
                const sellerNotificationRef = db.collection("notifications").doc();
                transaction.set(sellerNotificationRef, {
                  userId: currentTxData.sellerId,
                  title: "Funds Auto-Released",
                  message: `KES ${currentTxData.amount} has been auto-released into your dashboard balance for transaction ${txId}.`,
                  type: "success",
                  read: false,
                  createdAt: new Date().toISOString()
                });

                // 5. Notify customer
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
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
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
