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

interface ContentExtractionResult {
  content: string | null;
  method: string;
}

class Crawl4AIService {
  private readonly CRAWL4AI_BASE_URL: string;

  constructor() {
    this.CRAWL4AI_BASE_URL = process.env.CRAWL4AI_BASE_URL || 'http://localhost:11235';
    logger.info(`Crawl4AI service initialized with base URL: ${this.CRAWL4AI_BASE_URL}`);
  }

  // Removed private async pollTaskStatus(taskId: string): Promise<any> method

  async scrapePage(url: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    logger.info(`🤖 [CRAWL4AI] Starting page scrape`, {
      url,
      timestamp: new Date().toISOString()
    });

    // Clean the URL by removing fragment identifiers like #:~:text=
    const cleanedUrl = url.split('#:~:text=')[0].split('#:')[0];
    if (cleanedUrl !== url) {
      logger.info(`🧹 [CRAWL4AI] URL cleaned`, {
        originalUrl: url,
        cleanedUrl,
        fragmentRemoved: url.substring(cleanedUrl.length)
      });
    }

    try {
      // Submit crawl job and directly get the result
      const apiStartTime = Date.now();
      logger.debug(`🚀 [CRAWL4AI] Calling API`, {
        endpoint: `${this.CRAWL4AI_BASE_URL}/crawl`,
        url: cleanedUrl
      });
      
      const response = await axios.post(`${this.CRAWL4AI_BASE_URL}/crawl`, {
        urls: [cleanedUrl], // Changed to an array
        priority: 10, // Or other priority as needed
      });
      
      const apiDuration = Date.now() - apiStartTime;
      logger.debug(`📡 [CRAWL4AI] API response received`, {
        statusCode: response.status,
        duration: `${apiDuration}ms`,
        hasResults: !!response.data?.results,
        resultsCount: response.data?.results?.length || 0
      });

      const crawlResult = response.data.results[0]; // Get the first result from the 'results' array

      if (crawlResult && crawlResult.success) {
        // Extract content using multiple fallback strategies
        const extractionStartTime = Date.now();
        const extractedContent = this.extractContent(crawlResult, cleanedUrl);
        const extractionDuration = Date.now() - extractionStartTime;
        
        if (extractedContent.content) {
          const totalDuration = Date.now() - startTime;
          logger.info(`✅ [CRAWL4AI] Scrape successful`, {
            url: cleanedUrl,
            contentLength: extractedContent.content.length,
            extractionMethod: extractedContent.method,
            extractionDuration: `${extractionDuration}ms`,
            totalDuration: `${totalDuration}ms`,
            hasTitle: !!crawlResult.metadata?.title,
            hasMetaDescription: !!crawlResult.metadata?.description,
            contentPreview: extractedContent.content.substring(0, 100) + '...'
          });
          return {
            url: cleanedUrl,
            content: extractedContent.content,
            success: true,
            title: crawlResult.metadata?.title,
            metaDescription: crawlResult.metadata?.description,
            headings: [], // Crawl4AI provides markdown, parsing headings from it would be a separate step
            cleanedContent: extractedContent.content,
          };
        } else {
          logger.warn(`⚠️ [CRAWL4AI] No meaningful content extracted`, {
            url: cleanedUrl,
            totalDuration: `${Date.now() - startTime}ms`
          });
          logger.debug(`🔍 [CRAWL4AI] Response structure debug:`, {
            url: cleanedUrl,
            hasMarkdown: !!crawlResult.markdown,
            markdownType: typeof crawlResult.markdown,
            markdownKeys: crawlResult.markdown && typeof crawlResult.markdown === 'object' ? Object.keys(crawlResult.markdown) : [],
            hasHtml: !!crawlResult.html,
            htmlLength: crawlResult.html?.length || 0,
            hasCleanedHtml: !!crawlResult.cleaned_html,
            cleanedHtmlLength: crawlResult.cleaned_html?.length || 0,
            hasExtractedContent: !!crawlResult.extracted_content,
            extractedContentLength: crawlResult.extracted_content?.length || 0,
            allKeys: Object.keys(crawlResult),
            metadata: crawlResult.metadata
          });
          return {
            url: cleanedUrl,
            content: null,
            success: false,
            error: 'CRAWL4AI_NO_CONTENT',
            errorDetails: 'Content extraction failed - no meaningful content found in response',
          };
        }
      } else {
        const totalDuration = Date.now() - startTime;
        logger.warn(`⚠️ [CRAWL4AI] Scrape failed or no content`, {
          url: cleanedUrl,
          success: crawlResult?.success,
          errorMessage: crawlResult?.error_message || 'Unknown error',
          totalDuration: `${totalDuration}ms`
        });
        logger.debug(`🔍 [CRAWL4AI] Failed response structure:`, {
          url: cleanedUrl,
          success: crawlResult?.success,
          errorMessage: crawlResult?.error_message,
          hasResult: !!crawlResult,
          allKeys: crawlResult ? Object.keys(crawlResult) : [],
          rawResponse: JSON.stringify(crawlResult).substring(0, 500)
        });
        return {
          url: cleanedUrl,
          content: null,
          success: false,
          error: 'CRAWL4AI_SCRAPE_FAILED',
          errorDetails: crawlResult?.error_message || 'No content returned or scrape failed',
        };
      }
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      logger.error(`❌ [CRAWL4AI] Scraping failed with exception`, {
        url: cleanedUrl,
        error: error.message,
        errorType: error.code || error.name || 'Unknown',
        totalDuration: `${totalDuration}ms`,
        stack: error.stack
      });
      
      // Log additional details for axios errors
      if (error.response) {
        logger.error(`🔴 [CRAWL4AI] HTTP error details:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: JSON.stringify(error.response.data).substring(0, 500)
        });
      } else if (error.request) {
        logger.error(`🔴 [CRAWL4AI] No response received - network error`);
      }
      
      return {
        url: cleanedUrl, // Return cleaned URL
        content: null,
        success: false,
        error: 'NETWORK',
        errorDetails: error.message || 'Unknown Crawl4AI error',
      };
    }
  }

  /**
   * Extract content from Crawl4AI response using multiple fallback strategies
   * @param crawlResult - The Crawl4AI response object
   * @param url - URL being processed (for logging)
   * @returns Extracted content and the method used
   */
  private extractContent(crawlResult: any, url: string): ContentExtractionResult {
    logger.debug(`🔍 [CRAWL4AI] Starting content extraction`, {
      url,
      hasMarkdown: !!crawlResult.markdown,
      markdownType: typeof crawlResult.markdown
    });
    // Strategy 1: Try raw_markdown from markdown object (primary method)
    if (crawlResult.markdown?.raw_markdown) {
      const content = crawlResult.markdown.raw_markdown.trim();
      if (content && content.length > 10) { // Ensure meaningful content
        return { content, method: 'markdown.raw_markdown' };
      }
    }

    // Strategy 2: Try fit_markdown from markdown object
    if (crawlResult.markdown?.fit_markdown) {
      const content = crawlResult.markdown.fit_markdown.trim();
      if (content && content.length > 10) {
        return { content, method: 'markdown.fit_markdown' };
      }
    }

    // Strategy 3: Try markdown_with_citations from markdown object
    if (crawlResult.markdown?.markdown_with_citations) {
      const content = crawlResult.markdown.markdown_with_citations.trim();
      if (content && content.length > 10) {
        return { content, method: 'markdown.markdown_with_citations' };
      }
    }

    // Strategy 4: Try direct markdown field (backward compatibility)
    if (typeof crawlResult.markdown === 'string') {
      const content = crawlResult.markdown.trim();
      if (content && content.length > 10) {
        return { content, method: 'markdown_string' };
      }
    }

    // Strategy 5: Try extracted_content field
    if (crawlResult.extracted_content) {
      const content = crawlResult.extracted_content.trim();
      if (content && content.length > 10) {
        return { content, method: 'extracted_content' };
      }
    }

    // Strategy 6: Try to extract from cleaned_html (last resort)
    if (crawlResult.cleaned_html) {
      const content = this.htmlToText(crawlResult.cleaned_html);
      if (content && content.length > 10) {
        return { content, method: 'cleaned_html_conversion' };
      }
    }

    // Strategy 7: Try to extract from regular html (very last resort)
    if (crawlResult.html) {
      const content = this.htmlToText(crawlResult.html);
      if (content && content.length > 50) { // Higher threshold for raw HTML
        return { content, method: 'html_conversion' };
      }
    }

    logger.warn(`🚫 [CRAWL4AI] All content extraction strategies failed`, {
      url,
      attemptedStrategies: [
        'markdown.raw_markdown',
        'markdown.fit_markdown',
        'markdown.markdown_with_citations',
        'markdown_string',
        'extracted_content',
        'cleaned_html_conversion',
        'html_conversion'
      ]
    });
    return { content: null, method: 'none' };
  }

  /**
   * Simple HTML to text conversion for fallback content extraction
   * @param html - HTML content to convert
   * @returns Plain text content
   */
  private htmlToText(html: string): string {
    if (!html) return '';
    
    return html
      // Remove script and style elements completely
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Replace common block elements with newlines
      .replace(/<\/?(div|p|br|h[1-6]|li|tr)[^>]*>/gi, '\n')
      // Remove all remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  async scrapeMultiplePages(urls: string[]): Promise<ScrapeResult[]> {
    const batchStartTime = Date.now();
    logger.info(`🤖 [CRAWL4AI] Starting batch scrape`, {
      urlCount: urls.length,
      urls: urls.slice(0, 5), // Log first 5 URLs for debugging
      timestamp: new Date().toISOString()
    });

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

    const batchDuration = Date.now() - batchStartTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalContentLength = results
      .filter(r => r.success && r.content)
      .reduce((sum, r) => sum + (r.content?.length || 0), 0);
    
    logger.info(`🎉 [CRAWL4AI] Batch scraping completed`, {
      urlCount: urls.length,
      successCount,
      failureCount,
      successRate: `${Math.round(successCount / urls.length * 100)}%`,
      totalDuration: `${batchDuration}ms`,
      avgDuration: `${Math.round(batchDuration / urls.length)}ms`,
      totalContentLength,
      avgContentLength: successCount > 0 ? Math.round(totalContentLength / successCount) : 0
    });
    
    // Log failure details if any
    if (failureCount > 0) {
      const failures = results
        .filter(r => !r.success)
        .map(r => ({ url: r.url, error: r.error, details: r.errorDetails }));
      logger.warn(`⚠️ [CRAWL4AI] Batch scraping failures:`, {
        failureCount,
        failures: failures.slice(0, 5) // First 5 failures for debugging
      });
    }
    
    return results;
  }
}

export const crawl4aiService = new Crawl4AIService();