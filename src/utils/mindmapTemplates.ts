import {
  Card,
  WhiteboardEdge,
  CardInstance,
} from "../store/visualKnowledgeStore";

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  cards: Omit<Card, "id">[];
  layout: (cardIds: string[]) => {
    instances: CardInstance[];
    edges: WhiteboardEdge[];
  };
}

export const templates: Record<string, TemplateDefinition> = {
  competitorAnalysis: {
    id: "competitorAnalysis",
    name: "Competitor Analysis",
    description: "Map out strengths, weaknesses, and market positioning.",
    cards: [
      {
        title: "Market Leader",
        content: "Who holds the most market share?",
        type: "competitor",
        tags: ["#competitor", "#market-leader"],
      },
      {
        title: "Emerging Challenger",
        content: "Who is growing fastest?",
        type: "competitor",
        tags: ["#competitor", "#challenger"],
      },
      {
        title: "Niche Player",
        content: "Who dominates a specific segment?",
        type: "competitor",
        tags: ["#competitor", "#niche"],
      },
      {
        title: "Our Position",
        content: "Where do we fit in?",
        type: "category",
        tags: ["#strategy"],
      },
      {
        title: "Key Differentiator",
        content: "What makes us unique?",
        type: "insight",
        tags: ["#differentiator"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      return {
        instances: [
          {
            id: `inst-${Date.now()}-1`,
            cardId: cardIds[0],
            position: { x: 100, y: 100 },
          },
          {
            id: `inst-${Date.now()}-2`,
            cardId: cardIds[1],
            position: { x: 400, y: 100 },
          },
          {
            id: `inst-${Date.now()}-3`,
            cardId: cardIds[2],
            position: { x: 700, y: 100 },
          },
          {
            id: `inst-${Date.now()}-4`,
            cardId: cardIds[3],
            position: { x: 400, y: 350 },
          },
          {
            id: `inst-${Date.now()}-5`,
            cardId: cardIds[4],
            position: { x: 400, y: 550 },
          },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: `inst-${Date.now()}-1`,
            target: `inst-${Date.now()}-4`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: `inst-${Date.now()}-2`,
            target: `inst-${Date.now()}-4`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: `inst-${Date.now()}-3`,
            target: `inst-${Date.now()}-4`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-4`,
            source: `inst-${Date.now()}-4`,
            target: `inst-${Date.now()}-5`,
            type: "default",
          },
        ],
      };
    },
  },
  swotAnalysis: {
    id: "swotAnalysis",
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats.",
    cards: [
      {
        title: "Strengths",
        content: "Internal positive attributes.",
        type: "category",
        tags: ["#swot", "#strengths"],
      },
      {
        title: "Weaknesses",
        content: "Internal negative attributes.",
        type: "category",
        tags: ["#swot", "#weaknesses"],
      },
      {
        title: "Opportunities",
        content: "External positive factors.",
        type: "category",
        tags: ["#swot", "#opportunities"],
      },
      {
        title: "Threats",
        content: "External negative factors.",
        type: "category",
        tags: ["#swot", "#threats"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      return {
        instances: [
          {
            id: `inst-${Date.now()}-1`,
            cardId: cardIds[0],
            position: { x: 100, y: 100 },
          },
          {
            id: `inst-${Date.now()}-2`,
            cardId: cardIds[1],
            position: { x: 500, y: 100 },
          },
          {
            id: `inst-${Date.now()}-3`,
            cardId: cardIds[2],
            position: { x: 100, y: 400 },
          },
          {
            id: `inst-${Date.now()}-4`,
            cardId: cardIds[3],
            position: { x: 500, y: 400 },
          },
        ],
        edges: [],
      };
    },
  },
  productDesign: {
    id: "productDesign",
    name: "Product Design",
    description: "Visualizing user flows, UI components, data structures.",
    cards: [
      {
        title: "User Entry Point",
        content: "Where does the user start?",
        type: "category",
        tags: ["#flow", "#entry"],
      },
      {
        title: "Core Action",
        content: "What is the main task?",
        type: "insight",
        tags: ["#flow", "#action"],
      },
      {
        title: "Success State",
        content: "What happens when they succeed?",
        type: "note",
        tags: ["#flow", "#success"],
      },
      {
        title: "Error State",
        content: "What if something goes wrong?",
        type: "note",
        tags: ["#flow", "#error"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const inst1 = `inst-${Date.now()}-1`;
      const inst2 = `inst-${Date.now()}-2`;
      const inst3 = `inst-${Date.now()}-3`;
      const inst4 = `inst-${Date.now()}-4`;
      return {
        instances: [
          { id: inst1, cardId: cardIds[0], position: { x: 100, y: 250 } },
          { id: inst2, cardId: cardIds[1], position: { x: 400, y: 250 } },
          { id: inst3, cardId: cardIds[2], position: { x: 700, y: 100 } },
          { id: inst4, cardId: cardIds[3], position: { x: 700, y: 400 } },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: inst1,
            target: inst2,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: inst2,
            target: inst3,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: inst2,
            target: inst4,
            type: "smoothstep",
          },
        ],
      };
    },
  },
  gapAnalysis: {
    id: "gapAnalysis",
    name: "Gap Analysis",
    description: "Current state vs desired state and steps to bridge the gap.",
    cards: [
      {
        title: "Current State",
        content: "Where are we now?",
        type: "category",
        tags: ["#gap", "#current"],
      },
      {
        title: "Desired State",
        content: "Where do we want to be?",
        type: "category",
        tags: ["#gap", "#desired"],
      },
      {
        title: "The Gap",
        content: "What is missing?",
        type: "insight",
        tags: ["#gap", "#analysis"],
      },
      {
        title: "Action Plan",
        content: "How do we get there?",
        type: "note",
        tags: ["#gap", "#action"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const inst1 = `inst-${Date.now()}-1`;
      const inst2 = `inst-${Date.now()}-2`;
      const inst3 = `inst-${Date.now()}-3`;
      const inst4 = `inst-${Date.now()}-4`;
      return {
        instances: [
          { id: inst1, cardId: cardIds[0], position: { x: 100, y: 250 } },
          { id: inst2, cardId: cardIds[1], position: { x: 700, y: 250 } },
          { id: inst3, cardId: cardIds[2], position: { x: 400, y: 100 } },
          { id: inst4, cardId: cardIds[3], position: { x: 400, y: 400 } },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: inst1,
            target: inst3,
            type: "straight",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: inst3,
            target: inst2,
            type: "straight",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: inst3,
            target: inst4,
            type: "straight",
          },
        ],
      };
    },
  },
  userJourney: {
    id: "userJourney",
    name: "User Journey Mapping",
    description: "Visualizing customer touchpoints and pain points.",
    cards: [
      {
        title: "Awareness",
        content: "How do they find us?",
        type: "category",
        tags: ["#journey", "#awareness"],
      },
      {
        title: "Consideration",
        content: "How do they evaluate us?",
        type: "category",
        tags: ["#journey", "#consideration"],
      },
      {
        title: "Decision",
        content: "Why do they buy?",
        type: "category",
        tags: ["#journey", "#decision"],
      },
      {
        title: "Retention",
        content: "Why do they stay?",
        type: "category",
        tags: ["#journey", "#retention"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const inst1 = `inst-${Date.now()}-1`;
      const inst2 = `inst-${Date.now()}-2`;
      const inst3 = `inst-${Date.now()}-3`;
      const inst4 = `inst-${Date.now()}-4`;
      return {
        instances: [
          { id: inst1, cardId: cardIds[0], position: { x: 100, y: 200 } },
          { id: inst2, cardId: cardIds[1], position: { x: 350, y: 200 } },
          { id: inst3, cardId: cardIds[2], position: { x: 600, y: 200 } },
          { id: inst4, cardId: cardIds[3], position: { x: 850, y: 200 } },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: inst1,
            target: inst2,
            type: "straight",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: inst2,
            target: inst3,
            type: "straight",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: inst3,
            target: inst4,
            type: "straight",
          },
        ],
      };
    },
  },
  goToMarket: {
    id: "goToMarket",
    name: "Go-To-Market Strategy",
    description: "Target audience, channels, messaging, launch phases.",
    cards: [
      {
        title: "Target Audience",
        content: "Who are we selling to?",
        type: "category",
        tags: ["#gtm", "#audience"],
      },
      {
        title: "Value Proposition",
        content: "What value do we provide?",
        type: "insight",
        tags: ["#gtm", "#value"],
      },
      {
        title: "Marketing Channels",
        content: "How will we reach them?",
        type: "category",
        tags: ["#gtm", "#channels"],
      },
      {
        title: "Sales Strategy",
        content: "How will we close deals?",
        type: "category",
        tags: ["#gtm", "#sales"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const inst1 = `inst-${Date.now()}-1`;
      const inst2 = `inst-${Date.now()}-2`;
      const inst3 = `inst-${Date.now()}-3`;
      const inst4 = `inst-${Date.now()}-4`;
      return {
        instances: [
          { id: inst1, cardId: cardIds[0], position: { x: 400, y: 100 } },
          { id: inst2, cardId: cardIds[1], position: { x: 400, y: 300 } },
          { id: inst3, cardId: cardIds[2], position: { x: 200, y: 500 } },
          { id: inst4, cardId: cardIds[3], position: { x: 600, y: 500 } },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: inst1,
            target: inst2,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: inst2,
            target: inst3,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: inst2,
            target: inst4,
            type: "smoothstep",
          },
        ],
      };
    },
  },
  rootCause: {
    id: "rootCause",
    name: "Root Cause Analysis (5 Whys)",
    description: "Drilling down into underlying problems.",
    cards: [
      {
        title: "The Problem",
        content: "What is the issue?",
        type: "category",
        tags: ["#rca", "#problem"],
      },
      {
        title: "Why 1",
        content: "Why did this happen?",
        type: "note",
        tags: ["#rca", "#why1"],
      },
      {
        title: "Why 2",
        content: "Why did *that* happen?",
        type: "note",
        tags: ["#rca", "#why2"],
      },
      {
        title: "Why 3",
        content: "Why did *that* happen?",
        type: "note",
        tags: ["#rca", "#why3"],
      },
      {
        title: "Root Cause",
        content: "The fundamental reason.",
        type: "insight",
        tags: ["#rca", "#root"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const insts = cardIds.map((id, i) => ({
        id: `inst-${Date.now()}-${i}`,
        cardId: id,
        position: { x: 400, y: 100 + i * 150 },
      }));
      const edges = [];
      for (let i = 0; i < 4; i++) {
        edges.push({
          id: `edge-${Date.now()}-${i}`,
          source: insts[i].id,
          target: insts[i + 1].id,
          type: "straight" as const,
        });
      }
      return { instances: insts, edges };
    },
  },
  leanCanvas: {
    id: "leanCanvas",
    name: "Lean Canvas",
    description: "Value prop, customer segments, revenue streams.",
    cards: [
      {
        title: "Problem",
        content: "Top 3 problems",
        type: "category",
        tags: ["#lean", "#problem"],
      },
      {
        title: "Solution",
        content: "Top 3 features",
        type: "category",
        tags: ["#lean", "#solution"],
      },
      {
        title: "Value Proposition",
        content: "Single clear compelling message",
        type: "insight",
        tags: ["#lean", "#value"],
      },
      {
        title: "Customer Segments",
        content: "Target customers",
        type: "category",
        tags: ["#lean", "#customers"],
      },
      {
        title: "Revenue Streams",
        content: "Revenue model",
        type: "note",
        tags: ["#lean", "#revenue"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      return {
        instances: [
          {
            id: `inst-${Date.now()}-1`,
            cardId: cardIds[0],
            position: { x: 100, y: 100 },
          },
          {
            id: `inst-${Date.now()}-2`,
            cardId: cardIds[1],
            position: { x: 350, y: 100 },
          },
          {
            id: `inst-${Date.now()}-3`,
            cardId: cardIds[2],
            position: { x: 600, y: 100 },
          },
          {
            id: `inst-${Date.now()}-4`,
            cardId: cardIds[3],
            position: { x: 850, y: 100 },
          },
          {
            id: `inst-${Date.now()}-5`,
            cardId: cardIds[4],
            position: { x: 475, y: 350 },
          },
        ],
        edges: [],
      };
    },
  },
  userPersona: {
    id: "userPersona",
    name: "User Persona Mapping",
    description: "Demographics, behaviors, goals.",
    cards: [
      {
        title: "Persona Profile",
        content: "Name, Role, Demographics",
        type: "root",
        tags: ["#persona", "#profile"],
      },
      {
        title: "Goals",
        content: "What are they trying to achieve?",
        type: "category",
        tags: ["#persona", "#goals"],
      },
      {
        title: "Frustrations",
        content: "What are their pain points?",
        type: "category",
        tags: ["#persona", "#pain"],
      },
      {
        title: "Behaviors",
        content: "How do they act?",
        type: "note",
        tags: ["#persona", "#behavior"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const inst1 = `inst-${Date.now()}-1`;
      return {
        instances: [
          { id: inst1, cardId: cardIds[0], position: { x: 400, y: 250 } },
          {
            id: `inst-${Date.now()}-2`,
            cardId: cardIds[1],
            position: { x: 100, y: 100 },
          },
          {
            id: `inst-${Date.now()}-3`,
            cardId: cardIds[2],
            position: { x: 700, y: 100 },
          },
          {
            id: `inst-${Date.now()}-4`,
            cardId: cardIds[3],
            position: { x: 400, y: 500 },
          },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: inst1,
            target: `inst-${Date.now()}-2`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: inst1,
            target: `inst-${Date.now()}-3`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: inst1,
            target: `inst-${Date.now()}-4`,
            type: "smoothstep",
          },
        ],
      };
    },
  },
  contentStrategy: {
    id: "contentStrategy",
    name: "Content Strategy Architecture",
    description: "Content pillars and distribution.",
    cards: [
      {
        title: "Core Theme",
        content: "Main brand narrative",
        type: "root",
        tags: ["#content", "#theme"],
      },
      {
        title: "Pillar 1",
        content: "Major topic area",
        type: "category",
        tags: ["#content", "#pillar"],
      },
      {
        title: "Pillar 2",
        content: "Major topic area",
        type: "category",
        tags: ["#content", "#pillar"],
      },
      {
        title: "Pillar 3",
        content: "Major topic area",
        type: "category",
        tags: ["#content", "#pillar"],
      },
      {
        title: "Distribution",
        content: "Channels & Formats",
        type: "insight",
        tags: ["#content", "#distribution"],
      },
    ],
    /**
     *
     */
    layout: (cardIds) => {
      const rootInst = `inst-${Date.now()}-0`;
      const distInst = `inst-${Date.now()}-4`;

      return {
        instances: [
          { id: rootInst, cardId: cardIds[0], position: { x: 400, y: 100 } },
          {
            id: `inst-${Date.now()}-1`,
            cardId: cardIds[1],
            position: { x: 100, y: 300 },
          },
          {
            id: `inst-${Date.now()}-2`,
            cardId: cardIds[2],
            position: { x: 400, y: 300 },
          },
          {
            id: `inst-${Date.now()}-3`,
            cardId: cardIds[3],
            position: { x: 700, y: 300 },
          },
          { id: distInst, cardId: cardIds[4], position: { x: 400, y: 550 } },
        ],
        edges: [
          {
            id: `edge-${Date.now()}-1`,
            source: rootInst,
            target: `inst-${Date.now()}-1`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-2`,
            source: rootInst,
            target: `inst-${Date.now()}-2`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-3`,
            source: rootInst,
            target: `inst-${Date.now()}-3`,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-4`,
            source: `inst-${Date.now()}-1`,
            target: distInst,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-5`,
            source: `inst-${Date.now()}-2`,
            target: distInst,
            type: "smoothstep",
          },
          {
            id: `edge-${Date.now()}-6`,
            source: `inst-${Date.now()}-3`,
            target: distInst,
            type: "smoothstep",
          },
        ],
      };
    },
  },
};
