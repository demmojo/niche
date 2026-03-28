import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LensChatFeed } from "../../../components/lens/LensChatFeed";
import { LensChatMessage } from "../../../types";

describe("LensChatFeed", () => {
  it("renders an initialization message when there are no messages and not typing", () => {
    render(
      <LensChatFeed
        messages={[]}
        isTyping={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Initializing Lens Strategy Console..."),
    ).toBeInTheDocument();
  });

  it("renders messages correctly", () => {
    const messages: LensChatMessage[] = [
      { id: "1", role: "user", text: "Hello Lens" },
      { id: "2", role: "lens", text: "Hello User" },
    ];

    render(
      <LensChatFeed
        messages={messages}
        isTyping={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Hello Lens")).toBeInTheDocument();
    expect(screen.getByText("Hello User")).toBeInTheDocument();
  });

  it("renders suggestions within lens messages", () => {
    const messages: LensChatMessage[] = [
      {
        id: "1",
        role: "lens",
        text: "Here is a suggestion",
        suggestions: [
          {
            id: "s1",
            type: "feature",
            title: "Auto-Save",
            description: "Save things automatically",
            rationale: "Prevents data loss",
            confidence: "High",
          },
        ],
      },
    ];

    render(
      <LensChatFeed
        messages={messages}
        isTyping={false}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Here is a suggestion")).toBeInTheDocument();
    expect(screen.getByText("Auto-Save")).toBeInTheDocument();
    expect(screen.getByText("Save things automatically")).toBeInTheDocument();
  });

  it("renders the typing indicator when isTyping is true", () => {
    const { container } = render(
      <LensChatFeed
        messages={[]}
        isTyping={true}
        onApprove={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    // The typing indicator has elements with "animate-bounce"
    const typingDots = container.querySelectorAll(".animate-bounce");
    expect(typingDots.length).toBeGreaterThan(0);
  });
});
