import logger from '../utils/logger';
import { serpApiService } from './serpApiService';
import { geminiService } from './geminiService';

import { crawl4aiService, ScrapeResult } from './crawl4aiService';
import { AnalysisRequest, AnalysisReportWithMetadata } from '../types';

interface AnalysisStatus {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

class AnalysisService {
  private analysisStatus: Map<string, AnalysisStatus> = new Map();
  private analysisResults: Map<string, any> = new Map();
  
  async performAnalysis(analysisId: string, request: AnalysisRequest): Promise<any> {
    try {
      // Initialize processing steps
      const processingSteps = {
        serpApiStatus: 'pending',
        userPageStatus: 'pending', 
        competitorPagesStatus: 'pending',
        aiAnalysisStatus: 'pending'
      };
      
      // Update status
      this.updateStatus(analysisId, 'processing', 10);
      
      // Step 1: Get AI Overview from SerpAPI
      logger.info(`🔍 [SERPAPI] Fetching AI Overview for keyword: "${request.targetKeyword}"`);
      processingSteps.serpApiStatus = 'processing';
      
      const aiOverview = await serpApiService.getAIOverview(request.targetKeyword);
      
      if (!aiOverview) {
        processingSteps.serpApiStatus = 'failed';
        logger.error(`❌ [SERPAPI] CRITICAL: No search data returned for keyword: "${request.targetKeyword}"`);
        logger.error(`🚨 [SERPAPI] This could indicate:`);
        logger.error(`   - SERPAPI quota exceeded`);
        logger.error(`   - Network connectivity issues`);
        logger.error(`   - Invalid keyword format`);
        logger.error(`   - Regional restrictions for Taiwan (tw/zh-TW)`);
        throw new Error('No search data available for the given keyword');
      }
      
      processingSteps.serpApiStatus = 'completed';
      
      // Enhanced SERPAPI data validation and logging
      logger.info(`✅ [SERPAPI] Data retrieved successfully for: "${request.targetKeyword}"`);
      logger.info(`📊 [SERPAPI] Data quality metrics:`, {
        summaryLength: aiOverview.summaryText.length,
        referencesCount: aiOverview.references.length,
        fallbackUsed: aiOverview.fallbackUsed,
        source: aiOverview.source,
        summaryPreview: aiOverview.summaryText.substring(0, 100) + '...',
        referencesPreview: aiOverview.references.slice(0, 3),
      });
      
      // Data quality warnings
      if (aiOverview.summaryText.length < 100) {
        logger.warn(`⚠️ [SERPAPI] WARNING: AI Overview text is unusually short (${aiOverview.summaryText.length} chars)`);
      }
      
      if (aiOverview.references.length === 0) {
        logger.warn(`⚠️ [SERPAPI] WARNING: No references found in AI Overview`);
      }
      
      if (aiOverview.fallbackUsed) {
        logger.warn(`🔄 [SERPAPI] FALLBACK: Using ${aiOverview.source} data instead of native AI Overview`);
        logger.warn(`   This may result in lower quality analysis results`);
      }
      
      this.updateStatus(analysisId, 'processing', 30);
      
      // Step 2: Scrape user page with Crawl4AI
      logger.info(`🤖 [CRAWL4AI] Scraping user page: ${request.userPageUrl}`);
      processingSteps.userPageStatus = 'processing';

      let userPageResult: ScrapeResult = await crawl4aiService.scrapePage(request.userPageUrl);
      let userPageFallbackUsed = false; // This will now indicate if Crawl4AI itself failed

      if (userPageResult.success && userPageResult.content) {
        processingSteps.userPageStatus = 'completed';
        logger.info(`✅ [CRAWL4AI] User page scraped successfully:`, {
          url: userPageResult.url,
          contentLength: userPageResult.content.length,
          contentPreview: userPageResult.content.substring(0, 150) + '...',
          hasHeadings: userPageResult.headings && userPageResult.headings.length > 0,
          headingsCount: userPageResult.headings?.length || 0,
        });
      } else {
        processingSteps.userPageStatus = 'failed';
        logger.error(`❌ [CRAWL4AI] User page scraping failed:`, {
          url: request.userPageUrl,
          error: userPageResult.errorDetails,
          errorType: userPageResult.error,
          success: userPageResult.success,
        });
        logger.warn(`🔄 [GEMINI] FALLBACK: Using URL for Gemini URL Context feature as Crawl4AI failed.`);
        userPageFallbackUsed = true;
      }

      this.updateStatus(analysisId, 'processing', 40);

      // Step 3: Extract competitor URLs from search results and batch scrape with Crawl4AI
      const searchReferences = aiOverview.references || [];
      const additionalCompetitorUrls = request.competitorUrls || [];

      // Combine search references with user-provided URLs
      const allCompetitorUrls = [
        ...searchReferences.slice(0, 10), // Top 10 search references
        ...additionalCompetitorUrls
      ];

      // Remove duplicates and filter out user's own URL with robust comparison
      const uniqueCompetitorUrls = Array.from(new Set(allCompetitorUrls))
        .filter(url => !this.isSameUrl(url, request.userPageUrl));

      const dataSource = aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview';
      
      // Enhanced logging for URL deduplication
      logger.info(`🔍 [URL_FILTER] URL deduplication results:`, {
        userPageUrl: request.userPageUrl,
        totalSourceUrls: allCompetitorUrls.length,
        uniqueSourceUrls: Array.from(new Set(allCompetitorUrls)).length,
        finalCompetitorUrls: uniqueCompetitorUrls.length,
        duplicatesRemoved: Array.from(new Set(allCompetitorUrls)).length - uniqueCompetitorUrls.length,
        searchReferences: searchReferences.length,
        additionalUrls: additionalCompetitorUrls.length
      });
      
      // Log which URLs were filtered out
      const allUniqueUrls = Array.from(new Set(allCompetitorUrls));
      const filteredOutUrls = allUniqueUrls.filter(url => this.isSameUrl(url, request.userPageUrl));
      if (filteredOutUrls.length > 0) {
        logger.info(`🚫 [URL_FILTER] Filtered out user's URL variants:`, {
          userPageUrl: request.userPageUrl,
          filteredUrls: filteredOutUrls
        });
      }
      
      logger.info(`Found ${searchReferences.length} references from ${dataSource}, ${additionalCompetitorUrls.length} additional URLs`);
      logger.info(`🤖 [CRAWL4AI] Batch scraping ${uniqueCompetitorUrls.length} competitor pages`);
      processingSteps.competitorPagesStatus = 'processing';

      let competitorResults: ScrapeResult[] = [];

      try {
        competitorResults = await crawl4aiService.scrapeMultiplePages(uniqueCompetitorUrls);
        
        const successfulScrapes = competitorResults.filter(r => r.success);
        const failedScrapes = competitorResults.filter(r => !r.success);

        if (successfulScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'completed';
          logger.info(`Competitor pages scraped: ${successfulScrapes.length} successful out of ${uniqueCompetitorUrls.length} attempted`);
        } else if (failedScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'partial';
          logger.warn(`Competitor page scraping partially failed: ${failedScrapes.length} failed.`);
        } else {
          processingSteps.competitorPagesStatus = 'failed';
          logger.warn(`All competitor page scraping failed.`);
        }

      } catch (error: any) {
        processingSteps.competitorPagesStatus = 'failed';
        logger.warn(`Competitor page batch scraping failed: ${error.message}. URLs will be passed for Gemini fallback.`);
        // Create empty results for failed competitors so they can be processed by Gemini URL Context
        competitorResults = uniqueCompetitorUrls.map(url => ({
          url,
          success: false,
          content: null,
          error: 'Batch scraping failed',
          errorDetails: error.message,
          headings: [],
          title: undefined,
          metaDescription: undefined
        }));
      }

      // Note: scrapedContent is no longer used in the prompt - data is passed as structured JSON

      this.updateStatus(analysisId, 'processing', 60);

      // Step 4: Final Gap Analysis with available content (now Phase 3 in new workflow)
      logger.info('Performing content gap analysis with Gemini');
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: AnalysisReportWithMetadata; // Updated to use standardized interface

      try {
        // Prepare crawled content for the v6.0 prompt format
        let crawledContent = '';
        const allScrapedPages = [userPageResult, ...competitorResults];

        allScrapedPages.forEach(page => {
          if (page.success && page.content) {
            crawledContent += `--- START OF CONTENT FOR ${page.url} ---\n${page.content}\n--- END OF CONTENT FOR ${page.url} ---\n\n`;
          }
        });

        // Prepare cited URLs list for the prompt
        const citedUrls = aiOverview.references.join('\n');
        
        logger.info(`🚀 [GEMINI] Using v6.0 ultimate instruction prompt...`);

        // Prepare data for the v6.0 prompt template
        const promptData = {
          targetKeyword: request.targetKeyword,
          userPageUrl: request.userPageUrl,
          aiOverviewContent: aiOverview.summaryText,
          citedUrls: citedUrls,
          crawledContent: crawledContent
        };

        // Create userPage object from scraped result for compatibility
        const userPage = {
          url: request.userPageUrl,
          cleanedContent: userPageResult.success ? (userPageResult.content || '') : '',
          headings: userPageResult.headings || [],
          title: userPageResult.title || '',
          metaDescription: userPageResult.metaDescription || ''
        };

        // Create competitorPages from scraped results for compatibility
        const competitorPages = competitorResults.map(result => ({
          url: result.url,
          cleanedContent: result.success ? (result.content || '') : '',
          headings: result.headings || [],
          title: result.title || '',
          metaDescription: result.metaDescription || ''
        }));

        // Construct GeminiInput object for the service - using new v6.0 approach
        const geminiInput = {
          targetKeyword: request.targetKeyword,
          aiOverview: aiOverview,
          userPage: userPage,
          competitorPages: competitorPages,
          jobId: analysisId,
          // v6.0 prompt data
          promptData: promptData
        };

        const baseResult = await geminiService.analyzeContentGap(geminiInput);
        
        // Add metadata to convert AnalysisReport to AnalysisReportWithMetadata
        analysisResult = {
          ...baseResult,
          analysisId,
          timestamp: new Date().toISOString(),
          aiOverviewData: aiOverview,
          competitorUrls: aiOverview.references,
          processingSteps,
          usedFallbackData: false
        };

        logger.info(`✅ [GEMINI] AI analysis completed successfully using v6.0 workflow`);

        processingSteps.aiAnalysisStatus = 'completed';
      } catch (error: any) {
        logger.error(`❌ [GEMINI] CRITICAL: AI analysis failed:`, {
          errorMessage: error.message,
          errorStack: error.stack,
          errorName: error.name,
          analysisId,
          targetKeyword: request.targetKeyword,
        });

        processingSteps.aiAnalysisStatus = 'failed';

        logger.warn(`🔄 [GEMINI] FALLBACK: Generating basic analysis due to Gemini failure`);
        // Provide a basic fallback analysis
        analysisResult = this.generateFallbackAnalysis(request.targetKeyword, aiOverview); // Renamed fallback function
      }

      this.updateStatus(analysisId, 'processing', 90);

      // Step 5: Prepare final result with enhanced data (now Phase 4 in new workflow)
      logger.info('Preparing final AnalysisReport', {
        analysisId,
        hasStrategyAndPlan: !!analysisResult.strategyAndPlan,
        p1ImmediateLength: analysisResult.strategyAndPlan?.p1_immediate?.length || 0,
        hasWebsiteAssessment: !!analysisResult.websiteAssessment,
        contentGapsLength: analysisResult.websiteAssessment?.contentGaps?.length || 0,
      });

      const finalResult = {
        ...analysisResult, // Directly use the analysisResult as it's already AnalysisReport
        analysisId,
        timestamp: new Date().toISOString(),
        aiOverviewData: {
          ...aiOverview,
          dataSource: aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview'
        },
        competitorUrls: uniqueCompetitorUrls,
        processingSteps,
        usedFallbackData: aiOverview.fallbackUsed || userPageFallbackUsed || false,
        qualityAssessment: {
          score: 0, // Will be calculated below
          level: this.assessAnalysisQuality(
            processingSteps,
            competitorResults.filter(r => r.success).length,
            uniqueCompetitorUrls.length
          ),
          completedSteps: Object.values(processingSteps).filter(status => status === 'completed').length,
          totalSteps: 4, // Changed from 5 to 4 stages
          criticalFailures: Object.values(processingSteps).filter(status => status === 'failed').length,
          fallbacksUsed: [] // This needs more sophisticated tracking if needed
        }
      };

      // Calculate score based on quality level
      switch (finalResult.qualityAssessment!.level) {
        case 'excellent': finalResult.qualityAssessment!.score = 90; break;
        case 'good': finalResult.qualityAssessment!.score = 75; break;
        case 'fair': finalResult.qualityAssessment!.score = 60; break;
        case 'poor': finalResult.qualityAssessment!.score = 30; break;
      }

      // Store result
      this.analysisResults.set(analysisId, finalResult);
      this.updateStatus(analysisId, 'completed', 100);

      return finalResult;
    } catch (error: any) {
      logger.error(`Analysis failed for ${analysisId}`, error);
      this.updateStatus(analysisId, 'failed', 0, error.message);
      throw error;
    }
  }
  
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus | null> {
    return this.analysisStatus.get(analysisId) || null;
  }
  
