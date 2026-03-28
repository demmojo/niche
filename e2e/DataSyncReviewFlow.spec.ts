import { test, expect } from "@playwright/test";

test.describe("Data Sync Review Flow", () => {
  const wid = "test-workspace-" + Date.now();

  test.beforeEach(async ({ page }) => {
    // Attempt to bypass firebase auth calls entirely
    await page.route(
      "https://identitytoolkit.googleapis.com/**",
      async (route) => {
        // Mock successful auth response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            localId: "mock-user-123",
            email: "test@example.com",
            displayName: "Test User",
            idToken: "mock-id-token",
            registered: true,
            refreshToken: "mock-refresh-token",
            expiresIn: "3600",
          }),
        });
      },
    );

    // Mock Apollo Search API to return a dummy competitor domain
    await page.route("**/api/apollo/search", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          organizations: [
            { name: "Mock Competitor Inc", website_url: "mockcompetitor.com" },
          ],
        }),
      });
    });

    // Mock Apollo Enrich API
    await page.route("**/api/apollo/enrich", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          organization: {
            name: "Mock Competitor Inc",
            annual_revenue_printed: "10M",
            latest_funding_stage: "Series A",
            keywords: ["ai", "automation"],
            current_technologies: [{ name: "React" }, { name: "Node.js" }],
          },
        }),
      });
    });

    // Mock Exa News API
    await page.route("**/api/apollo/news", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              title: "Mock News Title",
              url: "https://news.com/article",
              text: "Mock news snippet about market trends",
            },
          ],
        }),
      });
    });

    // Mock Gemini API
    // This is trickier since we send different prompts, but we can return a generic response
    // that won't crash the JSON parser if it expects JSON, or generic text otherwise.
    await page.route(
      "https://generativelanguage.googleapis.com/**",
      async (route) => {
        const postData = route.request().postData() || "";
        // If it looks like a JSON request, we return JSON. The synthesis step requires specific structure.
        // But we can just return a generic valid JSON that covers all bases.
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: '{"summary": "Mock market summary", "insights": [{"title": "Mock Insight", "description": "Market trend identified", "category": "opportunity", "impact": "high"}], "metrics": {"topIntegrations": "Mock", "estimatedMarketValue": "10B"}}',
                    },
                  ],
                },
              },
            ],
          }),
        });
      },
    );

    await page.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });
  });

  test("user can trigger global sync and review changes", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

    // Ensure dashboard is active
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    // Navigate to Settings to set API key
    await page.getByRole("button", { name: "Settings" }).first().click();
    await page.getByLabel("Gemini API Key").fill("mock-key");
    await page.getByRole("button", { name: "Save Keys" }).click();

    // Navigate to Background Tasks & Sync tab
    await page
      .getByRole("button", { name: "Background Tasks & Sync" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Background Tasks & Sync" }),
    ).toBeVisible();

    // 1. Click "Run Data Pipeline" button
    const pipelineButton = page.getByRole("button", {
      name: "Run Data Pipeline",
    });
    await expect(pipelineButton).toBeVisible();
    await pipelineButton.click();

    // 2. Wait for the "Running Pipeline..." to finish
    // Instead of waiting for text, we can wait for the "Review Changes" button to appear
    const reviewChangesButton = page.getByRole("button", {
      name: "Review Changes",
    });

    // Pipeline can take some time, increase timeout
    await expect(reviewChangesButton).toBeVisible({ timeout: 15000 });

    // 3. Click "Review Changes"
    await reviewChangesButton.click();

    // 4. Verify the SyncReviewModal is open
    await expect(
      page.getByRole("heading", { name: "Review Sync Changes" }),
    ).toBeVisible();

    // 5. See some proposed changes (e.g. from the mock response)
    // We should see "Mock Insight" in the diffs
    await expect(page.getByText("Mock Insight").first()).toBeVisible();

    // 6. Commit changes
    const commitButton = page.getByRole("button", {
      name: /Commit \d+ Changes/,
    });
    await commitButton.click();

    // 7. The modal should close and the "Review Changes" button should disappear
    await expect(
      page.getByRole("heading", { name: "Review Sync Changes" }),
    ).not.toBeVisible();
    await expect(reviewChangesButton).not.toBeVisible();
  });
});
