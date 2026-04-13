// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AsymmetricalShell } from "../../../components/layout/AsymmetricalShell";

describe("AsymmetricalShell", () => {
  it("renders main children content correctly", () => {
    render(
      <AsymmetricalShell>
        <div>Main Content Test</div>
      </AsymmetricalShell>,
    );
    expect(screen.getByText("Main Content Test")).toBeDefined();
  });

  it("renders sidebar content when provided", () => {
    render(
      <AsymmetricalShell sidebarContent={<div>Sidebar Content Test</div>}>
        <div>Main Content Test</div>
      </AsymmetricalShell>,
    );
    expect(screen.getByText("Sidebar Content Test")).toBeDefined();
  });

  it("renders header content when provided", () => {
    render(
      <AsymmetricalShell headerContent={<div>Header Content Test</div>}>
        <div>Main Content Test</div>
      </AsymmetricalShell>,
    );
    expect(screen.getByText("Header Content Test")).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(
      <AsymmetricalShell className="custom-test-class">
        <div>Main Content Test</div>
      </AsymmetricalShell>,
    );
    expect(container.firstChild).toHaveProperty("className");
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-test-class",
    );
  });
});
