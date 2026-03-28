import { Competitor, DataSource, DerivedInsight } from "../types";
import { Card, Whiteboard } from "../store/visualKnowledgeStore";

export const demoCompetitors: Competitor[] = [
  {
    id: "comp-1",
    name: "TechFlow",
    website: "techflow.io",
    freeTier: "Enterprise (Contact Us)",
    spamProtection: "Yes",
    integrations: ["Salesforce", "Slack"],
    targetAudience: "Enterprise",
    marketSegments: ["Enterprise", "Mid-Market"],
    dataSovereignty: "US-only",
    sovereigntyScore: "low",
    logoUrl: "",
    financialSnapshot: "$100M ARR",
    coreFeatures: [
      "Workflow Automation",
      "AI Task Routing",
      "Custom Integrations",
      "Real-time Analytics",
    ],
    howWeCompare: "We are cheaper",
    competitorScore: 85,
    trustScore: 90,
  },
  {
    id: "comp-2",
    name: "AutoScale",
    website: "autoscale.com",
    freeTier: "$49/mo Base",
    spamProtection: "No",
    integrations: ["AWS", "GCP"],
    targetAudience: "Startups",
    marketSegments: ["Startups", "SMBs"],
    dataSovereignty: "Global",
    sovereigntyScore: "high",
    logoUrl: "",
    financialSnapshot: "$10M ARR",
    coreFeatures: [
      "Auto-scaling Infrastructure",
      "Predictive Resource Allocation",
      "Usage Dashboards",
    ],
    howWeCompare: "We are more reliable",
    competitorScore: 78,
    trustScore: 80,
  },
  {
    id: "comp-3",
    name: "DataSync",
    website: "datasync.ai",
    freeTier: "$99/mo Pro",
    spamProtection: "Yes",
    integrations: ["Snowflake", "BigQuery"],
    targetAudience: "Data Engineers",
    marketSegments: ["Enterprise", "Agencies"],
    dataSovereignty: "EU-only",
    sovereigntyScore: "medium",
    logoUrl: "",
    financialSnapshot: "$50M ARR",
    coreFeatures: [
      "Bi-directional Sync",
      "Conflict Resolution",
      "Data Governance Policies",
    ],
    howWeCompare: "We are faster",
    competitorScore: 92,
    trustScore: 95,
  },
];

export const demoInsights: DerivedInsight[] = [
  {
    id: "insight-1",
    title: "SWOT Analysis - Core Market",
    description: `**Strengths:**
- Proprietary AI models outperform TechFlow by 15% in latency.
- Deep integration ecosystem.

**Weaknesses:**
- Higher learning curve for non-technical users.
- Premium pricing model limits SMB adoption.

**Opportunities:**
- Expand into predictive analytics where AutoScale is currently weak.
- Partner with mid-market CRM providers.

**Threats:**
- DataSync is rapidly expanding their governance features.
- Potential open-source alternatives cannibalizing the bottom tier.`,
    category: "opportunity",
    impact: "high",
    timestamp: new Date().toISOString(),
    source: "AI",
  },
  {
    id: "insight-2",
    title: "Pricing Strategy Shift",
    description:
      "AutoScale is moving downmarket. We should hold our premium position but introduce a limited freemium tier to capture top-of-funnel leads before they establish lock-in with AutoScale.",
    category: "trend",
    impact: "medium",
    timestamp: new Date().toISOString(),
    source: "Brainstorm",
  },
];

export const demoRawData: DataSource[] = [
  {
    id: "raw-1",
    competitorId: "comp-1",
    type: "news",
    sourceUrl: "https://techflow.io/news",
    excerpt:
      "CEO explicitly mentioned shifting focus away from SMBs towards enterprise deployments with custom SLAs.",
    timestamp: new Date().toISOString(),
    tags: ["Enterprise", "Strategy"],
    confidenceLevel: "High",
    isDeduced: false,
    source: "Google Search",
    linkedInsightIds: [],
  },
  {
    id: "raw-2",
    competitorId: "comp-2",
    type: "website",
    sourceUrl: "https://autoscale.com/status",
    excerpt:
      "Major 3-hour outage due to unhandled database migrations in their predictive allocation engine.",
    timestamp: new Date().toISOString(),
    tags: ["Outage", "Reliability"],
    confidenceLevel: "Critical",
    isDeduced: false,
    source: "Human",
    linkedInsightIds: [],
  },
];

