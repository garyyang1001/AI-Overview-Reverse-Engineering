const { chromium } = require('playwright');

async function debugSelectors() {
  let browser = null;
  let page = null;
  
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    page = await browser.newPage();
    
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    console.log('🔍 Checking available selectors on example.com...');
    
    const selectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      'body',
      'div',
      'p',
      'h1'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`${selector}: ${elements.length} elements found`);
        
        if (elements.length > 0) {
          const textContent = await page.textContent(selector);
          console.log(`  → Text length: ${textContent?.length || 0}`);
          if (textContent && textContent.length < 200) {
            console.log(`  → Text preview: "${textContent.substring(0, 100)}"`);
          }
        }
      } catch (error) {
        console.log(`${selector}: Error - ${error.message}`);
      }
    }
    
    // Get the full HTML structure
    const html = await page.content();
    console.log(`\nFull HTML length: ${html.length}`);
    console.log('HTML preview:');
    console.log(html.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

debugSelectors();