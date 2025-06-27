import FireCrawlApp from '@mendable/firecrawl-js';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ScrapeResult } from './playwrightService'; // Re-use ScrapeResult interface

class FirecrawlService {
  private firecrawl: FireCrawlApp | null = null;

  constructor() {
    // Lazy initialization
  }

  private initializeIfNeeded() {
    if (!this.firecrawl) {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new AppError('Firecrawl API key not configured', 500, 'FIRECRAWL_KEY_MISSING');
      }
      this.firecrawl = new FireCrawlApp({ apiKey: apiKey.trim() });
      logger.info('Firecrawl service initialized successfully');
    }
  }

  async scrapePage(url: string): Promise<ScrapeResult> {
    this.initializeIfNeeded();

    logger.info(`🔥 [FIRECRAWL] Attempting to scrape: ${url}`);

    try {
      const scrapeResult = await this.firecrawl!.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true
      });

      if (scrapeResult && scrapeResult.data && scrapeResult.data.content) {
        logger.info(`✅ [FIRECRAWL] Scraped successfully: ${url} (${scrapeResult.data.content.length} chars)`);
        return {
          url: url,
          content: scrapeResult.data.content,
          success: true,
          title: scrapeResult.data.title,
          metaDescription: scrapeResult.data.metaDescription,
          headings: scrapeResult.data.headings?.map(h => h.text) || [],
          // Firecrawl provides markdown, so it's already "cleaned"
          cleanedContent: scrapeResult.data.content 
        };
      } else {
        logger.warn(`⚠️ [FIRECRAWL] No content returned for ${url}`);
        return {
          url: url,
          content: null,
          success: false,
          error: 'CONTENT_ERROR',
          errorDetails: 'Firecrawl returned no content'
        };
      }
    } catch (error: any) {
      logger.error(`❌ [FIRECRAWL] Scraping failed for ${url}:`, error);
      return {
        url: url,
        content: null,
        success: false,
        error: 'NETWORK', // Generic error for now, can be refined
        errorDetails: error.message || 'Unknown Firecrawl error'
      };
    }
  }

  async scrapeMultiplePages(urls: string[]): Promise<ScrapeResult[]> {
    this.initializeIfNeeded();
    logger.info(`🔥 [FIRECRAWL] Batch scraping ${urls.length} pages`);

    const results: ScrapeResult[] = [];
    // Firecrawl handles concurrency internally, so we can just map and await all
    const scrapePromises = urls.map(url => this.scrapePage(url));
    const settledResults = await Promise.allSettled(scrapePromises);

    settledResults.forEach(settledResult => {
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value);
      } else {
        logger.error(`❌ [FIRECRAWL] Batch scrape promise rejected:`, settledResult.reason);
        // Push a failed result for the URL that caused the rejection
        // Note: settledResult.reason might not contain the URL directly,
        // so this might need refinement if we need to map specific URLs to specific rejections.
        results.push({
          url: 'unknown_url_from_batch_rejection', // Placeholder
          content: null,
          success: false,
          error: 'NETWORK',
          errorDetails: settledResult.reason?.message || 'Batch scrape failed'
        });
      }
    });

    logger.info(`🔥 [FIRECRAWL] Batch scraping completed: ${results.filter(r => r.success).length}/${urls.length} successful`);
    return results;
  }
}

export const firecrawlService = new FirecrawlService();
