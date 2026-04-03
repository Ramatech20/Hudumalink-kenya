<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/28b58e4b-610a-482b-a01e-bd7b51701f12

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` with:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_PASSKEY`
   - `MPESA_SHORTCODE` (default `174379` for sandbox)
   - `APP_URL` (e.g. `http://localhost:3000` or your deployed URL)
   - `FIREBASE_API_KEY`, etc. (as required by `firebase-applet-config.json` setup)
3. Start dev server:
   `npm run dev`

## M-Pesa payment flow

- Frontend calls `/api/mpesa/stkpush` from `src/services/paymentService.ts`.
- Backend (`server.ts`) sends STK Push to Safaricom.
- Safaricom callback to `/api/mpesa/callback` updates transaction status to `deposited`.
- Buyer confirms delivery in UI to call `releaseEscrowFunds` and move funds to seller.

