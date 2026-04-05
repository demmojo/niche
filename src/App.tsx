import { InsightEngineChat } from "./components/InsightEngineChat";
import { CompetitorDiscoveryModal } from "./components/CompetitorDiscoveryModal";
import { ZeroFrictionEntry } from "./components/ZeroFrictionEntry";
import { JsonViewer } from "./components/JsonViewer";
import { DataSourceCard } from "./components/DataSourceCard";
import { dictionary, tMessage } from "./content/dictionary";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSyncQueue } from "./hooks/useSyncQueue";
import { useSafeAITask } from "./hooks/useSafeAITask";
import { useTaxonomySync } from "./hooks/useTaxonomySync";
import {
  createCompetitorDiffs,
  filterVerifiedDiffs,
} from "./utils/syncDiffUtils";
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
import { db, auth, safeDisableNetwork } from "./firebase";
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
import { getCustomApiKey } from "./utils/apiKeys";
import { trackRequest, updateRateLimits } from "./utils/usageTracker";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { withModelFallback } from "./utils/aiClient";
import { getErrorMessage } from "./utils/errorHandler";
import {
  filterCompetitors,
  filterRawData,
  filterInsights,
} from "./utils/searchFilters";
import Markdown from "react-markdown";
import { InsightQuestModal } from "./components/InsightQuestModal";
import { InsightGeneratorModal } from "./components/InsightGeneratorModal";
import LensStrategyConsole from "./components/lens/LensStrategyConsole";
import { VisualWhiteboard } from "./components/whiteboard/VisualWhiteboard";
import { StrategyToolbox } from "./components/StrategyToolbox";
import { useVisualKnowledgeStore } from "./store/visualKnowledgeStore";
import { Settings as SettingsComponent } from "./components/Settings";
import { MarketShiftBanner } from "./components/MarketShiftBanner";
import { ComputeMeter } from "./components/ComputeMeter";
import { TarpitWarningModal } from "./components/TarpitWarningModal";
import { useActionCredits } from "./hooks/useActionCredits";
import { SupportHelpPage } from "./components/SupportHelpPage";
import { SuperadminDashboard } from "./components/SuperadminDashboard";
import { DLQViewer } from "./components/DLQViewer";
import { LimitReachedModal } from "./components/LimitReachedModal";
import { RateLimitModal } from "./components/RateLimitModal";
import { checkAlphaLimit, recordAlphaUsage } from "./utils/alphaUsageLimiter";
import { Heart } from "lucide-react";

import { MarketValueNotebook } from "./components/MarketValueNotebook";
import { RapidPdlcWorkflow } from "./components/RapidPdlcWorkflow";
import { DataPointsTable } from "./components/DataPointsTable";
import { HeadToHeadComparison } from "./components/HeadToHeadComparison";
import { UnifiedIdeationEngine } from "./components/ideation/UnifiedIdeationEngine";
import { MyProduct, MyProductData } from "./components/MyProduct";
import { useAuth } from "./components/AuthProvider";
import { InsightBrainstormModal } from "./components/InsightBrainstormModal";
import { PageGuideModal } from "./components/PageGuideModal";
import { UploadDataModal } from "./components/UploadDataModal";
import { ConsolidateFeaturesModal } from "./components/ConsolidateFeaturesModal";
import { TaxonomyMergeModal } from "./components/TaxonomyMergeModal";

