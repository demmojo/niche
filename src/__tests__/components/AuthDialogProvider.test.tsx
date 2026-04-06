import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AuthDialogProvider,
  useAuthDialogState,
  useAuthDialogDispatch,
} from "../../components/AuthDialogProvider";

const TestStateConsumer = () => {
  useAuthDialogState();
  return <div />;
};

const TestDispatchConsumer = () => {
  useAuthDialogDispatch();
  return <div />;
};

const ProviderConsumer = () => {
  const { isOpen } = useAuthDialogState();
  const { openModal, closeModal } = useAuthDialogDispatch();
  return (
    <div>
      <span data-testid="state">{isOpen ? "open" : "closed"}</span>
      <button onClick={openModal}>Open</button>
      <button onClick={closeModal}>Close</button>
    </div>
  );
};

describe("AuthDialogProvider hooks", () => {
  it("throws error when useAuthDialogState is used outside of AuthDialogProvider", () => {
    // Suppress console.error for expected react error boundary
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<TestStateConsumer />)).toThrow(
      "useAuthDialogState must be used within an AuthDialogProvider",
    );
    console.error = originalError;
  });

  it("throws error when useAuthDialogDispatch is used outside of AuthDialogProvider", () => {
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<TestDispatchConsumer />)).toThrow(
      "useAuthDialogDispatch must be used within an AuthDialogProvider",
    );
    console.error = originalError;
  });

  it("provides state and dispatch correctly", async () => {
    const user = userEvent.setup();
    render(
      <AuthDialogProvider>
        <ProviderConsumer />
      </AuthDialogProvider>,
    );

    expect(screen.getByTestId("state")).toHaveTextContent("closed");

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });
});
