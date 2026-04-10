import {
  useFounderActiveProductId,
  useFounderProducts,
} from "./FounderProvider";
import { SyncReviewModal } from "./SyncReviewModal";
import { DashboardExtensions } from "./DashboardExtensions";
import { InsightEngineChat } from "./InsightEngineChat";
import { CompetitorDiscoveryModal } from "./CompetitorDiscoveryModal";
import { OnboardingWizard } from "./OnboardingWizard";
import { useUserProfile } from "../hooks/useUserProfile";
import { JsonViewer } from "./JsonViewer";
import { DataSourceCard } from "./DataSourceCard";
import { dictionary, tMessage } from "../content/dictionary";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSyncQueue } from "../hooks/useSyncQueue";
import { useSafeAITask } from "../hooks/useSafeAITask";
import { useTaxonomySync } from "../hooks/useTaxonomySync";
import {
  createCompetitorDiffs,
  filterVerifiedDiffs,
} from "../utils/syncDiffUtils";
import {
  Radar as RechartsRadar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ZAxis,
  ReferenceLine,
  Label,
} from "recharts";

import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db, auth, safeDisableNetwork } from "../firebase";
import {
  LayoutDashboard,
  TableProperties,
  Lightbulb,
  Settings,
  Search,
  Download,
  Sparkles,
  ArrowUpDown,
  ShieldAlert,
  GlobeLock,
  Zap,
  Users,
  Database,
  Archive,
  MessageSquare,
  Image as ImageIcon,
  Github,
  Send,
  Loader2,
  ArrowLeft,
  Target,
  DollarSign,
  Radar,
  ShieldCheck,
  RefreshCw,
  FileText,
  Copy,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Unlock,
  Info,
  Maximize2,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Play,
  Newspaper,
  Clock,
  Link as LinkIcon,
  ExternalLink,
  Network,
  Edit2,
  Trash2,
  HelpCircle,
  Combine,
  Upload,
  Package,
  AlertTriangle,
  LayoutTemplate,
} from "lucide-react";
import { getCustomApiKey } from "../utils/apiKeys";
import { trackRequest, updateRateLimits } from "../utils/usageTracker";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { withModelFallback } from "../utils/aiClient";
import { getErrorMessage } from "../utils/errorHandler";
import {
  filterCompetitors,
  filterRawData,
  filterInsights,
} from "../utils/searchFilters";
import Markdown from "react-markdown";
import { InsightQuestModal } from "./InsightQuestModal";
import { InsightGeneratorModal } from "./InsightGeneratorModal";
import LensStrategyConsole from "./lens/LensStrategyConsole";
import { VisualWhiteboard } from "./whiteboard/VisualWhiteboard";
import { StrategyToolbox } from "./StrategyToolbox";
import { useVisualKnowledgeStore } from "../store/visualKnowledgeStore";
import { Settings as SettingsComponent } from "./Settings";
import { MarketShiftBanner } from "./MarketShiftBanner";
import { ComputeMeter } from "./ComputeMeter";
import { TarpitWarningModal } from "./TarpitWarningModal";
import { useActionCredits } from "../hooks/useActionCredits";
import { SupportHelpPage } from "./SupportHelpPage";
import { SuperadminDashboard } from "./SuperadminDashboard";
import { DLQViewer } from "./DLQViewer";
import { LimitReachedModal } from "./LimitReachedModal";
import { RateLimitModal } from "./RateLimitModal";
import { checkAlphaLimit, recordAlphaUsage } from "../utils/alphaUsageLimiter";
import { Heart } from "lucide-react";

import { MarketValueNotebook } from "./MarketValueNotebook";
import { RapidPdlcWorkflow } from "./RapidPdlcWorkflow";
import { DataPointsTable } from "./DataPointsTable";
import { HeadToHeadComparison } from "./HeadToHeadComparison";
import { UnifiedIdeationEngine } from "./ideation/UnifiedIdeationEngine";
import { PivotSimulator } from "./PivotSimulator";
import { MyProduct, MyProductData } from "./MyProduct";
import { useAuth } from "./AuthProvider";
import { InsightBrainstormModal } from "./InsightBrainstormModal";
import { PageGuideModal } from "./PageGuideModal";
import { UploadDataModal } from "./UploadDataModal";
import { ConsolidateFeaturesModal } from "./ConsolidateFeaturesModal";
import { TaxonomyMergeModal } from "./TaxonomyMergeModal";

import { GlobalProgressBanner } from "./GlobalProgressBanner";
import { Tooltip } from "./Tooltip";
import ExportButton from "./ExportButton";
import { ProductSwitcher } from "./ProductSwitcher";
import {
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceDispatch,
  useWorkspaceLoading,
} from "./WorkspaceProvider";
import { useFounderActiveProductDispatch } from "./FounderProvider";
import { useSuperadminBootstrap } from "./useSuperadminBootstrap";
import {
  Toast,
  DerivedInsight,
  SourceType,
  ConfidenceLevel,
  DataSource,
  LogEntry,
  ChatMessage,
  SortField,
  SortOrder,
  Competitor,
} from "../types";

// --- Initial Data ---

const initialRawDataSources: DataSource[] = [
  {
    id: "src-1",
    competitorId: "1",
    type: "website",
    sourceUrl: "https://typeform.com/pricing",
    excerpt:
      '{\n "tier": "Basic",\n "price": 25,\n "limits": {\n "responses": 100,\n "users": 1\n }\n}',
    timestamp: "2026-03-10T14:22:00Z",
    tags: ["pricing", "limits"],
    confidenceLevel: "High",
    isDeduced: false,
    source: "AI" as const,
    linkedInsightIds: ["di-2"],
  },
  {
    id: "src-2",
    competitorId: "2",
    type: "api",
    sourceUrl: "GET api.jotform.com/v1/user/settings",
    excerpt:
      '{\n "hipaa_compliance": true,\n "eu_datacenter": true,\n "dedicated_server": "enterprise_only"\n}',
    timestamp: "2026-03-09T09:15:00Z",
    tags: ["compliance", "infrastructure"],
    confidenceLevel: "High",
    isDeduced: false,
    source: "AI",
  },
  {
    id: "src-3",
    competitorId: "3",
    type: "github",
    sourceUrl: "github.com/tallyforms/discussions",
    excerpt:
      '> User: "Can I self-host Tally?"\n> Maintainer: "Currently, we do not offer a self-hosted version. We are fully managed on AWS EU."\n// Opportunity: Strong demand for self-hosting ignored.',
    timestamp: "2026-03-11T11:05:00Z",
    tags: ["self-hosting", "community"],
    confidenceLevel: "Medium",
    isDeduced: true,
    source: "Human" as const,
    linkedInsightIds: ["di-1"],
  },
  {
    id: "src-4",
    competitorId: "1",
    type: "screenshot",
    sourceUrl: "https://picsum.photos/seed/tf-builder/800/600",
    excerpt:
      "[Image Analysis]\nUI is highly polished but relies heavily on client-side JS. Logic jumps are complex to configure for >50 steps. No native Postgres export visible.",
    timestamp: "2026-03-10T15:30:00Z",
    tags: ["ui/ux", "features"],
    confidenceLevel: "Medium",
    isDeduced: true,
    source: "AI",
  },
];

const initialDerivedInsights = [
  {
    id: "di-1",
    title: "Self-Hosting Demand Surging",
    description:
      "Analysis of GitHub discussions and recent pricing changes indicates a 40% increase in enterprise demand for self-hosted form solutions to comply with new EU data regulations.",
    category: "opportunity" as const,
    impact: "high" as const,
    timestamp: new Date().toISOString(),
    source: "AI" as const,
    sourceIds: ["src-3"],
  },
  {
    id: "di-2",
    title: "Aggressive Pricing from Tally",
    description:
      "Tally has introduced a new generous free tier that might capture the lower-end of our target market. We need to emphasize our enterprise features to differentiate.",
    category: "threat" as const,
    impact: "medium" as const,
    timestamp: new Date().toISOString(),
    source: "Human" as const,
    sourceIds: ["src-1"],
  },
];

const initialCompetitors: Competitor[] = [
  {
    id: "1",
    name: "Typeform",
    website: "typeform.com",
    freeTier: "10 responses/mo",
    spamProtection: "Basic reCAPTCHA",
    integrations: ["Zapier", "HubSpot", "Salesforce", "Slack"],
    targetAudience: "Marketers, SMBs",
    marketSegments: ["SMB", "Marketing", "Agency"],
    dataSovereignty: "US/EU Hosted (No Self-Host)",
    sovereigntyScore: "low",
    logoUrl: "https://picsum.photos/seed/typeform/200/200",
    financialSnapshot: "Series C, $187M total funding. Est. $70M ARR.",
    fundingStage: "Series C",
    estimatedARR: "$65M - $75M (95% CI)",
    estimatedUserBase: "120K - 150K active users (95% CI)",
    coreFeatures: ["Conversational UI", "Logic Jumps", "Templates", "VideoAsk"],
    howWeCompare:
      "We win on data sovereignty and self-hosting. They win on brand recognition and template variety. Their pricing scales poorly for high-volume enterprise.",
    competitorScore: 85,
    trustScore: 92,
    marketCommonalityIndex: 65,
    resourceSimilarityScore: 40,
  },
  {
    id: "2",
    name: "Jotform",
    website: "jotform.com",
    freeTier: "100 responses/mo",
    spamProtection: "reCAPTCHA, Custom limits",
    integrations: ["PayPal", "Google Sheets", "Zoom", "Salesforce"],
    targetAudience: "Healthcare, Enterprise",
    marketSegments: ["Enterprise", "Healthcare", "Education"],
    dataSovereignty: "US/EU, Dedicated Enterprise",
    sovereigntyScore: "medium",
    logoUrl: "https://picsum.photos/seed/jotform/200/200",
    financialSnapshot: "Bootstrapped. Est. $100M+ ARR.",
    fundingStage: "Bootstrapped",
    estimatedARR: "$90M - $110M (95% CI)",
    estimatedUserBase: "15M - 20M registered users (95% CI)",
    coreFeatures: [
      "HIPAA Compliance",
      "PDF Editor",
      "Payment Integrations",
      "Approvals",
    ],
    howWeCompare:
      "Jotform is feature-heavy but cluttered. We offer a cleaner, developer-first API and true cloud-agnostic deployment, whereas they lock you into their enterprise servers.",
    competitorScore: 78,
    trustScore: 88,
    marketCommonalityIndex: 80,
    resourceSimilarityScore: 60,
  },
  {
    id: "3",
    name: "Tally",
    website: "tally.so",
    freeTier: "Unlimited (5% fee)",
    spamProtection: "Basic",
    integrations: ["Notion", "Airtable", "Make", "Slack"],
    targetAudience: "Creators, Startups",
    marketSegments: ["Creators", "Startups", "Indie Hackers"],
    dataSovereignty: "EU Hosted (No Self-Host)",
    sovereigntyScore: "low",
    logoUrl: "https://picsum.photos/seed/tally/200/200",
    financialSnapshot: "Bootstrapped, highly profitable indie hacker team.",
    fundingStage: "Bootstrapped",
    estimatedARR: "$1.5M - $2.5M (95% CI)",
    estimatedUserBase: "80K - 100K active users (95% CI)",
    coreFeatures: [
      "Notion-like UI",
      "Generous Free Tier",
      "Custom Domains",
      "Calculator",
    ],
    howWeCompare:
      "Tally is great for creators, but lacks enterprise-grade data sovereignty and self-hosting. We target the mid-market/enterprise segment they ignore.",
    competitorScore: 65,
    trustScore: 75,
    marketCommonalityIndex: 30,
    resourceSimilarityScore: 25,
  },
  {
    id: "5",
    name: "Formbricks",
    website: "formbricks.com",
    freeTier: "Generous Open Source",
    spamProtection: "Basic",
    integrations: ["Slack", "Notion", "Zapier", "Webhooks"],
    targetAudience: "Developers, Product Teams",
    marketSegments: ["Developers", "Product", "SaaS"],
    dataSovereignty: "Self-Hosted, Cloud",
    sovereigntyScore: "high",
    logoUrl: "https://picsum.photos/seed/formbricks/200/200",
    financialSnapshot: "Seed funded. Open source model.",
    fundingStage: "Seed",
    estimatedARR: "$500K - $1M (95% CI)",
    estimatedUserBase: "10K - 15K active instances (95% CI)",
    coreFeatures: [
      "Open Source",
      "In-App Surveys",
      "Link Surveys",
      "Data Privacy",
    ],
    howWeCompare:
      "Formbricks is our closest open-source competitor. They focus heavily on in-app micro-surveys for product teams, while we focus on robust, complex data collection and headless forms for enterprise.",
    competitorScore: 82,
    trustScore: 85,
    marketCommonalityIndex: 90,
    resourceSimilarityScore: 85,
  },
  {
    id: "6",
    name: "Feathery",
    website: "feathery.io",
    freeTier: "100 submissions/mo",
    spamProtection: "reCAPTCHA",
    integrations: ["Plaid", "Stripe", "Segment", "Firebase"],
    targetAudience: "Fintech, Healthcare, Product",
    marketSegments: ["Fintech", "Healthcare", "Enterprise"],
    dataSovereignty: "US Hosted, SOC2",
    sovereigntyScore: "medium",
    logoUrl: "https://picsum.photos/seed/feathery/200/200",
    financialSnapshot: "Series A, backed by top VCs.",
    fundingStage: "Series A",
    estimatedARR: "$8M - $12M (95% CI)",
    estimatedUserBase: "40K - 60K active users (95% CI)",
    coreFeatures: [
      "Advanced Logic",
      "Developer SDKs",
      "Native Integrations",
      "White-label",
    ],
    howWeCompare:
      "Feathery targets the same complex use cases (Fintech/Health) but lacks true self-hosting. Their developer SDKs are strong, but KageForm's headless architecture is more flexible.",
    competitorScore: 88,
    trustScore: 90,
    marketCommonalityIndex: 95,
    resourceSimilarityScore: 75,
  },
  {
    id: "7",
    name: "Fillout",
    website: "fillout.com",
    freeTier: "1000 responses/mo",
    spamProtection: "Turnstile",
    integrations: ["Airtable", "Notion", "Salesforce", "Supabase"],
    targetAudience: "Operations, SMBs",
    marketSegments: ["Operations", "SMB", "No-Code"],
    dataSovereignty: "US Hosted",
    sovereigntyScore: "low",
    logoUrl: "https://picsum.photos/seed/fillout/200/200",
    financialSnapshot: "Seed funded, rapid growth.",
    fundingStage: "Seed",
    estimatedARR: "$2M - $4M (95% CI)",
    estimatedUserBase: "20K - 30K active users (95% CI)",
    coreFeatures: [
      "Airtable Native",
      "Update Records",
      "Multi-page",
      "Calculations",
    ],
    howWeCompare:
      "Fillout is excellent for Airtable/Notion power users. They are less focused on developer APIs and self-hosting, making them less of a threat in the enterprise data sovereignty space.",
    competitorScore: 70,
    trustScore: 82,
    marketCommonalityIndex: 45,
    resourceSimilarityScore: 50,
  },
  {
    id: "8",
    name: "Qualtrics",
    website: "qualtrics.com",
    freeTier: "Very limited trial",
    spamProtection: "Enterprise-grade",
    integrations: ["SAP", "Salesforce", "Adobe", "Marketo"],
    targetAudience: "Enterprise, Research",
    marketSegments: ["Enterprise", "Research", "CX"],
    dataSovereignty: "Global Data Centers, FedRAMP",
    sovereigntyScore: "high",
    logoUrl: "https://picsum.photos/seed/qualtrics/200/200",
    financialSnapshot: "Public/Acquired. Billions in revenue.",
    fundingStage: "Public",
    estimatedARR: "$1.2B - $1.4B (95% CI)",
    estimatedUserBase: "100M+ active users (95% CI)",
    coreFeatures: [
      "Experience Management",
      "Advanced Stats",
      "Text iQ",
      "Conjoint Analysis",
    ],
    howWeCompare:
      "Qualtrics is the legacy enterprise giant. They are extremely expensive and slow to implement. We offer a modern, developer-friendly alternative for data collection at a fraction of the cost, though we lack their advanced statistical analysis suite.",
    competitorScore: 95,
    trustScore: 98,
    marketCommonalityIndex: 70,
    resourceSimilarityScore: 30,
  },
  {
    id: "9",
    name: "Paperform",
    website: "paperform.co",
    freeTier: "14-day trial",
    spamProtection: "reCAPTCHA",
    integrations: ["Stripe", "Zapier", "Mailchimp", "Slack"],
    targetAudience: "Small Businesses, Agencies",
    marketSegments: ["SMB", "E-commerce", "Agency"],
    dataSovereignty: "US Hosted",
    sovereigntyScore: "low",
    logoUrl: "https://picsum.photos/seed/paperform/200/200",
    financialSnapshot: "Bootstrapped, profitable.",
    fundingStage: "Bootstrapped",
    estimatedARR: "$4M - $6M (95% CI)",
    estimatedUserBase: "50K - 70K active users (95% CI)",
    coreFeatures: [
      "Doc-style Editor",
      "Payments",
      "Calculations",
      "Appointments",
    ],
    howWeCompare:
      "Paperform is highly visual and doc-like, great for simple e-commerce or booking flows. They lack the enterprise security and self-hosting capabilities we offer.",
    competitorScore: 60,
    trustScore: 80,
    marketCommonalityIndex: 40,
    resourceSimilarityScore: 35,
  },
  {
    id: "10",
    name: "Formsort",
    website: "formsort.com",
    freeTier: "Developer sandbox",
    spamProtection: "Custom",
    integrations: ["Segment", "BigQuery", "Redshift", "Salesforce"],
    targetAudience: "Product Teams, Growth",
    marketSegments: ["Enterprise", "Fintech", "Healthcare"],
    dataSovereignty: "US Hosted, SOC2, HIPAA",
    sovereigntyScore: "medium",
    logoUrl: "https://picsum.photos/seed/formsort/200/200",
    financialSnapshot: "Venture backed.",
    fundingStage: "Series A",
    estimatedARR: "$15M - $25M (95% CI)",
    estimatedUserBase: "80K - 120K active users (95% CI)",
    coreFeatures: [
      "Flow Builder",
      "A/B Testing",
      "Native Analytics",
      "Engineering-focused",
    ],
    howWeCompare:
      "Formsort is a direct competitor for complex, high-conversion flows (like onboarding). They focus heavily on A/B testing and analytics. We win on pure data sovereignty and self-hosting.",
    competitorScore: 85,
    trustScore: 88,
    marketCommonalityIndex: 85,
    resourceSimilarityScore: 70,
  },
  {
    id: "11",
    name: "HeyForm",
    website: "heyform.net",
    freeTier: "Unlimited forms, limited responses",
    spamProtection: "Basic",
    integrations: ["Zapier", "Webhooks"],
    targetAudience: "Individuals, SMBs",
    marketSegments: ["SMB", "Creators"],
    dataSovereignty: "Cloud Hosted",
    sovereigntyScore: "low",
    logoUrl: "https://picsum.photos/seed/heyform/200/200",
    financialSnapshot: "Early stage.",
    fundingStage: "Seed",
    estimatedARR: "$100K - $300K (95% CI)",
    estimatedUserBase: "2K - 5K active users (95% CI)",
    coreFeatures: ["Conversational UI", "Templates", "Basic Logic"],
    howWeCompare:
      "HeyForm is a lower-cost alternative to Typeform. They are not a threat in the enterprise or developer-first space.",
    competitorScore: 40,
    trustScore: 60,
    marketCommonalityIndex: 20,
    resourceSimilarityScore: 20,
  },
  {
    id: "12",
    name: "SurveyMonkey",
    website: "surveymonkey.com",
    freeTier: "Basic (very limited)",
    spamProtection: "Standard",
    integrations: ["Salesforce", "Marketo", "HubSpot", "Microsoft Teams"],
    targetAudience: "Enterprise, SMBs, Education",
    marketSegments: ["Enterprise", "Education", "Market Research"],
    dataSovereignty: "Cloud Hosted (US/EU options)",
    sovereigntyScore: "medium",
    logoUrl: "https://picsum.photos/seed/surveymonkey/200/200",
    financialSnapshot: "Public company (Momentive), massive scale.",
    fundingStage: "Public",
    estimatedARR: "$450M - $550M (95% CI)",
    estimatedUserBase: "20M - 25M active users (95% CI)",
    coreFeatures: [
      "Survey Logic",
      "Audience Panels",
      "Advanced Analytics",
      "Enterprise Security",
    ],
    howWeCompare:
      "SurveyMonkey is a massive incumbent focused on surveys and market research rather than operational forms or developer workflows. We offer better developer tools and self-hosting.",
    competitorScore: 80,
    trustScore: 95,
    marketCommonalityIndex: 50,
    resourceSimilarityScore: 40,
  },
  {
    id: "13",
    name: "Cognito Forms",
    website: "cognitoforms.com",
    freeTier: "Individual (generous)",
    spamProtection: "reCAPTCHA",
    integrations: ["Zapier", "Microsoft Power Automate", "Stripe", "Square"],
    targetAudience: "SMBs, Non-profits, Healthcare",
    marketSegments: ["SMB", "Healthcare", "Non-profit"],
    dataSovereignty: "US Hosted, HIPAA compliant",
    sovereigntyScore: "medium",
    logoUrl: "https://picsum.photos/seed/cognitoforms/200/200",
    financialSnapshot: "Bootstrapped, highly profitable.",
    fundingStage: "Bootstrapped",
    estimatedARR: "$12M - $18M (95% CI)",
    estimatedUserBase: "150K - 200K active users (95% CI)",
    coreFeatures: [
      "Calculations",
      "Repeating Sections",
      "Document Generation",
      "HIPAA Compliance",
    ],
    howWeCompare:
      "Cognito Forms is very powerful for complex data collection and calculations, often used in healthcare. They lack a modern developer API and self-hosting, which is our edge.",
    competitorScore: 75,
    trustScore: 90,
    marketCommonalityIndex: 60,
    resourceSimilarityScore: 30,
  },
  {
    id: "4",
    name: "KageForm (Us)",
    website: "kageform.com",
    freeTier: "Generous Community Tier",
    spamProtection: "Enterprise-grade, AI filtering",
    integrations: ["Webhooks", "Postgres", "Redis", "Custom API"],
    targetAudience: "Enterprise, Health, Research",
    marketSegments: ["Enterprise", "Healthcare", "Developers"],
    dataSovereignty: "Any Cloud, Air-Gapped, Self-Hosted",
    sovereigntyScore: "high",
    logoUrl: "https://picsum.photos/seed/kageform/200/200",
    financialSnapshot: "Pre-seed. Seeking initial funding/grants.",
    fundingStage: "Pre-seed",
    estimatedARR: "$0 - $50K (95% CI)",
    estimatedUserBase: "0 - 100 active users (95% CI)",
    coreFeatures: [
      "Cloud-Agnostic",
      "Self-Hosted",
      "Developer-First API",
      "Headless Mode",
    ],
    howWeCompare: "N/A - This is us.",
    competitorScore: 0,
    trustScore: 100,
    marketCommonalityIndex: 100,
    resourceSimilarityScore: 100,
  },
];

