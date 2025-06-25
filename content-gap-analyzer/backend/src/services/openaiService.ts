import OpenAI from 'openai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisResult, PageContent, AIOverviewData } from '../types';
import { costTracker } from './costTracker';
import { promptService } from './promptService';

interface OpenAIInput {
  targetKeyword: string;
  userPage: PageContent;
  aiOverview: AIOverviewData;
  competitorPages: PageContent[];
  jobId?: string; // v5.1 新增：用於成本追蹤
}

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
        model: 'gpt-4o-mini',
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

      // v5.1 新增：成本追蹤
      if (response.usage && input.jobId) {
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
    return {
      analysisContext: JSON.stringify({
        targetKeyword: input.targetKeyword,
        aiOverview: {
          text: input.aiOverview.summaryText || '',
          references: input.aiOverview.references || []
        }
      }),
      userPage: JSON.stringify({
        url: input.userPage.url,
        essentialsSummary: input.userPage.cleanedContent || ''
      }),
      competitorPages: JSON.stringify(
        input.competitorPages.map(page => ({
          url: page.url,
          essentialsSummary: page.cleanedContent || ''
        }))
      )
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