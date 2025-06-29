import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AnalysisJobData } from '../services/queueService';
import logger from '../utils/logger';

// 導入各階段服務
import { serpApiService } from '../services/serpApiService';
import { crawl4aiService, ScrapeResult } from '../services/crawl4aiService'; // Changed from playwrightService

import { geminiService } from '../services/geminiService';
// import { promptService } from '../services/promptService'; // Not used in this version

// 導入錯誤處理系統
import { errorHandler } from '../services/errorHandler';
import { WorkerStepError } from '../types/errors';
import { PageContent, AnalysisReport } from '../shared/types'; // Import PageContent

/**
 * 分析 Worker - 處理完整的 4 階段分析工作流
 */
class AnalysisWorker {
  private worker: Worker<AnalysisJobData>;
  private redisConnection: IORedis;

  constructor() {
    // 創建專用的 Redis 連接給 Worker
    this.redisConnection = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.worker = new Worker<AnalysisJobData>(
      'analysis',
      this.processAnalysisJob.bind(this),
      {
        connection: this.redisConnection,
        concurrency: 2, // 同時處理 2 個任務
        limiter: {
          max: 10,      // 每 10 秒最多處理 10 個任務
          duration: 10000,
        },
      }
    );

    this.setupEventListeners();
  }

  /**
   * 設置事件監聽器
   */
  private setupEventListeners(): void {
    this.worker.on('ready', () => {
      logger.info('Analysis worker is ready and waiting for jobs');
    });

    this.worker.on('error', (error) => {
      logger.error('Analysis worker error:', error);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed successfully`);
    });
  }

  /**
   * 處理分析任務的主要函數
   */
  private async processAnalysisJob(job: Job<AnalysisJobData>): Promise<any> {
    const { jobId, targetKeyword, userPageUrl, competitorUrls } = job.data;
    const jobStartTime = Date.now();
    let finalPhaseStartTime = Date.now();
    
    logger.info(`Starting analysis job ${jobId} for keyword: ${targetKeyword}`);

    try {
      // 初始化處理步驟狀態和錯誤追蹤
      const processingSteps = {
        serpApiStatus: 'pending',
        userPageStatus: 'pending',
        competitorPagesStatus: 'pending',
        aiAnalysisStatus: 'pending'
      };

      const completedSteps: string[] = [];
      const stepErrors: WorkerStepError[] = [];
      const stepWarnings: WorkerStepError[] = [];

      // 階段 1: AIO 數據提取 (10%)
      await job.updateProgress(10);
      processingSteps.serpApiStatus = 'processing';
      
      logger.info(`Job ${jobId}: Fetching AI Overview for keyword: ${targetKeyword}`);
      
      let aiOverview;
      try {
        aiOverview = await serpApiService.getAIOverview(targetKeyword);
        
        if (!aiOverview) {
          processingSteps.serpApiStatus = 'failed';
          const stepError = errorHandler.createWorkerStepError(
            'serpapi',
            'SERPAPI_FAILED',
            'No search data available for the given keyword',
            [],
            false
          );
          stepErrors.push(stepError);
          throw new Error('No search data available for the given keyword');
        }
        
        processingSteps.serpApiStatus = 'completed';
        completedSteps.push('serpapi');
        
      } catch (error: any) {
        processingSteps.serpApiStatus = 'failed';
        const stepError = errorHandler.createWorkerStepError(
          'serpapi',
          'SERPAPI_FAILED',
          error.message,
          [],
          false
        );
        stepErrors.push(stepError);
        throw error;
      }
      
      await job.updateProgress(30);

      // 階段 2: 批量內容爬取 (30-60%)
      logger.info(`Job ${jobId}: Starting content scraping phase`);
      processingSteps.userPageStatus = 'processing';
      processingSteps.competitorPagesStatus = 'processing';

      // 爬取用戶頁面
      let userPage: PageContent; // Explicitly type userPage
      try {
        const userPageResult: ScrapeResult = await crawl4aiService.scrapePage(userPageUrl); // Use crawl4aiService
        
        if (!userPageResult.success) {
          processingSteps.userPageStatus = 'failed';
          
          const stepError = errorHandler.createWorkerStepError(
            'user_scraping',
            'SCRAPING_FAILED',
            `Failed to scrape user's page: ${userPageResult.error}`,
            [],
            true  // Allow continuation with fallback
          );
          stepErrors.push(stepError);
          
          logger.warn(`🔄 [WORKER] User page scraping failed, will use Gemini URL Context fallback:`, {
            url: userPageUrl,
            error: userPageResult.error,
            details: userPageResult.errorDetails
          });
          
          // Create fallback user page object with URL only (for Gemini URL Context)
          userPage = {
            url: userPageResult.url,
            title: '',
            headings: [],
            cleanedContent: '', // Empty content signals fallback needed
            metaDescription: '',
            // No scrapeFailure property needed here, handled by stepErrors
          };
        } else {
          // 轉換為 PageContent 格式
          userPage = {
            url: userPageResult.url,
            title: userPageResult.title || '',
            headings: userPageResult.headings || [],
            cleanedContent: userPageResult.content || '',
            metaDescription: userPageResult.metaDescription || ''
          };
          
          processingSteps.userPageStatus = 'completed';
          completedSteps.push('user_scraping');
        }
        
      } catch (error: any) {
        processingSteps.userPageStatus = 'failed';
        if (!stepErrors.find(e => e.step === 'user_scraping')) {
          const stepError = errorHandler.createWorkerStepError(
            'user_scraping',
            'SCRAPING_FAILED',
            error.message,
            [],
            true  // Allow continuation with fallback
          );
          stepErrors.push(stepError);
        }
        
        logger.warn(`🔄 [WORKER] Exception during user page scraping, will use Gemini URL Context fallback:`, {
          url: userPageUrl,
          error: error.message
        });
        
        // Create fallback user page object for unexpected errors
        userPage = {
          url: userPageUrl,
          title: '',
          headings: [],
          cleanedContent: '', // Empty content signals fallback needed
          metaDescription: '',
          // No scrapeFailure property needed here, handled by stepErrors
        };
      }
      
