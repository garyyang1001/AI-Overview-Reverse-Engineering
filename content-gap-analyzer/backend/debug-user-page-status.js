// Simulate the exact analysisService user page flow
const { chromium } = require('playwright');
const cheerio = require('cheerio');

async function simulateUserPageStatus() {
  let browser = null;
  let page = null;
  
  console.log('🔍 Simulating exact user page scraping flow from analysisService...');
  
  try {
    // Step 1: Initialize browser (same as PlaywrightService)
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
    
    page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    page.setDefaultTimeout(45000);
    
    console.log('✅ Browser and page initialized');
    
    // Step 2: Test the scrapePage function logic
    const testUrl = 'https://example.com';
    console.log(`🔍 Testing user page: ${testUrl}`);
    
    // This is the exact sequence from analysisService lines 84-98
    console.log('📋 Step: Call playwrightService.scrapePage()');
    
    const scrapePageResult = await scrapePage(page, browser, testUrl);
    
    console.log('📊 Scrape Result:', {
      url: scrapePageResult.url,
      success: scrapePageResult.success,
      error: scrapePageResult.error,
      errorDetails: scrapePageResult.errorDetails,
      contentLength: scrapePageResult.content?.length || 0,
      hasTitle: !!scrapePageResult.title,
      hasHeadings: !!(scrapePageResult.headings && scrapePageResult.headings.length > 0)
    });
    
    // Step 3: Determine userPageStatus based on result
    let userPageStatus = 'pending';
    let userPageContentForPrompt = '';
    let userPageFallbackUsed = false;

    if (scrapePageResult.success && scrapePageResult.content) {
      userPageStatus = 'completed';
      console.log('✅ User page status: completed');
      userPageContentForPrompt = `--- START OF CONTENT FOR ${scrapePageResult.url} ---\n${scrapePageResult.content}\n--- END OF CONTENT FOR ${scrapePageResult.url} ---\n\n`;
    } else {
      userPageStatus = 'failed';
      console.log('❌ User page status: failed');
      console.log('🔄 Would attempt Firecrawl fallback...');
      // In real flow, this would trigger Firecrawl, then potentially Gemini URL Context
      userPageFallbackUsed = true;
    }
    
    console.log(`\n📈 Final User Page Status: ${userPageStatus}`);
    console.log(`📊 Content ready for prompt: ${userPageContentForPrompt.length > 0 ? 'YES' : 'NO'}`);
    console.log(`🔄 Fallback used: ${userPageFallbackUsed ? 'YES' : 'NO'}`);
    
    if (userPageStatus === 'failed') {
      console.log('\n🚨 THIS IS WHY userPageStatus = "failed"');
      console.log('The specific error details:');
      console.log(`   Error Type: ${scrapePageResult.error}`);
      console.log(`   Error Details: ${scrapePageResult.errorDetails}`);
    }
    
  } catch (error) {
    console.error('❌ Overall simulation failed:', error);
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

// Replicate the exact scrapePage logic from PlaywrightService
async function scrapePage(page, browser, url) {
  try {
    console.log(`   📋 Enhanced Playwright scraping: ${url}`);
    
    // URL validation
    if (!isValidUrl(url)) {
      return createErrorResult(url, 'NETWORK', 'Invalid URL format');
    }
    
    // Navigation
    let response;
    try {
      response = await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });
    } catch (error) {
      return classifyError(url, error);
    }
    
    // HTTP status check
    if (response && !response.ok()) {
      const status = response.status();
      console.log(`   ⚠️ HTTP ${status} for ${url}`);
      
      if (status >= 400) {
        return createErrorResult(
          url, 
          status === 429 ? 'BLOCKED' : 'NETWORK', 
          `HTTP ${status}: ${getHttpErrorMessage(status)}`
        );
      }
    }
    
    // Content type check
    const contentType = response?.headers()['content-type'] || '';
    if (!isHtmlContent(contentType)) {
      return createErrorResult(
        url,
        'CONTENT_ERROR',
        `Unexpected content type: ${contentType}`
      );
    }
    
    // Wait for meaningful content
    try {
      await waitForMeaningfulContent(page);
    } catch (error) {
      return createErrorResult(url, 'CONTENT_ERROR', 'Main content selectors not found');
    }
    
    // Detect anti-scraping
    const antiScrapingDetected = await detectAntiScraping(page);
    if (antiScrapingDetected) {
      return createErrorResult(url, 'BLOCKED', antiScrapingDetected);
    }
    
    // Extract content
    const extractedContent = await extractPageContent(page, url);
    
    // Validate content
    if (!isValidContent(extractedContent.cleanedContent || '')) {
      return createErrorResult(url, 'CONTENT_ERROR', 'No meaningful content found');
    }
    
    console.log(`   ✅ Enhanced scraping successful: ${url} (${extractedContent.cleanedContent?.length || 0} chars)`);
    
    return {
      url,
      content: extractedContent.cleanedContent || null,
      success: true,
      ...extractedContent
    };
    
  } catch (error) {
    console.log(`   ❌ Enhanced scraping failed for ${url}:`, error);
    return classifyError(url, error);
  }
}

// Helper functions (replicated from PlaywrightService)
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

function createErrorResult(url, error, details) {
  return {
    url,
    content: null,
    success: false,
    error,
    errorDetails: details
  };
}

function classifyError(url, error) {
  const errorMessage = error.message || error.toString();
  
  if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
    return createErrorResult(url, 'TIMEOUT', `Timeout: ${errorMessage}`);
  }
  
  if (errorMessage.includes('net::ERR_') || 
      errorMessage.includes('Connection') ||
      errorMessage.includes('DNS') ||
      errorMessage.includes('SSL')) {
    return createErrorResult(url, 'NETWORK', `Network error: ${errorMessage}`);
  }
  
  if (errorMessage.includes('blocked') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('captcha') ||
      errorMessage.includes('rate limit')) {
    return createErrorResult(url, 'BLOCKED', `Access blocked: ${errorMessage}`);
  }
  
  return createErrorResult(url, 'CONTENT_ERROR', `Content error: ${errorMessage}`);
}

function getHttpErrorMessage(status) {
  const statusMessages = {
    400: 'Bad Request',
    401: 'Unauthorized', 
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return statusMessages[status] || 'Unknown Error';
}

function isHtmlContent(contentType) {
  return contentType.toLowerCase().includes('text/html');
}

async function waitForMeaningfulContent(page) {
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
      return;
    } catch {
      continue;
    }
  }
  
  throw new Error('No meaningful content selectors found');
}

async function detectAntiScraping(page) {
  try {
    const indicators = [
      { selector: '.cf-browser-verification', message: 'Cloudflare browser verification detected' },
      { selector: '#cf-content', message: 'Cloudflare protection detected' },
      { selector: '.g-recaptcha', message: 'reCAPTCHA detected' },
      { selector: '[data-sitekey]', message: 'CAPTCHA detected' },
    ];
    
    for (const indicator of indicators.filter(i => i.selector)) {
      const element = await page.$(indicator.selector);
      if (element) {
        return indicator.message;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function extractPageContent(page, url) {
  try {
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
  } catch (error) {
    console.log(`   ❌ Content extraction failed for ${url}:`, error);
    throw error;
  }
}

function isValidContent(content) {
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
}

simulateUserPageStatus();