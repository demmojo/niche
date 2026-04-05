import { test, expect } from "@playwright/test";
import { seedAuth, seedCompetitors, seedInsights } from "./utils/db-seed";

test.describe("Data Sync Review Flow", () => {
  const wid = "test-workspace-" + Date.now();

  test.beforeEach(async ({ page }) => {
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

    await page.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&persona=solo_founder`);
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
