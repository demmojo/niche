import re

with open("scripts/generate_feature_videos.cjs", "r") as f:
    content = f.read()

snippet = """
  // Feature 8: Head-to-Head Comparison
  console.log('Recording Head-to-Head Comparison...');
  const context8 = await browser.newContext({
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page8 = await context8.newPage();
  await mockAuth(page8);
  
  try {
    const wid = 'test-workspace-' + Date.now();
    await page8.goto(`http://localhost:3000/?w=${wid}&mock_auth=true&demo_data=true`);
    await page8.waitForSelector('#root', { state: 'visible', timeout: 15000 });
    await page8.waitForTimeout(4000);
    await dismissModals(page8);
    await injectCursor(page8);
    
    // Open Competitors Tracked summary
    const compCard = page8.locator('text=Competitors Tracked').first();
    if (await compCard.isVisible()) {
      await humanClick(page8, compCard);
      await page8.waitForTimeout(2000);
      
      // Click first two checkboxes
      const checkboxes = page8.locator('input[type="checkbox"]');
      if (await checkboxes.count() >= 2) {
        await humanClick(page8, checkboxes.nth(0));
        await page8.waitForTimeout(500);
        await humanClick(page8, checkboxes.nth(1));
        await page8.waitForTimeout(1000);
        
        const compareBtn = page8.locator('button:has-text("Compare")').first();
        if (await compareBtn.isVisible()) {
          await humanClick(page8, compareBtn);
          await page8.waitForTimeout(4000); // Record the side-by-side view
        }
      }
    } else {
      await page8.waitForTimeout(3000);
    }
  } catch (e) { console.error('Error in Feature 8:', e.message); }
  
  const videoPath8 = await page8.video().path();
  await context8.close();
  fs.renameSync(videoPath8, path.join(VIDEOS_DIR, 'head-to-head-comparison.webm'));
"""

if "Feature 8" not in content:
    content = content.replace("await browser.close();", snippet + "\n  await browser.close();")
    with open("scripts/generate_feature_videos.cjs", "w") as f:
        f.write(content)
