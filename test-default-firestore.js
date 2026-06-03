import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

async function test() {
  const firebaseConfigPath = "./firebase-applet-config.json";
  if (admin.apps.length === 0) {
    if (fs.existsSync(firebaseConfigPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    } else {
      admin.initializeApp();
    }
  }

  const db = admin.firestore();

  try {
    console.log("Attempting a simple read of transactions collection on default db...");
    const txs = await db.collection("transactions").limit(1).get();
    console.log("Get transactions on default db count:", txs.docs.length);
  } catch (error) {
    console.error("Read list error on default db:", error.message);
  }
}

test();
