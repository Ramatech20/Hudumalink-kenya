import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

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

      res.json(response.data);
    } catch (error: any) {
      console.error("M-Pesa STK Push error:", error.response?.data || error.message);
      // Fallback to mock for testing if credentials aren't set
      if (!process.env.MPESA_CONSUMER_KEY) {
        return res.json({
          MerchantRequestID: "mock-" + Math.random().toString(36).substr(2, 9),
          CheckoutRequestID: "mock-" + Math.random().toString(36).substr(2, 9),
          ResponseCode: "0",
          ResponseDescription: "Success (Mocked)",
          CustomerMessage: "Success (Mocked)"
        });
      }
      res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
    }
  });

  app.post("/api/mpesa/callback", (req, res) => {
    console.log("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));
    // In a real app, you'd update Firestore here based on CheckoutRequestID
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
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
