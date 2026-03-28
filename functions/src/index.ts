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

  const auth = request.auth;
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
      if (inviteData.email.toLowerCase() !== auth.token.email?.toLowerCase()) {
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
          members: admin.firestore.FieldValue.arrayUnion(auth.uid),
        });
      } else {
        // If workspace somehow doesn't exist, create it with this user as a member
        transaction.set(workspaceRef, {
          members: [auth.uid],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      transaction.update(inviteDoc.ref, {
        status: "accepted",
        acceptedByUid: auth.uid,
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

/**
 * Supabase Auth Bridge
 * Injects the required 'role' claim and a 'team_id' claim into the Firebase JWT
 * so it can be consumed by Supabase PostgreSQL for Row Level Security.
 */
import * as functionsV1 from "firebase-functions/v1";

export const onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  try {
    // We default the user's initial team_id to their own UID (a personal workspace).
    // In a full multi-tenant setup, this would be updated when they join a real workspace/team.
    const customClaims = {
      role: "authenticated",
      team_id: user.uid,
    };

    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    console.log(`Successfully injected Supabase claims for user ${user.uid}`);
  } catch (error) {
    console.error("Failed to inject custom claims:", error);
  }
});
