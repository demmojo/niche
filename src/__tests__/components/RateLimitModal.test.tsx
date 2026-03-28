import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../test-utils/render";
import "@testing-library/jest-dom";
import { RateLimitModal } from "../../components/RateLimitModal";

describe("RateLimitModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <RateLimitModal
        isOpen={false}
        onClose={() => {}}
        onRequestIncrease={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders generic rate limit message when no specific message is provided", () => {
    render(
      <RateLimitModal
        isOpen={true}
        onClose={() => {}}
        onRequestIncrease={() => {}}
      />,
    );
    expect(screen.getByText("API Rate Limit Exceeded")).toBeInTheDocument();
    expect(screen.getByText(/We've hit an API rate limit/)).toBeInTheDocument();
  });

  it("renders custom key rate limit message when message contains RateLimit:CustomKey", () => {
    render(
      <RateLimitModal
        isOpen={true}
        onClose={() => {}}
        onRequestIncrease={() => {}}
        message="RateLimit:CustomKey:Error 429 quota"
      />,
    );
    expect(screen.getByText("Custom Key Rate Limit")).toBeInTheDocument();
    expect(
      screen.getByText(/The API key you provided has reached its quota/),
    ).toBeInTheDocument();
    // Raw error should be displayed
    expect(screen.getByText("Error 429 quota")).toBeInTheDocument();
  });

  it("renders global key rate limit message when message contains RateLimit:GlobalKey", () => {
    render(
      <RateLimitModal
        isOpen={true}
        onClose={() => {}}
        onRequestIncrease={() => {}}
        message="RateLimit:GlobalKey:System exhausted"
      />,
    );
    expect(screen.getByText("System Quota Reached")).toBeInTheDocument();
    expect(
      screen.getByText(
        /NicheAI's shared API quota has been temporarily exhausted/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("System exhausted")).toBeInTheDocument();
  });

  it("calls onClose when Dismiss is clicked", () => {
    const handleClose = vi.fn();
    render(
      <RateLimitModal
        isOpen={true}
        onClose={handleClose}
        onRequestIncrease={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Dismiss"));
    expect(handleClose).toHaveBeenCalled();
  });

  it("calls onClose and onRequestIncrease when Request Higher Limits is clicked", () => {
    const handleClose = vi.fn();
    const handleRequest = vi.fn();
    render(
      <RateLimitModal
        isOpen={true}
        onClose={handleClose}
        onRequestIncrease={handleRequest}
      />,
    );
    fireEvent.click(screen.getByText(/Request Higher Limits/));
    expect(handleClose).toHaveBeenCalled();
    expect(handleRequest).toHaveBeenCalled();
  });
});
