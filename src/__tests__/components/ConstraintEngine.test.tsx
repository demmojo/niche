import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ConstraintEngine } from "../../components/ConstraintEngine";

describe("ConstraintEngine", () => {
  it("renders the Mad-Libs style sentence", () => {
    render(<ConstraintEngine />);
    expect(screen.getByText(/I want to build a/)).toBeInTheDocument();
    expect(screen.getByText(/for/)).toBeInTheDocument();
    expect(screen.getByText(/that helps them/)).toBeInTheDocument();
  });

  it("allows selecting capsules and submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ConstraintEngine onSubmit={onSubmit} />);

    // Check initial placeholders or empty states
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBe(3); // Product type, Audience, Value Prop

    await user.type(inputs[0], "CRM");
    await user.type(inputs[1], "dentists");
    await user.type(inputs[2], "book appointments faster");

    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      productType: "CRM",
      audience: "dentists",
      valueProp: "book appointments faster",
    });
  });
});
