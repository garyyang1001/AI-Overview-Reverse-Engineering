# AIO-Auditor v5.1 Prompt 完整規格文件

## 📋 概述

AIO-Auditor 使用兩個核心 Prompt 來處理內容分析：
1. **Content Refinement Prompt** - 內容精煉摘要
2. **Main Analysis Prompt** - 主要差距分析

兩個 Prompt 都經過精心設計，以確保輸出品質和一致性。

---

## 🔍 Prompt 1: Content Refinement Prompt

### 目的與功能
**用途：** 將長篇網頁內容智能壓縮為關鍵點摘要  
**執行階段：** 階段 3 - 內容精煉與摘要  
**使用模型：** gpt-4o-mini  
**語言：** 繁體中文（即將更新）

### 當前版本 (v2.0 - 英文)
```
You are an SEO Content Analysis Assistant. Your task is to read the provided text chunk and extract ONLY the key information that contains the following elements:

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
{{content}}
```

### 規劃中版本 (v2.1 - 繁體中文)
```
你是一位 SEO 內容分析助理。你的任務是閱讀提供的文本片段，並僅提取包含以下元素的關鍵資訊：

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
{{content}}
```

### 變數說明
| 變數名稱 | 類型 | 描述 | 範例 |
|---------|------|------|------|
| `content` | string | 需要精煉的文本內容 | 網頁爬取後的清理文本 |

### 預期輸出格式
```
- 核心論點或結論的簡潔描述
- 具體數據：統計數字、百分比、年份等
- 重要實體：品牌名稱、人物、組織
- 可執行建議：具體的操作步驟
- 技術術語：行業專用詞彙或概念
```

### 輸出範例
**輸入：** PTE 考試相關文章  
**輸出：**
```
- PTE Academic 是英國 Pearson 集團開發的英語能力測試
- 考試時間約 3 小時，包含聽說讀寫四個部分
- 分數範圍 10-90 分，多數大學要求 65 分以上
- 採用 AI 自動評分系統，2-5 個工作天內出分
- 認可機構包括澳洲、英國、美國超過 3000 所院校
- 建議考前至少準備 3-6 個月時間
- 可通過 Pearson 官網 pearsonpte.com 報名考試
```

### 配置參數
```typescript
{
  temperature: 0.3,        // 低溫度確保一致性
  maxTokens: 1500,         // 控制輸出長度
  language: 'zh-TW',       // 繁體中文
  category: 'content_refinement'
}
```

---

## 🎯 Prompt 2: Main Analysis Prompt

### 目的與功能
**用途：** 基於 E-E-A-T 原則進行深度差距分析  
**執行階段：** 階段 4 - E-E-A-T 差距分析  
**使用模型：** gpt-4o-mini  
**語言：** 繁體中文

### 當前版本 (v2.0)

#### 系統角色設定
```
# [SYSTEM] 角色與任務
你是「AIO-差距分析專家」，一位專精於逆向工程 Google AI Overview 排名因子的 SEO 策略師和數據科學家。你對 Google 搜尋品質評鑑指南有深度專業，特別是 E-E-A-T 原則（經驗、專業、權威、信任），並且精確理解為何某些頁面會被選入 AI Overview 而其他頁面不會。
```

#### 輸入結構說明
```
# [USER] 情境與任務
你將接收一個包含預處理過的關鍵內容摘要的 JSON 物件。你的分析必須完全基於這些提供的摘要。數據包括：

1. `analysisContext`: 目標關鍵字和確切的 Google AI Overview 文本
2. `userPage`: 使用者頁面的 URL 和精煉摘要  
3. `competitorPages`: 競爭對手頁面陣列（AI Overview 中引用的）及其精煉摘要
```

#### E-E-A-T 分析框架
```
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
```

### 變數說明
| 變數名稱 | 類型 | 描述 | 範例 |
|---------|------|------|------|
| `analysisContext` | JSON string | 目標關鍵字和 AI Overview 數據 | `{"targetKeyword": "PTE", "aiOverview": {...}}` |
| `userPage` | JSON string | 用戶頁面 URL 和精煉摘要 | `{"url": "...", "essentialsSummary": "..."}` |
| `competitorPages` | JSON string | 競爭對手頁面陣列 | `[{"url": "...", "essentialsSummary": "..."}]` |

