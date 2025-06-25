import axios from 'axios';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';


class SerpApiService {
  private apiKey: string;
  private baseUrl: string = 'https://serpapi.com/search.json';
  
  // 台灣手機版搜尋設定
  private readonly SEARCH_CONFIG = {
    gl: 'tw',                    // 地理位置：台灣
    hl: 'zh-TW',                 // 語言：繁體中文
    device: 'mobile',            // 裝置：手機版面
    google_domain: 'google.com.tw'  // Google 網域：台灣
  };
  
  constructor() {
    this.apiKey = ''; // Will be initialized when needed
  }
  
  private initializeIfNeeded() {
    if (!this.apiKey) {
      this.apiKey = process.env.SERPAPI_KEY || '';
      if (!this.apiKey || this.apiKey.trim() === '') {
        logger.warn('SerpAPI key not configured');
        throw new Error('SerpAPI key not configured');
      } else {
        logger.info('SerpAPI key configured successfully');
      }
    }
  }
  
  async getAIOverview(keyword: string): Promise<{
    summaryText: string;
    references: string[];
    fallbackUsed?: boolean;
    source?: 'ai_overview' | 'organic_results' | 'fallback';
  } | null> {
    this.initializeIfNeeded();
    
    try {
      logger.info(`=== SERPAPI CALL START ===`);
      logger.info(`Fetching AI Overview for keyword: "${keyword}"`);
      logger.info(`SerpAPI endpoint: ${this.baseUrl}`);
      
      // Step 1: Get regular Google search results first
      const searchResponse = await axios.get<any>(this.baseUrl, {
        params: {
          q: keyword,
          api_key: this.apiKey,
          engine: 'google',
          ...this.SEARCH_CONFIG
        },
        timeout: 30000
      });
      
      if (searchResponse.data.error) {
        throw new AppError(
          `SerpAPI search error: ${searchResponse.data.error}`,
          500,
          'SERPAPI_ERROR'
        );
      }
      
      logger.info('Google search completed successfully');
      logger.info(`Response received: ${JSON.stringify(searchResponse.data).length} characters`);
      
      // Check if AI Overview is available in the search results
      const aiOverview = searchResponse.data.ai_overview;
      if (!aiOverview) {
        logger.info(`=== NO AI OVERVIEW FOUND ===`);
        logger.info(`No AI Overview found for keyword: "${keyword}", trying fallback strategies`);
        logger.info(`Note: AI Overview currently has limited support for zh-TW language`);
        const fallbackResult = this.getFallbackOverviewData(searchResponse.data, keyword);
        logger.info(`Fallback result: ${fallbackResult ? 'SUCCESS' : 'FAILED'}`);
        logger.info(`=== SERPAPI CALL END (FALLBACK) ===`);
        return fallbackResult;
      }
      
      // If we have ai_overview with page_token, fetch detailed AI Overview
      if (aiOverview.page_token) {
        logger.info('=== AI OVERVIEW PAGE TOKEN FOUND ===');
        logger.info(`Found AI Overview page_token: ${aiOverview.page_token.substring(0, 20)}...`);
        logger.info('Fetching detailed AI Overview via page token...');
        
        const overviewResponse = await axios.get<any>(this.baseUrl, {
          params: {
            engine: 'google_ai_overview',
            page_token: aiOverview.page_token,
            api_key: this.apiKey,
            gl: this.SEARCH_CONFIG.gl,
            hl: this.SEARCH_CONFIG.hl,
            device: this.SEARCH_CONFIG.device
          },
          timeout: 30000
        });
        
        if (overviewResponse.data.error) {
          logger.warn(`AI Overview detail fetch failed: ${overviewResponse.data.error}`);
          // Fall back to basic AI Overview data
        } else {
          logger.info('Detailed AI Overview fetched successfully');
          const detailedOverview = overviewResponse.data.ai_overview;
          const summaryText = this.extractTextFromBlocks(detailedOverview.text_blocks) || aiOverview.text || '';
          const references = this.extractReferences(detailedOverview.references) || [];
          
          logger.info(`AI Overview extracted: ${summaryText.length} chars, ${references.length} references`);
          logger.info(`=== SERPAPI CALL END (SUCCESS - DETAILED) ===`);
          
          return {
            summaryText,
            references,
            source: 'ai_overview',
            fallbackUsed: false
          };
        }
      }
      
      // Fallback to basic AI Overview data from search results
      logger.info('=== USING BASIC AI OVERVIEW ===');
      logger.info('Using basic AI Overview data from search results');
      
      // Try to extract text from text_blocks if available
      let summaryText = '';
      if (aiOverview.text_blocks) {
        summaryText = this.extractTextFromBlocks(aiOverview.text_blocks);
        logger.info(`Extracted summary from text_blocks: ${summaryText.length} characters`);
      } else if (aiOverview.text) {
        summaryText = aiOverview.text;
      }
      
      // Try to extract references from different possible locations
      let references: string[] = [];
      if (aiOverview.references) {
        references = this.extractReferences(aiOverview.references);
        logger.info(`Extracted ${references.length} references from ai_overview.references`);
      } else if (aiOverview.sources) {
        references = aiOverview.sources.map((s: any) => s.link).filter(Boolean);
        logger.info(`Extracted ${references.length} references from ai_overview.sources`);
      }
      
      logger.info(`Basic AI Overview extracted: ${summaryText.length} chars, ${references.length} references`);
      logger.info(`=== SERPAPI CALL END (SUCCESS - BASIC) ===`);
      
      return {
        summaryText,
        references,
        source: 'ai_overview',
        fallbackUsed: false
      };
      
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      
      logger.error('SerpAPI request failed:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Re-throw the error to be handled by the controller
      logger.error('SerpAPI call failed, re-throwing error');
      
      throw new AppError(
        'Failed to fetch AI Overview',
        500,
        'SERPAPI_FETCH_ERROR'
      );
    }
  }
  
  private extractTextFromBlocks(textBlocks: any[]): string {
    if (!Array.isArray(textBlocks)) return '';
    
    return textBlocks.map(block => {
      // Handle different block types
      if (typeof block === 'string') return block;
      
      // Handle snippet field (main content)
      if (block.snippet) return block.snippet;
      
      // Handle list items
      if (block.list && Array.isArray(block.list)) {
        return block.list.map((item: any) => {
          return typeof item === 'string' ? item : (item.snippet || '');
        }).filter(Boolean).join('\n');
      }
      
      // Fallback to other possible fields
      if (block.text) return block.text;
      if (block.content) return block.content;
      
      return '';
    }).filter(Boolean).join('\n\n');
  }
  
  private extractReferences(references: any[]): string[] {
    if (!Array.isArray(references)) return [];
    
    return references.map(ref => {
      if (typeof ref === 'string') return ref;
      if (ref.link) return ref.link;
      if (ref.url) return ref.url;
      return '';
    }).filter(Boolean);
  }
  
  /**
   * Fallback method to extract overview-like data from regular search results
   */
  private getFallbackOverviewData(searchData: any, keyword: string): {
    summaryText: string;
    references: string[];
    fallbackUsed: boolean;
    source: 'organic_results' | 'fallback';
  } | null {
    try {
      // Try to extract from knowledge graph first
      if (searchData.knowledge_graph) {
        const kg = searchData.knowledge_graph;
        let summaryText = '';
        
        if (kg.description) {
          summaryText = kg.description;
        } else if (kg.attributes && Array.isArray(kg.attributes)) {
          summaryText = kg.attributes.map((attr: any) => `${attr.name}: ${attr.value}`).join('. ');
        }
        
        if (summaryText) {
          logger.info(`=== KNOWLEDGE GRAPH FALLBACK SUCCESS ===`);
          logger.info(`Using knowledge graph as fallback for "${keyword}"`);
          const references = this.extractUrlsFromOrganicResults(searchData.organic_results);
          logger.info(`Knowledge graph fallback: ${summaryText.length} chars, ${references.length} references`);
          return {
            summaryText,
            references,
            fallbackUsed: true,
            source: 'fallback'
          };
        }
      }
      
      // Try to extract from organic results snippets
      if (searchData.organic_results && Array.isArray(searchData.organic_results)) {
        const topResults = searchData.organic_results.slice(0, 5);
        const snippets = topResults
          .map((result: any) => result.snippet)
          .filter(Boolean)
          .join(' ');
        
        if (snippets.length > 100) {
          logger.info(`=== ORGANIC RESULTS FALLBACK SUCCESS ===`);
          logger.info(`Using organic results snippets as fallback for "${keyword}"`);
          const references = this.extractUrlsFromOrganicResults(searchData.organic_results);
          const summaryText = `Based on search results: ${snippets.substring(0, 500)}...`;
          logger.info(`Organic results fallback: ${summaryText.length} chars, ${references.length} references`);
          return {
            summaryText,
            references,
            fallbackUsed: true,
            source: 'organic_results'
          };
        }
      }
      
      // Last resort: create minimal overview
      logger.warn(`=== MINIMAL FALLBACK USED ===`);
      logger.warn(`No suitable fallback data found for "${keyword}"`);
      const references = this.extractUrlsFromOrganicResults(searchData.organic_results) || [];
      const summaryText = `Search results for "${keyword}" - No AI Overview available. Analysis will focus on competitor comparison.`;
      logger.info(`Minimal fallback: ${summaryText.length} chars, ${references.length} references`);
      return {
        summaryText,
        references,
        fallbackUsed: true,
        source: 'fallback'
      };
      
    } catch (error) {
      logger.error('Fallback data extraction failed:', error);
      return null;
    }
  }
  
  /**
   * Extract URLs from organic search results
   */
  private extractUrlsFromOrganicResults(organicResults: any[]): string[] {
    if (!Array.isArray(organicResults)) return [];
    
    return organicResults
      .slice(0, 10) // Top 10 results
      .map(result => result.link)
      .filter(Boolean);
  }
}

let serpApiServiceInstance: SerpApiService | null = null;

export const serpApiService = {
  getInstance(): SerpApiService {
    if (!serpApiServiceInstance) {
      serpApiServiceInstance = new SerpApiService();
    }
    return serpApiServiceInstance;
  },
  
  getAIOverview(keyword: string): Promise<{
    summaryText: string;
    references: string[];
    fallbackUsed?: boolean;
    source?: 'ai_overview' | 'organic_results' | 'fallback';
  } | null> {
    return this.getInstance().getAIOverview(keyword);
  }
};