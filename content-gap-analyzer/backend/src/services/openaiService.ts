import OpenAI from 'openai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisResult, PageContent, AIOverviewData, OpenAIInput } from '../types'; // Updated import
import { costTracker } from './costTracker';
import { promptService } from './promptService';

// Removed local OpenAIInput interface definition

class OpenAIService {
  private openai: OpenAI | null = null;
  
  constructor() {
    // We'll initialize when needed to ensure env vars are loaded
  }
  
  private initializeIfNeeded() {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
        logger.warn('OpenAI API key not configured');
        throw new Error('OpenAI API key not configured');
      } else {
        logger.info('OpenAI API key configured successfully');
      }
      
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }
  
  async analyzeContentGap(input: OpenAIInput): Promise<Omit<AnalysisResult, 'timestamp' | 'analysisId'>> {
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
    const maxTokens = promptMeta?.maxTokens || 4000;
    const temperature = promptMeta?.temperature || 0.7;
    
    try {
      logger.info('Starting OpenAI analysis...');
      
      const response = await this.openai!.chat.completions.create({
        model: 'gemini-1.5-flash', // Updated model name
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature,
        max_tokens: maxTokens
      });

      // v5.1 新增：成本追蹤（jobId 為必需參數）
      if (response.usage) {
        costTracker.recordMainAnalysisCost(
          input.jobId,
          response.usage.prompt_tokens,
          response.usage.completion_tokens
        );
      }

      const responseText = response.choices[0].message.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }
      
      logger.info(`OpenAI response length: ${responseText.length} chars, tokens: ${response.usage?.total_tokens || 'unknown'}`);
      
      // Parse JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse OpenAI response:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from OpenAI');
      }
      
      logger.info('OpenAI analysis completed successfully');
      return analysisResult;
    } catch (error: any) {
      logger.error('OpenAI analysis failed:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        name: error.name,
        cause: error.cause
      });
      
      console.log('=== OPENAI ERROR DEBUG ===');
      console.log('Error type:', typeof error);
      console.log('Error constructor:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      console.log('=========================');
      
      // Re-throw the error to be handled by the controller
      logger.error('OpenAI API call failed, re-throwing error');
      throw new AppError(
        `OpenAI API 調用失敗: ${error.message}`,
        500,
        'OPENAI_ANALYSIS_ERROR'
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

    const competitorPagesData = input.competitorPages.map(page => ({
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
    competitorPagesData.forEach((competitor, index) => {
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

let openaiServiceInstance: OpenAIService | null = null;

export const openaiService = {
  getInstance(): OpenAIService {
    if (!openaiServiceInstance) {
      openaiServiceInstance = new OpenAIService();
    }
    return openaiServiceInstance;
  },
  
  analyzeContentGap(input: OpenAIInput): Promise<Omit<AnalysisResult, 'timestamp' | 'analysisId'>> {
    return this.getInstance().analyzeContentGap(input);
  }
};