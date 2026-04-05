import { test, expect } from "@playwright/test";

test.describe("URL Onboarding Reverse Demo", () => {
  test("should allow anonymous user to enter URL and see teaser results", async ({
    page,
  }) => {
    // Navigate to landing page where ZeroFrictionEntry is
    await page.goto("/?mock_auth=true");

    // Click the URL intent
    await page.getByText("Extract and pivot from a URL").click();

    // Fill in the URL
    await page
      .getByPlaceholder("Paste a website URL (e.g. https://...)")
      .fill("https://example.com");

    // Mock the SSE response BEFORE submitting
    await page.route("/api/scoring/url-teaser", async (route) => {
      const encoder = new TextEncoder();
      const sseContent = [
        'data: {"type": "status", "value": "Fetching page..."}\n\n',
        'data: {"type": "metadata", "value": {"title": "Mock Title"}}\n\n',
        'data: {"type": "teaser", "value": {"jtbd": {"job_statement": "Mock Job"}, "orthogonal_pivots": ["Pivot A", "Pivot B"]}}\n\n',
      ].join("");

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: sseContent,
      });
    });

    // Press Enter to submit
    await page.keyboard.press("Enter");

    // Assert Explainable UI states
    await expect(page.getByText("Analyzing URL")).toBeVisible();

    // Wait for the Teaser content to appear
    await expect(page.getByText('"Mock Job"')).toBeVisible();
    await expect(page.getByText("Pivot A")).toBeVisible();
    await expect(page.getByText("Pivot B")).toBeVisible();

    // Verify PQL Gate CTA is present
    await expect(
      page.getByRole("button", { name: "Sign Up to Generate Full Strategy" }),
    ).toBeVisible();
  });
});