const mockCard1: Card = {
  id: "card-1",
  title: "TechFlow",
  content: "Enterprise focus, high pricing",
  type: "competitor",
  tags: ["Enterprise"],
  entityId: "comp-1",
};

const mockCard2: Card = {
  id: "card-2",
  title: "AutoScale",
  content: "SMB focus, recent reliability issues",
  type: "competitor",
  tags: ["SMB"],
  entityId: "comp-2",
};

const mockCard3: Card = {
  id: "card-3",
  title: "Our Positioning",
  content: "Premium mid-market, high reliability",
  type: "root",
  tags: ["Strategy"],
};

export const demoCards: Record<string, Card> = {
  [mockCard1.id]: mockCard1,
  [mockCard2.id]: mockCard2,
  [mockCard3.id]: mockCard3,
};

export const demoWhiteboards: Record<string, Whiteboard> = {
  "wb-demo-1": {
    id: "wb-demo-1",
    name: "Q4 Competitive Landscape",
    cardInstances: [
      { id: "inst-1", cardId: "card-3", position: { x: 400, y: 300 } },
      { id: "inst-2", cardId: "card-1", position: { x: 100, y: 100 } },
      { id: "inst-3", cardId: "card-2", position: { x: 700, y: 100 } },
    ],
    edges: [
      { id: "edge-1", source: "inst-2", target: "inst-1", type: "smoothstep" },
      { id: "edge-2", source: "inst-3", target: "inst-1", type: "smoothstep" },
    ],
  },
};

import {
  SentimentInsight,
  JobToBeDone,
  Assumption,
  ValidationCampaign,
  ValueFactor,
} from "../types";

export const demoSentimentInsights: SentimentInsight[] = [
  {
    id: "sent-1",
    competitorId: "comp-1",
    featureName: "Workflow Automation",
    prevalenceScore: 0.85,
    dissatisfactionScore: 0.75,
    confidenceScore: 0.9,
    verbatimQuotes: [
      "Takes 15 clicks to set up a basic if-this-then-that rule",
      "Constantly breaks when API schemas change",
    ],
    isHumanVerified: true,
    timestamp: new Date().toISOString(),
  },
  {
    id: "sent-2",
    competitorId: "comp-1",
    featureName: "Custom Integrations",
    prevalenceScore: 0.6,
    dissatisfactionScore: 0.3,
    confidenceScore: 0.85,
    verbatimQuotes: ["Love how easy it is to drop in my own webhooks"],
    isHumanVerified: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "sent-3",
    competitorId: "comp-2",
    featureName: "Usage Dashboards",
    prevalenceScore: 0.9,
    dissatisfactionScore: 0.88,
    confidenceScore: 0.95,
    verbatimQuotes: [
      "Reporting is impossible to customize",
      "Can't export to CSV easily",
      "Charts take 10 seconds to load",
    ],
    isHumanVerified: true,
    timestamp: new Date().toISOString(),
  },
  {
    id: "sent-4",
    competitorId: "comp-3",
    featureName: "Conflict Resolution",
    prevalenceScore: 0.4,
    dissatisfactionScore: 0.8,
    confidenceScore: 0.75,
    verbatimQuotes: [
      "Manual conflict resolution is a nightmare for large datasets",
    ],
    isHumanVerified: false,
    timestamp: new Date().toISOString(),
  },
];

export const demoJTBDs: JobToBeDone[] = [
  {
    id: "jtbd-1",
    jobStatement:
      "Help me quickly identify which customers are at risk of churning so I can intervene before they leave.",
    importanceScore: 9,
    currentSatisfactionScore: 4,
    opportunityScore: 14, // 9 + (9-4)
    confidenceScore: 0.92,
    verbatimQuotes: [
      "I spend 4 hours a week manually checking usage logs to guess who might cancel",
    ],
    isHumanVerified: true,
    timestamp: new Date().toISOString(),
  },
  {
    id: "jtbd-2",
    jobStatement:
      "Help me securely share specific data dashboards with external partners without giving them full access.",
    importanceScore: 7,
    currentSatisfactionScore: 3,
    opportunityScore: 11, // 7 + (7-3)
    confidenceScore: 0.85,
    verbatimQuotes: [
      "We have to screenshot our internal tool because RBAC doesn't support external viewers",
    ],
    isHumanVerified: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "jtbd-3",
    jobStatement:
      "Help me automatically format my monthly reports into a PDF so I can email them to the board.",
    importanceScore: 5,
    currentSatisfactionScore: 8,
    opportunityScore: 5, // 5 + 0
    confidenceScore: 0.95,
    verbatimQuotes: ["The new auto-export feature saves me so much time"],
    isHumanVerified: true,
    timestamp: new Date().toISOString(),
  },
];