      await job.updateProgress(40);

      // 準備競爭者 URL 列表
      const searchReferences = aiOverview.references || [];
      const additionalCompetitorUrls = competitorUrls || [];
      const allCompetitorUrls = [
        ...searchReferences.slice(0, 10),
        ...additionalCompetitorUrls
      ];
      const uniqueCompetitorUrls = [...new Set(allCompetitorUrls)]
        .filter(url => url !== userPageUrl);

      // 批量爬取競爭者頁面
      let competitorPages: PageContent[] = []; // Explicitly type competitorPages
      try {
        const competitorResults: ScrapeResult[] = await crawl4aiService.scrapeMultiplePages(uniqueCompetitorUrls); // Use crawl4aiService
        const successfulResults = competitorResults.filter((result: ScrapeResult) => result.success); // Explicitly type result
        const failedResults = competitorResults.filter((result: ScrapeResult) => !result.success); // Explicitly type result
        
        // 轉換成功的結果為 PageContent 格式
        competitorPages = successfulResults.map((result: ScrapeResult) => ({ // Explicitly type result
          url: result.url,
          title: result.title || '',
          headings: result.headings || [],
          cleanedContent: result.content || '',
          metaDescription: result.metaDescription || ''
        }));
        
        // 記錄失敗的頁面
        if (failedResults.length > 0) {
          logger.warn(`Job ${jobId}: ${failedResults.length}/${competitorResults.length} competitor pages failed to scrape`);
          failedResults.forEach((result: ScrapeResult) => { // Explicitly type result
            logger.warn(`Failed to scrape ${result.url}: ${result.error} - ${result.errorDetails}`);
          });
        }
        
        if (competitorPages.length === 0) {
          processingSteps.competitorPagesStatus = 'failed';
          logger.warn(`Job ${jobId}: No competitor pages successfully scraped`);
        } else if (failedResults.length > 0) {
          processingSteps.competitorPagesStatus = 'partial';
          completedSteps.push('competitor_scraping');
        } else {
          processingSteps.competitorPagesStatus = 'completed';
          completedSteps.push('competitor_scraping');
        }
      } catch (error: any) {
        logger.warn(`Job ${jobId}: Competitor scraping failed: ${error.message}`);
        processingSteps.competitorPagesStatus = 'failed';
        competitorPages = [];
      }

      

      // 階段 4: 最終差距分析 (80-95%)
      finalPhaseStartTime = Date.now();
      logger.info(`Job ${jobId}: Performing content gap analysis`);
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: AnalysisReport;

      try {
        // Prepare crawled content for the prompt
        let crawledContent = '';
        const allScrapedPages = [userPage, ...competitorPages];

        allScrapedPages.forEach(page => {
          if (page.cleanedContent) {
            crawledContent += `--- URL: ${page.url} ---\n${page.cleanedContent}\n\n`;
          }
        });

        // Prepare cited URLs list for the prompt
        // const citedUrlsList = aiOverview.references.map(ref => `${ref}`).join('\n'); // Not needed

        logger.info(`Job ${jobId}: Preparing data for Gemini analysis`, {
          targetKeyword,
          userPageUrl: userPage.url,
          aiOverviewLength: aiOverview.summaryText?.length || 0,
          crawledContentLength: crawledContent.length,
          citedUrlsCount: aiOverview.references.length
        });

        // Construct GeminiInput object for the service
        const geminiInput = {
          targetKeyword,
          aiOverview,
          userPage,
          competitorPages,
          jobId
        };

        analysisResult = await geminiService.analyzeContentGap(geminiInput);

        processingSteps.aiAnalysisStatus = 'completed';
        completedSteps.push('ai_analysis');
      } catch (error: any) {
        logger.error(`Job ${jobId}: AI analysis failed: ${error.message}`);
        processingSteps.aiAnalysisStatus = 'failed';
        
        // 提供降級分析結果
        analysisResult = this.generateFallbackAnalysis(targetKeyword, aiOverview);
      }

      await job.updateProgress(95);

