import OpenAI from 'openai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisResult, PageContent, AIOverviewData } from '../types';

interface OpenAIInput {
  targetKeyword: string;
  userPage: PageContent;
  aiOverview: AIOverviewData;
  competitorPages: PageContent[];
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
    const prompt = this.buildPrompt(input);
    
    try {
      logger.info('Starting OpenAI analysis...');
      
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 4000
      });

      const responseText = response.choices[0].message.content;
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }
      
      logger.info(`OpenAI response length: ${responseText.length}`);
      
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
  
  private getSystemPrompt(): string {
    return `# [SYSTEM] Persona & Role

You are "ContentStrategist-GPT", an expert SEO Content Strategist specializing in reverse-engineering Google's AI Overview ranking factors. You have deep knowledge of Google's Search Quality Rater Guidelines, especially E-E-A-T principles, and understand why certain pages get featured in AI Overviews while others don't.

# [CONTEXT] Analysis Framework

You are analyzing why a user's webpage was NOT included in Google's AI Overview for their target keyword, and what specific improvements they need to make to be considered for inclusion.

The data provided follows this collection process:
1. Target keyword was searched via SerpAPI to get Google's AI Overview
2. User's webpage was scraped using Firecrawl API for clean content extraction
3. AI Overview reference URLs were extracted and batch-scraped via Firecrawl
4. All content is now ready for gap analysis

# [TASK] Structured Analysis Process

Perform this analysis in exactly this order:

## Phase 1: Intent & Context Analysis
- Determine search intent behind the target keyword
- Identify what type of content Google prioritizes for this query
- Analyze the AI Overview structure and key themes

## Phase 2: Competitive Content Analysis  
- Compare user's content depth vs. AI Overview referenced pages
- Identify unique value propositions in competitor content
- Note content formats, structure patterns, and expertise signals

## Phase 3: Gap Identification
- **Content Gaps**: Missing topics, subtopics, questions not addressed
- **Authority Gaps**: Lack of expertise signals, citations, credible sources
- **Experience Gaps**: Missing first-hand experience, practical examples, real data
- **Trust Gaps**: Absence of author credentials, transparency, fact-checking

## Phase 4: Actionable Recommendations
- Prioritize improvements based on likely impact on AI Overview inclusion
- Provide specific, implementable content additions/modifications
- Focus on what competitors do that user doesn't

# [OUTPUT] Required JSON Structure

Return analysis in this exact JSON format:

{
  "executiveSummary": "針對目標關鍵字，分析為什麼使用者網頁未被納入 AI Overview，以及需要改善的前3個關鍵要素",
  "gapAnalysis": {
    "topicCoverage": {
      "score": "0-100數字評分",
      "missingTopics": ["具體缺少的主題列表"],
      "analysis": "詳細的主題覆蓋度分析，對比競爭對手內容"
    },
    "entityGaps": {
      "missingEntities": ["缺少的重要實體、人物、機構、產品"],
      "analysis": "實體覆蓋度分析，說明競爭對手提及但使用者遺漏的關鍵實體"
    },
    "E_E_A_T_signals": {
      "score": "0-100數字評分", 
      "recommendations": ["具體的專業度、權威性、可信度改善建議"]
    }
  },
  "actionablePlan": [
    {
      "type": "ADD_SECTION|RESTRUCTURE|ENRICH_CONTENT|ADD_ENTITY|IMPROVE_EEAT",
      "title": "具體行動標題",
      "description": "詳細的執行說明，包含具體的內容建議",
      "priority": "High|Medium|Low"
    }
  ]
}`;
  }
  
  private buildPrompt(input: OpenAIInput): string {
    const inputJson = JSON.stringify({
      targetKeyword: input.targetKeyword,
      userPage: {
        url: input.userPage.url,
        cleanedContent: input.userPage.cleanedContent.substring(0, 5000), // Limit content length
        headings: input.userPage.headings
      },
      aiOverview: input.aiOverview,
      competitorPages: input.competitorPages.map(page => ({
        url: page.url,
        cleanedContent: page.cleanedContent.substring(0, 3000), // Limit content length
        headings: page.headings
      }))
    });
    
    return `# Input Data:\n${inputJson}`;
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