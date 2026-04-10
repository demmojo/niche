import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test-utils/render";
import { MyReports } from "../../components/superadmin/MyReports";
import { useAuth } from "../../components/AuthProvider";
import { useAuthDialogDispatch } from "../../components/AuthDialogProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";

vi.mock("../../components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../components/AuthDialogProvider", () => ({
  useAuthDialogDispatch: vi.fn(),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

describe("MyReports Component", () => {
  const mockOpenModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthDialogDispatch).mockReturnValue({
      openModal: mockOpenModal,
    } as any);
  });

  it("prompts the user to sign in if not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);

    render(<MyReports />);

    expect(
      screen.getByText("Please sign in to view your reports."),
    ).toBeInTheDocument();

    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    signInBtn.click();
    expect(mockOpenModal).toHaveBeenCalled();
  });

  it("prompts the user to sign in if anonymous", () => {
    vi.mocked(useAuth).mockReturnValue({ user: { isAnonymous: true } } as any);

    render(<MyReports />);

    expect(
      screen.getByText("Please sign in to view your reports."),
    ).toBeInTheDocument();
  });

  it("shows empty state when authenticated user has no reports", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-123", email: "test@test.com", isAnonymous: false },
    } as any);

    (vi.mocked(onSnapshot) as any).mockImplementation(
      (q: any, callback: any) => {
        callback({ docs: [] } as any);
        return vi.fn();
      },
    );

    render(<MyReports />);

    expect(screen.getByText("My Niche Reports")).toBeInTheDocument();
    expect(
      screen.getByText("No approved reports found for your account."),
    ).toBeInTheDocument();
  });

  it("displays reports for authenticated user", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-123", email: "test@test.com", isAnonymous: false },
    } as any);

    (vi.mocked(onSnapshot) as any).mockImplementation(
      (q: any, callback: any) => {
        callback({
          docs: [
            {
              id: "report-1",
              data: () => ({
                userEmail: "test@test.com",
                draft_markdown: "## Test Report\nThis is a mock report.",
                status: "approved",
              }),
            },
          ],
        } as any);
        return vi.fn(); // unsubscribe mock
      },
    );

    render(<MyReports />);

    expect(screen.getByText("My Niche Reports")).toBeInTheDocument();
    await waitFor(() => {
      // react-markdown will render ## Test Report as an h2 element
      expect(screen.getByText("Test Report")).toBeInTheDocument();
      expect(screen.getByText("This is a mock report.")).toBeInTheDocument();
    });
  });
});
