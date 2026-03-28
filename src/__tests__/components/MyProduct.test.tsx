import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { MyProduct, MyProductData } from "../../../src/components/MyProduct";
import { withKeyRotation } from "../../../src/utils/geminiClient";

// Mock lucide icons
vi.mock("lucide-react", () => ({
  Package: () => <div data-testid="icon-package" />,
  Target: () => <div data-testid="icon-target" />,
  MapPin: () => <div data-testid="icon-mappin" />,
  List: () => <div data-testid="icon-list" />,
  Plus: () => <div data-testid="icon-plus" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Trash2: () => <div data-testid="icon-trash2" />,
  Edit2: () => <div data-testid="icon-edit2" />,
  Check: () => <div data-testid="icon-check" />,
  X: () => <div data-testid="icon-x" />,
  ChevronDown: () => <div data-testid="icon-chevrondown" />,
  ChevronUp: () => <div data-testid="icon-chevronup" />,
  Download: () => <div data-testid="icon-download" />,
}));

// Mock ExportButton
vi.mock("../../../src/components/ExportButton", () => ({
  default: ({ onExport, label }: any) => (
    <button onClick={onExport} data-testid="export-button">
      {label}
    </button>
  ),
}));

// Mock DocumentationWizardModal
vi.mock("../../../src/components/DocumentationWizardModal", () => ({
  DocumentationWizardModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="wizard-modal">
        <button onClick={onClose} data-testid="close-wizard">
          Close Wizard
        </button>
      </div>
    ) : null,
}));

// Mock Tooltip
vi.mock("../../../src/components/Tooltip", () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
}));

// Mock Gemini Client
vi.mock("../../../src/utils/geminiClient", () => ({
  withKeyRotation: vi.fn(),
}));

// Mock @google/genai
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

