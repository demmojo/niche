const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  await page.goto('file://' + path.resolve(__dirname, 'plg-builder.html'));
  
  // Hover over the first highlightable text to show the toolbar
  const highlightable = page.locator('.highlightable').first();
  await highlightable.hover();
  
  // Wait a moment for animations
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: path.resolve(__dirname, 'plg-builder-design.png') });
  await browser.close();
})();
