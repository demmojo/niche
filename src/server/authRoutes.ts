import { logger } from "./logger";
import { Router, Request, Response } from "express";
import { requireAppCheck, requireAuth } from "./authMiddleware";
import admin from "firebase-admin";
import crypto from "crypto";

export const authRouter = Router();

authRouter.post(
  "/generate-merge-grant",
  requireAppCheck,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const userRecord = await admin.auth().getUser(user.uid);
      const isAnonymous = userRecord.providerData.length === 0;

      if (!isAnonymous) {
        return res
          .status(400)
          .json({ error: "Only anonymous accounts can generate merge grants" });
      }

      const claimTicket = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await admin.firestore().collection("merge_grants").doc(user.uid).set({
        token: claimTicket,
        expiresAt,
      });

      return res.status(200).json({ claimTicket });
    } catch (error: any) {
      logger.error("Generate Merge Grant Error:", error);
      return res.status(500).json({ error: error.message });
    }
  },
);

authRouter.post(
  "/execute-merge",
  requireAppCheck,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { anonUid, claimTicket } = req.body;
      const permUser = (req as any).user;

      if (!anonUid || !claimTicket) {
        return res
          .status(400)
          .json({ error: "Missing anonUid or claimTicket" });
      }

      const db = admin.firestore();
      const grantRef = db.collection("merge_grants").doc(anonUid);

      const grantDoc = await grantRef.get();
      if (!grantDoc.exists) {
        return res
          .status(403)
          .json({ error: "Invalid or expired claim ticket" });
      }

      const grantData = grantDoc.data();
      if (
        grantData?.token !== claimTicket ||
        grantData.expiresAt < Date.now()
      ) {
        return res
          .status(403)
          .json({ error: "Invalid or expired claim ticket" });
      }

      // Execute the merge
      const newUid = permUser.uid;

      if (newUid === anonUid) {
        return res
          .status(400)
          .json({ error: "Cannot merge identical accounts" });
      }

      // Run reparenting synchronously or asynchronously? The spec says:
      // "The backend verifies the ticket and uses Firestore.writeBatch to atomically append the anonymous workspace to the permanent account."

      // Let's do it synchronously to ensure the user gets a definite response.
      // Or asynchronously if there are many. Let's stick to the batch logic.

      // A. Campaign Jobs (Iterative chunked reparenting)
      let hasMoreJobs = true;
      while (hasMoreJobs) {
        const snapshot = await db
          .collection("campaign_jobs")
          .where("userId", "==", anonUid)
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
          .where("members", "array-contains", anonUid)
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
            m === anonUid ? newUid : m,
          );
          batch.update(docSnap.ref, { members: newMembers });
        });
        await batch.commit();

        if (snapshot.size < 500) {
          hasMoreWorkspaces = false;
        }
      }

      // Also jobs from RoastMyNiche
      let hasMoreRoastJobs = true;
      while (hasMoreRoastJobs) {
        const snapshot = await db
          .collection("jobs")
          .where("owner_uid", "==", anonUid)
          .limit(500)
          .get();

        if (snapshot.empty) {
          hasMoreRoastJobs = false;
          break;
        }

        const batch = db.batch();
        snapshot.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, { owner_uid: newUid });
        });
        await batch.commit();

        if (snapshot.size < 500) {
          hasMoreRoastJobs = false;
        }
      }

      // Mark the grant as used (delete it)
      await grantRef.delete();

      // Delete the old anonymous user record in background
      admin
        .auth()
        .deleteUser(anonUid)
        .catch((err) => {
          logger.error(
            `Failed to delete anon user ${anonUid} after successful merge:`,
            err,
          );
        });

      return res.status(200).json({ status: "success" });
    } catch (error: any) {
      logger.error("Data Merge Error:", error);
      return res.status(500).json({ error: error.message });
    }
  },
);
