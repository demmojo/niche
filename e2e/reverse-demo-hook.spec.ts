import { test, expect } from "@playwright/test";

test.describe("Reverse Demo Hook PLG Journey (JIT Flywheel)", () => {
  test("User enters idea, sees JIT Market Gravity, and proceeds", async ({
    page,
  }) => {
    // Mock the SSE validation stream
    await page.route("**/api/niche/validate-jit", async (route) => {
      const sseContent = [
        'data: {"message":"Searching market..."}\n\n',
        'event: chunk\ndata: {"text":"{\\"idea\\":\\"AI legal app\\",\\"competitors\\":[\\"tarpit1.com\\",\\"tarpit2.com\\"]}"}\n\n',
        'event: complete\ndata: {"competitors":[{"domain":"tarpit1.com","is_hyper_velocity_tarpit":true}]}\n\n',
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

    await page.route("**/api/campaign/start", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ jobId: "mock-job-123" }),
      });
    });

    // e2e_entry=true: bypasses the workspace mock so ZeroFrictionEntry renders
    // mock_auth=true: provides a mock user so Firebase auth doesn't fail
    await page.goto("/?mock_auth=true&e2e_entry=true");
    await page.locator("#root").waitFor({ state: "visible", timeout: 15000 });

    // 1. Zero Friction Entry - single input
    const input = page.getByPlaceholder(
      "e.g. AI for contract review, or notion.so",
    );
    await expect(input).toBeVisible({ timeout: 10000 });

    // Fill in an idea
    await input.fill("AI legal app");
    await page.getByRole("button", { name: /Analyze Market Gravity/i }).click();

    // 2. JIT Stream processing
    await expect(page.getByText("Market Gravity Detected")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("tarpit1.com")).toBeVisible();
    await expect(page.getByText("TARPIT")).toBeVisible();

    // Click "Refine & Protect This Idea"
    await page
      .getByRole("button", { name: /Refine & Protect This Idea/i })
      .click();

    // Should proceed to Workspace
    await expect(page.getByText("My Active Products")).toBeVisible({
      timeout: 10000,
    });
  });
});
