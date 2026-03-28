import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const redeemInvite = functions.https.onCall(async (request) => {
  // 1. Verify Authentication
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }

  const token = request.data.token;
  if (!token || typeof token !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid invite token.",
    );
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // 2. Query the invite by token
      const invitesRef = db.collection("invites");
      const q = invitesRef
        .where("token", "==", token)
        .where("status", "==", "pending")
        .limit(1);
      const snapshot = await transaction.get(q);

      if (snapshot.empty) {
        throw new functions.https.HttpsError(
          "not-found",
          "Invite not found, expired, or already redeemed.",
        );
      }

      const inviteDoc = snapshot.docs[0];
      const inviteData = inviteDoc.data();

      // 3. Security Check: Email match
      // Ensures users can't forward invite links to other accounts
      if (
        inviteData.email.toLowerCase() !==
        request.auth.token.email?.toLowerCase()
      ) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "This invite was sent to a different email address.",
        );
      }

      // 4. Expiration Check
      if (
        inviteData.expiresAt &&
        inviteData.expiresAt.toMillis() < Date.now()
      ) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "This invite has expired.",
        );
      }

      const workspaceId = inviteData.workspaceId;
      if (!workspaceId) {
        throw new functions.https.HttpsError(
          "internal",
          "Invite is missing a workspaceId.",
        );
      }

      const workspaceRef = db.collection("workspaces").doc(workspaceId);
      const workspaceSnap = await transaction.get(workspaceRef);

      // 5. Atomic Update: Add to workspace and mark invite accepted
      if (workspaceSnap.exists) {
        transaction.update(workspaceRef, {
          members: admin.firestore.FieldValue.arrayUnion(request.auth.uid),
        });
      } else {
        // If workspace somehow doesn't exist, create it with this user as a member
        transaction.set(workspaceRef, {
          members: [request.auth.uid],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      transaction.update(inviteDoc.ref, {
        status: "accepted",
        acceptedByUid: request.auth.uid,
        redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, workspaceId };
    });
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error("Invite redemption failed:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while redeeming the invite.",
    );
  }
});
