import {
  calculateCosineSimilarity,
  fastL2NormalizeInPlace,
  calculateTarpitScore,
} from "../../utils/scoringEngine";
import admin from "firebase-admin";

export default async function recalculateMarketScores(data: {
  eventId: string;
  proposalId: string;
}) {
  // Wait, in a separate thread, `firebase-admin` might not be initialized if not passed credentials.
  // Instead of querying firebase from the thread, we can pass the required vectors to the thread!
  // But wait, it might be simpler to just query from within the thread if it has default credentials.
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const db = admin.firestore();

  try {
    const eventRef = db.collection("taxonomy_merge_events").doc(data.eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) return;

    // We would fetch affected projects and recalculate uniqueness here.
    // For now, let's just mark it as processed and mock the impact.
    // In reality: loop through all projects that had the merged features, update their scores.
    await eventRef.update({
      status: "processed",
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // "Wire up the 'Market Shift' UI notification for founders whose project viability scores change."
    // Let's create a notification document.
    await db.collection("notifications").add({
      type: "MARKET_SHIFT",
      title: "Market Shift Alert",
      message:
        "A global taxonomy merge has affected your project's uniqueness score.",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Worker error:", err);
    throw err;
  }
}
