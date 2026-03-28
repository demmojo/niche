import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncReviewModal } from "../../components/SyncReviewModal";
import { SyncDiff } from "../../types";

describe("SyncReviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDiffs: SyncDiff[] = [
    {
      id: "1",
      entityId: "Comp A",
      entityType: "Competitor",
      field: "targetAudience",
      oldValue: "SMB",
      newValue: "Enterprise",
      description: "Update Target Audience",
    },
    {
      id: "2",
      entityId: "Comp B",
      entityType: "Competitor",
      field: "techStack",
      oldValue: ["React"],
      newValue: ["React", "Node"],
      description: "Update Tech Stack",
    },
  ];

  it("renders nothing when not open", () => {
    const { container } = render(
      <SyncReviewModal
        isOpen={false}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders grouped diffs and defaults to all selected", async () => {
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={() => {}}
      />,
    );

    expect(await screen.findByText("Review Sync Changes")).toBeInTheDocument();
    expect(screen.getByText("2 / 2 changes selected")).toBeInTheDocument();
  });

  it("allows deselecting a specific diff", async () => {
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={() => {}}
      />,
    );

    // Both checkboxes start checked
    const checkboxes = await screen.findAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();

    // Deselect first diff
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
    expect(screen.getByText("1 / 2 changes selected")).toBeInTheDocument();
  });

  it("handles Select All and Deselect All global actions", async () => {
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={() => {}}
      />,
    );

    fireEvent.click(await screen.findByText("Deselect All"));
    expect(screen.getByText("0 / 2 changes selected")).toBeInTheDocument();

    // Commit button should be disabled when nothing is selected
    expect(screen.getByRole("button", { name: /Commit/ })).toBeDisabled();

    fireEvent.click(screen.getByText("Select All"));
    expect(screen.getByText("2 / 2 changes selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Commit/ })).toBeEnabled();
  });

  it("calls onCommit with selected diff IDs", async () => {
    const onCommitMock = vi.fn();
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={onCommitMock}
      />,
    );

    const checkboxes = await screen.findAllByRole("checkbox");
    // Deselect second item (ID '2')
    fireEvent.click(checkboxes[1]);

    fireEvent.click(screen.getByRole("button", { name: /Commit/ }));

    // Should only submit ID '1'
    expect(onCommitMock).toHaveBeenCalledWith(["1"]);
  });

  it("can toggle entire groups of changes", async () => {
    const onCommitMock = vi.fn();
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={() => {}}
        syncQueue={mockDiffs}
        onCommit={onCommitMock}
      />,
    );

    // Toggle off a group
    const deselectGroupBtns = await screen.findAllByText("Deselect Group");
    fireEvent.click(deselectGroupBtns[0]);

    expect(screen.getByText("1 / 2 changes selected")).toBeInTheDocument();

    // Toggle on a group
    const selectGroupBtn = await screen.findByText("Select Group");
    fireEvent.click(selectGroupBtn);

    expect(screen.getByText("2 / 2 changes selected")).toBeInTheDocument();
  });

  it("renders correctly with no sync changes", () => {
    render(
      <SyncReviewModal
        isOpen={true}
        onClose={vi.fn()}
        onCommit={vi.fn()}
        syncQueue={[]}
      />,
    );
    expect(screen.getByText("No pending sync changes")).toBeInTheDocument();
  });
});
