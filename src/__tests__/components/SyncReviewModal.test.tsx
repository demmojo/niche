import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
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

    const checkbox1 = await screen.findByRole("checkbox", {
      name: /Select change for Update Target Audience/i,
    });
    const checkbox2 = screen.getByRole("checkbox", {
      name: /Select change for Update Tech Stack/i,
    });
    expect(checkbox1).toBeChecked();
    expect(checkbox2).toBeChecked();

    // Deselect first diff
    fireEvent.click(checkbox1);
    expect(checkbox1).not.toBeChecked();
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

    // Deselect second item (ID '2')
    const checkbox2 = await screen.findByRole("checkbox", {
      name: /Select change for Update Tech Stack/i,
    });
    fireEvent.click(checkbox2);

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
    const deselectGroupBtn = await screen.findByRole("button", {
      name: /Deselect Group Comp A/i,
    });
    fireEvent.click(deselectGroupBtn);

    expect(screen.getByText("1 / 2 changes selected")).toBeInTheDocument();

    // Toggle on a group
    const selectGroupBtn = await screen.findByRole("button", {
      name: /Select Group Comp A/i,
    });
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