export const demoAssumptions: Assumption[] = [
  {
    id: "assump-1",
    category: "desirability",
    statement:
      "Users will pay $50/mo specifically for the advanced predictive analytics module.",
    importanceScore: 9,
    evidenceStrength: 3,
    confidenceScore: 0.7,
    verbatimQuotes: [
      "People in forums say they want prediction, but no one mentions paying for it",
    ],
    isHumanVerified: true,
    linkedEvidenceIds: ["raw-1"],
    timestamp: new Date().toISOString(),
  },
  {
    id: "assump-2",
    category: "viability",
    statement:
      "We can acquire SMB customers for less than $150 CAC using LinkedIn Ads.",
    importanceScore: 8,
    evidenceStrength: 2,
    confidenceScore: 0.6,
    verbatimQuotes: [
      "LinkedIn CPCs for B2B SaaS average $8-$12, making a $150 CAC very difficult",
    ],
    isHumanVerified: false,
    linkedEvidenceIds: [],
    timestamp: new Date().toISOString(),
  },
  {
    id: "assump-3",
    category: "feasibility",
    statement:
      "Our AI model can process 10k rows of CSV data in under 5 seconds.",
    importanceScore: 7,
    evidenceStrength: 8,
    confidenceScore: 0.9,
    verbatimQuotes: ["Benchmark test 4 passed with 3.2s average latency"],
    isHumanVerified: true,
    linkedEvidenceIds: [],
    timestamp: new Date().toISOString(),
  },
];

export const demoValidationCampaigns: ValidationCampaign[] = [
  {
    id: "val-1",
    name: "Predictive Analytics Fake Door",
    adImpressions: 15400,
    ctaClicks: 420,
    emailCaptures: 85,
    purchaseIntent: 12,
    calculatedCPAi: 45.5,
    skinInTheGameScore: 75,
    timestamp: new Date().toISOString(),
  },
  {
    id: "val-2",
    name: "Automated Reporting Fake Door",
    adImpressions: 22000,
    ctaClicks: 310,
    emailCaptures: 20,
    purchaseIntent: 0,
    calculatedCPAi: 180.0,
    skinInTheGameScore: 15,
    timestamp: new Date().toISOString(),
  },
];

export const demoValueFactors: ValueFactor[] = [
  {
    id: "vf-1",
    name: "Price",
    dimension: "price",
    userProductScore: 8, // Higher is better (e.g., more affordable)
    competitorScores: { "comp-1": 3, "comp-2": 6, "comp-3": 4 },
    timestamp: new Date().toISOString(),
  },
  {
    id: "vf-2",
    name: "Ease of Use",
    dimension: "usability",
    userProductScore: 9,
    competitorScores: { "comp-1": 4, "comp-2": 8, "comp-3": 6 },
    timestamp: new Date().toISOString(),
  },
  {
    id: "vf-3",
    name: "Enterprise Integrations",
    dimension: "customization",
    userProductScore: 4,
    competitorScores: { "comp-1": 9, "comp-2": 5, "comp-3": 8 },
    timestamp: new Date().toISOString(),
  },
  {
    id: "vf-4",
    name: "Data Governance",
    dimension: "performance",
    userProductScore: 5,
    competitorScores: { "comp-1": 7, "comp-2": 3, "comp-3": 9 },
    timestamp: new Date().toISOString(),
  },
  {
    id: "vf-5",
    name: "Setup Speed",
    dimension: "support",
    userProductScore: 9,
    competitorScores: { "comp-1": 3, "comp-2": 7, "comp-3": 5 },
    timestamp: new Date().toISOString(),
  },
];
