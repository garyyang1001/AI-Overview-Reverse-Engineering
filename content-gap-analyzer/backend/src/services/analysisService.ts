import logger from '../utils/logger';
import { serpApiService } from './serpApiService';
import { openaiService } from './geminiService';
import { contentRefinementService } from './contentRefinementService';
import { crawl4aiService, ScrapeResult } from './crawl4aiService';
import { AnalysisRequest, AnalysisResult, ClaudeAnalysisReport } from '../types';

interface AnalysisStatus {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

class AnalysisService {
  private analysisStatus: Map<string, AnalysisStatus> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();
  
  async performAnalysis(analysisId: string, request: AnalysisRequest): Promise<AnalysisResult> {
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

      // Remove duplicates and filter out user's own URL
      const uniqueCompetitorUrls = Array.from(new Set(allCompetitorUrls))
        .filter(url => url !== request.userPageUrl);

      const dataSource = aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview';
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

      // Step 4: Content Refinement - Parallel processing of all content
      logger.info('Starting content refinement phase');
      processingSteps.contentRefinementStatus = 'processing';

      // Only refine successfully scraped pages. Failed ones will be handled by Gemini URL Context.
      const pagesToRefine = [userPageResult, ...competitorResults]
        .filter(r => r.success && r.content)
        .map(r => ({
          url: r.url,
          title: r.title || '',
          headings: r.headings || [],
          cleanedContent: r.content || '', // Ensure cleanedContent is always a string
          metaDescription: r.metaDescription || ''
        }));
      logger.info(`Refining ${pagesToRefine.length} successfully scraped pages in parallel`);

      let refinedContents: any[] = [];
      let refinementSuccessful = true;

      if (pagesToRefine.length > 0) {
        try {
          refinedContents = await contentRefinementService.refineMultiplePages(
            pagesToRefine.map(p => ({
              ...p,
              cleanedContent: p.cleanedContent || '',
              headings: p.headings || [] // Ensure headings is always string[]
            })),
          );
          processingSteps.contentRefinementStatus = 'completed';
          logger.info(`Content refinement completed: ${refinedContents.length} pages processed`);
        } catch (error: any) {
          logger.warn(`Content refinement failed: ${error.message}. Using original content for successful scrapes.`);
          processingSteps.contentRefinementStatus = 'failed';
          refinementSuccessful = false;

          // Fallback: use original content for successfully scraped pages that failed refinement
          refinedContents = pagesToRefine.map(page => ({
            url: page.url,
            originalLength: page.cleanedContent?.length || 0,
            refinedSummary: page.cleanedContent || '',
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
          headings: compResult.headings || [], // Ensure headings is always string[]
          metaDescription: compResult.metaDescription
        };
      });

      this.updateStatus(analysisId, 'processing', 80);

      // Step 5: Final Gap Analysis with available content
      logger.info('Performing content gap analysis with OpenAI');
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: ClaudeAnalysisReport;

      try {
        // Prepare competitor data - handle cases where some competitors failed
        const validCompetitorPagesForOpenAI = competitorPagesForOpenAI.filter(page => page.cleanedContent);

        logger.debug('Inspecting userPageForOpenAI before AI analysis:', {
          url: userPageForOpenAI.url,
          cleanedContent: userPageForOpenAI.cleanedContent,
          typeOfCleanedContent: typeof userPageForOpenAI.cleanedContent,
          cleanedContentLength: userPageForOpenAI.cleanedContent?.length,
        });
        logger.info(`🤖 [GEMINI] Starting AI analysis with data preparation:`, {
          targetKeyword: request.targetKeyword,
          userPageContent: userPageForOpenAI.cleanedContent ? userPageForOpenAI.cleanedContent.length : 0, // Corrected
          validCompetitorPages: validCompetitorPagesForOpenAI.length,
          totalAttemptedCompetitors: uniqueCompetitorUrls.length,
          aiOverviewData: {
            summaryLength: aiOverview.summaryText.length,
            referencesCount: aiOverview.references.length,
            fallbackUsed: aiOverview.fallbackUsed,
          },
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
          userPage: {
            ...userPageForOpenAI,
            cleanedContent: userPageForOpenAI.cleanedContent || '' // Corrected
          },
          aiOverview,
          competitorPages: validCompetitorPagesForOpenAI,
          jobId: analysisId  // 使用 analysisId 作為 jobId 進行成本追蹤
        });

        logger.info(`✅ [GEMINI] AI analysis completed successfully`);
        
        // Validate Claude.md analysis result structure
        this.validateClaudeAnalysisResult(analysisResult, analysisId);
        
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
        });
        
        processingSteps.aiAnalysisStatus = 'failed';

        logger.warn(`🔄 [GEMINI] FALLBACK: Generating basic analysis due to Gemini failure`);
        // Provide a basic fallback analysis
        analysisResult = this.generateFallbackClaudeAnalysis(request.targetKeyword, aiOverview);
      }

      this.updateStatus(analysisId, 'processing', 90);

      // Step 6: Convert ClaudeAnalysisReport to AnalysisResult and prepare final result with enhanced data
      logger.info('Converting ClaudeAnalysisReport to AnalysisResult', {
        analysisId,
        websiteAssessment: !!analysisResult.websiteAssessment,
        contentGapsLength: analysisResult.websiteAssessment?.contentGaps?.length || 0,
        strategyAndPlan: !!analysisResult.strategyAndPlan,
        p1ImmediateLength: analysisResult.strategyAndPlan?.p1_immediate?.length || 0
      });

      const result: AnalysisResult = {
        // Convert ClaudeAnalysisReport to AnalysisResult format
        executiveSummary: {
          mainReasonForExclusion: analysisResult.websiteAssessment?.contentGaps?.[0] || 'No specific exclusion reason identified',
          topPriorityAction: analysisResult.strategyAndPlan?.p1_immediate?.[0]?.recommendation || 'No immediate action identified'
        },
        contentGapAnalysis: {
          missingTopics: (analysisResult.websiteAssessment?.contentGaps || []).map(gap => ({
            topic: gap,
            description: gap,
            importance: 'medium'
          })),
          missingEntities: []
        },
        eatAnalysis: {
          experience: { userScore: 3, competitorAverage: 4, gaps: [], opportunities: [] },
          expertise: { userScore: 3, competitorAverage: 4, gaps: [], opportunities: [] },
          authoritativeness: { userScore: 3, competitorAverage: 4, gaps: [], opportunities: [] },
          trustworthiness: { userScore: 3, competitorAverage: 4, gaps: [], opportunities: [] }
        },
        actionablePlan: {
          immediate: analysisResult.strategyAndPlan.p1_immediate.map(item => ({
            action: item.recommendation,
            title: item.recommendation.substring(0, 50),
            description: item.recommendation,
            impact: 'high' as const,
            effort: 'medium' as const,
            timeline: '1-2 weeks',
            implementation: item.recommendation, // Keep as description/guidance
            geminiPrompt: item.geminiPrompt, // Preserve the actual Gemini prompt
            expectedOutcome: 'Improved content relevance'
          })),
          shortTerm: analysisResult.strategyAndPlan.p2_mediumTerm.map(item => ({
            action: item.recommendation,
            title: item.recommendation.substring(0, 50),
            description: item.recommendation,
            impact: 'high' as const,
            effort: 'high' as const,
            timeline: '1-3 months',
            implementation: item.recommendation, // Keep as description/guidance
            geminiPrompt: item.geminiPrompt, // Preserve the actual Gemini prompt
            expectedOutcome: 'Enhanced content strategy'
          })),
          longTerm: analysisResult.strategyAndPlan.p3_longTerm.map(item => ({
            action: item.recommendation,
            title: item.recommendation.substring(0, 50),
            description: item.recommendation,
            impact: 'medium' as const,
            effort: 'high' as const,
            timeline: '3-6 months',
            implementation: item.recommendation, // Keep as description/guidance
            geminiPrompt: item.geminiPrompt, // Preserve the actual Gemini prompt
            expectedOutcome: 'Long-term authority building'
          })),
        },
        reportFooter: analysisResult.reportFooter,
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
        qualityAssessment: {
          score: 0,
          level: this.assessAnalysisQuality(
            processingSteps, 
            competitorResults.filter(r => r.success).length, // Pass actual successful scrapes
            uniqueCompetitorUrls.length, 
            refinementSuccessful
          ),
          completedSteps: Object.values(processingSteps).filter(status => status === 'completed').length,
          totalSteps: 5,
          criticalFailures: Object.values(processingSteps).filter(status => status === 'failed').length,
          fallbacksUsed: []
        }
      };

      // Log final result structure for debugging
      logger.info('Final AnalysisResult created', {
        analysisId,
        hasExecutiveSummary: !!result.executiveSummary,
        mainReasonForExclusion: result.executiveSummary?.mainReasonForExclusion,
        topPriorityAction: result.executiveSummary?.topPriorityAction
      });
      
      // Calculate score based on quality level
      switch (result.qualityAssessment!.level) {
        case 'excellent': result.qualityAssessment!.score = 90; break;
        case 'good': result.qualityAssessment!.score = 75; break;
        case 'fair': result.qualityAssessment!.score = 60; break;
        case 'poor': result.qualityAssessment!.score = 30; break;
      }

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
   * Generate a basic fallback ClaudeAnalysisReport when AI analysis fails
   */
  private generateFallbackClaudeAnalysis(targetKeyword: string, _aiOverview: any): ClaudeAnalysisReport {
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
      reportFooter: '本報告由於分析過程中遇到技術問題，僅提供基礎建議。建議重新執行完整分析以獲得更詳細的洞察。'
    };
  }

