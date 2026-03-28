import React from "react";
import { render, screen, fireEvent, waitFor } from "../../test-utils/render";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SupportHelpPage } from "../../components/SupportHelpPage";
import { collection, addDoc } from "firebase/firestore";

// Mock dependencies
vi.mock("../../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
}));

describe("SupportHelpPage", () => {
  const mockUser = { uid: "123", email: "test@test.com" };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global alert
    vi.stubGlobal("alert", vi.fn());
    // Mock console.error
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders default state correctly", () => {
    render(<SupportHelpPage user={mockUser} />);
    expect(screen.getByText("Support & Feedback")).toBeInTheDocument();
    expect(screen.getByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Feature Request")).toBeInTheDocument();
    expect(screen.getByText("General Feedback")).toBeInTheDocument();
    expect(screen.getByText("Increase Limits")).toBeInTheDocument();
  });

  it("respects the initialType prop", async () => {
    (addDoc as any).mockResolvedValue({});
    render(<SupportHelpPage user={mockUser} initialType="Bug" />);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "This is a bug" } });

    const submitBtn = screen.getByText("Submit Feedback");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    // Check if the addDoc was called with type 'Bug'
    const addDocArgs = vi.mocked(addDoc).mock.calls[0][1];
    expect(addDocArgs).toMatchObject({
      type: "Bug",
      message: "This is a bug",
      userId: mockUser.uid,
      userEmail: mockUser.email,
    });
  });

  it("submits feedback form correctly with default type", async () => {
    (addDoc as any).mockResolvedValue({});

    render(<SupportHelpPage user={mockUser} />);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "This is a test message" } });

    const submitBtn = screen.getByText("Submit Feedback");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    const addDocArgs = vi.mocked(addDoc).mock.calls[0][1];
    expect(addDocArgs).toMatchObject({
      type: "General", // Default type
      message: "This is a test message",
      userId: mockUser.uid,
      userEmail: mockUser.email,
    });

    expect(screen.getByText("Thank You!")).toBeInTheDocument();
  });

  it("does not submit if message is empty or whitespace", () => {
    render(<SupportHelpPage user={mockUser} />);

    const submitBtn = screen.getByText("Submit Feedback");
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "   " } });

    // Form button is disabled, but let's test that clicking doesn't trigger API call
    fireEvent.click(submitBtn);

    // Also test form submit directly to cover e.preventDefault() if triggered natively
    const form = textarea.closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    expect(addDoc).not.toHaveBeenCalled();
  });

  it("allows clicking different feedback type buttons and submits with selected type (Feature)", async () => {
    (addDoc as any).mockResolvedValue({});
    render(<SupportHelpPage user={mockUser} />);

    // Test selecting 'Feature'
    const featureBtn = screen.getByText("Feature Request");
    fireEvent.click(featureBtn);

    // Add message
    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "I want a new feature" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(addDoc).mock.calls[0][1]).toMatchObject({
      type: "Feature",
      message: "I want a new feature",
    });
  });

  it('allows selecting "Bug Report" and submitting', async () => {
    (addDoc as any).mockResolvedValue({});
    render(<SupportHelpPage user={mockUser} />);

    const bugBtn = screen.getByText("Bug Report");
    fireEvent.click(bugBtn);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "Bug found" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(addDoc).mock.calls[0][1]).toMatchObject({
      type: "Bug",
    });
  });

  it('allows selecting "General Feedback" explicitly and submitting', async () => {
    (addDoc as any).mockResolvedValue({});
    render(<SupportHelpPage user={mockUser} initialType="Bug" />); // Start with bug so clicking General does something

    const genBtn = screen.getByText("General Feedback");
    fireEvent.click(genBtn);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "General idea" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(addDoc).mock.calls[0][1]).toMatchObject({
      type: "General",
    });
  });

  it('allows selecting "Increase Limits" and submitting', async () => {
    (addDoc as any).mockResolvedValue({});
    render(<SupportHelpPage user={mockUser} />);

    const limitBtn = screen.getByText("Increase Limits");
    fireEvent.click(limitBtn);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "Need more limits" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(vi.mocked(addDoc).mock.calls[0][1]).toMatchObject({
      type: "Limit Increase Request",
    });
  });

  it("handles submission error gracefully", async () => {
    (addDoc as any).mockRejectedValue(new Error("Firebase error"));

    render(<SupportHelpPage user={mockUser} />);

    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "Test error handling" } });

    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(console.error).toHaveBeenCalledWith(
      "Failed to submit feedback:",
      expect.any(Error),
    );
    expect(window.alert).toHaveBeenCalledWith(
      "Failed to submit feedback. Please try again or check your connection.",
    );

    // Should not show "Thank You!" screen on error
    expect(screen.queryByText("Thank You!")).not.toBeInTheDocument();
  });

  it("allows user to submit another request after a successful submission", async () => {
    (addDoc as any).mockResolvedValue({});

    render(<SupportHelpPage user={mockUser} />);

    // First submission
    const textarea = screen.getByPlaceholderText(/Please describe the issue/i);
    fireEvent.change(textarea, { target: { value: "First message" } });
    fireEvent.click(screen.getByText("Submit Feedback"));

    await waitFor(() => {
      expect(screen.getByText("Thank You!")).toBeInTheDocument();
    });

    // Click "Submit Another Request"
    fireEvent.click(screen.getByText("Submit Another Request"));

    // Verify it returned to the form and cleared the message
    expect(screen.queryByText("Thank You!")).not.toBeInTheDocument();
    expect(screen.getByText("Support & Feedback")).toBeInTheDocument();

    // Textarea should be empty
    const newTextarea = screen.getByPlaceholderText(
      /Please describe the issue/i,
    ) as HTMLTextAreaElement;
    expect(newTextarea.value).toBe("");
  });
});
