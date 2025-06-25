import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger';
import { PageContent } from '../types';

class ContentScraperService {
  async scrapePage(url: string): Promise<PageContent> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();
      
      // Extract headings
      const headings: string[] = [];
      $('h1, h2, h3, h4, h5, h6').each((_, element) => {
        const text = $(element).text().trim();
        if (text) {
          const tag = element.tagName.toUpperCase();
          headings.push(`${tag}: ${text}`);
        }
      });
      
      // Extract main content
      const mainContent = $('main, article, [role="main"], .content, #content')
        .first()
        .text()
        .trim();
      
      const bodyContent = mainContent || $('body').text().trim();
      
      // Clean content
      const cleanedContent = bodyContent
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Extract title and meta description
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      return {
        url,
        cleanedContent,
        headings,
        title,
        metaDescription
      };
    } catch (error: any) {
      logger.error(`Failed to scrape ${url}`, error);
      throw new Error(`Failed to scrape content from ${url}`);
    }
  }
  
  async scrapeMultiplePages(urls: string[]): Promise<PageContent[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.scrapePage(url))
    );
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<PageContent>).value);
  }
}

export const contentScraperService = new ContentScraperService();