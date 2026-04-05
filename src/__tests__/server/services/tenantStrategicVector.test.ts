import { describe, it, expect, vi, beforeEach } from "vitest";
import { storeTenantStrategicVector } from "../../../server/services/tenantStrategicVector";
import admin from "firebase-admin";

const mockSet = vi.fn().mockResolvedValue(true);
const mockDoc = vi.fn(() => ({ set: mockSet, id: "test-doc-id" }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));

vi.mock("firebase-admin", () => {
  return {
    default: {
      firestore: Object.assign(
        vi.fn(() => ({
          collection: mockCollection,
        })),
        {
          FieldValue: {
            serverTimestamp: vi.fn().mockReturnValue("mock-timestamp"),
          },
        },
      ),
    },
  };
});

describe("tenantStrategicVector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should store a strategic vector successfully with notes", async () => {
    const id = await storeTenantStrategicVector(
      "user1",
      "idea1",
      "fact1",
      "High",
      "notes",
    );

    expect(id).toBe("test-doc-id");
    expect(mockCollection).toHaveBeenCalledWith("TenantStrategicVectors");
    expect(mockDoc).toHaveBeenCalledWith("idea1_fact1");
    expect(mockSet).toHaveBeenCalledWith(
      {
        userId: "user1",
        ideaId: "idea1",
        marketFactId: "fact1",
        threatLevel: "High",
        customNotes: "notes",
        createdAt: "mock-timestamp",
        updatedAt: "mock-timestamp",
      },
      { merge: true },
    );
  });

  it("should store a strategic vector successfully without notes", async () => {
    const id = await storeTenantStrategicVector(
      "user2",
      "idea2",
      "fact2",
      "Low",
    );

    expect(id).toBe("test-doc-id");
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        customNotes: null,
      }),
      { merge: true },
    );
  });
});
