import admin from "firebase-admin";

export interface TenantStrategicVector {
  userId: string;
  ideaId: string;
  marketFactId: string;
  threatLevel: "Low" | "Medium" | "High";
  customNotes?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export async function storeTenantStrategicVector(
  userId: string,
  ideaId: string,
  marketFactId: string,
  threatLevel: "Low" | "Medium" | "High",
  customNotes?: string,
) {
  const db = admin.firestore();

  const vectorRef = db
    .collection("TenantStrategicVectors")
    .doc(`${ideaId}_${marketFactId}`);

  await vectorRef.set(
    {
      userId,
      ideaId,
      marketFactId,
      threatLevel,
      customNotes: customNotes || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return vectorRef.id;
}
