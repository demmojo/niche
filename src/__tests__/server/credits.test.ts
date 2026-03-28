import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActionCredits, deductActionCredit } from "../../server/credits";

// Mock firebase-admin
vi.mock("firebase-admin", () => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const updateMock = vi.fn();

  const docMock = vi.fn(() => ({
    get: getMock,
    set: setMock,
  }));

  const collectionMock = vi.fn(() => ({
    doc: docMock,
  }));

  const runTransactionMock = vi.fn();
  /**
   *
   */
  const firestoreMock = () => ({
    collection: collectionMock,
    runTransaction: runTransactionMock,
  });

  firestoreMock.FieldValue = {
    increment: vi.fn((val) => `INCREMENT_BY_${val}`),
  };

  return {
    firestore: firestoreMock,
  };
});

import * as admin from "firebase-admin";

describe("credits.ts", () => {
  let mockDb: any;
  let mockTransaction: any;
  let getMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = admin.firestore();

    // We need to re-extract the mocked methods from the db mock
    const docObj = mockDb.collection("users").doc("test-uid");
    getMock = docObj.get as any;
    setMock = docObj.set as any;

    mockTransaction = {
      get: vi.fn(),
      update: vi.fn(),
    };

    (mockDb.runTransaction as any).mockImplementation(async (cb: any) => {
      await cb(mockTransaction);
    });
  });

  describe("getActionCredits", () => {
    it("returns default credits and initializes doc if it does not exist", async () => {
      getMock.mockResolvedValueOnce({
        exists: false,
      });

      const credits = await getActionCredits("test-uid");

      expect(credits).toBe(50);
      expect(setMock).toHaveBeenCalledWith(
        { actionCredits: 50 },
        { merge: true },
      );
    });

    it("returns existing credits if document and field exist", async () => {
      getMock.mockResolvedValueOnce({
        exists: true,
        /**
         *
         */
        data: () => ({ actionCredits: 42 }),
      });

      const credits = await getActionCredits("test-uid");

      expect(credits).toBe(42);
      expect(setMock).not.toHaveBeenCalled();
    });

    it("initializes actionCredits field if document exists but field is missing", async () => {
      getMock.mockResolvedValueOnce({
        exists: true,
        /**
         *
         */
        data: () => ({ otherField: "hello" }),
      });

      const credits = await getActionCredits("test-uid");

      expect(credits).toBe(50);
      expect(setMock).toHaveBeenCalledWith(
        { actionCredits: 50 },
        { merge: true },
      );
    });
  });

  describe("deductActionCredit", () => {
    it("deducts credit via transaction if sufficient credits exist", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ actionCredits: 5 }),
      });

      await deductActionCredit("test-uid");

      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
        actionCredits: "INCREMENT_BY_-1",
      });
    });

    it("deducts specific amount via transaction if sufficient credits exist", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ actionCredits: 5 }),
      });

      await deductActionCredit("test-uid", 3);

      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
        actionCredits: "INCREMENT_BY_-3",
      });
    });

    it("refunds credit via transaction (bypassing insufficient check)", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ actionCredits: 0 }),
      });

      await deductActionCredit("test-uid", -2); // Refund 2 credits

      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), {
        actionCredits: "INCREMENT_BY_2", // -(-2)
      });
    });

    it("throws error if user document does not exist", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: false,
      });

      await expect(deductActionCredit("test-uid")).rejects.toThrow(
        "User document does not exist.",
      );
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });

    it("throws error if insufficient credits (0)", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        /**
         *
         */
        data: () => ({ actionCredits: 0 }),
      });

      await expect(deductActionCredit("test-uid")).rejects.toThrow(
        "Insufficient Action Credits.",
      );
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });

    it("throws error if insufficient credits (negative)", async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        /**
         *
         */
        data: () => ({ actionCredits: -5 }),
      });

      await expect(deductActionCredit("test-uid")).rejects.toThrow(
        "Insufficient Action Credits.",
      );
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });
  });
});
