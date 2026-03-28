import { test, expect } from "@playwright/test";
import * as fs from "fs";

test.describe("Dashboard and Main Navigation Flow", () => {
  // Use a predictable test ID for deterministic runs
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

    // Start with blank page to prevent invalid URL navigations during rapid testing
    await page.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);

    // Wait for the app container to load instead of text
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });
  });

  test("user can navigate through all primary tabs", async ({ page }) => {
    // 1. Dashboard is active by default
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    // 2. Navigate to Competitor Matrix
    await page
      .getByRole("button", { name: "Competitor Matrix" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Competitor Matrix" }),
    ).toBeVisible();

    // 3. Navigate to Raw Data
    await page.getByRole("button", { name: "Raw Data" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Raw Data Library" }),
    ).toBeVisible();

    // 4. Navigate to Insight Library
    await page.getByRole("button", { name: "Insight Library" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Insight Library" }),
    ).toBeVisible();

    // 5. Navigate to Market Analysis
    await page.getByRole("button", { name: "Market Analysis" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Market Analysis" }),
    ).toBeVisible();

    // 6. Navigate to Settings
    await page.getByRole("button", { name: "Settings" }).first().click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("user can interact with page guide", async ({ page }) => {
    // Ensure dashboard is active
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    // Look for the guide button
    const guideButton = page.getByRole("button", { name: "Open Page Guide" });
    await guideButton.click();

    // Guide modal should appear (it's the PageGuideModal)
    await expect(
      page.getByRole("button", { name: "Get Started" }),
    ).toBeVisible();

    // Close guide
    await page.getByRole("button", { name: "Get Started" }).first().click();

    // Modal should be gone
    await expect(
      page.getByRole("button", { name: "Get Started" }),
    ).not.toBeVisible();
  });
});
