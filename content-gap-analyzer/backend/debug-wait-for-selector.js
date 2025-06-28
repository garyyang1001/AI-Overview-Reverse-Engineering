const { chromium } = require('playwright');

async function debugWaitForSelector() {
  let browser = null;
  let page = null;
  
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    
    console.log('🔍 Testing waitForSelector behavior...');
    
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const selectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      'body'
    ];
    
    // Test the exact logic from PlaywrightService
    for (const selector of selectors) {
      try {
        console.log(`⏳ Waiting for selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`✅ Found selector: ${selector}`);
        return; // This should exit the loop when found
      } catch (error) {
        console.log(`❌ Selector ${selector} not found: ${error.message}`);
        continue;
      }
    }
    
    console.log('❌ No meaningful content selectors found');
    
  } catch (error) {
    console.error('❌ Overall error:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

debugWaitForSelector();