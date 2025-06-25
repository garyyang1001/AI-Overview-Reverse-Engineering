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
      
      // Step 2: Scrape user page with Firecrawl
      logger.info(`Playwright scraping user page: ${request.userPageUrl}`);
      processingSteps.userPageStatus = 'processing';
      
      const userPage = await playwrightService.scrapePage(request.userPageUrl);
      processingSteps.userPageStatus = 'completed';
      logger.info(`User page scraped: ${userPage.cleanedContent?.length || 0} chars`);
      
      this.updateStatus(analysisId, 'processing', 40);
      
      // Step 3: Extract competitor URLs from search results
      const searchReferences = aiOverview.references || [];
      const additionalCompetitorUrls = request.competitorUrls || [];
      
      // Combine search references with user-provided URLs
      const allCompetitorUrls = [
        ...searchReferences.slice(0, 10), // Top 10 search references
        ...additionalCompetitorUrls
      ];
      
      // Remove duplicates and filter out user's own URL
      const competitorUrls = [...new Set(allCompetitorUrls)]
        .filter(url => url !== request.userPageUrl);
      
      const dataSource = aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview';
      logger.info(`Found ${searchReferences.length} references from ${dataSource}, ${additionalCompetitorUrls.length} additional URLs`);
      logger.info(`Playwright batch scraping ${competitorUrls.length} competitor pages`);
      processingSteps.competitorPagesStatus = 'processing';
      
      let competitorPages: any[] = [];
      
      try {
        competitorPages = await playwrightService.scrapeMultiplePages(competitorUrls);
        processingSteps.competitorPagesStatus = 'completed';
        logger.info(`Competitor pages scraped: ${competitorPages.length} successful out of ${competitorUrls.length} attempted`);
      } catch (error: any) {
        processingSteps.competitorPagesStatus = 'failed';
        logger.warn(`Competitor page scraping failed: ${error.message}. Continuing with user page only.`);
        competitorPages = [];
      }
      
      this.updateStatus(analysisId, 'processing', 60);
      
      // Step 4: Content Refinement - Parallel processing of all content
      logger.info('Starting content refinement phase');
      processingSteps.contentRefinementStatus = 'processing';
      
      // Combine user page with competitor pages for batch refinement
      const allPages = [userPage, ...competitorPages];
      logger.info(`Refining ${allPages.length} pages in parallel`);
      
      let refinedContents: any[];
      let refinementSuccessful = true;
      
      try {
        refinedContents = await contentRefinementService.refineMultiplePages(allPages);
        processingSteps.contentRefinementStatus = 'completed';
        logger.info(`Content refinement completed: ${allPages.length} pages processed`);
      } catch (error: any) {
        logger.warn(`Content refinement failed: ${error.message}. Using original content.`);
        processingSteps.contentRefinementStatus = 'failed';
        refinementSuccessful = false;
        
        // Fallback: use original content without refinement
        refinedContents = allPages.map(page => ({
          url: page.url,
          originalLength: page.cleanedContent.length,
          refinedSummary: page.cleanedContent,
          keyPoints: [],
          refinementSuccess: false,
          refinementStats: { totalChunks: 1, successful: 0, failed: 1 }
        }));
      }
      
      // Separate refined user content from competitor contents
      const refinedUserContent = refinedContents[0];
      const refinedCompetitorContents = refinedContents.slice(1);
      
      this.updateStatus(analysisId, 'processing', 80);
      
      // Step 5: Final Gap Analysis with available content
      logger.info('Performing content gap analysis with OpenAI');
      processingSteps.aiAnalysisStatus = 'processing';
      
      let analysisResult: any;
      
      try {
        // Prepare competitor data - handle cases where some competitors failed
        const validCompetitorContents = refinedCompetitorContents.filter((_, index) => 
          competitorPages[index] && competitorPages[index].cleanedContent
        );
        
        const validCompetitorPages = competitorPages.filter(page => 
          page && page.cleanedContent
        );
        
        logger.info(`Analyzing with ${validCompetitorPages.length} competitor pages out of ${competitorUrls.length} attempted`);
        
        analysisResult = await openaiService.analyzeContentGap({
          targetKeyword: request.targetKeyword,
          userPage: {
            ...userPage,
            cleanedContent: refinedUserContent.refinedSummary,
            headings: userPage.headings || []
          },
          aiOverview,
          competitorPages: validCompetitorContents.map((refined, index) => ({
            ...validCompetitorPages[index],
            cleanedContent: refined.refinedSummary,
            headings: validCompetitorPages[index].headings || []
          })),
          jobId: analysisId  // 使用 analysisId 作為 jobId 進行成本追蹤
        });
        
        processingSteps.aiAnalysisStatus = 'completed';
      } catch (error: any) {
        logger.error(`OpenAI analysis failed: ${error.message}`);
        processingSteps.aiAnalysisStatus = 'failed';
        
        // Provide a basic fallback analysis
        analysisResult = {
          executiveSummary: `分析部分完成。由於技術問題，無法完成完整的 AI 分析。基於可用數據：關鍵字「${request.targetKeyword}」的搜索結果${aiOverview.fallbackUsed ? '使用了備用數據源' : '包含 AI Overview'}，找到 ${competitorUrls.length} 個競爭對手頁面。建議手動檢查競爭對手內容以識別差距。`,
          gapAnalysis: {
            topicCoverage: {
              score: 50,
              missingTopics: ['需要手動分析'],
              analysis: '由於技術問題，無法完成自動主題分析。請手動檢查競爭對手頁面內容。'
            },
            entityGaps: {
              missingEntities: ['需要手動分析'],
              analysis: '無法自動識別缺失實體。建議檢查競爭對手提及的品牌、人物、組織等。'
            },
            E_E_A_T_signals: {
              score: 50,
              recommendations: ['添加專家引用', '增加可信來源', '提供作者資歷信息', '添加最新數據和統計']
            }
          },
          actionablePlan: [
            {
              type: 'IMPROVE_EEAT',
              title: '手動競爭對手分析',
              description: '由於自動分析失敗，請手動訪問競爭對手頁面並比較內容差距。',
              priority: 'High'
            }
          ]
        };
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
        competitorUrls: competitorUrls,
        processingSteps,
        usedFallbackData: aiOverview.fallbackUsed || false,
        refinementSuccessful,
        analysisQuality: this.assessAnalysisQuality(
          processingSteps, 
          competitorPages.length, 
          competitorUrls.length, 
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