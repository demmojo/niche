import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DataPointsTable } from "../../components/DataPointsTable";
import { withModelFallback } from "../../../src/utils/aiClient";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  /**
   *
   */
  Table: () => <span data-testid="icon-table" />,
  /**
   *
   */
  Download: () => <span data-testid="icon-download" />,
  /**
   *
   */
  Search: () => <span data-testid="icon-search" />,
  /**
   *
   */
  Filter: () => <span data-testid="icon-filter" />,
  /**
   *
   */
  ExternalLink: () => <span data-testid="icon-external-link" />,
  /**
   *
   */
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  /**
   *
   */
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  /**
   *
   */
  Loader2: () => <span data-testid="icon-loader" />,
  /**
   *
   */
  Sparkles: () => <span data-testid="icon-sparkles" />,
  /**
   *
   */
  Plus: () => <span data-testid="icon-plus" />,
}));

// Mock @google/genai
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

// Mock gemini client wrapper
vi.mock("../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

// Mock react-markdown
vi.mock("react-markdown", () => ({
  /**
   *
   */
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown">{children}</div>
  ),
}));

// Mock Tooltip component
vi.mock("../../components/Tooltip", () => ({
  /**
   *
   */
  Tooltip: ({
    children,
    content,
  }: {
    children: React.ReactNode;
    content: string;
  }) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
}));

