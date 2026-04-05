import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceShell } from "../../components/WorkspaceShell";
import * as AuthProvider from "../../components/AuthProvider";
import * as useUserProfileHook from "../../hooks/useUserProfile";
import * as firestore from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(() => ({})),
    setDoc: vi.fn(() => Promise.resolve()),
  };
});

vi.mock("../../firebase", () => ({
  db: {},
}));

vi.mock("../../components/ZeroFrictionEntry", () => ({
  ZeroFrictionEntry: ({ onIntentSelected, onComplete }: any) => (
    <div data-testid="zero-friction">
      <button onClick={onIntentSelected} data-testid="intent-btn">
        Intent
      </button>
      <button onClick={() => onComplete({})} data-testid="complete-btn">
        Complete
      </button>
    </div>
  ),
}));

vi.mock("../../components/FounderProvider", () => ({
  FounderProvider: ({ children }: any) => (
    <div data-testid="founder-provider">{children}</div>
  ),
}));

vi.mock("../../components/EnterpriseProvider", () => ({
  EnterpriseProvider: ({ children }: any) => (
    <div data-testid="enterprise-provider">{children}</div>
  ),
}));

vi.mock("../../components/FounderWorkspace", () => ({
  FounderWorkspace: () => <div data-testid="founder-workspace" />,
}));

vi.mock("../../components/EnterpriseWorkspace", () => ({
  EnterpriseWorkspace: () => <div data-testid="enterprise-workspace" />,
}));

describe("WorkspaceShell", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (AuthProvider.useAuth as any).mockReturnValue({
      user: { uid: "123", email: "test@test.com", isAnonymous: false },
    });
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: { persona: "solo_founder" },
      loading: false,
    });
  });

  it("renders loading state", () => {
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      loading: true,
    });
    render(<WorkspaceShell logout={mockLogout} />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("runs background migration for legacy users without persona", async () => {
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: {},
      loading: false,
    });
    render(<WorkspaceShell logout={mockLogout} />);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalled();
    });
  });

  it("renders ZeroFrictionEntry if no effective persona", () => {
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: null,
      loading: false,
    });
    render(<WorkspaceShell logout={mockLogout} />);
    expect(screen.getByTestId("zero-friction")).toBeInTheDocument();
  });

  it("locks into ZeroFrictionEntry when intent is selected and unlocks on complete", () => {
    render(<WorkspaceShell logout={mockLogout} />);
    // Initial state: profile has persona solo_founder, so shell renders
    expect(screen.queryByTestId("zero-friction")).not.toBeInTheDocument();

    // To trigger entry flow, we initially need no persona
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: null,
      loading: false,
    });
    const { rerender } = render(<WorkspaceShell logout={mockLogout} />);

    expect(screen.getByTestId("zero-friction")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("intent-btn"));

    // Even if persona comes back, it should stay in entry flow
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: { persona: "solo_founder" },
      loading: false,
    });
    rerender(<WorkspaceShell logout={mockLogout} />);
    expect(screen.getByTestId("zero-friction")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("complete-btn"));
    rerender(<WorkspaceShell logout={mockLogout} />);
    expect(screen.queryByTestId("zero-friction")).not.toBeInTheDocument();
  });

  it("renders FounderWorkspace for solo_founder persona", () => {
    render(<WorkspaceShell logout={mockLogout} />);
    expect(screen.getByTestId("founder-workspace")).toBeInTheDocument();
    expect(screen.getByText("Founder Workspace")).toBeInTheDocument();
    expect(screen.getByText("Are you an Enterprise PM?")).toBeInTheDocument();
  });

  it("renders EnterpriseWorkspace for enterprise_pm persona", () => {
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: { persona: "enterprise_pm" },
      loading: false,
    });
    render(<WorkspaceShell logout={mockLogout} />);
    expect(screen.getByTestId("enterprise-workspace")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Command Center")).toBeInTheDocument();
    expect(screen.getByText("Are you a Solo Founder?")).toBeInTheDocument();
  });

  it("switches workspace from solo_founder to enterprise_pm", async () => {
    render(<WorkspaceShell logout={mockLogout} />);
    const switchBtn = screen.getByText("Switch Workspace");
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalledWith(
        {},
        { persona: "enterprise_pm" },
        { merge: true },
      );
    });
  });

  it("switches workspace from enterprise_pm to solo_founder", async () => {
    (useUserProfileHook.useUserProfile as any).mockReturnValue({
      profile: { persona: "enterprise_pm" },
      loading: false,
    });
    render(<WorkspaceShell logout={mockLogout} />);
    const switchBtn = screen.getByText("Switch Workspace");
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalledWith(
        {},
        { persona: "solo_founder" },
        { merge: true },
      );
    });
  });

  it("renders superadmin impersonation select", () => {
    (AuthProvider.useAuth as any).mockReturnValue({
      user: { uid: "123", email: "mo.hassaniv@gmail.com" },
    });
    render(<WorkspaceShell logout={mockLogout} />);

    expect(screen.getByText("Impersonate:")).toBeInTheDocument();
    const select = screen.getByRole("combobox");

    fireEvent.change(select, { target: { value: "enterprise_pm" } });
    expect(screen.getByTestId("enterprise-workspace")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "solo_founder" } });
    expect(screen.getByTestId("founder-workspace")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "" } });
    expect(screen.getByTestId("founder-workspace")).toBeInTheDocument(); // Falls back to user profile (solo_founder)
  });

  it("calls logout when sign out is clicked", () => {
    render(<WorkspaceShell logout={mockLogout} />);
    const signOutBtn = screen.getByText("Sign Out");
    fireEvent.click(signOutBtn);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("renders correctly without user email", () => {
    (AuthProvider.useAuth as any).mockReturnValue({ user: { uid: "123" } });
    render(<WorkspaceShell logout={mockLogout} />);
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });
});
