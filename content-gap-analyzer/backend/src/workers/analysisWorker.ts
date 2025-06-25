import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { AnalysisJobData } from '../services/queueService';
import logger from '../utils/logger';

// 導入各階段服務
import { serpApiService } from '../services/serpApiService';
import { playwrightService } from '../services/playwrightService';
import { contentRefinementService } from '../services/contentRefinementService';
import { openaiService } from '../services/openaiService';

// 導入錯誤處理系統
import { errorHandler } from '../services/errorHandler';
import { WorkerStepError } from '../types/errors';

/**
 * 分析 Worker - 處理完整的 5 階段分析工作流
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
    
    logger.info(`Starting analysis job ${jobId} for keyword: ${targetKeyword}`);

    try {
      // 初始化處理步驟狀態和錯誤追蹤
      const processingSteps = {
        serpApiStatus: 'pending',
        userPageStatus: 'pending',
        competitorPagesStatus: 'pending',
        contentRefinementStatus: 'pending',
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
      let userPage;
      try {
        const userPageResult = await playwrightService.scrapePage(userPageUrl);
        
        if (!userPageResult.success) {
          processingSteps.userPageStatus = 'failed';
          
          const playwrightError = errorHandler.classifyPlaywrightError(
            userPageResult.error || 'CONTENT_ERROR',
            userPageUrl,
            userPageResult.errorDetails || 'Unknown error'
          );
          
          const stepError = errorHandler.createWorkerStepError(
            'user_scraping',
            'SCRAPING_FAILED',
            `Failed to scrape user's page: ${userPageResult.error}`,
            [playwrightError],
            false
          );
          stepErrors.push(stepError);
          throw new Error(`Failed to scrape user's page: ${userPageResult.error} - ${userPageResult.errorDetails}`);
        }
        
        // 轉換為舊格式以兼容後續處理
        userPage = {
          url: userPageResult.url,
          title: userPageResult.title || '',
          headings: userPageResult.headings || [],
          cleanedContent: userPageResult.content || '',
          metaDescription: userPageResult.metaDescription || ''
        };
        
        processingSteps.userPageStatus = 'completed';
        completedSteps.push('user_scraping');
        
      } catch (error: any) {
        processingSteps.userPageStatus = 'failed';
        if (!stepErrors.find(e => e.step === 'user_scraping')) {
          const stepError = errorHandler.createWorkerStepError(
            'user_scraping',
            'SCRAPING_FAILED',
            error.message,
            [],
            false
          );
          stepErrors.push(stepError);
        }
        throw error;
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
      let competitorPages: any[] = [];
      try {
        const competitorResults = await playwrightService.scrapeMultiplePages(uniqueCompetitorUrls);
        const successfulResults = competitorResults.filter(result => result.success);
        const failedResults = competitorResults.filter(result => !result.success);
        
        // 轉換成功的結果為舊格式
        competitorPages = successfulResults.map(result => ({
          url: result.url,
          title: result.title || '',
          headings: result.headings || [],
          cleanedContent: result.content || '',
          metaDescription: result.metaDescription || ''
        }));
        
        // 記錄失敗的頁面
        if (failedResults.length > 0) {
          logger.warn(`Job ${jobId}: ${failedResults.length}/${competitorResults.length} competitor pages failed to scrape`);
          failedResults.forEach(result => {
            logger.warn(`Failed to scrape ${result.url}: ${result.error} - ${result.errorDetails}`);
          });
        }
        
        if (competitorPages.length === 0) {
          processingSteps.competitorPagesStatus = 'failed';
          logger.warn(`Job ${jobId}: No competitor pages successfully scraped`);
        } else if (failedResults.length > 0) {
          processingSteps.competitorPagesStatus = 'partial';
        } else {
          processingSteps.competitorPagesStatus = 'completed';
        }
      } catch (error: any) {
        logger.warn(`Job ${jobId}: Competitor scraping failed: ${error.message}`);
        processingSteps.competitorPagesStatus = 'failed';
        competitorPages = [];
      }

      await job.updateProgress(60);

      // 階段 3: 內容精煉 (60-80%)
      logger.info(`Job ${jobId}: Starting content refinement phase`);
      processingSteps.contentRefinementStatus = 'processing';

      const allPages = [userPage, ...competitorPages];
      let refinedContents: any[];
      let refinementSuccessful = true;

      try {
        refinedContents = await contentRefinementService.refineMultiplePages(allPages, jobId);
        processingSteps.contentRefinementStatus = 'completed';
      } catch (error: any) {
        logger.warn(`Job ${jobId}: Content refinement failed: ${error.message}`);
        processingSteps.contentRefinementStatus = 'failed';
        refinementSuccessful = false;
        
        // 降級：使用原始內容
        refinedContents = allPages.map(page => ({
          url: page.url,
          originalLength: page.cleanedContent?.length || 0,
          refinedSummary: page.cleanedContent || '',
          keyPoints: [],
          refinementSuccess: false,
          refinementStats: { totalChunks: 1, successful: 0, failed: 1 }
        }));
      }

      const refinedUserContent = refinedContents[0];
      const refinedCompetitorContents = refinedContents.slice(1);

      await job.updateProgress(80);

      // 階段 4: 最終差距分析 (80-95%)
      logger.info(`Job ${jobId}: Performing content gap analysis`);
      processingSteps.aiAnalysisStatus = 'processing';

      let analysisResult: any;

      try {
        const validCompetitorContents = refinedCompetitorContents.filter((_, index) => 
          competitorPages[index] && competitorPages[index].cleanedContent
        );

        // 詳細記錄傳遞給 OpenAI 的數據
        logger.info(`Job ${jobId}: Preparing data for OpenAI analysis`, {
          targetKeyword,
          userPageUrl: userPage.url,
          userContentLength: refinedUserContent.refinedSummary?.length || 0,
          competitorCount: validCompetitorContents.length,
          aiOverviewLength: aiOverview.summaryText?.length || 0
        });

        // 記錄用戶頁面精煉摘要的前100字符
        if (refinedUserContent.refinedSummary) {
          logger.debug(`Job ${jobId}: User page refined summary preview:`, {
            preview: refinedUserContent.refinedSummary.substring(0, 100) + '...',
            fullLength: refinedUserContent.refinedSummary.length
          });
        }

        // 記錄競爭對手精煉摘要
        validCompetitorContents.forEach((refined, index) => {
          logger.debug(`Job ${jobId}: Competitor ${index} refined summary:`, {
            url: competitorPages[index]?.url,
            preview: refined.refinedSummary?.substring(0, 100) + '...',
            fullLength: refined.refinedSummary?.length || 0
          });
        });

        analysisResult = await openaiService.analyzeContentGap({
          targetKeyword,
          userPage: {
            ...userPage,
            cleanedContent: refinedUserContent.refinedSummary
          },
          aiOverview,
          competitorPages: validCompetitorContents.map((refined, index) => ({
            ...competitorPages[index],
            cleanedContent: refined.refinedSummary
          })),
          jobId  // v5.1 新增：傳遞 jobId 用於成本追蹤
        });

        processingSteps.aiAnalysisStatus = 'completed';
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
        refinementSuccessful,
        
        // v5.1 新增：分層錯誤處理結果
        jobCompletion,
        errors: stepErrors.map(error => errorHandler.translateToFrontendError(error, jobId)),
        warnings: stepWarnings.map(warning => errorHandler.translateToFrontendError(warning, jobId)),
        qualityAssessment: {
          score: jobCompletion.qualityScore,
          level: this.getQualityLevel(jobCompletion.qualityScore),
          completedSteps: completedSteps.length,
          totalSteps: 5,
          criticalFailures: stepErrors.filter(e => !e.canContinue).length,
          fallbacksUsed: jobCompletion.fallbacksUsed
        }
      };

      await job.updateProgress(100);

      const statusMessage = jobCompletion.status === 'completed' 
        ? 'completed successfully'
        : `completed with ${jobCompletion.status === 'completed_with_errors' ? 'errors' : 'issues'}`;
      
      logger.info(`Job ${jobId}: Analysis ${statusMessage} (quality: ${jobCompletion.qualityScore})`);
      return result;

    } catch (error: any) {
      logger.error(`Job ${jobId}: Analysis failed:`, error);
      throw error;
    }
  }

  /**
   * 生成降級分析結果（v5.1 結構）
   */
  private generateFallbackAnalysis(targetKeyword: string, aiOverview: any): any {
    return {
      executiveSummary: {
        mainReasonForExclusion: `⚠️ 技術問題導致分析部分完成。關鍵字「${targetKeyword}」的搜索結果${aiOverview.fallbackUsed ? '使用了備用數據源' : '包含 AI Overview'}，但無法完成完整的 AI 分析。`,
        topPriorityAction: '請檢查系統設定並重新嘗試分析，或手動檢查競爭對手內容。',
        confidenceScore: 30
      },
      contentGapAnalysis: {
        missingTopics: [
          {
            topic: '需要手動分析',
            importance: 'high',
            competitorCoverage: 0,
            implementationComplexity: 'unknown',
            description: '由於技術問題，無法完成自動主題分析。請手動檢查競爭對手頁面內容。'
          }
        ],
        missingEntities: [
          {
            entity: '需要手動識別',
            type: 'unknown',
            relevance: 'high',
            competitorMentions: 0,
            description: '無法自動識別缺失實體。建議檢查競爭對手提及的品牌、人物、組織等。'
          }
        ],
        contentDepthGaps: [
          {
            area: '整體內容分析',
            currentDepth: 'unknown',
            requiredDepth: 'unknown',
            competitorAdvantage: '由於技術問題，無法評估競爭對手優勢'
          }
        ]
      },
      eatAnalysis: {
        experience: {
          userScore: 50,
          competitorAverage: 50,
          gaps: ['無法評估'],
          opportunities: ['請重新嘗試分析']
        },
        expertise: {
          userScore: 50,
          competitorAverage: 50,
          gaps: ['無法評估'],
          opportunities: ['請重新嘗試分析']
        },
        authoritativeness: {
          userScore: 50,
          competitorAverage: 50,
          gaps: ['無法評估'],
          opportunities: ['請重新嘗試分析']
        },
        trustworthiness: {
          userScore: 50,
          competitorAverage: 50,
          gaps: ['無法評估'],
          opportunities: ['請重新嘗試分析']
        }
      },
      actionablePlan: {
        immediate: [
          {
            action: '檢查系統設定',
            title: '檢查 API 設定',
            description: '驗證 OpenAI API 密鑰是否正確配置並重新嘗試分析',
            impact: 'high',
            effort: 'low',
            timeline: '5-10 分鐘',
            implementation: '1. 檢查 .env 文件中的 OPENAI_API_KEY 2. 重啟後端服務 3. 重新提交分析',
            expectedOutcome: '修復技術問題，獲得完整的分析結果'
          }
        ],
        shortTerm: [
          {
            action: '手動競爭對手分析',
            title: '手動內容比較',
            description: '在系統修復前，手動比較競爭對手內容',
            impact: 'medium',
            effort: 'high',
            timeline: '1-2 小時',
            implementation: '1. 訪問 AI Overview 中的競爭對手頁面 2. 記錄內容差異 3. 識別缺失主題和實體',
            expectedOutcome: '獲得基本的內容差距洞察'
          }
        ],
        longTerm: []
      },
      competitorInsights: {
        topPerformingCompetitor: {
          url: 'unknown',
          strengths: ['無法分析'],
          keyDifferentiators: ['請重新嘗試分析']
        },
        commonPatterns: ['由於技術問題，無法識別競爭對手的共同模式']
      },
      successMetrics: {
        primaryKPI: '修復系統問題',
        trackingRecommendations: [
          '檢查系統日誌確認錯誤原因',
          '驗證 API 配置',
          '重新執行分析'
        ],
        timeframe: '立即處理'
      }
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