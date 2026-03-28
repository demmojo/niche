import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadDataModal } from "../../components/UploadDataModal";
import { server } from "../../test-utils/server";
import { http, HttpResponse } from "msw";

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
    fireEvent.click(analyzeBtn);
    expect(mockOnDataAnalyzed).not.toHaveBeenCalled();

    server.use(
      http.post("https://generativelanguage.googleapis.com/*", () => {
        return HttpResponse.json({
          candidates: [{ content: { parts: [{ text: "" }] } }],
        });
      }),
    );

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

    render(
      <UploadDataModal
        isOpen={true}
        onClose={mockOnClose}
        onDataAnalyzed={mockOnDataAnalyzed}
        competitors={[]}
      />,
    );

    const file = new File(["dummy content"], "test.csv", { type: "text/csv" });
    file.text = async () => "dummy content";

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("test.csv")).toBeInTheDocument();

    const analyzeBtn = screen.getByText("Analyze Data");
    fireEvent.click(analyzeBtn);

    expect(screen.getByText("Processing...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnDataAnalyzed).toHaveBeenCalled();
      const calledArgs = mockOnDataAnalyzed.mock.calls[0];
      // Since handlers.ts has a default MSW response:
      expect(calledArgs[1][0].title).toBe("Mock AI Insight");
      expect(calledArgs[1][0].source).toBe("AI");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles API errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    server.use(
      http.post("https://generativelanguage.googleapis.com/*", () => {
        return HttpResponse.error();
      }),
    );

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

  it("handles dragenter, dragleave, and drop events", () => {
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
      .closest(".border-dashed")!;

    fireEvent.dragEnter(dropzone);
    expect(dropzone.className).toContain("border-sky");

    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toContain("border-sky");

    fireEvent.dragOver(dropzone);
    expect(dropzone.className).toContain("border-sky");

    const file = new File(["dummy content"], "dragged.csv", {
      type: "text/csv",
    });
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

    fireEvent.change(input, {
      target: {
        files: [new File(["{}"], "data.json", { type: "application/json" })],
      },
    });
    expect(screen.getByText("data.json")).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        files: [new File(["# Hello"], "data.md", { type: "text/markdown" })],
      },
    });
    expect(screen.getByText("data.md")).toBeInTheDocument();

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
});