// --- Components ---
export function DeepValidationButton({
  isSyncing,
  syncProgress,
  handleGlobalSync,
  setShowSyncInfo,
}: any) {
  return (
    <div className="relative group inline-flex items-center justify-center">
      <button
        onClick={() => handleGlobalSync(1)}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-xl text-sm font-sans font-black uppercase tracking-wider hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300 ${
          isSyncing ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing
          ? `Running Campaign... (${syncProgress}%)`
          : "Run Deep Validation Campaign"}
      </button>

      {/* Tooltip */}
      <div className="absolute top-full right-0 mt-2 w-72 p-3 bg-paper-card rounded-2xl shadow-xl border border-ink-dark/20 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <p className="text-sm text-ink-dark mb-2">
          {isSyncing
            ? `Validation in progress. Extracted ${syncProgress}% of competitor profiles.`
            : "Launch a heavy validation campaign to enrich all competitors and calculate market saturation (Tarpit Risk)."}
        </p>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-dark/10">
          <span className="text-xs font-bold text-ink-dark/70">
            COST: 1 ACTION CREDIT
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSyncInfo(true);
            }}
            className="text-xs font-bold text-sky hover:underline pointer-events-auto"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

const renderIntegrations = (integrationsStr: string) => {
  const integrations = integrationsStr.split(",").map((i) => i.trim());
  const domainMap: Record<string, string> = {
    salesforce: "salesforce.com",
    zapier: "zapier.com",
    notion: "notion.so",
    stripe: "stripe.com",
    slack: "slack.com",
    hubspot: "hubspot.com",
    airtable: "airtable.com",
    mailchimp: "mailchimp.com",
    marketo: "marketo.com",
    segment: "segment.com",
    "google workspace": "workspace.google.com",
    "microsoft teams": "microsoft.com",
    supabase: "supabase.com",
    firebase: "firebase.google.com",
    plaid: "plaid.com",
    bigquery: "cloud.google.com",
    redshift: "aws.amazon.com",
    adobe: "adobe.com",
    sap: "sap.com",
    square: "squareup.com",
    paypal: "paypal.com",
    "google sheets": "google.com",
    zoom: "zoom.us",
    make: "make.com",
    "microsoft power automate": "microsoft.com",
    postgres: "postgresql.org",
    redis: "redis.io",
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mt-1 mb-1">
      {integrations.map((name, idx) => {
        const domain = domainMap[name.toLowerCase()];
        if (domain) {
          return (
            <div
              key={idx}
              className="group relative flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-ink-dark/10 shadow-sm hover:shadow-md transition-all"
            >
              <img
                src={`https://icon.horse/icon/${domain}`}
                alt={name}
                className="w-6 h-6 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-ink-dark text-paper-light text-[10px] rounded whitespace-nowrap z-20">
                {name}
              </div>
            </div>
          );
        }
        return (
          <span
            key={idx}
            className="px-2.5 py-1.5 bg-paper-base border border-ink-dark/20 rounded-lg text-xs font-semibold text-ink-dark shadow-sm"
          >
            {name}
          </span>
        );
      })}
    </div>
  );
};

const getWorkspaceId = () => {
  const params = new URLSearchParams(window.location.search);
  let wid = params.get("w");
  if (!wid) {
    wid = Math.random().toString(36).substring(2, 15);
    params.set("w", wid);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }
  return wid;
};

const WORKSPACE_ID = getWorkspaceId();

