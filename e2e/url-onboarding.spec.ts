import { test, expect } from "@playwright/test";

test.describe("URL Onboarding Reverse Demo", () => {
  test("should allow anonymous user to enter URL and see teaser results", async ({
    page,
  }) => {
    // Mock the SSE response for URL teaser
    await page.route("**/api/scoring/url-teaser", async (route) => {
      const sseContent = [
        'data: {"type": "status", "value": "Fetching page..."}\n\n',
        'data: {"type": "metadata", "value": {"title": "Mock Title"}}\n\n',
        'data: {"type": "teaser", "value": {"jtbd": {"job_statement": "Mock Job"}, "orthogonal_pivots": ["Pivot A", "Pivot B"]}}\n\n',
      ].join("");

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: sseContent,
      });
    });

    // e2e_entry=true: bypasses the workspace mock so ZeroFrictionEntry renders
    // mock_auth=true: provides a mock user so Firebase auth doesn't fail
    await page.goto("/?mock_auth=true&e2e_entry=true");
    await page.locator("#root").waitFor({ state: "visible", timeout: 15000 });

    // Dismiss PageGuide if it appears
    try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
    } catch {
      // Guide didn't appear
    }

    // Wait for ZeroFrictionEntry intent buttons
    await expect(page.getByText("Extract and pivot from a URL")).toBeVisible({
      timeout: 10000,
    });

    // Click the URL intent
    await page.getByText("Extract and pivot from a URL").click();

    // Fill in the URL
    const urlInput = page.getByPlaceholder(
      "Paste a website URL (e.g. https://...)",
    );
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    await urlInput.fill("https://example.com");

    // Press Enter to submit
    await page.keyboard.press("Enter");

    // Assert Explainable UI states
    await expect(page.getByText("Analyzing URL")).toBeVisible({
      timeout: 10000,
    });

    // Wait for the Teaser content to appear
    await expect(page.getByText('"Mock Job"')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Pivot A")).toBeVisible();
    await expect(page.getByText("Pivot B")).toBeVisible();

    // Verify PQL Gate CTA is present
    await expect(
      page.getByRole("button", { name: "Sign Up to Generate Full Strategy" }),
    ).toBeVisible();
  });
});
