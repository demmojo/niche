import React from "react";
import { render, screen, waitFor } from "../../test-utils/render";
import { describe, it, expect, vi } from "vitest";
import { SuperadminDashboard } from "../../components/SuperadminDashboard";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

vi.mock("../../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
}));

describe("SuperadminDashboard", () => {
  it("shows access denied for non-superadmin", () => {
    render(<SuperadminDashboard isSuperadmin={false} />);
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it("fetches and displays feedback when superadmin", async () => {
    (getDocs as any).mockResolvedValue({
      docs: [
        {
          id: "1",
          data: () => ({
            type: "Bug",
            message: "test bug",
            timestamp: "2026-03-18T10:00:00Z",
            userEmail: "test@test.com",
          }),
        },
      ],
    });

    render(<SuperadminDashboard isSuperadmin={true} />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Feedback Dashboard")).toBeInTheDocument();
      expect(screen.getByText("test bug")).toBeInTheDocument();
    });
  });

  it("shows empty state when no feedback", async () => {
    (getDocs as any).mockResolvedValue({
      docs: [],
    });

    render(<SuperadminDashboard isSuperadmin={true} />);

    await waitFor(() => {
      expect(
        screen.getByText("No feedback submitted yet."),
      ).toBeInTheDocument();
    });
  });
});
