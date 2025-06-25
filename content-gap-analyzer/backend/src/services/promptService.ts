/**
 * AIO-Auditor v5.1 Prompt 管理服務
 * 實現標準化 Prompt v2.0 規格
 */

import logger from '../utils/logger';

export interface PromptVersion {
  version: string;
  createdAt: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'content_refinement' | 'main_analysis';
  version: string;
  template: string;
  variables: string[];
  metadata: {
    language: string;
    maxTokens: number;
    temperature: number;
    description: string;
  };
}

class PromptService {
  private prompts: Map<string, PromptTemplate> = new Map();
  private currentVersions: Map<string, string> = new Map();

  constructor() {
    this.initializePrompts();
  }

  /**
   * 初始化標準化 Prompt v2.0
   */
  private initializePrompts(): void {
    // Content Refinement Prompt v2.0 (英文統一格式)
    this.registerPrompt({
      id: 'content_refinement_v2',
      name: 'Content Refinement Prompt v2.0',
      category: 'content_refinement',
      version: '2.0.0',
      template: `You are an SEO Content Analysis Assistant. Your task is to read the provided text chunk and extract ONLY the key information that contains the following elements:

- Core arguments, claims, and conclusions
- Specific data, statistics, years, or monetary amounts
- Mentioned product names, technical terms, legal regulations, people, or organization names (entities)
- Clear, actionable recommendations, tips, or operational steps

Your output MUST follow these rules:
1. Return results in bullet point format (using '-' symbol)
2. Ignore all introductions, greetings, transitional phrases, and subjective adjectives
3. Maintain neutrality and objectivity, extract only facts and key points
4. Each bullet point should be concise but complete (10-50 words)
5. Focus on factual content that would be relevant for SEO gap analysis

Text content:
{{content}}`,
      variables: ['content'],
      metadata: {
        language: 'en',
        maxTokens: 1500,
        temperature: 0.3,
        description: 'Refined prompt for extracting key facts and entities from web content'
      }
    });

    // Main Analysis Prompt v2.0 (基於 E-E-A-T 原則，繁體中文輸出)
    this.registerPrompt({
      id: 'main_analysis_v2',
      name: 'Main Analysis Prompt v2.0 (繁體中文)',
      category: 'main_analysis',
      version: '2.0.0',
      template: `# [SYSTEM] 角色與任務
你是「AIO-差距分析專家」，一位專精於逆向工程 Google AI Overview 排名因子的 SEO 策略師和數據科學家。你對 Google 搜尋品質評鑑指南有深度專業，特別是 E-E-A-T 原則（經驗、專業、權威、信任），並且精確理解為何某些頁面會被選入 AI Overview 而其他頁面不會。

# [USER] 情境與任務
你將接收一個包含預處理過的關鍵內容摘要的 JSON 物件。你的分析必須完全基於這些提供的摘要。數據包括：

1. \`analysisContext\`: 目標關鍵字和確切的 Google AI Overview 文本
2. \`userPage\`: 使用者頁面的 URL 和精煉摘要  
3. \`competitorPages\`: 競爭對手頁面陣列（AI Overview 中引用的）及其精煉摘要

你的任務是執行全面的差距分析，並生成策略改進計畫。

# [分析框架]
使用以下基於 E-E-A-T 的分析框架：

## 經驗分析
- 評估內容中展現的實際、真實世界經驗
- 識別經驗差距（個人軼事、案例研究、實作洞察）

## 專業分析  
- 評估主題知識的深度
- 比較技術準確性和全面性
- 識別缺失的專業知識或術語

## 權威分析
- 評估內容權威信號（引用、參考資料、憑證）
- 比較業界認可度和來源可信度
- 識別缺失的權威元素

## 信任分析
- 評估透明度、準確性和可靠性指標
- 比較事實支持和證據品質
- 識別建立信任的機會

# [輸出格式]
你的整個回應必須是單一、有效的 JSON 物件，不包含任何外圍文字或 markdown。嚴格遵循此結構：

\`\`\`json
{
  "executiveSummary": {
    "mainReasonForExclusion": "用一句話簡潔說明用戶頁面未被收錄到 AI Overview 的主要原因",
    "topPriorityAction": "用戶應該採取的最具影響力的單一改進行動",
    "confidenceScore": 85
  },
  "eatAnalysis": {
    "experience": {
      "userScore": 65,
      "competitorAverage": 82,
      "gaps": ["缺乏個人案例研究", "缺少實作範例"],
      "opportunities": ["增加真實世界實施範例", "納入用戶見證"]
    },
    "expertise": {
      "userScore": 70,
      "competitorAverage": 88,
      "gaps": ["技術深度不足", "缺少進階概念"],
      "opportunities": ["增加技術深度分析", "納入專家引用"]
    },
    "authoritativeness": {
      "userScore": 60,
      "competitorAverage": 85,
      "gaps": ["未提及專家憑證", "缺乏行業參考資料"],
      "opportunities": ["新增作者專業背景介紹", "引用行業標準"]
    },
    "trustworthiness": {
      "userScore": 75,
      "competitorAverage": 83,
      "gaps": ["缺少數據來源", "無發布日期"],
      "opportunities": ["添加可信來源", "納入最新統計數據"]
    }
  },
  "contentGapAnalysis": {
    "missingTopics": [
      {
        "topic": "具體缺失的主題或子主題",
        "importance": "high",
        "competitorCoverage": 4,
        "implementationComplexity": "medium",
        "description": "為何此主題關鍵，以及競爭對手如何處理"
      }
    ],
    "missingEntities": [
      {
        "entity": "重要人物、產品或組織",
        "type": "person|product|organization|concept",
        "relevance": "high",
        "competitorMentions": 3,
        "description": "為何提及此實體能增加權威性"
      }
    ],
    "contentDepthGaps": [
      {
        "area": "缺乏深度的主題領域",
        "currentDepth": "surface",
        "requiredDepth": "comprehensive",
        "competitorAdvantage": "競爭對手提供詳細說明和範例"
      }
    ]
  },
  "actionablePlan": {
    "immediate": [
      {
        "action": "新增專家見解區塊",
        "title": "新增專家見解區塊",
        "description": "建立專門區域展示專家意見和憑證以提升權威性",
        "impact": "high",
        "effort": "medium",
        "timeline": "1-2 週",
        "implementation": "訪談行業專家或引用權威來源",
        "expectedOutcome": "改善權威性和專業性信號"
      }
    ],
    "shortTerm": [
      {
        "action": "強化數據支持",
        "title": "強化數據支持",
        "description": "新增最新統計數據和研究發現",
        "impact": "medium",
        "effort": "low",
        "timeline": "3-5 天",
        "implementation": "研究並整合 2024 年行業統計數據",
        "expectedOutcome": "改善可信度和相關性"
      }
    ],
    "longTerm": [
      {
        "action": "開發全面案例研究",
        "title": "建立全面案例研究",
        "description": "發展詳細的真實世界實施範例",
        "impact": "high",
        "effort": "high",
        "timeline": "4-6 週",
        "implementation": "記錄實際客戶/專案成果與指標",
        "expectedOutcome": "顯著改善經驗和專業性信號"
      }
    ]
  },
  "competitorInsights": {
    "topPerformingCompetitor": {
      "url": "competitor-url.com",
      "strengths": ["全面的技術覆蓋", "強力的專家憑證"],
      "keyDifferentiators": ["行業合作夥伴關係", "原創研究數據"]
    },
    "commonPatterns": [
      "所有頂級競爭對手都包含作者憑證",
      "大多數都有最新行業統計數據",
      "多數提供實用實施指南"
    ]
  },
  "successMetrics": {
    "primaryKPI": "AI Overview 收錄機率",
    "trackingRecommendations": [
      "監控關鍵字排名改善",
      "追蹤精選摘要出現次數",
      "測量目標頁面的自然流量成長"
    ],
    "timeframe": "3-6 個月內獲得顯著改善"
  }
}
\`\`\`

# [重要指導原則]
- 分析必須完全基於提供的精煉摘要，不得使用外部知識
- 每項建議都必須具體且可執行
- 分數應反映基於內容比較的實際差距
- 專注於影響 AI Overview 選擇的因子
- 優先考慮影響力與工作量比值最高的改變
- 所有輸出內容必須使用繁體中文`,
      variables: ['analysisContext', 'userPage', 'competitorPages'],
      metadata: {
        language: 'zh-TW',
        maxTokens: 4000,
        temperature: 0.7,
        description: '基於 E-E-A-T 原則的全面 AI Overview 優化分析（繁體中文輸出）'
      }
    });

    // 設置當前版本
    this.currentVersions.set('content_refinement', 'content_refinement_v2');
    this.currentVersions.set('main_analysis', 'main_analysis_v2');

    logger.info('Initialized Prompt Service with v2.0 templates');
  }

