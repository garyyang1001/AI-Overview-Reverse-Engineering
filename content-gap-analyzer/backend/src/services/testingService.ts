/**
 * AIO-Auditor v5.1 自動化測試服務
 * 執行黃金測試集並評估 Prompt 品質
 */

import logger from '../utils/logger';
// import { promptService } from './promptService'; // Not used anymore
// import { contentRefinementService } from './contentRefinementService'; // Service removed
import { geminiService } from './geminiService';
import { goldenTestSet, GoldenTestCase } from '../tests/goldenTestSet';

export interface TestResult {
  testCaseId: string;
  testName: string;
  category: 'main_analysis';
  success: boolean;
  score: number;
  output: any;
  errors: string[];
  warnings: string[];
  metrics: {
    executionTime: number;
    outputLength: number;
    requiredElementsFound: number;
    forbiddenElementsFound: number;
  };
  timestamp: string;
}

export interface TestSuite {
  suiteId: string;
  promptVersion: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageScore: number;
  results: TestResult[];
  summary: {
    byCategory: Record<string, { passed: number; failed: number; avgScore: number }>;
    byDifficulty: Record<string, { passed: number; failed: number; avgScore: number }>;
  };
  timestamp: string;
  duration: number;
}

class TestingService {
  /**
   * 執行完整的測試套件
   */
  async runFullTestSuite(): Promise<TestSuite> {
    const startTime = Date.now();
    const suiteId = `suite_${Date.now()}`;
    
    logger.info('Starting full test suite execution');
    
    const allTestCases = goldenTestSet.getAllTestCases();
    const results: TestResult[] = [];
    
    // 並行執行測試（限制並行數量避免 API 限制）
    const batchSize = 3;
    for (let i = 0; i < allTestCases.length; i += batchSize) {
      const batch = allTestCases.slice(i, i + batchSize);
      const batchPromises = batch.map(testCase => this.runSingleTest(testCase));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 小延遲避免 API 限制
      if (i + batchSize < allTestCases.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 計算統計數據
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.length - passedTests;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    const summary = this.calculateSummary(results);
    
    const testSuite: TestSuite = {
      suiteId,
      promptVersion: '2.0.0',
      totalTests: results.length,
      passedTests,
      failedTests,
      averageScore,
      results,
      summary,
      timestamp: new Date().toISOString(),
      duration
    };
    
    logger.info(`Test suite completed: ${passedTests}/${results.length} passed (${(averageScore * 100).toFixed(1)}% avg score)`);
    
    return testSuite;
  }

  /**
   * 執行單個測試案例
   */
  async runSingleTest(testCase: GoldenTestCase): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    logger.info(`Running test: ${testCase.name}`);
    
    try {
      let output: any;
      let success = false;
      let score = 0;
      
      // v6.0: Only main_analysis category is supported
      output = await this.testMainAnalysis(testCase);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 評估測試結果
      const evaluation = this.evaluateTestResult(testCase, output);
      success = evaluation.success;
      score = evaluation.score;
      errors.push(...evaluation.errors);
      warnings.push(...evaluation.warnings);
      
      const result: TestResult = {
        testCaseId: testCase.id,
        testName: testCase.name,
        category: testCase.category,
        success,
        score,
        output,
        errors,
        warnings,
        metrics: {
          executionTime,
          outputLength: typeof output === 'string' ? output.length : JSON.stringify(output).length,
          requiredElementsFound: evaluation.requiredElementsFound,
          forbiddenElementsFound: evaluation.forbiddenElementsFound
        },
        timestamp: new Date().toISOString()
      };
      
      logger.info(`Test ${testCase.id} completed: ${success ? 'PASS' : 'FAIL'} (score: ${(score * 100).toFixed(1)}%)`);
      
      return result;
      
    } catch (error: any) {
      logger.error(`Test ${testCase.id} failed with error:`, error);
      
      return {
        testCaseId: testCase.id,
        testName: testCase.name,
        category: testCase.category,
        success: false,
        score: 0,
        output: null,
        errors: [error.message],
        warnings: [],
        metrics: {
          executionTime: Date.now() - startTime,
          outputLength: 0,
          requiredElementsFound: 0,
          forbiddenElementsFound: 0
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // testContentRefinement method removed in v6.0 as content refinement is no longer supported

  /**
   * 測試主分析功能
   */
  private async testMainAnalysis(testCase: GoldenTestCase): Promise<any> {
    // 構建 OpenAI 輸入格式
    const analysisData = JSON.parse(testCase.input.analysisContext);
    const userPageData = JSON.parse(testCase.input.userPage);
    const competitorPagesData = JSON.parse(testCase.input.competitorPages);
    
    const geminiInput = {
      targetKeyword: analysisData.targetKeyword,
      userPage: {
        url: userPageData.url,
        cleanedContent: userPageData.essentialsSummary,
        headings: [],
        title: '',
        metaDescription: ''
      },
      aiOverview: analysisData.aiOverview,
      competitorPages: competitorPagesData.map((comp: any) => ({
        url: comp.url,
        cleanedContent: comp.essentialsSummary,
        headings: [],
        title: '',
        metaDescription: ''
      })),
      jobId: `test_${testCase.id}`
    };
    
    return await geminiService.analyzeContentGap(geminiInput);
  }

  /**
   * 評估測試結果品質
   */
  private evaluateTestResult(testCase: GoldenTestCase, output: any): {
    success: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    requiredElementsFound: number;
    forbiddenElementsFound: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;
    let requiredElementsFound = 0;
    let forbiddenElementsFound = 0;
    
    if (!output) {
      errors.push('No output generated');
      return { success: false, score: 0, errors, warnings, requiredElementsFound, forbiddenElementsFound };
    }
    
    const outputText = typeof output === 'string' ? output : JSON.stringify(output);
    const outputLower = outputText.toLowerCase();
    
    // 檢查輸出長度
    if (outputText.length < testCase.qualityMetrics.minContentLength) {
      errors.push(`Output too short: ${outputText.length} < ${testCase.qualityMetrics.minContentLength}`);
      score -= 0.2;
    }
    
    // 檢查必需元素 (v6.0 main analysis format)
    for (const requiredElement of testCase.qualityMetrics.requiredElements) {
      // Check for main analysis required elements in v6.0 JSON format
      if (requiredElement === 'strategyAndPlan' && outputLower.includes('strategyandplan')) {
        requiredElementsFound++;
      } else if (requiredElement === 'keywordIntent' && outputLower.includes('keywordintent')) {
        requiredElementsFound++;
      } else if (requiredElement === 'aiOverviewAnalysis' && outputLower.includes('aioverviewanalysis')) {
        requiredElementsFound++;
      } else if (requiredElement === 'citedSourceAnalysis' && outputLower.includes('citedsourceanalysis')) {
        requiredElementsFound++;
      } else if (requiredElement === 'websiteAssessment' && outputLower.includes('websiteassessment')) {
        requiredElementsFound++;
      }
    }
    
    // 檢查禁止元素
    for (const forbiddenElement of testCase.qualityMetrics.forbiddenElements) {
      if (forbiddenElement === 'introductory phrases' && 
          (outputLower.includes('here is') || outputLower.includes('let me'))) {
        forbiddenElementsFound++;
      } else if (forbiddenElement === 'subjective adjectives' && 
                (outputLower.includes('amazing') || outputLower.includes('incredible'))) {
        forbiddenElementsFound++;
      } else if (forbiddenElement === 'promotional language' && 
                (outputLower.includes('best ever') || outputLower.includes('must buy'))) {
        forbiddenElementsFound++;
      }
    }
    
    // 計算分數
    const requiredScore = requiredElementsFound / testCase.qualityMetrics.requiredElements.length;
    const forbiddenPenalty = forbiddenElementsFound * 0.1;
    
    score = Math.max(0, requiredScore - forbiddenPenalty);
    
    if (requiredElementsFound < testCase.qualityMetrics.requiredElements.length) {
      warnings.push(`Missing ${testCase.qualityMetrics.requiredElements.length - requiredElementsFound} required elements`);
    }
    
    if (forbiddenElementsFound > 0) {
      warnings.push(`Found ${forbiddenElementsFound} forbidden elements`);
    }
    
    const success = score >= 0.7 && errors.length === 0;
    
    return {
      success,
      score,
      errors,
      warnings,
      requiredElementsFound,
      forbiddenElementsFound
    };
  }

  /**
   * 計算測試套件摘要統計
   */
  private calculateSummary(results: TestResult[]): TestSuite['summary'] {
    const byCategory: Record<string, { passed: number; failed: number; avgScore: number }> = {};
    const byDifficulty: Record<string, { passed: number; failed: number; avgScore: number }> = {};
    
    // 按類別統計
    // v6.0: Only main_analysis category supported
    for (const category of ['main_analysis']) {
      const categoryResults = results.filter(r => r.category === category);
      const passed = categoryResults.filter(r => r.success).length;
      const failed = categoryResults.length - passed;
      const avgScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length || 0;
      
      byCategory[category] = { passed, failed, avgScore };
    }
    
    // 按難度統計
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const difficultyResults = results.filter(r => {
        const testCase = goldenTestSet.getTestCaseById(r.testCaseId);
        return testCase?.metadata.difficulty === difficulty;
      });
      const passed = difficultyResults.filter(r => r.success).length;
      const failed = difficultyResults.length - passed;
      const avgScore = difficultyResults.reduce((sum, r) => sum + r.score, 0) / difficultyResults.length || 0;
      
      byDifficulty[difficulty] = { passed, failed, avgScore };
    }
    
    return { byCategory, byDifficulty };
  }

  /**
   * 執行特定類別的測試
   */
  async runCategoryTests(category: 'main_analysis'): Promise<TestResult[]> {
    // v6.0: getTestCasesByCategory() no longer takes parameters
    const testCases = goldenTestSet.getTestCasesByCategory();
    const results: TestResult[] = [];
    
    logger.info(`Running ${category} tests (${testCases.length} cases)`);
    
    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
      
      // 短暫延遲
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * 生成測試報告
   */
  generateTestReport(testSuite: TestSuite): string {
    const passRate = (testSuite.passedTests / testSuite.totalTests * 100).toFixed(1);
    const avgScore = (testSuite.averageScore * 100).toFixed(1);
    
    let report = `# AIO-Auditor Prompt v2.0 測試報告\n\n`;
    report += `**測試套件 ID:** ${testSuite.suiteId}\n`;
    report += `**執行時間:** ${new Date(testSuite.timestamp).toLocaleString()}\n`;
    report += `**測試時長:** ${(testSuite.duration / 1000).toFixed(1)} 秒\n`;
    report += `**Prompt 版本:** ${testSuite.promptVersion}\n\n`;
    
    report += `## 整體結果\n`;
    report += `- **通過率:** ${passRate}% (${testSuite.passedTests}/${testSuite.totalTests})\n`;
    report += `- **平均分數:** ${avgScore}%\n\n`;
    
    report += `## 分類結果\n`;
    Object.entries(testSuite.summary.byCategory).forEach(([category, stats]) => {
      const categoryPassRate = (stats.passed / (stats.passed + stats.failed) * 100).toFixed(1);
      report += `- **${category}:** ${categoryPassRate}% 通過率 (平均分數: ${(stats.avgScore * 100).toFixed(1)}%)\n`;
    });
    
    report += `\n## 難度分析\n`;
    Object.entries(testSuite.summary.byDifficulty).forEach(([difficulty, stats]) => {
      if (stats.passed + stats.failed > 0) {
        const difficultyPassRate = (stats.passed / (stats.passed + stats.failed) * 100).toFixed(1);
        report += `- **${difficulty}:** ${difficultyPassRate}% 通過率 (平均分數: ${(stats.avgScore * 100).toFixed(1)}%)\n`;
      }
    });
    
    report += `\n## 失敗案例\n`;
    const failedTests = testSuite.results.filter(r => !r.success);
    if (failedTests.length === 0) {
      report += `🎉 所有測試都通過了！\n`;
    } else {
      failedTests.forEach(test => {
        report += `### ${test.testName}\n`;
        report += `- **錯誤:** ${test.errors.join(', ')}\n`;
        report += `- **警告:** ${test.warnings.join(', ')}\n`;
        report += `- **分數:** ${(test.score * 100).toFixed(1)}%\n\n`;
      });
    }
    
    return report;
  }
}

// 導出單例實例
export const testingService = new TestingService();