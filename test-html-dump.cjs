const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const wid = "test-workspace-" + Date.now();
  
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

  await page.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&persona=solo_founder&demo_data=true`);
  await page.waitForSelector("#root", { state: "visible", timeout: 15000 });
  
  try {
      const getStarted = page.getByRole("button", { name: "Get Started" });
      await getStarted.waitFor({ state: "visible", timeout: 3000 });
      await getStarted.click();
  } catch (e) {}

  await page.getByRole("button", { name: "Raw Data" }).first().click();
  
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page-dump.html', html);
  console.log("HTML dumped to page-dump.html");
  
  await browser.close();
})();
