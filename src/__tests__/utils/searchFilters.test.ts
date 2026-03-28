import { describe, it, expect } from 'vitest';
import { filterCompetitors, filterRawData, filterInsights } from '../../utils/searchFilters';
import { Competitor, DataSource, DerivedInsight } from '../../types';

describe('Search Filters', () => {
  describe('filterCompetitors', () => {
    const mockCompetitors: Competitor[] = [
      {
        id: '1',
        name: 'Competitor A',
        website: 'https://compa.com',
        freeTier: 'Generous',
        spamProtection: 'Yes',
        integrations: ['Slack', 'Zapier'],
        targetAudience: 'Enterprise',
        marketSegments: ['B2B', 'SaaS'],
        dataSovereignty: 'EU only',
        sovereigntyScore: 'high',
        logoUrl: '',
        financialSnapshot: '',
        coreFeatures: ['Forms', 'Workflows'],
        marketCommonalityIndex: 80,
        resourceSimilarityScore: 70,
        howWeCompare: '',
        competitorScore: 50,
        trustScore: 60
      },
      {
        id: '2',
        name: 'Competitor B',
        website: 'https://compb.com',
        freeTier: 'None',
        spamProtection: 'No',
        integrations: ['HubSpot'],
        targetAudience: 'SMB',
        marketSegments: ['B2C'],
        dataSovereignty: 'Global',
        sovereigntyScore: 'low',
        logoUrl: '',
        financialSnapshot: '',
        coreFeatures: ['Surveys'],
        marketCommonalityIndex: 40,
        resourceSimilarityScore: 30,
        howWeCompare: '',
        competitorScore: 50,
        trustScore: 60
      }
    ];

    it('should filter by segment correctly when search is empty', () => {
      const result = filterCompetitors(mockCompetitors, '', 'B2B');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Competitor A');
    });

    it('should return all when segment is All and search is empty', () => {
      const result = filterCompetitors(mockCompetitors, '', 'All');
      expect(result).toHaveLength(2);
    });

    it('should search deeply across multiple properties', () => {
      // Search by name
      expect(filterCompetitors(mockCompetitors, 'Competitor A', 'All')).toHaveLength(1);
      // Search by feature
      expect(filterCompetitors(mockCompetitors, 'Workflows', 'All')).toHaveLength(1);
      // Search by integration
      expect(filterCompetitors(mockCompetitors, 'hubspot', 'All')).toHaveLength(1);
      // Search by target audience
      expect(filterCompetitors(mockCompetitors, 'enterprise', 'All')).toHaveLength(1);
      // Search by data sovereignty
      expect(filterCompetitors(mockCompetitors, 'EU only', 'All')).toHaveLength(1);
    });

    it('should apply both search and segment filter', () => {
      const result = filterCompetitors(mockCompetitors, 'Forms', 'B2B');
      expect(result).toHaveLength(1);

      const resultEmpty = filterCompetitors(mockCompetitors, 'Forms', 'B2C');
      expect(resultEmpty).toHaveLength(0);
    });
  });

  describe('filterRawData', () => {
    const mockSources: DataSource[] = [
      {
        id: '1',
        competitorId: 'comp1',
        type: 'website',
        sourceUrl: 'https://comp1.com/pricing',
        excerpt: 'New pricing starts at $10/mo',
        timestamp: '2023-10-01',
        tags: ['pricing', 'update'],
        confidenceLevel: 'High',
        isDeduced: false,
        source: 'Human'
      },
      {
        id: '2',
        competitorId: 'comp2',
        type: 'news',
        sourceUrl: 'https://news.com/comp2-raised',
        excerpt: 'Comp2 just raised Series A',
        timestamp: '2023-10-02',
        tags: ['funding', 'news'],
        confidenceLevel: 'High',
        isDeduced: false,
        source: 'AI'
      }
    ];

    it('should filter by company', () => {
      expect(filterRawData(mockSources, '', 'comp1', 'all')).toHaveLength(1);
      expect(filterRawData(mockSources, '', 'comp1', 'all')[0].id).toBe('1');
    });

    it('should filter by type', () => {
      expect(filterRawData(mockSources, '', 'all', 'news')).toHaveLength(1);
      expect(filterRawData(mockSources, '', 'all', 'news')[0].id).toBe('2');
    });

    it('should search across excerpt, sourceUrl, type, and tags', () => {
      // Search by tag
      expect(filterRawData(mockSources, 'pricing', 'all', 'all')).toHaveLength(1);
      // Search by excerpt content
      expect(filterRawData(mockSources, 'raised', 'all', 'all')).toHaveLength(1);
      // Search by sourceUrl
      expect(filterRawData(mockSources, 'news.com', 'all', 'all')).toHaveLength(1);
    });
  });

  describe('filterInsights', () => {
    const mockInsights: DerivedInsight[] = [
      {
        id: '1',
        title: 'New API features from Comp A',
        description: 'Comp A released webhooks and GraphQL support',
        category: 'threat',
        impact: 'high',
        source: 'AI',
        timestamp: '2023-10-01',
        sourceIds: []
      },
      {
        id: '2',
        title: 'Pricing Opportunity',
        description: 'Comp B increased their enterprise pricing',
        category: 'opportunity',
        impact: 'critical',
        source: 'Human',
        timestamp: '2023-10-02',
        sourceIds: []
      }
    ];

    it('should filter by source', () => {
      expect(filterInsights(mockInsights, '', 'AI')).toHaveLength(1);
      expect(filterInsights(mockInsights, '', 'AI')[0].id).toBe('1');
    });

    it('should search across title, description, category, impact, and source', () => {
      // Search by title
      expect(filterInsights(mockInsights, 'API', 'All')).toHaveLength(1);
      // Search by description
      expect(filterInsights(mockInsights, 'webhooks', 'All')).toHaveLength(1);
      // Search by category
      expect(filterInsights(mockInsights, 'opportunity', 'All')).toHaveLength(1);
      // Search by impact
      expect(filterInsights(mockInsights, 'critical', 'All')).toHaveLength(1);
    });
  });
});