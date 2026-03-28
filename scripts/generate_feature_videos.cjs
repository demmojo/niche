const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIDEOS_DIR = path.join(__dirname, '../public/videos');

async function run() {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  
  const dismissModals = async (p) => {
    try {
      const getStarted = p.locator('button:has-text("Get Started")').first();
      if (await getStarted.isVisible({ timeout: 1000 })) {
        await getStarted.click();
      }
      const gotIt = p.locator('button:has-text("Got it")').first();
      if (await gotIt.isVisible({ timeout: 1000 })) {
        await gotIt.click();
      }
    } catch(e) {}
  };
  const injectCursor = async (page) => {
    await page.evaluate(() => {
      const cursor = document.createElement('div');
      cursor.id = 'playwright-cursor';
      cursor.style.width = '22px';
      cursor.style.height = '28px';
      // Use an SVG data URI for a macOS-like pointer
      cursor.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'22\' height=\'28\' viewBox=\'0 0 22 28\'%3E%3Cpath fill=\'%23000000\' stroke=\'%23FFFFFF\' stroke-width=\'1.5\' d=\'M2 2l18 10-7.8 2.2L16 24l-3.5 2-3.8-9.8L2 22V2z\'/%3E%3C/svg%3E")';
      cursor.style.backgroundSize = 'contain';
      cursor.style.backgroundRepeat = 'no-repeat';
      cursor.style.position = 'fixed';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transition = 'transform 0.1s ease-out';
      // Center the tip of the arrow (top-left) at the mouse coordinates
      cursor.style.transformOrigin = 'top left';
      cursor.style.top = '50%';
      cursor.style.left = '50%';
      // Add a subtle drop shadow
      cursor.style.filter = 'drop-shadow(1px 2px 2px rgba(0,0,0,0.4))';
      document.body.appendChild(cursor);

      document.addEventListener('mousemove', e => {
        // Adjust for the tip of the arrow
        cursor.style.left = (e.clientX - 2) + 'px';
        cursor.style.top = (e.clientY - 2) + 'px';
      });

      document.addEventListener('mousedown', () => {
        // Slight scale down to indicate click
        cursor.style.transform = 'scale(0.85)';
      });

      document.addEventListener('mouseup', () => {
        // Restore scale
        cursor.style.transform = 'scale(1)';
      });
    });
  };

  const humanClick = async (page, locator) => {
    const box = await locator.boundingBox();
    if (box) {
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      // Random pause to simulate reading (500ms to 1500ms)
      const pause = Math.floor(Math.random() * 1000) + 500;
      await page.waitForTimeout(pause);
      
      // Slower, deliberate move (20-30 steps)
      const steps = Math.floor(Math.random() * 10) + 20;
      await page.mouse.move(x, y, { steps });
      
      // Small pause right before the click
      await page.waitForTimeout(300);
      
      await page.mouse.down();
      await page.waitForTimeout(150);
      await page.mouse.up();
    } else {
      await locator.click();
    }
  };
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
    const wid = 'test-workspace-' + Date.now();
    await page1.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`);
    await page1.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // Wait for the app to fully load components
    await page1.waitForTimeout(4000);
    
    // Navigate to Raw Data / Background Tasks tab
    await dismissModals(page1);
    await injectCursor(page1);
    
    // Wait on dashboard briefly
    await page1.waitForTimeout(1500);
    
    const rawDataBtn = page1.locator('button:has-text("Raw Data")').first();
    if (await rawDataBtn.isVisible()) {
      await humanClick(page1, rawDataBtn);
      await page1.waitForTimeout(2000);
      
      const bgTasksBtn = page1.locator('button:has-text("Background Tasks")').first();
      if (await bgTasksBtn.isVisible()) {
          await humanClick(page1, bgTasksBtn);
          await page1.waitForTimeout(2000);
      }
      
      const runDiscovery = page1.locator('button:has-text("Run Discovery")').first();
      if (await runDiscovery.isVisible()) {
        await humanClick(page1, runDiscovery);
        // Watch the progress logs for 7 seconds to see realistic Exa/Gemini tasks
        await page1.waitForTimeout(7000); 
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
    await page2.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`);
    await page2.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // Wait for the app to fully load components
    await page2.waitForTimeout(4000);
    await dismissModals(page2);
    await injectCursor(page2);
    
    const mindmapBtn = page2.locator('button:has-text("Mindmap Explorer")').first();
    if (await mindmapBtn.isVisible()) {
      await humanClick(page2, mindmapBtn);
      await page2.waitForTimeout(4000); // Watch the mindmap render
      
      // Move and expand a node in React Flow (approximate click in the center of the canvas where nodes are)
      const canvas = page2.locator('.react-flow__pane').first();
      if (await canvas.isVisible()) {
        await humanClick(page2, canvas); // Try clicking to focus/interact
      }
      await page2.waitForTimeout(2000);
      
      // Go back to Dashboard to find the Notebook
      const dashBtn = page2.locator('button:has-text("Dashboard")').first();
      await humanClick(page2, dashBtn);
      await page2.waitForTimeout(2000);
      
      // Click the Market Value card
      const mvCard = page2.locator('h3:has-text("Est. Market Value"), h3:has-text("Estimated Market Value")').first();
      if (await mvCard.isVisible()) {
        await humanClick(page2, mvCard);
        await page2.waitForTimeout(2000);
        
        await page2.mouse.wheel(0, 500); // Scroll to Notebook
        await page2.waitForTimeout(1500);
        
        const calcBtn = page2.locator('button:has-text("Calculate Custom Target")').first();
        if (await calcBtn.isVisible()) {
          await humanClick(page2, calcBtn);
          await page2.waitForTimeout(3500);
        }
      }
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
    await page3.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`);
    await page3.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // Wait for the app to fully load components
    await page3.waitForTimeout(4000);
    await dismissModals(page3);
    await injectCursor(page3);
    
    const myProductBtn = page3.locator('button:has-text("My Product")').first();
    if (await myProductBtn.isVisible()) {
      await humanClick(page3, myProductBtn);
      await page3.waitForTimeout(3000); // Pause to review product details
      
      const genBtn = page3.locator('button:has-text("Generate Docs"), button:has-text("Generate OpenSpec")').first();
      if (await genBtn.isVisible()) {
        await humanClick(page3, genBtn);
        await page3.waitForTimeout(1500); // Wait for modal
        
        // Next (Features)
        const nextBtn = page3.locator('button:has-text("Next")').first();
        if (await nextBtn.isVisible()) {
          await humanClick(page3, nextBtn);
          await page3.waitForTimeout(1000);
        }
        
        // Next (Insights)
        if (await nextBtn.isVisible()) {
          await humanClick(page3, nextBtn);
          await page3.waitForTimeout(1500);
        }
        
        // Select PRD format
        const prdBtn = page3.locator('button:has-text("Product Requirements Document (PRD)")').first();
        if (await prdBtn.isVisible()) {
          await humanClick(page3, prdBtn);
          await page3.waitForTimeout(1000);
        }
        
        // Generate
        const finalGenBtn = page3.locator('button:has-text("Generate Document")').first();
        if (await finalGenBtn.isVisible()) {
          await humanClick(page3, finalGenBtn);
          await page3.waitForTimeout(5000); // Watch it generate and preview
        }
      }
    } else {
      await page3.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 3:', e.message); }
  
  const videoPath3 = await page3.video().path();
  await context3.close();
  fs.renameSync(videoPath3, path.join(VIDEOS_DIR, 'documentation-wizard.webm'));


  // Feature 4: Strategic Market Analysis (Data & Auto-SWOT)
  console.log('Recording Strategic Market Analysis...');
  const context4 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page4 = await context4.newPage();
  await mockAuth(page4);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page4.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`);
    await page4.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    // Wait for the app to fully load components
    await page4.waitForTimeout(4000);
    await dismissModals(page4);
    
    const marketAnalysisBtn = page4.locator('button:has-text("Market Analysis")').first();
    if (await marketAnalysisBtn.isVisible()) {
      await injectCursor(page4);
      await humanClick(page4, marketAnalysisBtn);
      await page4.waitForTimeout(2000);
      
      const dataSwotTab = page4.locator('button:has-text("Data & SWOT")').first();
      if (await dataSwotTab.isVisible()) {
        await humanClick(page4, dataSwotTab);
        await page4.waitForTimeout(1500);
        
        const genSwotBtn = page4.locator('button:has-text("Generate Auto-SWOT")').first();
        if (await genSwotBtn.isVisible()) {
          await humanClick(page4, genSwotBtn);
          await page4.waitForTimeout(3000); // Wait for generation
        }
      }
    } else {
      await page4.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 4:', e.message); }
  
  const videoPath4 = await page4.video().path();
  await context4.close();
  fs.renameSync(videoPath4, path.join(VIDEOS_DIR, 'strategic-market-analysis.webm'));

  // Feature 5: Team Collaboration & Multi-Product Workspaces
  console.log('Recording Team Collaboration & Multi-Product Workspaces...');
  const context5 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page5 = await context5.newPage();
  await mockAuth(page5);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page5.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true&role=superadmin`);
    await page5.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    await page5.waitForTimeout(4000);
    await dismissModals(page5);
    await injectCursor(page5);
    
    // 1. Show the Settings -> Team tab
    const settingsBtn = page5.locator('button:has-text("Settings")').first();
    if (await settingsBtn.isVisible()) {
      await humanClick(page5, settingsBtn);
      await page5.waitForTimeout(1500);
      
      const teamTabBtn = page5.locator('button:has-text("Team")').first();
      if (await teamTabBtn.isVisible()) {
        await humanClick(page5, teamTabBtn);
        await page5.waitForTimeout(2000); // Admire the UI
        
        const inviteBtn = page5.locator('button:has-text("Invite Member")').first();
        if (await inviteBtn.isVisible()) {
          await humanClick(page5, inviteBtn);
          await page5.waitForTimeout(2000); // Show modal
          await page5.keyboard.press('Escape'); // Close modal
          await page5.waitForTimeout(1000);
        }
      }
    }
    
    // 2. Show the Product Switcher Dropdown
    const dropdownTrigger = page5.locator('button[aria-haspopup="menu"]').first();
    if (await dropdownTrigger.isVisible()) {
      await humanClick(page5, dropdownTrigger);
      await page5.waitForTimeout(2000); // Show the dropdown list
      await page5.keyboard.press('Escape'); // Close it
      await page5.waitForTimeout(1000);
    }
    
  } catch (e) { console.error('Error in Feature 5:', e.message); }
  
  const videoPath5 = await page5.video().path();
  await context5.close();
  fs.renameSync(videoPath5, path.join(VIDEOS_DIR, 'team-collaboration.webm'));

  await browser.close();
  console.log('All feature videos recorded successfully to public/videos/');
}

run().catch(console.error);