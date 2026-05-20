const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Log all console messages
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/playlists');
  
  // Wait for React to mount
  await page.waitForTimeout(2000);
  
  // Login first? Let's check if we are logged in.
  // Wait, puppeteer won't be logged in because it's a new session!
  // I need to log in first.
  
  console.log('Done');
  await browser.close();
})();