// Mock react-markdown
vi.mock("react-markdown", () => ({
  default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

// Mock motion/react as requested
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useFirebaseSync as requested
vi.mock("../../../src/hooks/useFirebaseSync", () => ({
  useFirebaseSync: vi.fn(() => ({
    saveData: vi.fn(),
    syncState: "synced",
  })),
}));

const mockInitialData: MyProductData = {
  name: "Test Product",
  description: "Test Description",
  targetRegions: ["North America", "Europe"],
  features: [
    { id: "f1", name: "Feature 1", description: "Desc 1", status: "planned" },
  ],
  strategy: [{ id: "s1", content: "Strategy 1", status: "todo" }],
};

const mockCompetitors = [{ name: "Comp A", features: ["Comp Feat 1"] }];

const mockInsights: any[] = [];

const MyProductWrapper = ({ initialData = mockInitialData }) => {
  const [data, setData] = useState(initialData);
  return (
    <MyProduct
      productData={data}
      setProductData={setData}
      competitors={mockCompetitors}
      insights={mockInsights}
    />
  );
};

describe("MyProduct Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product data correctly", () => {
    render(<MyProductWrapper />);

    // Check main details
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("North America")).toBeInTheDocument();
    expect(screen.getByText("Europe")).toBeInTheDocument();

    // Check features
    expect(screen.getByText("Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Desc 1")).toBeInTheDocument();

    // Check strategy
    expect(screen.getByText("Strategy 1")).toBeInTheDocument();
  });

  it("handles editing product details", async () => {
    render(<MyProductWrapper />);

    // Click edit
    const editButton = screen.getByText("Edit Details");
    fireEvent.click(editButton);

    // Should show inputs
    const nameInput = screen.getByDisplayValue("Test Product");
    const descInput = screen.getByDisplayValue("Test Description");
    const regionsInput = screen.getByDisplayValue("North America, Europe");

    // Change values
    fireEvent.change(nameInput, { target: { value: "Updated Product" } });
    fireEvent.change(descInput, { target: { value: "Updated Description" } });
    fireEvent.change(regionsInput, { target: { value: "Asia, Africa" } });

    // Save
    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    // Verify updates
    expect(screen.getByText("Updated Product")).toBeInTheDocument();
    expect(screen.getByText("Updated Description")).toBeInTheDocument();
    expect(screen.getByText("Asia")).toBeInTheDocument();
    expect(screen.getByText("Africa")).toBeInTheDocument();
  });

  it("can add a new feature", async () => {
    render(<MyProductWrapper />);

    const input = screen.getByPlaceholderText("Add a new feature...");
    fireEvent.change(input, { target: { value: "New Feature 2" } });

    // Press Enter to add
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("New Feature 2")).toBeInTheDocument();
    });
  });

  it("can edit an existing feature", async () => {
    render(<MyProductWrapper />);

    // Find edit button for feature (it's hidden by opacity but clickable)
    // We can find it by getting all icon-edit2 elements and picking the second one (first is for product details)
    const editIcons = screen.getAllByTestId("icon-edit2");
    // editIcons[0] is the product details edit button, editIcons[1] is the feature edit button
    const featureEditBtn = editIcons[1].closest("button");
    fireEvent.click(featureEditBtn!);

    const nameInput = screen.getByDisplayValue("Feature 1");
    const descInput = screen.getByDisplayValue("Desc 1");

    fireEvent.change(nameInput, { target: { value: "Updated Feature 1" } });
    fireEvent.change(descInput, { target: { value: "Updated Desc 1" } });

    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);

    expect(screen.getByText("Updated Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Updated Desc 1")).toBeInTheDocument();
  });

  it("can change feature status", async () => {
    render(<MyProductWrapper />);

    const select = screen.getByDisplayValue("Planned");
    fireEvent.change(select, { target: { value: "in-progress" } });

    expect((select as HTMLSelectElement).value).toBe("in-progress");
  });

  it("can remove a feature", async () => {
    render(<MyProductWrapper />);

    expect(screen.getByText("Feature 1")).toBeInTheDocument();

    const trashIcons = screen.getAllByTestId("icon-trash2");
    const featureTrashBtn = trashIcons[0].closest("button");
    fireEvent.click(featureTrashBtn!);

    expect(screen.queryByText("Feature 1")).not.toBeInTheDocument();
    expect(screen.getByText("No features added yet.")).toBeInTheDocument();
  });

  it("can add, update status, and remove a strategy", async () => {
    render(<MyProductWrapper />);

    // Add
    const input = screen.getByPlaceholderText("Add a strategic step...");
    fireEvent.change(input, { target: { value: "New Strategy 2" } });
    const addBtnIcons = screen.getAllByTestId("icon-plus");
    const strategyAddBtn = addBtnIcons[1].closest("button");
    fireEvent.click(strategyAddBtn!);

    expect(screen.getByText("New Strategy 2")).toBeInTheDocument();

    // Update status of the first strategy
    const select = screen.getAllByRole("combobox")[1]; // Feature status is first, strategy status is second
    fireEvent.change(select, { target: { value: "doing" } });
    expect((select as HTMLSelectElement).value).toBe("doing");

    // Remove first strategy
    const trashIcons = screen.getAllByTestId("icon-trash2");
    const strategyTrashBtn = trashIcons[1].closest("button"); // Second trash icon is for strategy
    fireEvent.click(strategyTrashBtn!);

    expect(screen.queryByText("Strategy 1")).not.toBeInTheDocument();
  });

  it("can generate strategy via AI", async () => {
    // Mock the AI response
    const mockAiResponse = {
      text: JSON.stringify(["AI Strategy 1", "AI Strategy 2"]),
    };
    (withKeyRotation as any).mockResolvedValue(mockAiResponse);

    render(<MyProductWrapper />);

    const generateBtn = screen.getByText("AI Suggest");
    fireEvent.click(generateBtn);

    expect(screen.getByText("Generating...")).toBeInTheDocument();

    await waitFor(() => {
      expect(withKeyRotation).toHaveBeenCalled();
      expect(screen.getByText("AI Strategy 1")).toBeInTheDocument();
      expect(screen.getByText("AI Strategy 2")).toBeInTheDocument();
    });
  });

  it("can handle wizard open and close", async () => {
    render(<MyProductWrapper />);

    expect(screen.queryByTestId("wizard-modal")).not.toBeInTheDocument();

    const exportBtn = screen.getByTestId("export-button");
    fireEvent.click(exportBtn);

    expect(screen.getByTestId("wizard-modal")).toBeInTheDocument();

    const closeWizard = screen.getByTestId("close-wizard");
    fireEvent.click(closeWizard);

    expect(screen.queryByTestId("wizard-modal")).not.toBeInTheDocument();
  });
});
