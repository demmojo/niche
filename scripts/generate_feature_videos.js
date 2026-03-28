const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../public/videos');

async function run() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  
  // Feature 1: Automated Market Intelligence (News Article Search)
  console.log('Recording Automated Market Intelligence...');
  const context1 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } }
  });
  const page1 = await context1.newPage();
  
  try {
    // Navigate with mock auth
    await page1.goto('http://localhost:3000/?mock_auth=true');
    await page1.waitForTimeout(2000); // Wait for UI
    
    // Attempt navigation to Raw Data or relevant tab
    const rawDataBtn = page1.locator('button:has-text("Background Tasks")');
    if (await rawDataBtn.isVisible()) {
      await rawDataBtn.click();
      await page1.waitForTimeout(1000);
      
      const runDiscovery = page1.locator('button:has-text("Run Discovery")');
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
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } }
  });
  const page2 = await context2.newPage();
  try {
    await page2.goto('http://localhost:3000/?mock_auth=true');
    await page2.waitForTimeout(2000);
    
    const marketAnalysisBtn = page2.locator('button:has-text("Market Analysis")');
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
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } }
  });
  const page3 = await context3.newPage();
  try {
    await page3.goto('http://localhost:3000/?mock_auth=true');
    await page3.waitForTimeout(2000);
    
    const myProductBtn = page3.locator('button:has-text("My Product")');
    if (await myProductBtn.isVisible()) {
      await myProductBtn.click();
      await page3.waitForTimeout(1000);
      
      const genBtn = page3.locator('button:has-text("Generate")'); // Match 'Generate OpenSpec' or 'Generate Docs'
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
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } }
  });
  const page4 = await context4.newPage();
  try {
    await page4.goto('http://localhost:3000/?mock_auth=true');
    await page4.waitForTimeout(2000);
    
    const syncBtn = page4.locator('button:has-text("Sync Pending Review")');
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
  try {
    await page5.goto('http://localhost:3000/?mock_auth=true');
    await page5.waitForTimeout(2000);
    
    const settingsBtn = page5.locator('button:has-text("Settings")');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page5.waitForTimeout(2000);
      
      const apiKeysBtn = page5.locator('text="API Keys"');
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