### 預期輸出結構

#### 1. 執行摘要 (Executive Summary)
```json
{
  "executiveSummary": {
    "mainReasonForExclusion": "用一句話簡潔說明用戶頁面未被收錄到 AI Overview 的主要原因",
    "topPriorityAction": "用戶應該採取的最具影響力的單一改進行動",
    "confidenceScore": 85
  }
}
```

#### 2. E-E-A-T 分析 (EAT Analysis)
```json
{
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
  }
}
```

#### 3. 內容差距分析 (Content Gap Analysis)
```json
{
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
  }
}
```

#### 4. 可執行計畫 (Actionable Plan)
```json
{
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
    "shortTerm": [...],
    "longTerm": [...]
  }
}
```

#### 5. 競爭對手洞察 (Competitor Insights)
```json
{
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
  }
}
```

#### 6. 成功指標 (Success Metrics)
```json
{
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
```

### 配置參數
```typescript
{
  temperature: 0.7,        // 平衡創意與一致性
  maxTokens: 4000,         // 充足的輸出空間
  language: 'zh-TW',       // 繁體中文
  responseFormat: 'json_object',  // 結構化 JSON 輸出
  category: 'main_analysis'
}
```

### 重要指導原則
```
# [重要指導原則]
- 分析必須完全基於提供的精煉摘要，不得使用外部知識
- 每項建議都必須具體且可執行
- 分數應反映基於內容比較的實際差距
- 專注於影響 AI Overview 選擇的因子
- 優先考慮影響力與工作量比值最高的改變
- 所有輸出內容必須使用繁體中文
```

---

## 🔧 Prompt 管理與版本控制

### Prompt 版本歷史
| 版本 | 日期 | 變更內容 | 影響 |
|------|------|----------|------|
| v1.0 | 2024-01 | 初始版本，基礎分析功能 | 建立基礎架構 |
| v2.0 | 2024-06 | 新增 E-E-A-T 框架，中文化 | 大幅提升分析品質 |
| v2.1 | 規劃中 | Content Refinement 中文化 | 統一語言輸出 |

### A/B 測試框架
系統支援多版本 Prompt 同時存在，可進行 A/B 測試：

```typescript
// 切換 Prompt 版本用於測試
promptService.switchPromptVersion('main_analysis', 'main_analysis_v2_experimental');
```

### 品質保證流程
1. **黃金測試集驗證** - 每個新版本都需通過黃金測試集
2. **人工評估** - 專家評估輸出品質和實用性
3. **用戶反饋** - 收集實際使用者的回饋意見
4. **迭代改進** - 基於數據和反饋持續優化

---

## 📊 效能指標與監控

### Prompt 效能指標
- **Token 使用效率** - 輸入/輸出 token 比例
- **回應時間** - API 呼叫平均回應時間
- **成功率** - JSON 解析和內容品質成功率
- **一致性** - 相同輸入的輸出一致性評分

### 成本控制
- **每日 Token 限額** - 防止意外超支
- **批次處理優化** - 減少 API 呼叫次數
- **快取策略** - 避免重複分析相同內容
- **模型選擇** - gpt-4o-mini 平衡效果與成本

### 錯誤處理
- **JSON 解析失敗** - 重試機制和降級方案
- **內容品質不佳** - 自動品質檢查和警告
- **API 限制** - 速率限制和重試邏輯
- **模型不可用** - 備用模型和降級策略

---

## 🚀 未來發展計劃

### v2.1 更新計劃
1. **Content Refinement Prompt 中文化**
2. **增加更多實施細節指導**
3. **強化競爭對手分析深度**
4. **加入行業特定優化建議**

### v3.0 展望
1. **多語言支援** - 支援英文、日文等其他語言
2. **行業定制** - 針對不同行業的專門 Prompt
3. **即時優化** - 基於即時搜尋結果的動態 Prompt
4. **協作分析** - 支援多專家協作的分析流程