import admin from "firebase-admin";
import fs from "fs";

const saPath = "/home/demmojo/Downloads/gtmforge-45e57-ffc891882c0a.json";
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function clearLimits() {
  const snapshot = await db.collection("anonymous_usage_limits").get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted ${snapshot.size} anonymous usage limit documents.`);
}

clearLimits().catch(console.error);
