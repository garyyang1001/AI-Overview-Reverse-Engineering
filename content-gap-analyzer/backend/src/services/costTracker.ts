/**
 * AIO-Auditor v5.1 成本追蹤服務
 * 統一 gpt-4o-mini 成本控制和監控
 */

import logger from '../utils/logger';

// gpt-4o-mini 定價 (2024年數據)
const GPT_4O_MINI_PRICING = {
  INPUT_TOKENS_PER_DOLLAR: 1_000_000 / 0.15,  // $0.15 per 1M input tokens
  OUTPUT_TOKENS_PER_DOLLAR: 1_000_000 / 0.60  // $0.60 per 1M output tokens
};

interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

interface JobCostBreakdown {
  jobId: string;
  mainAnalysis: CostEstimate;
  total: CostEstimate;
  timestamp: string;
}

class CostTracker {
  private jobCosts: Map<string, JobCostBreakdown> = new Map();
  private dailyCosts: Map<string, number> = new Map(); // date -> total cost

  /**
   * 估算單次 API 調用成本
   */
  estimateApiCallCost(inputTokens: number, outputTokens: number): CostEstimate {
    const inputCost = inputTokens / GPT_4O_MINI_PRICING.INPUT_TOKENS_PER_DOLLAR;
    const outputCost = outputTokens / GPT_4O_MINI_PRICING.OUTPUT_TOKENS_PER_DOLLAR;
    const totalCost = inputCost + outputCost;

    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost,
      currency: 'USD'
    };
  }


  /**
   * 記錄主分析步驟的成本
   */
  recordMainAnalysisCost(jobId: string, inputTokens: number, outputTokens: number): void {
    const cost = this.estimateApiCallCost(inputTokens, outputTokens);
    
    let jobCost = this.jobCosts.get(jobId);
    if (!jobCost) {
      jobCost = {
        jobId,
        mainAnalysis: cost,
        total: cost,
        timestamp: new Date().toISOString()
      };
    } else {
      jobCost.mainAnalysis = this.addCosts(jobCost.mainAnalysis, cost);
      jobCost.total = jobCost.mainAnalysis; // Only main analysis in v6.0
    }

    this.jobCosts.set(jobId, jobCost);
    this.addToDailyCost(cost.totalCost);

    logger.info(`Main analysis cost for job ${jobId}: $${cost.totalCost.toFixed(4)} (${inputTokens} in, ${outputTokens} out)`);
  }

  /**
   * 獲取任務總成本
   */
  getJobCost(jobId: string): JobCostBreakdown | null {
    return this.jobCosts.get(jobId) || null;
  }

  /**
   * 獲取今日總成本
   */
  getTodaysCost(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.dailyCosts.get(today) || 0;
  }

  /**
   * 檢查是否超出每日成本限制
   */
  checkDailyCostLimit(limit: number = 10.0): { exceeded: boolean; current: number; limit: number } {
    const current = this.getTodaysCost();
    return {
      exceeded: current >= limit,
      current,
      limit
    };
  }

  /**
   * 獲取成本統計
   */
  getCostStatistics(): {
    totalJobs: number;
    totalCost: number;
    averageCostPerJob: number;
    todaysCost: number;
    last7DaysCost: number;
  } {
    const totalJobs = this.jobCosts.size;
    const totalCost = Array.from(this.jobCosts.values()).reduce((sum, job) => sum + job.total.totalCost, 0);
    const averageCostPerJob = totalJobs > 0 ? totalCost / totalJobs : 0;
    const todaysCost = this.getTodaysCost();
    
    // Calculate last 7 days cost
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let last7DaysCost = 0;
    for (const [date, cost] of this.dailyCosts.entries()) {
      if (new Date(date) >= sevenDaysAgo) {
        last7DaysCost += cost;
      }
    }

    return {
      totalJobs,
      totalCost,
      averageCostPerJob,
      todaysCost,
      last7DaysCost
    };
  }

  /**
   * 清理舊的成本記錄（保留30天）
   */
  cleanupOldRecords(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up daily costs
    for (const [date] of this.dailyCosts.entries()) {
      if (new Date(date) < thirtyDaysAgo) {
        this.dailyCosts.delete(date);
      }
    }

    // Clean up job costs
    for (const [jobId, jobCost] of this.jobCosts.entries()) {
      if (new Date(jobCost.timestamp) < thirtyDaysAgo) {
        this.jobCosts.delete(jobId);
      }
    }

    logger.info('Cleaned up cost records older than 30 days');
  }

  /**
   * 私有輔助方法
   */

  private addCosts(cost1: CostEstimate, cost2: CostEstimate): CostEstimate {
    return {
      inputTokens: cost1.inputTokens + cost2.inputTokens,
      outputTokens: cost1.outputTokens + cost2.outputTokens,
      inputCost: cost1.inputCost + cost2.inputCost,
      outputCost: cost1.outputCost + cost2.outputCost,
      totalCost: cost1.totalCost + cost2.totalCost,
      currency: 'USD'
    };
  }

  private addToDailyCost(cost: number): void {
    const today = new Date().toISOString().split('T')[0];
    const currentDailyCost = this.dailyCosts.get(today) || 0;
    this.dailyCosts.set(today, currentDailyCost + cost);
  }
}

// 導出單例實例
export const costTracker = new CostTracker();

// 定期清理舊記錄（每24小時）
setInterval(() => {
  costTracker.cleanupOldRecords();
}, 24 * 60 * 60 * 1000);