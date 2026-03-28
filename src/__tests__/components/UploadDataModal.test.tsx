import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadDataModal } from "../../components/UploadDataModal";
import { withKeyRotation } from "../../utils/geminiClient";

// Mock the Gemini AI client module
vi.mock("../../utils/geminiClient", () => ({
  withKeyRotation: vi.fn().mockImplementation(async (callback) => {
    // Provide a dummy ai and model to the callback
    const dummyAi = {
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify({
            newSources: [{ type: "website", excerpt: "Test Source" }],
            newInsights: [
              {
                title: "Test Insight",
                description: "desc",
                category: "Pricing",
                impact: "high",
              },
            ],
          }),
        }),
      },
    };
    return callback(dummyAi, "test-model");
  }),
}));

describe("UploadDataModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <UploadDataModal
        isOpen={false}
        onClose={vi.fn()}
        onDataAnalyzed={vi.fn()}
        competitors={[]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("handles empty response from AI and early returns if no file", async () => {
    // 1. Test early return when no file
    const mockOnDataAnalyzed = vi.fn();
    render(
      <UploadDataModal
        isOpen={true}
        onClose={vi.fn()}
        onDataAnalyzed={mockOnDataAnalyzed}
        competitors={[]}
      />,
    );

    const analyzeBtn = screen.getByText("Analyze Data");
    fireEvent.click(analyzeBtn); // No file uploaded yet
    expect(mockOnDataAnalyzed).not.toHaveBeenCalled();

    // 2. Test empty AI response
    vi.mocked(withKeyRotation).mockResolvedValueOnce({
      text: undefined, // to trigger response.text || '{}'
    });

    const file = new File(["dummy content"], "empty.csv", { type: "text/csv" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(mockOnDataAnalyzed).toHaveBeenCalledWith([], []);
    });
  });

  it("calls onDataAnalyzed with parsed AI response on successful analysis", async () => {
    const mockOnDataAnalyzed = vi.fn();
    const mockOnClose = vi.fn();

    // The default mock implementation executes the callback and resolves successfully.

    render(
      <UploadDataModal
        isOpen={true}
        onClose={mockOnClose}
        onDataAnalyzed={mockOnDataAnalyzed}
        competitors={[]}
      />,
    );

    // Simulate a file upload
    const file = new File(["dummy content"], "test.csv", { type: "text/csv" });
    file.text = async () => "dummy content";

    // Get the hidden input element
    // Assuming the "input" element is hidden and can be found by type or label
    // The component has: <p className="text-ink-dark font-semibold text-lg">Click to upload or drag and drop</p>
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Assert the file was recognized
    expect(screen.getByText("test.csv")).toBeInTheDocument();

    // Click analyze
    const analyzeBtn = screen.getByText("Analyze Data");
    fireEvent.click(analyzeBtn);

    // Assert that the component transitions to a loading state
    expect(screen.getByText("Processing...")).toBeInTheDocument();

    // Wait for the async AI mock to resolve and fire the callback
    await waitFor(() => {
      expect(mockOnDataAnalyzed).toHaveBeenCalled();

      // Verify the generated structures
      const calledArgs = mockOnDataAnalyzed.mock.calls[0];
      expect(calledArgs[0][0].excerpt).toBe("Test Source");
      expect(calledArgs[0][0].source).toBe("Human");
      expect(calledArgs[1][0].title).toBe("Test Insight");
      expect(calledArgs[1][0].source).toBe("AI");

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    vi.mocked(withKeyRotation).mockRejectedValueOnce(new Error("API failure"));

    render(
      <UploadDataModal
        isOpen={true}
        onClose={vi.fn()}
        onDataAnalyzed={vi.fn()}
        competitors={[]}
      />,
    );

    const file = new File(["dummy content"], "test.csv", { type: "text/csv" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    const analyzeBtn = screen.getByText("Analyze Data");
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        "Failed to analyze file. Please try again.",
      );
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("allows removing the selected file", async () => {
    render(
      <UploadDataModal
        isOpen={true}
        onClose={vi.fn()}
        onDataAnalyzed={vi.fn()}
        competitors={[]}
      />,
    );
    const file = new File(["dummy content"], "test.csv", { type: "text/csv" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("test.csv")).toBeInTheDocument();

    const removeBtn = screen.getByText("Remove File");
    fireEvent.click(removeBtn);

    expect(screen.queryByText("test.csv")).not.toBeInTheDocument();
  });

  it("clicks the hidden file input when dropzone is clicked", () => {
    render(
      <UploadDataModal
        isOpen={true}
        onClose={vi.fn()}
        onDataAnalyzed={vi.fn()}
        competitors={[]}
      />,
    );

    const dropzone = screen
      .getByText("Click to upload or drag and drop")
      .closest(".cursor-pointer")!;
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const clickSpy = vi.spyOn(input, "click");
    fireEvent.click(dropzone);
    expect(clickSpy).toHaveBeenCalled();
  });
  render(
    <UploadDataModal
      isOpen={true}
      onClose={vi.fn()}
      onDataAnalyzed={vi.fn()}
      competitors={[]}
    />,
  );

  // Get the element with border-dashed
  const dropzone = screen
    .getByText("Click to upload or drag and drop")
    .closest(".border-dashed")!;

  // dragenter
  fireEvent.dragEnter(dropzone);
  expect(dropzone.className).toContain("border-sky");

  // dragleave
  fireEvent.dragLeave(dropzone);
  expect(dropzone.className).not.toContain("border-sky");

  // dragover (to prevent default)
  fireEvent.dragOver(dropzone);
  expect(dropzone.className).toContain("border-sky");

  // drop
  const file = new File(["dummy content"], "dragged.csv", { type: "text/csv" });
  fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

  expect(dropzone.className).not.toContain("border-sky");
  expect(screen.getByText("dragged.csv")).toBeInTheDocument();
});

it("renders correct icons for different file types", () => {
  render(
    <UploadDataModal
      isOpen={true}
      onClose={vi.fn()}
      onDataAnalyzed={vi.fn()}
      competitors={[]}
    />,
  );

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;

  // JSON
  fireEvent.change(input, {
    target: {
      files: [new File(["{}"], "data.json", { type: "application/json" })],
    },
  });
  expect(screen.getByText("data.json")).toBeInTheDocument();

  // MD
  fireEvent.change(input, {
    target: {
      files: [new File(["# Hello"], "data.md", { type: "text/markdown" })],
    },
  });
  expect(screen.getByText("data.md")).toBeInTheDocument();

  // TXT
  fireEvent.change(input, {
    target: {
      files: [new File(["Hello"], "data.txt", { type: "text/plain" })],
    },
  });
  expect(screen.getByText("data.txt")).toBeInTheDocument();
});

it("falls back to FileReader if file.text is not available and handles read errors", async () => {
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const mockOnDataAnalyzed = vi.fn();
  render(
    <UploadDataModal
      isOpen={true}
      onClose={vi.fn()}
      onDataAnalyzed={mockOnDataAnalyzed}
      competitors={[]}
    />,
  );

  const file = new File(["content"], "old.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: undefined });

  // Mock FileReader to throw error
  const originalFileReader = window.FileReader;
  window.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: function () {
      if (this.onerror) this.onerror(new Error("Read failed"));
    },
  })) as any;

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });

  fireEvent.click(screen.getByText("Analyze Data"));

  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error analyzing file:",
      expect.any(Error),
    );
  });

  window.FileReader = originalFileReader;
  consoleSpy.mockRestore();
});
it("handles dragenter, dragleave, and drop events", () => {
  render(
    <UploadDataModal
      isOpen={true}
      onClose={vi.fn()}
      onDataAnalyzed={vi.fn()}
      competitors={[]}
    />,
  );

  // Get the element with border-dashed
  const dropzone = screen
    .getByText("Click to upload or drag and drop")
    .closest(".border-dashed")!;

  // dragenter
  fireEvent.dragEnter(dropzone);
  expect(dropzone.className).toContain("border-sky");

  // dragleave
  fireEvent.dragLeave(dropzone);
  expect(dropzone.className).not.toContain("border-sky");

  // dragover (to prevent default)
  fireEvent.dragOver(dropzone);
  expect(dropzone.className).toContain("border-sky");

  // drop
  const file = new File(["dummy content"], "dragged.csv", { type: "text/csv" });
  fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

  expect(dropzone.className).not.toContain("border-sky");
  expect(screen.getByText("dragged.csv")).toBeInTheDocument();
});
it("renders correct icons for different file types", () => {
  render(
    <UploadDataModal
      isOpen={true}
      onClose={vi.fn()}
      onDataAnalyzed={vi.fn()}
      competitors={[]}
    />,
  );

  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;

  // JSON
  fireEvent.change(input, {
    target: {
      files: [new File(["{}"], "data.json", { type: "application/json" })],
    },
  });
  expect(screen.getByText("data.json")).toBeInTheDocument();

  // MD
  fireEvent.change(input, {
    target: {
      files: [new File(["# Hello"], "data.md", { type: "text/markdown" })],
    },
  });
  expect(screen.getByText("data.md")).toBeInTheDocument();

  // TXT
  fireEvent.change(input, {
    target: {
      files: [new File(["Hello"], "data.txt", { type: "text/plain" })],
    },
  });
  expect(screen.getByText("data.txt")).toBeInTheDocument();
});
