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
