import { test, expect } from "@playwright/test";

test.describe("Superadmin Pipeline (PQL Delivery)", () => {
  test("User must authenticate to view their approved reports", async ({
    page,
  }) => {
    // 1. Visit my-reports as anonymous user
    await page.goto("/my-reports");

    // 2. Should redirect or prompt for login
    // In our app, unauthenticated users see the ZeroFrictionEntry or AuthModal.
    // For this test, we check if the auth modal or login text is visible.
    // Wait for the AuthDialogProvider or ZeroFrictionEntry to show
    await expect(
      page.getByText(/Log In|Welcome to NicheAI|Sign in/i).first(),
    ).toBeVisible();

    // 3. Login as the founder
    // Simulate login via URL param for our mock auth (e.g. ?mock_auth=true&role=user)
    await page.goto("/my-reports?mock_auth=true&role=user");

    // We should see the user's dashboard (if they have reports)
    // Wait, the user dashboard component is not built yet! Let's assert it exists.
    await expect(page.getByText(/My Niche Reports/i)).toBeVisible();
  });
});
