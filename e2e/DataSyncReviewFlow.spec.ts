import { test, expect } from "@playwright/test";
import { seedAuth, seedCompetitors, seedInsights } from "./utils/db-seed";

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

    // Phase 3: E2E API Seeding via centralized db-seed utils
    await seedAuth(page);

    await seedCompetitors(page, [
      {
        name: "Mock Competitor Inc",
        website_url: "mockcompetitor.com",
        annual_revenue_printed: "10M",
        latest_funding_stage: "Series A",
        keywords: ["ai", "automation"],
        current_technologies: [{ name: "React" }, { name: "Node.js" }],
      },
    ]);

    await seedInsights(page, [
      {
        title: "Mock Insight",
        description: "Market trend identified",
        category: "opportunity",
        impact: "high",
      },
    ]);

    await page.goto(
      `http://localhost:3000/?w=${wid}&mock_auth=true&persona=solo_founder`,
    );
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });

    try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
    } catch {
      // Guide didn't appear
    }
  });

  test("user can trigger global sync and review changes", async ({ page }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

    // Ensure dashboard is active
    await page.getByRole("button", { name: "Dashboard" }).first().click();

    // Navigate to Settings to set API key
    await page.getByRole("button", { name: "Settings" }).first().click();

    // Fill the key
    await page.getByLabel("Gemini API Key").fill("mock-key");

    // Intercept the LLM call to mock the response
    await page.route("**/api/llm/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: JSON.stringify({
            summary: "Mock summary",
            threats: "Mock threats",
            opportunities: "Mock opportunities",
            insights: [{ title: "Mock Insight", category: "opportunity" }],
            metrics: { market_size: "1B", growth_rate: "10%" },
          }),
        }),
      });
    });

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
    await pipelineButton.click({ force: true });

    // 2. Wait for the "Running Pipeline..." to finish
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
