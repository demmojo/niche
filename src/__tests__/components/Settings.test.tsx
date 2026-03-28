import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "../../test-utils/render";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Settings } from "../../../src/components/Settings";
import * as apiKeys from "../../../src/utils/apiKeys";
import * as usageTracker from "../../../src/utils/usageTracker";
import * as aiClient from "../../../src/utils/aiClient";

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

vi.mock("../../../src/components/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

// Mock the utils
vi.mock("../../../src/utils/apiKeys", () => ({
  getCustomApiKey: vi.fn(),
  setCustomApiKey: vi.fn(),
}));

vi.mock("../../../src/utils/usageTracker", () => ({
  getUsageStats: vi.fn(),
  getResetTime: vi.fn(),
}));

vi.mock("../../../src/utils/aiClient", () => ({
  getSelectedModels: vi.fn(),
  setSelectedModels: vi.fn(),
  fetchAvailableModels: vi.fn(),
}));

import { useAuth } from "../../../src/components/AuthProvider";

describe("Settings Component", () => {
  let view: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { email: "user@test.com" },
    });

    (apiKeys.getCustomApiKey as ReturnType<typeof vi.fn>).mockImplementation(
      (service) => {
        if (service === "gemini") return "mock-gemini-key";
        return null;
      },
    );

    (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
      date: "2023-01-01",
      services: {
        gemini: {
          requests: 10,
          requestsPerModel: { "gemini-3.1-pro-preview": 10 },
          estimatedInputTokens: 1000000,
          estimatedOutputTokens: 2000000,
          rateLimit: { limit: 50, remaining: 40 },
        },
        apollo: {
          requests: 5,
          rateLimit: {
            limit: 100,
            remaining: 95,
            resetDate: new Date("2023-01-02T00:00:00Z").toISOString(),
          },
        },
        exa: {
          requests: 2,
          rateLimit: {
            limit: 1000,
            remaining: 998,
            resetDate: new Date("2023-01-02T00:00:00Z").toISOString(),
          },
        },
      },
    });

    const mockResetTime = new Date();
    mockResetTime.setHours(mockResetTime.getHours() + 2);
    (usageTracker.getResetTime as ReturnType<typeof vi.fn>).mockReturnValue(
      mockResetTime,
    );

    (aiClient.getSelectedModels as ReturnType<typeof vi.fn>).mockReturnValue([
      "gemini-3.1-pro-preview",
    ]);
    (
      aiClient.fetchAvailableModels as ReturnType<typeof vi.fn>
    ).mockResolvedValue([
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro Preview",
        provider: "gemini",
      },
      {
        id: "gemini-3.1-flash-preview",
        name: "Gemini 3.1 Flash Preview",
        provider: "gemini",
      },
      { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic" },
    ]);
  });

  afterEach(() => {
    if (view) {
      view.unmount();
      view = null;
    }
    window.history.pushState({}, "Test", "?tab=general");
    vi.useRealTimers();
  });

  describe("Initial Rendering and Data Loading", () => {
    it("returns null if usage stats are not available", async () => {
      (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue(
        null,
      );
      await act(async () => {
        view = render(<Settings />);
      });
      const { container } = view;
      expect(container.firstChild).toBeNull();
    });

    it("renders correctly with usage stats", async () => {
      await act(async () => {
        view = render(<Settings />);
      });
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("API Keys (BYOK)")).toBeInTheDocument();

      // Check for Costs
      // Input tokens: 1000000 / 1000000 * 1.25 = 1.25
      // Output tokens: 2000000 / 1000000 * 5.00 = 10.00
      // Total: 11.25
      expect(screen.getByText("$11.2500")).toBeInTheDocument();
      expect(screen.getByText("In: $1.2500")).toBeInTheDocument();
      expect(screen.getByText("Out: $10.0000")).toBeInTheDocument();

      // Should show the reset date for Exa
      expect(screen.getAllByText(/Resets:/).length).toBeGreaterThan(0);
    });

    it("fetches available models on mount", async () => {
      await act(async () => {
        view = render(<Settings />);
      });
      expect(aiClient.fetchAvailableModels).toHaveBeenCalledTimes(1);
    });

    it("polls usage stats every 5 seconds", async () => {
      await act(async () => {
        view = render(<Settings />);
      });
      expect(usageTracker.getUsageStats).toHaveBeenCalledTimes(1); // initial

      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(usageTracker.getUsageStats).toHaveBeenCalledTimes(2);
    });

    it("handles countdown timer correctly", async () => {
      // Set reset time exactly 1 hour, 30 mins, 15 seconds from now
      const now = new Date().getTime();
      const resetTime = new Date(
        now + 1 * 60 * 60 * 1000 + 30 * 60 * 1000 + 15 * 1000,
      );
      (usageTracker.getResetTime as ReturnType<typeof vi.fn>).mockReturnValue(
        resetTime,
      );

      await act(async () => {
        view = render(<Settings />);
      });
      expect(screen.getByText("1h 30m 15s")).toBeInTheDocument();
    });

    it('shows "Resetting soon..." when time is up', async () => {
      const now = new Date().getTime();
      const resetTime = new Date(now - 1000); // 1 second ago
      (usageTracker.getResetTime as ReturnType<typeof vi.fn>).mockReturnValue(
        resetTime,
      );

      await act(async () => {
        view = render(<Settings />);
      });
      expect(screen.getByText("Resetting soon...")).toBeInTheDocument();
    });

    it("clears intervals on unmount", async () => {
      const clearIntervalSpy = vi.spyOn(window, "clearInterval");
      await act(async () => {
        view = render(<Settings />);
      });
      const { unmount } = view;

      unmount();

      // Should clear both updateTimer and usageInterval
      expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
      clearIntervalSpy.mockRestore();
    });
  });

  describe("Workspace Link", () => {
    it('copies workspace link to clipboard and shows "Copied!" temporarily', async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      const copyButton = screen.getByRole("button", { name: /Copy Link/i });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        window.location.href,
      );
      expect(screen.getByText("Copied!")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy Link")).toBeInTheDocument();
    });
  });

  describe("Team Tab", () => {
    it("shows upsell modal for normal users", async () => {
      // Default mockUser from AuthProvider might not be superadmin if email is not mo@nicheai.com
      await act(async () => {
        window.history.pushState({}, "Test", "?tab=team");
        view = render(<Settings />);
      });

      expect(screen.getByText("Team Management")).toBeInTheDocument();

      const requestButton = screen.getByRole("button", {
        name: /Request Team Access/i,
      });
      expect(requestButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(requestButton);
      });

      // RequestAccessModal should open, we can check for its contents if it renders inline
      expect(screen.getByText("Upgrade to Access")).toBeInTheDocument();
    });

    it("shows invite member modal for superadmin", async () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { email: "mo@nicheai.com" },
      });

      await act(async () => {
        window.history.pushState({}, "Test", "?tab=team");
        view = render(<Settings />);
      });

      const inviteButton = screen.getByRole("button", {
        name: /Invite Member/i,
      });
      expect(inviteButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(inviteButton);
      });

      expect(screen.getByText("Invite Team Member")).toBeInTheDocument();
    });

    it("opens upsell modal when clicking upgrade button", async () => {
      await act(async () => {
        render(<Settings />);
      });
      const teamTab = screen.getByRole("button", { name: "Team" });
      await act(async () => {
        fireEvent.click(teamTab);
      });

      const upgradeButton = screen.getByRole("button", {
        name: /Request Team Access/i,
      });
      await act(async () => {
        fireEvent.click(upgradeButton);
      });

      expect(screen.getByText("Request Access")).toBeInTheDocument(); // assuming Contact Sales is in the upsell modal
    });
  });

  describe("Model Selection", () => {
    it("renders primary and fallback models and updates them", async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      const dropdowns = screen.getAllByRole("combobox");
      expect(dropdowns).toHaveLength(3);

      await act(async () => {
        fireEvent.change(dropdowns[1], { target: { value: "claude-3-opus" } });
      });

      expect(aiClient.setSelectedModels).toHaveBeenCalledWith([
        "gemini-3.1-pro-preview",
        "claude-3-opus",
      ]);
    });

    it("filters out empty values from the middle of the array", async () => {
      // Start with ['gemini-3.1-pro-preview', 'claude-3-opus', 'gemini-3.1-flash-preview']
      (aiClient.getSelectedModels as ReturnType<typeof vi.fn>).mockReturnValue([
        "gemini-3.1-pro-preview",
        "claude-3-opus",
        "gemini-3.1-flash-preview",
      ]);

      await act(async () => {
        view = render(<Settings />);
      });

      const dropdowns = screen.getAllByRole("combobox");
      expect(dropdowns).toHaveLength(3);

      // Change middle model to empty string
      await act(async () => {
        fireEvent.change(dropdowns[1], { target: { value: "" } });
      });

      // Should compact the array to ['gemini-3.1-pro-preview', 'gemini-3.1-flash-preview']
      expect(aiClient.setSelectedModels).toHaveBeenCalledWith([
        "gemini-3.1-pro-preview",
        "gemini-3.1-flash-preview",
      ]);
    });

    it("ensures primary model defaults to gemini-3.1-flash-preview if cleared", async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      const dropdowns = screen.getAllByRole("combobox");
      expect(dropdowns).toHaveLength(3);

      // Change primary model to empty string
      await act(async () => {
        fireEvent.change(dropdowns[0], { target: { value: "" } });
      });

      // Should set primary model to gemini-3.1-flash-preview
      expect(aiClient.setSelectedModels).toHaveBeenCalledWith([
        "gemini-3.1-flash-preview",
      ]);
    });
  });

  describe("API Keys Management", () => {
    it("loads custom API keys into inputs", async () => {
      (apiKeys.getCustomApiKey as ReturnType<typeof vi.fn>).mockImplementation(
        (service) => {
          const keys: Record<string, string> = {
            gemini: "gemini-key",
            apollo: "apollo-key",
            exa: "exa-key",
            openai: "openai-key",
            anthropic: "anthropic-key",
          };
          return keys[service];
        },
      );

      await act(async () => {
        view = render(<Settings />);
      });

      expect(
        (screen.getByLabelText(/Gemini API Key/i) as HTMLInputElement).value,
      ).toBe("gemini-key");
      expect(
        (screen.getByLabelText(/Apollo API Key/i) as HTMLInputElement).value,
      ).toBe("apollo-key");
      expect(
        (screen.getByLabelText(/Exa API Key/i) as HTMLInputElement).value,
      ).toBe("exa-key");
      expect(
        (screen.getByLabelText(/OpenAI API Key/i) as HTMLInputElement).value,
      ).toBe("openai-key");
      expect(
        (screen.getByLabelText(/Anthropic API Key/i) as HTMLInputElement).value,
      ).toBe("anthropic-key");
    });

    it("allows clearing (deleting) keys and saving", async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      const geminiInput = screen.getByLabelText(
        /Gemini API Key/i,
      ) as HTMLInputElement;

      await act(async () => {
        fireEvent.change(geminiInput, { target: { value: "" } });
      });

      const saveButton = screen.getByRole("button", { name: /Save Keys/i });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith("gemini", "");
    });

    it("saves custom API keys when Save Keys button is clicked and fetches models", async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      const apolloInput = screen.getByLabelText(
        /Apollo API Key/i,
      ) as HTMLInputElement;
      const exaInput = screen.getByLabelText(
        /Exa API Key/i,
      ) as HTMLInputElement;
      const openaiInput = screen.getByLabelText(
        /OpenAI API Key/i,
      ) as HTMLInputElement;
      const anthropicInput = screen.getByLabelText(
        /Anthropic API Key/i,
      ) as HTMLInputElement;

      await act(async () => {
        fireEvent.change(apolloInput, { target: { value: "new-apollo-key" } });
        fireEvent.change(exaInput, { target: { value: "new-exa-key" } });
        fireEvent.change(openaiInput, { target: { value: "new-openai-key" } });
        fireEvent.change(anthropicInput, {
          target: { value: "new-anthropic-key" },
        });
      });

      const saveButton = screen.getByRole("button", { name: /Save Keys/i });

      await act(async () => {
        fireEvent.click(saveButton);
      });

      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith(
        "gemini",
        "mock-gemini-key",
      );
      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith(
        "apollo",
        "new-apollo-key",
      );
      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith(
        "exa",
        "new-exa-key",
      );
      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith(
        "openai",
        "new-openai-key",
      );
      expect(apiKeys.setCustomApiKey).toHaveBeenCalledWith(
        "anthropic",
        "new-anthropic-key",
      );

      // fetchAvailableModels is called initially, and once again on Save Keys
      expect(aiClient.fetchAvailableModels).toHaveBeenCalledTimes(2);
    });

    it("disables save button and shows fetching state while saving", async () => {
      let resolveModels: (val: any) => void;
      (
        aiClient.fetchAvailableModels as ReturnType<typeof vi.fn>
      ).mockReturnValue(
        new Promise((resolve) => {
          resolveModels = resolve;
        }),
      );

      await act(async () => {
        view = render(<Settings />);
      });

      // Initial fetch is pending, so button should be disabled
      const saveButton = screen.getByRole("button", {
        name: /Saving & Fetching Models.../i,
      });
      expect(saveButton).toBeDisabled();

      // Resolve initial fetch
      await act(async () => {
        resolveModels!([]);
      });

      expect(screen.getByRole("button", { name: "Save Keys" })).toBeEnabled();

      // Click save
      (
        aiClient.fetchAvailableModels as ReturnType<typeof vi.fn>
      ).mockReturnValue(
        new Promise((resolve) => {
          resolveModels = resolve;
        }),
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save Keys" }));
      });

      expect(
        screen.getByRole("button", { name: /Saving & Fetching Models.../i }),
      ).toBeDisabled();

      await act(async () => {
        resolveModels!([]);
      });

      expect(screen.getByRole("button", { name: "Save Keys" })).toBeEnabled();
    });

    it("handles fetching models error gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (
        aiClient.fetchAvailableModels as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Fetch failed"));

      await act(async () => {
        view = render(<Settings />);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch models",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Real-time Quota Dashboard & Edge cases", () => {
    it("renders the Real-time Quota Dashboard with correct limits", async () => {
      await act(async () => {
        view = render(<Settings />);
      });

      // Check text reflecting limits and remaining counts
      expect(screen.getByText("10 / 50")).toBeInTheDocument(); // Gemini
      expect(screen.getByText("5 / 100")).toBeInTheDocument(); // Apollo
      expect(screen.getByText("2 / 1000")).toBeInTheDocument(); // Exa
    });

    it("shows correct progress bar colors based on usage percentage", async () => {
      (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
        date: "2023-01-01",
        services: {
          gemini: {
            requests: 46,
            requestsPerModel: { "gemini-3.1-pro-preview": 46 },
            rateLimit: { limit: 50, remaining: 4 }, // 92%
          },
          apollo: {
            requests: 80,
            rateLimit: { limit: 100, remaining: 20 }, // 80%
          },
          exa: {
            requests: 10,
            rateLimit: { limit: 1000, remaining: 990 }, // 1%
          },
        },
      });

      await act(async () => {
        view = render(<Settings />);
      });
      const { container } = view;

      expect(container.querySelector(".bg-red-500")).toBeInTheDocument(); // Gemini
      expect(container.querySelector(".bg-yellow-500")).toBeInTheDocument(); // Apollo
      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument(); // Exa
    });

    it("handles missing rateLimit gracefully, falling back to local tracking", async () => {
      (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
        date: "2023-01-01",
        services: {
          gemini: {
            requests: 10,
            requestsPerModel: { "gemini-3.1-pro-preview": 10 },
          },
          apollo: { requests: 5 },
          exa: { requests: 2 },
        },
      });

      await act(async () => {
        view = render(<Settings />);
      });

      // For Gemini pro model, dailyRequestLimit is 50. remaining = max(0, 50 - 10) = 40
      expect(screen.getByText("10 / 50")).toBeInTheDocument();

      // Apollo default is 100. remaining = max(0, 100 - 5) = 95
      expect(screen.getByText("5 / 100")).toBeInTheDocument();

      // Exa default is 1000. remaining = max(0, 1000 - 2) = 998
      expect(screen.getByText("2 / 1000")).toBeInTheDocument();
    });

    it("handles non-pro model daily limits", async () => {
      (aiClient.getSelectedModels as ReturnType<typeof vi.fn>).mockReturnValue([
        "gemini-3.1-flash-preview",
      ]);
      (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
        date: "2023-01-01",
        services: {
          gemini: {
            requests: 100,
            requestsPerModel: { "gemini-3.1-flash-preview": 100 },
          },
          apollo: { requests: 5 },
          exa: { requests: 2 },
        },
      });

      await act(async () => {
        view = render(<Settings />);
      });

      // Non-pro model default limit is 1500. requests = 100, remaining = 1400. Display: 100 / 1500
      expect(screen.getByText("100 / 1500")).toBeInTheDocument();
    });

    it("handles missing requestsPerModel gracefully", async () => {
      (usageTracker.getUsageStats as ReturnType<typeof vi.fn>).mockReturnValue({
        date: "2023-01-01",
        services: {
          gemini: {
            requests: 10,
            // missing requestsPerModel
            estimatedInputTokens: 0,
            estimatedOutputTokens: 0,
          },
          apollo: { requests: 5 },
          exa: { requests: 2 },
        },
      });

      await act(async () => {
        view = render(<Settings />);
      });

      // primaryModel is gemini-3.1-pro-preview. dailyRequestLimit = 50. requestsForModel = 0
      // remaining = 50 - 0 = 50
      expect(screen.getByText("0 / 50")).toBeInTheDocument();
    });
  });
});
