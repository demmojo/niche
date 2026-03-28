import React, { useState } from 'react';
import { Table, Download, Search, Filter, ExternalLink, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { withKeyRotation } from '../utils/geminiClient';
import Markdown from 'react-markdown';

interface DataPoint {
  id: string;
  source: string;
  value: string | number;
  timestamp: string;
  confidence: number;
  category: string;
  companies?: string[];
  buySwitchScore?: number;
  competitorAdoption?: number;
  closestCompetitorHasIt?: boolean;
  seoSearchVolume?: number;
  adWordCompetition?: number;
  trendGrowth2Yr?: number;
}

import { Tooltip } from './Tooltip';
import { Plus } from 'lucide-react';

export const DataPointsTable: React.FC<{ type: string, data: any[], featureDetails?: Record<string, string>, setFeatureDetails?: React.Dispatch<React.SetStateAction<Record<string, string>>>, onAddFeatureToProduct?: (featureName: string) => void }> = ({ type, data, featureDetails, setFeatureDetails, onAddFeatureToProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [localFeatureDetails, setLocalFeatureDetails] = useState<Record<string, string>>({});
  const [isLoadingDetails, setIsLoadingDetails] = useState<Record<string, boolean>>({});
  const [featureSort, setFeatureSort] = useState<'need' | 'adoption' | 'name'>('need');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'closest-has' | 'closest-missing'>('all');
  const [isSuggestingFeature, setIsSuggestingFeature] = useState(false);
  const [suggestedFeature, setSuggestedFeature] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [userStories, setUserStories] = useState<Record<string, string>>({});
  const [isGeneratingStories, setIsGeneratingStories] = useState<Record<string, boolean>>({});
  
  const actualFeatureDetails = featureDetails || localFeatureDetails;
  const actualSetFeatureDetails = setFeatureDetails || setLocalFeatureDetails;
  
  // Mock data generation based on type
  const generateMockData = (): DataPoint[] => {
    if (type === 'Competitors Tracked') {
      return data.map((c, i) => ({
        id: c.id,
        source: c.name,
        value: 'Active',
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        confidence: 0.95 + (Math.random() * 0.05),
        category: 'Competitor Profile'
      }));
    } else if (type === 'Recent Pricing Changes') {
      return [
        { id: 'p1', source: 'Typeform', value: '+15% Pro Tier', timestamp: '2026-03-01', confidence: 0.99, category: 'Pricing Page' },
        { id: 'p2', source: 'Jotform', value: 'New Enterprise Tier', timestamp: '2026-02-28', confidence: 0.98, category: 'Press Release' },
        { id: 'p3', source: 'Tally', value: 'No Change', timestamp: '2026-03-10', confidence: 0.99, category: 'Pricing Page' }
      ];
    } else if (type === 'Features Indexed') {
      const closestCompetitor = data.reduce((prev, current) => (prev.marketCommonalityIndex > current.marketCommonalityIndex) ? prev : current, data[0]);

      const featureMap: Record<string, { companies: string[], confidences: number[] }> = {};
      data.forEach(c => {
        if (c.coreFeatures) {
          c.coreFeatures.forEach((f: string) => {
            const normalized = f.trim();
            if (!featureMap[normalized]) {
              featureMap[normalized] = { companies: [], confidences: [] };
            }
            featureMap[normalized].companies.push(c.name);
            featureMap[normalized].confidences.push(0.95 + (Math.random() * 0.05));
          });
        }
      });
      
      return Object.entries(featureMap).map(([name, info], index) => {
        const avgConfidence = info.confidences.reduce((a, b) => a + b, 0) / info.confidences.length;
        
        // Calculate Buy/Switch Score based on recent customer trends, SEO, and ad word usage
        const hash = name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
        const absHash = Math.abs(hash);
        
        // Simulate 1-2 year customer trend growth (-20% to +130%)
        const trendGrowth2Yr = (absHash % 150) - 20; 
        
        // Simulate SEO monthly search volume (1,000 to 50,000)
        const seoSearchVolume = (absHash % 50) * 1000 + 1000; 
        
        // Simulate Ad Word commercial intent / competition (0.0 to 1.0)
        const adWordCompetition = (absHash % 100) / 100; 
        
        // Weighting: 40% Trend, 30% SEO Volume, 30% Ad Word Competition
        const trendScore = Math.max(0, Math.min(100, (trendGrowth2Yr + 20) / 1.5)); // 0-100
        const seoScore = Math.min(100, seoSearchVolume / 500); // 0-100
        const adScore = adWordCompetition * 100; // 0-100
        
        const buySwitchScore = Math.round((trendScore * 0.4) + (seoScore * 0.3) + (adScore * 0.3));
        const competitorAdoption = Math.round((info.companies.length / data.length) * 100);
        const closestCompetitorHasIt = closestCompetitor ? info.companies.includes(closestCompetitor.name) : false;

        return {
          id: `f-${index}`,
          source: info.companies.join(', '),
          value: name,
          timestamp: new Date().toISOString().split('T')[0],
          confidence: avgConfidence,
          category: 'Aggregated Feature',
          companies: info.companies,
          buySwitchScore,
          competitorAdoption,
          closestCompetitorHasIt,
          seoSearchVolume,
          adWordCompetition,
          trendGrowth2Yr
        };
      });
    } else if (type === 'Top Integrations') {
      const integrationCounts: Record<string, number> = {};
      data.forEach(c => {
        if (c.integrations) {
          c.integrations.forEach((i: string) => {
            integrationCounts[i] = (integrationCounts[i] || 0) + 1;
          });
        }
      });
      
      const totalCompetitors = data.length;
      return Object.entries(integrationCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count], index) => ({
          id: `i${index}`,
          source: name,
          value: `${Math.round((count / totalCompetitors) * 100)}% Adoption`,
          timestamp: new Date().toISOString().split('T')[0],
          confidence: 0.95,
          category: count > totalCompetitors / 2 ? 'Market Standard' : 'Niche Integration'
        }));
    }
    return [];
  };

  const tableData = generateMockData();
  let filteredData = tableData.filter(d => 
    d.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.value.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (type === 'Features Indexed') {
    if (featureFilter === 'closest-has') {
      filteredData = filteredData.filter(d => d.closestCompetitorHasIt);
    } else if (featureFilter === 'closest-missing') {
      filteredData = filteredData.filter(d => !d.closestCompetitorHasIt);
    }
  }

  if (sortConfig) {
    filteredData.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof DataPoint];
      let bVal: any = b[sortConfig.key as keyof DataPoint];
      
      if (sortConfig.key === 'companies') {
        aVal = a.companies?.length || 0;
        bVal = b.companies?.length || 0;
      }

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else if (type === 'Features Indexed') {
    filteredData.sort((a, b) => {
      if (featureSort === 'need') {
        return (b.buySwitchScore || 0) - (a.buySwitchScore || 0);
      } else if (featureSort === 'adoption') {
        return (b.competitorAdoption || 0) - (a.competitorAdoption || 0);
      } else {
        return a.value.toString().localeCompare(b.value.toString());
      }
    });
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = async (row: DataPoint) => {
    if (type !== 'Features Indexed') return;
    
    if (expandedRowId === row.id) {
      setExpandedRowId(null);
      return;
    }
    
    setExpandedRowId(row.id);
    
    if (!actualFeatureDetails[row.id]) {
      setIsLoadingDetails(prev => ({ ...prev, [row.id]: true }));
      try {
        const response = await withKeyRotation(async (ai, model) => {
          return await ai.models.generateContent({
            model: model,
            contents: `You are an expert market analyst. Provide a detailed breakdown of the feature "${row.value}" in the context of form builders and data collection tools.

Format your response in Markdown using the exact structure below:

### Overview
(Brief explanation of what the feature is and why it matters in the market)

### Key Sub-features
(Bullet points of common sub-features, capabilities, or technical requirements)

### Company Implementations
(Specific details on how the companies that have this feature implement it: ${row.companies?.join(', ')})

Keep the response concise, professional, and highly readable.`
          });
        });
        actualSetFeatureDetails(prev => ({ ...prev, [row.id]: response.text || 'No details available.' }));
      } catch (error) {
        console.error('Failed to fetch feature details:', error);
        actualSetFeatureDetails(prev => ({ ...prev, [row.id]: 'Failed to load details. Please try again.' }));
      } finally {
        setIsLoadingDetails(prev => ({ ...prev, [row.id]: false }));
      }
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleGenerateStories = async (row: DataPoint) => {
    setIsGeneratingStories(prev => ({ ...prev, [row.id]: true }));
    try {
      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: `You are an expert product manager. Based on the feature "${row.value}", generate a set of user stories and actionable development tasks.
          
Context:
- Feature: ${row.value}
- Buy/Switch Score: ${row.buySwitchScore}/100 (Based on 1-2 year customer trends, SEO, and ad word usage)
- 2-Year Trend Growth: ${row.trendGrowth2Yr}%
- SEO Search Volume: ${row.seoSearchVolume}/mo
- Ad Word Competition: ${row.adWordCompetition} (0.0 - 1.0)
- Competitor Adoption: ${row.competitorAdoption}%
- Closest Competitor Has It: ${row.closestCompetitorHasIt ? 'Yes' : 'No'}

Format your response in Markdown using the exact structure below:

### User Stories
- As a [user type], I want to [action] so that [benefit]

### Development Tasks
- [ ] Task 1
- [ ] Task 2

Keep it concise and actionable.`
        });
      });
      setUserStories(prev => ({ ...prev, [row.id]: response.text || 'No user stories generated.' }));
    } catch (error) {
      console.error('Failed to generate user stories:', error);
      setUserStories(prev => ({ ...prev, [row.id]: 'Failed to generate user stories. Please try again.' }));
    } finally {
      setIsGeneratingStories(prev => ({ ...prev, [row.id]: false }));
    }
  };

  const handleSuggestFeature = async () => {
    setIsSuggestingFeature(true);
    try {
      const response = await withKeyRotation(async (ai, model) => {
        return await ai.models.generateContent({
          model: model,
          contents: `Analyze the following feature data and suggest the next feature we should build to increase customer satisfaction and reduce customer churn. The "buySwitchScore" represents how likely the feature is to convince users to buy or switch to our product, calculated based on recent customer trends (1-2 years), SEO search volume, and ad word usage.
          
Data:
${JSON.stringify(filteredData.slice(0, 50).map(d => ({
  feature: d.value,
  companies: d.companies,
  buySwitchScore: d.buySwitchScore,
  trendGrowth2Yr: d.trendGrowth2Yr,
  seoSearchVolume: d.seoSearchVolume,
  adWordCompetition: d.adWordCompetition,
  competitorAdoption: d.competitorAdoption,
  closestCompetitorHasIt: d.closestCompetitorHasIt
})), null, 2)}

Provide a concise, actionable recommendation in Markdown format.`
        });
      });
      setSuggestedFeature(response.text || 'No suggestion generated.');
    } catch (error) {
      console.error('Failed to suggest feature:', error);
      setSuggestedFeature('Failed to generate suggestion. Please try again.');
    } finally {
      setIsSuggestingFeature(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-ink-dark/30 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-ink-dark/20 bg-paper-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="font-bold text-ink-dark flex items-center gap-2">
          <Table size={18} /> Raw Data Points: {type}
        </h3>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {type === 'Features Indexed' && (
            <>
              <select 
                value={featureSort}
                onChange={(e) => setFeatureSort(e.target.value as any)}
                className="text-sm bg-white border border-ink-dark/30 rounded-md px-2 py-1.5 focus:outline-none focus:border-ink-dark"
              >
                <option value="need">Sort by Buy/Switch Score</option>
                <option value="adoption">Sort by Competitor Adoption</option>
                <option value="name">Sort by Name</option>
              </select>
              <select 
                value={featureFilter}
                onChange={(e) => setFeatureFilter(e.target.value as any)}
                className="text-sm bg-white border border-ink-dark/30 rounded-md px-2 py-1.5 focus:outline-none focus:border-ink-dark"
              >
                <option value="all">All Features</option>
                <option value="closest-has">Closest Competitor Has It</option>
                <option value="closest-missing">Closest Competitor Missing It</option>
              </select>
              <Tooltip content="Let AI recommend the next feature to build based on market gaps" position="top">
                <button 
                  onClick={handleSuggestFeature}
                  disabled={isSuggestingFeature}
                  className="flex items-center gap-2 bg-[#2C2C2C] text-[#F5F3ED] px-3 py-1.5 rounded-md text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSuggestingFeature ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Suggest Feature
                </button>
              </Tooltip>
            </>
          )}
          <div className="relative flex-1 sm:w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dark/40" />
            <input 
              type="text" 
              placeholder="Filter data..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-ink-dark/30 rounded-md focus:outline-none focus:border-ink-dark"
            />
          </div>
          <Tooltip content="Filter Data" position="top">
            <button className="p-1.5 border border-ink-dark/30 rounded-md hover:bg-paper-base text-ink-dark/60">
              <Filter size={16} />
            </button>
          </Tooltip>
          <Tooltip content="Export as CSV" position="top">
            <button className="p-1.5 border border-ink-dark/30 rounded-md hover:bg-paper-base text-ink-dark/60">
              <Download size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {suggestedFeature && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <Sparkles className="text-amber-500 mt-1 flex-shrink-0" size={18} />
            <div className="prose prose-sm max-w-none text-ink-dark">
              <Markdown>{suggestedFeature}</Markdown>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-base/50 text-ink-dark/60 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-ink-dark transition-colors" onClick={() => handleSort(type === 'Features Indexed' ? 'value' : 'source')}>
                <div className="flex items-center gap-1">
                  {type === 'Features Indexed' ? 'Feature' : 'Source'}
                  {sortConfig?.key === (type === 'Features Indexed' ? 'value' : 'source') && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-ink-dark transition-colors" onClick={() => handleSort(type === 'Features Indexed' ? 'companies' : 'value')}>
                <div className="flex items-center gap-1">
                  {type === 'Features Indexed' ? 'Companies' : 'Value / Status'}
                  {sortConfig?.key === (type === 'Features Indexed' ? 'companies' : 'value') && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-ink-dark transition-colors" onClick={() => handleSort(type === 'Features Indexed' ? 'buySwitchScore' : 'category')}>
                <div className="flex items-center gap-1">
                  {type === 'Features Indexed' ? 'Buy/Switch Score' : 'Category'}
                  {sortConfig?.key === (type === 'Features Indexed' ? 'buySwitchScore' : 'category') && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-ink-dark transition-colors" onClick={() => handleSort(type === 'Features Indexed' ? 'competitorAdoption' : 'confidence')}>
                <div className="flex items-center gap-1">
                  {type === 'Features Indexed' ? 'Adoption' : 'Confidence'}
                  {sortConfig?.key === (type === 'Features Indexed' ? 'competitorAdoption' : 'confidence') && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-ink-dark transition-colors" onClick={() => handleSort('timestamp')}>
                <div className="flex items-center gap-1">
                  Last Verified
                  {sortConfig?.key === 'timestamp' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-dark/20">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-dark/40">
                  No data points found matching your filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <React.Fragment key={row.id}>
                  <tr 
                    onClick={() => handleRowClick(row)}
                    className={`hover:bg-paper-base/50 transition-colors ${type === 'Features Indexed' ? 'cursor-pointer' : ''} ${expandedRowId === row.id ? 'bg-paper-base/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-ink-dark">{type === 'Features Indexed' ? row.value : row.source}</td>
                    <td className="px-4 py-3 text-ink-dark/80">
                      {type === 'Features Indexed' ? (
                        <div className="flex flex-wrap gap-1">
                          {row.companies?.slice(0, 3).map((company, i) => (
                            <span key={i} className="px-2 py-0.5 bg-ink-dark/5 rounded text-xs">{company}</span>
                          ))}
                          {row.companies && row.companies.length > 3 && (
                            <span className="px-2 py-0.5 bg-ink-dark/5 rounded text-xs">+{row.companies.length - 3} more</span>
                          )}
                        </div>
                      ) : row.value}
                    </td>
                    <td className="px-4 py-3">
                      {type === 'Features Indexed' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-ink-dark/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${row.buySwitchScore! > 70 ? 'bg-emerald-500' : row.buySwitchScore! > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${row.buySwitchScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ink-dark">{row.buySwitchScore}/100</span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-ink-dark/5 text-ink-dark/70 rounded text-xs">
                          {row.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {type === 'Features Indexed' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-ink-dark/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sky rounded-full"
                              style={{ width: `${row.competitorAdoption}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ink-dark">{row.competitorAdoption}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-ink-dark/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${row.confidence > 0.95 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                              style={{ width: `${row.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-dark/60">{(row.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-dark/60 font-mono text-xs">{row.timestamp}</td>
                    <td className="px-4 py-3 text-right">
                      {type === 'Features Indexed' ? (
                        <div className="flex items-center justify-end gap-2">
                          {onAddFeatureToProduct && (
                            <Tooltip content="Add to Our Product" position="left">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onAddFeatureToProduct(row.value as string); }}
                                className="p-1 text-sky hover:bg-sky/10 rounded transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content={expandedRowId === row.id ? "Collapse details" : "View feature details"} position="left">
                            <button className="text-ink-dark/60 hover:text-ink-dark transition-colors p-1">
                              {expandedRowId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <Tooltip content="Open source link" position="left">
                          <button className="text-sky hover:text-sky/80 transition-colors">
                            <ExternalLink size={14} />
                          </button>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                  {type === 'Features Indexed' && expandedRowId === row.id && (
                    <tr>
                      <td colSpan={6} className="px-0 py-0 border-b-0">
                        <div className="bg-paper-base/30 px-6 py-4 border-t border-ink-dark/10 shadow-inner">
                          {isLoadingDetails[row.id] ? (
                            <div className="flex items-center gap-2 text-ink-dark/60 py-4">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-sm">Analyzing feature details and sub-features...</span>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none text-ink-dark/80">
                              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg border border-ink-dark/10">
                                <div className="flex flex-col">
                                  <span className="text-xs text-ink-dark/60 uppercase tracking-wider font-semibold">Buy/Switch Score</span>
                                  <span className="text-lg font-bold text-ink-dark">{row.buySwitchScore}/100</span>
                                </div>
                                <div className="w-px bg-ink-dark/10 hidden sm:block"></div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-ink-dark/60 uppercase tracking-wider font-semibold">2-Yr Trend Growth</span>
                                  <span className={`text-lg font-bold ${row.trendGrowth2Yr! > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {row.trendGrowth2Yr! > 0 ? '+' : ''}{row.trendGrowth2Yr}%
                                  </span>
                                </div>
                                <div className="w-px bg-ink-dark/10 hidden sm:block"></div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-ink-dark/60 uppercase tracking-wider font-semibold">SEO Search Vol</span>
                                  <span className="text-lg font-bold text-ink-dark">{(row.seoSearchVolume! / 1000).toFixed(1)}k/mo</span>
                                </div>
                                <div className="w-px bg-ink-dark/10 hidden sm:block"></div>
                                <div className="flex flex-col">
                                  <span className="text-xs text-ink-dark/60 uppercase tracking-wider font-semibold">Ad Word Intent</span>
                                  <span className="text-lg font-bold text-ink-dark">{row.adWordCompetition?.toFixed(2)}</span>
                                </div>
                              </div>

                              <h4 className="flex items-center gap-2 text-ink-dark font-semibold mb-2">
                                <Sparkles size={14} className="text-amber-500" />
                                AI Feature Analysis
                              </h4>
                              <Markdown>{actualFeatureDetails[row.id]}</Markdown>
                              
                              <div className="mt-6 pt-6 border-t border-ink-dark/10">
                                {!userStories[row.id] && !isGeneratingStories[row.id] ? (
                                  <Tooltip content="Use AI to generate user stories and tasks for this feature" position="top">
                                    <button 
                                      onClick={() => handleGenerateStories(row)}
                                      className="flex items-center gap-2 bg-paper-base border border-ink-dark/20 text-ink-dark px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-dark/5 transition-colors"
                                    >
                                      <Sparkles size={14} className="text-sky" />
                                      Generate User Stories & Tasks
                                    </button>
                                  </Tooltip>
                                ) : isGeneratingStories[row.id] ? (
                                  <div className="flex items-center gap-2 text-ink-dark/60 py-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">Generating user stories and tasks...</span>
                                  </div>
                                ) : (
                                  <div>
                                    <h4 className="flex items-center gap-2 text-ink-dark font-semibold mb-2">
                                      <Sparkles size={14} className="text-sky" />
                                      User Stories & Tasks
                                    </h4>
                                    <Markdown>{userStories[row.id]}</Markdown>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 border-t border-ink-dark/20 bg-paper-light flex justify-between items-center">
          <div className="text-xs text-ink-dark/60">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content="Go to previous page" position="top">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-ink-dark/20 rounded text-xs text-ink-dark hover:bg-paper-base disabled:opacity-50"
              >
                Previous
              </button>
            </Tooltip>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 flex items-center justify-center rounded text-xs ${currentPage === i + 1 ? 'bg-ink-dark text-paper-light' : 'text-ink-dark hover:bg-paper-base'}`}
              >
                {i + 1}
              </button>
            ))}
            <Tooltip content="Go to next page" position="top">
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-ink-dark/20 rounded text-xs text-ink-dark hover:bg-paper-base disabled:opacity-50"
              >
                Next
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
