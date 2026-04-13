import { render, screen, waitFor } from "../../test-utils/render";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthProvider,
  useAuth,
  useAuthDispatch,
} from "../../components/AuthProvider";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { loginWithGoogle, loginWithEmail, logout } from "../../firebase";

// 1. Mock Firebase module
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInAnonymously: vi.fn().mockResolvedValue({ user: { isAnonymous: true } }),
  signOut: vi.fn(),
  auth: {},
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn(),
  setLogLevel: vi.fn(),
}));

vi.mock("../../firebase", () => ({
  auth: {},
  loginWithGoogle: vi.fn(),
  loginWithEmail: vi.fn(),
  logout: vi.fn(),
}));

// 2. Create a dummy consumer to consume the context hook
/**
 *
 */
const TestConsumer = () => {
  const { user, loading } = useAuth();
  const { login, loginEmail, logout } = useAuthDispatch();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div>{user ? `Logged in as ${user.email}` : "Not logged in"}</div>
      <button onClick={login}>Login Google</button>
      <button onClick={() => loginEmail("test@test.com", "password")}>
        Login Email
      </button>
      <button onClick={logout}>Logout User</button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initially shows loading state", () => {
    // Prevent the callback from firing immediately
    vi.mocked(onAuthStateChanged).mockImplementation(() => vi.fn());

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("updates state when a user is authenticated", async () => {
    // Immediately trigger the callback with a mock user
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)({ email: "test@example.com" } as any);
      return vi.fn(); // Mock the unsubscribe function
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Assert the state changes from loading to authenticated
    await waitFor(() => {
      expect(
        screen.getByText("Logged in as test@example.com"),
      ).toBeInTheDocument();
    });
  });

  it("calls signInAnonymously when no user is authenticated", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)(null as any);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalled();
    });
  });

  it("calls loginWithGoogle when login is triggered", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)({ email: "test@example.com" } as any);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Logged in as test@example.com"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Login Google" }));

    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });

  it("calls loginWithEmail when loginEmail is triggered", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)({ email: "test@example.com" } as any);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Logged in as test@example.com"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Login Email" }));

    expect(loginWithEmail).toHaveBeenCalledWith("test@test.com", "password");
  });

  it("calls logout when logout is triggered", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)({ email: "test@example.com" } as any);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Logged in as test@example.com"),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Logout User" }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
