import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { DocumentationWizardModal } from "../../components/DocumentationWizardModal";

vi.mock("jszip", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn(),
      folder: vi.fn().mockReturnValue({ file: vi.fn() }),
      generateAsync: vi.fn().mockResolvedValue(new Blob()),
    })),
  };
});

// Mock URL.createObjectURL and URL.revokeObjectURL
beforeAll(() => {
  global.URL.createObjectURL = vi
    .fn()
    .mockReturnValue("blob:http://localhost/test");
  global.URL.revokeObjectURL = vi.fn();
});

describe("DocumentationWizardModal", () => {
  const myProductData: any = {
    name: "Test Product",
    description: "A test product",
    targetRegions: ["US"],
    features: [{ name: "Feature A", type: "core", complexity: "low" }],
    strategy: [{ content: "Step 1" }],
  };

  const insights: any[] = [
    {
      id: "1",
      title: "Insight A",
      description: "Desc A",
      category: "opportunity",
    },
    { id: "2", title: "Insight B", description: "Desc B", category: "threat" },
    { id: "3", title: "Insight C", description: "Desc C", category: "other" },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <DocumentationWizardModal
        isOpen={false}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly and navigates steps", async () => {
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );

    expect(screen.getByText("Documentation Generator")).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText("Insight A")).toBeInTheDocument();

    fireEvent.click(nextBtn);

    expect(screen.getByText("One-Pager")).toBeInTheDocument();

    fireEvent.click(screen.getByText("One-Pager"));
    const genBtn = screen.getByText("Generate Document");
    fireEvent.click(genBtn);

    expect(screen.getByText("Generating Documentation...")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(
          screen.queryByText("Generating Documentation..."),
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    expect(screen.getByText(/Test Product One-Pager/i)).toBeInTheDocument();
  });

  it("renders correctly when product data is empty", async () => {
    const user = userEvent.setup();
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={{} as any}
        insights={[]}
      />,
    );
    expect(screen.getByText("No strategy items found.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next/i }));
    expect(
      screen.getByText("No insights found in the library."),
    ).toBeInTheDocument();
  });

  it("allows unchecking and checking features and insights, and toggle all insights", async () => {
    const user = userEvent.setup();
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );

    // Step 1: Features
    const featureCheckbox = screen.getByRole("checkbox", {
      name: /Feature A/i,
    });
    expect(featureCheckbox).toBeChecked();
    await user.click(featureCheckbox);
    expect(featureCheckbox).not.toBeChecked();

    // Toggle all features
    const selectAllFeaturesBtn = screen.getAllByText("Select All / None")[0];
    await user.click(selectAllFeaturesBtn);
    expect(featureCheckbox).toBeChecked();
    await user.click(selectAllFeaturesBtn);
    expect(featureCheckbox).not.toBeChecked();

    // Strategy
    const strategyCheckbox = screen.getByRole("checkbox", { name: /Step 1/i });
    expect(strategyCheckbox).toBeChecked();
    await user.click(strategyCheckbox);
    expect(strategyCheckbox).not.toBeChecked();

    // Toggle all strategy
    const selectAllStrategyBtn = screen.getAllByText("Select All / None")[1];
    await user.click(selectAllStrategyBtn);
    expect(strategyCheckbox).toBeChecked();
    await user.click(selectAllStrategyBtn);
    expect(strategyCheckbox).not.toBeChecked();

    // Move to step 2: Insights
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Test back button
    await user.click(screen.getByRole("button", { name: /Back/i }));
    expect(screen.getByText("Feature A")).toBeInTheDocument();

    // Move to step 2 again
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Insights aren't checked by default
    const insightCheckbox = screen.getByRole("checkbox", {
      name: /Insight A/i,
    });
    expect(insightCheckbox).not.toBeChecked();
    await user.click(insightCheckbox);
    expect(insightCheckbox).toBeChecked();

    // Toggle all (Select All)
    const selectAllBtn = screen.getByText("Select All / None");
    await user.click(selectAllBtn);

    // Check if Insight B is now checked (it was unchecked)
    expect(screen.getByRole("checkbox", { name: /Insight B/i })).toBeChecked();

    // Toggle all (Select None)
    await user.click(selectAllBtn);
    expect(
      screen.getByRole("checkbox", { name: /Insight A/i }),
    ).not.toBeChecked();
  });

  it("generates a One-Pager format", async () => {
    const user = userEvent.setup();
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );

    // Step 1 -> 2
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Step 2: Check an insight!
    const insightCheckbox = screen.getByRole("checkbox", {
      name: /Insight A/i,
    });
    await user.click(insightCheckbox);

    // Step 2 -> 3
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Select One-Pager format
    await user.click(screen.getByText("One-Pager"));
    await user.click(screen.getByText("Generate Document"));

    await waitFor(
      () => {
        expect(
          screen.queryByText("Generating Documentation..."),
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    expect(screen.getByText(/Key Insights/i)).toBeInTheDocument();
  });

  it("generates a PRD format and handles downloading", async () => {
    const user = userEvent.setup();
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );

    // Step 1 -> 2
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Check an insight
    const insightCheckbox = screen.getByRole("checkbox", {
      name: /Insight A/i,
    });
    await user.click(insightCheckbox);

    // Step 2 -> 3
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Select PRD format
    await user.click(screen.getByText("PRD"));
    await user.click(screen.getByText("Generate Document"));

    await waitFor(
      () => {
        expect(
          screen.queryByText("Generating Documentation..."),
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    // Assert PRD format string
    expect(
      screen.getByText(/Product Requirements Document \(PRD\)/i),
    ).toBeInTheDocument();

    // Mock anchor click
    const aSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    // Test Download
    const downloadBtn = screen.getByRole("button", { name: /Export File/i });
    await user.click(downloadBtn);
    await waitFor(() => {
      expect(aSpy).toHaveBeenCalled();
    });

    // Test Copy
    const copyBtn = screen.getByRole("button", { name: /Copy to Clipboard/i });
    await user.click(copyBtn);
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("generates an OpenSpec format", async () => {
    const user = userEvent.setup();
    render(
      <DocumentationWizardModal
        isOpen={true}
        onClose={vi.fn()}
        myProductData={myProductData}
        insights={insights}
      />,
    );

    // Step 1 -> 2
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Check an insight
    const insightCheckbox = screen.getByRole("checkbox", {
      name: /Insight A/i,
    });
    await user.click(insightCheckbox);

    // Step 2 -> 3
    await user.click(screen.getByRole("button", { name: /Next/i }));

    await user.click(screen.getByText("OpenSpec Archive"));
    await user.click(screen.getByText("Generate Document"));

    await waitFor(
      () => {
        expect(
          screen.queryByText("Generating Documentation..."),
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );

    expect(
      screen.getByText(/OpenSpec File Generation Preview/i),
    ).toBeInTheDocument();

    // Mock anchor click
    const aSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    // Test Download button (it uses JSZip for OpenSpec)
    const downloadBtn = screen.getByRole("button", { name: /Export Archive/i });
    await user.click(downloadBtn);

    // Since JSZip is mocked, it resolves blob and creates object URL
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(aSpy).toHaveBeenCalled();
    });
  });
});
