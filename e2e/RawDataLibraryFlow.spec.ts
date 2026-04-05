import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

test.describe("Raw Data Library and Upload Flow", () => {
  const wid = "test-workspace-" + Date.now();
  let tempFilePath: string;

  test.beforeAll(() => {
    tempFilePath = path.join(os.tmpdir(), "nicheai-test-data.txt");
    fs.writeFileSync(
      tempFilePath,
      "Mock content for testing the file upload in e2e.",
    );
  });

  test.beforeEach(async ({ page }) => {
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

    // Intercept LLM calls — format must match UploadDataModal's expected schema
    await page.route("**/api/llm/generate", async (route) => {
      console.log("MOCK LLM INTERCEPTED");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          text: JSON.stringify({
            newSources: [
              {
                type: "text",
                sourceUrl: "file://nicheai-test-data.txt",
                excerpt: "Mock content for testing the file upload in e2e.",
                tags: ["testing"],
                confidenceLevel: "High Confidence",
              },
            ],
            newInsights: [
              {
                title: "Mock Insight",
                description: "A mock insight from analyzed data.",
                category: "opportunity",
                impact: "high",
              },
            ],
          }),
        }),
      });
    });

    // Also mock image hash check endpoint
    await page.route("**/api/images/check", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isDuplicate: false }),
      });
    });

    await page.goto(
      `http://localhost:3000/?w=${wid}&mock_auth=true&persona=solo_founder&demo_data=true`,
    );
    await page.locator("#root").waitFor({ state: "visible", timeout: 15000 });

    try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
    } catch {
      // Guide didn't appear
    }
  });

  test.afterAll(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test("user can upload data, view in library, and see details", async ({
    page,
  }) => {
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. Navigate to Raw Data Library
    await page.getByRole("button", { name: "Dashboard" }).first().click();
    await page
      .getByRole("button", { name: "Raw Data Library" })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Raw Data Library" }),
    ).toBeVisible();

    // 2. Open 'Import Raw Data' modal
    const importButton = page.getByText("Upload Data").first();
    await importButton.click();

    await expect(
      page.getByRole("heading", { name: "Import Raw Data" }),
    ).toBeVisible({ timeout: 15000 });

    // 3. Upload a file
    await page
      .locator("input[type='file']")
      .waitFor({ state: "attached", timeout: 5000 });
    await page.locator("input[type='file']").setInputFiles(tempFilePath);

    // Verify file is staged correctly
    await expect(page.getByText("nicheai-test-data.txt")).toBeVisible();

    // 4. Trigger Analysis
    await page.getByRole("button", { name: "Analyze Data" }).click();

    // Wait for the modal to close (analysis complete + onDataAnalyzed called)
    await expect(
      page.getByRole("heading", { name: "Import Raw Data" }),
    ).not.toBeVisible({ timeout: 20000 });

    // 5. Find the uploaded source in the grid (by sourceUrl from our mock)
    const card = page.getByText("file://nicheai-test-data.txt").first();
    await card.waitFor({ state: "visible", timeout: 10000 });
    await card.click();

    // Verify Source Page opens
    await expect(
      page.getByRole("heading", { name: "Raw Data Source" }),
    ).toBeVisible();
    await expect(page.getByText("Back to Library")).toBeVisible();

    // 6. Close the detail view
    await page.getByText("Back to Library").click();
    await expect(
      page.getByRole("heading", { name: "Raw Data Source" }),
    ).toBeHidden();
  });
});
