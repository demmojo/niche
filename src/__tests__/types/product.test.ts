import { describe, it, expect } from "vitest";
import {
  ProductSchema,
  CreateProductInputSchema,
  ForkProductInputSchema,
  FakeDoorSignalInputSchema,
} from "../../types/product";

describe("Product schemas", () => {
  it("should validate ProductV1", () => {
    const validData = {
      schemaVersion: "v1" as const,
      id: "prod_1",
      userId: "user_1",
      name: "Test Product",
      parentId: null,
      rootId: "prod_1",
      ancestors: [],
      forkReason: null,
      distributionChannel: null,
      status: "draft" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const result = ProductSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate ProductV2", () => {
    const validData = {
      schemaVersion: "v2" as const,
      id: "prod_2",
      userId: "user_1",
      name: "Test Product V2",
      parentId: null,
      rootId: "prod_2",
      ancestors: [],
      forkReason: null,
      distributionChannel: null,
      status: "winner" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const result = ProductSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate CreateProductInput", () => {
    const result = CreateProductInputSchema.safeParse({
      name: "New Idea",
      description: "A great idea",
    });
    expect(result.success).toBe(true);
  });

  it("should validate ForkProductInput", () => {
    const result = ForkProductInputSchema.safeParse({
      parentId: "prod_1",
      name: "Forked Idea",
      forkReason: "Pivot",
    });
    expect(result.success).toBe(true);
  });

  it("should validate FakeDoorSignalInput", () => {
    const result = FakeDoorSignalInputSchema.safeParse({
      productId: "prod_1",
      eventType: "cta_click",
    });
    expect(result.success).toBe(true);
  });
});
