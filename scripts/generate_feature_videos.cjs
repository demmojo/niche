const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../public/videos');

async function run() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  
  // Mock authentication for the page to bypass Firebase
  const mockAuth = async (p) => {
    await p.route('https://identitytoolkit.googleapis.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          localId: 'mock-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          idToken: 'mock-id-token',
          registered: true,
          refreshToken: 'mock-refresh-token',
          expiresIn: '3600'
        })
      });
    });
  };

  // Feature 1: Automated Market Intelligence (News Article Search)
  console.log('Recording Automated Market Intelligence...');
  const context1 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page1 = await context1.newPage();
  await mockAuth(page1);
  
  try {
    // Navigate with mock auth and unique workspace ID
    const wid = 'test-workspace-' + Date.now();
    await page1.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page1.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // IMPORTANT: Let react components fully mount before recording starts
    await page1.waitForTimeout(4000);
    
    // Navigate to Raw Data / Background Tasks tab
    const rawDataBtn = page1.locator('button:has-text("Raw Data")').first();
    if (await rawDataBtn.isVisible()) {
      await rawDataBtn.click();
      await page1.waitForTimeout(2000);
      
      const bgTasksBtn = page1.locator('button:has-text("Background Tasks")').first();
      if (await bgTasksBtn.isVisible()) {
          await bgTasksBtn.click();
          await page1.waitForTimeout(1000);
      }
      
      const runDiscovery = page1.locator('button:has-text("Run Discovery")').first();
      if (await runDiscovery.isVisible()) {
        await runDiscovery.click();
        await page1.waitForTimeout(3000); // Watch it spin
      }
    } else {
      await page1.waitForTimeout(3000); // fallback wait
    }
  } catch (e) { console.error('Error in Feature 1:', e.message); }
  
  const videoPath1 = await page1.video().path();
  await context1.close();
  fs.renameSync(videoPath1, path.join(VIDEOS_DIR, 'automated-market-intelligence.webm'));


  // Feature 2: Visual Intelligence (Mindmap Explorer & Market Value Notebook)
  console.log('Recording Visual Intelligence...');
  const context2 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page2 = await context2.newPage();
  await mockAuth(page2);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page2.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page2.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // IMPORTANT: Let react components fully mount before recording starts
    await page2.waitForTimeout(4000);
    
    const marketAnalysisBtn = page2.locator('button:has-text("Market Analysis")').first();
    if (await marketAnalysisBtn.isVisible()) {
      await marketAnalysisBtn.click();
      await page2.waitForTimeout(3000); // Watch the mindmap / notebook render
      // simulate scroll or interaction
      await page2.mouse.wheel(0, 500);
      await page2.waitForTimeout(2000);
    } else {
      await page2.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 2:', e.message); }
  
  const videoPath2 = await page2.video().path();
  await context2.close();
  fs.renameSync(videoPath2, path.join(VIDEOS_DIR, 'visual-intelligence.webm'));


  // Feature 3: Actionable Outputs (Documentation Wizard)
  console.log('Recording Documentation Wizard...');
  const context3 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page3 = await context3.newPage();
  await mockAuth(page3);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page3.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page3.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // IMPORTANT: Let react components fully mount before recording starts
    await page3.waitForTimeout(4000);
    
    const myProductBtn = page3.locator('button:has-text("My Product")').first();
    if (await myProductBtn.isVisible()) {
      await myProductBtn.click();
      await page3.waitForTimeout(2000);
      
      const genBtn = page3.locator('button:has-text("Generate")').first(); // Match 'Generate OpenSpec' or 'Generate Docs'
      if (await genBtn.isVisible()) {
        await genBtn.click();
        await page3.waitForTimeout(2000);
      }
    } else {
      await page3.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 3:', e.message); }
  
  const videoPath3 = await page3.video().path();
  await context3.close();
  fs.renameSync(videoPath3, path.join(VIDEOS_DIR, 'documentation-wizard.webm'));


  // Feature 4: Human-in-the-loop Trust (Data Sync Review)
  console.log('Recording Data Sync Review...');
  const context4 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page4 = await context4.newPage();
  await mockAuth(page4);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page4.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page4.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // IMPORTANT: Let react components fully mount before recording starts
    await page4.waitForTimeout(4000);
    
    const syncBtn = page4.locator('button:has-text("Sync Pending Review")').first();
    if (await syncBtn.isVisible()) {
      await syncBtn.click();
      await page4.waitForTimeout(2000); // Show modal diffs
    } else {
      await page4.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 4:', e.message); }
  
  const videoPath4 = await page4.video().path();
  await context4.close();
  fs.renameSync(videoPath4, path.join(VIDEOS_DIR, 'data-sync-review.webm'));


  // Feature 5: Flexible AI Power (BYOK, Model Fallback & Quotas)
  console.log('Recording AI Quotas & Keys...');
  const context5 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } }
  });
  const page5 = await context5.newPage();
  await mockAuth(page5);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page5.goto(`http://localhost:3000/?w=${wid}&mock_auth=true`);
    await page5.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // IMPORTANT: Let react components fully mount before recording starts
    await page5.waitForTimeout(4000);
    
    const settingsBtn = page5.locator('button:has-text("Settings")').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page5.waitForTimeout(2000);
      
      const apiKeysBtn = page5.locator('text="API Keys"').first();
      if (await apiKeysBtn.isVisible()) {
        await apiKeysBtn.click();
        await page5.waitForTimeout(1000);
      }
      await page5.mouse.wheel(0, 300);
      await page5.waitForTimeout(2000);
    } else {
      await page5.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 5:', e.message); }
  
  const videoPath5 = await page5.video().path();
  await context5.close();
  fs.renameSync(videoPath5, path.join(VIDEOS_DIR, 'flexible-ai-power.webm'));

  await browser.close();
  console.log('All feature videos recorded successfully to public/videos/');
}

run().catch(console.error);