import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { PageContent } from '../types';

class PlaywrightService {
  private browser: Browser | null = null;
  
  constructor() {
    // Lazy initialization
  }
  
  private async initializeIfNeeded() {
    if (!this.browser) {
      try {
        this.browser = await chromium.launch({
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
        logger.info('Playwright browser initialized successfully');
      } catch (error: any) {
        logger.error('Failed to initialize Playwright browser:', error);
        throw new AppError('Failed to initialize browser', 500, 'PLAYWRIGHT_INIT_ERROR');
      }
    }
  }
  
  async scrapePage(url: string): Promise<PageContent> {
    await this.initializeIfNeeded();
    
    let page: Page | null = null;
    
    try {
      logger.info(`Playwright scraping page: ${url}`);
      
      page = await this.browser!.newPage({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      // Set a reasonable timeout
      page.setDefaultTimeout(30000);
      
      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for the page to stabilize
      await page.waitForTimeout(2000);
      
      // Get page content
      const html = await page.content();
      const title = await page.title();
      
      // Get meta description
      const metaDescription = await page.$eval('meta[name="description"]', (meta: any) => {
        return meta.getAttribute('content') || '';
      }).catch(() => '');
      
      // Extract and clean content using Cheerio
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, nav, footer, header, .sidebar, .advertisement, .ads, .cookie-notice').remove();
      
      // Extract headings
      const headings: string[] = [];
      $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const heading = $(element).text().trim();
        if (heading) {
          headings.push(heading);
        }
      });
      
      // Extract main content
      let cleanedContent = '';
      
      // Try to find main content areas
      const mainSelectors = [
        'main',
        'article', 
        '[role="main"]',
        '.main-content',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        '.article-content'
      ];
      
      let mainContent = null;
      for (const selector of mainSelectors) {
        mainContent = $(selector).first();
        if (mainContent.length > 0) {
          break;
        }
      }
      
      // If no main content found, use body
      if (!mainContent || mainContent.length === 0) {
        mainContent = $('body');
      }
      
      // Extract text content
      cleanedContent = mainContent.text()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
        .trim();
      
      const result: PageContent = {
        url,
        title: title || 'Unknown Title',
        headings,
        cleanedContent,
        metaDescription: metaDescription || ''
      };

      logger.info(`Playwright successfully scraped: ${url} (${cleanedContent.length} chars)`);
      return result;
      
    } catch (error: any) {
      logger.error(`Playwright scraping failed for ${url}:`, error);
      throw new AppError(
        `Failed to scrape content from ${url}: ${error.message}`,
        500,
        'PLAYWRIGHT_SCRAPING_ERROR'
      );
    } finally {
      if (page) {
        await page.close().catch(err => logger.warn('Failed to close page:', err));
      }
    }
  }
  
  async scrapeMultiplePages(urls: string[]): Promise<PageContent[]> {
    await this.initializeIfNeeded();
    
    logger.info(`Playwright batch scraping ${urls.length} pages`);
    
    const results: PageContent[] = [];
    const concurrentLimit = 3; // Limit concurrent pages to avoid overwhelming the browser
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += concurrentLimit) {
      const batch = urls.slice(i, i + concurrentLimit);
      const batchPromises = batch.map(async (url) => {
        try {
          return await this.scrapePage(url);
        } catch (error) {
          logger.warn(`Failed to scrape ${url}, skipping:`, error);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful results
      batchResults.forEach(result => {
        if (result) {
          results.push(result);
        }
      });
      
      // Small delay between batches to be respectful
      if (i + concurrentLimit < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info(`Playwright batch scraping completed: ${results.length}/${urls.length} pages successful`);
    return results;
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
  
  scrapePage(url: string): Promise<PageContent> {
    return this.getInstance().scrapePage(url);
  },
  
  scrapeMultiplePages(urls: string[]): Promise<PageContent[]> {
    return this.getInstance().scrapeMultiplePages(urls);
  },
  
  close(): Promise<void> {
    return this.getInstance().close();
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing Playwright browser...');
  await playwrightService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing Playwright browser...');
  await playwrightService.close();
  process.exit(0);
});