  async getAnalysisResult(analysisId: string): Promise<any | null> {
    return this.analysisResults.get(analysisId) || null;
  }
  
  private updateStatus(
    analysisId: string, 
    status: AnalysisStatus['status'], 
    progress?: number,
    error?: string
  ) {
    this.analysisStatus.set(analysisId, {
      analysisId,
      status,
      progress,
      error
    });
  }
  
  /**
   * Assess the quality of analysis based on successful processing steps
   */
  private assessAnalysisQuality(
    processingSteps: any,
    successfulCompetitors: number,
    totalCompetitors: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;
    
    // AI Overview/search data available
    if (processingSteps.serpApiStatus === 'completed') score += 25;
    
    // User page scraped successfully
    if (processingSteps.userPageStatus === 'completed') score += 25;
    
    // Competitor pages success rate
    const competitorSuccessRate = totalCompetitors > 0 ? successfulCompetitors / totalCompetitors : 0;
    score += Math.floor(competitorSuccessRate * 25);
    
    
    
    // AI analysis success
    if (processingSteps.aiAnalysisStatus === 'completed') score += 10;
    
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Generate a basic fallback AnalysisReport when AI analysis fails
   */
  private generateFallbackAnalysis(targetKeyword: string, _aiOverview: any): AnalysisReportWithMetadata {
    return {
      strategyAndPlan: {
        p1_immediate: [
          {
            recommendation: `針對關鍵字 "${targetKeyword}" 建立基礎內容。`, 
            geminiPrompt: `請為關鍵字 "${targetKeyword}" 撰寫一篇介紹性文章，內容應包含基本定義、重要性及應用場景。`
          }
        ],
        p2_mediumTerm: [],
        p3_longTerm: []
      },
      keywordIntent: {
        coreIntent: `了解 "${targetKeyword}" 的基本資訊。`,
        latentIntents: []
      },
      aiOverviewAnalysis: {
        summary: `由於分析失敗，無法提供 "${targetKeyword}" 的 AI Overview 摘要。`,
        presentationAnalysis: '無'
      },
      citedSourceAnalysis: [],
      websiteAssessment: {
        contentSummary: `無法評估 "${targetKeyword}" 相關的用戶頁面內容。`,
        contentGaps: [`缺少關於 "${targetKeyword}" 的詳細內容。`],
        pageExperience: '無法評估',
        structuredDataRecs: '無建議'
      },
      reportFooter: '本報告由於分析過程中遇到技術問題，僅提供基礎建議。建議重新執行完整分析以獲得更詳細的洞察。',
      
      // Required metadata fields
      analysisId: 'fallback-' + Date.now(),
      timestamp: new Date().toISOString(),
      usedFallbackData: true
    };
  }

  

  /**
   * Robust URL comparison that handles common variations
   * @param url1 - First URL to compare
   * @param url2 - Second URL to compare
   * @returns true if URLs are considered the same
   */
  private isSameUrl(url1: string, url2: string): boolean {
    try {
      // Normalize both URLs
      const normalizedUrl1 = this.normalizeUrl(url1);
      const normalizedUrl2 = this.normalizeUrl(url2);
      
      const result = normalizedUrl1 === normalizedUrl2;
      
      // Log URL comparison for debugging
      if (result) {
        logger.debug(`🔍 [URL_FILTER] URLs matched:`, {
          original1: url1,
          original2: url2,
          normalized1: normalizedUrl1,
          normalized2: normalizedUrl2
        });
      }
      
      return result;
    } catch (error) {
      // If URL parsing fails, fall back to simple string comparison
      logger.warn(`⚠️ [URL_FILTER] URL parsing failed, using simple comparison:`, {
        url1,
        url2,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return url1 === url2;
    }
  }

  /**
   * Normalize URL for comparison by handling common variations
   * @param url - URL to normalize
   * @returns normalized URL string
   */
  private normalizeUrl(url: string): string {
    // Handle URLs that might not have a protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    const urlObj = new URL(normalizedUrl);
    
    // Normalize protocol to https
    urlObj.protocol = 'https:';
    
    // Remove www prefix for comparison
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
    
    // Remove trailing slash from pathname
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    // Sort query parameters for consistent comparison
    urlObj.searchParams.sort();
    
    // Remove hash fragment for comparison
    urlObj.hash = '';
    
    return urlObj.toString();
  }

}

export const analysisService = new AnalysisService();