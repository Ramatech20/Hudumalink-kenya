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

  // Admin Actions: B2C Payouts (Withdrawals & Refunds)
  app.post("/api/admin/payout", async (req, res) => {
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