/**
 * Custom hook that manages state synchronization between React, \`localStorage\`, and Firestore.
 *
 * @description
 * Returns a stateful value and an updater function. The UI updates optimistically.
 * A debounced 2000ms timeout wraps both the \`localStorage\` write and the Firebase \`setDoc\`
 * call to prevent main-thread blocking during rapid user input (e.g., typing in a chat).
 *
 * @param key - The unique string key used for both \`localStorage\` and the Firestore document ID.
 * @param initialValue - The initial fallback value.
 * @returns A tuple: \`[currentState, setterFunction]\`
 *
 * @throws Catches and logs \`localStorage\` quota exceeded errors, as well as Firebase network errors.
 *
 * @example
 * \`\`\`tsx
 * const [chatInput, setChatInput] = useLocalStorage<string>("chat_draft_1", "");
 * \`\`\`
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const dirtyKey = `${WORKSPACE_ID}_${key}_dirty`;

  // Initialize from localStorage for immediate render, then sync with Firebase
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(`${WORKSPACE_ID}_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const stateRef = useRef<T>(storedValue);
  stateRef.current = storedValue;

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip remote sync if mock_auth or demo mode
    if (
      window.location.search.includes("demo_data=true") ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    ) {
      return;
    }

    const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", key);

    // Check if we have pending local changes to sync on mount
    const isDirty = window.localStorage.getItem(dirtyKey) === "true";
    if (isDirty) {
      const firebaseValue =
        storedValue === undefined
          ? null
          : JSON.parse(JSON.stringify(storedValue));
      setDoc(docRef, { value: firebaseValue }, { merge: true })
        .then(() => {
          window.localStorage.removeItem(dirtyKey);
        })
        .catch((err) => {
          console.error(`Failed to sync pending changes for ${key}:`, err);
          if (err.code === "resource-exhausted") {
            safeDisableNetwork();
          }
        });
    }

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }

        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }

        // If we have unsynced local changes, don't overwrite them with older server data
        if (window.localStorage.getItem(dirtyKey) === "true") {
          return;
        }

        if (docSnap.exists()) {
          const data = docSnap.data().value as T;
          setStoredValue(data);
          try {
            window.localStorage.setItem(
              `${WORKSPACE_ID}_${key}`,
              JSON.stringify(data),
            );
          } catch (e) {}
        } else {
          // Initialize Firebase with local data if it doesn't exist
          const firebaseValue =
            storedValue === undefined
              ? null
              : JSON.parse(JSON.stringify(storedValue));
          setDoc(docRef, { value: firebaseValue }, { merge: true }).catch(
            (err) => {
              if (err.code === "resource-exhausted") {
                safeDisableNetwork();
              }
            },
          );
        }
      },
      (error: any) => {
        console.error(`Error syncing ${key} from Firebase:`, error);
        if (error.code === "resource-exhausted") {
          safeDisableNetwork();
        }
      },
    );

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [key]); // Removed storedValue from deps to avoid re-triggering onSnapshot setup

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue =
      value instanceof Function ? value(stateRef.current) : value;

    try {
      window.localStorage.setItem(
        `${WORKSPACE_ID}_${key}`,
        JSON.stringify(newValue),
      );
      window.localStorage.setItem(dirtyKey, "true");
    } catch (e) {}

    // Skip remote sync if mock_auth or demo mode
    if (
      window.location.search.includes("demo_data=true") ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    ) {
      setStoredValue(newValue);
      stateRef.current = newValue;
      return;
    }

    // Debounce the Firebase write by 2 seconds to save quota
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", key);
      const firebaseValue =
        newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));

      setDoc(docRef, { value: firebaseValue }, { merge: true })
        .then(() => {
          window.localStorage.removeItem(dirtyKey);
        })
        .catch((err) => {
          console.error(
            `Error saving ${key} to Firebase (saved locally):`,
            err,
          );
          if (err.code === "resource-exhausted") {
            safeDisableNetwork();
          }
        });
    }, 2000);

    stateRef.current = newValue;
    setStoredValue(newValue);
  };

  return [storedValue, setValue];
}

// Allow mocking of useMigratedFirestoreDoc
export function useMigratedFirestoreDoc<T>(
  legacyKey: string,
  newKey: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [migratedInitialValue] = useState<T>(() => {
    try {
      const legacyItem = window.localStorage.getItem(
        `${WORKSPACE_ID}_${legacyKey}`,
      );
      if (legacyItem) {
        return JSON.parse(legacyItem) as T;
      }
    } catch (e) {}
    return initialValue;
  });

  useEffect(() => {
    // Clean up the legacy key after checking it
    try {
      window.localStorage.removeItem(`${WORKSPACE_ID}_${legacyKey}`);
    } catch (e) {}
  }, [legacyKey]);

  return useFirestoreDoc(newKey, migratedInitialValue);
}

export function useFirestoreDoc<T>(
  key: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [data, setData] = useState<T>(initialValue);
  const dataRef = useRef<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce timeout ref to batch rapid writes and save quota
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip remote sync if demo mode is active
    if (
      window.location.search.includes("demo_data=true") ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true") ||
      process.env.NODE_ENV === "test"
    ) {
      setIsInitialized(true);
      return;
    }

    const controller = new AbortController();
    const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", key);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (controller.signal.aborted) return;
        setIsInitialized(true);

        // Protect Optimistic UI:
        // Ignore incoming server snapshots if we are currently debouncing a local write,
        // or if Firestore is actively processing a pending local write.
        if (
          syncTimeoutRef.current !== null ||
          docSnap.metadata.hasPendingWrites
        ) {
          return;
        }

        if (docSnap.exists()) {
          const docData = docSnap.data().value;
          const finalData = docData === undefined ? initialValue : docData;
          setData(finalData as T);
          dataRef.current = finalData as T;
        } else {
          setData(initialValue);
          dataRef.current = initialValue;
        }
      },
      (error) => {
        if (controller.signal.aborted) return;
        console.error(`Error syncing ${key} from Firestore:`, error);
      },
    );

    return () => {
      controller.abort();
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [key]);

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    const newValue = value instanceof Function ? value(dataRef.current) : value;

    setData(newValue);
    dataRef.current = newValue;

    if (
      window.location.search.includes("demo_data=true") ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    ) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", key);
      const firebaseValue =
        newValue === undefined ? null : JSON.parse(JSON.stringify(newValue));

      syncTimeoutRef.current = null;

      setDoc(docRef, { value: firebaseValue }, { merge: true }).catch((err) => {
        console.error(`Failed to sync ${key} to Firestore:`, err);
      });
    }, 2000);
  };

  return [data, setValue, isInitialized];
}

export function FounderWorkspace({ user, isSuperadmin }: any) {
  const activeProductId = useFounderActiveProductId();
  const setActiveProductId = useFounderActiveProductDispatch();
  const { products, isInitialized: isProductsInitialized } =
    useFounderProducts();
  const { loading: profileLoading } = useUserProfile();
  const productId = activeProductId;

  const defaultCompetitors =
    isSuperadmin && productId === "prod-kageform" ? initialCompetitors : [];
  const defaultSources =
    isSuperadmin && productId === "prod-kageform" ? initialRawDataSources : [];
  const defaultInsights =
    isSuperadmin && productId === "prod-kageform" ? initialDerivedInsights : [];
  const defaultProductData: MyProductData =
    isSuperadmin && productId === "prod-kageform"
      ? {
          name: "KageForm",
          description:
            "BaaS form platform focusing on Cloud-Agnostic Global Data Sovereignty and open-source self-hosting.",
          targetRegions: ["US", "EU", "Asia", "Middle East"],
          features: [],
          strategy: [],
          allowAiWriteAccess: true,
        }
      : {
          name: "",
          description: "",
          targetRegions: [],
          features: [],
          strategy: [],
          allowAiWriteAccess: false,
        };

  const [activeTab, setActiveTab] = useLocalStorage(
    `active_tab_${user.uid}_${productId}`,
    "ideation",
  );
  const [supportInitialType, setSupportInitialType] = useState<
    "Bug" | "Feature" | "General" | "Limit Increase Request"
  >("General");
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [isRateLimitModalOpen, setIsRateLimitModalOpen] = useState(false);
  const [myProductData, setMyProductDataState] =
    useState<MyProductData>(defaultProductData);

  useEffect(() => {
    const product = products.find((p) => p.id === activeProductId);
    if (product) {
      setMyProductDataState(product as any);
    } else if (products.length > 0) {
      setMyProductDataState(products[0] as any);
    }
  }, [products, activeProductId]);

  const setMyProductData = (
    newDataOrUpdater:
      | Partial<MyProductData>
      | ((prev: MyProductData) => Partial<MyProductData>),
  ) => {
    const targetId =
      activeProductId || (products.length > 0 ? products[0].id : null);
    if (!targetId) return;

    setMyProductDataState((prev) => {
      const newData =
        typeof newDataOrUpdater === "function"
          ? newDataOrUpdater(prev)
          : newDataOrUpdater;

      import("firebase/firestore").then(({ doc, setDoc }) => {
        const docRef = doc(db, "products", targetId);
        setDoc(docRef, newData, { merge: true }).catch(console.error);
      });

      return { ...prev, ...newData };
    });
  };

  const isProductDataInitialized = isProductsInitialized;

  const [rawCompetitors, setCompetitors, isCompetitorsInitialized] =
    useMigratedFirestoreDoc<Competitor[]>(
      `competitors_${user.uid}_${productId}`,
      `competitors_${productId}`,
      defaultCompetitors,
    );

  const { displayTaxonomy, evaluationStatus, mergeFeatures } =
    useTaxonomySync();

  const [jobStatus, setJobStatus] = useState<{
    status: string;
    progress: number;
    message?: string;
  } | null>(null);

  useEffect(() => {
    if (!myProductData.jobId) {
      setJobStatus(null);
      return;
    }

    const jobRef = doc(db, "campaign_jobs", myProductData.jobId);
    const unsubscribe = onSnapshot(jobRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setJobStatus({
          status: data.status,
          progress: data.progress || 0,
          message: data.message || "Generating your custom dashboard...",
        });

        // When completed, we might want to clear the jobId so it doesn't show loading forever
        if (data.status === "completed" || data.status === "failed") {
          setMyProductData((prev: any) => ({ ...prev, jobId: null }));
          setJobStatus(null);
        }
      }
    });

    return () => unsubscribe();
  }, [myProductData.jobId]);

  const competitors = React.useMemo(() => {
    if (!displayTaxonomy || displayTaxonomy.length === 0) return rawCompetitors;

    return rawCompetitors.map((c) => {
      if (!c.coreFeatures) return c;
      const newFeatures = c.coreFeatures.map((f) => {
        const alias = displayTaxonomy.find((t) =>
          t.originalFeatures.includes(f),
        );
        return alias ? alias.id : f;
      });
      return { ...c, coreFeatures: Array.from(new Set(newFeatures)) };
    });
  }, [rawCompetitors, displayTaxonomy]);
  const [rawDataSources, setRawDataSources] = useMigratedFirestoreDoc<
    DataSource[]
  >(
    `raw_data_sources_${user.uid}_${productId}`,
    `raw_data_sources_${productId}`,
    defaultSources,
  );
  const {
    syncQueue,
    setSyncQueue,
    queueSyncChanges,
    clearSyncQueue,
    removeSyncChange,
  } = useSyncQueue();

  useEffect(() => {
    if (
      import.meta.env.MODE === "development" ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    ) {
      (window as any).mockSyncQueue = queueSyncChanges;
    }
  }, [queueSyncChanges]);

  // Matrix State
  const [competitorSearch, setCompetitorSearch] = useState("");
  const [matrixFilter, setMatrixFilter] = useState<string>("All");
  const [matrixCurrentPage, setMatrixCurrentPage] = useState(1);
  const matrixItemsPerPage = 10;
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<
    string | null
  >(null);
  const [comparingCompetitorIds, setComparingCompetitorIds] = useState<
    string[]
  >([]);

  // Discovery State
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAnalyzingPage, setIsAnalyzingPage] = useState(false);

  // System Context State
  const [systemContextSummary, setSystemContextSummary] =
    useMigratedFirestoreDoc<string | null>(
      `system_context_${user.uid}_${productId}`,
      `system_context_${productId}`,
      null,
    );
  const [marketMetrics, setMarketMetrics] = useMigratedFirestoreDoc(
    `market_metrics_${user.uid}_${productId}`,
    `market_metrics_${productId}`,
    {
      topIntegrations: "Salesforce, Zapier",
      estimatedMarketValue: "$12.4B",
      trends: {
        tracked: "+1 this week",
        pricingChanges: "High activity",
        featuresIndexed: "+12 this month",
        estimatedMarketValue: "+5% YoY",
      },
    },
  );
  const [isUpdatingContext, setIsUpdatingContext] = useState(false);

  // Raw Data State
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [rawDataSearch, setRawDataSearch] = useState("");
  const [rawDataTypeFilter, setRawDataTypeFilter] = useState("all");
  const [rawDataCompanyFilter, setRawDataCompanyFilter] = useState("all");
  const [rawDataCurrentPage, setRawDataCurrentPage] = useState(1);
  const rawDataItemsPerPage = 10;
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const rawDataObserverRef = useRef<HTMLDivElement>(null);

  // Summary State
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(
    null,
  );

  // Insight Engine State
  const [insightSearch, setInsightSearch] = useState("");
  const [chatState, setChatState] = useLocalStorage<
    "closed" | "hover" | "locked"
  >(`chat_state_${user.uid}_${productId}`, "closed");
  const [chatHistory, setChatHistory] = useMigratedFirestoreDoc<ChatMessage[]>(
    `chat_history_${user.uid}_${productId}`,
    `chat_history_${productId}`,
    [
      {
        role: "assistant",
        content:
          "Hello Founders. I am your Product Insight Engine. I am aware of the page you are currently viewing. How can I help you analyze this data?",
      },
    ],
  );
  const [chatInput, setChatInput] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatStateRef = useRef(chatState);
  chatStateRef.current = chatState;

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatStateRef.current === "locked") {
        const chatEl = document.getElementById("insight-engine-chat");
        if (chatEl && !chatEl.contains(e.target as Node)) {
          setChatState("closed");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [logs, setLogs] = useMigratedFirestoreDoc<LogEntry[]>(
    `logs_${user.uid}_${productId}`,
    `logs_${productId}`,
    [],
  );
  const addLog = (
    action: string,
    details: string,
    status: LogEntry["status"] = "info",
    retryAction?: () => void,
    contextData?: any,
    apiCallDetails?: any,
  ) => {
    const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLogs((prev) => [
      {
        id,
        timestamp: new Date().toISOString(),
        action,
        details,
        status,
        retryAction,
        contextData,
        apiCallDetails,
      },
      ...prev,
    ]);
    return id;
  };

  const updateLog = (id: string, updates: Partial<LogEntry>) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, ...updates } : log)),
    );
  };
  const [lastSynced, setLastSynced] = useLocalStorage<string>(
    `last_synced_${user.uid}_${productId}`,
    new Date().toISOString(),
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const [isTarpitWarningOpen, setIsTarpitWarningOpen] = useState(false);
  const [tarpitCompetitors, setTarpitCompetitors] = useState<any[]>([]);
  const credits = useActionCredits();

  const { isPending: isStartingCampaign, executeTask: startCampaignTask } =
    useSafeAITask({
      timeoutMs: 30000,
      onError: (err) => {
        addToast(err.message || "Failed to start campaign", "error");
        setIsSyncing(false);
      },
    });

  const [activeTasks, setActiveTasks] = useState<
    { id: string; name: string; progress: number }[]
  >([]);
  const syncProgress = (() => {
    if (!isSyncing || activeTasks.length === 0) return 0;
    const completedStages = activeTasks.filter(
      (t) => t.progress === 100,
    ).length;
    return Math.round((completedStages / activeTasks.length) * 100);
  })();

  useEffect(() => {
    if (!isSyncing || activeTasks.length === 0) return;

    const interval = setInterval(() => {
      setActiveTasks((prev) =>
        prev.map((task) => {
          // Only increment tasks that are not finished
          if (task.progress >= 90 || task.progress === 100) return task;
          // Determine which task is currently active (the first one that is not 100%)
          const activeTaskIndex = prev.findIndex((t) => t.progress < 100);
          if (prev.indexOf(task) === activeTaskIndex) {
            const increment = Math.floor(Math.random() * 5) + 1;
            return {
              ...task,
              progress: Math.min(90, task.progress + increment),
            };
          }
          return task;
        }),
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isSyncing, activeTasks.length]);
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isCreateInsightOpen, setIsCreateInsightOpen] = useState(false);
  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [isPageGuideOpen, setIsPageGuideOpen] = useState(false);
  const [isUploadDataModalOpen, setIsUploadDataModalOpen] = useState(false);

  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isTaxonomyMergeModalOpen, setIsTaxonomyMergeModalOpen] =
    useState(false);

  const [seenGuides, setSeenGuides] = useLocalStorage<Record<string, number>>(
    `seen_guides_v2_${user.uid}_${productId}`,
    {},
  );

  useEffect(() => {
    if (
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    )
      return;
    if (activeTab === "mindmap") return; // Handled internally by VisualWhiteboard

    const lastSeen = (seenGuides || {})[activeTab] || 0;

    if (lastSeen === -1) return;

    const oneDay = 24 * 60 * 60 * 1000;
    if (lastSeen === 0 || Date.now() - lastSeen > oneDay) {
      setIsPageGuideOpen(true);
      setSeenGuides((prev) => ({ ...prev, [activeTab]: Date.now() }));
    }
  }, [activeTab, seenGuides, setSeenGuides]);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [isInsightGeneratorOpen, setIsInsightGeneratorOpen] = useState(false);
  const [rawContextData, setRawContextData] = useState<any>(null);
  const [hasQuestNotification, setHasQuestNotification] = useState(true);
  const [insightFilter, setInsightFilter] = useState<
    "All" | "AI" | "Human" | "Brainstorm"
  >("All");
  const [insightCurrentPage, setInsightCurrentPage] = useState(1);
  const insightItemsPerPage = 10;
  const [actionLogsCurrentPage, setActionLogsCurrentPage] = useState(1);
  const actionLogsItemsPerPage = 10;
  const [newInsightForm, setNewInsightForm] = useState({
    title: "",
    description: "",
    category: "opportunity" as const,
    impact: "medium",
  });
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [editInsightForm, setEditInsightForm] = useState<{
    title: string;
    description: string;
    category: "opportunity" | "threat" | "trend";
    impact: "low" | "medium" | "high" | "critical";
  }>({
    title: "",
    description: "",
    category: "opportunity" as const,
    impact: "medium",
  });

  const [derivedInsights, setDerivedInsights] = useMigratedFirestoreDoc<
    DerivedInsight[]
  >(
    `derived_insights_${user.uid}_${productId}`,
    `derived_insights_${productId}`,
    defaultInsights,
  );

  // Keep track of all active timeouts to prevent leaks on unmount
  const activeTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    return () => {
      activeTimeoutsRef.current.forEach(clearTimeout);
      activeTimeoutsRef.current.clear();
    };
  }, []);

  // Toast Functions
  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (type !== "loading") {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        activeTimeoutsRef.current.delete(timer);
      }, 3000);
      activeTimeoutsRef.current.add(timer);
    }
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Function
  const handleApiError = (
    e: any,
    logId?: string,
    actionName?: string,
    retryAction?: () => void,
  ) => {
    const errorMsg = getErrorMessage(e);
    if (e.isRateLimit || errorMsg.includes("RateLimit:")) {
      setRateLimitError(errorMsg);
      setIsRateLimitModalOpen(true);
      if (logId && actionName) {
        updateLog(logId, {
          details: `${actionName} rate limited.`,
          status: "error",
        });
      }
      return true; // Indicates it was handled as rate limit
    }

    if (logId && actionName) {
      updateLog(logId, {
        details: `${actionName} failed: ${errorMsg}. Click to retry.`,
        status: "error",
        retryAction,
        apiCallDetails: { error: errorMsg },
      });
    }
    addToast(errorMsg, "error");
    return false;
  };

  const handleGlobalSync = async (
    startStage = 1,
    initialState: any = {},
    discoveredCompetitors?: any[],
  ) => {
    if (syncQueue.length > 0) {
      addToast("Please review and commit pending sync changes first.", "error");
      return;
    }
    if (isSyncing || isStartingCampaign) {
      addToast("Campaign already in progress.", "info");
      return;
    }

    const effectiveCompetitors = discoveredCompetitors || competitors;

    if (!effectiveCompetitors || effectiveCompetitors.length === 0) {
      setIsDiscoveryModalOpen(true);
      return;
    }

    setIsSyncing(true);

    startCampaignTask(async (signal) => {
      const res = await fetch(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/campaign/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user?.getIdToken()}`,
          },
          body: JSON.stringify({
            competitors: effectiveCompetitors,
            baseIdea: {
              name: myProductData.name,
              description: myProductData.description,
            },
          }),
          signal,
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error || data.message || "Failed to start validation campaign",
        );
      }

      const { jobId } = await res.json();
      addToast("Validation campaign started...", "loading");

      const jobRef = doc(db, "campaign_jobs", jobId);

      const unsubscribe = onSnapshot(jobRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.total && data.total > 0) {
          setActiveTasks([
            {
              id: "1",
              name: "Deep Validation Campaign",
              progress: Math.min(
                Math.round((data.progress / data.total) * 100),
                99,
              ),
            },
          ]);
        }

        if (data.status === "completed") {
          setIsSyncing(false);
          setActiveTasks([
            { id: "1", name: "Deep Validation Campaign", progress: 100 },
          ]);
          setTimeout(() => setActiveTasks([]), 3000);
          unsubscribe();

          const results = data.results || [];
          const highRisk = results.filter(
            (c: any) => c.trueCompetitorScore >= 0.65,
          );
          const cloneRisk = results.filter(
            (c: any) => c.trueCompetitorScore >= 0.85,
          );

          if (cloneRisk.length >= 1 || highRisk.length >= 4) {
            setTarpitCompetitors(results);
            setIsTarpitWarningOpen(true);
          } else {
            addToast("Validation successful. Market looks clear!", "success");
            setCompetitors(results);
          }
        } else if (data.status === "failed") {
          setIsSyncing(false);
          setActiveTasks([]);
          unsubscribe();
          addToast("Validation failed: " + data.error, "error");
        }
      });
    });
  };

  const runSystemCheck = async () => {
    addLog("System Check", "Starting comprehensive system check...", "pending");
    let issuesFound = 0;

    let updatedCompetitors = [...competitors];
    let updatedRawDataSources = [...rawDataSources];
    let updatedDerivedInsights = [...derivedInsights];
    let needsUpdate = false;

    // 1. Validate Competitors
    addLog(
      "System Check",
      `Validating ${competitors.length} competitors...`,
      "info",
    );
    updatedCompetitors = updatedCompetitors.map((comp) => {
      let fixedComp = { ...comp };
      let fixed = false;
      if (!comp.name || !comp.website) {
        addLog(
          "Validation Error",
          `Competitor ${comp.id} is missing name or website.`,
          "error",
        );
        issuesFound++;
      }
      if (comp.competitorScore < 0 || comp.competitorScore > 100) {
        addLog(
          "Validation Error",
          `Competitor ${comp.name} has invalid score: ${comp.competitorScore}. Fixing...`,
          "error",
        );
        fixedComp.competitorScore = Math.max(
          0,
          Math.min(100, comp.competitorScore || 0),
        );
        fixed = true;
        issuesFound++;
      }
      if (!comp.coreFeatures || comp.coreFeatures.length === 0) {
        addLog(
          "Validation Warning",
          `Competitor ${comp.name} has no core features listed.`,
          "info",
        );
      }
      if (fixed) needsUpdate = true;
      return fixedComp;
    });

    // 2. Validate Raw Data Sources
    addLog(
      "System Validation",
      `Validating ${rawDataSources.length} raw data sources...`,
      "info",
    );
    updatedRawDataSources = updatedRawDataSources.map((source) => {
      let fixedSource = { ...source };
      let fixed = false;
      if (!source.competitorId && source.type !== "news") {
        addLog(
          "Validation Warning",
          `Raw data source ${source.id} has no associated competitor.`,
          "info",
        );
      }
      if (!source.sourceUrl) {
        addLog(
          "Validation Error",
          `Raw data source ${source.id} is missing a URL.`,
          "error",
        );
        issuesFound++;
      }
      if (!source.excerpt || source.excerpt.length < 10) {
        addLog(
          "Validation Warning",
          `Raw data source ${source.id} has a very short or missing excerpt.`,
          "info",
        );
      }
      if (fixed) needsUpdate = true;
      return fixedSource;
    });

    // 3. Validate Derived Insights
    addLog(
      "System Validation",
      `Validating ${derivedInsights.length} derived insights...`,
      "info",
    );
    updatedDerivedInsights = updatedDerivedInsights.map((insight) => {
      let fixedInsight = { ...insight };
      let fixed = false;
      if (!["opportunity", "threat", "trend"].includes(insight.category)) {
        addLog(
          "Validation Error",
          `Insight "${insight.title}" has invalid category: ${insight.category}. Fixing...`,
          "error",
        );
        fixedInsight.category = "trend";
        fixed = true;
        issuesFound++;
      }
      if (!["low", "medium", "high", "critical"].includes(insight.impact)) {
        addLog(
          "Validation Error",
          `Insight "${insight.title}" has invalid impact: ${insight.impact}. Fixing...`,
          "error",
        );
        fixedInsight.impact = "medium";
        fixed = true;
        issuesFound++;
      }
      if (!insight.description) {
        addLog(
          "Validation Error",
          `Insight "${insight.title}" is missing a description. Fixing...`,
          "error",
        );
        fixedInsight.description = insight.title || "Description pending.";
        fixed = true;
        issuesFound++;
      }
      if (fixed) needsUpdate = true;
      return fixedInsight;
    });

    if (needsUpdate) {
      setCompetitors(updatedCompetitors);
      setRawDataSources(updatedRawDataSources);
      setDerivedInsights(updatedDerivedInsights);
      addLog(
        "System Check",
        `Fixed ${issuesFound} issues. Re-running check...`,
        "info",
      );
      const timer = setTimeout(runSystemCheck, 100);
      activeTimeoutsRef.current.add(timer);
      return;
    }

    // 4. Validate External APIs (Search Endpoints)
    addLog(
      "System Check",
      "Validating external search APIs (Exa API)...",
      "info",
    );

    const exaKeys = [
      getCustomApiKey("exa"),
      process.env.EXA_API_KEY,
      "c2d3b027-3c0e-4deb-9b6e-590113b45c3c", // Original fallback
      "e1ce2af7-0012-4ed9-aa18-fbe2080aa935", // New fallback
    ].filter(Boolean) as string[];

    let exaSuccess = false;
    let lastExaError: any = null;

    for (const exaKey of exaKeys) {
      try {
        const response = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "x-api-key": exaKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: "test search",
            type: "fast",
            num_results: 1,
          }),
        });

        // Update Rate Limits if headers exist
        const limitStr = response.headers?.get?.("x-rate-limit-limit");
        const remainingStr = response.headers?.get?.("x-rate-limit-remaining");
        const resetStr = response.headers?.get?.("x-rate-limit-reset");
        if (limitStr) {
          const limit = parseInt(limitStr, 10);
          const remaining = remainingStr ? parseInt(remainingStr, 10) : null;
          const reset = resetStr ? parseInt(resetStr, 10) : null;
          if (!isNaN(limit)) updateRateLimits("exa", limit, remaining, reset);
        }
        trackRequest("exa", exaKey || "env_key", !response.ok);

        if (!response.ok) {
          throw new Error(`Exa API test failed with status ${response.status}`);
        }

        addLog("System Check", `Exa API connected successfully.`, "success");
        exaSuccess = true;
        break;
      } catch (e: any) {
        lastExaError = e;
      }
    }

    if (!exaSuccess) {
      addLog(
        "Validation Error",
        `Search API validation failed for all keys. Last error: ${lastExaError?.message}`,
        "error",
      );
      issuesFound++;
    }

    if (issuesFound === 0) {
      addLog(
        "System Check",
        "System check complete. All systems nominal.",
        "success",
      );
      addToast("System check passed.", "success");
    } else {
      addLog(
        "System Check",
        `System check complete. Found ${issuesFound} issues.`,
        "error",
      );
      addToast(
        `System check found ${issuesFound} issues. Review logs.`,
        "error",
      );
    }
  };

  const [featureDetails, setFeatureDetails] = useMigratedFirestoreDoc<
    Record<string, string>
  >(
    `feature_details_${user.uid}_${productId}`,
    `feature_details_${productId}`,
    {},
  );

  // Derived State
  const stats = {
    tracked: competitors.length,
    pricingChanges: rawDataSources.filter((s) => s.tags?.includes("pricing"))
      .length,
    featuresIndexed: competitors.reduce(
      (acc, c) => acc + (c.coreFeatures?.length || 0),
      0,
    ),
    topIntegrations: marketMetrics.topIntegrations,
    estimatedMarketValue: marketMetrics.estimatedMarketValue,
    trends: marketMetrics.trends,
  };

  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortField === key && sortOrder === "asc") {
      direction = "desc";
    }
    setSortField(key as SortField);
    setSortOrder(direction);
  };

  const sortedCompetitors = filterCompetitors(
    competitors,
    competitorSearch,
    matrixFilter,
  ).sort((a, b) => {
    const aVal = (a as any)[sortField];
    const bVal = (b as any)[sortField];

    // Handle undefined/null values
    if (aVal == null) return sortOrder === "asc" ? 1 : -1;
    if (bVal == null) return sortOrder === "asc" ? -1 : 1;

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredRawData = filterRawData(
    rawDataSources,
    rawDataSearch,
    rawDataCompanyFilter,
    rawDataTypeFilter,
  );

  const filteredInsights = filterInsights(
    derivedInsights,
    insightSearch,
    insightFilter,
  );

  const handleEditInsight = (insight: DerivedInsight) => {
    setEditingInsightId(insight.id);
    setEditInsightForm({
      title: insight.title,
      description: insight.description,
      category: insight.category,
      impact: insight.impact,
    });
  };

  const handleSaveInsight = () => {
    if (!editingInsightId) return;
    setDerivedInsights((prev) =>
      prev.map((insight) => {
        if (insight.id === editingInsightId) {
          const isAI = insight.source === "AI";
          return {
            ...insight,
            ...editInsightForm,
            source: isAI ? "Brainstorm" : insight.source,
            timestamp: new Date().toISOString(),
          };
        }
        return insight;
      }),
    );
    setEditingInsightId(null);
    addToast("Insight updated successfully", "success");
  };

  const handleDeleteInsight = (id: string) => {
    setDerivedInsights((prev) => prev.filter((i) => i.id !== id));
    addToast("Insight deleted", "info");
  };

  const handleExport = (format: "csv" | "txt" | "copy") => {
    let content = "";
    if (format === "csv") {
      content =
        "Name,Website,Score\n" +
        competitors
          .map((c) => `${c.name},${c.website},${c.competitorScore}`)
          .join("\n\n");
    } else {
      content = JSON.stringify(
        { competitors, rawDataSources, derivedInsights },
        null,
        2,
      );
    }

    if (format === "copy") {
      navigator.clipboard.writeText(content);
      addToast("Data copied to clipboard", "success");
      return;
    }

    const dataUri =
      "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    const exportFileDefaultName = `market_intelligence_export.${format}`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const initialMindmapData: any = {
    id: "root",
    name: "Market Landscape",
    type: "root",
    children: competitors.map((c) => ({
      id: c.id,
      name: c.name,
      type: "competitor",
      children: [
        {
          id: `${c.id}-features`,
          name: "Features",
          type: "category",
          children: c.coreFeatures
            .slice(0, 3)
            .map((f, i) => ({ id: `${c.id}-f${i}`, name: f, type: "note" })),
        },
        {
          id: `${c.id}-segments`,
          name: "Segments",
          type: "category",
          children: c.marketSegments
            .slice(0, 2)
            .map((s, i) => ({ id: `${c.id}-s${i}`, name: s, type: "note" })),
        },
      ],
    })),
  };

  const runNewsDiscovery = async () => {
    if (!isSuperadmin && !checkAlphaLimit()) {
      setIsLimitModalOpen(true);
      return;
    }

    setIsDiscovering(true);
    const logId = addLog(
      "News Discovery",
      "Searching for latest competitor news...",
      "pending",
    );

    try {
      const exaKey = getCustomApiKey("exa") || process.env.EXA_API_KEY;
      if (!exaKey) throw new Error("Exa API Key missing");

      // We only do this for the first competitor to avoid blowing up the API for now,
      // or we can just search generically for the market.
      const query = myProductData.name
        ? `Latest news, product launches, or funding for ${myProductData.name} competitors`
        : "Latest tech startup news";

      const exaResponse = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": exaKey,
        },
        body: JSON.stringify({
          query,
          useAutoprompt: true,
          type: "auto",
          category: "news",
          numResults: 3,
          highlights: { maxCharacters: 1000 },
        }),
      });

      if (!exaResponse.ok) {
        const error: any = new Error(
          "Exa API returned an error: " + exaResponse.status,
        );
        if (exaResponse.status === 429) {
          error.isRateLimit = true;
          error.message =
            (getCustomApiKey("exa")
              ? "RateLimit:CustomKey:"
              : "RateLimit:GlobalKey:") + error.message;
        }
        throw error;
      }
      const exaData = await exaResponse.json();

      // Pass to Gemini to extract insights
      const geminiResponse = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Extract insights from these news highlights: ${JSON.stringify(exaData.results)}. Identify opportunities, threats, or trends. Return as a JSON array of insights.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: {
                      type: Type.STRING,
                      enum: ["opportunity", "threat", "trend"],
                    },
                    impact: {
                      type: Type.STRING,
                      enum: ["low", "medium", "high", "critical"],
                    },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "description", "category", "impact"],
                },
              },
            },
          });
        },
        { capability: "chat" },
      );

      const parsed = JSON.parse(geminiResponse.text);

      const newInsights = parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        title: item.title,
        description: item.description,
        category: item.category || "trend",
        impact: item.impact || "medium",
        timestamp: new Date().toISOString(),
        source: "Exa.ai",
        tags: item.tags || [],
      }));

      queueSyncChanges([
        {
          id: `diff-sysctx-insights-news-${Date.now()}`,
          entityId: "system-context",
          entityType: "SystemContext",
          field: "insights",
          oldValue: [],
          newValue: newInsights,
          description: `Add ${newInsights.length} new insights from news`,
        },
      ]);

      // Add to Raw Data
      const rawData = exaData.results.map((res: any) => ({
        id: crypto.randomUUID(),
        competitorId: "market",
        type: "news",
        sourceUrl: res.url,
        excerpt: res.highlights?.join(" ") || res.text || "",
        timestamp: new Date().toISOString(),
        tags: ["news", "exa"],
        confidenceLevel: "High",
        isDeduced: false,
        source: "Exa.ai",
      }));

      setRawDataSources((prev) => [...rawData, ...prev]);

      recordAlphaUsage();
      updateLog(logId, {
        details: `Successfully found ${newInsights.length} news insights (Pending Review).`,
        status: "success",
      });
      addToast(
        `Discovered ${newInsights.length} new insights from news.`,
        "success",
      );
    } catch (err: any) {
      console.error(err);
      handleApiError(err, logId, "News discovery");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Live Discovery Logic

  const runDiscovery = async () => {
    if (!isSuperadmin && !checkAlphaLimit()) {
      setIsLimitModalOpen(true);
      return;
    }
    setIsDiscovering(true);
    const logId = addLog(
      "Live Discovery",
      "Starting live discovery scan...",
      "pending",
      runDiscovery,
    );
    try {
      const response = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Identify 1 or 2 emerging or lesser-known competitors relevant to: ${myProductData.name || "our product"}. Do not return the main dominant players. Provide detailed data and simulate 2-4 data sources (website, linkedin, crunchbase, news) for each to establish a trust score.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    website: { type: Type.STRING },
                    freeTier: { type: Type.STRING },
                    spamProtection: { type: Type.STRING },
                    integrations: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    targetAudience: { type: Type.STRING },
                    dataSovereignty: { type: Type.STRING },
                    sovereigntyScore: {
                      type: Type.STRING,
                      description: "low, medium, or high",
                    },
                    financialSnapshot: { type: Type.STRING },
                    coreFeatures: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    howWeCompare: { type: Type.STRING },
                    competitorScore: { type: Type.NUMBER },
                    sources: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: {
                            type: Type.STRING,
                            description:
                              "website, api, screenshot, database, github, linkedin, crunchbase, news",
                          },
                          sourceUrl: { type: Type.STRING },
                          excerpt: { type: Type.STRING },
                          confidenceLevel: {
                            type: Type.STRING,
                            description: "High, Medium, Low",
                          },
                          isDeduced: { type: Type.BOOLEAN },
                        },
                        required: [
                          "type",
                          "sourceUrl",
                          "excerpt",
                          "confidenceLevel",
                        ],
                      },
                    },
                  },
                  required: [
                    "name",
                    "website",
                    "freeTier",
                    "spamProtection",
                    "integrations",
                    "targetAudience",
                    "dataSovereignty",
                    "sovereigntyScore",
                    "financialSnapshot",
                    "coreFeatures",
                    "howWeCompare",
                    "competitorScore",
                    "sources",
                  ],
                },
              },
            },
          });
        },
        { capability: "chat" },
      );

      const newComps = JSON.parse(response.text || "[]");

      const newCompetitors: Competitor[] = [];
      const newSources: DataSource[] = [];

      newComps.forEach((comp: any) => {
        const newId = Math.random().toString(36).substr(2, 9);

        // Calculate Trust Score based on sources volume and diversity
        const sourceTypes = new Set(
          comp.sources?.map((s: any) => s.type) || [],
        );
        const baseScore = 30;
        const diversityBonus = sourceTypes.size * 15;
        const volumeBonus = (comp.sources?.length || 0) * 5;
        const trustScore = Math.min(
          100,
          baseScore + diversityBonus + volumeBonus,
        );

        const newCompetitorObj = {
          id: newId,
          name: comp.name || "Unknown",
          website: comp.website || "",
          freeTier: comp.freeTier || "Unknown",
          spamProtection: comp.spamProtection || "Unknown",
          integrations: comp.integrations || [],
          targetAudience: comp.targetAudience || "Unknown",
          marketSegments: ["SMB", "Enterprise"], // Default value
          dataSovereignty: comp.dataSovereignty || "Unknown",
          sovereigntyScore: (comp.sovereigntyScore as any) || "low",
          logoUrl: `https://picsum.photos/seed/${comp.name.replace(/\s+/g, "")}/200/200`,
          financialSnapshot: comp.financialSnapshot || "Unknown",
          coreFeatures: comp.coreFeatures || [],
          howWeCompare: comp.howWeCompare || "",
          competitorScore: comp.competitorScore || 50,
          trustScore: trustScore,
          marketCommonalityIndex: 50, // Default value
          resourceSimilarityScore: 50, // Default value
          verifiedFields: {},
        };
        newCompetitors.push(newCompetitorObj);

        comp.sources?.forEach((s: any) => {
          newSources.push({
            id: Math.random().toString(36).substr(2, 9),
            competitorId: newId,
            type: s.type as SourceType,
            sourceUrl: s.sourceUrl || "",
            excerpt: s.excerpt || "",
            timestamp: new Date().toISOString(),
            tags: ["auto-discovered"],
            confidenceLevel: (s.confidenceLevel as ConfidenceLevel) || "Medium",
            isDeduced: s.isDeduced || false,
            source: "AI",
          });
        });

        queueSyncChanges([
          {
            id: `diff-new-comp-${newId}-${Date.now()}`,
            entityId: newId,
            entityType: "Competitor",
            field: "new_competitor",
            oldValue: null,
            newValue: newCompetitorObj,
            description: `Discovered new competitor: ${comp.name}`,
          },
        ]);
      });

      setRawDataSources((prev) => [...prev, ...newSources]);
      updateLog(logId, {
        details: `Live discovery scan complete. Found ${newCompetitors.length} new competitors (Pending Review).`,
        status: "success",
        retryAction: undefined,
        apiCallDetails: { prompt: "Live discovery scan", response: newComps },
      });

      recordAlphaUsage();
      // Automatically run data pipeline to update insights and metrics
      setTimeout(() => {
        updateSystemContext();
      }, 100);
    } catch (error: any) {
      console.error("Discovery failed:", getErrorMessage(error));
      handleApiError(error, logId, "Discovery scan");
    } finally {
      setIsDiscovering(false);
    }
  };

  const updateSystemContext = async () => {
    setIsUpdatingContext(true);
    const logId = addLog(
      "Update Context",
      "Rebuilding AI knowledge base...",
      "pending",
      updateSystemContext,
    );
    try {
      const systemData = JSON.stringify({
        competitors: competitors.map((c) => ({
          name: c.name,
          score: c.competitorScore,
          features: c.coreFeatures,
        })),
        insights: derivedInsights.map((i) => ({
          title: i.title,
          category: i.category,
        })),
        stats,
      });

      const response = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Analyze this entire system data and provide a concise, high-level summary of the current market landscape, key threats, and top opportunities. Also generate 3-5 new strategic insights based on this data, and estimate some high-level market metrics.\n\nData: ${systemData}`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  summary: {
                    type: Type.STRING,
                    description:
                      "A concise, high-level summary of the current market landscape.",
                  },
                  insights: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: {
                          type: Type.STRING,
                          enum: ["opportunity", "threat", "trend"],
                        },
                        impact: {
                          type: Type.STRING,
                          enum: ["low", "medium", "high", "critical"],
                        },
                      },
                      required: ["title", "description", "category", "impact"],
                    },
                  },
                  metrics: {
                    type: Type.OBJECT,
                    properties: {
                      topIntegrations: { type: Type.STRING },
                      estimatedMarketValue: { type: Type.STRING },
                      trends: {
                        type: Type.OBJECT,
                        properties: {
                          tracked: { type: Type.STRING },
                          pricingChanges: { type: Type.STRING },
                          featuresIndexed: { type: Type.STRING },
                          estimatedMarketValue: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
                required: ["summary", "insights", "metrics"],
              },
            },
          });
        },
        { capability: "reasoning" },
      );

      const result = JSON.parse(response.text || "{}");
      const diffs: any[] = [];

      if (result.summary) {
        diffs.push({
          id: `diff-sysctx-summary-${Date.now()}`,
          entityId: "system-context",
          entityType: "SystemContext",
          field: "summary",
          oldValue: systemContextSummary,
          newValue: result.summary,
          description: "Update System Context Summary",
        });
      }
      if (result.insights && result.insights.length > 0) {
        const newInsights = result.insights.map((i: any) => ({
          id: `di-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: i.title,
          description: i.description,
          category: i.category,
          impact: i.impact,
          timestamp: new Date().toISOString(),
          source: "AI Pipeline",
        }));
        diffs.push({
          id: `diff-sysctx-insights-${Date.now()}`,
          entityId: "system-context",
          entityType: "SystemContext",
          field: "insights",
          oldValue: [],
          newValue: newInsights,
          description: `Add ${newInsights.length} new insights`,
        });
      }
      if (result.metrics) {
        diffs.push({
          id: `diff-sysctx-metrics-${Date.now()}`,
          entityId: "system-context",
          entityType: "SystemContext",
          field: "marketMetrics",
          oldValue: marketMetrics,
          newValue: { ...marketMetrics, ...result.metrics },
          description: "Update Market Metrics",
        });
      }

      if (diffs.length > 0) {
        queueSyncChanges(diffs);
      }

      addToast("System context updates pending review", "info");
      updateLog(logId, {
        details: `System context generated ${result.insights?.length || 0} new insights (Pending Review).`,
        status: "success",
        retryAction: undefined,
        apiCallDetails: { prompt: "Update system context", response: result },
      });
    } catch (error: any) {
      handleApiError(error, logId, "System context update");
    } finally {
      setIsUpdatingContext(false);
    }
  };

  // Page Analysis Logic
  const runPageAnalysis = async () => {
    setIsAnalyzingPage(true);
    const logId = addLog(
      "Page Analysis",
      "Running AI analysis on current view...",
      "pending",
      runPageAnalysis,
    );
    try {
      let pageContext = "";
      if (selectedCompetitorId) {
        const comp = competitors.find((c) => c.id === selectedCompetitorId);
        pageContext = `User is viewing Scout Page for competitor: ${comp?.name}. Data: ${JSON.stringify(comp)}`;
      } else if (selectedSourceId) {
        const src = rawDataSources.find((s) => s.id === selectedSourceId);
        const compName = competitors.find(
          (c) => c.id === src?.competitorId,
        )?.name;
        pageContext = `User is viewing Raw Data Source for ${compName}: ${src?.sourceUrl}. Data: ${JSON.stringify(src)}`;
      } else if (selectedSummaryId) {
        pageContext = `User is viewing Dashboard Summary: ${selectedSummaryId}. Stats: ${JSON.stringify(stats)}`;
      } else if (activeTab === "dashboard") {
        pageContext = `User is viewing the Dashboard. Stats: ${JSON.stringify(stats)}`;
      } else if (activeTab === "matrix") {
        pageContext = `User is viewing the Competitor Matrix. Filtered Competitors: ${JSON.stringify(sortedCompetitors.map((c) => c.name))}`;
      } else if (activeTab === "rawdata") {
        pageContext = `User is viewing the Raw Data Library. Filtered Sources count: ${filteredRawData.length}`;
      } else if (activeTab === "reports") {
        pageContext = `User is viewing the Insight Library page. Filtered Insights: ${JSON.stringify(filteredInsights)}`;
      }

      const systemPrompt = `You are the Product Intelligence Engine.
Context: You are analyzing data for the following product: ${myProductData.name || "Unknown Product"}.
Description: ${myProductData.description || "N/A"}.
Target Regions: ${myProductData.targetRegions.join("\n, ") || "N/A"}.
Features: ${myProductData.features.join("\n, ") || "N/A"}.
Strategy: ${myProductData.strategy.join("\n, ") || "N/A"}.
System Context Summary: ${systemContextSummary || "Not generated yet. Use specific page context."}
Current View Context: ${pageContext}
Task: Run a quick analysis on the current page data. Provide a brief, readable summary of what the user is looking at and what it means. 
If you detect a strong insight (especially driven by the user's potential passion or a unique market angle), use the \`suggest_insight\` tool to propose it.
Keep the summary concise and grounded in reality. Ask a follow-up question to validate the user's ideas or passion.`;

      const suggestInsightFunctionDeclaration: FunctionDeclaration = {
        name: "suggest_insight",
        parameters: {
          type: Type.OBJECT,
          description: "Suggest a valuable insight based on the page analysis.",
          properties: {
            title: {
              type: Type.STRING,
              description: "A concise title for the insight.",
            },
            description: {
              type: Type.STRING,
              description: "A detailed explanation of the insight.",
            },
            category: {
              type: Type.STRING,
              enum: ["opportunity", "threat", "trend"],
              description: "The category of the insight.",
            },
            impact: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "critical"],
              description: "The potential impact.",
            },
          },
          required: ["title", "description", "category", "impact"],
        },
      };

      const responseStream = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContentStream(model, {
            contents: systemPrompt,
            config: {
              tools: [
                { functionDeclarations: [suggestInsightFunctionDeclaration] },
              ],
            },
          });
        },
        { capability: "reasoning" },
      );

      let fullText = "";
      let suggestedInsight: any = undefined;
      const messageId = Date.now().toString();

      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: "Run analysis on this page." },
        { id: messageId, role: "assistant", content: "" },
      ]);
      if (chatState === "closed") setChatState("locked");

      for await (const chunk of responseStream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          const call = chunk.functionCalls[0];
          if (call.name === "suggest_insight") {
            suggestedInsight = call.args as any;
          }
        }

        if (chunk.text) {
          fullText += chunk.text;
          setChatHistory((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1
                ? { ...msg, content: fullText, suggestedInsight }
                : msg,
            ),
          );
        }
      }

      setChatHistory((prev) =>
        prev.map((msg, idx) =>
          idx === prev.length - 1
            ? {
                ...msg,
                content:
                  fullText || "Analysis complete. I have a suggestion for you.",
                suggestedInsight,
              }
            : msg,
        ),
      );

      updateLog(logId, {
        details: "Analysis complete.",
        status: "success",
        retryAction: undefined,
        apiCallDetails: {
          prompt: systemPrompt,
          response: fullText,
          functionCalls: suggestedInsight ? [suggestedInsight] : undefined,
        },
      });
    } catch (error: any) {
      handleApiError(error, logId, "Page analysis");
    } finally {
      setIsAnalyzingPage(false);
    }
  };

  // Chat Logic
  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || chatInput;
    if (!messageText.trim()) return;

    const newUserMsg: ChatMessage = { role: "user", content: messageText };
    setChatHistory((prev) => [...prev, newUserMsg]);
    setChatInput("");
    setShowMentionDropdown(false);
    setIsTyping(true);

    try {
      // Extract [[CardName]] mentions
      const mentions = [...messageText.matchAll(/\[\[(.*?)\]\]/g)].map(
        (m) => m[1],
      );
      let mentionContext = "";
      if (mentions.length > 0) {
        const mentionedCompetitors = competitors.filter((c) =>
          mentions.includes(c.name),
        );
        const mentionedInsights = derivedInsights.filter((i) =>
          mentions.includes(i.title),
        );
        mentionContext = `\n\nUser explicitly mentioned these cards:\n${mentionedCompetitors.map((c) => `Competitor: ${c.name} - ${JSON.stringify(c)}`).join("\n\n")}\n${mentionedInsights.map((i) => `Insight: ${i.title} - ${JSON.stringify(i)}`).join("\n\n")}`;
      }

      // Build context from current view
      let pageContext = "";
      let specializedPrompt = "";
      if (selectedCompetitorId) {
        const comp = competitors.find((c) => c.id === selectedCompetitorId);
        pageContext = `User is viewing Scout Page for competitor: ${comp?.name}. Data: ${JSON.stringify(comp)}`;
        specializedPrompt = `Focus deeply on this specific competitor\\'s weaknesses, pricing, and how ${myProductData.name || "our product"} can position against them.`;
      } else if (selectedSourceId) {
        const src = rawDataSources.find((s) => s.id === selectedSourceId);
        const compName = competitors.find(
          (c) => c.id === src?.competitorId,
        )?.name;
        pageContext = `User is viewing Raw Data Source for ${compName}: ${src?.sourceUrl}. Data: ${JSON.stringify(src)}`;
        specializedPrompt =
          "Analyze this raw data source for hidden opportunities or threats. Extract actionable intelligence.";
      } else if (selectedSummaryId) {
        pageContext = `User is viewing Dashboard Summary: ${selectedSummaryId}. Stats: ${JSON.stringify(stats)}`;
        specializedPrompt =
          "Provide high-level strategic advice based on these summary statistics.";
      } else if (activeTab === "dashboard") {
        pageContext = `User is viewing the Dashboard. Stats: ${JSON.stringify(stats)}`;
        specializedPrompt =
          "You have access to the fully synthesized chat context with all data. Provide holistic, high-level strategic advice.";
      } else if (activeTab === "matrix") {
        pageContext = `User is viewing the Competitor Matrix. Filtered Competitors: ${JSON.stringify(sortedCompetitors.map((c) => c.name))}`;
        specializedPrompt =
          "Focus on market gaps, feature comparisons, and positioning strategies across the entire competitive landscape.";
      } else if (activeTab === "rawdata") {
        pageContext = `User is viewing the Raw Data Library. Filtered Sources count: ${filteredRawData.length}`;
        specializedPrompt =
          "Help the user sift through raw data, identify patterns, and evaluate data quality and confidence levels.";
      } else if (activeTab === "reports") {
        pageContext = `User is viewing the Insight Library page. Filtered Insights: ${JSON.stringify(filteredInsights)}`;
        specializedPrompt =
          "Discuss the derived insights, evaluate their impact, and brainstorm new strategic directions based on the library.";
      }

      const systemPrompt = `You are the Product Intelligence Engine, a specialized AI Co-Founder, Product Manager, and GTM Strategist.
Context: You are driving strategy for the following product: ${myProductData.name || "Unknown Product"}.
Description: ${myProductData.description || "N/A"}.
Target Regions: ${myProductData.targetRegions.join("\n, ") || "N/A"}.
Features: ${myProductData.features.join("\n, ") || "N/A"}.
Strategy: ${myProductData.strategy.join("\n, ") || "N/A"}.
System Context Summary: ${systemContextSummary || "Not generated yet. Use specific page context."}
Current View Context: ${pageContext}
Specialized Focus: ${specializedPrompt}
Goal: Help the founders get their first customers, secure grants/investment, reduce cloud costs, and generate actionable Agile user stories/features from market research. Provide factual, logical, and analytical data and insights using a highly intelligent modern comfort pro approach with the ultimate goal to serve the community.
Important Instruction: If the user shares a valuable insight or makes a profound realization during the discussion, ask them if they want to save it to the Insight Library. If they explicitly agree, use the \`save_brainstorm_insight\` tool to store it.
Respond in Markdown. Be concise, highly technical, and actionable.`;

      const saveInsightFunctionDeclaration = {
        name: "save_brainstorm_insight",
        description:
          "Save a valuable insight generated during the discussion to the Insight Library.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A concise title for the insight.",
            },
            description: {
              type: Type.STRING,
              description: "A detailed explanation of the insight.",
            },
            category: {
              type: Type.STRING,
              enum: ["opportunity", "threat", "trend"],
              description: "The category of the insight.",
            },
            impact: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "critical"],
              description: "The potential impact.",
            },
          },
          required: ["title", "description", "category", "impact"],
        },
      };

      const saveNegativeConstraintDeclaration = {
        name: "save_negative_constraint",
        description:
          "Save an explicit user correction or negative constraint (e.g. 'do not focus on enterprise', 'ignore AI summary apps') to prevent the AI from making the same mistake.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            constraint: {
              type: Type.STRING,
              description:
                "The negative constraint or correction provided by the user.",
            },
          },
          required: ["constraint"],
        },
      };

      // Format chat history for the model
      const formattedHistory = chatHistory
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
        )
        .join("\n\n");

      const messageId = Date.now().toString();
      setChatHistory((prev) => [
        ...prev,
        { id: messageId, role: "assistant", content: "" },
      ]);

      const responseStream = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContentStream(model, {
            contents: `${systemPrompt}${mentionContext}\n\nChat History:\n${formattedHistory}\n\nUser: ${messageText}`,
            config: {
              tools: [
                {
                  functionDeclarations: [
                    saveInsightFunctionDeclaration,
                    saveNegativeConstraintDeclaration,
                  ],
                },
              ],
            },
          });
        },
        { capability: "reasoning" },
      );

      let fullText = "";
      let hasFunctionCall = false;
      let finalInsightArgs: any = null;
      let finalConstraintArgs: any = null;

      for await (const chunk of responseStream) {
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          hasFunctionCall = true;
          const call = chunk.functionCalls[0];
          if (call.name === "save_brainstorm_insight") {
            finalInsightArgs = call.args;
          } else if (call.name === "save_negative_constraint") {
            finalConstraintArgs = call.args;
          }
        }

        if (chunk.text) {
          fullText += chunk.text;
          setChatHistory((prev) =>
            prev.map((msg, idx) =>
              idx === prev.length - 1 ? { ...msg, content: fullText } : msg,
            ),
          );
        }
      }

      if (hasFunctionCall && finalInsightArgs) {
        const newInsight: DerivedInsight = {
          id: `di-${Date.now()}`,
          title: finalInsightArgs.title,
          description: finalInsightArgs.description,
          category: finalInsightArgs.category,
          impact: finalInsightArgs.impact,
          timestamp: new Date().toISOString(),
          source: "Brainstorm",
        };
        setDerivedInsights((prev) => [newInsight, ...prev]);
        addToast("Insight saved from chat", "success");
        addLog(
          "Chat Insight",
          `Saved insight from chat: ${finalInsightArgs.title}`,
          "success",
          undefined,
          undefined,
          { prompt: "Save brainstorm insight", response: finalInsightArgs },
        );

        setChatHistory((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1
              ? {
                  ...msg,
                  content: `I've saved that insight to the library: **${finalInsightArgs.title}**`,
                }
              : msg,
          ),
        );
      }

      if (hasFunctionCall && finalConstraintArgs) {
        const constraint = finalConstraintArgs.constraint;
        if (constraint && activeProductId && user) {
          import("firebase/firestore").then(
            async ({ doc, setDoc, arrayUnion }) => {
              try {
                await setDoc(
                  doc(db, "tenant_ideas", activeProductId),
                  {
                    userId: user.uid,
                    negativeConstraints: arrayUnion(constraint),
                  },
                  { merge: true },
                );
                addToast("Correction saved", "success");
              } catch (err) {
                console.error("Failed to save negative constraint", err);
              }
            },
          );
        }

        setChatHistory((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1
              ? {
                  ...msg,
                  content: `I've noted your correction: **${constraint}**. I will keep this in mind.`,
                }
              : msg,
          ),
        );
      }

      if (!fullText && hasFunctionCall) {
        // Function call handled above
      }

      addLog(
        "Chat AI",
        "Processed user message.",
        "success",
        undefined,
        undefined,
        { prompt: messageText, response: fullText },
      );
    } catch (error: any) {
      if (!handleApiError(error)) {
        setChatHistory((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1
              ? { ...msg, content: `**Error:** ${getErrorMessage(error)}` }
              : msg,
          ),
        );
        addLog(
          "Chat AI Error",
          `Failed to process message: ${getErrorMessage(error)}`,
          "error",
          undefined,
          undefined,
          { error: getErrorMessage(error) },
        );
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Export to Markdown
  const exportToMarkdown = () => {
    let md = `# NicheAI - Competitor Matrix Context\n\n`;
    md += `*Exported on: ${new Date().toISOString().split("T")[0]}*\n\n`;
    md += `| Competitor | Market Commonality | Resource Similarity | Free Tier Limits | Target Audience | Market Segments | Data Sovereignty | Funding Stage | Est. ARR | Est. User Base | Trust Score |\n`;
    md += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

    sortedCompetitors.forEach((c) => {
      md += `| **${c.name}** | ${c.marketCommonalityIndex}/100 | ${c.resourceSimilarityScore}/100 | ${c.freeTier} | ${c.targetAudience} | ${c.marketSegments.join("\n, ")} | ${c.dataSovereignty} | ${c.fundingStage || "N/A"} | ${c.estimatedARR || "N/A"} | ${c.estimatedUserBase || "N/A"} | ${c.trustScore}/100 |\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${myProductData.name ? myProductData.name.replace(/\\s+/g, "_").toLowerCase() : "product"}_competitor_context.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [isSyncReviewOpen, setIsSyncReviewOpen] = useState(false);

  const handleCommitSyncChanges = (selectedIds: string[]) => {
    const diffsToApply = syncQueue.filter((d) => selectedIds.includes(d.id));

    // Group by entityType and entityId
    const competitorUpdates: Record<string, any> = {};
    let contextSummaryUpdated = false;
    let newInsights: any[] = [];
    let newMetrics: any = null;
    let newlyAddedCompetitors: any[] = [];

    diffsToApply.forEach((diff) => {
      if (diff.entityType === "Competitor") {
        if (diff.field === "new_competitor") {
          newlyAddedCompetitors.push(diff.newValue);
        } else {
          if (!competitorUpdates[diff.entityId])
            competitorUpdates[diff.entityId] = {};
          competitorUpdates[diff.entityId][diff.field] = diff.newValue;
        }
      } else if (diff.entityType === "SystemContext") {
        if (diff.field === "summary") contextSummaryUpdated = true;
        if (diff.field === "insights")
          newInsights = [...newInsights, ...diff.newValue];
        if (diff.field === "marketMetrics") newMetrics = diff.newValue;
      }
    });

    // Apply updates to Competitors
    if (
      Object.keys(competitorUpdates).length > 0 ||
      newlyAddedCompetitors.length > 0
    ) {
      setCompetitors((prev) => {
        const mapped = prev.map((c) => {
          if (competitorUpdates[c.id]) {
            return { ...c, ...competitorUpdates[c.id] };
          }
          return c;
        });
        return [...mapped, ...newlyAddedCompetitors];
      });
    }

    // Apply updates to System Context
    if (contextSummaryUpdated) {
      const summaryDiff = diffsToApply.find(
        (d) => d.entityType === "SystemContext" && d.field === "summary",
      );
      if (summaryDiff) setSystemContextSummary(summaryDiff.newValue);
    }
    if (newInsights.length > 0) {
      setDerivedInsights((prev) => [...newInsights, ...prev]);
    }
    if (newMetrics) {
      setMarketMetrics((prev) => ({ ...prev, ...newMetrics }));
    }

    // Remove applied and rejected changes from queue (clear all if all reviewed)
    // We clear the queue since the review process assumes everything unselected is rejected
    clearSyncQueue();
    addToast(`Committed ${selectedIds.length} changes.`, "success");
    addLog(
      "Sync Review",
      `Committed ${selectedIds.length} changes. Discarded ${syncQueue.length - selectedIds.length} changes.`,
      "success",
    );
  };

  const setInitialData = useVisualKnowledgeStore((s) => s.setInitialData);

  useEffect(() => {
    if (window.location.search.includes("demo_data=true")) {
      Promise.all([import("../utils/demoMockData")])
        .then(([mockData]) => {
          setCompetitors(mockData.demoCompetitors || []);
          setRawDataSources(mockData.demoRawData || []);
          setDerivedInsights(mockData.demoInsights || []);

          setInitialData({
            cards: mockData.demoCards || {},
            whiteboards: mockData.demoWhiteboards || {},
            activeWhiteboardId: "wb-demo-1",
          });
        })
        .catch(console.error);
    }
  }, [setInitialData]);

  if (!isProductsInitialized) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-[#F5F3ED]"
        aria-live="polite"
      >
        <div className="w-8 h-8 rounded-full border-4 border-ink-dark/20 border-t-ink-dark animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex h-screen bg-[#F5F3ED] overflow-y-auto w-full">
        <OnboardingWizard
          onComplete={(data) => {
            import("firebase/firestore").then(
              ({ collection, addDoc, serverTimestamp }) => {
                addDoc(collection(db, "products"), {
                  ...data,
                  userId: user.uid,
                  status: "draft",
                  createdAt: serverTimestamp(),
                })
                  .then((docRef) => {
                    setActiveProductId(docRef.id);
                  })
                  .catch(console.error);
              },
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F3ED] text-[#2C2C2C] font-sans overflow-hidden selection:bg-[#2C2C2C]/10 relative">
      {jobStatus && (
        <div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#F5F3ED]"
          aria-live="polite"
          aria-busy="true"
        >
          <h2 className="text-2xl font-bold animate-pulse text-ink-dark">
            {jobStatus.message}
          </h2>
          <div className="mt-6 w-64 h-2 bg-ink-dark/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-ink-dark transition-all duration-1000 ease-in-out"
              style={{ width: `${Math.max(10, jobStatus.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      <GlobalProgressBanner isSyncing={isSyncing} activeTasks={activeTasks} />
      <SyncReviewModal
        isOpen={isSyncReviewOpen}
        onClose={() => setIsSyncReviewOpen(false)}
        syncQueue={syncQueue}
        onCommit={handleCommitSyncChanges}
      />

      <InsightGeneratorModal
        isOpen={isInsightGeneratorOpen}
        onClose={() => setIsInsightGeneratorOpen(false)}
        onInsightGenerated={(insight) => {
          setDerivedInsights((prev) => [insight, ...prev]);
          addLog(
            "Insight Added",
            "New insight saved to library: " + insight.title,
            "success",
          );
        }}
        rawContextData={rawContextData}
      />

      <InsightQuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        insights={derivedInsights}
        onRankInsight={(winnerId, loserId) => {
          setDerivedInsights((prev) =>
            prev.map((insight) => {
              if (insight.id === winnerId) {
                return {
                  ...insight,
                  impact:
                    insight.impact === "low"
                      ? "medium"
                      : insight.impact === "medium"
                        ? "high"
                        : "critical",
                };
              }
              if (insight.id === loserId) {
                return {
                  ...insight,
                  impact:
                    insight.impact === "critical"
                      ? "high"
                      : insight.impact === "high"
                        ? "medium"
                        : "low",
                };
              }
              return insight;
            }),
          );
        }}
      />

      {/* --- SIDEBAR --- */}
      <aside className="w-64 shrink-0 bg-paper-light border-r border-ink-dark/20 flex flex-col z-20 shadow-storybook">
        <div className="p-6 shrink-0 flex items-center gap-3">
          <div className="w-8 h-8 shrink-0 bg-[#2C2C2C] rounded-storybook-sm flex items-center justify-center shadow-storybook">
            <Database className="w-4 h-4 text-[#F5F3ED]" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-ink-dark leading-tight">
              NicheAI
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <NavItem
            icon={<Sparkles size={18} />}
            label="Pivot Simulator"
            active={activeTab === "ideation"}
            onClick={() => {
              setActiveTab("ideation");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Zap size={18} />}
            label="Rapid PDLC"
            active={activeTab === "rapid-pdlc"}
            onClick={() => {
              setActiveTab("rapid-pdlc");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={activeTab === "dashboard"}
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Package size={18} />}
            label="My Product"
            active={activeTab === "my-product"}
            onClick={() => {
              setActiveTab("my-product");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<TableProperties size={18} />}
            label="Competitor Matrix"
            active={activeTab === "matrix"}
            onClick={() => {
              setActiveTab("matrix");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Archive size={18} />}
            label="Raw Data Library"
            active={activeTab === "rawdata"}
            onClick={() => {
              setActiveTab("rawdata");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<PieChart size={18} />}
            label="Insight Library"
            active={activeTab === "reports"}
            onClick={() => {
              setActiveTab("reports");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Newspaper size={18} />}
            label="Market Analysis"
            active={activeTab === "market-analysis"}
            onClick={() => {
              setActiveTab("market-analysis");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Network size={18} />}
            label="Mindmap Explorer"
            active={activeTab === "mindmap"}
            onClick={() => {
              setActiveTab("mindmap");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Activity size={18} />}
            label="Background Tasks & Sync"
            active={activeTab === "actions"}
            onClick={() => {
              setActiveTab("actions");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<LayoutTemplate size={18} />}
            label="Analytical Templates"
            active={activeTab === "templates"}
            onClick={() => {
              setActiveTab("templates");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          <NavItem
            icon={<Heart size={18} />}
            label="Support & Feedback"
            active={activeTab === "support"}
            onClick={() => {
              setActiveTab("support");
              setSelectedCompetitorId(null);
              setSelectedSourceId(null);
              setSelectedSummaryId(null);
            }}
          />
          {isSuperadmin && (
            <NavItem
              icon={<ShieldCheck size={18} />}
              label="Superadmin"
              active={activeTab === "superadmin"}
              onClick={() => {
                setActiveTab("superadmin");
                setSelectedCompetitorId(null);
                setSelectedSourceId(null);
                setSelectedSummaryId(null);
              }}
            />
          )}
          {isSuperadmin && (
            <NavItem
              icon={<AlertTriangle size={18} />}
              label="DLQ Admin"
              active={activeTab === "dlq"}
              onClick={() => {
                setActiveTab("dlq");
                setSelectedCompetitorId(null);
                setSelectedSourceId(null);
                setSelectedSummaryId(null);
              }}
            />
          )}
        </nav>

        <div className="mt-auto p-4 border-t border-ink-dark/20 shrink-0 bg-paper-light">
          <button
            onClick={() => {
              setIsQuestModalOpen(true);
              setHasQuestNotification(false);
            }}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-storybook-sm hover:bg-paper-base transition-colors text-left relative group"
          >
            <div className="relative w-8 h-8 shrink-0 rounded-full bg-paper-card border border-ink-dark/30 flex items-center justify-center text-xs font-sans font-bold text-ink-dark shadow-storybook-inner">
              KF
              {hasQuestNotification && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-terracotta border-2 border-paper-light rounded-full animate-pulse shadow-[0_0_10px_rgba(193,110,90,0.8)]"></span>
              )}
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-sans font-semibold text-ink-dark truncate transition-colors">
                Founders Team
              </p>
              <p className="font-sans text-ink-faint text-xs truncate">
                Admin Access
              </p>
            </div>
            {hasQuestNotification && (
              <div className="absolute right-2 text-[10px] uppercase tracking-wider text-terracotta font-bold bg-terracotta/10 px-2 py-0.5 rounded border border-terracotta/20 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity">
                Quest
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <MarketShiftBanner />
        {syncQueue.length > 0 && (
          <div className="bg-sky text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 z-40">
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="animate-spin-slow" />
              <div>
                <span className="font-bold">Sync Pending Review:</span>
                <span className="ml-2 text-white/90">
                  {syncQueue.length} automated updates are waiting for your
                  approval.
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSyncReviewOpen(true)}
              className="px-4 py-1.5 bg-white text-sky font-bold text-sm rounded-lg hover:bg-white/90 transition-colors shadow-sm"
            >
              Review Changes
            </button>
          </div>
        )}

        {/* TOASTS */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-top-4 fade-in duration-300 ${
                toast.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : toast.type === "error"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : toast.type === "loading"
                      ? "bg-paper-base text-[#2C2C2C] border border-ink-dark/20"
                      : "bg-paper-base text-ink-dark border border-ink-dark/20 "
              }`}
            >
              {toast.type === "success" && <CheckCircle2 size={16} />}
              {toast.type === "error" && <XCircle size={16} />}
              {toast.type === "loading" && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {toast.type === "info" && <Info size={16} />}
              {toast.message}
            </div>
          ))}
        </div>

        {/* IMAGE MODAL */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-50 bg-ink-dark/90 flex items-center justify-center p-8 animate-in fade-in duration-200"
            onClick={() => setExpandedImage(null)}
          >
            <div
              className="relative max-w-5xl w-full max-h-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute -top-12 right-0 text-[#8A8A8A] hover:text-[#2C2C2C] p-2 transition-colors"
              >
                <XCircle size={24} />
              </button>
              <img
                src={expandedImage}
                alt="Expanded Media"
                className="max-w-full max-h-[85vh] object-contain rounded-lg border border-ink-dark/20 shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <Tooltip
                content={tMessage(dictionary.tooltips.common.downloadImage)}
                position="bottom"
              >
                <button
                  onClick={() => window.open(expandedImage, "_blank")}
                  className="flex items-center gap-2 px-5 py-2 border border-[#F5F3ED] text-[#F5F3ED] rounded-full text-sm font-sans font-medium hover:bg-[#F5F3ED] hover:text-[#2C2C2C] transition-all duration-300"
                >
                  <Download size={16} /> Download Image
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* SYNC INFO MODAL */}
        {showSyncInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-dark/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSyncInfo(false)}
          >
            <div
              className="bg-paper-light border border-ink-dark/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-ink-dark/20 ">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-paper-base flex items-center justify-center">
                    <RefreshCw size={20} className="text-moss" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink-dark ">
                      About System Synchronization
                    </h2>
                    <p className="text-sm text-[#8A8A8A] ">
                      How NicheAI keeps your data fresh
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSyncInfo(false)}
                  className="text-[#8A8A8A] hover:text-ink-dark :text-ink-dark transition-colors p-2 rounded-full hover:bg-paper-base :bg-paper-card"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-ink-dark ">
                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Database size={18} className="text-moss" /> What happens
                    during a sync?
                  </h3>
                  <p className="text-sm leading-relaxed">
                    When you trigger a "Sync Now" operation, NicheAI initiates a
                    comprehensive background process to update all your market
                    intelligence data. This involves several concurrent tasks:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-[#8A8A8A] ">
                    <li>
                      <strong className="text-ink-dark ">
                        Scraping Competitor Pricing:
                      </strong>{" "}
                      We fetch the latest pricing tiers and feature matrices
                      from your tracked competitors.
                    </li>
                    <li>
                      <strong className="text-ink-dark ">
                        Analyzing Market Trends:
                      </strong>{" "}
                      We scan recent news, press releases, and industry reports
                      for relevant shifts.
                    </li>
                    <li>
                      <strong className="text-ink-dark ">
                        Queueing Sync Diffs:
                      </strong>{" "}
                      New data is not immediately committed. Instead, it is sent
                      to the <strong>Sync Review Queue</strong> where you can
                      accept or reject individual field changes.
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity size={18} className="text-moss" /> Background Task
                    Management
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Sync operations are resource-intensive. To ensure system
                    stability and prevent data corruption,{" "}
                    <strong className="text-[#2C2C2C]">
                      only one global sync can run at a time
                    </strong>
                    . Additionally, new syncs cannot start if there are pending
                    items in the Sync Review Queue.
                  </p>
                  <div className="bg-paper-base p-4 rounded-xl border border-ink-dark/30">
                    <p className="text-sm">
                      If you are on the Alpha tier, your daily usage is strictly
                      limited to 1 global sync per day to control API costs.
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Clock size={18} className="text-moss" /> Estimated
                    Completion Times
                  </h3>
                  <p className="text-sm leading-relaxed">
                    A full global sync typically takes between{" "}
                    <strong className="text-[#2C2C2C]">20 to 45 seconds</strong>
                    , depending on the volume of data sources and the complexity
                    of the AI analysis required. The system provides a real-time
                    estimate during the process.
                  </p>
                </section>
              </div>

              <div className="p-6 border-t border-ink-dark/20 bg-paper-base/30 flex justify-end">
                <button
                  onClick={() => setShowSyncInfo(false)}
                  className="px-6 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE GUIDE MODAL */}
        <PageGuideModal
          isOpen={isPageGuideOpen}
          onClose={() => setIsPageGuideOpen(false)}
          activeTab={activeTab}
          onDoNotShowAgain={() => {
            setSeenGuides((prev) => ({ ...prev, [activeTab]: -1 }));
          }}
        />

        <UploadDataModal
          isOpen={isUploadDataModalOpen}
          onClose={() => setIsUploadDataModalOpen(false)}
          competitors={competitors}
          onDataAnalyzed={(newSources, newInsights) => {
            setRawDataSources((prev) => [...newSources, ...prev]);
            setDerivedInsights((prev) => [...newInsights, ...prev]);
            addLog(
              "Data Uploaded",
              `Analyzed uploaded file and extracted ${newSources.length} sources and ${newInsights.length} insights.`,
              "success",
            );
            addToast(
              `Added ${newSources.length} sources and ${newInsights.length} insights`,
              "success",
            );
          }}
        />

        <ConsolidateFeaturesModal
          isOpen={isConsolidateModalOpen}
          onClose={() => setIsConsolidateModalOpen(false)}
          competitors={rawCompetitors}
          onConsolidate={(updates) => {
            setCompetitors((prev) =>
              prev.map((c) => {
                const update = updates.find((u) => u.competitorId === c.id);
                if (update) {
                  return { ...c, coreFeatures: update.newFeatures };
                }
                return c;
              }),
            );
            addLog(
              "Capabilities Aggregated",
              "Successfully aggregated similar features into unique capabilities across competitors.",
              "success",
            );
            addToast("Capabilities aggregated successfully", "success");
          }}
        />

        <TaxonomyMergeModal
          isOpen={isTaxonomyMergeModalOpen}
          onClose={() => setIsTaxonomyMergeModalOpen(false)}
          competitors={rawCompetitors}
        />

        {/* COMPETITOR DISCOVERY MODAL */}
        <CompetitorDiscoveryModal
          isOpen={isDiscoveryModalOpen}
          onClose={() => setIsDiscoveryModalOpen(false)}
          baseIdea={{
            name: myProductData?.name || "New Idea",
            description: myProductData?.description || "",
          }}
          onConfirm={async (selectedCompetitors) => {
            setIsDiscoveryModalOpen(false);

            // 1. Update the local/firestore state
            setCompetitors((prev) => [...prev, ...selectedCompetitors]);

            // 2. Immediately trigger the global sync passing the selected competitors to bypass the stale state
            handleGlobalSync(1, {}, selectedCompetitors);
          }}
          addToast={addToast}
        />

        {/* CREATE INSIGHT MODAL */}
        <InsightBrainstormModal
          isOpen={isBrainstormModalOpen}
          onClose={() => setIsBrainstormModalOpen(false)}
          competitors={competitors}
          insights={derivedInsights}
          rawData={rawDataSources}
          onSaveInsight={(insight) => {
            const newInsight = {
              ...insight,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
            };
            setDerivedInsights((prev) => [newInsight, ...prev]);
            addLog(
              "Insight Engine",
              `Saved brainstormed insight: ${insight.title}`,
              "success",
            );
            addToast("Insight saved to library", "success");
          }}
        />
        {isCreateInsightOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink-dark/80 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
            onClick={() => setIsCreateInsightOpen(false)}
          >
            <div
              className="bg-paper-card border border-ink-dark/20 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-ink-dark/20 flex justify-between items-center">
                <h3 className="text-xl font-bold text-ink-dark flex items-center gap-2">
                  <Sparkles className="text-[#8A8A8A] " /> Create Insight
                </h3>
                <button
                  onClick={() => setIsCreateInsightOpen(false)}
                  className="text-[#8A8A8A] hover:text-ink-dark transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-[#8A8A8A] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newInsightForm.title}
                    onChange={(e) =>
                      setNewInsightForm({
                        ...newInsightForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full bg-paper-base border border-ink-dark/20 rounded-lg px-4 py-2 text-ink-dark focus:outline-none focus:border-[#2C2C2C]"
                    placeholder="e.g., New Competitor Feature Detected"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8A8A8A] mb-1">
                      Category
                    </label>
                    <select
                      value={newInsightForm.category}
                      onChange={(e) =>
                        setNewInsightForm({
                          ...newInsightForm,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full bg-paper-base border border-ink-dark/20 rounded-lg px-4 py-2 text-ink-dark focus:outline-none focus:border-[#2C2C2C]"
                    >
                      <option value="opportunity">Opportunity</option>
                      <option value="threat">Threat</option>
                      <option value="trend">Trend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8A8A8A] mb-1">
                      Impact
                    </label>
                    <select
                      value={newInsightForm.impact}
                      onChange={(e) =>
                        setNewInsightForm({
                          ...newInsightForm,
                          impact: e.target.value as any,
                        })
                      }
                      className="w-full bg-paper-base border border-ink-dark/20 rounded-lg px-4 py-2 text-ink-dark focus:outline-none focus:border-[#2C2C2C]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8A8A8A] mb-1">
                    Description (Markdown Supported)
                  </label>
                  <textarea
                    value={newInsightForm.description}
                    onChange={(e) =>
                      setNewInsightForm({
                        ...newInsightForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-paper-base border border-ink-dark/20 rounded-lg px-4 py-2 text-ink-dark focus:outline-none focus:border-[#2C2C2C] h-32 resize-none"
                    placeholder="Describe the insight, add links, or paste data..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-ink-dark/20 flex justify-end gap-3 bg-paper-card/50 rounded-b-2xl">
                <Tooltip
                  content={tMessage(dictionary.tooltips.insight.discard)}
                  position="top"
                >
                  <button
                    onClick={() => setIsCreateInsightOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-[#8A8A8A] hover:text-ink-dark transition-colors"
                  >
                    Cancel
                  </button>
                </Tooltip>
                <Tooltip
                  content={tMessage(dictionary.tooltips.insight.save)}
                  position="top"
                >
                  <button
                    onClick={() => {
                      if (!newInsightForm.title || !newInsightForm.description)
                        return addToast(
                          "Title and description required",
                          "error",
                        );
                      const newInsight: DerivedInsight = {
                        id: `di-${Date.now()}`,
                        title: newInsightForm.title,
                        description: newInsightForm.description,
                        category: newInsightForm.category as any,
                        impact: newInsightForm.impact as any,
                        timestamp: new Date().toISOString(),
                        source: "Human",
                      };
                      setDerivedInsights((prev) => [newInsight, ...prev]);
                      setIsCreateInsightOpen(false);
                      setNewInsightForm({
                        title: "",
                        description: "",
                        category: "opportunity" as const,
                        impact: "medium",
                      });
                      addToast("Insight created successfully", "success");
                    }}
                    className="px-6 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                  >
                    Save Insight
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="h-16 border-b border-ink-dark/20 bg-paper-base/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3 text-sm font-sans">
            <span className="font-semibold text-ink-dark">
              Market Intelligence
            </span>
            <span className="text-ink-faint">/</span>
            <span className="text-ink-muted capitalize">
              {activeTab ? activeTab.replace("-", " ") : "dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Tooltip
              content={tMessage(dictionary.tooltips.navigation.pageGuide)}
              position="bottom"
            >
              <button
                aria-label="Open Page Guide"
                onClick={() => {
                  console.log("PAGE GUIDE CLICKED");
                  setIsPageGuideOpen(true);
                }}
                className="p-2 text-ink-dark/60 hover:text-ink-dark hover:bg-ink-dark/5 rounded-full transition-colors"
              >
                <HelpCircle size={18} />
              </button>
            </Tooltip>
            <DeepValidationButton
              isSyncing={isSyncing}
              syncProgress={syncProgress}
              handleGlobalSync={() => {
                if (syncQueue.length > 0) {
                  addToast(
                    "Please review and commit pending sync changes first.",
                    "error",
                  );
                  return;
                }
                handleGlobalSync();
              }}
              setShowSyncInfo={setShowSyncInfo}
            />
          </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* SOURCE PAGE */}
            {selectedSourceId && (
              <SourcePage
                source={rawDataSources.find((s) => s.id === selectedSourceId)!}
                competitorName={
                  competitors.find(
                    (c) =>
                      c.id ===
                      rawDataSources.find((s) => s.id === selectedSourceId)
                        ?.competitorId,
                  )?.name || "Unknown"
                }
                linkedInsights={derivedInsights.filter((i) =>
                  rawDataSources
                    .find((s) => s.id === selectedSourceId)
                    ?.linkedInsightIds?.includes(i.id),
                )}
                onBack={() => setSelectedSourceId(null)}
                onExpandImage={(url) => setExpandedImage(url)}
                onCopy={(text) => {
                  navigator.clipboard.writeText(text);
                  addToast("Copied text with context", "success");
                }}
              />
            )}

            {/* HEAD TO HEAD COMPARISON PAGE */}
            {comparingCompetitorIds.length > 0 && (
              <HeadToHeadComparison
                competitorIds={comparingCompetitorIds}
                competitors={competitors}
                myProductData={myProductData}
                onBack={() => setComparingCompetitorIds([])}
              />
            )}

            {/* SUMMARY PAGE */}
            {comparingCompetitorIds.length === 0 &&
              !selectedSourceId &&
              selectedSummaryId && (
                <SummaryPage
                  productContext={
                    myProductData.name ||
                    myProductData.description ||
                    "the product's market"
                  }
                  title={selectedSummaryId}
                  value={
                    selectedSummaryId === "Competitors Tracked"
                      ? stats.tracked
                      : selectedSummaryId === "Recent Pricing Changes"
                        ? stats.pricingChanges
                        : selectedSummaryId === "Features Indexed"
                          ? stats.featuresIndexed
                          : selectedSummaryId === "Est. Market Value"
                            ? stats.estimatedMarketValue
                            : stats.topIntegrations
                  }
                  trend={
                    selectedSummaryId === "Competitors Tracked"
                      ? stats.trends.tracked
                      : selectedSummaryId === "Recent Pricing Changes"
                        ? stats.trends.pricingChanges
                        : selectedSummaryId === "Features Indexed"
                          ? stats.trends.featuresIndexed
                          : selectedSummaryId === "Est. Market Value"
                            ? stats.trends.estimatedMarketValue
                            : undefined
                  }
                  icon={<Database size={18} className="text-[#8A8A8A]" />}
                  stats={stats}
                  competitors={competitors}
                  featureDetails={featureDetails}
                  setFeatureDetails={setFeatureDetails}
                  onBack={() => setSelectedSummaryId(null)}
                  onAddFeatureToProduct={(featureName: string) => {
                    if (
                      !myProductData.features.some(
                        (f) => f.name === featureName,
                      )
                    ) {
                      setMyProductData((prev) => ({
                        ...prev,
                        features: [
                          ...prev.features,
                          {
                            id: Date.now().toString(),
                            name: featureName,
                            status: "planned" as const,
                            description: "",
                          },
                        ],
                      }));
                    }
                  }}
                  comparingCompetitorIds={comparingCompetitorIds}
                  setComparingCompetitorIds={setComparingCompetitorIds}
                />
              )}

            {/* SCOUT PAGE (Detailed Competitor View) */}
            {(activeTab === "dashboard" || activeTab === "matrix") &&
              selectedCompetitorId &&
              !selectedSourceId &&
              !selectedSummaryId && (
                <ScoutPage
                  competitor={
                    competitors.find((c) => c.id === selectedCompetitorId)!
                  }
                  onBack={() => setSelectedCompetitorId(null)}
                  sources={rawDataSources.filter(
                    (s) => s.competitorId === selectedCompetitorId,
                  )}
                  onSourceClick={(id) => setSelectedSourceId(id)}
                  onToggleLock={(field: string) => {
                    setCompetitors((prev) =>
                      prev.map((c) => {
                        if (c.id === selectedCompetitorId) {
                          return {
                            ...c,
                            verifiedFields: {
                              ...c.verifiedFields,
                              [field]: !c.verifiedFields?.[field],
                            },
                          };
                        }
                        return c;
                      }),
                    );
                  }}
                />
              )}

            {activeTab === "my-product" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <MyProduct
                  projectId={productId}
                  productData={myProductData}
                  setProductData={setMyProductData}
                  competitors={competitors}
                  insights={derivedInsights}
                />
              )}

            {/* EPIC 1: SUMMARY CARDS (Visible on Dashboard) */}
            {activeTab === "dashboard" &&
              !selectedSummaryId &&
              !selectedCompetitorId &&
              !selectedSourceId && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-8 mt-4">
                    <div>
                      <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                        ダッシュボード
                      </p>
                      <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                        Dashboard
                      </h1>
                      <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                        High-level summary of the BaaS form space.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <SummaryCard
                      title="Competitors Tracked"
                      value={stats.tracked.toString()}
                      icon={<Users size={24} />}
                      trend={stats.trends.tracked}
                      onClick={() =>
                        setSelectedSummaryId("Competitors Tracked")
                      }
                      colorClass="text-[#2C2C2C]"
                      bgClass="bg-paper-base"
                    />
                    <SummaryCard
                      title="Recent Pricing Changes"
                      value={stats.pricingChanges.toString()}
                      icon={<Zap size={24} />}
                      trend={stats.trends.pricingChanges}
                      trendType="warning"
                      onClick={() =>
                        setSelectedSummaryId("Recent Pricing Changes")
                      }
                      colorClass="text-terracotta"
                      bgClass="bg-terracotta/10"
                    />
                    <SummaryCard
                      title="Features Indexed"
                      value={stats.featuresIndexed.toString()}
                      icon={<Database size={24} />}
                      trend={stats.trends.featuresIndexed}
                      onClick={() => setSelectedSummaryId("Features Indexed")}
                      colorClass="text-sage"
                      bgClass="bg-sage/10"
                    />
                    <SummaryCard
                      title="Top Integrations"
                      value={stats.topIntegrations}
                      valueNode={renderIntegrations(stats.topIntegrations)}
                      icon={<GlobeLock size={24} />}
                      subtitle="Most common across market"
                      onClick={() => setSelectedSummaryId("Top Integrations")}
                      colorClass="text-sky"
                      bgClass="bg-sky/10"
                    />
                    <SummaryCard
                      title="Est. Market Value"
                      value={stats.estimatedMarketValue}
                      icon={<DollarSign size={24} />}
                      subtitle="BaaS Form Market"
                      onClick={() =>
                        setSelectedSummaryId("Estimated Market Value")
                      }
                      colorClass="text-emerald-600"
                      bgClass="bg-emerald-50"
                    />
                  </div>

                  <DashboardExtensions
                    productData={myProductData}
                    setProductData={setMyProductData}
                    insights={derivedInsights}
                    competitors={competitors}
                  />
                </div>
              )}

            {/* EPIC 2: ADVANCED COMPETITOR MATRIX (Visible on Dashboard & Matrix tabs) */}
            {(activeTab === "dashboard" || activeTab === "matrix") &&
              !selectedCompetitorId &&
              !selectedSummaryId &&
              !selectedSourceId && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                  {activeTab === "matrix" && (
                    <div className="flex justify-between items-end mb-8 mt-4">
                      <div>
                        <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                          競合マトリックス
                        </p>
                        <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                          Competitor Matrix
                        </h1>
                        <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                          Deep-dive comparison to identify strategic gaps.
                        </p>
                      </div>
                      <div className="hidden sm:flex gap-2">
                        <div className="flex gap-2">
                          <Tooltip
                            content={tMessage(
                              dictionary.tooltips.matrix.aggregateFeatures,
                            )}
                            position="top"
                          >
                            <button
                              onClick={() => setIsConsolidateModalOpen(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                            >
                              <Combine size={16} /> Auto-Aggregate
                            </button>
                          </Tooltip>
                          <Tooltip
                            content={
                              "Manually merge taxonomy features (HITL)" as any
                            }
                            position="top"
                          >
                            <button
                              onClick={() => setIsTaxonomyMergeModalOpen(true)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-full text-sm font-sans font-medium hover:bg-indigo-600 hover:text-white transition-all duration-300"
                            >
                              <Combine size={16} /> Manual Merge
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Intensity of Rivalry Visualization */}
                  {activeTab === "matrix" && sortedCompetitors.length > 0 && (
                    <div className="mb-8 bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-storybook-inner font-sans">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-[#2C2C2C] font-semibold">
                          Intensity of Rivalry (Chen, 1996)
                        </h3>
                        <Tooltip
                          content={tMessage(
                            "Market Commonality vs Resource Similarity. High values in both indicate direct, intense rivalry and high retaliation threat.",
                          )}
                          position="top"
                        >
                          <Info className="w-4 h-4 text-ink-dark/50 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minHeight={1}
                        >
                          <ScatterChart
                            margin={{
                              top: 20,
                              right: 20,
                              bottom: 20,
                              left: 20,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.3}
                            />
                            <XAxis
                              type="number"
                              dataKey="marketCommonality"
                              name="Market Commonality"
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                            >
                              <Label
                                value="Market Commonality (Overlap in Target Markets)"
                                offset={-15}
                                position="insideBottom"
                                fontSize={12}
                                fill="#8A8A8A"
                              />
                            </XAxis>
                            <YAxis
                              type="number"
                              dataKey="resourceSimilarity"
                              name="Resource Similarity"
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                            >
                              <Label
                                value="Resource Similarity (Overlap in Capabilities)"
                                angle={-90}
                                position="insideLeft"
                                style={{ textAnchor: "middle" }}
                                fontSize={12}
                                fill="#8A8A8A"
                              />
                            </YAxis>
                            <ZAxis
                              type="category"
                              dataKey="name"
                              name="Competitor"
                            />
                            <RechartsTooltip
                              cursor={{ strokeDasharray: "3 3" }}
                              formatter={(value: any, name: any) => [
                                value,
                                name,
                              ]}
                            />
                            <ReferenceLine
                              x={50}
                              stroke="#8A8A8A"
                              strokeOpacity={0.3}
                            />
                            <ReferenceLine
                              y={50}
                              stroke="#8A8A8A"
                              strokeOpacity={0.3}
                            />
                            <Scatter
                              name="Competitors"
                              data={sortedCompetitors.map((c) => ({
                                name: c.name,
                                marketCommonality:
                                  c.marketCommonalityIndex || 0,
                                resourceSimilarity:
                                  c.resourceSimilarityScore || 0,
                              }))}
                              fill="#2C2C2C"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className="w-full overflow-hidden font-sans">
                    {/* Matrix Toolbar */}
                    <div className="pb-4 flex flex-col sm:flex-row justify-end items-center gap-4">
                      <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="text"
                          placeholder="Search competitors (e.g. form builder, open source)..."
                          value={competitorSearch}
                          onChange={(e) => setCompetitorSearch(e.target.value)}
                          className="w-full bg-paper-base shadow-storybook-inner border border-ink-dark/30 rounded-full pl-9 pr-4 py-1.5 text-sm font-sans text-ink-dark placeholder:text-ink-faint focus:outline-none focus:border-[#2C2C2C] transition-all"
                        />
                      </div>
                      <select
                        value={matrixFilter}
                        onChange={(e) => setMatrixFilter(e.target.value)}
                        className="bg-paper-base border border-ink-dark/20 rounded-lg px-3 py-2 text-sm text-ink-dark focus:outline-none focus:border-[#2C2C2C]"
                      >
                        <option value="All">All Segments & Regions</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="SMB">SMB</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Developers">Developers</option>
                        <option value="EU">EU Region</option>
                        <option value="US">US Region</option>
                        <option value="Self-Hosted">Self-Hosted</option>
                      </select>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Tooltip
                          content={tMessage(
                            dictionary.tooltips.matrix.exportMarkdown,
                          )}
                          position="top"
                        >
                          <button
                            onClick={exportToMarkdown}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                          >
                            <Download size={16} />
                            Export
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Matrix Table (Horizontal & Vertical Scroll) */}
                    <div className="overflow-auto max-h-[600px] relative">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-[#8A8A8A] uppercase tracking-widest font-semibold border-b border-[#2C2C2C]/30 pb-3 mb-4">
                          <tr>
                            <SortableHeader
                              label="Competitor"
                              field="name"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                              className="sticky left-0 bg-[#F5F3ED] z-20"
                            />
                            <SortableHeader
                              label="Market Commonality"
                              field="marketCommonalityIndex"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                              tooltip="Market Commonality (Chen, 1996): The degree to which a competitor targets the same customer segments and geographic markets as you. High commonality deters initial attacks but guarantees aggressive retaliation."
                            />
                            <SortableHeader
                              label="Resource Similarity"
                              field="resourceSimilarityScore"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                              tooltip="Resource Similarity (Chen, 1996): How comparable a competitor's tangible (funding, headcount) and intangible (tech stack, brand) resources are to yours. High similarity indicates they can easily replicate your strategic moves."
                            />
                            <SortableHeader
                              label="Free Tier Limits"
                              field="freeTier"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label="Market Segments"
                              field="marketSegments"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                            <SortableHeader
                              label="Data Sovereignty"
                              field="dataSovereignty"
                              currentSort={sortField}
                              sortOrder={sortOrder}
                              onSort={handleSort}
                            />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-dark/30">
                          {sortedCompetitors
                            .slice(
                              (matrixCurrentPage - 1) * matrixItemsPerPage,
                              matrixCurrentPage * matrixItemsPerPage,
                            )
                            .map((comp) => (
                              <tr
                                key={comp.id}
                                className="hover:bg-white/40 transition-colors group cursor-pointer border-b border-[#2C2C2C]/5"
                                onClick={() => setSelectedCompetitorId(comp.id)}
                              >
                                {/* Sticky First Column */}
                                <td className="px-6 py-5 sticky left-0 bg-[#F5F3ED] group-hover:bg-white/40 transition-colors z-0">
                                  <h3 className="text-[#2C2C2C] font-bold text-base">
                                    {comp.name}
                                  </h3>
                                  <p className="text-ink-dark text-xs">
                                    {comp.website}
                                  </p>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-paper-base rounded-full h-1.5 max-w-[80px]">
                                      <div
                                        className="bg-[#2C2C2C] h-1.5 rounded-full"
                                        style={{
                                          width: `${comp.marketCommonalityIndex}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-ink-dark ">
                                      {comp.marketCommonalityIndex}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-paper-base rounded-full h-1.5 max-w-[80px]">
                                      <div
                                        className="bg-[#8A8A8A] h-1.5 rounded-full"
                                        style={{
                                          width: `${comp.resourceSimilarityScore}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium text-ink-dark ">
                                      {comp.resourceSimilarityScore}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-[#2C2C2C]">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-paper-base border border-ink-dark/20 text-xs font-medium">
                                    {comp.freeTier}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                    {comp.marketSegments.map((segment, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-paper-base text-ink-dark rounded text-[10px] uppercase tracking-wider font-medium"
                                      >
                                        {segment}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <SovereigntyBadge
                                    status={comp.dataSovereignty}
                                    score={comp.sovereigntyScore}
                                  />
                                </td>
                              </tr>
                            ))}
                          {sortedCompetitors.length === 0 && (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-12 text-center text-[#8A8A8A] "
                              >
                                <div className="flex flex-col items-center justify-center">
                                  <Search className="w-8 h-8 mb-3 opacity-20" />
                                  <p>
                                    No competitors found matching "
                                    {competitorSearch}"
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {Math.max(
                      1,
                      Math.ceil(sortedCompetitors.length / matrixItemsPerPage),
                    ) > 1 && (
                      <div className="mt-4 flex justify-between items-center bg-paper-card p-4 rounded-xl border border-ink-dark/20 shadow-sm">
                        <div className="text-sm text-ink-dark/60">
                          Showing{" "}
                          {(matrixCurrentPage - 1) * matrixItemsPerPage + 1} to{" "}
                          {Math.min(
                            matrixCurrentPage * matrixItemsPerPage,
                            sortedCompetitors.length,
                          )}{" "}
                          of {sortedCompetitors.length} competitors
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setMatrixCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={matrixCurrentPage === 1}
                            className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex gap-1">
                            {Array.from({
                              length: Math.max(
                                1,
                                Math.ceil(
                                  sortedCompetitors.length / matrixItemsPerPage,
                                ),
                              ),
                            }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setMatrixCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${matrixCurrentPage === i + 1 ? "bg-ink-dark text-paper-light" : "text-ink-dark hover:bg-paper-base"}`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() =>
                              setMatrixCurrentPage((p) =>
                                Math.min(
                                  Math.max(
                                    1,
                                    Math.ceil(
                                      sortedCompetitors.length /
                                        matrixItemsPerPage,
                                    ),
                                  ),
                                  p + 1,
                                ),
                              )
                            }
                            disabled={
                              matrixCurrentPage ===
                              Math.max(
                                1,
                                Math.ceil(
                                  sortedCompetitors.length / matrixItemsPerPage,
                                ),
                              )
                            }
                            className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* RAW DATA LIBRARY TAB */}
            {activeTab === "rawdata" && !selectedSourceId && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 mt-4">
                  <div>
                    <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                      生データライブラリ
                    </p>
                    <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                      Raw Data Library
                    </h1>
                    <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                      Explore the source data scraped from competitors.
                    </p>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <ExportButton
                      onExport={() => {
                        const csvContent =
                          "data:text/csv;charset=utf-8," +
                          "ID,Competitor ID,Type,Source URL,Timestamp,Confidence\n" +
                          filteredRawData
                            .map(
                              (d) =>
                                `${d.id},${d.competitorId},${d.type},${d.sourceUrl},${d.timestamp},${d.confidenceLevel}`,
                            )
                            .join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "raw_data_library.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      label="Export Data"
                      tooltipText="Export filtered raw data as CSV"
                      actionName="export_raw_data"
                    />
                    <Tooltip
                      content={tMessage(dictionary.tooltips.rawData.upload)}
                      position="top"
                    >
                      <button
                        onClick={() => setIsUploadDataModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                      >
                        <Upload size={16} /> Upload Data
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center bg-paper-card p-3 rounded-xl border border-ink-dark/20 shadow-sm">
                  <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                    <input
                      type="text"
                      placeholder="Search raw data..."
                      value={rawDataSearch}
                      onChange={(e) => setRawDataSearch(e.target.value)}
                      className="w-full bg-paper-base shadow-storybook-inner border border-ink-dark/30 rounded-full pl-9 pr-4 py-1.5 text-sm font-sans text-ink-dark placeholder:text-ink-faint focus:outline-none focus:border-[#2C2C2C] transition-all"
                    />
                  </div>
                  <select
                    value={rawDataTypeFilter}
                    onChange={(e) => setRawDataTypeFilter(e.target.value)}
                    className="bg-paper-base shadow-storybook-inner border border-ink-dark/30 rounded-full px-3 py-1.5 text-sm text-ink-dark focus:outline-none focus:border-[#2C2C2C] transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Media Types</option>
                    <option value="website">Websites</option>
                    <option value="api">APIs</option>
                    <option value="github">GitHub</option>
                    <option value="screenshot">Screenshots</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="crunchbase">Crunchbase</option>
                    <option value="news">News</option>
                  </select>
                  <select
                    value={rawDataCompanyFilter}
                    onChange={(e) => setRawDataCompanyFilter(e.target.value)}
                    className="bg-paper-base shadow-storybook-inner border border-ink-dark/30 rounded-full px-3 py-1.5 text-sm text-ink-dark focus:outline-none focus:border-[#2C2C2C] transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">All Companies</option>
                    {competitors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredRawData
                    .slice(
                      (rawDataCurrentPage - 1) * rawDataItemsPerPage,
                      rawDataCurrentPage * rawDataItemsPerPage,
                    )
                    .map((source) => (
                      <DataSourceCard
                        key={source.id}
                        source={source}
                        competitorName={
                          competitors.find((c) => c.id === source.competitorId)
                            ?.name || "Unknown"
                        }
                        onClick={() => setSelectedSourceId(source.id)}
                      />
                    ))}
                  {filteredRawData.length === 0 && (
                    <div className="col-span-2 p-12 text-center border border-dashed border-ink-dark/20 rounded-xl text-[#8A8A8A] ">
                      No data sources found matching your criteria.
                    </div>
                  )}
                  {Math.max(
                    1,
                    Math.ceil(filteredRawData.length / rawDataItemsPerPage),
                  ) > 1 && (
                    <div className="col-span-2 mt-4 flex justify-between items-center bg-paper-card p-4 rounded-xl border border-ink-dark/20 shadow-sm">
                      <div className="text-sm text-ink-dark/60">
                        Showing{" "}
                        {(rawDataCurrentPage - 1) * rawDataItemsPerPage + 1} to{" "}
                        {Math.min(
                          rawDataCurrentPage * rawDataItemsPerPage,
                          filteredRawData.length,
                        )}{" "}
                        of {filteredRawData.length} data sources
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setRawDataCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={rawDataCurrentPage === 1}
                          className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex gap-1">
                          {Array.from({
                            length: Math.max(
                              1,
                              Math.ceil(
                                filteredRawData.length / rawDataItemsPerPage,
                              ),
                            ),
                          }).map((_, i) => {
                            // Show limited pages to avoid overflow
                            const totalPages = Math.max(
                              1,
                              Math.ceil(
                                filteredRawData.length / rawDataItemsPerPage,
                              ),
                            );
                            if (totalPages > 7) {
                              if (
                                i !== 0 &&
                                i !== totalPages - 1 &&
                                Math.abs(i + 1 - rawDataCurrentPage) > 1
                              ) {
                                if (i + 1 === 2 || i + 1 === totalPages - 1)
                                  return (
                                    <span
                                      key={i}
                                      className="px-1 text-ink-dark/40"
                                    >
                                      ...
                                    </span>
                                  );
                                return null;
                              }
                            }
                            return (
                              <button
                                key={i}
                                onClick={() => setRawDataCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${rawDataCurrentPage === i + 1 ? "bg-ink-dark text-paper-light" : "text-ink-dark hover:bg-paper-base"}`}
                              >
                                {i + 1}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() =>
                            setRawDataCurrentPage((p) =>
                              Math.min(
                                Math.max(
                                  1,
                                  Math.ceil(
                                    filteredRawData.length /
                                      rawDataItemsPerPage,
                                  ),
                                ),
                                p + 1,
                              ),
                            )
                          }
                          disabled={
                            rawDataCurrentPage ===
                            Math.max(
                              1,
                              Math.ceil(
                                filteredRawData.length / rawDataItemsPerPage,
                              ),
                            )
                          }
                          className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INSIGHT LIBRARY TAB */}
            {activeTab === "reports" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-8 mt-4">
                    <div>
                      <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                        インサイトライブラリ
                      </p>
                      <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                        Insight Library
                      </h1>
                      <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                        Derived insights, market threats, and brainstorming
                        sessions.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <ExportButton
                        onExport={() => {
                          const csvContent =
                            "data:text/csv;charset=utf-8," +
                            "ID,Title,Category,Impact,Timestamp,Source\n" +
                            filteredInsights
                              .map(
                                (i) =>
                                  `${i.id},"${i.title.replace(/"/g, '""')}",${i.category},${i.impact},${i.timestamp},${i.source}`,
                              )
                              .join("\n");
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", "insight_library.csv");
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        label="Export Insights"
                        tooltipText="Export filtered insights as CSV"
                        actionName="export_insights"
                        className="hidden sm:flex"
                      />
                      <Tooltip
                        content={tMessage(
                          dictionary.tooltips.insight.brainstorm,
                        )}
                        position="top"
                      >
                        <button
                          onClick={() => setIsBrainstormModalOpen(true)}
                          className="flex items-center gap-2 px-5 py-2 border border-ochre text-ochre rounded-full text-sm font-sans font-medium hover:bg-ochre hover:text-white transition-all duration-300"
                        >
                          <MessageSquare size={16} />
                          Brainstorm
                        </button>
                      </Tooltip>
                      <Tooltip
                        content={tMessage(
                          dictionary.tooltips.insight.addManual,
                        )}
                        position="top"
                      >
                        <button
                          onClick={() => setIsCreateInsightOpen(true)}
                          className="flex items-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300"
                        >
                          <Sparkles size={16} />
                          New Insight
                        </button>
                      </Tooltip>
                      <div className="relative group">
                        <Tooltip
                          content={tMessage(dictionary.tooltips.rawData.export)}
                          position="top"
                        >
                          <button className="flex items-center gap-2 px-5 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300">
                            <Download size={16} /> Export
                          </button>
                        </Tooltip>
                        <div className="absolute right-0 mt-1 w-48 bg-paper-card border border-ink-dark/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          <div className="p-1 flex flex-col">
                            <button
                              onClick={() => handleExport("csv")}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-dark hover:bg-paper-base hover:text-ink-dark rounded-md text-left"
                            >
                              <FileSpreadsheet size={14} /> Export as CSV
                            </button>
                            <button
                              onClick={() => handleExport("txt")}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-dark hover:bg-paper-base hover:text-ink-dark rounded-md text-left"
                            >
                              <FileText size={14} /> Export as TXT
                            </button>
                            <button
                              onClick={() => handleExport("copy")}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-ink-dark hover:bg-paper-base hover:text-ink-dark rounded-md text-left"
                            >
                              <Copy size={14} /> Copy to Clipboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <SummaryCard
                      title="Competitors Tracked"
                      value={stats.tracked.toString()}
                      icon={<Users size={24} />}
                      trend={stats.trends.tracked}
                      onClick={() =>
                        setSelectedSummaryId("Competitors Tracked")
                      }
                      colorClass="text-[#2C2C2C]"
                      bgClass="bg-paper-base"
                    />
                    <SummaryCard
                      title="Recent Pricing Changes"
                      value={stats.pricingChanges.toString()}
                      icon={<Zap size={24} />}
                      trend={stats.trends.pricingChanges}
                      trendType="warning"
                      onClick={() =>
                        setSelectedSummaryId("Recent Pricing Changes")
                      }
                      colorClass="text-terracotta"
                      bgClass="bg-terracotta/10"
                    />
                    <SummaryCard
                      title="Features Indexed"
                      value={stats.featuresIndexed.toString()}
                      icon={<Database size={24} />}
                      trend={stats.trends.featuresIndexed}
                      onClick={() => setSelectedSummaryId("Features Indexed")}
                      colorClass="text-sage"
                      bgClass="bg-sage/10"
                    />
                    <SummaryCard
                      title="Top Integrations"
                      value={stats.topIntegrations}
                      valueNode={renderIntegrations(stats.topIntegrations)}
                      icon={<GlobeLock size={24} />}
                      subtitle="Most common across market"
                      onClick={() => setSelectedSummaryId("Top Integrations")}
                      colorClass="text-sky"
                      bgClass="bg-sky/10"
                    />
                    <SummaryCard
                      title="Est. Market Value"
                      value={stats.estimatedMarketValue}
                      icon={<DollarSign size={24} />}
                      subtitle="BaaS Form Market"
                      onClick={() =>
                        setSelectedSummaryId("Estimated Market Value")
                      }
                      colorClass="text-emerald-600"
                      bgClass="bg-emerald-50"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 mb-4 gap-4">
                    <h3 className="text-xl font-serif font-bold text-ink-dark flex items-center gap-2">
                      <Lightbulb className="text-ochre" /> Derived Insights
                      Engine
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                      <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                          type="text"
                          placeholder="Search insights..."
                          value={insightSearch}
                          onChange={(e) => setInsightSearch(e.target.value)}
                          className="w-full bg-paper-base shadow-storybook-inner border border-ink-dark/30 rounded-full pl-9 pr-4 py-1.5 text-sm font-sans text-ink-dark placeholder:text-ink-faint focus:outline-none focus:border-[#2C2C2C] transition-all"
                        />
                      </div>
                      <div className="flex gap-2 bg-paper-card p-1 rounded-storybook-sm border border-ink-dark/20 shadow-storybook-inner w-full sm:w-auto overflow-x-auto">
                        {["All", "AI", "Human", "Brainstorm"].map((f) => (
                          <button
                            key={f}
                            onClick={() => setInsightFilter(f as any)}
                            className={`px-4 py-1.5 text-xs font-sans font-semibold rounded-md transition-all duration-200 whitespace-nowrap ${insightFilter === f ? "bg-ink-dark text-paper-light shadow-md" : "text-ink-muted hover:text-ink-dark hover:bg-paper-base"}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredInsights
                      .slice(
                        (insightCurrentPage - 1) * insightItemsPerPage,
                        insightCurrentPage * insightItemsPerPage,
                      )
                      .map((insight) => (
                        <div
                          key={insight.id}
                          className="bg-paper-card border border-ink-dark/20 rounded-storybook p-6 shadow-storybook hover:shadow-storybook-hover transition-all duration-300 relative overflow-hidden flex flex-col group"
                        >
                          {editingInsightId === insight.id ? (
                            <div className="flex flex-col gap-3">
                              <input
                                type="text"
                                value={editInsightForm.title}
                                onChange={(e) =>
                                  setEditInsightForm({
                                    ...editInsightForm,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-paper-base border border-ink-dark/20 rounded-md text-sm text-ink-dark focus:outline-none focus:border-ink-dark"
                                placeholder="Insight Title"
                              />
                              <textarea
                                value={editInsightForm.description}
                                onChange={(e) =>
                                  setEditInsightForm({
                                    ...editInsightForm,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 bg-paper-base border border-ink-dark/20 rounded-md text-sm text-ink-dark focus:outline-none focus:border-ink-dark min-h-[100px]"
                                placeholder="Insight Description"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={editInsightForm.category}
                                  onChange={(e) =>
                                    setEditInsightForm({
                                      ...editInsightForm,
                                      category: e.target.value as any,
                                    })
                                  }
                                  className="px-3 py-2 bg-paper-base border border-ink-dark/20 rounded-md text-sm text-ink-dark focus:outline-none focus:border-ink-dark"
                                >
                                  <option value="opportunity">
                                    Opportunity
                                  </option>
                                  <option value="threat">Threat</option>
                                  <option value="trend">Trend</option>
                                </select>
                                <select
                                  value={editInsightForm.impact}
                                  onChange={(e) =>
                                    setEditInsightForm({
                                      ...editInsightForm,
                                      impact: e.target.value as any,
                                    })
                                  }
                                  className="px-3 py-2 bg-paper-base border border-ink-dark/20 rounded-md text-sm text-ink-dark focus:outline-none focus:border-ink-dark"
                                >
                                  <option value="low">Low Impact</option>
                                  <option value="medium">Medium Impact</option>
                                  <option value="high">High Impact</option>
                                  <option value="critical">
                                    Critical Impact
                                  </option>
                                </select>
                              </div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Tooltip
                                  content={tMessage(
                                    dictionary.tooltips.insight.cancelEdit,
                                  )}
                                  position="top"
                                >
                                  <button
                                    onClick={() => setEditingInsightId(null)}
                                    className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink-dark transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </Tooltip>
                                <Tooltip
                                  content={tMessage(
                                    dictionary.tooltips.insight.saveChanges,
                                  )}
                                  position="top"
                                >
                                  <button
                                    onClick={handleSaveInsight}
                                    className="px-3 py-1.5 bg-ink-dark text-paper-light text-xs font-semibold rounded-md hover:bg-ink-dark/90 transition-colors"
                                  >
                                    Save Changes
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  {insight.category === "opportunity" && (
                                    <TrendingUp
                                      size={18}
                                      className="text-[#2C2C2C]"
                                    />
                                  )}
                                  {insight.category === "threat" && (
                                    <AlertTriangle
                                      size={18}
                                      className="text-terracotta"
                                    />
                                  )}
                                  {insight.category === "trend" && (
                                    <TrendingUp
                                      size={18}
                                      className="text-sky"
                                    />
                                  )}
                                  <h4 className="font-serif font-bold text-ink-dark text-lg pr-12">
                                    {insight.title}
                                  </h4>
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold shrink-0 ${
                                    insight.impact === "high" ||
                                    insight.impact === "critical"
                                      ? "bg-terracotta/10 text-terracotta"
                                      : insight.impact === "medium"
                                        ? "bg-ochre/10 text-ochre"
                                        : "bg-sky/10 text-sky"
                                  }`}
                                >
                                  {insight.impact}
                                </span>
                              </div>
                              <div className="text-sm font-sans text-ink-muted mt-2 leading-relaxed flex-1 prose prose-sm">
                                <Markdown>{insight.description}</Markdown>
                              </div>

                              {insight.sourceIds &&
                                insight.sourceIds.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-ink-dark/20">
                                    <h5 className="text-[10px] uppercase tracking-wider text-[#8A8A8A] font-bold mb-2">
                                      Derived From
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {insight.sourceIds.map((sourceId) => {
                                        const source = rawDataSources.find(
                                          (s) => s.id === sourceId,
                                        );
                                        if (!source) return null;
                                        return (
                                          <button
                                            key={sourceId}
                                            onClick={() =>
                                              setSelectedSourceId(sourceId)
                                            }
                                            className="text-xs bg-paper-base border border-ink-dark/30 hover:border-ink-dark/50 hover:text-[#2C2C2C] text-ink-muted px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                          >
                                            <LinkIcon size={10} />
                                            {
                                              source.sourceUrl
                                                .replace(/^https?:\/\//, "")
                                                .split("/")[0]
                                            }
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                              {insight.linkedInsightIds &&
                                insight.linkedInsightIds.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-ink-dark/20">
                                    <h5 className="text-[10px] uppercase tracking-wider text-[#8A8A8A] font-bold mb-2">
                                      Related Insights
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                      {insight.linkedInsightIds.map(
                                        (linkedId) => {
                                          const linkedInsight =
                                            derivedInsights.find(
                                              (i) => i.id === linkedId,
                                            );
                                          if (!linkedInsight) return null;
                                          return (
                                            <button
                                              key={linkedId}
                                              onClick={() => {
                                                // Just scroll to it or something, or maybe just show the title
                                              }}
                                              className="text-xs bg-paper-base border border-ink-dark/30 hover:border-ink-dark/50 hover:text-[#2C2C2C] text-ink-muted px-2 py-1 rounded-md transition-colors flex items-center gap-1 max-w-[200px] truncate"
                                              title={linkedInsight.title}
                                            >
                                              <LinkIcon
                                                size={10}
                                                className="shrink-0"
                                              />
                                              <span className="truncate">
                                                {linkedInsight.title}
                                              </span>
                                            </button>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="mt-4 flex justify-between items-center border-t border-ink-dark/20 pt-4">
                                <div className="text-[11px] font-sans text-ink-faint">
                                  {new Date(insight.timestamp).toLocaleString()}
                                </div>
                                <span
                                  className={`text-[10px] px-2 py-1 rounded-full border ${
                                    insight.source === "AI"
                                      ? "border-ink-dark/20 text-[#8A8A8A] bg-paper-base"
                                      : insight.source === "Brainstorm"
                                        ? "border-ochre/30 text-ochre bg-ochre/10"
                                        : "border-sage/30 text-sage bg-sage/10"
                                  }`}
                                >
                                  {insight.source}
                                </span>
                              </div>
                              <div className="absolute top-4 right-4 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity duration-300 flex gap-2 bg-paper-card pl-2">
                                <Tooltip
                                  content={tMessage(
                                    dictionary.tooltips.insight.edit,
                                  )}
                                  position="top"
                                >
                                  <button
                                    onClick={() => handleEditInsight(insight)}
                                    className="text-ink-muted hover:text-ink-dark transition-colors"
                                    title="Edit Insight"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </Tooltip>
                                <Tooltip
                                  content={tMessage(
                                    dictionary.tooltips.insight.delete,
                                  )}
                                  position="top"
                                >
                                  <button
                                    onClick={() =>
                                      handleDeleteInsight(insight.id)
                                    }
                                    className="text-ink-muted hover:text-terracotta transition-colors"
                                    title="Delete Insight"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </Tooltip>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                  {Math.max(
                    1,
                    Math.ceil(filteredInsights.length / insightItemsPerPage),
                  ) > 1 && (
                    <div className="mt-6 flex justify-between items-center bg-paper-card p-4 rounded-xl border border-ink-dark/20 shadow-sm">
                      <div className="text-sm text-ink-dark/60">
                        Showing{" "}
                        {(insightCurrentPage - 1) * insightItemsPerPage + 1} to{" "}
                        {Math.min(
                          insightCurrentPage * insightItemsPerPage,
                          filteredInsights.length,
                        )}{" "}
                        of {filteredInsights.length} insights
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setInsightCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={insightCurrentPage === 1}
                          className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex gap-1">
                          {Array.from({
                            length: Math.max(
                              1,
                              Math.ceil(
                                filteredInsights.length / insightItemsPerPage,
                              ),
                            ),
                          }).map((_, i) => {
                            const totalPages = Math.max(
                              1,
                              Math.ceil(
                                filteredInsights.length / insightItemsPerPage,
                              ),
                            );
                            if (totalPages > 7) {
                              if (
                                i !== 0 &&
                                i !== totalPages - 1 &&
                                Math.abs(i + 1 - insightCurrentPage) > 1
                              ) {
                                if (i + 1 === 2 || i + 1 === totalPages - 1)
                                  return (
                                    <span
                                      key={i}
                                      className="px-1 text-ink-dark/40"
                                    >
                                      ...
                                    </span>
                                  );
                                return null;
                              }
                            }
                            return (
                              <button
                                key={i}
                                onClick={() => setInsightCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${insightCurrentPage === i + 1 ? "bg-ink-dark text-paper-light" : "text-ink-dark hover:bg-paper-base"}`}
                              >
                                {i + 1}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() =>
                            setInsightCurrentPage((p) =>
                              Math.min(
                                Math.max(
                                  1,
                                  Math.ceil(
                                    filteredInsights.length /
                                      insightItemsPerPage,
                                  ),
                                ),
                                p + 1,
                              ),
                            )
                          }
                          disabled={
                            insightCurrentPage ===
                            Math.max(
                              1,
                              Math.ceil(
                                filteredInsights.length / insightItemsPerPage,
                              ),
                            )
                          }
                          className="px-3 py-1.5 border border-ink-dark/20 rounded-md text-sm text-ink-dark hover:bg-paper-base disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* SUPPORT TAB */}
            {activeTab === "support" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="h-[calc(100vh-120px)] w-full overflow-y-auto">
                  <SupportHelpPage
                    user={user}
                    initialType={supportInitialType}
                  />
                </div>
              )}

            {/* SUPERADMIN TAB */}
            {activeTab === "superadmin" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="h-[calc(100vh-120px)] w-full overflow-y-auto">
                  <SuperadminDashboard isSuperadmin={isSuperadmin} />
                </div>
              )}

            {/* DLQ ADMIN TAB */}
            {activeTab === "dlq" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="h-[calc(100vh-120px)] w-full overflow-y-auto">
                  <DLQViewer />
                </div>
              )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="h-[calc(100vh-120px)] w-full rounded-xl overflow-hidden border border-ink-dark/20 shadow-sm">
                  <SettingsComponent />
                </div>
              )}

            {/* ANALYTICAL TEMPLATES TAB */}
            {activeTab === "templates" && (
              <div className="h-[calc(100vh-120px)] w-full overflow-hidden border border-ink-dark/20 shadow-sm rounded-xl">
                <StrategyToolbox />
              </div>
            )}

            <LimitReachedModal
              isOpen={isLimitModalOpen}
              onClose={() => setIsLimitModalOpen(false)}
              onRequestIncrease={() => {
                setSupportInitialType("Limit Increase Request");
                setActiveTab("support");
                setSelectedCompetitorId(null);
                setSelectedSourceId(null);
                setSelectedSummaryId(null);
              }}
            />

            <RateLimitModal
              isOpen={isRateLimitModalOpen}
              onClose={() => setIsRateLimitModalOpen(false)}
              message={rateLimitError || undefined}
              onRequestIncrease={() => {
                setSupportInitialType("Limit Increase Request");
                setActiveTab("support");
                setSelectedCompetitorId(null);
                setSelectedSourceId(null);
                setSelectedSummaryId(null);
              }}
            />

            {/* MINDMAP EXPLORER TAB */}
            {activeTab === "mindmap" &&
              !selectedSourceId &&
              !selectedSummaryId &&
              !selectedCompetitorId && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-8 mt-4">
                    <div>
                      <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                        マインドマップ
                      </p>
                      <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                        Mindmap Explorer
                      </h1>
                      <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                        Visual representation of market landscape and
                        connections.
                      </p>
                    </div>
                  </div>
                  <div className="h-[calc(100vh-220px)] w-full rounded-xl overflow-hidden border border-ink-dark/20 shadow-sm">
                    <VisualWhiteboard />
                  </div>
                </div>
              )}

            {/* MARKET ANALYSIS TAB */}
            {activeTab === "market-analysis" && (
              <LensStrategyConsole
                stats={stats}
                competitors={competitors}
                insights={derivedInsights}
                rawData={rawDataSources}
                onAddFeature={(name, desc) => {
                  setMyProductData((prev) => ({
                    ...prev,
                    features: [
                      ...prev.features,
                      {
                        id: Date.now().toString(),
                        name,
                        description: desc,
                        isCore: false,
                        status: "planned",
                      },
                    ],
                  }));
                  addToast(`Added drafted feature: ${name}`);
                }}
                onAddInsight={(title, desc) => {
                  const newInsight = {
                    id: Date.now().toString(),
                    title,
                    description: desc,
                    category: "opportunity",
                    impact: "high",
                    confidence: 85,
                    createdAt: new Date().toISOString(),
                  };
                  setDerivedInsights((prev) => [newInsight as any, ...prev]);
                  addToast(`Added strategic insight: ${title}`);
                }}
              />
            )}

            {/* PIVOT SIMULATOR TAB */}
            {activeTab === "ideation" && (
              <div className="h-full">
                <PivotSimulator />
              </div>
            )}

            {/* ACTION CENTER TAB */}
            {activeTab === "rapid-pdlc" && (
              <div className="h-full">
                <RapidPdlcWorkflow />
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-8 mt-4">
                  <div>
                    <p className="text-[#8A8A8A] text-[10px] tracking-[0.2em] font-sans mb-1">
                      バックグラウンドタスク
                    </p>
                    <h1 className="font-serif text-3xl md:text-4xl text-[#2C2C2C] uppercase tracking-wide">
                      Background Tasks & Sync
                    </h1>
                    <p className="text-[#8A8A8A] text-sm font-sans mt-2">
                      Monitor active operations and system synchronization.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sync Status */}
                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold text-ink-dark ">
                      Current Status
                    </h3>

                    <div className="bg-paper-card border border-ink-dark/20 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold text-ink-dark ">
                          System State
                        </h4>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${isSyncing ? "bg-amber-100 text-amber-700" : "bg-paper-base text-[#8A8A8A] "}`}
                        >
                          {isSyncing ? "Syncing..." : "Idle"}
                        </div>
                      </div>

                      {isSyncing ? (
                        <div className="space-y-6">
                          <p className="text-sm text-[#8A8A8A] ">
                            A sync operation is currently running. Progress:{" "}
                            <span className="font-bold">{syncProgress}%</span>
                          </p>
                          <div className="space-y-4">
                            {activeTasks.map((task) => (
                              <div key={task.id} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-ink-dark font-medium">
                                    {task.name}
                                  </span>
                                  <span className="text-[#2C2C2C]">
                                    {Math.round(task.progress)}%
                                  </span>
                                </div>
                                <div className="h-2 bg-paper-light rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#2C2C2C] transition-all duration-500 ease-out"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-paper-base rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-moss" />
                          </div>
                          <p className="text-ink-dark font-medium">
                            All systems are up to date.
                          </p>
                          <p className="text-sm text-[#8A8A8A] mt-2">
                            No background tasks are currently running.
                          </p>
                          <div className="mt-6 flex flex-wrap justify-center gap-4">
                            <DeepValidationButton
                              isSyncing={isSyncing}
                              syncProgress={syncProgress}
                              handleGlobalSync={() => {
                                if (syncQueue.length > 0) {
                                  addToast(
                                    "Please review and commit pending sync changes first.",
                                    "error",
                                  );
                                  return;
                                }
                                handleGlobalSync();
                              }}
                              setShowSyncInfo={setShowSyncInfo}
                            />

                            <Tooltip
                              content={tMessage(
                                dictionary.tooltips.dashboard.scanNews,
                              )}
                              position="top"
                            >
                              <button
                                onClick={runNewsDiscovery}
                                disabled={isDiscovering}
                                className="px-4 py-2 bg-paper-base hover:bg-ink-dark/5 text-ink-dark border border-ink-dark/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                              >
                                <Newspaper size={16} />
                                News Discovery
                              </button>
                            </Tooltip>
                            <Tooltip
                              content={tMessage(
                                dictionary.tooltips.dashboard.checkIntegrity,
                              )}
                              position="top"
                            >
                              <button
                                onClick={runSystemCheck}
                                className="px-4 py-2 bg-paper-base hover:bg-ink-dark/5 text-ink-dark border border-ink-dark/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                              >
                                <Activity size={16} />
                                Check System
                              </button>
                            </Tooltip>
                            <Tooltip
                              content={tMessage(
                                dictionary.tooltips.dashboard.processData,
                              )}
                              position="top"
                            >
                              <button
                                onClick={updateSystemContext}
                                disabled={isUpdatingContext}
                                className="px-4 py-2 bg-paper-base hover:bg-ink-dark/5 text-ink-dark border border-ink-dark/20 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                              >
                                <Database size={16} />
                                {isUpdatingContext
                                  ? "Running Pipeline..."
                                  : "Run Data Pipeline"}
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logs Section */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-ink-dark ">
                        System Logs
                      </h3>
                      <Tooltip
                        content={tMessage(
                          dictionary.tooltips.dashboard.clearLogs,
                        )}
                        position="left"
                      >
                        <button
                          onClick={() => setLogs([])}
                          className="text-xs text-[#8A8A8A] hover:text-ink-dark :text-ink-dark"
                        >
                          Clear Logs
                        </button>
                      </Tooltip>
                    </div>

                    <div className="bg-paper-card border border-ink-dark/20 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                        {logs.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-[#8A8A8A] ">
                            No logs available.
                          </div>
                        ) : (
                          <>
                            {logs
                              .slice(
                                (actionLogsCurrentPage - 1) *
                                  actionLogsItemsPerPage,
                                actionLogsCurrentPage * actionLogsItemsPerPage,
                              )
                              .map((log) => (
                                <div
                                  key={log.id}
                                  className="flex gap-3 items-start border-b border-ink-dark/20 /50 pb-3 last:border-0 last:pb-0"
                                >
                                  <div className="shrink-0 text-[#8A8A8A] w-20">
                                    {new Date(log.timestamp).toLocaleTimeString(
                                      [],
                                      {
                                        hour12: false,
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        second: "2-digit",
                                      },
                                    )}
                                  </div>
                                  <div className="shrink-0 w-24">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-medium ${
                                        log.status === "success"
                                          ? "bg-paper-base text-[#8A8A8A] "
                                          : log.status === "error"
                                            ? "bg-rose-100 text-rose-700 "
                                            : log.status === "pending"
                                              ? "bg-amber-100 text-amber-700 "
                                              : "bg-paper-light text-ink-dark "
                                      }`}
                                    >
                                      {log.action}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex-1 flex flex-col items-start ${
                                      log.status === "error"
                                        ? "text-rose-600 "
                                        : "text-ink-dark "
                                    }`}
                                  >
                                    <div className="flex justify-between w-full items-start">
                                      <span>{log.details}</span>
                                      {log.status === "error" &&
                                        log.retryAction && (
                                          <Tooltip
                                            content={tMessage(
                                              dictionary.tooltips.dashboard
                                                .retryAction,
                                            )}
                                            position="left"
                                          >
                                            <button
                                              onClick={() =>
                                                log.retryAction?.()
                                              }
                                              className="ml-2 px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[10px] font-medium transition-colors"
                                            >
                                              Retry
                                            </button>
                                          </Tooltip>
                                        )}
                                    </div>
                                    {isSuperadmin && log.contextData && (
                                      <details className="mt-2 w-full bg-paper-base/50 p-2 rounded border border-ink-dark/10 group cursor-pointer transition-colors hover:bg-paper-base/80">
                                        <summary className="text-[10px] font-bold text-ink-dark select-none flex items-center gap-1">
                                          <span className="group-open:rotate-90 transition-transform duration-200">
                                            ▶
                                          </span>
                                          View Context Data
                                        </summary>
                                        <pre className="text-[10px] text-[#8A8A8A] whitespace-pre-wrap mt-2 overflow-x-auto p-2 bg-white rounded border border-ink-dark/5">
                                          {JSON.stringify(
                                            log.contextData,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </details>
                                    )}
                                    {isSuperadmin && log.apiCallDetails && (
                                      <details className="mt-2 w-full bg-paper-base/50 p-2 rounded border border-ink-dark/10 group cursor-pointer transition-colors hover:bg-paper-base/80">
                                        <summary className="text-[10px] font-bold text-ink-dark select-none flex items-center gap-1">
                                          <span className="group-open:rotate-90 transition-transform duration-200">
                                            ▶
                                          </span>
                                          View Response Details
                                        </summary>
                                        <pre className="text-[10px] text-[#8A8A8A] whitespace-pre-wrap mt-2 overflow-x-auto p-2 bg-white rounded border border-ink-dark/5">
                                          {JSON.stringify(
                                            log.apiCallDetails,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </details>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {Math.max(
                              1,
                              Math.ceil(logs.length / actionLogsItemsPerPage),
                            ) > 1 && (
                              <div className="mt-4 flex justify-between items-center bg-paper-base p-3 rounded-lg border border-ink-dark/20 shadow-sm mb-4">
                                <div className="text-xs text-ink-dark/60">
                                  Showing{" "}
                                  {(actionLogsCurrentPage - 1) *
                                    actionLogsItemsPerPage +
                                    1}{" "}
                                  to{" "}
                                  {Math.min(
                                    actionLogsCurrentPage *
                                      actionLogsItemsPerPage,
                                    logs.length,
                                  )}{" "}
                                  of {logs.length} logs
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      setActionLogsCurrentPage((p) =>
                                        Math.max(1, p - 1),
                                      )
                                    }
                                    disabled={actionLogsCurrentPage === 1}
                                    className="px-2 py-1 border border-ink-dark/20 rounded text-xs text-ink-dark hover:bg-paper-card disabled:opacity-50 transition-colors"
                                  >
                                    Prev
                                  </button>
                                  <button
                                    onClick={() =>
                                      setActionLogsCurrentPage((p) =>
                                        Math.min(
                                          Math.max(
                                            1,
                                            Math.ceil(
                                              logs.length /
                                                actionLogsItemsPerPage,
                                            ),
                                          ),
                                          p + 1,
                                        ),
                                      )
                                    }
                                    disabled={
                                      actionLogsCurrentPage ===
                                      Math.max(
                                        1,
                                        Math.ceil(
                                          logs.length / actionLogsItemsPerPage,
                                        ),
                                      )
                                    }
                                    className="px-2 py-1 border border-ink-dark/20 rounded text-xs text-ink-dark hover:bg-paper-card disabled:opacity-50 transition-colors"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <InsightEngineChat
        chatState={chatState}
        setChatState={setChatState}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        isTyping={isTyping}
        handleSendMessage={handleSendMessage}
        chatInput={chatInput}
        setChatInput={setChatInput}
        derivedInsights={derivedInsights}
        setDerivedInsights={setDerivedInsights}
        competitors={competitors}
        addToast={addToast}
      />
    </div>
  );
}

// --- Subcomponents ---

export function ScoutPage({
  competitor,
  onBack,
  sources,
  onSourceClick,
  onToggleLock,
}: {
  competitor: Competitor;
  onBack: () => void;
  sources: DataSource[];
  onSourceClick: (id: string) => void;
  onToggleLock: (field: string) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isFeaturesModalOpen, setIsFeaturesModalOpen] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Analyze the following competitor data. Extract exact dimension-level metrics and assign an 'ai_confidence_score' (0-100) based on the context of the extraction. Return the output as a clean, highly structured JSON array of objects, where each object has: { metric_name: string, value: string|number, ai_confidence_score: number, reasoning: string }. Do not return any Markdown wrapping or backticks, just the JSON string. \n\nData: ${JSON.stringify(competitor)} \n\nSources: ${JSON.stringify(sources)}`,
          });
        },
        { capability: "chat" },
      );
      setAnalysisResult(response.text || "[]");
    } catch (error: any) {
      console.error(error);
      setAnalysisResult(
        `Failed to generate analysis: ${getErrorMessage(error)}. Click "Analyze" to retry.`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const radarData = [
    {
      subject: "Market Overlap",
      A: competitor.marketCommonalityIndex,
      fullMark: 100,
    },
    {
      subject: "Resource Parity",
      A: competitor.resourceSimilarityScore,
      fullMark: 100,
    },
    { subject: "Threat Level", A: competitor.competitorScore, fullMark: 100 },
    { subject: "Data Trust", A: competitor.trustScore, fullMark: 100 },
    {
      subject: "Sovereignty",
      A:
        competitor.sovereigntyScore === "high"
          ? 100
          : competitor.sovereigntyScore === "medium"
            ? 60
            : 30,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <Tooltip
          content={tMessage(dictionary.tooltips.navigation.returnMatrix)}
          position="right"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#8A8A8A] hover:text-ink-dark transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Matrix
          </button>
        </Tooltip>
        <Tooltip
          content={tMessage(dictionary.tooltips.common.fetchRealTime)}
          position="left"
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-[#2C2C2C] text-[#F5F3ED] px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing ? "Analyzing..." : "Pull and analyze latest data"}
          </button>
        </Tooltip>
      </div>

      {analysisResult && (
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl prose prose-sm max-w-none">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles size={18} /> AI Analysis
          </h3>
          <Markdown>{analysisResult}</Markdown>
        </div>
      )}

      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 flex flex-col md:flex-row items-start gap-6">
        <img
          src={competitor.logoUrl}
          alt={competitor.name}
          className="w-24 h-24 rounded-xl border border-ink-dark/20 object-cover bg-paper-base shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-ink-dark tracking-tight">
                {competitor.name}
              </h2>
              <a
                href={`https://${competitor.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#8A8A8A] hover:underline text-sm"
              >
                {competitor.website}
              </a>
              <div className="mt-3 flex flex-wrap gap-2">
                {competitor.marketSegments.map((segment, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-paper-base text-[#8A8A8A] rounded-md text-xs uppercase tracking-wider font-semibold border border-ink-dark/20 "
                  >
                    {segment}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-6 text-left sm:text-right">
              <div>
                <div className="text-3xl font-bold text-ink-dark ">
                  {competitor.competitorScore}
                  <span className="text-lg text-[#8A8A8A] ">/100</span>
                </div>
                <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">
                  Threat Score
                </div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-paper-base "></div>
              <div>
                <div className="flex items-center sm:justify-end gap-2 mb-1">
                  <ShieldCheck
                    size={14}
                    className={
                      competitor.trustScore > 80
                        ? "text-emerald-500 "
                        : competitor.trustScore > 50
                          ? "text-amber-500 "
                          : "text-rose-500 "
                    }
                  />
                  <span className="text-2xl font-bold text-ink-dark ">
                    {competitor.trustScore}
                    <span className="text-sm text-[#8A8A8A] ">/100</span>
                  </span>
                </div>
                <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium">
                  Data Trust Score
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-ink-dark/20 /50">
            <div className="bg-paper-base /50 rounded-lg p-4 border border-ink-dark/20 ">
              <h3 className="text-sm font-medium text-[#8A8A8A] mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Financial & Market Data
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-1">
                    Funding Stage
                  </div>
                  <div className="font-semibold text-ink-dark ">
                    {competitor.fundingStage}
                  </div>
                </div>
                <div>
                  <div className="group relative inline-flex items-center gap-1 cursor-help">
                    <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
                      Estimated ARR
                      <Info size={12} className="text-ink-dark/40" />
                    </div>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-ink-dark text-paper-light text-xs rounded shadow-lg z-10">
                      Estimated Annual Recurring Revenue (ARR) range with a 95%
                      confidence interval, synthesized from public financial
                      data, funding rounds, and market share analysis.
                    </div>
                  </div>
                  <div className="font-semibold text-ink-dark ">
                    {competitor.estimatedARR}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="group relative inline-flex items-center gap-1 cursor-help">
                    <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-1 flex items-center gap-1">
                      Estimated User Base
                      <Info size={12} className="text-ink-dark/40" />
                    </div>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-ink-dark text-paper-light text-xs rounded shadow-lg z-10">
                      Estimated active or registered user base range with a 95%
                      confidence interval, derived from web traffic, app
                      downloads, and public milestones.
                    </div>
                  </div>
                  <div className="font-semibold text-ink-dark ">
                    {competitor.estimatedUserBase || "Unknown"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                {competitor.financialSnapshot}
              </p>
              <div className="mt-4 border-t border-ink-dark/10 pt-4 relative">
                <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-1">
                  Funding History
                </div>
                <button
                  className="absolute top-4 right-0"
                  onClick={() => onToggleLock("fundingHistory")}
                  title={
                    competitor.verifiedFields?.["fundingHistory"]
                      ? "Unlock"
                      : "Lock"
                  }
                >
                  {competitor.verifiedFields?.["fundingHistory"] ? (
                    <Lock size={12} className="text-amber-600" />
                  ) : (
                    <Unlock size={12} className="text-[#8A8A8A]" />
                  )}
                </button>
                <div className="font-medium text-ink-dark">
                  <span>{competitor.fundingHistory || "N/A"}</span>
                </div>
              </div>
            </div>
            <div className="bg-paper-base /50 rounded-lg p-4 border border-ink-dark/20 relative">
              <h3 className="text-sm font-medium text-[#8A8A8A] mb-3 flex items-center gap-2">
                <Users size={16} /> Target Audience
              </h3>
              <button
                className="absolute top-4 right-4"
                onClick={() => onToggleLock("targetAudience")}
                title={
                  competitor.verifiedFields?.["targetAudience"]
                    ? "Unlock to allow AI updates"
                    : "Lock to prevent AI updates"
                }
              >
                {competitor.verifiedFields?.["targetAudience"] ? (
                  <Lock size={14} className="text-amber-600" />
                ) : (
                  <Unlock
                    size={14}
                    className="text-[#8A8A8A] hover:text-ink-dark transition-colors"
                  />
                )}
              </button>
              <p className="text-ink-dark font-medium mb-2">
                {competitor.targetAudience}
              </p>
              <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-2">
                Key Segments
              </div>
              <div className="flex flex-wrap gap-1.5">
                {competitor.marketSegments.map((segment, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-paper-card text-[#8A8A8A] rounded text-xs border border-ink-dark/20 "
                  >
                    {segment}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-paper-base /50 rounded-lg p-4 border border-ink-dark/20 relative">
              <h3 className="text-sm font-medium text-[#8A8A8A] mb-3 flex items-center gap-2">
                <GlobeLock size={16} /> Data Sovereignty
              </h3>
              <button
                className="absolute top-4 right-4"
                onClick={() => onToggleLock("dataSovereignty")}
                title={
                  competitor.verifiedFields?.["dataSovereignty"]
                    ? "Unlock"
                    : "Lock"
                }
              >
                {competitor.verifiedFields?.["dataSovereignty"] ? (
                  <Lock size={14} className="text-amber-600" />
                ) : (
                  <Unlock
                    size={14}
                    className="text-[#8A8A8A] hover:text-ink-dark transition-colors"
                  />
                )}
              </button>
              <div className="mb-4">
                <SovereigntyBadge
                  status={competitor.dataSovereignty}
                  score={competitor.sovereigntyScore}
                />
              </div>
              <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-medium mb-1 flex items-center justify-between">
                <span>Spam Protection</span>
                <button
                  onClick={() => onToggleLock("spamProtection")}
                  title={
                    competitor.verifiedFields?.["spamProtection"]
                      ? "Unlock"
                      : "Lock"
                  }
                >
                  {competitor.verifiedFields?.["spamProtection"] ? (
                    <Lock size={12} className="text-amber-600" />
                  ) : (
                    <Unlock size={12} className="text-[#8A8A8A]" />
                  )}
                </button>
              </div>
              <div className="font-medium text-ink-dark">
                {competitor.spamProtection}
              </div>
            </div>
            <div className="bg-paper-base /50 rounded-lg p-4 border border-ink-dark/20 relative">
              <h3 className="text-sm font-medium text-[#8A8A8A] mb-3 flex items-center gap-2">
                <Database size={16} /> Tech Stack
              </h3>
              <button
                className="absolute top-4 right-4"
                onClick={() => onToggleLock("techStack")}
                title={
                  competitor.verifiedFields?.["techStack"]
                    ? "Unlock to allow AI updates"
                    : "Lock to prevent AI updates"
                }
              >
                {competitor.verifiedFields?.["techStack"] ? (
                  <Lock size={14} className="text-amber-600" />
                ) : (
                  <Unlock
                    size={14}
                    className="text-[#8A8A8A] hover:text-ink-dark transition-colors"
                  />
                )}
              </button>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(competitor.techStack || []).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-paper-card text-ink-dark rounded text-xs border border-ink-dark/20 "
                  >
                    {tech}
                  </span>
                ))}
                {(!competitor.techStack ||
                  competitor.techStack.length === 0) && (
                  <span className="text-[#8A8A8A] text-sm">Unknown</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 lg:col-span-1 flex flex-col">
          <h3 className="text-lg font-semibold text-ink-dark mb-6 flex items-center gap-2">
            <Radar size={18} className="text-[#8A8A8A] " /> Competitive
            Proximity
          </h3>

          <div className="h-64 w-full mb-6 relative -ml-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#5c8c74" strokeOpacity={0.2} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#5c8c74", fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <RechartsRadar
                  name={competitor.name}
                  dataKey="A"
                  stroke="#7ba05b"
                  fill="#7ba05b"
                  fillOpacity={0.3}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#fcfbf9",
                    border: "1px solid rgba(61, 74, 64, 0.1)",
                    borderRadius: "8px",
                    color: "#3d4a40",
                    fontSize: "12px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  }}
                  itemStyle={{ color: "#7ba05b", fontWeight: 600 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-6 mt-auto">
            <div className="group cursor-help relative">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-ink-dark ">
                    Market Commonality
                  </span>
                  <Info size={14} className="text-[#8A8A8A] " />
                </div>
                <span className="text-xl font-bold text-ink-dark ">
                  {competitor.marketCommonalityIndex}
                  <span className="text-sm text-[#8A8A8A] font-normal">
                    /100
                  </span>
                </span>
              </div>
              <div className="w-full bg-paper-base rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#2C2C2C] h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${competitor.marketCommonalityIndex}%` }}
                ></div>
              </div>
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-paper-card text-ink-dark text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case border border-ink-dark/20 ">
                <p className="font-semibold mb-1">
                  Market Commonality Index (MCI)
                </p>
                <p className="text-[#8A8A8A] ">
                  Based on Chen's (1996) framework of competitive dynamics.
                  Measures the degree of overlap in target markets and customer
                  segments. A higher score indicates a more direct threat to
                  your core customer base.
                </p>
              </div>
            </div>

            <div className="group cursor-help relative">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-ink-dark ">
                    Resource Similarity
                  </span>
                  <Info size={14} className="text-[#8A8A8A] " />
                </div>
                <span className="text-xl font-bold text-ink-dark ">
                  {competitor.resourceSimilarityScore}
                  <span className="text-sm text-[#8A8A8A] font-normal">
                    /100
                  </span>
                </span>
              </div>
              <div className="w-full bg-paper-base rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#8A8A8A] h-2.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${competitor.resourceSimilarityScore}%` }}
                ></div>
              </div>
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-paper-card text-ink-dark text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case border border-ink-dark/20 ">
                <p className="font-semibold mb-1">
                  Resource Similarity Score (RSS)
                </p>
                <p className="text-[#8A8A8A] ">
                  Measures the extent to which a competitor possesses strategic
                  endowments comparable to yours (features, integrations,
                  capital). High similarity means they can easily match your
                  moves.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 lg:col-span-1 cursor-pointer hover:shadow-storybook-hover transition-all duration-300"
          onClick={() => setIsFeaturesModalOpen(true)}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-ink-dark flex items-center gap-2">
              <Zap size={18} className="text-amber-500 " /> Core Features
            </h3>
            <span className="text-xs text-ink-muted bg-paper-base px-2 py-1 rounded-full border border-ink-dark/10">
              View All
            </span>
          </div>
          <ul className="space-y-3">
            {competitor.coreFeatures.slice(0, 5).map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-ink-dark "
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 " />
                </div>
                <span className="pt-1 line-clamp-2">{feature}</span>
              </li>
            ))}
            {competitor.coreFeatures.length > 5 && (
              <li className="text-xs text-ink-muted italic pt-2">
                + {competitor.coreFeatures.length - 5} more features...
              </li>
            )}
          </ul>
        </div>
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold text-ink-dark mb-4 flex items-center gap-2">
            <Target size={18} className="text-emerald-500 " /> How We Compare
          </h3>
          <p className="text-sm text-ink-dark leading-relaxed bg-paper-base p-4 rounded-lg border border-ink-dark/20 /50">
            {competitor.howWeCompare}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-ink-dark mb-4 flex items-center gap-2">
          <Database size={20} className="text-[#8A8A8A] " /> Audit-Ready Data
          Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <DataSourceCard
              key={source.id}
              source={source}
              onClick={() => onSourceClick(source.id)}
            />
          ))}
          {sources.length === 0 && (
            <div className="col-span-2 p-8 text-center border border-dashed border-ink-dark/20 rounded-xl text-[#8A8A8A] ">
              No raw data sources linked to this competitor yet.
            </div>
          )}
        </div>
      </div>

      {isFeaturesModalOpen && (
        <div
          className="fixed inset-0 bg-ink-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsFeaturesModalOpen(false)}
        >
          <div
            className="bg-paper-light rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-ink-dark/10 flex justify-between items-center bg-paper-card">
              <h2 className="text-xl font-bold text-ink-dark flex items-center gap-2">
                <Zap size={20} className="text-amber-500" />
                All Analyzed Features for {competitor.name}
              </h2>
              <Tooltip
                content={tMessage(dictionary.tooltips.common.closeModal)}
                position="left"
              >
                <button
                  onClick={() => setIsFeaturesModalOpen(false)}
                  className="p-2 hover:bg-paper-base rounded-full transition-colors text-ink-muted hover:text-ink-dark"
                >
                  <X size={20} />
                </button>
              </Tooltip>
            </div>
            <div className="p-6 overflow-y-auto bg-paper-light">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {competitor.coreFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 text-sm text-ink-dark bg-paper-card p-4 rounded-xl border border-ink-dark/5 shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 " />
                    </div>
                    <span className="pt-1 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-ink-dark/10 bg-paper-card flex justify-end">
              <Tooltip
                content={tMessage(dictionary.tooltips.common.closeModal)}
                position="top"
              >
                <button
                  onClick={() => setIsFeaturesModalOpen(false)}
                  className="px-6 py-2 bg-ink-dark text-paper-light rounded-full text-sm font-semibold hover:bg-ink-dark/90 transition-colors"
                >
                  Close
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-sans font-medium transition-all duration-300 ${
        active
          ? "bg-[#2C2C2C] text-[#F5F3ED]"
          : "text-[#8A8A8A] hover:bg-[#2C2C2C]/5 hover:text-[#2C2C2C]"
      }`}
    >
      <div
        className={`shrink-0 ${active ? "text-[#F5F3ED]" : "text-[#8A8A8A]"}`}
      >
        {icon}
      </div>
      <span className="truncate">{label}</span>
    </button>
  );
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = "success",
  onClick,
  colorClass = "text-sky",
  bgClass = "bg-sky/10",
  valueNode,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: "success" | "warning" | "neutral";
  onClick?: () => void;
  colorClass?: string;
  bgClass?: string;
  valueNode?: React.ReactNode;
}) {
  const trendColors = {
    success: "text-[#2C2C2C] bg-paper-base",
    warning: "text-terracotta bg-terracotta/10",
    neutral: "text-ink-muted bg-ink-dark/10",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-paper-card border border-ink-dark/20 rounded-storybook p-6 shadow-storybook hover:shadow-storybook-hover hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${onClick ? "cursor-pointer" : ""}`}
    >
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 ${colorClass} opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-500 pointer-events-none`}
      >
        {icon}
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-sm font-sans font-semibold text-ink-muted">
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-full ${bgClass} ${colorClass}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="relative z-10">
        {valueNode ? (
          valueNode
        ) : (
          <div className="text-4xl font-serif font-bold text-ink-dark tracking-tight">
            {value}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${trendColors[trendType]}`}
            >
              {trend}
            </span>
          )}
          {subtitle && (
            <p className="text-xs font-sans text-ink-faint truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SortableHeader({
  label,
  field,
  currentSort,
  sortOrder,
  onSort,
  className = "",
  tooltip,
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
  tooltip?: string;
}) {
  return (
    <th
      className={`pb-3 px-6 py-4 text-ink-dark text-xs uppercase tracking-widest font-semibold cursor-pointer hover:text-black transition-colors group select-none relative ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        {tooltip && <Info size={14} className="text-ink-muted" />}
        <ArrowUpDown
          size={14}
          className={`transition-all ${currentSort === field ? "opacity-100 text-black" : "opacity-0 group-hover:opacity-40 text-ink-muted"}`}
        />
      </div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-paper-card text-ink-dark border border-ink-dark/20 text-xs rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case">
          {tooltip}
        </div>
      )}
    </th>
  );
}

export function QuickPromptButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-2 border border-[#2C2C2C] text-[#2C2C2C] rounded-full text-sm font-sans font-medium hover:bg-[#2C2C2C] hover:text-[#F5F3ED] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

export function SovereigntyBadge({
  status,
  score,
}: {
  status: string;
  score: "low" | "medium" | "high";
}) {
  const styles = {
    low: "bg-rose-100 text-rose-800 border-rose-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${styles[score]}`}
    >
      <GlobeLock size={12} />
      {status}
    </span>
  );
}

export function SourcePage({
  source,
  competitorName,
  linkedInsights,
  onBack,
  onExpandImage,
  onCopy,
}: {
  source: DataSource;
  competitorName: string;
  linkedInsights: DerivedInsight[];
  onBack: () => void;
  onExpandImage: (url: string) => void;
  onCopy: (text: string) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Analyze the following source data. Extract exact dimension-level metrics and assign an 'ai_confidence_score' (0-100) based on the context of the extraction. Return the output as a clean, highly structured JSON array of objects, where each object has: { metric_name: string, value: string|number, ai_confidence_score: number, reasoning: string }. Do not return any Markdown wrapping or backticks, just the JSON string. \n\nData: ${JSON.stringify(source)} \n\nCompetitor: ${competitorName}`,
          });
        },
        { capability: "chat" },
      );
      setAnalysisResult(response.text || "[]");
    } catch (error: any) {
      console.error(error);
      setAnalysisResult(
        `Failed to generate analysis: ${getErrorMessage(error)}. Click "Analyze" to retry.`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copySourceText = () => {
    const text = `Source: ${source.sourceUrl}\nCompetitor: ${competitorName}\nType: ${source.type}\nConfidence: ${source.confidenceLevel}\n\nExcerpt:\n${source.excerpt}`;
    onCopy(text);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <Tooltip
          content={tMessage(dictionary.tooltips.navigation.returnRawData)}
          position="right"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-ink-dark transition-colors"
          >
            <ArrowLeft size={16} /> Back to Library
          </button>
        </Tooltip>
        <Tooltip
          content={tMessage(dictionary.tooltips.common.fetchRealTime)}
          position="left"
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-[#2C2C2C] text-[#F5F3ED] px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing ? "Analyzing..." : "Pull and analyze latest data"}
          </button>
        </Tooltip>
      </div>

      {analysisResult && (
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl prose prose-sm max-w-none">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles size={18} /> AI Extracted Metrics
          </h3>
          {(() => {
            try {
              // Try to strip backticks if AI ignored instructions
              const cleanJson = analysisResult
                .replace(/```json\n?|\n?```/g, "")
                .trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return (
                  <div className="overflow-hidden rounded-lg border border-ink-dark/20">
                    <table className="w-full text-sm text-left m-0">
                      <thead className="bg-paper-base/50">
                        <tr>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Metric
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Value
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Confidence
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Reasoning
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-dark/30">
                        {parsed.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-paper-base/30">
                            <td className="px-4 py-3 text-ink-dark font-medium capitalize">
                              {item.metric_name}
                            </td>
                            <td className="px-4 py-3 text-ink-dark">
                              {item.value}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.ai_confidence_score >= 80 ? "bg-emerald-100 text-emerald-800" : item.ai_confidence_score >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
                              >
                                {item.ai_confidence_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ink-muted text-xs">
                              {item.reasoning}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <div className="text-amber-600">
                  No structured metrics found.
                </div>
              );
            } catch (err) {
              return (
                <div>
                  <div className="text-amber-600 mb-4 text-sm">
                    Failed to parse structured output. Raw response:
                  </div>
                  <Markdown>{analysisResult}</Markdown>
                </div>
              );
            }
          })()}
        </div>
      )}

      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-paper-base flex items-center justify-center">
            <Archive className="text-[#8A8A8A] " size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-dark ">
              Raw Data Source
            </h2>
            <a
              href={
                source.sourceUrl.startsWith("http")
                  ? source.sourceUrl
                  : `https://${source.sourceUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#8A8A8A] hover:text-[#2C2C2C] flex items-center gap-1"
            >
              {source.sourceUrl} <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-ink-dark/20 ">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-ink-dark/30">
              <tr className="bg-paper-base /50">
                <th className="px-4 py-3 text-[#8A8A8A] font-medium w-1/3">
                  Competitor
                </th>
                <td className="px-4 py-3 text-ink-dark ">{competitorName}</td>
              </tr>
              <tr>
                <th className="px-4 py-3 text-[#8A8A8A] font-medium">
                  Source Type
                </th>
                <td className="px-4 py-3 text-ink-dark capitalize">
                  {source.type}
                </td>
              </tr>
              <tr className="bg-paper-base /50">
                <th className="px-4 py-3 text-[#8A8A8A] font-medium">
                  Confidence Level
                </th>
                <td className="px-4 py-3 text-ink-dark ">
                  {source.confidenceLevel}
                </td>
              </tr>
              <tr>
                <th className="px-4 py-3 text-[#8A8A8A] font-medium">
                  Is Deduced
                </th>
                <td className="px-4 py-3 text-ink-dark ">
                  {source.isDeduced ? "Yes" : "No"}
                </td>
              </tr>
              <tr className="bg-paper-base /50">
                <th className="px-4 py-3 text-[#8A8A8A] font-medium">
                  Timestamp
                </th>
                <td className="px-4 py-3 text-ink-dark ">
                  {new Date(source.timestamp).toLocaleString()}
                </td>
              </tr>
              <tr>
                <th className="px-4 py-3 text-[#8A8A8A] font-medium">Tags</th>
                <td className="px-4 py-3 text-ink-dark ">
                  {source.tags.join("\n, ")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {linkedInsights && linkedInsights.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[#8A8A8A] mb-2 uppercase tracking-wider">
              Derived Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-paper-base border border-ink-dark/20 rounded-lg p-4"
                >
                  <h4 className="font-bold text-ink-dark mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-ink-muted line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {source.type === "screenshot" && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-[#8A8A8A] mb-2 uppercase tracking-wider flex justify-between items-center">
              Media Source
              <Tooltip
                content={tMessage(dictionary.tooltips.common.downloadImage)}
                position="left"
              >
                <button
                  onClick={() => window.open(source.sourceUrl, "_blank")}
                  className="text-[#8A8A8A] hover:text-[#2C2C2C] flex items-center gap-1 text-xs normal-case"
                >
                  <Download size={12} /> Download
                </button>
              </Tooltip>
            </h3>
            <div
              className="bg-paper-base border border-ink-dark/20 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => onExpandImage(source.sourceUrl)}
            >
              <img
                src={source.sourceUrl}
                alt="Source Media"
                className="w-full max-h-[400px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-medium text-[#8A8A8A] mb-2 uppercase tracking-wider flex justify-between items-center">
            Extracted Excerpt
            <Tooltip
              content={tMessage(dictionary.tooltips.common.copySource)}
              position="left"
            >
              <button
                onClick={copySourceText}
                className="text-[#8A8A8A] hover:text-[#2C2C2C] flex items-center gap-1 text-xs normal-case"
              >
                <Copy size={12} /> Copy with Context
              </button>
            </Tooltip>
          </h3>
          <div className="bg-paper-base border border-ink-dark/20 rounded-lg p-4 overflow-x-auto">
            <JsonViewer text={source.excerpt} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SummaryPage({
  productContext,
  title,
  value,
  icon,
  trend,
  stats,
  onBack,
  competitors,
  featureDetails,
  setFeatureDetails,
  onAddFeatureToProduct,
  comparingCompetitorIds,
  setComparingCompetitorIds,
}: any) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await withModelFallback(
        async (ai, model) => {
          return await ai.generateContent(model, {
            contents: `Analyze the following summary data. Return the source data as tables or excerpts and a summary explaining why this matters. Title: ${title}\nValue: ${value}\nTrend: ${trend}\nStats: ${JSON.stringify(stats)}`,
          });
        },
        { capability: "chat" },
      );
      setAnalysisResult(response.text || "No analysis generated.");
    } catch (error: any) {
      console.error(error);
      setAnalysisResult(
        `Failed to generate analysis: ${getErrorMessage(error)}. Click "Analyze" to retry.`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <Tooltip
          content={tMessage(dictionary.tooltips.navigation.returnDashboard)}
          position="right"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-ink-dark transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </Tooltip>
        <Tooltip
          content={tMessage(dictionary.tooltips.common.fetchRealTime)}
          position="left"
        >
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-[#2C2C2C] text-[#F5F3ED] px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {isAnalyzing ? "Analyzing..." : "Pull and analyze latest data"}
          </button>
        </Tooltip>
      </div>

      {analysisResult && (
        <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl prose prose-sm max-w-none">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles size={18} /> AI Extracted Metrics
          </h3>
          {(() => {
            try {
              // Try to strip backticks if AI ignored instructions
              const cleanJson = analysisResult
                .replace(/```json\n?|\n?```/g, "")
                .trim();
              const parsed = JSON.parse(cleanJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return (
                  <div className="overflow-hidden rounded-lg border border-ink-dark/20">
                    <table className="w-full text-sm text-left m-0">
                      <thead className="bg-paper-base/50">
                        <tr>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Metric
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Value
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Confidence
                          </th>
                          <th className="px-4 py-3 text-[#8A8A8A] font-medium border-b border-ink-dark/20">
                            Reasoning
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-dark/30">
                        {parsed.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-paper-base/30">
                            <td className="px-4 py-3 text-ink-dark font-medium capitalize">
                              {item.metric_name}
                            </td>
                            <td className="px-4 py-3 text-ink-dark">
                              {item.value}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.ai_confidence_score >= 80 ? "bg-emerald-100 text-emerald-800" : item.ai_confidence_score >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}
                              >
                                {item.ai_confidence_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-ink-muted text-xs">
                              {item.reasoning}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return (
                <div className="text-amber-600">
                  No structured metrics found.
                </div>
              );
            } catch (err) {
              return (
                <div>
                  <div className="text-amber-600 mb-4 text-sm">
                    Failed to parse structured output. Raw response:
                  </div>
                  <Markdown>{analysisResult}</Markdown>
                </div>
              );
            }
          })()}
        </div>
      )}

      <div className="bg-paper-card border border-ink-dark/20 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-paper-base flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-dark ">{title}</h2>
            <p className="text-sm text-[#8A8A8A] ">Detailed view</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-paper-base border border-ink-dark/20 rounded-lg p-4">
            <div className="text-[#8A8A8A] text-sm mb-1">Current Value</div>
            <div className="text-2xl font-bold text-ink-dark ">{value}</div>
          </div>
          <div className="bg-paper-base border border-ink-dark/20 rounded-lg p-4">
            <div className="text-[#8A8A8A] text-sm mb-1">Trend</div>
            <div className="text-lg font-medium text-ink-dark ">
              {trend || "Stable"}
            </div>
          </div>
        </div>

        {title === "Estimated Market Value" || title === "Est. Market Value" ? (
          <div className="mt-8 mb-8">
            <MarketValueNotebook stats={stats} />
          </div>
        ) : (
          <div className="mt-8 mb-8">
            <DataPointsTable
              productContext={productContext}
              type={title}
              data={competitors}
              featureDetails={featureDetails}
              setFeatureDetails={setFeatureDetails}
              onAddFeatureToProduct={onAddFeatureToProduct}
              comparingCompetitorIds={comparingCompetitorIds}
              setComparingCompetitorIds={setComparingCompetitorIds}
            />
          </div>
        )}

        <h3 className="text-lg font-semibold text-ink-dark mb-4">
          Related Market Data
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, val]) => (
            <div
              key={key}
              className="bg-paper-base border border-ink-dark/20 rounded-lg p-4"
            >
              <div className="text-[#8A8A8A] text-xs uppercase tracking-wider mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div className="text-ink-dark font-medium">{String(val)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
