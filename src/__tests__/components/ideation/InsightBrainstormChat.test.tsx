// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InsightBrainstormChat } from "../../../components/InsightBrainstormChat";

vi.mock("../../../utils/aiClient", () => ({
  withModelFallback: vi.fn(),
}));

import { withModelFallback } from "../../../utils/aiClient";

vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    EditorContent: ({ editor }: any) => (
      <textarea
        data-testid="tiptap-editor"
        onChange={(e) => {
          if (editor && editor.options.onUpdate) {
            editor.getText = () => e.target.value;
            editor.options.onUpdate({ editor });
          }
        }}
      />
    ),
    useEditor: (options: any) => ({
      getText: () => "test message",
      getJSON: () => ({}),
      commands: { clearContent: vi.fn() },
      options,
    }),
  };
});

describe("InsightBrainstormChat Component", () => {
  const mockCompetitors = [
    { id: "c1", name: "Comp 1", coreFeatures: [], freeTier: false },
  ];
  const mockInsights = [
    { id: "i1", title: "Insight 1", category: "opportunity" },
  ];
  const mockRawData = [{ id: "r1", excerpt: "Data 1", type: "news", tags: [] }];
  const onSaveInsightMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (withModelFallback as any).mockResolvedValue(
      (async function* () {
        yield { text: "AI Response" };
      })(),
    );
  });

  it("renders correctly with initial message", () => {
    render(
      <InsightBrainstormChat
        competitors={mockCompetitors}
        insights={mockInsights}
        rawData={mockRawData}
        onSaveInsight={onSaveInsightMock}
      />,
    );
    expect(
      screen.getAllByText(/Insight Brainstorming Engine/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /What area of the market would you like to explore today?/i,
      ),
    ).toBeInTheDocument();
  });

  it("sends message and displays AI response", async () => {
    const user = userEvent.setup();
    render(
      <InsightBrainstormChat
        competitors={mockCompetitors}
        insights={mockInsights}
        rawData={mockRawData}
        onSaveInsight={onSaveInsightMock}
      />,
    );

    const input = screen.getByTestId("tiptap-editor");
    await user.type(input, "test message");

    const sendButtons = screen.getAllByRole("button");
    const sendButton = sendButtons[sendButtons.length - 1]; // The send button is the last one
    await user.click(sendButton);

    expect(screen.getByText("test message")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("AI Response")).toBeInTheDocument();
    });
  });

  it("handles AI function calls successfully", async () => {
    const user = userEvent.setup();

    // Mock a function call response
    (withModelFallback as any).mockResolvedValue(
      (async function* () {
        yield {
          functionCalls: [
            {
              name: "save_insight",
              args: {
                title: "Test Insight",
                description: "Desc",
                category: "opportunity",
                impact: "high",
              },
            },
          ],
        };
      })(),
    );

    render(
      <InsightBrainstormChat
        competitors={mockCompetitors}
        insights={mockInsights}
        rawData={mockRawData}
        onSaveInsight={onSaveInsightMock}
      />,
    );

    const input = screen.getByTestId("tiptap-editor");
    await user.type(input, "save this");

    const sendButtons = screen.getAllByRole("button");
    const sendButton = sendButtons[sendButtons.length - 1]; // The send button is the last one
    await user.click(sendButton);

    await waitFor(() => {
      expect(onSaveInsightMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Insight",
          impact: "high",
        }),
      );
    });
  });

  it("handles AI errors gracefully", async () => {
    const user = userEvent.setup();
    (withModelFallback as any).mockRejectedValue(new Error("API Error"));

    render(
      <InsightBrainstormChat
        competitors={mockCompetitors}
        insights={mockInsights}
        rawData={mockRawData}
        onSaveInsight={onSaveInsightMock}
      />,
    );

    const input = screen.getByTestId("tiptap-editor");
    await user.type(input, "test message");

    const sendButtons = screen.getAllByRole("button");
    const sendButton = sendButtons[sendButtons.length - 1]; // The send button is the last one
    await user.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /I'm having trouble connecting to the brainstorming engine/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
