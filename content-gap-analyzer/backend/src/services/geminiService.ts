import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { AnalysisResult, OpenAIInput, PageContent, ClaudeAnalysisReport } from '../types'; // Updated import
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
   * Generate analysis in the Claude.md specified format
   */
  async analyzeContentGapClaude(input: OpenAIInput): Promise<ClaudeAnalysisReport> {
    this.initializeIfNeeded();
    
    // Build the analysis data for Claude.md format prompt
    const claudePrompt = this.buildClaudePrompt(input);
    
    try {
      logger.info('Starting Gemini analysis in Claude.md format...');
      
      // Get the Gemini model (using 2.5-flash as specified in Claude.md)
      const model = this.genAI!.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(claudePrompt);
      const response = await result.response;
      const responseText = response.text();
      
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }
      
      logger.info(`Gemini Claude format response length: ${responseText.length} chars`);
      
      // Parse JSON response
      let analysisResult: ClaudeAnalysisReport;
      try {
        analysisResult = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Failed to parse Gemini Claude format response:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from Gemini');
      }
      
      logger.info('Gemini Claude format analysis completed successfully');
      return analysisResult;
    } catch (error: any) {
      logger.error('Gemini Claude format analysis failed:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        name: error.name,
        cause: error.cause
      });
      
      // Re-throw the error to be handled by the controller
      logger.error('Gemini Claude format API call failed, re-throwing error');
      throw new AppError(
        `Gemini Claude Format API 調用失敗: ${error.message}`,
        500,
        'GEMINI_CLAUDE_ANALYSIS_ERROR'
      );
    }
  }

  /**
   * Build the Claude.md format prompt
   */
  private buildClaudePrompt(input: OpenAIInput): string {
    const targetKeyword = input.targetKeyword;
    const userPageUrl = input.userPage.url;
    const aiOverviewContent = input.aiOverview.summaryText || '';
    const citedUrls = input.aiOverview.references || [];
    
    // Build scraped content sections
    let scrapedContentSections = '';
    
    // User page content
    if (input.userPage.cleanedContent) {
      scrapedContentSections += `--- START OF CONTENT FOR ${userPageUrl} ---\n${input.userPage.cleanedContent}\n--- END OF CONTENT FOR ${userPageUrl} ---\n\n`;
    }
    
    // Competitor page contents  
    input.competitorPages.forEach((page) => {
      if (page.cleanedContent) {
        scrapedContentSections += `--- START OF CONTENT FOR ${page.url} ---\n${page.cleanedContent}\n--- END OF CONTENT FOR ${page.url} ---\n\n`;
      }
    });

    const claudePrompt = `
【使用者提供關鍵字】: ${targetKeyword}
【使用者提供網址】: ${userPageUrl}
【AI Overview 內容】: ${aiOverviewContent}

【被引用網址列表】:
${citedUrls.map(url => url).join('\n')}

【已抓取網頁內容】:
${scrapedContentSections}

${this.getClaudeInstructions()}
`;

    return claudePrompt;
  }

  /**
   * Get the Claude.md instructions for analysis
   */
  private getClaudeInstructions(): string {
    return `
【終極指令：AI逆向工程與SEO戰略分析報告】
# 指令開始 #
## 角色與任務設定 (Role & Goal) ##
你是一位擁有20年資歷，橫跨頂尖SEO公司與Google的AI逆向工程與SEO戰略專家。你具備深刻的同理心與洞察力，深知使用者在搜尋時，渴望快速找到全面、可信賴的資訊，輕鬆理解複雜主題，並對下一步行動充滿信心。
你的核心任務是，站在為「終端使用者」創造最大價值的崇高角度，對我提供的資料進行一次滴水不漏的全面分析。你的報告不僅要精準診斷出問題所在，更要提供具備「優先級」且「可立即執行」的改善計畫。每一項計畫都必須附上一個設計好的 Gemini Prompt，讓我能直接複製、貼上，立即產出優化後的高品質內容。
這份報告的成敗，取決於你能否賦予我「知道問題，也知道如何解決」的清晰路徑與行動力。

## 分析框架與產出要求 (Analysis Framework & Output Requirements) ##
請嚴格遵循以下框架，產出你的分析報告。報告的開頭必須是「綜合戰略與改善計畫」，因為這對使用者來說是最重要的部分。

### 最終輸出格式 (Final Output Format) ###
你的最終產出**必須**是一個單一、完整的、可直接解析的 JSON 物件。此 JSON 物件的結構必須嚴格遵守以下 TypeScript interface (AnalysisReport) 的定義。不要在 JSON 物件之外添加任何引言、結語或任何其他文字。

請分析並產出包含以下5個主要部分的報告：

1. **綜合戰略與改善計畫 (strategyAndPlan)**：
   - p1_immediate: 立即執行項目 (高影響力、低執行難度)
   - p2_mediumTerm: 中期規劃項目 (高影響力、高執行難度)  
   - p3_longTerm: 長期優化項目 (持續進行)
   - 每個項目需包含recommendation和geminiPrompt

2. **關鍵字意圖分析 (keywordIntent)**：
   - coreIntent: 核心搜尋意圖
   - latentIntents: 潛在意圖清單

3. **AI Overview 分析 (aiOverviewAnalysis)**：
   - summary: AI概覽內容摘要
   - presentationAnalysis: Google AI呈現方式分析

4. **引用來源分析 (citedSourceAnalysis)**：
   - 每個被引用網址的詳細分析
   - 包含內容摘要、貢獻度、E-E-A-T評估

5. **網站評估 (websiteAssessment)**：
   - contentSummary: 內容摘要
   - contentGaps: 內容缺口
   - pageExperience: 頁面體驗評估
   - structuredDataRecs: 結構化資料建議

6. **報告結尾 (reportFooter)**：
   - 包含聯絡資訊："本策略報告由 好事發生數位有限公司 製作..."

請確保輸出為有效的JSON格式，符合指定的介面結構。
`;
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

  analyzeContentGapClaude(input: OpenAIInput): Promise<ClaudeAnalysisReport> {
    return this.getInstance().analyzeContentGapClaude(input);
  }
};

// Keep backward compatibility with openaiService export
export const openaiService = geminiService;