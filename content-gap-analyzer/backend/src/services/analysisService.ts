import logger from '../utils/logger';
import { serpApiService } from './serpApiService';
import { playwrightService } from './playwrightService';
import { openaiService } from './geminiService';
import { contentRefinementService } from './contentRefinementService';
import { firecrawlService } from './firecrawlService';
import { AnalysisRequest, AnalysisResult } from '../types';

interface AnalysisStatus {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

class AnalysisService {
  private analysisStatus: Map<string, AnalysisStatus> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();
  
  async performAnalysis(analysisId: string, request: AnalysisRequest, jobId?: string): Promise<AnalysisResult> {
    try {
      // Initialize processing steps
      const processingSteps = {
        serpApiStatus: 'pending',
        userPageStatus: 'pending', 
        competitorPagesStatus: 'pending',
        contentRefinementStatus: 'pending',
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
      
      // Step 2: Scrape user page with Playwright (Primary)
      logger.info(`🎭 [PLAYWRIGHT] Scraping user page: ${request.userPageUrl}`);
      processingSteps.userPageStatus = 'processing';

      let userPageResult = await playwrightService.scrapePage(request.userPageUrl);
      let userPageContentForPrompt = '';
      let userPageFallbackUsed = false; // New variable to track user page fallback
      let userPageScrapeSource = 'none'; // 'playwright', 'firecrawl', 'gemini_url_context'

      if (userPageResult.success && userPageResult.content) {
        processingSteps.userPageStatus = 'completed';
        userPageScrapeSource = 'playwright';
        logger.info(`✅ [PLAYWRIGHT] User page scraped successfully:`, {
          url: userPageResult.url,
          contentLength: userPageResult.content.length,
          contentPreview: userPageResult.content.substring(0, 150) + '...',
          hasHeadings: userPageResult.headings && userPageResult.headings.length > 0,
          headingsCount: userPageResult.headings?.length || 0,
        });
        userPageContentForPrompt = `--- START OF CONTENT FOR ${userPageResult.url} ---\n${userPageResult.content}\n--- END OF CONTENT FOR ${userPageResult.url} ---\n\n`;
      } else {
        logger.error(`❌ [PLAYWRIGHT] User page scraping failed, attempting Firecrawl:`, {
          url: request.userPageUrl,
          error: userPageResult.errorDetails,
          errorType: userPageResult.error,
          success: userPageResult.success,
        });

        // Fallback to Firecrawl
        const firecrawlUserPageResult = await firecrawlService.scrapePage(request.userPageUrl);
        if (firecrawlUserPageResult.success && firecrawlUserPageResult.content) {
          processingSteps.userPageStatus = 'completed';
          userPageScrapeSource = 'firecrawl';
          userPageResult = firecrawlUserPageResult; // Use Firecrawl's result
          logger.info(`✅ [FIRECRAWL] User page scraped successfully (fallback):`, {
            url: userPageResult.url,
            contentLength: userPageResult.content.length,
            contentPreview: userPageResult.content.substring(0, 150) + '...',
          });
          userPageContentForPrompt = `--- START OF CONTENT FOR ${userPageResult.url} ---\n${userPageResult.content}\n--- END OF CONTENT FOR ${userPageResult.url} ---\n\n`;
        } else {
          processingSteps.userPageStatus = 'failed';
          userPageScrapeSource = 'gemini_url_context';
          logger.error(`❌ [FIRECRAWL] User page scraping failed, falling back to Gemini URL Context:`, {
            url: request.userPageUrl,
            error: firecrawlUserPageResult.errorDetails,
            success: firecrawlUserPageResult.success,
          });
          logger.warn(`🔄 [GEMINI] FALLBACK: Using URL for Gemini URL Context feature`);
          userPageContentForPrompt = `--- START OF CONTENT FOR ${userPageResult.url} (Playwright & Firecrawl failed, using URL Context) ---\n${userPageResult.url}\n--- END OF CONTENT FOR ${userPageResult.url} ---\n\n`;
          userPageFallbackUsed = true;
        }
      }

      this.updateStatus(analysisId, 'processing', 40);

      // Step 3: Extract competitor URLs from search results and batch scrape (Hybrid Approach)
      const searchReferences = aiOverview.references || [];
      const additionalCompetitorUrls = request.competitorUrls || [];

      // Combine search references with user-provided URLs
      const allCompetitorUrls = [
        ...searchReferences.slice(0, 10), // Top 10 search references
        ...additionalCompetitorUrls
      ];

      // Remove duplicates and filter out user's own URL
      const uniqueCompetitorUrls = [...new Set(allCompetitorUrls)]
        .filter(url => url !== request.userPageUrl);

      const dataSource = aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview';
      logger.info(`Found ${searchReferences.length} references from ${dataSource}, ${additionalCompetitorUrls.length} additional URLs`);
      logger.info(`Playwright batch scraping ${uniqueCompetitorUrls.length} competitor pages`);
      processingSteps.competitorPagesStatus = 'processing';

      let competitorResults: any[] = [];
      let competitorContentsForPrompt: string[] = [];

      try {
        competitorResults = await playwrightService.scrapeMultiplePages(uniqueCompetitorUrls);
        const successfulPlaywrightScrapes = competitorResults.filter(r => r.success);
        const failedPlaywrightScrapes = competitorResults.filter(r => !r.success);

        if (failedPlaywrightScrapes.length > 0) {
          logger.warn(`⚠️ [PLAYWRIGHT] Competitor page scraping partially failed (${failedPlaywrightScrapes.length} failed). Attempting Firecrawl for failed pages.`);
          const failedUrls = failedPlaywrightScrapes.map(r => r.url);
          const firecrawlFallbackResults = await firecrawlService.scrapeMultiplePages(failedUrls);

          // Merge Firecrawl results back into competitorResults
          firecrawlFallbackResults.forEach(firecrawlResult => {
            const index = competitorResults.findIndex(r => r.url === firecrawlResult.url);
            if (index !== -1) {
              competitorResults[index] = firecrawlResult; // Replace Playwright failure with Firecrawl result
            } else {
              competitorResults.push(firecrawlResult); // Should not happen if logic is correct
            }
          });
        }

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

        competitorResults.forEach(result => {
          if (result.success && result.content) {
            competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${result.url} ---\n${result.content}\n--- END OF CONTENT FOR ${result.url} ---\n`);
          } else {
            competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${result.url} (Playwright & Firecrawl failed, using URL Context) ---\n${result.url}\n--- END OF CONTENT FOR ${result.url} ---\n`);
          }
        });

      } catch (error: any) {
        processingSteps.competitorPagesStatus = 'failed';
        logger.warn(`Competitor page batch scraping failed: ${error.message}. All competitor URLs will be passed for Gemini fallback.`);
        uniqueCompetitorUrls.forEach(url => {
          competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${url} (Playwright & Firecrawl failed, using URL Context) ---\n${url}\n--- END OF CONTENT FOR ${url} ---\n`);
        });
      }

      // Construct the full scrapedContent string for the prompt
      const scrapedContentForPrompt = userPageContentForPrompt + competitorContentsForPrompt.join('\n');

      this.updateStatus(analysisId, 'processing', 60);

      // Step 4: Content Refinement - Parallel processing of all content
      logger.info('Starting content refinement phase');
      processingSteps.contentRefinementStatus = 'processing';

      // Only refine successfully scraped pages. Failed ones will be handled by Gemini URL Context.
      const pagesToRefine = [userPageResult, ...competitorResults].filter(r => r.success && r.content);
      logger.info(`Refining ${pagesToRefine.length} successfully scraped pages in parallel`);

      let refinedContents: any[] = [];
      let refinementSuccessful = true;

      if (pagesToRefine.length > 0) {
        try {
          refinedContents = await contentRefinementService.refineMultiplePages(pagesToRefine.map(p => ({...p, cleanedContent: p.content || ''})), jobId);
          processingSteps.contentRefinementStatus = 'completed';
          logger.info(`Content refinement completed: ${refinedContents.length} pages processed`);
        } catch (error: any) {
          logger.warn(`Content refinement failed: ${error.message}. Using original content for successful scrapes.`);
          processingSteps.contentRefinementStatus = 'failed';
          refinementSuccessful = false;

          // Fallback: use original content for successfully scraped pages that failed refinement
          refinedContents = pagesToRefine.map(page => ({
            url: page.url,
            originalLength: page.content?.length || 0,
            refinedSummary: page.content || '',
            keyPoints: [],
            refinementSuccess: false,
            refinementStats: { totalChunks: 1, successful: 0, failed: 1 }
          }));
        }
      }

      // Map refined content back to original structure for OpenAI input
      const userPageForOpenAI = refinedContents.find(rc => rc.url === userPageResult.url) || { url: userPageResult.url, cleanedContent: userPageResult.content || '' };
      const competitorPagesForOpenAI = competitorResults.map(compResult => {
        const refined = refinedContents.find(rc => rc.url === compResult.url);
        return {
          url: compResult.url,
          cleanedContent: refined?.refinedSummary || compResult.content || '',
          title: compResult.title,
          headings: compResult.headings,
          metaDescription: compResult.metaDescription
        };
      });

      this.updateStatus(analysisId, 'processing', 80);

      // Step 5: Final Gap Analysis with available content
      logger.info('Performing content gap analysis with OpenAI');
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: AnalysisResult;

      try {
        // Prepare competitor data - handle cases where some competitors failed
        const validCompetitorPagesForOpenAI = competitorPagesForOpenAI.filter(page => page.cleanedContent);

        logger.info(`🤖 [GEMINI] Starting AI analysis with data preparation:`, {
          targetKeyword: request.targetKeyword,
          userPageContent: userPageForOpenAI.cleanedContent ? userPageForOpenAI.cleanedContent.length : 0,
          validCompetitorPages: validCompetitorPagesForOpenAI.length,
          totalAttemptedCompetitors: uniqueCompetitorUrls.length,
          aiOverviewData: {
            summaryLength: aiOverview.summaryText.length,
            referencesCount: aiOverview.references.length,
            fallbackUsed: aiOverview.fallbackUsed,
          },
          scrapedContentLength: scrapedContentForPrompt.length,
        });

        // Log detailed competitor data        
        validCompetitorPagesForOpenAI.forEach((page, index) => {
          logger.info(`📄 [GEMINI] Competitor ${index + 1}:`, {
            url: page.url,
            contentLength: page.cleanedContent.length,
            hasTitle: !!page.title,
            contentPreview: page.cleanedContent.substring(0, 100) + '...',
          });
        });

        logger.info(`🚀 [GEMINI] Calling Gemini analysis service...`);
        
        analysisResult = await openaiService.analyzeContentGap({
          targetKeyword: request.targetKeyword,
          userPage: userPageForOpenAI,
          aiOverview,
          competitorPages: validCompetitorPagesForOpenAI,
          jobId: analysisId,  // 使用 analysisId 作為 jobId 進行成本追蹤
          scrapedContent: scrapedContentForPrompt // Pass the constructed scraped content
        });

        logger.info(`✅ [GEMINI] AI analysis completed successfully`);
        processingSteps.aiAnalysisStatus = 'completed';
      } catch (error: any) {
        logger.error(`❌ [GEMINI] CRITICAL: AI analysis failed:`, {
          errorMessage: error.message,
          errorStack: error.stack,
          errorName: error.name,
          analysisId,
          targetKeyword: request.targetKeyword,
        });
        
        logger.error(`🚨 [GEMINI] Analysis failure details:`, {
          userPageAvailable: !!userPageForOpenAI.cleanedContent,
          competitorPagesCount: competitorPagesForOpenAI.filter(page => page.cleanedContent).length,
          aiOverviewAvailable: !!aiOverview,
          scrapedContentSize: scrapedContentForPrompt.length,
        });
        
        processingSteps.aiAnalysisStatus = 'failed';

        logger.warn(`🔄 [GEMINI] FALLBACK: Generating basic analysis due to Gemini failure`);
        // Provide a basic fallback analysis
        analysisResult = this.generateFallbackAnalysis(request.targetKeyword, aiOverview);
      }

      this.updateStatus(analysisId, 'processing', 90);

      // Step 6: Prepare final result with enhanced data
      const result: AnalysisResult = {
        ...analysisResult,
        analysisId,
        timestamp: new Date().toISOString(),
        aiOverviewData: {
          ...aiOverview,
          dataSource: aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview'
        },
        competitorUrls: uniqueCompetitorUrls,
        processingSteps,
        usedFallbackData: aiOverview.fallbackUsed || userPageFallbackUsed || false,
        refinementSuccessful,
        analysisQuality: this.assessAnalysisQuality(
          processingSteps, 
          competitorResults.filter(r => r.success).length, // Pass actual successful scrapes
          uniqueCompetitorUrls.length, 
          refinementSuccessful
        )
      };

      // Store result
      this.analysisResults.set(analysisId, result);
      this.updateStatus(analysisId, 'completed', 100);

      return result;
    } catch (error: any) {
      logger.error(`Analysis failed for ${analysisId}`, error);
      this.updateStatus(analysisId, 'failed', 0, error.message);
      throw error;
    }
  }
  
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus | null> {
    return this.analysisStatus.get(analysisId) || null;
  }
  
  async getAnalysisResult(analysisId: string): Promise<AnalysisResult | null> {
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
    totalCompetitors: number,
    refinementSuccessful: boolean
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;
    
    // AI Overview/search data available
    if (processingSteps.serpApiStatus === 'completed') score += 25;
    
    // User page scraped successfully
    if (processingSteps.userPageStatus === 'completed') score += 25;
    
    // Competitor pages success rate
    const competitorSuccessRate = totalCompetitors > 0 ? successfulCompetitors / totalCompetitors : 0;
    score += Math.floor(competitorSuccessRate * 25);
    
    // Content refinement success
    if (refinementSuccessful) score += 15;
    
    // AI analysis success
    if (processingSteps.aiAnalysisStatus === 'completed') score += 10;
    
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Generate a basic fallback analysis when AI analysis fails
   */
  private generateFallbackAnalysis(targetKeyword: string, _aiOverview: any): AnalysisResult {
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
      analysisId: 'fallback',
      timestamp: new Date().toISOString(),
      aiOverviewData: _aiOverview,
      competitorUrls: [],
      processingSteps: {
        serpApiStatus: 'completed',
        userPageStatus: 'failed',
        competitorPagesStatus: 'failed',
        contentRefinementStatus: 'failed',
        aiAnalysisStatus: 'failed'
      },
      qualityAssessment: {
        score: 30,
        level: 'poor',
        completedSteps: 1,
        totalSteps: 5,
        criticalFailures: 1,
        fallbacksUsed: ['AI分析失敗，使用基礎分析']
      }
    };
  }
}

export const analysisService = new AnalysisService();