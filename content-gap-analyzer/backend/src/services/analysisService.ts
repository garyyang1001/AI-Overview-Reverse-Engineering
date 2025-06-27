import logger from '../utils/logger';
import { serpApiService } from './serpApiService';
import { playwrightService } from './playwrightService';
import { openaiService } from './openaiService';
import { contentRefinementService } from './contentRefinementService';
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
      logger.info(`Fetching AI Overview for: ${request.targetKeyword}`);
      processingSteps.serpApiStatus = 'processing';
      
      const aiOverview = await serpApiService.getAIOverview(request.targetKeyword);
      
      if (!aiOverview) {
        processingSteps.serpApiStatus = 'failed';
        throw new Error('No search data available for the given keyword');
      }
      
      processingSteps.serpApiStatus = 'completed';
      
      if (aiOverview.fallbackUsed) {
        logger.info(`Fallback data retrieved (${aiOverview.source}): ${aiOverview.summaryText.length} chars, ${aiOverview.references.length} references`);
      } else {
        logger.info(`AI Overview retrieved: ${aiOverview.summaryText.length} chars, ${aiOverview.references.length} references`);
      }
      
      this.updateStatus(analysisId, 'processing', 30);
      
      // Step 2: Scrape user page with Playwright (Primary)
      logger.info(`Playwright scraping user page: ${request.userPageUrl}`);
      processingSteps.userPageStatus = 'processing';

      let userPageResult = await playwrightService.scrapePage(request.userPageUrl);
      let userPageContentForPrompt = '';

      if (userPageResult.success && userPageResult.content) {
        processingSteps.userPageStatus = 'completed';
        logger.info(`User page scraped successfully: ${userPageResult.content.length} chars`);
        userPageContentForPrompt = `--- START OF CONTENT FOR ${userPageResult.url} ---\n${userPageResult.content}\n--- END OF CONTENT FOR ${userPageResult.url} ---\n\n`;
      } else {
        processingSteps.userPageStatus = 'failed';
        logger.warn(`User page scraping failed: ${userPageResult.errorDetails}. Using URL for Gemini fallback.`);
        userPageContentForPrompt = `--- START OF CONTENT FOR ${userPageResult.url} (Playwright failed, using URL Context) ---\n${userPageResult.url}\n--- END OF CONTENT FOR ${userPageResult.url} ---\n\n`;
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
        const successfulCompetitorScrapes = competitorResults.filter(r => r.success);
        const failedCompetitorScrapes = competitorResults.filter(r => !r.success);

        if (successfulCompetitorScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'completed';
          logger.info(`Competitor pages scraped: ${successfulCompetitorScrapes.length} successful out of ${uniqueCompetitorUrls.length} attempted`);
        } else if (failedCompetitorScrapes.length > 0) {
          processingSteps.competitorPagesStatus = 'partial';
          logger.warn(`Competitor page scraping partially failed: ${failedCompetitorScrapes.length} failed.`);
        } else {
          processingSteps.competitorPagesStatus = 'failed';
          logger.warn(`All competitor page scraping failed.`);
        }

        competitorResults.forEach(result => {
          if (result.success && result.content) {
            competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${result.url} ---\n${result.content}\n--- END OF CONTENT FOR ${result.url} ---\n`);
          } else {
            competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${result.url} (Playwright failed, using URL Context) ---\n${result.url}\n--- END OF CONTENT FOR ${result.url} ---\n`);
          }
        });

      } catch (error: any) {
        processingSteps.competitorPagesStatus = 'failed';
        logger.warn(`Competitor page batch scraping failed: ${error.message}. All competitor URLs will be passed for Gemini fallback.`);
        uniqueCompetitorUrls.forEach(url => {
          competitorContentsForPrompt.push(`--- START OF CONTENT FOR ${url} (Playwright failed, using URL Context) ---\n${url}\n--- END OF CONTENT FOR ${url} ---\n`);
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

      let analysisResult: any;

      try {
        // Prepare competitor data - handle cases where some competitors failed
        const validCompetitorPagesForOpenAI = competitorPagesForOpenAI.filter(page => page.cleanedContent);

        logger.info(`Analyzing with ${validCompetitorPagesForOpenAI.length} competitor pages out of ${uniqueCompetitorUrls.length} attempted`);

        analysisResult = await openaiService.analyzeContentGap({
          targetKeyword: request.targetKeyword,
          userPage: userPageForOpenAI,
          aiOverview,
          competitorPages: validCompetitorPagesForOpenAI,
          jobId: analysisId,  // 使用 analysisId 作為 jobId 進行成本追蹤
          scrapedContent: scrapedContentForPrompt // Pass the constructed scraped content
        });

        processingSteps.aiAnalysisStatus = 'completed';
      } catch (error: any) {
        logger.error(`OpenAI analysis failed: ${error.message}`);
        processingSteps.aiAnalysisStatus = 'failed';

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
        usedFallbackData: aiOverview.fallbackUsed || false,
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
}

export const analysisService = new AnalysisService();