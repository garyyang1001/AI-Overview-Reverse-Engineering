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

export class PromptService {
  private prompts: Map<string, PromptTemplate> = new Map();
  private currentVersions: Map<string, string> = new Map();

  constructor() {
    this.initializePrompts();
  }

  /**
   * 初始化標準化 Prompt v2.0
   */
  private initializePrompts(): void {
    // Content Refinement Prompt v2.1 (繁體中文統一格式)
    this.registerPrompt({
      id: 'content_refinement_v2',
      name: 'Content Refinement Prompt v2.1 (繁體中文)',
      category: 'content_refinement',
      version: '2.1.0',
      template: `你是一位 SEO 內容分析助理。你的任務是閱讀提供的文本片段，並僅提取包含以下元素的關鍵資訊：

- 核心論點、主張和結論
- 具體數據、統計資料、年份或金額
- 提及的產品名稱、技術術語、法律法規、人物或組織名稱（實體）
- 明確、可執行的建議、技巧或操作步驟

你的輸出必須遵循以下規則：
1. 以條列格式返回結果（使用「-」符號）
2. 忽略所有引言、問候、過渡性語句和主觀形容詞
3. 保持中立和客觀，僅提取事實和要點
4. 每個條列點應簡潔但完整（10-50 字）
5. 專注於與 SEO 差距分析相關的事實內容
6. 保持繁體中文輸出

文本內容：
{{content}}`,
      variables: ['content'],
      metadata: {
        language: 'zh-TW',
        maxTokens: 1500,
        temperature: 0.3,
        description: '用於從網頁內容中提取關鍵事實和實體的精煉 Prompt（繁體中文）'
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

1. `analysisContext`: 目標關鍵字和確切的 Google AI Overview 文本
2. `userPage`: 使用者頁面的 URL 和精煉摘要  
3. `competitorPages`: 競爭對手頁面陣列（AI Overview 中引用的）及其精煉摘要

【已抓取網頁內容】:
{{scrapedContent}}

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

```json
{
  "strategyAndPlan": {
    "p1_immediate": [
      {
        "recommendation": "string",
        "geminiPrompt": "string"
      }
    ],
    "p2_mediumTerm": [
      {
        "recommendation": "string",
        "geminiPrompt": "string"
      }
    ],
    "p3_longTerm": [
      {
        "recommendation": "string",
        "geminiPrompt": "string"
      }
    ]
  },
  "keywordIntent": {
    "coreIntent": "string",
    "latentIntents": ["string"]
  },
  "aiOverviewAnalysis": {
    "summary": "string",
    "presentationAnalysis": "string"
  },
  "citedSourceAnalysis": [
    {
      "url": "string",
      "contentSummary": "string",
      "contribution": "string",
      "eeatAnalysis": {
        "experience": "string",
        "expertise": "string",
        "authoritativeness": "string",
        "trustworthiness": "string"
      }
    }
  ],
  "websiteAssessment": {
    "contentSummary": "string",
    "contentGaps": ["string"],
    "pageExperience": "string",
    "structuredDataRecs": "string"
  },
  "reportFooter": "string"
}
```

# [重要指導原則]
- 分析必須完全基於提供的精煉摘要，不得使用外部知識
- 每項建議都必須具體且可執行
- 分數應反映基於內容比較的實際差距
- 專注於影響 AI Overview 選擇的因子
- 優先考慮影響力與工作量比值最高的改變
- 所有輸出內容必須使用繁體中文
    "coreIntent": "string",
    "latentIntents": ["string"]
  },
  "aiOverviewAnalysis": {
    "summary": "string",
    "presentationAnalysis": "string"
  },
  "citedSourceAnalysis": [
    {
      "url": "string",
      "contentSummary": "string",
      "contribution": "string",
      "eeatAnalysis": {
        "experience": "string",
        "expertise": "string",
        "authoritativeness": "string",
        "trustworthiness": "string"
      }
    }
  ],
  "websiteAssessment": {
    "contentSummary": "string",
    "contentGaps": ["string"],
    "pageExperience": "string",
    "structuredDataRecs": "string"
  },
  "reportFooter": "string"
}
```

# [重要指導原則]
- 分析必須完全基於提供的精煉摘要，不得使用外部知識
- 每項建議都必須具體且可執行
- 分數應反映基於內容比較的實際差距
- 專注於影響 AI Overview 選擇的因子
- 優先考慮影響力與工作量比值最高的改變
- 所有輸出內容必須使用繁體中文,
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