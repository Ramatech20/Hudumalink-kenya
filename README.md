# HudumaLink Kenya - Deployment Guide

This application is a full-stack React + Express app using Firebase and M-Pesa.

## Free Hosting Options

### 1. Render (Recommended for Full-Stack)
Render's free tier is perfect for testing this app.

1.  **Connect GitHub**: Create a free account on [Render.com](https://render.com) and connect your GitHub repository.
2.  **Create a Web Service**:
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm run start`
3.  **Environment Variables**:
    *   `NODE_ENV`: `production`
    *   `APP_URL`: Your Render app URL (e.g., `https://hudumalink.onrender.com`)
    *   `FIREBASE_SERVICE_ACCOUNT`: Base64 encoded string of your Firebase Service Account JSON.
    *   `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`: From Safaricom Daraja Portal.

### 2. Vercel (Frontend Only / Serverless)
If you want to use Vercel, you'll need to configure serverless functions for the `/api` routes.

## Firebase Setup
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Authentication** (Google Login).
3.  Enable **Firestore Database**.
4.  Generate a **Service Account Key** (Project Settings > Service Accounts) and encode it to Base64 for the `FIREBASE_SERVICE_ACCOUNT` environment variable.

## M-Pesa Setup
1.  Register on [Safaricom Daraja](https://developer.safaricom.co.ke/).
2.  Create a Sandbox app to get your Consumer Key and Secret.
3.  Use the provided Passkey for STK Push.
