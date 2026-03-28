import { describe, it, expect } from 'vitest';
import { createCompetitorDiffs, filterVerifiedDiffs } from '../../utils/syncDiffUtils';
import { Competitor, SyncDiff } from '../../types';

describe('syncDiffUtils', () => {
  const mockOldComp: Competitor = {
    id: 'comp1',
    name: 'Acme',
    website: 'acme.com',
    freeTier: 'Yes',
    spamProtection: 'Yes',
    integrations: [],
    targetAudience: 'SMB',
    marketSegments: [],
    dataSovereignty: 'US',
    sovereigntyScore: 'low',
    logoUrl: '',
    financialSnapshot: '',
    coreFeatures: ['Login'],
    howWeCompare: '',
    competitorScore: 50,
    trustScore: 50,
    fundingHistory: 'Seed ($1M)',
    headcountGrowth: 10,
    techStack: ['React', 'Node'],
    seoKeywords: ['form builder'],
  };

  describe('createCompetitorDiffs', () => {
    it('should generate diffs only for changed fields', () => {
      const newCompData: Partial<Competitor> = {
        fundingHistory: 'Series A ($5M)', // Changed
        targetAudience: 'SMB', // Unchanged
        headcountGrowth: 50, // Changed
      };

      const diffs = createCompetitorDiffs(mockOldComp, newCompData, 'comp1');
      
      expect(diffs).toHaveLength(2);
      expect(diffs.map(d => d.field)).toContain('fundingHistory');
      expect(diffs.map(d => d.field)).toContain('headcountGrowth');
      expect(diffs.map(d => d.field)).not.toContain('targetAudience');

      const fundingDiff = diffs.find(d => d.field === 'fundingHistory');
      expect(fundingDiff?.oldValue).toBe('Seed ($1M)');
      expect(fundingDiff?.newValue).toBe('Series A ($5M)');
      expect(fundingDiff?.entityId).toBe('comp1');
      expect(fundingDiff?.entityType).toBe('Competitor');
    });

    it('should handle array comparisons correctly (techStack)', () => {
      const newCompData: Partial<Competitor> = {
        techStack: ['React', 'Node', 'TypeScript'], // Changed
      };

      const diffs = createCompetitorDiffs(mockOldComp, newCompData, 'comp1');
      expect(diffs).toHaveLength(1);
      expect(diffs[0].field).toBe('techStack');
      expect(diffs[0].oldValue).toEqual(['React', 'Node']);
      expect(diffs[0].newValue).toEqual(['React', 'Node', 'TypeScript']);
    });

    it('should not generate diffs if array items are identical', () => {
      const newCompData: Partial<Competitor> = {
        techStack: ['React', 'Node'], // Unchanged
      };

      const diffs = createCompetitorDiffs(mockOldComp, newCompData, 'comp1');
      expect(diffs).toHaveLength(0);
    });

    it('should handle undefined oldComp (newly discovered competitor)', () => {
      const newCompData: Partial<Competitor> = {
        targetAudience: 'Enterprise',
      };

      const diffs = createCompetitorDiffs(undefined, newCompData, 'comp2');
      expect(diffs).toHaveLength(1);
      expect(diffs[0].oldValue).toBeUndefined();
      expect(diffs[0].newValue).toBe('Enterprise');
    });
  });

  describe('filterVerifiedDiffs', () => {
    const mockDiffs: SyncDiff[] = [
      { id: '1', entityId: 'c1', entityType: 'Competitor', field: 'targetAudience', oldValue: 'A', newValue: 'B' },
      { id: '2', entityId: 'c1', entityType: 'Competitor', field: 'techStack', oldValue: 'A', newValue: 'B' },
      { id: '3', entityId: 'c1', entityType: 'Competitor', field: 'fundingHistory', oldValue: 'A', newValue: 'B' },
    ];

    it('should return all diffs if verifiedFields is undefined or empty', () => {
      expect(filterVerifiedDiffs(mockDiffs, undefined)).toHaveLength(3);
      expect(filterVerifiedDiffs(mockDiffs, {})).toHaveLength(3);
    });

    it('should filter out diffs for fields marked as verified', () => {
      const verifiedFields = {
        targetAudience: true,
        fundingHistory: true,
        techStack: false, // Not verified
      };

      const allowedDiffs = filterVerifiedDiffs(mockDiffs, verifiedFields);
      
      expect(allowedDiffs).toHaveLength(1);
      expect(allowedDiffs[0].field).toBe('techStack'); // Only techStack should pass
    });
  });
});