  /**
   * Validates that the Claude.md analysis result has the required structure
   */
  private validateClaudeAnalysisResult(result: any, analysisId: string): void {
    const errors: string[] = [];

    // Check required top-level fields
    if (!result.strategyAndPlan) errors.push('strategyAndPlan is missing');
    if (!result.keywordIntent) errors.push('keywordIntent is missing');
    if (!result.aiOverviewAnalysis) errors.push('aiOverviewAnalysis is missing');
    if (!result.websiteAssessment) errors.push('websiteAssessment is missing');
    if (!result.reportFooter) errors.push('reportFooter is missing');

    // Check strategy and plan structure
    if (result.strategyAndPlan) {
      if (!Array.isArray(result.strategyAndPlan.p1_immediate)) {
        errors.push('strategyAndPlan.p1_immediate must be an array');
      } else {
        result.strategyAndPlan.p1_immediate.forEach((item: any, index: number) => {
          if (!item.recommendation) errors.push(`p1_immediate[${index}].recommendation is missing`);
          if (!item.geminiPrompt) errors.push(`p1_immediate[${index}].geminiPrompt is missing`);
        });
      }
      
      if (!Array.isArray(result.strategyAndPlan.p2_mediumTerm)) {
        errors.push('strategyAndPlan.p2_mediumTerm must be an array');
      }
      
      if (!Array.isArray(result.strategyAndPlan.p3_longTerm)) {
        errors.push('strategyAndPlan.p3_longTerm must be an array');
      }
    }

    // Check website assessment
    if (result.websiteAssessment && !Array.isArray(result.websiteAssessment.contentGaps)) {
      errors.push('websiteAssessment.contentGaps must be an array');
    }

    // Log validation results
    if (errors.length > 0) {
      logger.warn('Claude.md analysis result validation failed', {
        analysisId,
        errors,
        hasStrategyAndPlan: !!result.strategyAndPlan,
        hasWebsiteAssessment: !!result.websiteAssessment
      });
    } else {
      logger.info('Claude.md analysis result validation passed', {
        analysisId,
        p1Count: result.strategyAndPlan?.p1_immediate?.length || 0,
        p2Count: result.strategyAndPlan?.p2_mediumTerm?.length || 0,
        p3Count: result.strategyAndPlan?.p3_longTerm?.length || 0,
        contentGapsCount: result.websiteAssessment?.contentGaps?.length || 0
      });
    }
  }

}

export const analysisService = new AnalysisService();