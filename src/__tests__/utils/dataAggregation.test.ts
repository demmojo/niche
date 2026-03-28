import { describe, it, expect } from "vitest";
import {
  aggregateMetrics,
  calculateCombinedTrust,
} from "../../utils/dataAggregation";
import { RawDataMetric } from "../../types";

describe("dataAggregation utility", () => {
  const baseMetric: Omit<RawDataMetric, "id" | "metric_name" | "value"> = {
    asset_version_id: "v1",
    logical_asset_id: "la1",
    created_at: new Date().toISOString(),
    is_pinned: false,
  };

  describe("calculateCombinedTrust", () => {
    it("calculates average of static and ai scores correctly", () => {
      expect(
        calculateCombinedTrust({
          ...baseMetric,
          id: "1",
          metric_name: "test",
          value: 1,
          static_source_weight: 80,
          ai_confidence_score: 90,
        }),
      ).toBe(85);
      expect(
        calculateCombinedTrust({
          ...baseMetric,
          id: "2",
          metric_name: "test",
          value: 1,
          static_source_weight: 100,
          ai_confidence_score: 0,
        }),
      ).toBe(50);
      expect(
        calculateCombinedTrust({
          ...baseMetric,
          id: "3",
          metric_name: "test",
          value: 1,
          static_source_weight: 50,
          ai_confidence_score: 51,
        }),
      ).toBe(51); // Rounds up correctly
    });

    it("uses 50 as default if scores are undefined", () => {
      expect(
        calculateCombinedTrust({
          ...baseMetric,
          id: "1",
          metric_name: "test",
          value: 1,
        }),
      ).toBe(50);
    });
  });

  describe("aggregateMetrics", () => {
    it("handles a single metric", () => {
      const metrics: RawDataMetric[] = [
        { ...baseMetric, id: "1", metric_name: "revenue", value: 1000 },
      ];

      const result = aggregateMetrics(metrics);
      expect(result).toHaveLength(1);
      expect(result[0].metric_name).toBe("revenue");
      expect(result[0].value).toBe(1000);
      expect(result[0].is_range).toBe(false);
      expect(result[0].sources).toHaveLength(1);
    });

    it("prefers a pinned metric over others", () => {
      const metrics: RawDataMetric[] = [
        {
          ...baseMetric,
          id: "1",
          metric_name: "revenue",
          value: 1000,
          static_source_weight: 100,
          ai_confidence_score: 100,
        },
        {
          ...baseMetric,
          id: "2",
          metric_name: "revenue",
          value: 2000,
          is_pinned: true,
          static_source_weight: 0,
          ai_confidence_score: 0,
        },
      ];

      const result = aggregateMetrics(metrics);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(2000);
      expect(result[0].is_pinned).toBe(true);
      expect(result[0].confidence_score).toBe(0); // Uses pinned's trust
    });

    it("returns the highest trusted value for non-numeric conflicts", () => {
      const metrics: RawDataMetric[] = [
        {
          ...baseMetric,
          id: "1",
          metric_name: "ceo",
          value: "John",
          static_source_weight: 40,
          ai_confidence_score: 40,
        },
        {
          ...baseMetric,
          id: "2",
          metric_name: "ceo",
          value: "Jane",
          static_source_weight: 90,
          ai_confidence_score: 90,
        }, // Trust 90
      ];

      const result = aggregateMetrics(metrics);
      expect(result[0].value).toBe("Jane");
      expect(result[0].is_range).toBe(false);
      expect(result[0].confidence_score).toBe(90);
    });

    it("returns the highest trusted value if variance is <= 5%", () => {
      const metrics: RawDataMetric[] = [
        {
          ...baseMetric,
          id: "1",
          metric_name: "employees",
          value: 100,
          static_source_weight: 40,
          ai_confidence_score: 40,
        },
        {
          ...baseMetric,
          id: "2",
          metric_name: "employees",
          value: 102,
          static_source_weight: 90,
          ai_confidence_score: 90,
        }, // Trust 90
      ];

      // Variance is (102 - 100) / 102 = 0.0196 <= 0.05
      const result = aggregateMetrics(metrics);
      expect(result[0].value).toBe(102);
      expect(result[0].is_range).toBe(false);
      expect(result[0].confidence_score).toBe(90);
    });

    it("returns a range if numeric variance is > 5%", () => {
      const metrics: RawDataMetric[] = [
        {
          ...baseMetric,
          id: "1",
          metric_name: "employees",
          value: 100,
          static_source_weight: 80,
          ai_confidence_score: 80,
        }, // Trust 80
        {
          ...baseMetric,
          id: "2",
          metric_name: "employees",
          value: 200,
          static_source_weight: 90,
          ai_confidence_score: 90,
        }, // Trust 90
      ];

      // Variance is (200 - 100) / 200 = 0.5 > 0.05
      const result = aggregateMetrics(metrics);
      expect(result[0].value).toBe("100 - 200");
      expect(result[0].is_range).toBe(true);
      expect(result[0].min).toBe(100);
      expect(result[0].max).toBe(200);
      expect(result[0].confidence_score).toBe(85); // Average of 80 and 90
    });

    it("handles multiple different metrics simultaneously", () => {
      const metrics: RawDataMetric[] = [
        {
          ...baseMetric,
          id: "1",
          metric_name: "employees",
          value: 100,
          static_source_weight: 80,
          ai_confidence_score: 80,
        },
        {
          ...baseMetric,
          id: "2",
          metric_name: "employees",
          value: 200,
          static_source_weight: 90,
          ai_confidence_score: 90,
        },
        {
          ...baseMetric,
          id: "3",
          metric_name: "ceo",
          value: "Jane",
          static_source_weight: 90,
          ai_confidence_score: 90,
        },
      ];

      const result = aggregateMetrics(metrics);
      expect(result).toHaveLength(2);

      const emp = result.find((r) => r.metric_name === "employees")!;
      expect(emp.is_range).toBe(true);

      const ceo = result.find((r) => r.metric_name === "ceo")!;
      expect(ceo.is_range).toBe(false);
      expect(ceo.value).toBe("Jane");
    });
  });
});
