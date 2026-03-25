const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.message);
    console.log(err.stack);
  });

  console.log("Navigating to http://127.0.0.1:5173...");
  await page.goto('http://127.0.0.1:5173');
  
  console.log("Waiting for game to load...");
  await page.waitForTimeout(1000);
  
  // Click Start Fix
  try {
    await page.click('button:has-text("Start Fix")');
    console.log("Clicked Start Fix");
    await page.waitForTimeout(1000);
    
    // Click Map
    await page.click('button:has-text("Map")');
    console.log("Clicked Map. Waiting to see if it crashes...");
    await page.waitForTimeout(2000);
    
    console.log("Survival check completed. Did it crash?");
  } catch (e) {
    console.log("Script failed:", e.message);
  }

  await browser.close();
})();
