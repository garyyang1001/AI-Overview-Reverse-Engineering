import { Worker, Job } from 'bullmq';
import redisClient from '../config/redis';
import { AnalysisJobData } from '../services/queueService';
import logger from '../utils/logger';

// 導入各階段服務
import { serpApiService } from '../services/serpApiService';
import { playwrightService } from '../services/playwrightService';
import { contentRefinementService } from '../services/contentRefinementService';
import { openaiService } from '../services/openaiService';

/**
 * 分析 Worker - 處理完整的 5 階段分析工作流
 */
class AnalysisWorker {
  private worker: Worker<AnalysisJobData>;

  constructor() {
    this.worker = new Worker<AnalysisJobData>(
      'analysis',
      this.processAnalysisJob.bind(this),
      {
        connection: redisClient,
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
      // 初始化處理步驟狀態
      const processingSteps = {
        serpApiStatus: 'pending',
        userPageStatus: 'pending',
        competitorPagesStatus: 'pending',
        contentRefinementStatus: 'pending',
        aiAnalysisStatus: 'pending'
      };

      // 階段 1: AIO 數據提取 (10%)
      await job.updateProgress(10);
      processingSteps.serpApiStatus = 'processing';
      
      logger.info(`Job ${jobId}: Fetching AI Overview for keyword: ${targetKeyword}`);
      const aiOverview = await serpApiService.getAIOverview(targetKeyword);
      
      if (!aiOverview) {
        processingSteps.serpApiStatus = 'failed';
        throw new Error('No search data available for the given keyword');
      }
      
      processingSteps.serpApiStatus = 'completed';
      await job.updateProgress(30);

      // 階段 2: 批量內容爬取 (30-60%)
      logger.info(`Job ${jobId}: Starting content scraping phase`);
      processingSteps.userPageStatus = 'processing';
      processingSteps.competitorPagesStatus = 'processing';

      // 爬取用戶頁面
      const userPage = await playwrightService.scrapePage(userPageUrl);
      
      if (!userPage.success) {
        processingSteps.userPageStatus = 'failed';
        throw new Error(`Failed to scrape user's page: ${userPage.error}`);
      }
      
      processingSteps.userPageStatus = 'completed';
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
        competitorPages = await playwrightService.scrapeMultiplePages(uniqueCompetitorUrls);
        processingSteps.competitorPagesStatus = 'completed';
      } catch (error: any) {
        logger.warn(`Job ${jobId}: Competitor scraping failed: ${error.message}`);
        processingSteps.competitorPagesStatus = 'partial';
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
        refinedContents = await contentRefinementService.refineMultiplePages(allPages);
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
          }))
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
        analysisQuality: this.assessAnalysisQuality(
          processingSteps,
          competitorPages.length,
          uniqueCompetitorUrls.length,
          refinementSuccessful
        )
      };

      await job.updateProgress(100);

      logger.info(`Job ${jobId}: Analysis completed successfully`);
      return result;

    } catch (error: any) {
      logger.error(`Job ${jobId}: Analysis failed:`, error);
      throw error;
    }
  }

  /**
   * 生成降級分析結果
   */
  private generateFallbackAnalysis(targetKeyword: string, aiOverview: any): any {
    return {
      executiveSummary: {
        mainReasonForExclusion: `分析部分完成。由於技術問題，無法完成完整的 AI 分析。基於可用數據：關鍵字「${targetKeyword}」的搜索結果${aiOverview.fallbackUsed ? '使用了備用數據源' : '包含 AI Overview'}。`,
        topPriorityAction: '建議手動檢查競爭對手內容以識別差距。'
      },
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

  /**
   * 評估分析品質
   */
  private assessAnalysisQuality(
    processingSteps: any,
    successfulCompetitors: number,
    totalCompetitors: number,
    refinementSuccessful: boolean
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    if (processingSteps.serpApiStatus === 'completed') score += 25;
    if (processingSteps.userPageStatus === 'completed') score += 25;
    
    const competitorSuccessRate = totalCompetitors > 0 ? successfulCompetitors / totalCompetitors : 0;
    score += Math.floor(competitorSuccessRate * 25);
    
    if (refinementSuccessful) score += 15;
    if (processingSteps.aiAnalysisStatus === 'completed') score += 10;

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
      logger.info('Analysis worker shutdown completed');
    } catch (error) {
      logger.error('Error during worker shutdown:', error);
    }
  }
}

// 創建並啟動 Worker
const analysisWorker = new AnalysisWorker();

// 優雅關閉處理
process.on('SIGINT', async () => {
  logger.info('Shutting down analysis worker...');
  await analysisWorker.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down analysis worker...');
  await analysisWorker.shutdown();
  process.exit(0);
});

export default analysisWorker;