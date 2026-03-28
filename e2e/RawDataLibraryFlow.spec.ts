import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

test.describe("Raw Data Library and Upload Flow", () => {
  const wid = "test-workspace-" + Date.now();
  let tempFilePath: string;

  test.beforeAll(() => {
    // Create a deterministic temporary mock file to test the actual file upload dropzone behavior
    tempFilePath = path.join(os.tmpdir(), "nicheai-test-data.txt");
    fs.writeFileSync(
      tempFilePath,
      "Mock content for testing the file upload in e2e.",
    );
  });

  test.afterAll(() => {
    // Clean up temporary files
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

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

    // Navigate with mock_auth parameters bypassing Firebase entirely
    await page.goto(
      `http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`,
    );
    await page.waitForSelector("#root", { state: "visible", timeout: 15000 });

    // Handle any global onboarding guides or popups that might overlay the viewport early in the load cycle
    try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
    } catch {
      // Guide didn't appear (likely dismissed in previous tests or state), safe to continue
    }
  });

  test("user can upload data, view in library, and see details", async ({
    page,
  }) => {
    // Catch console logs to diagnose test failures quickly in CI environments
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. Navigate to Raw Data Library
    await page.getByRole("button", { name: "Raw Data" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Raw Data Library" }),
    ).toBeVisible();

    // Verify Grid view is loaded
    await expect(page.locator(".grid.grid-cols-1 > div").first()).toBeVisible({
      timeout: 15000,
    });

    // 2. Open 'Import Raw Data' modal
    const importButton = page
      .getByRole("button", { name: /import|upload/i })
      .first();
    await importButton.waitFor({ state: "visible" });
    await importButton.click({ force: true });

    // Verify the Upload modal has correctly animated into view
    await expect(
      page.getByRole("heading", { name: "Import Raw Data" }),
    ).toBeVisible({ timeout: 15000 });

    // 3. Select and Upload a file into the dropzone
    await page.locator("input[type='file']").setInputFiles(tempFilePath);

    // Verify file is staged correctly in the UI
    await expect(page.getByText("nicheai-test-data.txt")).toBeVisible();

    // 4. Trigger Analysis
    await page.getByRole("button", { name: "Analyze Data" }).click();

    // Wait for the AI analysis process to conclude and the modal to automatically close
    await expect(
      page.getByRole("heading", { name: "Import Raw Data" }),
    ).not.toBeVisible({ timeout: 15000 });

    // 5. Interact with RawDataDetailModal via the Library Grid
    const firstCard = page.locator(".grid.grid-cols-1 > div").first();
    await firstCard.waitFor({ state: "visible" });
    await firstCard.click();

    // Verify Source Page opens
    await expect(
      page.getByRole("heading", { name: "Raw Data Source" }),
    ).toBeVisible();
    await expect(page.getByText("Back to Library")).toBeVisible();

    // 6. Close the detail view by clicking Back to Library
    await page.getByText("Back to Library").click();
    await expect(
      page.getByRole("heading", { name: "Raw Data Source" }),
    ).not.toBeVisible();
  });
});
