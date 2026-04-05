import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { StrategyCanvas } from "../../components/StrategyCanvas";

describe("StrategyCanvas", () => {
  it("renders children without lock overlay when isLocked is false", () => {
    render(
      <StrategyCanvas isLocked={false}>
        <div data-testid="child-content">My Strategy Data</div>
      </StrategyCanvas>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.queryByTestId("lock-overlay")).not.toBeInTheDocument();

    const contentContainer = screen.getByTestId("canvas-content");
    expect(contentContainer.className).not.toMatch(/blur/);
    expect(contentContainer.className).not.toMatch(/grayscale/);
  });

  it("renders lock overlay and blurs content when isLocked is true", async () => {
    const onUnlockClick = vi.fn();

    render(
      <StrategyCanvas isLocked={true} onUnlockClick={onUnlockClick}>
        <div data-testid="child-content">My Strategy Data</div>
      </StrategyCanvas>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByTestId("lock-overlay")).toBeInTheDocument();
    expect(screen.getByText("Strategy Locked")).toBeInTheDocument();

    const contentContainer = screen.getByTestId("canvas-content");
    expect(contentContainer.className).toMatch(/blur-\[4px\]/);
    expect(contentContainer.className).toMatch(/grayscale-\[50%\]/);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Unlock Canvas" }));

    expect(onUnlockClick).toHaveBeenCalledTimes(1);
  });

  it("handles missing onUnlockClick prop safely", async () => {
    render(
      <StrategyCanvas isLocked={true}>
        <div>Data</div>
      </StrategyCanvas>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Unlock Canvas" }));
    expect(true).toBe(true);
  });
});
