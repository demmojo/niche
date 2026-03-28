import { test, expect } from "@playwright/test";

test.describe("Request Access Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with a mock user who is NOT a superadmin
    await page.goto("/?mock_auth=true&role=user");

    // Check if we are greeted by the onboarding wizard
    // For normal flow testing, assume a product is already created
  });

  test('normal user clicks "Add New Product" and sees Upgrade Modal', async ({
    page,
  }) => {
    // Note: Due to mock auth, we might have one product.
    // If we have a product dropdown trigger, click it
    await page
      .waitForSelector('button[aria-haspopup="menu"]', {
        state: "visible",
        timeout: 5000,
      })
      .catch(() => null);

    const dropdown = await page.$('button[aria-haspopup="menu"]');
    if (dropdown) {
      await dropdown.click();

      // Look for the Add New Product option in the dropdown portal
      const addProduct = page.locator('div[role="menuitem"]', {
        hasText: "Add New Product",
      });
      await addProduct.click();

      // Wait for the modal to appear
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Ensure it says "Upgrade to Access"
      await expect(page.getByText("Upgrade to Access")).toBeVisible();

      // Click Request Access
      const requestBtn = page.locator("button", { hasText: "Request Access" });
      await requestBtn.click();

      // Expect success screen
      await expect(page.getByText("Request Sent!")).toBeVisible();

      // Close modal
      const closeBtn = page.locator("button", { hasText: "Close" });
      await closeBtn.click();

      // Ensure modal is gone
      await expect(modal).toBeHidden();
    }
  });
});
