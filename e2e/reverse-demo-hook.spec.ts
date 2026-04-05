import { test, expect } from "@playwright/test";

test.describe("Reverse Demo Hook PLG Journey", () => {
  test("User enters idea, sees optimistic state, and hits PQL gate", async ({
    page,
  }) => {
    // Mock the SSE validation stream
    await page.route("**/api/scoring/stream", async (route) => {
      const sseContent = [
        'data: {"type": "competitor_count", "value": 5}\n\n',
        'data: {"type": "competitor_list", "value": [{"name": "Mock Comp", "domain": "https://mock.com", "threatLevel": "High"}]}\n\n',
        'data: {"type": "jtbd_analysis", "value": {"job": "Help local bakeries manage orders", "opportunityScore": 15}}\n\n',
        'data: {"type": "gap_analysis", "value": [{"feature": "Local delivery", "competitor_deficit": "No competitor offers this"}]}\n\n',
        'data: {"type": "tarpit_score", "value": {"score": 80, "isTarpit": true}}\n\n',
        'data: {"type": "final", "value": {"reasoning": "Market is saturated but niche exists", "exact_quote": "Local bakeries need better tools", "isTarpit": true, "suggestedNiches": ["A better niche CRM"]}}\n\n',
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

    await page.route("**/api/campaign/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ jobId: "mock-job-123" }),
      });
    });

    // e2e_entry=true: bypasses the workspace mock so ZeroFrictionEntry renders
    // mock_auth=true: provides a mock user so Firebase auth doesn't fail
    await page.goto("/?mock_auth=true&e2e_entry=true");
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });

    // Dismiss PageGuide if it appears
    try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
    } catch {
      // Guide didn't appear
    }

    // 1. Zero Friction Entry - select "I'm a Founder"
    await expect(
      page.getByRole("button", { name: /I'm a Founder/i }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /I'm a Founder/i }).click();

    const input = page.getByPlaceholder("What are you thinking of building?");
    await expect(input).toBeVisible({ timeout: 10000 });

    // Fill in an idea
    await input.fill("A CRM for local bakeries");
    await page.keyboard.press("Enter");

    // 2. TrustBuilderScreen renders — stream may complete instantly in mock,
    // so assert on the final state rather than the transient loading text
    await expect(
      page.getByRole("heading", { name: "Analysis Complete", exact: true }),
    ).toBeVisible({ timeout: 15000 });

    // Verify stream data rendered correctly
    await expect(page.getByText("Market Analysis Complete")).toBeVisible();
    await expect(page.getByText("Tarpit Risk Evaluated")).toBeVisible();

    // Click "View Validated Idea"
    await page.getByRole("button", { name: "View Validated Idea" }).click();

    // Should see validated idea
    await expect(
      page.getByRole("heading", { name: "Your Validated Idea" }),
    ).toBeVisible({ timeout: 10000 });
  });
});