import { GlobalProgressBanner } from "./components/GlobalProgressBanner";
import { Tooltip } from "./components/Tooltip";
import ExportButton from "./components/ExportButton";
import { ProductSwitcher } from "./components/ProductSwitcher";
import {
  WorkspaceProvider,
  useWorkspace,
  useWorkspaceDispatch,
  useWorkspaceLoading,
} from "./components/WorkspaceProvider";
import { useSuperadminBootstrap } from "./components/useSuperadminBootstrap";
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
} from "./types";

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
function DeepValidationButton({
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
    if (typeof window !== "undefined") {
      console.log(
        "useLocalStorage useEffect running. URL:",
        window.location.href,
      );
    }
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

export function useMigratedFirestoreDoc<T>(
  legacyKey: string,
  newKey: string,
  initialValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
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
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [data, setData] = useState<T>(initialValue);
  const dataRef = useRef<T>(initialValue);

  // Debounce timeout ref to batch rapid writes and save quota
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip remote sync if demo mode is active
    if (
      window.location.search.includes("demo_data=true") ||
      window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")
    ) {
      return;
    }

    const controller = new AbortController();
    const docRef = doc(db, "workspaces", WORKSPACE_ID, "appData", key);

    const unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (docSnap) => {
        if (controller.signal.aborted) return;

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

  return [data, setValue];
}

import { WorkspaceShell } from "./components/WorkspaceShell";

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  // E2E testing mock logic — skip when e2e_entry=true so ZeroFrictionEntry renders
  if (
    typeof window !== "undefined" &&
    (window.name === "playwright-test" ||
      window.location.search.includes("mock_auth=true")) &&
    !window.location.search.includes("e2e_entry=true")
  ) {
    const isUserRole = window.location.search.includes("role=user");
    const mockEmail = isUserRole ? "user@example.com" : "mo.hassaniv@gmail.com";

    const mockProfilePersona = window.location.search.includes(
      "persona=enterprise",
    )
      ? "enterprise_pm"
      : "solo_founder";
    (window as any).__mock_profile_persona = mockProfilePersona;

    return (
      <WorkspaceProvider>
        <WorkspaceRouter
          user={
            {
              email: mockEmail,
              uid: "test-user-123",
              getIdToken: async () => "MOCK_TOKEN",
            } as any
          }
          logout={() => {}}
        />
      </WorkspaceProvider>
    );
  }

  // Viral Loop Support
  const pathname = window.location.pathname;
  let sharedCampaignId = null;
  if (pathname.startsWith("/strategy/")) {
    sharedCampaignId = pathname.replace("/strategy/", "").split("/")[0];
  }

  if (sharedCampaignId) {
    // If it's a shared campaign, mount WorkspaceRouter with that campaign ID
    return (
      <WorkspaceProvider>
        <WorkspaceRouter
          user={user || { isAnonymous: true, uid: "visitor" }}
          logout={logout}
          sharedCampaignId={sharedCampaignId}
        />
      </WorkspaceProvider>
    );
  }

  return (
    <WorkspaceProvider>
      <WorkspaceRouter user={user} logout={logout} />
    </WorkspaceProvider>
  );
}

function WorkspaceRouter({ user, logout, sharedCampaignId }: any) {
  const isLoadingWorkspace = useWorkspaceLoading();

  const [isRedeeming, setIsRedeeming] = useState(false);

  const isSuperadmin =
    user?.email === "mo.hassaniv@gmail.com" || user?.email === "admin@test.com";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token && !isRedeeming) {
      setIsRedeeming(true);
      import("firebase/functions").then(({ getFunctions, httpsCallable }) => {
        const functions = getFunctions(db.app);
        const redeemInvite = httpsCallable(functions, "redeemInvite");

        redeemInvite({ token })
          .then((result: any) => {
            const workspaceId = result.data.workspaceId;
            // Clean up the URL
            params.delete("token");
            params.set("w", workspaceId);
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?${params.toString()}`,
            );
            alert("Successfully joined the workspace!");
            // Reload to ensure we connect to the new workspace ID
            window.location.reload();
          })
          .catch((error) => {
            console.error("Failed to redeem invite:", error);
            alert(`Failed to redeem invite: ${error.message}`);
            params.delete("token");
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?${params.toString()}`,
            );
            setIsRedeeming(false);
          });
      });
    }
  }, [user]);

  if (isLoadingWorkspace && !sharedCampaignId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // The actual routing logic relies on the WorkspaceShell
  return <WorkspaceShell logout={logout} />;
}
