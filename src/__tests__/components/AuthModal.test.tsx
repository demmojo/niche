import React, { createContext, useContext, useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import the actual component we will be testing/modifying
import { AuthModal } from "../../components/AuthModal";
import { auth } from "../../firebase";
import * as firebaseAuth from "firebase/auth";

vi.mock("../../firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    signInWithPopup: vi.fn(),
    linkWithPopup: vi.fn(),
    signInWithCredential: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    linkWithCredential: vi.fn(),
    GoogleAuthProvider: class {},
    OAuthProvider: {
      credentialFromError: vi.fn().mockReturnValue({
        providerId: "google.com",
        signInMethod: "google.com",
      }),
    },
    EmailAuthProvider: {
      credential: vi.fn(),
    },
  };
});

// A mock provider to simulate the future AuthDialogProvider for our test component
const MockAuthDialogContext = createContext<{ openModal: () => void }>({
  openModal: () => {},
});

const useAuthDialog = () => useContext(MockAuthDialogContext);

const MockAuthDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MockAuthDialogContext.Provider
      value={{ openModal: () => setIsOpen(true) }}
    >
      {children}
      <AuthModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </MockAuthDialogContext.Provider>
  );
};

const TestConsumer = () => {
  const { openModal } = useAuthDialog();
  return <button onClick={openModal}>Trigger Modal</button>;
};

const renderWithProvider = () => {
  return render(
    <MockAuthDialogProvider>
      <TestConsumer />
    </MockAuthDialogProvider>,
  );
};

