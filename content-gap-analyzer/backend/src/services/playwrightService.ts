import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
// import { PageContent } from '../types'; // 暫時註解，使用新的 ScrapeResult

// 簡化錯誤分類策略 - 4 種主要錯誤類型
export interface ScrapeResult {
  url: string;
  content: string | null;
  success: boolean;
  error?: 'TIMEOUT' | 'NETWORK' | 'BLOCKED' | 'CONTENT_ERROR';
  errorDetails?: string;
  // 向後兼容的字段
  title?: string;
  headings?: string[];
  cleanedContent?: string;
  metaDescription?: string;
}

class PlaywrightService {
  private browser: Browser | null = null;
  
  constructor() {
    // Lazy initialization
  }
  
  private async initializeIfNeeded() {
    if (!this.browser) {
      try {
        // 根據環境調整啟動參數
        const browserArgs = process.env.NODE_ENV === 'production' ? [
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-default-apps'
        ] : [
          '--no-sandbox',  // 只在開發環境使用
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ];

        this.browser = await chromium.launch({
          headless: true,
          args: browserArgs
        });
        
        logger.info(`Playwright browser initialized successfully (${process.env.NODE_ENV} mode)`);
      } catch (error: any) {
        logger.error('Failed to initialize Playwright browser:', error);
        throw new AppError('Failed to initialize browser', 500, 'PLAYWRIGHT_INIT_ERROR');
      }
    }
  }
  
  /**
   * 強化版頁面爬取 - 實現商業級錯誤處理機制
   */
  async scrapePage(url: string): Promise<ScrapeResult> {
    await this.initializeIfNeeded();
    
    let page: Page | null = null;
    
    try {
      logger.info(`Enhanced Playwright scraping: ${url}`);
      
      // 驗證 URL 格式
      if (!this.isValidUrl(url)) {
        return this.createErrorResult(url, 'NETWORK', 'Invalid URL format');
      }
      
      page = await this.browser!.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      // 設置較長的超時以處理慢網站
      page.setDefaultTimeout(45000);
      
      // 嘗試導航到頁面
      let response;
      try {
        response = await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 45000 
        });
      } catch (error: any) {
        return this.classifyError(url, error);
      }
      
      // 檢查 HTTP 狀態碼
      if (response && !response.ok()) {
        const status = response.status();
        logger.warn(`HTTP ${status} for ${url}`);
        
        if (status >= 400) {
          return this.createErrorResult(
            url, 
            status === 429 ? 'BLOCKED' : 'NETWORK', 
            `HTTP ${status}: ${this.getHttpErrorMessage(status)}`
          );
        }
      }
      
      // 檢查內容類型
      const contentType = response?.headers()['content-type'] || '';
      if (!this.isHtmlContent(contentType)) {
        return this.createErrorResult(
          url,
          'CONTENT_ERROR',
          `Unexpected content type: ${contentType}`
        );
      }
      
      // 等待頁面內容加載
      try {
        await this.waitForMeaningfulContent(page);
      } catch (error: any) {
        return this.createErrorResult(url, 'CONTENT_ERROR', 'Main content selectors not found');
      }
      
      // 檢測反爬蟲機制
      const antiScrapingDetected = await this.detectAntiScraping(page);
      if (antiScrapingDetected) {
        return this.createErrorResult(url, 'BLOCKED', antiScrapingDetected);
      }
      
      // 提取頁面內容
      const extractedContent = await this.extractPageContent(page, url);
      
      // 驗證內容品質
      if (!this.isValidContent(extractedContent.cleanedContent || '')) {
        return this.createErrorResult(url, 'CONTENT_ERROR', 'No meaningful content found');
      }
      
      logger.info(`Enhanced scraping successful: ${url} (${extractedContent.cleanedContent?.length || 0} chars)`);
      
