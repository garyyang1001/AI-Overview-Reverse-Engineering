import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { GeminiInput, AnalysisReport } from '../types';
// import { costTracker } from './costTracker'; // TODO: Implement cost tracking for Gemini
import { promptService } from './promptService';

// Renamed class to GeminiService for clarity
class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  
  constructor() {
    // We'll initialize when needed to ensure env vars are loaded
  }
  
  private initializeIfNeeded() {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
        logger.warn('Gemini API key not configured');
        throw new Error('Gemini API key not configured');
      } else {
        logger.info('Gemini API key configured successfully');
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  
  async analyzeContentGap(input: GeminiInput): Promise<AnalysisReport> {
    this.initializeIfNeeded();
    
    // v6.0 使用新的 prompt 資料結構或降級到舊版本
    let prompt: string | null;
    
    if (input.promptData) {
      // v6.0 新版本：直接使用預先準備的 prompt 資料
      logger.info('Using v6.0 prompt data structure with variables:', {
        hasTargetKeyword: !!input.promptData.targetKeyword,
        hasUserPageUrl: !!input.promptData.userPageUrl,
        hasAiOverviewContent: !!input.promptData.aiOverviewContent,
        hasCitedUrls: !!input.promptData.citedUrls,
        hasCrawledContent: !!input.promptData.crawledContent,
        targetKeyword: input.promptData.targetKeyword,
        userPageUrl: input.promptData.userPageUrl
      });
      prompt = promptService.renderPrompt('main_analysis', input.promptData);
    } else {
      // 降級到舊版本 - 但現在使用 v6.0 格式
      logger.info('Falling back to v5.1 data structure, but converting to v6.0 format');
      const analysisData = this.buildAnalysisData(input);
      logger.info('Built v6.0 format data for fallback:', {
        targetKeyword: analysisData.targetKeyword,
        userPageUrl: analysisData.userPageUrl,
        aiOverviewLength: analysisData.aiOverviewContent?.length || 0,
        crawledContentLength: analysisData.crawledContent?.length || 0
      });
      prompt = promptService.renderPrompt('main_analysis', analysisData);
    }
    
    if (!prompt) {
      logger.error('Failed to render main analysis prompt');
      throw new AppError('Failed to generate analysis prompt', 500, 'PROMPT_ERROR');
    }

    // 獲取 Prompt 元數據
    const promptMeta = promptService.getPromptMetadata('main_analysis');
    const temperature = promptMeta?.temperature || 0.7;
    
    try {
      logger.info('Starting Gemini analysis...');
      
      // Get the Gemini model (using 2.5-flash as specified in Claude.md)
      const model = this.genAI!.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: temperature,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }
      
      logger.info(`Gemini response length: ${responseText.length} chars`);
      
      // Parse JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Gemini response:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from Gemini');
      }
      
      // Validate response content matches input keyword
      const responseValidation = this.validateResponseContent(analysisResult, input.targetKeyword);
      if (!responseValidation.isValid) {
        logger.error('Response content validation failed:', responseValidation);
        logger.error('Response contains content for wrong keyword. This indicates template variable substitution failure.');
        
        // Log sample content for debugging
        if (analysisResult.strategyAndPlan?.p1_immediate?.[0]?.recommendation) {
          logger.error('Sample recommendation content:', 
            analysisResult.strategyAndPlan.p1_immediate[0].recommendation.substring(0, 200)
          );
        }
      } else {
        logger.info('Response content validation passed:', responseValidation);
      }
      
      logger.info('Gemini analysis completed successfully');
      return analysisResult;
    } catch (error: any) {
      logger.error('Gemini analysis failed:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        name: error.name,
        cause: error.cause
      });
      
      console.log('=== GEMINI ERROR DEBUG ===');
      console.log('Error type:', typeof error);
      console.log('Error constructor:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      console.log('=========================');
      
      // Re-throw the error to be handled by the controller
      logger.error('Gemini API call failed, re-throwing error');
      throw new AppError(
        `Gemini API 調用失敗: ${error.message}`,
        500,
        'GEMINI_ANALYSIS_ERROR'
      );
    }
  }

  

  /**
   * 構建分析數據用於 Prompt v2.0 (新方法) - 修正為 v6.0 格式
   */
  private buildAnalysisData(input: GeminiInput): Record<string, any> {
    // 構建爬取內容字符串
    let crawledContent = '';
    const allScrapedPages = [input.userPage, ...input.competitorPages];

    allScrapedPages.forEach(page => {
      if (page.cleanedContent) {
        crawledContent += `--- START OF CONTENT FOR ${page.url} ---\n${page.cleanedContent}\n--- END OF CONTENT FOR ${page.url} ---\n\n`;
      }
    });

    // 準備引用網址列表
    const citedUrls = (input.aiOverview.references || []).join('\n');

    // 構建 v6.0 格式的 promptData
    const promptData = {
      targetKeyword: input.targetKeyword,
      userPageUrl: input.userPage.url,
      aiOverviewContent: input.aiOverview.summaryText || '',
      citedUrls: citedUrls,
      crawledContent: crawledContent
    };

    // 記錄構建的數據
    logger.info('Building v6.0 format analysis data for fallback', {
      targetKeyword: input.targetKeyword,
      userPageUrl: input.userPage.url,
      aiOverviewLength: promptData.aiOverviewContent.length,
      competitorCount: input.competitorPages.length,
      crawledContentLength: crawledContent.length,
      citedUrlsCount: input.aiOverview.references?.length || 0
    });

    // 記錄用戶頁面摘要預覽
    if (input.userPage.cleanedContent) {
      logger.debug('User page content preview:', {
        url: input.userPage.url,
        preview: input.userPage.cleanedContent.substring(0, 150) + '...'
      });
    }

    // 記錄競爭對手摘要預覽
    input.competitorPages.forEach((competitor, index) => {
      if (competitor.cleanedContent) {
        logger.debug(`Competitor ${index} content preview:`, {
          url: competitor.url,
          preview: competitor.cleanedContent.substring(0, 150) + '...'
        });
      }
    });

    return promptData;
  }

  /**
   * 驗證 Gemini 回應內容是否與輸入關鍵字相符
   */
  private validateResponseContent(analysisResult: any, targetKeyword: string): {
    isValid: boolean;
    reasons: string[];
    confidence: number;
  } {
    const reasons: string[] = [];
    let positiveMatches = 0;
    let totalChecks = 0;

    // 檢查策略建議是否包含目標關鍵字
    if (analysisResult.strategyAndPlan?.p1_immediate?.length > 0) {
      totalChecks++;
      const recommendations = analysisResult.strategyAndPlan.p1_immediate
        .map((item: any) => item.recommendation || '')
        .join(' ');
      
      if (recommendations.includes(targetKeyword)) {
        positiveMatches++;
      } else {
        reasons.push(`P1 recommendations do not contain target keyword "${targetKeyword}"`);
      }
    }

    // 檢查關鍵字意圖分析
    if (analysisResult.keywordIntent?.coreIntent) {
      totalChecks++;
      if (analysisResult.keywordIntent.coreIntent.includes(targetKeyword)) {
        positiveMatches++;
      } else {
        reasons.push(`Keyword intent analysis does not contain target keyword "${targetKeyword}"`);
      }
    }

    // 檢查網站評估
    if (analysisResult.websiteAssessment?.contentSummary) {
      totalChecks++;
      if (analysisResult.websiteAssessment.contentSummary.includes(targetKeyword)) {
        positiveMatches++;
      } else {
        reasons.push(`Website assessment does not contain target keyword "${targetKeyword}"`);
      }
    }

    // 檢查是否包含不相關的關鍵字（如 "SEO優化指南"）
    const contentText = JSON.stringify(analysisResult);
    const suspiciousKeywords = ['SEO優化指南', 'SEO optimization guide', '搜尋引擎優化指南'];
    
    for (const suspicious of suspiciousKeywords) {
      if (contentText.includes(suspicious) && !targetKeyword.includes(suspicious)) {
        reasons.push(`Content contains suspicious unrelated keyword: "${suspicious}"`);
        totalChecks++;
      }
    }

    const confidence = totalChecks > 0 ? (positiveMatches / totalChecks) * 100 : 0;
    const isValid = confidence >= 50 && reasons.length === 0;

    return {
      isValid,
      reasons,
      confidence
    };
  }
  
}

let geminiServiceInstance: GeminiService | null = null;

export const geminiService = {
  getInstance(): GeminiService {
    if (!geminiServiceInstance) {
      geminiServiceInstance = new GeminiService();
    }
    return geminiServiceInstance;
  },
  
  analyzeContentGap(input: GeminiInput): Promise<AnalysisReport> {
    return this.getInstance().analyzeContentGap(input);
  },

  
};

// Export singleton instance for backward compatibility
export default geminiService;