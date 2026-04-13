const admin = require("firebase-admin");
admin.initializeApp({ projectId: "demo-test" });
const db = admin.firestore();
const batch = db.batch();
const ref = db.collection("test").doc("doc1");
try {
  batch.set(ref, { a: 1 });
  batch.set(ref, { a: 2 });
  console.log("No error synchronously");
} catch(e) {
  console.error("Sync error:", e.message);
}
