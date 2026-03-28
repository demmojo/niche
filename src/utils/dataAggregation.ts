import { RawDataMetric } from "../types";

export interface ConsolidatedMetric {
  metric_name: string;
  value: any;
  confidence_score: number;
  sources: RawDataMetric[];
  is_range: boolean;
  min?: number;
  max?: number;
  is_pinned?: boolean;
}

export function aggregateMetrics(
  metrics: RawDataMetric[],
): ConsolidatedMetric[] {
  // Group metrics by name
  const grouped: Record<string, RawDataMetric[]> = {};
  for (const m of metrics) {
    if (!grouped[m.metric_name]) {
      grouped[m.metric_name] = [];
    }
    grouped[m.metric_name].push(m);
  }

  const result: ConsolidatedMetric[] = [];

  for (const [metric_name, group] of Object.entries(grouped)) {
    // Check if any metric is pinned
    const pinned = group.find((m) => m.is_pinned);
    if (pinned) {
      result.push({
        metric_name,
        value: pinned.value,
        confidence_score: calculateCombinedTrust(pinned),
        sources: group,
        is_range: false,
        is_pinned: true,
      });
      continue;
    }

    if (group.length === 1) {
      const m = group[0];
      result.push({
        metric_name,
        value: m.value,
        confidence_score: calculateCombinedTrust(m),
        sources: group,
        is_range: false,
      });
      continue;
    }

    // Sort by combined trust score descending
    const sortedGroup = [...group].sort(
      (a, b) => calculateCombinedTrust(b) - calculateCombinedTrust(a),
    );

    // Check if values are numerical to determine if we need a range
    const numericValues = group
      .map((m) => {
        const num = Number(m.value);
        return isNaN(num) ? null : num;
      })
      .filter((v) => v !== null) as number[];

    if (numericValues.length > 1) {
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);

      // Define a "tight threshold" (e.g., 5% variance)
      const variance = (max - min) / (max === 0 ? 1 : max);

      if (variance > 0.05) {
        // High conflict -> return range
        const avgTrust =
          group.reduce((acc, m) => acc + calculateCombinedTrust(m), 0) /
          group.length;
        result.push({
          metric_name,
          value: `${min} - ${max}`,
          confidence_score: Math.round(avgTrust),
          sources: sortedGroup,
          is_range: true,
          min,
          max,
        });
        continue;
      }
    }

    // Consensus or non-numeric: return highest trusted value
    const best = sortedGroup[0];
    result.push({
      metric_name,
      value: best.value,
      confidence_score: calculateCombinedTrust(best),
      sources: sortedGroup,
      is_range: false,
    });
  }

  return result;
}

export function calculateCombinedTrust(metric: RawDataMetric): number {
  const staticWeight = metric.static_source_weight ?? 50;
  const aiScore = metric.ai_confidence_score ?? 50;
  return Math.round((staticWeight + aiScore) / 2);
}
