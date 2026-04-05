// We need to use firebase-admin here since this runs on the Express server
// and needs privileged access to bypass client rules.
import admin from "firebase-admin";

const DEFAULT_MONTHLY_CREDITS = 50;

/**
 * Ensures a user document exists and has the actionCredits field.
 * Returns the current available credits.
 */
export async function getActionCredits(userId: string): Promise<number> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);

  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    // Initialize the user with default credits
    await userRef.set(
      { actionCredits: DEFAULT_MONTHLY_CREDITS },
      { merge: true },
    );
    return DEFAULT_MONTHLY_CREDITS;
  }

  const data = userSnap.data();
  if (data && typeof data.actionCredits === "number") {
    return data.actionCredits;
  }

  // If field is missing, initialize it
  await userRef.set(
    { actionCredits: DEFAULT_MONTHLY_CREDITS },
    { merge: true },
  );
  return DEFAULT_MONTHLY_CREDITS;
}

/**
 * Deducts (or refunds) an action credit from the user's account.
 * Throws an error if insufficient credits.
 */
export async function deductActionCredit(
  userId: string,
  amount: number = 1,
): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error("User document does not exist.");
    }

    const currentCredits = userDoc.data()?.actionCredits;

    // Only check for insufficient credits if we are deducting (amount > 0)
    // If we are refunding (amount < 0), we bypass this check
    if (amount > 0 && currentCredits < amount) {
      throw new Error("Insufficient Action Credits.");
    }

    transaction.update(userRef, {
      actionCredits: admin.firestore.FieldValue.increment(-amount),
    });
  });
}
