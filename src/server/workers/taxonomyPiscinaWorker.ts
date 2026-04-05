import admin from "firebase-admin";

if (!admin.apps?.length) {
  admin.initializeApp();
}

export async function processTaxonomyOutboxJobs() {
  const db = admin.firestore();

  const snap = await db
    .collection("taxonomy_merge_events")
    .where("status", "==", "pending")
    .limit(10)
    .get();

  for (const doc of snap.docs) {
    await doc.ref.update({ status: "processing" });

    try {
      await doc.ref.update({
        status: "processed",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // "Wire up the 'Market Shift' UI notification for founders whose project viability scores change."
      await db.collection("notifications").add({
        type: "MARKET_SHIFT",
        title: "Market Shift Alert",
        message:
          "A global taxonomy merge has affected your project's uniqueness score.",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e: any) {
      console.error("Taxonomy pool error:", e);
      await doc.ref.update({ status: "failed", error: e.message });
    }
  }
}
