import { test, expect } from "@playwright/test";

test.describe("Reverse Demo Hook PLG Journey", () => {
  test("User enters idea, sees optimistic state, and hits PQL gate", async ({
    page,
  }) => {
    // Attempt to bypass firebase auth calls entirely for anonymous users
    await page.route(
      "https://identitytoolkit.googleapis.com/**",
      async (route) => {
        const request = route.request();
        if (request.url().includes("signupNewUser")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              localId: "mock-anon-user",
              idToken: "mock-anon-token",
              refreshToken: "mock-anon-refresh-token",
              expiresIn: "3600",
            }),
          });
        } else if (request.url().includes("getAccountInfo")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              users: [
                {
                  localId: "mock-anon-user",
                  providerUserInfo: [],
                  validSince: "12345678",
                },
              ],
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    // Provide mock implementations for backend endpoints used in ZeroFrictionEntry
    await page.route("**/api/scoring/tarpit-analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          isTarpit: true,
          suggestedNiches: ["A better niche CRM"],
        }),
      });
    });

    await page.route("**/api/campaign/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobId: "mock-job-123",
        }),
      });
    });

    await page.goto("/");

    // 1. Zero Friction Entry
    const input = page.getByPlaceholder("What are you thinking of building?");
    // We may need to wait for it to be visible or interactable
    await expect(input).toBeVisible({ timeout: 10000 });

    // Fill in an idea
    await input.fill("A CRM for local bakeries");
    await page.keyboard.press("Enter");

    // 2. Optimistic "Explainable States" UI should appear
    await expect(
      page.getByText("Analyzing market saturation..."),
    ).toBeVisible();

    // 3. Wait for dashboard generation to complete (Reverse Demo)
    // It should automatically transition to MyProduct view since we mocked campaign start
    await expect(
      page.getByRole("heading", { name: /Product Details/i }),
    ).toBeVisible({ timeout: 25000 });

    // 4. Hit a PQL Gate (High-intent action)
    const editButton = page.getByRole("button", { name: "Edit Details" });
    await editButton.click();

    // PQL Modal should pop up
    const pqlModal = page.getByRole("dialog", { name: "Unlock Full Features" });
    await expect(pqlModal).toBeVisible();
    await expect(
      pqlModal.getByText(
        "You're currently in a read-only or anonymous session",
      ),
    ).toBeVisible();

    // Check Google Auth button exists
    const googleBtn = pqlModal.getByRole("button", {
      name: /Continue with Google/i,
    });
    await expect(googleBtn).toBeVisible();
  });
});