describe("AuthModal intent-based behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles successful Google auth (linkWithPopup) for anonymous users without showing Merge vs Discard", async () => {
    const user = userEvent.setup();
    const mockReload = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(auth, "currentUser", {
      value: { isAnonymous: true, reload: mockReload },
      writable: true,
    });

    // We expect linkWithPopup to be called, not signInWithPopup
    vi.mocked(firebaseAuth.linkWithPopup).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.linkWithPopup).toHaveBeenCalled();
      expect(mockReload).toHaveBeenCalled();
    });

    // Should NOT show the merge prompt, modal should just close
    expect(
      screen.queryByText(/Merge into my account/i),
    ).not.toBeInTheDocument();

    // Modal should be closed (meaning Google button is gone)
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Sign in with Google/i }),
      ).not.toBeInTheDocument();
    });
  });

  it("gracefully handles auth/popup-closed-by-user during linkWithPopup", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/popup-closed-by-user",
      message: "popup closed",
    });

    // In current code, it rejects signInWithPopup, but we will mock linkWithPopup.
    // The current code will actually call signInWithPopup, which will return undefined,
    // so this test might fail because it doesn't see the rejection or linkWithPopup isn't called.
    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      // Loading should stop
      expect(screen.queryByText(/Authenticating/i)).not.toBeInTheDocument();
      // But no error should be shown
      expect(screen.queryByText(/popup closed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      // And the modal should remain open
      expect(
        screen.getByRole("button", { name: /Sign in with Google/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows Merge vs Discard prompt ONLY when auth/credential-already-in-use is thrown", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    // Simulate dirty state so the prompt appears
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (key: string) => {
        if (key === "nicheai_workspace_id") return "ws-123";
        if (key.includes("active_product_id")) return "dirty-product";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Merge into my account/i)).toBeInTheDocument();
      expect(screen.getByText(/Discard unsaved work/i)).toBeInTheDocument();
    });
  });

  it("does not show Merge vs Discard prompt on other errors, but shows the error", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/internal-error",
      message: "Some random error",
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Some random error/i)).toBeInTheDocument();
      expect(
        screen.queryByText(/Merge into my account/i),
      ).not.toBeInTheDocument();
    });
  });

  it("handles successful Google auth for non-anonymous users", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    });
  });

  it("handles email login success for non-anonymous users", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@test.com",
        "password",
      );
    });
  });

  it("handles unexpected error format during Google login", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValueOnce(
      "Not an object error",
    );

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/An unexpected error occurred/i),
      ).toBeInTheDocument();
    });
  });

  it("handles unexpected error format during Email login", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(
      "Not an object error",
    );

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(
        screen.getByText(/An unexpected error occurred/i),
      ).toBeInTheDocument();
    });
  });

  it("bails out if unmounted during Email login", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    let resolvePromise: any;
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }) as any,
    );

    const { unmount } = renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    unmount();

    resolvePromise({ user: { uid: "test-uid" } });

    await new Promise((r) => setTimeout(r, 0));
  });

  it("handles email link with email-already-in-use and clean state", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Mock linkWithCredential to throw email-already-in-use
    vi.mocked(firebaseAuth.linkWithCredential).mockRejectedValueOnce({
      code: "auth/email-already-in-use",
      message: "Email in use",
    });

    // Clean state so it just signs in directly
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(0);
    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        "test@test.com",
        "password",
      );
      // Since it's clean, modal should close, error should not be there
      expect(screen.queryByText(/Email in use/i)).not.toBeInTheDocument();
    });
  });

  it("handles email link with random error", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithCredential).mockRejectedValueOnce({
      code: "auth/internal-error",
      message: "Random internal error",
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText(/Random internal error/i)).toBeInTheDocument();
    });
  });

  it("bails out if unmounted during Google login", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    let resolvePromise: any;
    vi.mocked(firebaseAuth.signInWithPopup).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }) as any,
    );

    const { unmount } = renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    unmount(); // Unmount the component while the promise is pending

    // Now resolve the promise
    resolvePromise({ user: { uid: "test-uid" } });

    // Since it's unmounted, no state updates should occur, and we shouldn't see errors
    await new Promise((r) => setTimeout(r, 0));
  });

  it("handles merge choice properly by merging credentials and closing modal", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Make it show the conflict view first
    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (key: string) => {
        if (key === "nicheai_workspace_id") return "ws-123";
        if (key.includes("active_product_id")) return "dirty-product";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Merge into my account/i)).toBeInTheDocument();
    });

    vi.mocked(firebaseAuth.signInWithCredential).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    await user.click(
      screen.getByRole("button", { name: /Merge into my account/i }),
    );

    await waitFor(() => {
      expect(firebaseAuth.signInWithCredential).toHaveBeenCalled();
      expect(
        screen.queryByText(/Merge into my account/i),
      ).not.toBeInTheDocument();
    });
  });

  it("handles discard choice properly by signing in directly and closing modal", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    // Make it show the conflict view first
    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (key: string) => {
        if (key === "nicheai_workspace_id") return "ws-123";
        if (key.includes("active_product_id")) return "dirty-product";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Discard unsaved work/i)).toBeInTheDocument();
    });

    vi.mocked(firebaseAuth.signInWithCredential).mockResolvedValueOnce({
      user: { uid: "test-uid" },
    } as any);

    await user.click(
      screen.getByRole("button", { name: /Discard unsaved work/i }),
    );

    await waitFor(() => {
      expect(firebaseAuth.signInWithCredential).toHaveBeenCalled();
      expect(
        screen.queryByText(/Discard unsaved work/i),
      ).not.toBeInTheDocument();
    });
  });

  it("does not show Merge vs Discard if workspace_id is missing", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockReturnValue(null); // wid is null

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithCredential).toHaveBeenCalled();
    });
  });

  it("does not show Merge vs Discard if workspace_id exists but no keys match", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (k: string) => {
        if (k === "nicheai_workspace_id") return "ws-123";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(1);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(firebaseAuth.signInWithCredential).toHaveBeenCalled();
    });
  });

  it("handles merge choice with error", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (k: string) => {
        if (k === "nicheai_workspace_id") return "ws-123";
        if (k.includes("active_product_id")) return "dirty";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Merge into my account/i)).toBeInTheDocument();
    });

    vi.mocked(firebaseAuth.signInWithCredential).mockRejectedValueOnce({
      message: "Merge failed",
    } as any);
    await user.click(
      screen.getByRole("button", { name: /Merge into my account/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Merge failed/i)).toBeInTheDocument();
    });
  });

  it("handles discard choice with error", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithPopup).mockRejectedValueOnce({
      code: "auth/credential-already-in-use",
      message: "Credential already in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (k: string) => {
        if (k === "nicheai_workspace_id") return "ws-123";
        if (k.includes("active_product_id")) return "dirty";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));
    const googleBtn = screen.getByRole("button", {
      name: /Sign in with Google/i,
    });
    await user.click(googleBtn);

    await waitFor(() => {
      expect(screen.getByText(/Discard unsaved work/i)).toBeInTheDocument();
    });

    vi.mocked(firebaseAuth.signInWithCredential).mockRejectedValueOnce({
      message: "Discard failed",
    } as any);
    await user.click(
      screen.getByRole("button", { name: /Discard unsaved work/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Discard failed/i)).toBeInTheDocument();
    });
  });

  it("handles email link with email-already-in-use and dirty state", async () => {
    const user = userEvent.setup();
    Object.defineProperty(auth, "currentUser", {
      value: {
        isAnonymous: true,
        reload: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    vi.mocked(firebaseAuth.linkWithCredential).mockRejectedValueOnce({
      code: "auth/email-already-in-use",
      message: "Email in use",
    });

    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      (k: string) => {
        if (k === "nicheai_workspace_id") return "ws-123";
        if (k.includes("active_product_id")) return "dirty";
        return null;
      },
    );
    vi.spyOn(window.localStorage.__proto__, "length", "get").mockReturnValue(2);
    vi.spyOn(window.localStorage.__proto__, "key").mockImplementation((i) => {
      if (i === 0) return "nicheai_workspace_id";
      if (i === 1) return "ws-123_active_product_id";
      return null;
    });

    renderWithProvider();
    await user.click(screen.getByRole("button", { name: /Trigger Modal/i }));

    await user.type(screen.getByPlaceholderText("Email"), "test@test.com");
    await user.type(screen.getByPlaceholderText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText(/Merge into my account/i)).toBeInTheDocument();
    });
  });
});
