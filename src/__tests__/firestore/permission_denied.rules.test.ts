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
    projectId: "demo-tarpit-tollgate-test-permissions",
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

describeIfEmulator("Firebase Rules - permission_denied branches", () => {
  it("denies unauthenticated users from mutating user documents", async () => {
    const unauthContext = testEnv.unauthenticatedContext();
    const db = unauthContext.firestore();

    const userDoc = db.collection("users").doc("user-alice");
    await assertFails(userDoc.set({ autoSync: true }));
    await assertFails(userDoc.update({ autoSync: false }));
    await assertFails(userDoc.delete());
  });

  it("denies an authenticated user from mutating another user's documents", async () => {
    const bobContext = testEnv.authenticatedContext("user-bob");
    const db = bobContext.firestore();

    const aliceDoc = db.collection("users").doc("user-alice");
    await assertFails(aliceDoc.set({ autoSync: true }));
    await assertFails(aliceDoc.update({ autoSync: false }));
    await assertFails(aliceDoc.delete());

    // Also blocks subcollections
    const compDoc = aliceDoc.collection("competitors").doc("comp-1");
    await assertFails(compDoc.set({ userId: "user-alice", name: "Comp 1" }));
  });

  it("denies impersonated users from creating or deleting user documents", async () => {
    const impersonatedContext = testEnv.authenticatedContext("user-alice", {
      isImpersonated: true,
    });
    const db = impersonatedContext.firestore();

    const userDoc = db.collection("users").doc("user-alice");
    await assertFails(userDoc.set({ autoSync: true }));
    await assertFails(userDoc.delete());

    // Update should also be limited if the rule limits it? The rule says `isOwner` for update, but let's check
    // Actually, create and delete have `!isImpersonated()`. Update does not explicitly deny impersonated users for the root doc in the current rules.
    // However, creating a competitor explicitly denies impersonated users:
    const compDoc = userDoc.collection("competitors").doc("comp-1");
    await assertFails(compDoc.set({ userId: "user-alice", name: "Comp 1" }));
    await assertFails(compDoc.delete());
  });

  it("denies telemetry events from being read or written by any client", async () => {
    const aliceContext = testEnv.authenticatedContext("user-alice");
    const db = aliceContext.firestore();

    const telemetryDoc = db.collection("telemetry_events").doc("event-1");

    await assertFails(telemetryDoc.get());
    await assertFails(telemetryDoc.set({ event: "login" }));
    await assertFails(telemetryDoc.update({ event: "logout" }));
    await assertFails(telemetryDoc.delete());
  });
});