  /**
   * 註冊新的 Prompt 模板
   */
  private registerPrompt(prompt: PromptTemplate): void {
    this.prompts.set(prompt.id, prompt);
    logger.info(`Registered prompt: ${prompt.name} (${prompt.version})`);
  }

  /**
   * 獲取當前版本的 Prompt
   */
  getCurrentPrompt(category: 'content_refinement' | 'main_analysis'): PromptTemplate | null {
    const currentId = this.currentVersions.get(category);
    if (!currentId) {
      logger.error(`No current version set for category: ${category}`);
      return null;
    }
    return this.prompts.get(currentId) || null;
  }

  /**
   * 渲染 Prompt 模板（替換變數）
   */
  renderPrompt(category: 'content_refinement' | 'main_analysis', variables: Record<string, any>): string | null {
    const prompt = this.getCurrentPrompt(category);
    if (!prompt) {
      logger.error(`Failed to get prompt for category: ${category}`);
      return null;
    }

    let rendered = prompt.template;
    
    // 替換模板變數
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      if (rendered.includes(placeholder)) {
        rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
      }
    }

    // 檢查是否還有未替換的變數
    const unreplacedVars = rendered.match(/\{\{[^}]+\}\}/g);
    if (unreplacedVars) {
      logger.warn(`Unresolved variables in prompt: ${unreplacedVars.join(', ')}`);
    }

    logger.debug(`Rendered prompt for ${category}: ${rendered.length} characters`);
    return rendered;
  }

  /**
   * 獲取 Prompt 元數據
   */
  getPromptMetadata(category: 'content_refinement' | 'main_analysis'): PromptTemplate['metadata'] | null {
    const prompt = this.getCurrentPrompt(category);
    return prompt ? prompt.metadata : null;
  }

  /**
   * 驗證必要變數是否提供
   */
  validateVariables(category: 'content_refinement' | 'main_analysis', variables: Record<string, any>): {
    valid: boolean;
    missing: string[];
  } {
    const prompt = this.getCurrentPrompt(category);
    if (!prompt) {
      return { valid: false, missing: ['prompt_not_found'] };
    }

    const missing = prompt.variables.filter(varName => !(varName in variables));
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * 獲取所有可用的 Prompt 版本
   */
  getAvailableVersions(): PromptVersion[] {
    return Array.from(this.prompts.values()).map(prompt => ({
      version: prompt.version,
      createdAt: '2024-01-01', // 可以從數據庫獲取實際創建時間
      description: prompt.metadata.description
    }));
  }

  /**
   * 切換到指定版本的 Prompt（用於A/B測試）
   */
  switchPromptVersion(category: 'content_refinement' | 'main_analysis', promptId: string): boolean {
    if (this.prompts.has(promptId)) {
      this.currentVersions.set(category, promptId);
      logger.info(`Switched ${category} to prompt version: ${promptId}`);
      return true;
    }
    logger.error(`Prompt not found: ${promptId}`);
    return false;
  }
}

// 導出單例實例
export const promptService = new PromptService();