import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapabilityGapDashboard } from "../../components/CapabilityGapDashboard";

const mockProductData = {
  name: "My App",
  description: "A great app",
  targetAudience: "Everyone",
  valueProposition: "It works",
  targetRegions: [],
  strategy: [],
  features: [
    {
      id: "1",
      name: "Authentication",
      description: "Log in",
      status: "completed" as const,
      provenance: { sourceType: "manual" as const },
    },
    {
      id: "2",
      name: "Dark Mode",
      description: "Dark theme",
      status: "planned" as const,
      provenance: { sourceType: "manual" as const },
    },
  ],
};

const mockCompetitors = [
  {
    id: "c1",
    name: "Competitor A",
    description: "Rival",
    website: "https://example.com",
    freeTier: "No",
    spamProtection: "No",
    integrations: [],
    sovereigntyScore: "low",
    logoUrl: "",
    financialSnapshot: "",
    coreFeatures: [],
    howWeCompare: "",
    competitorScore: 0,
    trustScore: 0,
    strengths: [],
    weaknesses: [],
    features: ["Authentication", "Offline Support", "SSO"],
  },
  {
    id: "c2",
    name: "Competitor B",
    description: "Rival",
    website: "https://example.com",
    freeTier: "No",
    spamProtection: "No",
    integrations: [],
    sovereigntyScore: "low",
    logoUrl: "",
    financialSnapshot: "",
    coreFeatures: [],
    howWeCompare: "",
    competitorScore: 0,
    trustScore: 0,
    strengths: [],
    weaknesses: [],
    features: ["Dark Mode", "Push Notifications"],
  },
];

describe("CapabilityGapDashboard", () => {
  it("renders parity score correctly", () => {
    render(
      <CapabilityGapDashboard
        productData={mockProductData}
        competitors={mockCompetitors}
      />,
    );

    // Total unique features from competitors: 'Authentication', 'Offline Support', 'SSO', 'Dark Mode', 'Push Notifications' (5 features)
    // Product has: 'Authentication', 'Dark Mode' (2 features)
    // Parity: (2/5) * 100 = 40%
    expect(screen.getByText(/Market Parity: 40%/i)).toBeInTheDocument();
  });

  it("renders met capabilities", () => {
    render(
      <CapabilityGapDashboard
        productData={mockProductData}
        competitors={mockCompetitors}
      />,
    );

    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });

  it("renders capability gaps", () => {
    render(
      <CapabilityGapDashboard
        productData={mockProductData}
        competitors={mockCompetitors}
      />,
    );

    expect(screen.getByText("Offline Support")).toBeInTheDocument();
    expect(screen.getByText("SSO")).toBeInTheDocument();
    expect(screen.getByText("Push Notifications")).toBeInTheDocument();
  });

  it("shows full parity message when no gaps exist", () => {
    const fullParityProduct = {
      ...mockProductData,
      features: [
        {
          id: "1",
          name: "Feature A",
          description: "",
          status: "completed" as const,
          provenance: { sourceType: "manual" as const },
        },
      ],
    };
    const easyCompetitors = [
      {
        id: "c1",
        name: "Competitor A",
        description: "",
        url: "",
        strengths: [],
        weaknesses: [],
        features: ["Feature A"],
      },
    ];

    render(
      <CapabilityGapDashboard
        productData={fullParityProduct}
        competitors={easyCompetitors}
      />,
    );

    expect(
      screen.getByText(/You have parity with all known competitor features/i),
    ).toBeInTheDocument();
  });
});