      return {
        url,
        content: extractedContent.cleanedContent || null,
        success: true,
        ...extractedContent
      };
      
    } catch (error: any) {
      logger.error(`Enhanced scraping failed for ${url}:`, error);
      return this.classifyError(url, error);
    } finally {
      if (page) {
        await page.close().catch(err => logger.warn('Failed to close page:', err));
      }
    }
  }
  
  async scrapeMultiplePages(urls: string[]): Promise<ScrapeResult[]> {
    await this.initializeIfNeeded();
    
    logger.info(`Enhanced Playwright batch scraping ${urls.length} pages`);
    
    const results: ScrapeResult[] = [];
    const concurrentLimit = 3; // Limit concurrent pages to avoid overwhelming the browser
    
    try {
      // Process URLs in batches with proper error recovery
      for (let i = 0; i < urls.length; i += concurrentLimit) {
        const batch = urls.slice(i, i + concurrentLimit);
        
        try {
          const batchPromises = batch.map(async (url) => {
            try {
              return await this.scrapePage(url);
            } catch (error) {
              logger.warn(`Failed to scrape ${url}:`, error);
              return this.createErrorResult(url, 'CONTENT_ERROR', `Batch scraping failed: ${error}`);
            }
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          
          // Process settled results
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              logger.error(`Batch promise rejected for ${batch[index]}:`, result.reason);
              results.push(this.createErrorResult(
                batch[index], 
                'CONTENT_ERROR', 
                `Promise rejection: ${result.reason?.message || result.reason}`
              ));
            }
          });
          
        } catch (batchError) {
          logger.error(`Entire batch failed (${batch.join(', ')}):`, batchError);
          // Add error results for all URLs in failed batch
          batch.forEach(url => {
            results.push(this.createErrorResult(
              url, 
              'CONTENT_ERROR', 
              `Batch processing failed: ${batchError}`
            ));
          });
        }
        
        // Small delay between batches to be respectful
        if (i + concurrentLimit < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (criticalError) {
      logger.error('Critical error in batch scraping, attempting browser recovery:', criticalError);
      
      // Force close and reinitialize browser on critical failure
      try {
        if (this.browser) {
          await this.browser.close();
          this.browser = null;
        }
      } catch (closeError) {
        logger.warn('Failed to close browser during recovery:', closeError);
      }
      
      // Add error results for any remaining URLs
      const remainingUrls = urls.filter(url => !results.some(r => r.url === url));
      remainingUrls.forEach(url => {
        results.push(this.createErrorResult(
          url, 
          'CONTENT_ERROR', 
          `Critical batch failure: ${criticalError}`
        ));
      });
    }
    
    const successfulResults = results.filter(r => r.success);
    logger.info(`Enhanced batch scraping completed: ${successfulResults.length}/${urls.length} pages successful`);
    
    return results;
  }
  
  /**
   * 助手方法：驗證 URL 格式
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
  
  /**
   * 助手方法：創建錯誤結果
   */
  private createErrorResult(
    url: string, 
    error: ScrapeResult['error'], 
    details: string
  ): ScrapeResult {
    return {
      url,
      content: null,
      success: false,
      error,
      errorDetails: details
    };
  }
  
  /**
   * 助手方法：簡化錯誤分類
   */
  private classifyError(url: string, error: any): ScrapeResult {
    const errorMessage = error.message || error.toString();
    
    // TIMEOUT - 超時相關錯誤
    if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
      return this.createErrorResult(url, 'TIMEOUT', `Timeout: ${errorMessage}`);
    }
    
    // NETWORK - 網路連線錯誤
    if (errorMessage.includes('net::ERR_') || 
        errorMessage.includes('Connection') ||
        errorMessage.includes('DNS') ||
        errorMessage.includes('SSL')) {
      return this.createErrorResult(url, 'NETWORK', `Network error: ${errorMessage}`);
    }
    
    // BLOCKED - 存取被拒或防護機制
    if (errorMessage.includes('blocked') ||
        errorMessage.includes('forbidden') ||
        errorMessage.includes('captcha') ||
        errorMessage.includes('rate limit')) {
      return this.createErrorResult(url, 'BLOCKED', `Access blocked: ${errorMessage}`);
    }
    
    // CONTENT_ERROR - 內容相關錯誤（預設）
    return this.createErrorResult(url, 'CONTENT_ERROR', `Content error: ${errorMessage}`);
  }
  
  /**
   * 助手方法：獲取 HTTP 錯誤訊息
   */
  private getHttpErrorMessage(status: number): string {
    const statusMessages: Record<number, string> = {
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
  
  /**
   * 助手方法：檢查是否為 HTML 內容
   */
  private isHtmlContent(contentType: string): boolean {
    return contentType.toLowerCase().includes('text/html');
  }
  
  /**
   * 助手方法：等待有意義的內容加載
   */
  private async waitForMeaningfulContent(page: Page): Promise<void> {
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
    
    // 嘗試等待任一主要內容選擇器出現
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        return; // 找到一個就返回
      } catch {
        continue; // 繼續嘗試下一個選擇器
      }
    }
    
    // 如果所有選擇器都失敗，拋出錯誤
    throw new Error('No meaningful content selectors found');
  }
  
  /**
   * 助手方法：檢測反爬蟲機制
   */
  private async detectAntiScraping(page: Page): Promise<string | null> {
    try {
      // 檢查常見的反爬蟲標誌
      const indicators = [
        // Cloudflare
        { selector: '.cf-browser-verification', message: 'Cloudflare browser verification detected' },
        { selector: '#cf-content', message: 'Cloudflare protection detected' },
        
        // reCAPTCHA
        { selector: '.g-recaptcha', message: 'reCAPTCHA detected' },
        { selector: '[data-sitekey]', message: 'CAPTCHA detected' },
        
        // 常見的阻擋訊息
        { text: 'access denied', message: 'Access denied message detected' },
        { text: 'blocked', message: 'Blocked message detected' },
        { text: 'robot', message: 'Robot detection message found' },
        { text: 'captcha', message: 'CAPTCHA text detected' }
      ];
      
      // 檢查選擇器
      for (const indicator of indicators.filter(i => i.selector)) {
        const element = await page.$(indicator.selector!);
        if (element) {
          return indicator.message;
        }
      }
      
      // 檢查頁面文本
      const pageText = await page.textContent('body') || '';
      const lowerText = pageText.toLowerCase();
      
      for (const indicator of indicators.filter(i => i.text)) {
        if (lowerText.includes(indicator.text!)) {
          return indicator.message;
        }
      }
      
      return null;
    } catch (error) {
      logger.warn('Anti-scraping detection failed:', error);
      return null;
    }
  }
  
  /**
   * 助手方法：提取頁面內容
   */
  private async extractPageContent(page: Page, url: string): Promise<{
    title?: string;
    headings?: string[];
    cleanedContent?: string;
    metaDescription?: string;
  }> {
    try {
      // 提取基本元素
      const title = await page.title();
      const metaDescription = await page.getAttribute('meta[name="description"]', 'content') || undefined;
      
      // 提取標題層級
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (elements) => {
        return elements.map(el => el.textContent?.trim()).filter(Boolean);
      });
      
      // 獲取頁面 HTML
      const html = await page.content();
      
      // 使用 Cheerio 清理內容
      const $ = cheerio.load(html);
      
      // 移除不需要的元素
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
      
      // 嘗試提取主要內容
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
      
      // 如果沒有找到主要內容，使用 body
      if (!mainContent) {
        mainContent = $('body').text();
      }
      
      // 清理文本
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
      logger.error(`Content extraction failed for ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * 助手方法：驗證內容品質
   */
  private isValidContent(content: string | undefined): boolean {
    if (!content) return false;
    
    // 檢查最小長度
    if (content.length < 100) return false;
    
    // 檢查是否包含有意義的文字（而非只是空白或符號）
    const meaningfulText = content.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
    if (meaningfulText.length < 50) return false;
    
    // 檢查是否包含常見的錯誤頁面內容
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
  
  
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Playwright browser closed');
    }
  }
}

let playwrightServiceInstance: PlaywrightService | null = null;

export const playwrightService = {
  getInstance(): PlaywrightService {
    if (!playwrightServiceInstance) {
      playwrightServiceInstance = new PlaywrightService();
    }
    return playwrightServiceInstance;
  },
  
  scrapePage(url: string): Promise<ScrapeResult> {
    return this.getInstance().scrapePage(url);
  },
  
  scrapeMultiplePages(urls: string[]): Promise<ScrapeResult[]> {
    return this.getInstance().scrapeMultiplePages(urls);
  },
  
  close(): Promise<void> {
    return this.getInstance().close();
  }
};

