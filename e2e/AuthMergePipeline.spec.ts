import { test, expect } from "@playwright/test";

test.describe("Auth Merge Pipeline", () => {
  test("User requests save, gets claim ticket, and executes merge", async ({
    page,
  }) => {
    // 1. Mock the AI Generation stream
    await page.route("**/api/llm/generateStream", async (route) => {
      const sseContent = [
        'data: {"type":"start","messageId":"msg-1"}\n\n',
        'data: {"type":"text-start","id":"text-1"}\n\n',
        'data: {"type":"text-delta","id":"text-1","delta":"First bullet point. "}\n\n',
        'data: {"type":"text-end","id":"text-1"}\n\n',
        'data: {"type":"finish"}\n\n',
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

    // 2. Mock the Claim Ticket generation
    await page.route("**/api/auth/generate-merge-grant", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ claimTicket: "mock-claim-ticket-123" }),
      });
    });

    // 3. Mock the Backend Merge execution
    await page.route("**/api/auth/execute-merge", async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      expect(body.claimTicket).toBe("mock-claim-ticket-123");
      expect(body.anonUid).toBe("anon-test-123");

      // Simulate delay to show "Saving data..." state
      setTimeout(async () => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success" }),
        });
      }, 500);
    });

    // Navigate to RoastMyNiche as an anonymous user
    await page.goto("/roast-my-niche?mock_auth=true&role=anon");
    await page.locator("#root").waitFor({ state: "visible", timeout: 15000 });

    // Generate a report first so the streamData exists
    const input = page.getByPlaceholder(/Describe your product idea/i);
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill("AI agent for gardening");
    await page.getByRole("button", { name: /Roast My Idea/i }).click();

    // Wait for stream data
    await expect(page.getByText(/First bullet point/i)).toBeVisible({
      timeout: 10000,
    });

    // The Value Preservation Banner should appear
    const saveBtn = page.getByRole("button", { name: /Save Workspace/i });
    await expect(saveBtn).toBeVisible();

    // Click the save button to trigger the pipeline
    await saveBtn.click();

    // Validate the Explainable Loader UI states
    // First: "Securing workspace..."
    await expect(page.getByText(/Securing workspace\.\.\./i)).toBeVisible();

    // Then: "Saving data..." (Because we mocked out the popup flow directly to executeMerge)
    await expect(page.getByText(/Saving data\.\.\./i)).toBeVisible();

    // Finally: "Workspace saved successfully!"
    await expect(page.getByText(/Workspace saved successfully!/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("Error Recovery handles failed backend merge and provides Retry Sync", async ({
    page,
  }) => {
    // Navigate with mocked anonymous user
    await page.goto("/roast-my-niche?mock_auth=true&role=anon");

    // Mock AI Generation stream
    await page.route("**/api/llm/generateStream", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body: 'data: {"type":"finish","content":"Hello"}\n\n',
      });
    });

    await page.route("**/api/auth/generate-merge-grant", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ claimTicket: "mock-claim-ticket-error" }),
      });
    });

    let mergeAttempts = 0;
    await page.route("**/api/auth/execute-merge", async (route) => {
      mergeAttempts++;
      if (mergeAttempts === 1) {
        // First attempt fails
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Simulated network drop" }),
        });
      } else {
        // Second attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "success" }),
        });
      }
    });

    // Generate a report
    const input = page.getByPlaceholder(/Describe your product idea/i);
    await input.fill("Error testing app");
    await page.getByRole("button", { name: /Roast My Idea/i }).click();

    // Wait for stream data
    await expect(page.getByText(/Hello/i)).toBeVisible();

    // Click Save Workspace
    await page.getByRole("button", { name: /Save Workspace/i }).click();

    // Wait for the Error state
    await expect(page.getByText(/Failed to sync workspace data/i)).toBeVisible({
      timeout: 5000,
    });

    // The Retry Sync button should be visible
    const retryBtn = page.getByRole("button", { name: /Retry Sync/i });
    await expect(retryBtn).toBeVisible();

    // Inject sessionStorage claim ticket for the retry since our bypass doesn't set it perfectly yet.
    // Actually, `useSecureMerge.ts` doesn't strictly set it to sessionStorage before bypass, but it falls back to `auth.currentUser?.uid`! Wait! It needs the claim ticket.
    await page.evaluate(() => {
      sessionStorage.setItem(
        "nicheai_merge_claim_ticket",
        "mock-claim-ticket-error",
      );
    });

    // Click Retry Sync
    await retryBtn.click();

    // Wait for the Success state
    await expect(page.getByText(/Workspace saved successfully!/i)).toBeVisible({
      timeout: 5000,
    });
  });
});
