import { Competitor, DataSource, DerivedInsight } from '../types';

export const filterCompetitors = (
  competitors: Competitor[],
  searchQuery: string,
  segmentFilter: string
): Competitor[] => {
  return competitors.filter(c => {
    if (!searchQuery) {
      return segmentFilter === 'All' || (c.marketSegments && c.marketSegments.includes(segmentFilter));
    }
    
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.name && c.name.toLowerCase().includes(search)) || 
      (c.website && c.website.toLowerCase().includes(search)) ||
      (c.freeTier && c.freeTier.toLowerCase().includes(search)) ||
      (c.dataSovereignty && c.dataSovereignty.toLowerCase().includes(search)) ||
      (c.marketSegments && c.marketSegments.join(' ').toLowerCase().includes(search)) ||
      (c.targetAudience && c.targetAudience.toLowerCase().includes(search)) ||
      (c.integrations && c.integrations.join(' ').toLowerCase().includes(search)) ||
      (c.coreFeatures && c.coreFeatures.join(' ').toLowerCase().includes(search));
    
    const matchesFilter = segmentFilter === 'All' || 
      (c.marketSegments && c.marketSegments.includes(segmentFilter));
      
    return matchesSearch && matchesFilter;
  });
};

export const filterRawData = (
  sources: DataSource[],
  searchQuery: string,
  companyFilter: string,
  typeFilter: string
): DataSource[] => {
  return sources.filter(s => {
    const matchesCompany = companyFilter === 'all' || s.competitorId === companyFilter;
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    
    if (searchQuery === '') {
      return matchesCompany && matchesType;
    }
    
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (s.excerpt && s.excerpt.toLowerCase().includes(search)) ||
      (s.sourceUrl && s.sourceUrl.toLowerCase().includes(search)) ||
      (s.type && s.type.toLowerCase().includes(search)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(search)));
      
    return matchesCompany && matchesType && matchesSearch;
  });
};

export const filterInsights = (
  insights: DerivedInsight[],
  searchQuery: string,
  sourceFilter: string
): DerivedInsight[] => {
  return insights.filter(i => {
    const matchesFilter = sourceFilter === 'All' || i.source === sourceFilter;
    
    if (searchQuery === '') {
      return matchesFilter;
    }
    
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (i.title && i.title.toLowerCase().includes(search)) ||
      (i.description && i.description.toLowerCase().includes(search)) ||
      (i.category && i.category.toLowerCase().includes(search)) ||
      (i.impact && i.impact.toLowerCase().includes(search)) ||
      (i.source && i.source.toLowerCase().includes(search));
      
    return matchesSearch && matchesFilter;
  });
};