describe("DataPointsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockCompetitorsData = [
    {
      id: "1",
      name: "CompA",
      marketCommonalityIndex: 80,
      coreFeatures: ["Feat1"],
      integrations: ["Slack"],
    },
    {
      id: "2",
      name: "CompB",
      marketCommonalityIndex: 90,
      coreFeatures: ["Feat1", "Feat2"],
      integrations: ["Slack", "Jira"],
    },
  ];

  describe("Data Types Rendering", () => {
    it("renders Competitors Tracked type correctly", () => {
      render(
        <DataPointsTable
          type="Competitors Tracked"
          data={mockCompetitorsData}
        />,
      );
      expect(
        screen.getByText("Raw Data Points: Competitors Tracked"),
      ).toBeInTheDocument();
      expect(screen.getByText("CompA")).toBeInTheDocument();
      expect(screen.getByText("CompB")).toBeInTheDocument();
    });

    it("renders Recent Pricing Changes type correctly", () => {
      render(<DataPointsTable type="Recent Pricing Changes" data={[]} />);
      expect(screen.getByText("Typeform")).toBeInTheDocument();
      expect(screen.getByText("+15% Pro Tier")).toBeInTheDocument();
      expect(screen.getByText("Jotform")).toBeInTheDocument();
    });

    it("renders Top Integrations type correctly", () => {
      render(
        <DataPointsTable type="Top Integrations" data={mockCompetitorsData} />,
      );
      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.getByText("Jira")).toBeInTheDocument();
    });

    it("handles unknown/custom types gracefully with empty state", () => {
      // Testing "feedback" or "custom" as requested, which defaults to empty
      render(<DataPointsTable type="Feedback" data={mockCompetitorsData} />);
      expect(
        screen.getByText("No data points found matching your filter."),
      ).toBeInTheDocument();
    });
  });

  describe("Features Indexed capabilities", () => {
    it("extracts and renders features correctly", () => {
      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );
      expect(screen.getByText("Feat1")).toBeInTheDocument();
      expect(screen.getByText("Feat2")).toBeInTheDocument();
    });

    it("filters data by search term", () => {
      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );
      const searchInput = screen.getByPlaceholderText("Filter data...");

      fireEvent.change(searchInput, { target: { value: "Feat2" } });

      expect(screen.getByText("Feat2")).toBeInTheDocument();
      expect(screen.queryByText("Feat1")).not.toBeInTheDocument();
    });

    it("filters data using dropdown filter for closest competitor", () => {
      const extendedMockData = [
        {
          id: "1",
          name: "CompA",
          marketCommonalityIndex: 80,
          coreFeatures: ["FeatOnlyA"],
        },
        {
          id: "2",
          name: "CompB",
          marketCommonalityIndex: 90,
          coreFeatures: ["FeatB"],
        },
      ];
      render(
        <DataPointsTable type="Features Indexed" data={extendedMockData} />,
      );

      const filterSelect = screen.getByRole("combobox", {
        name: "Filter features",
      });

      fireEvent.change(filterSelect, { target: { value: "closest-missing" } });

      expect(screen.getByText("FeatOnlyA")).toBeInTheDocument();
      expect(screen.queryByText("FeatB")).not.toBeInTheDocument();

      fireEvent.change(filterSelect, { target: { value: "closest-has" } });

      expect(screen.getByText("FeatB")).toBeInTheDocument();
      expect(screen.queryByText("FeatOnlyA")).not.toBeInTheDocument();
    });

    it("sorts data when clicking various column headers", () => {
      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );
      const headers = screen.getAllByRole("columnheader");

      // Click through all headers to verify handleSort execution
      headers.forEach((header) => {
        fireEvent.click(header); // sort desc
        fireEvent.click(header); // sort asc
      });

      // Verify table remains rendered correctly without crashing
      expect(screen.getByText("Feat1")).toBeInTheDocument();
    });

    it("handles alternative sorting dropdowns (buy/switch score, adoption, name)", () => {
      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );
      const sortSelect = screen.getByRole("combobox", {
        name: "Sort features",
      });

      fireEvent.change(sortSelect, { target: { value: "adoption" } });
      fireEvent.change(sortSelect, { target: { value: "name" } });

      expect(screen.getByText("Feat1")).toBeInTheDocument();
    });

    it("expands row and fetches AI feature details", async () => {
      const mockGenerateContent = vi
        .fn()
        .mockResolvedValue({ text: "Mock AI Feature Details" });
      (withModelFallback as any).mockImplementation(async (cb: any) => {
        return cb(
          { generateContent: mockGenerateContent },
          "gemini-3.1-pro-preview",
        );
      });

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const feat1Row = screen.getByText("Feat1").closest("tr");
      fireEvent.click(feat1Row!);

      expect(
        screen.getByText("Analyzing feature details and sub-features..."),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Mock AI Feature Details")).toBeInTheDocument();
      });

      // Collapse row
      fireEvent.click(feat1Row!);
      expect(
        screen.queryByText("Mock AI Feature Details"),
      ).not.toBeInTheDocument();
    });

    it("generates user stories when clicking generate button", async () => {
      const mockGenerateContent = vi
        .fn()
        .mockResolvedValueOnce({ text: "Mock AI Feature Details" })
        .mockResolvedValueOnce({ text: "Mock AI User Stories" });

      (withModelFallback as any).mockImplementation(async (cb: any) => {
        return cb(
          { generateContent: mockGenerateContent },
          "gemini-3.1-pro-preview",
        );
      });

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const feat1Row = screen.getByText("Feat1").closest("tr");
      fireEvent.click(feat1Row!);

      await waitFor(() => {
        expect(screen.getByText("Mock AI Feature Details")).toBeInTheDocument();
      });

      const generateBtn = screen.getByText("Generate User Stories & Tasks");
      fireEvent.click(generateBtn);

      expect(
        screen.getByText("Generating user stories and tasks..."),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Mock AI User Stories")).toBeInTheDocument();
      });
    });

    it("suggests a new feature when clicking suggest feature button", async () => {
      const mockGenerateContent = vi
        .fn()
        .mockResolvedValue({ text: "Mock AI Suggested Feature" });
      (withModelFallback as any).mockImplementation(async (cb: any) => {
        return cb(
          { generateContent: mockGenerateContent },
          "gemini-3.1-pro-preview",
        );
      });

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const suggestBtn = screen.getByText("Suggest Feature");
      fireEvent.click(suggestBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Mock AI Suggested Feature"),
        ).toBeInTheDocument();
      });
    });

    it("calls onAddFeatureToProduct when plus button is clicked", () => {
      const mockAddFeature = vi.fn();
      render(
        <DataPointsTable
          type="Features Indexed"
          data={mockCompetitorsData}
          onAddFeatureToProduct={mockAddFeature}
        />,
      );

      const plusButton = screen.getByRole("button", {
        name: "Add Feat1 to product",
      });

      fireEvent.click(plusButton!);
      expect(mockAddFeature).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("handles AI feature detail fetch error gracefully", async () => {
      (withModelFallback as any).mockRejectedValue(new Error("API Error"));

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const feat1Row = screen.getByText("Feat1").closest("tr");
      fireEvent.click(feat1Row!);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load details. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("handles AI user stories error gracefully", async () => {
      const mockGenerateContent = vi
        .fn()
        .mockResolvedValue({ text: "Details" });
      (withModelFallback as any)
        .mockImplementationOnce(async (cb: any) =>
          cb(
            { generateContent: mockGenerateContent },
            "gemini-3.1-pro-preview",
          ),
        )
        .mockRejectedValueOnce(new Error("API Error"));

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const feat1Row = screen.getByText("Feat1").closest("tr");
      fireEvent.click(feat1Row!);

      await waitFor(() => {
        expect(screen.getByText("Details")).toBeInTheDocument();
      });

      const generateBtn = screen.getByText("Generate User Stories & Tasks");
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Failed to generate user stories. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("handles AI suggest feature error gracefully", async () => {
      (withModelFallback as any).mockRejectedValue(new Error("API Error"));

      render(
        <DataPointsTable type="Features Indexed" data={mockCompetitorsData} />,
      );

      const suggestBtn = screen.getByText("Suggest Feature");
      fireEvent.click(suggestBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to generate suggestion. Please try again."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Pagination", () => {
    it("paginates correctly when there are more than 10 items", () => {
      const largeData = Array.from({ length: 25 }).map((_, i) => ({
        id: `${i}`,
        name: `Comp${i}`,
        marketCommonalityIndex: 50,
        coreFeatures: [`Feat${i}`],
      }));

      render(<DataPointsTable type="Features Indexed" data={largeData} />);

      expect(
        screen.getByText(/Showing 1 to 10 of 25 entries/),
      ).toBeInTheDocument();

      // Navigate to Next page
      const nextBtn = screen.getByText("Next");
      fireEvent.click(nextBtn);
      expect(
        screen.getByText(/Showing 11 to 20 of 25 entries/),
      ).toBeInTheDocument();

      // Navigate to specific page
      const page3Btn = screen.getByText("3");
      fireEvent.click(page3Btn);
      expect(
        screen.getByText(/Showing 21 to 25 of 25 entries/),
      ).toBeInTheDocument();

      // Navigate to Previous page
      const prevBtn = screen.getByText("Previous");
      fireEvent.click(prevBtn);
      expect(
        screen.getByText(/Showing 11 to 20 of 25 entries/),
      ).toBeInTheDocument();
    });
  });
});
