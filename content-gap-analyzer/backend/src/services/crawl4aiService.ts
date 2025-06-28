import axios from 'axios';
import logger from '../utils/logger';

// Define ScrapeResult interface based on Crawl4AI's expected output
export interface ScrapeResult {
  url: string;
  content: string | null; // Crawl4AI returns markdown
  success: boolean;
  title?: string;
  metaDescription?: string;
  headings?: string[]; // Crawl4AI might not directly provide structured headings in the current format
  cleanedContent?: string; // Same as content if markdown is considered clean
  error?: string;
  errorDetails?: any;
}

class Crawl4AIService {
  private readonly CRAWL4AI_BASE_URL: string;

  constructor() {
    this.CRAWL4AI_BASE_URL = process.env.CRAWL4AI_BASE_URL || 'http://localhost:11235';
    logger.info(`Crawl4AI service initialized with base URL: ${this.CRAWL4AI_BASE_URL}`);
  }

  // Removed private async pollTaskStatus(taskId: string): Promise<any> method

  async scrapePage(url: string): Promise<ScrapeResult> {
    logger.info(`🤖 [CRAWL4AI] Attempting to scrape: ${url}`);

    // Clean the URL by removing fragment identifiers like #:~:text=
    const cleanedUrl = url.split('#:~:text=')[0].split('#:')[0];
    if (cleanedUrl !== url) {
      logger.info(`🧹 [CRAWL4AI] Cleaned URL from ${url} to ${cleanedUrl}`);
    }

    try {
      // Submit crawl job and directly get the result
      const response = await axios.post(`${this.CRAWL4AI_BASE_URL}/crawl`, {
        urls: [cleanedUrl], // Changed to an array
        priority: 10, // Or other priority as needed
      });

      const crawlResult = response.data.results[0]; // Get the first result from the 'results' array

      if (crawlResult && crawlResult.success) {
        logger.info(`✅ [CRAWL4AI] Scraped successfully: ${cleanedUrl} (${crawlResult.markdown?.raw_markdown?.length || 0} chars)`);
        return {
          url: cleanedUrl, // Return cleaned URL
          content: crawlResult.markdown?.raw_markdown || null, // Use raw_markdown
          success: true,
          title: crawlResult.metadata?.title,
          metaDescription: crawlResult.metadata?.description,
          headings: [], // Crawl4AI provides markdown, parsing headings from it would be a separate step
          cleanedContent: crawlResult.markdown?.raw_markdown, // Use raw_markdown
        };
      } else {
        logger.warn(`⚠️ [CRAWL4AI] No content or failed status for ${cleanedUrl}: ${crawlResult?.error_message || 'Unknown error'}`);
        return {
          url: cleanedUrl, // Return cleaned URL
          content: null,
          success: false,
          error: 'CRAWL4AI_SCRAPE_FAILED',
          errorDetails: crawlResult?.error_message || 'No content returned or scrape failed',
        };
      }
    } catch (error: any) {
      logger.error(`❌ [CRAWL4AI] Scraping failed for ${cleanedUrl}:`, error.message);
      return {
        url: cleanedUrl, // Return cleaned URL
        content: null,
        success: false,
        error: 'NETWORK',
        errorDetails: error.message || 'Unknown Crawl4AI error',
      };
    }
  }

  async scrapeMultiplePages(urls: string[]): Promise<ScrapeResult[]> {
    logger.info(`🤖 [CRAWL4AI] Batch scraping ${urls.length} pages`);

    const scrapePromises = urls.map(url => this.scrapePage(url));
    const settledResults = await Promise.allSettled(scrapePromises);

    const results: ScrapeResult[] = [];
    settledResults.forEach(settledResult => {
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value);
      } else {
        logger.error(`❌ [CRAWL4AI] Batch scrape promise rejected:`, settledResult.reason);
        // Attempt to extract URL from reason if possible, otherwise use a placeholder
        const rejectedUrl = settledResult.reason?.url || 'unknown_url_from_batch_rejection';
        results.push({
          url: rejectedUrl,
          content: null,
          success: false,
          error: 'NETWORK',
          errorDetails: settledResult.reason?.message || 'Batch scrape failed',
        });
      }
    });

    logger.info(`🤖 [CRAWL4AI] Batch scraping completed: ${results.filter(r => r.success).length}/${urls.length} successful`);
    return results;
  }
}

export const crawl4aiService = new Crawl4AIService();