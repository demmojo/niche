import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SuperadminPendingRoasts } from "../../components/superadmin/SuperadminPendingRoasts";

// Mock Firebase functions
vi.mock("../../firebase", () => ({
  db: {},
}));

const mockDocRef = { id: "doc-1" };
const mockUpdateDoc = vi.fn();

let mockDocs: any[] = [];

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ docs: mockDocs });
    return () => {}; // Unsubscribe
  }),
  doc: vi.fn(),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
}));

describe("SuperadminPendingRoasts UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocs = [
      {
        id: "report-1",
        data: () => ({
          status: "pending",
          userEmail: "founder@example.com",
          draft_markdown: "## The Idea\nA SaaS for dogs.",
          lineage_data: {
            tarpitScore: 50,
            wasOverridden: true,
            exaResults: [{ title: "Rover", text: "Walk dogs" }],
          },
        }),
        ref: mockDocRef,
      },
    ];
  });

  it("blocks non-superadmins", () => {
    const user = { email: "regular@example.com" };
    render(<SuperadminPendingRoasts user={user} />);
    expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
  });

  it("allows superadmins and shows the queue", async () => {
    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    await waitFor(() => {
      expect(screen.getByText("founder@example.com")).toBeInTheDocument();
    });
  });

  it("shows empty state when no reports", async () => {
    mockDocs = [];
    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    await waitFor(() => {
      expect(
        screen.getByText("No pending reports in queue."),
      ).toBeInTheDocument();
    });
  });

  it("can select a report, edit markdown, and approve", async () => {
    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    const reportItem = await screen.findByText("founder@example.com");
    await userEvent.click(reportItem);

    const textarea = await screen.findByDisplayValue(/A SaaS for dogs/i);
    expect(textarea).toBeInTheDocument();
    expect(screen.getByText("MATH OVERRIDE")).toBeInTheDocument();

    await userEvent.type(textarea, " Edited.");

    const approveBtn = screen.getByRole("button", { name: /Approve Report/i });
    await userEvent.click(approveBtn);

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
      status: "approved",
      draft_markdown: "## The Idea\nA SaaS for dogs. Edited.",
    });
  });

  it("can select a report and reject", async () => {
    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    const reportItem = await screen.findByText("founder@example.com");
    await userEvent.click(reportItem);

    const rejectBtn = screen.getByRole("button", { name: /Reject/i });
    await userEvent.click(rejectBtn);

    expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
      status: "rejected",
    });
  });

  it("handles approve errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    const reportItem = await screen.findByText("founder@example.com");
    await userEvent.click(reportItem);

    const approveBtn = screen.getByRole("button", { name: /Approve Report/i });
    await userEvent.click(approveBtn);

    expect(consoleSpy).toHaveBeenCalledWith(new Error("Update failed"));
    consoleSpy.mockRestore();
  });

  it("handles reject errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

    const user = { email: "mo.hassaniv@gmail.com" };
    render(<SuperadminPendingRoasts user={user} />);

    const reportItem = await screen.findByText("founder@example.com");
    await userEvent.click(reportItem);

    const rejectBtn = screen.getByRole("button", { name: /Reject/i });
    await userEvent.click(rejectBtn);

    expect(consoleSpy).toHaveBeenCalledWith(new Error("Update failed"));
    consoleSpy.mockRestore();
  });
});
