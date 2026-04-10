import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const runFirestoreTests = !!process.env.FIRESTORE_EMULATOR_HOST;
const describeIfEmulator = runFirestoreTests ? describe : describe.skip;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!runFirestoreTests) return;
  testEnv = await initializeTestEnvironment({
    projectId: "nicheai-superadmin-test",
    firestore: {
      rules: readFileSync(
        resolve(__dirname, "../../../firestore.rules"),
        "utf8",
      ),
    },
  });
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

describeIfEmulator("Superadmin Pipeline Firestore Rules", () => {
  describe("leads collection", () => {
    it("allows unauthenticated users to create a lead with valid data", async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertSucceeds(
        unauthedDb.collection("leads").add({
          email: "founder@example.com",
          idea: "A SaaS for dog walkers",
          timestamp: new Date().toISOString(),
        }),
      );
    });

    it("prevents unauthenticated users from reading leads", async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection("leads").get());
    });

    it("allows superadmins to read leads", async () => {
      const superadminDb = testEnv
        .authenticatedContext("superadmin-123", {
          admin: true,
          isSuperadmin: true,
        })
        .firestore();
      await assertSucceeds(superadminDb.collection("leads").get());
    });
  });

  describe("pending_reports collection", () => {
    it("prevents unauthenticated users from creating reports", async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthedDb.collection("pending_reports").add({
          draft_markdown: "## Draft",
          status: "pending",
        }),
      );
    });

    it("allows superadmins to read and update pending reports", async () => {
      const superadminDb = testEnv
        .authenticatedContext("superadmin-123", { isSuperadmin: true })
        .firestore();

      // Need to create via backend (we bypass rules in test by using admin sdk or just test the read/update)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("pending_reports")
          .doc("report1")
          .set({
            draft_markdown: "## Draft",
            status: "pending",
            userEmail: "founder@example.com",
          });
      });

      await assertSucceeds(
        superadminDb.collection("pending_reports").doc("report1").get(),
      );
      await assertSucceeds(
        superadminDb
          .collection("pending_reports")
          .doc("report1")
          .update({ status: "approved" }),
      );
    });

    it("allows a user to read their own approved report based on creatorUid", async () => {
      const userDb = testEnv
        .authenticatedContext("user1", { email: "founder@example.com" })
        .firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("pending_reports")
          .doc("report1")
          .set({
            draft_markdown: "## Draft",
            status: "approved",
            creatorUid: "user1",
            userEmail: "founder@example.com",
          });
      });

      await assertSucceeds(
        userDb.collection("pending_reports").doc("report1").get(),
      );
    });

    it("prevents a user from reading another user's report", async () => {
      const userDb = testEnv
        .authenticatedContext("user2", { email: "other@example.com" })
        .firestore();

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context
          .firestore()
          .collection("pending_reports")
          .doc("report1")
          .set({
            draft_markdown: "## Draft",
            status: "approved",
            creatorUid: "user1",
            userEmail: "founder@example.com",
          });
      });

      await assertFails(
        userDb.collection("pending_reports").doc("report1").get(),
      );
    });
  });
});
