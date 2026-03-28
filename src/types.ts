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

export interface MLInsight {
  confidenceScore: number; // 0.0 to 1.0
  verbatimQuotes: string[];
  isHumanVerified: boolean;
}

export interface SentimentInsight extends MLInsight {
  id: string;
  competitorId: string;
  featureName: string;
  prevalenceScore: number; // 0.0 to 1.0
  dissatisfactionScore: number; // 0.0 to 1.0
  timestamp: string;
}

export interface JobToBeDone extends MLInsight {
  id: string;
  jobStatement: string;
  importanceScore: number; // 1-10
  currentSatisfactionScore: number; // 1-10
  opportunityScore: number; // Importance + Math.max(Importance - Satisfaction, 0)
  timestamp: string;
}

export interface Assumption extends MLInsight {
  id: string;
  category: "desirability" | "viability" | "feasibility";
  statement: string;
  importanceScore: number; // 1-10
  evidenceStrength: number; // 1-10 (time-decayed)
  timestamp: string;
  linkedEvidenceIds: string[];
}

export interface ValidationCampaign {
  id: string;
  name: string;
  adImpressions: number;
  ctaClicks: number;
  emailCaptures: number;
  purchaseIntent: number;
  calculatedCPAi: number; // Cost Per Acquisition of Intent
  skinInTheGameScore: number; // Aggregate validation score
  timestamp: string;
}

export interface ValueFactor {
  id: string;
  name: string;
  dimension:
    | "price"
    | "usability"
    | "performance"
    | "customization"
    | "support";
  userProductScore: number; // 1-10
  competitorScores: Record<string, number>; // competitorId -> 1-10
  timestamp: string;
}

export interface ExperimentVersion {
  id: string;
  parentInsightId: string;
  parentInsightType:
    | "job_to_be_done"
    | "assumption"
    | "sentiment"
    | "value_curve";
  versionName: string;
  codeSnippet: string;
  deploymentUrl?: string;
  timestamp: string;
}

export interface DeploymentAnalytics {
  id: string;
  linkedVersionId: string;
  adoptionRate: number; // percentage
  conversionCount: number;
  bounceRate: number; // percentage
  dailyActiveUsers: number;
  timestamp: string;
}

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

export type LensConfidence = "High" | "Medium" | "Low";

export interface LensSuggestion {
  id: string;
  type: "feature" | "insight";
  title: string;
  description: string;
  rationale: string;
  confidence: LensConfidence;
}

export interface RejectedSuggestion {
  itemTitle: string;
  reason: string;
  timestamp: number;
}

export interface LensChatMessage {
  id: string;
  role: "lens" | "user";
  text: string;
  suggestions?: LensSuggestion[];
  options?: string[];
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
  features?: string[]; // Adding generic features array for capability gap comparison
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

export type DLQStatus = "pending" | "retrying" | "resolved" | "terminal";

export interface DLQRecord {
  id: string;
  original_record_id?: string;
  job_type: string;
  payload: any;
  error_details: any;
  status: DLQStatus;
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}
