import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ZeroFrictionEntry } from "../ZeroFrictionEntry";
import { WorkspaceProvider } from "../WorkspaceProvider";

vi.mock("../firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

describe("PLG Builder Paradigm Journey", () => {
  it("renders the Mad-Libs UI when founder intent is selected", async () => {
    render(
      <WorkspaceProvider>
        <ZeroFrictionEntry onComplete={vi.fn()} />
      </WorkspaceProvider>,
    );

    // Select "I'm a Founder"
    const founderButton = screen.getByText("I'm a Founder");
    fireEvent.click(founderButton);

    // Should render Mad-Libs UI
    await waitFor(() => {
      expect(screen.getByText(/I want to build a/i)).toBeInTheDocument();
    });

    // Check for the inputs
    const categoryInput = screen.getByPlaceholderText("Category (e.g. CRM)");
    const audienceInput = screen.getByPlaceholderText(
      "Audience (e.g. Plumbers)",
    );
    const problemInput = screen.getByPlaceholderText(
      "Problem (e.g. scheduling)",
    );

    expect(categoryInput).toBeInTheDocument();
    expect(audienceInput).toBeInTheDocument();
    expect(problemInput).toBeInTheDocument();
  });
});
