import { Page } from "@playwright/test";

export async function seedAuth(page: Page) {
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
}

export async function seedCompetitors(page: Page, competitors: any[]) {
  await page.route("**/api/apollo/search", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        organizations: competitors,
      }),
    });
  });

  await page.route("**/api/apollo/enrich", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        organization: competitors[0], // simplified mock
      }),
    });
  });

  await page.route("**/api/apollo/news", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            title: "Mock News Title",
            url: "https://news.com/article",
            text: "Mock news snippet about market trends",
          },
        ],
      }),
    });
  });
}

export async function seedInsights(page: Page, insights: any[]) {
  await page.route(
    "https://generativelanguage.googleapis.com/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Mock market summary",
                      insights,
                      metrics: {
                        topIntegrations: "Mock",
                        estimatedMarketValue: "10B",
                      },
                    }),
                  },
                ],
              },
            },
          ],
        }),
      });
    },
  );
}
