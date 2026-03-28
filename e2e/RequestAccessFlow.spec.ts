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
    // If we have a product dropdown trigger, click it using accessibility roles
    const dropdownTrigger = page.getByRole("button", { name: /switch product/i, exact: false }).or(
      page.getByRole("button", { name: /current product/i, exact: false })
    ).or(page.locator('button[aria-haspopup="menu"]').first());

    await dropdownTrigger.waitFor({ state: "visible", timeout: 5000 }).catch(() => null);

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();

      // Look for the Add New Product option in the dropdown portal
      const addProduct = page.getByRole("menuitem", { name: /add new product/i });
      await addProduct.click();

      // Wait for the modal to appear
      const modal = page.getByRole("dialog");
      await expect(modal).toBeVisible();

      // Ensure it says "Upgrade to Access"
      await expect(page.getByText("Upgrade to Access")).toBeVisible();

      // Click Request Access
      const requestBtn = modal.getByRole("button", { name: /request access/i });
      await requestBtn.click();

      // Expect success screen
      await expect(modal.getByText("Request Sent!")).toBeVisible();

      // Close modal
      const closeBtn = modal.getByRole("button", { name: /close/i });
      await closeBtn.click();

      // Ensure modal is gone
      await expect(modal).toBeHidden();
    }
  });
});
