import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";

const runFirestoreTests = !!process.env.FIRESTORE_EMULATOR_HOST;

const describeIfEmulator = runFirestoreTests ? describe : describe.skip;

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  if (!runFirestoreTests) return;
  // Load the rules file
  const rulesPath = resolve(__dirname, "../../../firestore.rules");
  const rules = readFileSync(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: "demo-tarpit-tollgate-test",
    firestore: {
      rules,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

describeIfEmulator("campaign_jobs IDOR (TC-IDOR-01)", () => {
  it("allows a user to read their own campaign job", async () => {
    // Setup mock job data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("campaign_jobs").doc("job-123").set({
        userId: "user-alice",
        status: "completed",
      });
    });

    const aliceContext = testEnv.authenticatedContext("user-alice");
    const db = aliceContext.firestore();

    const jobDoc = db.collection("campaign_jobs").doc("job-123");
    await assertSucceeds(jobDoc.get());
  });

  it("denies an unauthorized user from reading another tenant's campaign job", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("campaign_jobs").doc("job-123").set({
        userId: "user-alice",
        status: "completed",
      });
    });

    // Bob tries to read Alice's job
    const bobContext = testEnv.authenticatedContext("user-bob");
    const bobDb = bobContext.firestore();

    const jobDoc = bobDb.collection("campaign_jobs").doc("job-123");
    await assertFails(jobDoc.get());
  });

  it("denies unauthenticated users from reading campaign jobs", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection("campaign_jobs").doc("job-123").set({
        userId: "user-alice",
        status: "completed",
      });
    });

    const unauthContext = testEnv.unauthenticatedContext();
    const unauthDb = unauthContext.firestore();

    const jobDoc = unauthDb.collection("campaign_jobs").doc("job-123");
    await assertFails(jobDoc.get());
  });

  it("denies all clients from creating/updating/deleting campaign jobs directly", async () => {
    const aliceContext = testEnv.authenticatedContext("user-alice");
    const db = aliceContext.firestore();

    const jobDoc = db.collection("campaign_jobs").doc("job-123");

    // Create
    await assertFails(
      jobDoc.set({
        userId: "user-alice",
        status: "queued",
      })
    );

    // Update
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("campaign_jobs").doc("job-123").set({
        userId: "user-alice",
        status: "completed",
      });
    });

    await assertFails(
      jobDoc.update({
        status: "hacked",
      })
    );

    // Delete
    await assertFails(jobDoc.delete());
  });
});
