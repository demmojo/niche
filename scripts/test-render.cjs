const { chromium } = require('playwright');
const path = require('path');

async function testRender() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: path.join(__dirname, 'test-videos'), size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Log all console messages
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  
  console.log("Navigating...");
  await page.goto('http://localhost:3000/?mock_auth=true');
  
  console.log("Waiting 5 seconds...");
  await page.waitForTimeout(5000);
  
  // Inject fake cursor
  await page.evaluate(() => {
    const cursor = document.createElement('div');
    cursor.id = 'playwright-cursor';
    cursor.style.width = '24px';
    cursor.style.height = '24px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(255, 60, 60, 0.5)';
    cursor.style.border = '2px solid white';
    cursor.style.boxShadow = '0 0 5px rgba(0,0,0,0.3)';
    cursor.style.position = 'fixed';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '999999';
    cursor.style.transition = 'top 0.3s ease-out, left 0.3s ease-out, transform 0.1s';
    cursor.style.transform = 'translate(-50%, -50%)';
    cursor.style.top = '50%';
    cursor.style.left = '50%';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    document.addEventListener('mousedown', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(0.7)';
      cursor.style.backgroundColor = 'rgba(255, 60, 60, 0.8)';
    });

    document.addEventListener('mouseup', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.backgroundColor = 'rgba(255, 60, 60, 0.5)';
    });
  });

  const humanClick = async (locator) => {
    const box = await locator.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      // Start mouse move
      await page.mouse.move(x, y, { steps: 15 });
      await page.waitForTimeout(300); // pause before click
      await page.mouse.down();
      await page.waitForTimeout(150);
      await page.mouse.up();
    } else {
      await locator.click();
    }
  };

  console.log("Clicking raw data...");
  const rawDataBtn = page.locator('button:has-text("Raw Data")').first();
  if (await rawDataBtn.isVisible()) {
    await humanClick(rawDataBtn);
  }
  
  await page.waitForTimeout(2000);
  
  console.log("Done.");
  await context.close();
  await browser.close();
}

testRender().catch(console.error);