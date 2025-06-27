import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisResult, OpenAIInput, PageContent } from '../types';
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
  
  async analyzeContentGap(input: OpenAIInput): Promise<AnalysisReport> {
    this.initializeIfNeeded();
    
    // v2.0 使用標準化 Prompt 服務
    const analysisData = this.buildAnalysisData(input);
    const prompt = promptService.renderPrompt('main_analysis', analysisData);
    
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
   * 構建分析數據用於 Prompt v2.0 (新方法)
   */
  private buildAnalysisData(input: OpenAIInput): Record<string, any> {
    // 詳細記錄構建的分析數據
    const analysisContext = {
      targetKeyword: input.targetKeyword,
      aiOverview: {
        text: input.aiOverview.summaryText || '',
        references: input.aiOverview.references || []
      }
    };

    const userPageData = {
      url: input.userPage.url,
      essentialsSummary: input.userPage.cleanedContent || ''
    };

    const competitorPagesData = input.competitorPages.map((page: PageContent) => ({
      url: page.url,
      essentialsSummary: page.cleanedContent || ''
    }));

    // 記錄構建的數據
    logger.info('Building analysis data for OpenAI', {
      targetKeyword: input.targetKeyword,
      userPageSummaryLength: userPageData.essentialsSummary.length,
      competitorCount: competitorPagesData.length,
      aiOverviewTextLength: analysisContext.aiOverview.text.length
    });

    // 記錄用戶頁面摘要預覽
    if (userPageData.essentialsSummary) {
      logger.debug('User page essentials summary preview:', {
        preview: userPageData.essentialsSummary.substring(0, 150) + '...'
      });
    }

    // 記錄競爭對手摘要預覽
    competitorPagesData.forEach((competitor: { url: string; essentialsSummary: string }, index: number) => {
      if (competitor.essentialsSummary) {
        logger.debug(`Competitor ${index} essentials summary preview:`, {
          url: competitor.url,
          preview: competitor.essentialsSummary.substring(0, 150) + '...'
        });
      }
    });

    return {
      analysisContext: JSON.stringify(analysisContext),
      userPage: JSON.stringify(userPageData),
      competitorPages: JSON.stringify(competitorPagesData),
      scrapedContent: input.scrapedContent // Add this line
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
  
  analyzeContentGap(input: OpenAIInput): Promise<Omit<AnalysisResult, 'timestamp' | 'analysisId'>> {
    return this.getInstance().analyzeContentGap(input);
  },

  
};

// Keep backward compatibility with openaiService export
export const openaiService = geminiService;