      // 階段 5: 結果準備與儲存 (95-100%)
      // 評估任務完成狀態
      const jobCompletion = errorHandler.evaluateJobCompletion(
        completedSteps,
        stepErrors,
        stepWarnings
      );

      // 記錄錯誤統計
      if (stepErrors.length > 0 || stepWarnings.length > 0) {
        errorHandler.logErrorStatistics([...stepErrors, ...stepWarnings]);
      }

      const result = {
        ...analysisResult,
        analysisId: jobId,
        timestamp: new Date().toISOString(),
        aiOverviewData: {
          ...aiOverview,
          dataSource: aiOverview.fallbackUsed ? `${aiOverview.source} (fallback)` : 'AI Overview'
        },
        competitorUrls: uniqueCompetitorUrls,
        processingSteps,
        usedFallbackData: aiOverview.fallbackUsed || false,
        
        // v5.1 新增：分層錯誤處理結果
        jobCompletion,
        errors: stepErrors.map(error => errorHandler.translateToFrontendError(error, jobId)),
        warnings: stepWarnings.map(warning => errorHandler.translateToFrontendError(warning, jobId)),
        qualityAssessment: {
          score: jobCompletion.qualityScore,
          level: this.getQualityLevel(jobCompletion.qualityScore),
          completedSteps: completedSteps.length,
          totalSteps: 4, // Changed from 5 to 4
          criticalFailures: stepErrors.filter(e => !e.canContinue).length,
          fallbacksUsed: jobCompletion.fallbacksUsed
        }
      };

      await job.updateProgress(100);

      const statusMessage = jobCompletion.status === 'completed' 
        ? 'completed successfully'
        : `completed with ${jobCompletion.status === 'completed_with_errors' ? 'errors' : 'issues'}`;
      
      const totalJobDuration = Date.now() - jobStartTime;
      const finalPhaseDuration = Date.now() - finalPhaseStartTime;
      
      logger.info(`🎉 [WORKER] Job completed`, {
        jobId,
        status: jobCompletion.status,
        statusMessage,
        qualityScore: jobCompletion.qualityScore,
        qualityLevel: this.getQualityLevel(jobCompletion.qualityScore),
        totalDuration: `${totalJobDuration}ms`,
        finalPhaseDuration: `${finalPhaseDuration}ms`,
        completedSteps: completedSteps.length,
        totalSteps: 4,
        errors: stepErrors.length,
        warnings: stepWarnings.length,
        phases: {
          serpApi: processingSteps.serpApiStatus,
          userPage: processingSteps.userPageStatus,
          competitorPages: processingSteps.competitorPagesStatus,
          aiAnalysis: processingSteps.aiAnalysisStatus
        }
      });
      
      return result;

    } catch (error: any) {
      const totalJobDuration = Date.now() - jobStartTime;
      logger.error(`❌ [WORKER] Job failed`, {
        jobId,
        error: error.message,
        stack: error.stack,
        totalDuration: `${totalJobDuration}ms`,
        targetKeyword,
        userPageUrl
      });
      throw error;
    }
  }

  /**
   * 生成降級分析結果（ClaudeAnalysisReport 結構）
   */
  private generateFallbackAnalysis(targetKeyword: string, aiOverview: any): AnalysisReport {
    return {
      strategyAndPlan: {
        p1_immediate: [
          {
            recommendation: `⚠️ 技術問題導致分析部分完成。關鍵字「${targetKeyword}」的搜索結果${aiOverview.fallbackUsed ? '使用了備用數據源' : '包含 AI Overview'}，但無法完成完整的 AI 分析。`,
            geminiPrompt: "請檢查系統設定並重新嘗試分析，或手動檢查競爭對手內容。"
          }
        ],
        p2_mediumTerm: [],
        p3_longTerm: []
      },
      keywordIntent: {
        coreIntent: "分析失敗，無法確定搜索意圖",
        latentIntents: ["建議手動檢查競爭對手", "重新嘗試系統分析"]
      },
      aiOverviewAnalysis: {
        summary: "AI Overview 分析因技術問題無法完成",
        presentationAnalysis: "無法分析呈現方式，建議手動檢查"
      },
      citedSourceAnalysis: [],
      websiteAssessment: {
        contentSummary: "分析失敗，無法評估網站內容",
        contentGaps: [`缺少針對 ${targetKeyword} 的深度內容`],
        pageExperience: "無法評估頁面體驗",
        structuredDataRecs: "建議添加基本的 Schema 標記"
      },
      reportFooter: "⚠️ 本報告因技術問題而簡化生成。建議重新嘗試分析以獲得完整結果，或聯繫技術支持獲得協助。"
    };
  }


  /**
   * 獲取品質等級（新版本）
   */
  private getQualityLevel(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * 優雅關閉 Worker
   */
  async shutdown(): Promise<void> {
    try {
      await this.worker.close();
      await this.redisConnection.quit();
      logger.info('Analysis worker shutdown completed');
    } catch (error) {
      logger.error('Error during worker shutdown:', error);
    }
  }
}

// 創建並啟動 Worker
const analysisWorker = new AnalysisWorker();

logger.info('Analysis Worker initialized successfully');

export default analysisWorker;