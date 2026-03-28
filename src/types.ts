export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error" | "loading";
}

export interface DerivedInsight {
  id: string;
  title: string;
  description: string;
  category: "opportunity" | "threat" | "trend";
  impact: "high" | "medium" | "low" | "critical";
  timestamp: string;
  source: "AI" | "Human" | "Brainstorm" | "Exa.ai" | "Crunchbase";
  sourceIds?: string[];
  linkedInsightIds?: string[];
  tags?: string[];
}

export type SourceType =
  | "website"
  | "api"
  | "screenshot"
  | "database"
  | "github"
  | "linkedin"
  | "crunchbase"
  | "news"
  | "gemini-grounding";
export type ConfidenceLevel = "High" | "Medium" | "Low" | "Critical";

export interface DataSource {
  id: string;
  competitorId: string;
  type: SourceType;
  sourceUrl: string;
  excerpt: string;
  timestamp: string;
  tags: string[];
  confidenceLevel: ConfidenceLevel;
  isDeduced: boolean;
  source:
    | "AI"
    | "Human"
    | "Brainstorm"
    | "Apollo.io"
    | "Google Search"
    | "Exa.ai"
    | "Crunchbase";
  linkedInsightIds?: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: "success" | "error" | "pending" | "info" | "warning";
  retryAction?: () => void;
  contextData?: any;
  apiCallDetails?: any;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  suggestedInsight?: {
    title: string;
    description: string;
    category: "opportunity" | "threat" | "trend";
    impact: "low" | "medium" | "high" | "critical";
  };
  insightAdded?: boolean;
}

export type SortField =
  | "name"
  | "freeTier"
  | "spamProtection"
  | "targetAudience"
  | "dataSovereignty"
  | "marketCommonalityIndex"
  | "resourceSimilarityScore"
  | "marketSegments";
export type SortOrder = "asc" | "desc";

export interface Competitor {
  id: string;
  name: string;
  website: string;
  freeTier: string;
  spamProtection: string;
  integrations: string[];
  targetAudience: string;
  marketSegments: string[];
  dataSovereignty: string;
  sovereigntyScore: "low" | "medium" | "high"; // For badge coloring
  logoUrl: string;
  financialSnapshot: string;
  fundingStage?: string;
  estimatedARR?: string;
  estimatedUserBase?: string;
  coreFeatures: string[];
  howWeCompare: string;
  competitorScore: number; // Overall Threat Score
  trustScore: number;
  marketCommonalityIndex?: number; // Academic metric for competitive overlap
  resourceSimilarityScore?: number; // Academic metric for capability overlap
  lastUpdated?: string;

  // Premium Apollo Metrics
  fundingHistory?: string;
  headcountGrowth?: number;
  techStack?: string[];
  seoKeywords?: string[];
  verifiedFields?: Record<string, boolean>;
}

export type SubscriptionTier = "free" | "pro" | "enterprise";

export interface SyncDiff {
  id: string;
  entityId: string;
  entityType: "Competitor" | "MyProduct" | "Insight" | "SystemContext";
  field: string;
  oldValue: any;
  newValue: any;
  description?: string;
}

export interface UserUsage {
  lastSearchTimestamp: string | null;
  searchCountToday: number;
}

export interface FeedbackMessage {
  id: string;
  type: "Bug" | "Feature" | "General" | "Limit Increase Request";
  message: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
}

export interface RawDataRecord {
  id: string;
  source: string;
  payload: any;
  timestamp: string;
  competitorId?: string;
}

export interface RawDataMetric {
  id: string;
  asset_version_id: string;
  logical_asset_id: string;
  metric_name: string;
  value: any;
  source_id?: string;
  ai_confidence_score?: number;
  static_source_weight?: number;
  is_pinned: boolean;
  created_at: string;
}
