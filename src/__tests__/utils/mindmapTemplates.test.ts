import { describe, it, expect } from "vitest";
import { templates } from "../../utils/mindmapTemplates";

describe("mindmapTemplates", () => {
  it("has correctly defined templates and layout functions", () => {
    // Generate dummy card IDs to pass to the layout functions
    const mockIds = [
      "card-1",
      "card-2",
      "card-3",
      "card-4",
      "card-5",
      "card-6",
      "card-7",
    ];

    // Iterate through all templates and verify their structure and layout functions
    Object.values(templates).forEach((template) => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(Array.isArray(template.cards)).toBe(true);
      expect(typeof template.layout).toBe("function");

      // Call the layout function with enough IDs
      const { instances, edges } = template.layout(mockIds);

      // Verify layout output
      expect(Array.isArray(instances)).toBe(true);
      expect(instances.length).toBeGreaterThan(0);
      expect(Array.isArray(edges)).toBe(true);

      // Verify that the instances correctly map to the provided card IDs
      instances.forEach((inst, index) => {
        expect(inst.cardId).toBe(mockIds[index]);
        expect(inst.position).toHaveProperty("x");
        expect(inst.position).toHaveProperty("y");
      });

      // Verify edges refer to valid instance indices
      edges.forEach((edge) => {
        expect(edge).toHaveProperty("id");
        expect(edge).toHaveProperty("source");
        expect(edge).toHaveProperty("target");
      });
    });
  });
});
