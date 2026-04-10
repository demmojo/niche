import { logger } from "./logger";
import { Router, Request, Response } from "express";
import { requireAppCheck } from "./authMiddleware";
import admin from "firebase-admin";

export const authRouter = Router();

authRouter.post(
  "/merge-anonymous-data",
  requireAppCheck,
  async (req: Request, res: Response) => {
    try {
      const { anonToken, oldUid } = req.body;
      const authHeader = req.headers.authorization;

      if (!anonToken || !oldUid) {
        return res.status(400).json({ error: "Missing anonToken or oldUid" });
      }

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing Permanent JWT" });
      }

      const permToken = authHeader.split("Bearer ")[1];

      // 1. Dual-Token Verification
      // Verify Permanent User Token
      const decodedPermToken = await admin.auth().verifyIdToken(permToken);
      const newUid = decodedPermToken.uid;

      if (newUid === oldUid) {
        return res
          .status(400)
          .json({ error: "Cannot merge identical accounts" });
      }

      // Verify Anonymous User Token
      const decodedAnonToken = await admin.auth().verifyIdToken(anonToken);

      if (decodedAnonToken.uid !== oldUid) {
        return res
          .status(403)
          .json({ error: "Anonymous token does not match oldUid" });
      }

      // Ensure the old token actually belonged to an anonymous user
      const oldUserRecord = await admin.auth().getUser(oldUid);
      const isActuallyAnonymous = oldUserRecord.providerData.length === 0;

      if (!isActuallyAnonymous) {
        return res
          .status(400)
          .json({ error: "Source account is not anonymous" });
      }

      // Return 202 Accepted and a jobId immediately
      const jobId = `merge_${oldUid}_${newUid}`;
      res.status(202).json({ status: "processing", jobId });

      // Run reparenting asynchronously (Floating Promise)
      Promise.resolve().then(async () => {
        try {
          const db = admin.firestore();

          // C. Leave a tombstone to prevent replay attacks and mark merge initiated
          const tombstoneRef = db.collection("merged_accounts").doc(oldUid);

          await db.runTransaction(async (transaction) => {
            const tombstoneSnap = await transaction.get(tombstoneRef);
            if (tombstoneSnap.exists) {
              throw new Error("Merge already processed or in progress");
            }
            transaction.set(tombstoneRef, {
              mergedInto: newUid,
              mergedAt: admin.firestore.FieldValue.serverTimestamp(),
              originalAnonTokenIat: decodedAnonToken.iat,
            });
          });

          // A. Campaign Jobs (Iterative chunked reparenting)
          let hasMoreJobs = true;
          while (hasMoreJobs) {
            const snapshot = await db
              .collection("campaign_jobs")
              .where("userId", "==", oldUid)
              .limit(500)
              .get();

            if (snapshot.empty) {
              hasMoreJobs = false;
              break;
            }

            const batch = db.batch();
            snapshot.docs.forEach((docSnap) => {
              batch.update(docSnap.ref, { userId: newUid });
            });
            await batch.commit();

            if (snapshot.size < 500) {
              hasMoreJobs = false;
            }
          }

          // B. Workspaces (Iterative chunked reparenting)
          let hasMoreWorkspaces = true;
          while (hasMoreWorkspaces) {
            const snapshot = await db
              .collection("workspaces")
              .where("members", "array-contains", oldUid)
              .limit(500)
              .get();

            if (snapshot.empty) {
              hasMoreWorkspaces = false;
              break;
            }

            const batch = db.batch();
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              const members = data.members || [];
              const newMembers = members.map((m: string) =>
                m === oldUid ? newUid : m,
              );
              batch.update(docSnap.ref, { members: newMembers });
            });
            await batch.commit();

            if (snapshot.size < 500) {
              hasMoreWorkspaces = false;
            }
          }

          // 3. Delete the old anonymous user record
          try {
            await admin.auth().deleteUser(oldUid);
          } catch (delErr) {
            logger.error(
              `Failed to delete anon user ${oldUid} after successful merge:`,
              delErr,
            );
            // We do not fail the request because the data is already merged safely.
          }
        } catch (backgroundError) {
          logger.error("Background Merge Error:", backgroundError);
        }
      });
    } catch (error: any) {
      logger.error("Data Merge Error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    }
  },
);
