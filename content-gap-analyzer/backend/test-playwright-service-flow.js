const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function testPlaywrightServiceFlow() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔍 Testing exact PlaywrightService flow...');
    
    // Mimic the exact browser launch from PlaywrightService
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];

    browser = await chromium.launch({
      headless: true,
      args: browserArgs
    });
    
    console.log('✅ Browser launched with PlaywrightService config');
    
    // Create page with exact same user agent
    page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    console.log('✅ Page created with PlaywrightService user agent');
    
    // Set the exact same timeout
    page.setDefaultTimeout(45000);
    
    // Test with the exact same URL navigation logic
    const testUrl = 'https://example.com';
    console.log(`🔍 Testing URL: ${testUrl}`);
    
    // Step 1: URL validation (from PlaywrightService)
    const isValidUrl = (url) => {
      try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    };
    
    if (!isValidUrl(testUrl)) {
      throw new Error('Invalid URL format');
    }
    console.log('✅ URL validation passed');
    
    // Step 2: Navigation (exact same as PlaywrightService)
    let response;
    try {
      response = await page.goto(testUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation failed:', error.message);
      throw error;
    }
    
    // Step 3: Check HTTP status (exact same as PlaywrightService)
    if (response && !response.ok()) {
      const status = response.status();
      console.log(`⚠️ HTTP ${status} for ${testUrl}`);
      throw new Error(`HTTP ${status}`);
    }
    console.log('✅ HTTP status check passed');
    
    // Step 4: Check content type (exact same as PlaywrightService)
    const contentType = response?.headers()['content-type'] || '';
    const isHtmlContent = (contentType) => {
      return contentType.toLowerCase().includes('text/html');
    };
    
    if (!isHtmlContent(contentType)) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }
    console.log('✅ Content type check passed');
    
    // Step 5: Wait for meaningful content (exact same as PlaywrightService)
    const waitForMeaningfulContent = async (page) => {
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
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          console.log(`✅ Found meaningful content selector: ${selector}`);
          return;
        } catch {
          continue;
        }
      }
      
      throw new Error('No meaningful content selectors found');
    };
    
    await waitForMeaningfulContent(page);
    
    // Step 6: Detect anti-scraping (simplified version)
    const detectAntiScraping = async (page) => {
      try {
        const indicators = [
          { selector: '.cf-browser-verification', message: 'Cloudflare detected' },
          { selector: '.g-recaptcha', message: 'reCAPTCHA detected' },
        ];
        
        for (const indicator of indicators) {
          const element = await page.$(indicator.selector);
          if (element) {
            return indicator.message;
          }
        }
        
        return null;
      } catch (error) {
        return null;
      }
    };
    
    const antiScrapingDetected = await detectAntiScraping(page);
    if (antiScrapingDetected) {
      throw new Error(antiScrapingDetected);
    }
    console.log('✅ Anti-scraping detection passed');
    
    // Step 7: Extract page content (exact same as PlaywrightService)
    const extractPageContent = async (page, url) => {
      const title = await page.title();
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content') || undefined;
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => {
        return elements.map(el => el.textContent?.trim()).filter(Boolean);
      });
      
      const html = await page.content();
      const $ = cheerio.load(html);
      
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
      
      let mainContent = '';
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.entry-content'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length && element.text().trim().length > 100) {
          mainContent = element.text();
          break;
        }
      }
      
      if (!mainContent) {
        mainContent = $('body').text();
      }
      
      const cleanedContent = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      return {
        title,
        headings,
        cleanedContent,
        metaDescription
      };
    };
    
    const extractedContent = await extractPageContent(page, testUrl);
    console.log('✅ Content extraction successful');
    console.log(`   Title: ${extractedContent.title}`);
    console.log(`   Content length: ${extractedContent.cleanedContent.length}`);
    console.log(`   Headings: ${extractedContent.headings.length}`);
    
    // Step 8: Validate content quality (exact same as PlaywrightService)
    const isValidContent = (content) => {
      if (!content) return false;
      if (content.length < 100) return false;
      
      const meaningfulText = content.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
      if (meaningfulText.length < 50) return false;
      
      const lowerContent = content.toLowerCase();
      const errorIndicators = [
        'page not found',
        '404 error',
        'access denied',
        'forbidden',
        'internal server error'
      ];
      
      for (const indicator of errorIndicators) {
        if (lowerContent.includes(indicator)) {
          return false;
        }
      }
      
      return true;
    };
    
    if (!isValidContent(extractedContent.cleanedContent)) {
      throw new Error('No meaningful content found');
    }
    console.log('✅ Content quality validation passed');
    
    console.log('🎉 ALL PLAYWRIGHT SERVICE STEPS PASSED!');
    console.log('The PlaywrightService logic is working correctly.');
    
    return {
      url: testUrl,
      content: extractedContent.cleanedContent,
      success: true,
      ...extractedContent
    };
    
  } catch (error) {
    console.error('❌ PlaywrightService flow failed at step:', error.message);
    console.error('Error details:', error);
    
    return {
      url: testUrl || 'unknown',
      content: null,
      success: false,
      error: 'CONTENT_ERROR',
      errorDetails: error.message
    };
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

testPlaywrightServiceFlow().then(result => {
  console.log('\n📊 Final Result:');
  console.log(JSON.stringify(result, null, 2));
});