import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function test() {
  let dbId = undefined;
  const firebaseConfigPath = "./firebase-applet-config.json";
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)") {
      dbId = config.firestoreDatabaseId;
    }
  }

  console.log("Database ID:", dbId);

  // Initialize
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString());
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("Init with env service account");
  } else if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
      console.log("Init with application default");
    } catch (e) {
      console.log("Failed ADC init:", e.message);
    }
  }

  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const db = dbId ? getFirestore(admin.apps[0] || admin.app(), dbId) : admin.firestore();

  try {
    console.log("Attempting a simple read of transactions collection...");
    const txs = await db.collection("transactions").limit(1).get();
    console.log("Get transactions collection list count:", txs.docs.length);
  } catch (error) {
    console.error("Read list error on transactions:", error);
  }

  try {
    console.log("Attempting to write a test notification...");
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      userId: "test-user-id",
      title: "Test",
      createdAt: new Date().toISOString()
    });
    console.log("Notification write successful!");
    // Clean up
    await notifRef.delete();
  } catch (error) {
    console.error("Write error on notifications:", error);
  }
}

test();
