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
    const startTime = Date.now();
    
    logger.info(`🚀 [ANALYSIS] Starting analysis for job ${analysisId}`, {
      targetKeyword: request.targetKeyword,
      userPageUrl: request.userPageUrl,
      competitorUrlsCount: request.competitorUrls?.length || 0,
      timestamp: new Date().toISOString()
    });
    
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
      const crawlStartTime = Date.now();
      logger.info(`🤖 [CRAWL4AI] Starting user page scraping`, {
        url: request.userPageUrl,
        analysisId
      });
      processingSteps.userPageStatus = 'processing';

      let userPageResult: ScrapeResult = await crawl4aiService.scrapePage(request.userPageUrl);
      let userPageFallbackUsed = false; // This will now indicate if Crawl4AI itself failed

      const crawlDuration = Date.now() - crawlStartTime;
      
      if (userPageResult.success && userPageResult.content) {
        processingSteps.userPageStatus = 'completed';
        logger.info(`✅ [CRAWL4AI] User page scraped successfully:`, {
          url: userPageResult.url,
          contentLength: userPageResult.content.length,
          contentPreview: userPageResult.content.substring(0, 150) + '...',
          hasHeadings: userPageResult.headings && userPageResult.headings.length > 0,
          headingsCount: userPageResult.headings?.length || 0,
          crawlDuration: `${crawlDuration}ms`,
          contentQuality: this.assessContentQuality(userPageResult.content)
        });
      } else {
        processingSteps.userPageStatus = 'failed';
        logger.error(`❌ [CRAWL4AI] User page scraping failed:`, {
          url: request.userPageUrl,
          error: userPageResult.errorDetails,
          errorType: userPageResult.error,
          success: userPageResult.success,
          crawlDuration: `${crawlDuration}ms`,
          contentLength: userPageResult.content?.length || 0
        });
        logger.warn(`🔄 [GEMINI] FALLBACK: Using URL for Gemini URL Context feature as Crawl4AI failed.`);
        userPageFallbackUsed = true;
      }

      this.updateStatus(analysisId, 'processing', 40);

      // Step 3: Extract competitor URLs from search results and batch scrape with Crawl4AI
      const searchReferences = aiOverview.references || [];
      const additionalCompetitorUrls = request.competitorUrls || [];

      logger.info(`📊 [URL_PROCESSING] Preparing competitor URLs`, {
        searchReferencesCount: searchReferences.length,
        additionalUrlsCount: additionalCompetitorUrls.length,
        analysisId
      });

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
      
      const batchCrawlStartTime = Date.now();
      logger.info(`🤖 [CRAWL4AI] Starting batch scraping`, {
        totalUrls: uniqueCompetitorUrls.length,
        urls: uniqueCompetitorUrls.slice(0, 5), // Log first 5 URLs for debugging
        analysisId
      });
      processingSteps.competitorPagesStatus = 'processing';

      let competitorResults: ScrapeResult[] = [];

      try {
        competitorResults = await crawl4aiService.scrapeMultiplePages(uniqueCompetitorUrls);
        
        const successfulScrapes = competitorResults.filter(r => r.success);
        const failedScrapes = competitorResults.filter(r => !r.success);
        const batchCrawlDuration = Date.now() - batchCrawlStartTime;

        // Log detailed content statistics
        const contentStats = successfulScrapes.map(scrape => ({
          url: scrape.url,
          contentLength: scrape.content?.length || 0,
          hasTitle: !!scrape.title,
          hasMetaDescription: !!scrape.metaDescription,
          headingsCount: scrape.headings?.length || 0
        }));

        if (successfulScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'completed';
          logger.info(`✅ [CRAWL4AI] Competitor batch scraping completed`, {
            successful: successfulScrapes.length,
            failed: failedScrapes.length,
            total: uniqueCompetitorUrls.length,
            duration: `${batchCrawlDuration}ms`,
            avgDuration: `${Math.round(batchCrawlDuration / uniqueCompetitorUrls.length)}ms`,
            contentStats: contentStats.slice(0, 5), // Log first 5 for debugging
            totalContentLength: contentStats.reduce((sum, stat) => sum + stat.contentLength, 0)
          });
        } else if (failedScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'partial';
          logger.warn(`⚠️ [CRAWL4AI] Competitor scraping partially failed`, {
            failed: failedScrapes.length,
            failedUrls: failedScrapes.map(f => ({ url: f.url, error: f.error }))
          });
        } else {
          processingSteps.competitorPagesStatus = 'failed';
          logger.warn(`❌ [CRAWL4AI] All competitor page scraping failed`);
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
      const geminiStartTime = Date.now();
      logger.info(`🧠 [GEMINI] Starting AI analysis phase`, {
        analysisId,
        targetKeyword: request.targetKeyword
      });
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: AnalysisReportWithMetadata; // Updated to use standardized interface

      try {
        // Prepare crawled content for the v6.0 prompt format
        let crawledContent = '';
        const allScrapedPages = [userPageResult, ...competitorResults];
        let contentPrepStats = {
          totalPages: allScrapedPages.length,
          successfulPages: 0,
          totalContentLength: 0,
          pagesWithContent: [] as Array<{ url: string; contentLength: number; }>
        };

        allScrapedPages.forEach(page => {
          if (page.success && page.content) {
            const pageContent = `--- URL: ${page.url} ---\n${page.content}\n\n`;
            crawledContent += pageContent;
            contentPrepStats.successfulPages++;
            contentPrepStats.totalContentLength += page.content.length;
            contentPrepStats.pagesWithContent.push({
              url: page.url,
              contentLength: page.content.length
            });
          }
        });

        // Prepare cited URLs list for the prompt
        const citedUrls = aiOverview.references.join('\n');
        
        logger.info(`📝 [CONTENT_PREP] Prepared content for Gemini`, {
          ...contentPrepStats,
          citedUrlsCount: aiOverview.references.length,
          aiOverviewLength: aiOverview.summaryText.length,
          crawledContentTotalLength: crawledContent.length,
          analysisId
        });
        
        logger.info(`🚀 [GEMINI] Using v6.0 ultimate instruction prompt...`);

        // Prepare data for the v6.0 prompt template
        const promptData = {
          targetKeyword: request.targetKeyword,
          userPageUrl: request.userPageUrl,
          aiOverviewContent: aiOverview.summaryText,
          citedUrls: citedUrls,
          crawledContent: crawledContent
        };
        
        logger.info(`📊 [PROMPT_DATA] Prompt data prepared`, {
          targetKeyword: promptData.targetKeyword,
          userPageUrl: promptData.userPageUrl,
          aiOverviewContentLength: promptData.aiOverviewContent.length,
          citedUrlsLength: promptData.citedUrls.length,
          crawledContentLength: promptData.crawledContent.length,
          aiOverviewPreview: promptData.aiOverviewContent.substring(0, 100) + '...',
          analysisId
        });

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
        const geminiDuration = Date.now() - geminiStartTime;
        
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

        // Log analysis result quality
        const resultQuality = this.assessAnalysisResultQuality(baseResult);
        logger.info(`✅ [GEMINI] AI analysis completed successfully`, {
          duration: `${geminiDuration}ms`,
          workflow: 'v6.0',
          resultQuality,
          hasImmediateActions: baseResult.strategyAndPlan?.p1_immediate?.length > 0,
          hasMediumTermActions: baseResult.strategyAndPlan?.p2_mediumTerm?.length > 0,
          hasLongTermActions: baseResult.strategyAndPlan?.p3_longTerm?.length > 0,
          contentGapsFound: baseResult.websiteAssessment?.contentGaps?.length || 0,
          citedSourcesAnalyzed: baseResult.citedSourceAnalysis?.length || 0,
          analysisId
        });

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
      const totalDuration = Date.now() - startTime;
      
      logger.info(`📋 [FINAL_PREP] Preparing final analysis report`, {
        analysisId,
        hasStrategyAndPlan: !!analysisResult.strategyAndPlan,
        p1ImmediateLength: analysisResult.strategyAndPlan?.p1_immediate?.length || 0,
        p2MediumTermLength: analysisResult.strategyAndPlan?.p2_mediumTerm?.length || 0,
        p3LongTermLength: analysisResult.strategyAndPlan?.p3_longTerm?.length || 0,
        hasWebsiteAssessment: !!analysisResult.websiteAssessment,
        contentGapsLength: analysisResult.websiteAssessment?.contentGaps?.length || 0,
        citedSourcesAnalyzed: analysisResult.citedSourceAnalysis?.length || 0,
        totalDuration: `${totalDuration}ms`
      });

      const finalResult = {
        ...analysisResult, // Directly use the analysisResult as it's already AnalysisReport
        analysisId,
        timestamp: new Date().toISOString(),
        targetKeyword: request.targetKeyword,
        userPageUrl: request.userPageUrl,
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

      logger.info(`🎉 [ANALYSIS] Analysis completed successfully`, {
        analysisId,
        totalDuration: `${totalDuration}ms`,
        qualityScore: finalResult.qualityAssessment!.score,
        qualityLevel: finalResult.qualityAssessment!.level,
        completedSteps: finalResult.qualityAssessment!.completedSteps,
        totalSteps: finalResult.qualityAssessment!.totalSteps,
        usedFallbackData: finalResult.usedFallbackData
      });

      return finalResult;
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      logger.error(`❌ [ANALYSIS] Analysis failed`, {
        analysisId,
        error: error.message,
        stack: error.stack,
        totalDuration: `${totalDuration}ms`,
        targetKeyword: request.targetKeyword,
        userPageUrl: request.userPageUrl
      });
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
   * Assess content quality based on length and structure
   */
  private assessContentQuality(content: string | null): string {
    if (!content) return 'empty';
    const length = content.length;
    if (length < 100) return 'minimal';
    if (length < 500) return 'short';
    if (length < 2000) return 'moderate';
    if (length < 10000) return 'comprehensive';
    return 'extensive';
  }

  /**
   * Assess the quality of Gemini analysis results
   */
  private assessAnalysisResultQuality(result: any): {
    completeness: number;
    recommendationQuality: string;
    contentGapIdentification: string;
    overallQuality: string;
  } {
    let completeness = 0;
    let recommendationCount = 0;
    let contentGapCount = 0;

    // Check strategy and plan completeness
    if (result.strategyAndPlan) {
      if (result.strategyAndPlan.p1_immediate?.length > 0) {
        completeness += 30;
        recommendationCount += result.strategyAndPlan.p1_immediate.length;
      }
      if (result.strategyAndPlan.p2_mediumTerm?.length > 0) {
        completeness += 20;
        recommendationCount += result.strategyAndPlan.p2_mediumTerm.length;
      }
      if (result.strategyAndPlan.p3_longTerm?.length > 0) {
        completeness += 10;
        recommendationCount += result.strategyAndPlan.p3_longTerm.length;
      }
    }

    // Check other required sections
    if (result.keywordIntent?.coreIntent) completeness += 10;
    if (result.aiOverviewAnalysis?.summary) completeness += 10;
    if (result.citedSourceAnalysis?.length > 0) completeness += 10;
    if (result.websiteAssessment?.contentGaps?.length > 0) {
      completeness += 10;
      contentGapCount = result.websiteAssessment.contentGaps.length;
    }

    // Determine quality ratings
    const recommendationQuality = 
      recommendationCount >= 5 ? 'excellent' :
      recommendationCount >= 3 ? 'good' :
      recommendationCount >= 1 ? 'fair' : 'poor';

    const contentGapIdentification = 
      contentGapCount >= 5 ? 'comprehensive' :
      contentGapCount >= 3 ? 'adequate' :
      contentGapCount >= 1 ? 'minimal' : 'none';

    const overallQuality = 
      completeness >= 90 ? 'excellent' :
      completeness >= 70 ? 'good' :
      completeness >= 50 ? 'fair' : 'poor';

    return {
      completeness,
      recommendationQuality,
      contentGapIdentification,
      overallQuality
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