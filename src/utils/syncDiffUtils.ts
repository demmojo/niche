import { Competitor, SyncDiff } from '../types';

export function createCompetitorDiffs(
  oldComp: Competitor | undefined,
  newComp: Partial<Competitor>,
  entityId: string
): SyncDiff[] {
  const diffs: SyncDiff[] = [];
  const fieldsToCheck = [
    'fundingHistory',
    'headcountGrowth',
    'techStack',
    'seoKeywords',
    'coreFeatures',
    'targetAudience'
  ] as const;

  for (const field of fieldsToCheck) {
    if (newComp[field] !== undefined) {
      const oldValue = oldComp ? oldComp[field] : undefined;
      const newValue = newComp[field];

      // Deep compare stringified to catch array differences (like techStack)
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({
          id: `diff-${entityId}-${field}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
          entityId,
          entityType: 'Competitor',
          field,
          oldValue,
          newValue,
          description: `Update ${field}`
        });
      }
    }
  }

  return diffs;
}

export function filterVerifiedDiffs(diffs: SyncDiff[], verifiedFields: Record<string, boolean> | undefined): SyncDiff[] {
  if (!verifiedFields) return diffs;
  return diffs.filter(diff => !verifiedFields[diff.field]);
}
