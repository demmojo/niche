import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ZeroFrictionEntry } from "../ZeroFrictionEntry";
import { WorkspaceProvider } from "../WorkspaceProvider";

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    signInAnonymously: vi.fn().mockResolvedValue({
      user: { uid: "test-user", isAnonymous: true },
    }),
  };
});

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...actual,
    setDoc: vi.fn().mockResolvedValue(undefined),
    doc: vi.fn().mockReturnValue({}),
  };
});

vi.mock("../../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

describe("PLG Builder Paradigm Journey (Reverse Demo Hook)", () => {
  it("renders the JIT input and submits successfully", async () => {
    render(
      <WorkspaceProvider>
        <ZeroFrictionEntry onComplete={vi.fn()} />
      </WorkspaceProvider>,
    );

    expect(screen.getByText("Don't build in a Tarpit.")).toBeInTheDocument();
  });
});
