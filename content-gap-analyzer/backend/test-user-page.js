const { chromium } = require('playwright');

async function testUserPageScraping() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🚀 Testing user page scraping with simplified approach...');
    
    // Launch browser with minimal configuration
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Page created successfully');
    
    // Set timeout
    page.setDefaultTimeout(15000);
    
    // Test with a simple, reliable URL
    const testUrl = 'https://httpstat.us/200';
    console.log(`🔍 Testing URL: ${testUrl}`);
    
    const response = await page.goto(testUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log(`✅ Navigation successful, status: ${response.status()}`);
    
    // Get page content
    const content = await page.content();
    console.log(`✅ Content extracted, length: ${content.length}`);
    
    // Test with a more complex URL
    const complexUrl = 'https://example.com';
    console.log(`🔍 Testing complex URL: ${complexUrl}`);
    
    const response2 = await page.goto(complexUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log(`✅ Complex navigation successful, status: ${response2.status()}`);
    
    const content2 = await page.content();
    console.log(`✅ Complex content extracted, length: ${content2.length}`);
    
    // Try to extract text content
    const textContent = await page.textContent('body');
    console.log(`✅ Text content extracted, length: ${textContent?.length || 0}`);
    
    console.log('🎉 All tests passed - Playwright is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check specific error types
    if (error.name === 'TimeoutError') {
      console.error('🕒 This is a timeout error - network or page loading issue');
    }
    
    if (error.message.includes('net::ERR_')) {
      console.error('🌐 This is a network connectivity error');
    }
    
    if (error.message.includes('Permission denied')) {
      console.error('🔒 This is a permission error - check system access');
    }
    
  } finally {
    if (page) {
      try {
        await page.close();
        console.log('✅ Page closed');
      } catch (e) {
        console.error('⚠️ Failed to close page:', e.message);
      }
    }
    
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Browser closed');
      } catch (e) {
        console.error('⚠️ Failed to close browser:', e.message);
      }
    }
  }
}

testUserPageScraping();