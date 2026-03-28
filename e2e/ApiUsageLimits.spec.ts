import { test, expect } from "@playwright/test";

test.describe("API Usage Limits and Settings Flow", () => {
  const wid = "test-workspace-" + Date.now();

  test.beforeEach(async ({ page }) => {
    // Attempt to bypass firebase auth calls entirely
    await page.route(
      "https://identitytoolkit.googleapis.com/**",
      async (route) => {
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

    // Wait for the app container to load
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });
  });

  test("user can navigate to settings, view usage limits, and update API keys", async ({
    page,
  }) => {
    // Navigate to Settings
    await page.getByRole("button", { name: "Settings" }).first().click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Verify Real-time Quota Dashboard section exists
    await expect(
      page.getByRole("heading", { name: "Real-time Quota Dashboard" }),
    ).toBeVisible();

    // Verify API Keys (BYOK) section exists
    await expect(
      page.getByRole("heading", { name: "API Keys (BYOK)" }),
    ).toBeVisible();

    // Input a custom Gemini API Key
    const geminiInput = page.getByLabel("Gemini API Key");
    await expect(geminiInput).toBeVisible();
    await geminiInput.fill("custom-gemini-key-123");

    // Save Settings
    await page.getByRole("button", { name: "Save Keys" }).click();

    // Verify success toast/message (Assuming there's some kind of visual feedback, if not, we reload and check)
    // The settings are saved in localStorage via useLocalStorage usually.
    await page.reload();

    // Wait for app load again
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });

    // Navigate back to settings
    await page.getByRole("button", { name: "Settings" }).first().click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Verify the key persists
    await expect(page.getByLabel("Gemini API Key")).toHaveValue(
      "custom-gemini-key-123",
    );
  });
});
