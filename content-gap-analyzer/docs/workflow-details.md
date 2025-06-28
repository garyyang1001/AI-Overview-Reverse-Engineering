# AIO-Auditor v5.1 完整工作流程詳解

## 📋 概述

AIO-Auditor 採用五階段非同步工作流程，每個階段都有特定的目標和功能。整個流程設計為生產級的可擴展架構，能夠處理大量內容並提供高品質的 SEO 差距分析。

---

## 🔄 五階段工作流程

### 階段 1: AI Overview 數據提取 (10% 進度)
**負責服務：** `serpApiService`  
**處理時間：** 通常 2-5 秒  
**目標：** 獲取 Google AI Overview 和相關搜尋結果

#### 詳細步驟：
1. **初始化 SerpAPI 連接**
   - 驗證 API 金鑰
   - 設定台灣地區搜尋參數（gl=tw, hl=zh-TW）

2. **執行搜尋查詢**
   ```javascript
   searchParams = {
     q: targetKeyword,
     gl: 'tw',                    // 地理位置：台灣
     hl: 'zh-TW',                 // 語言：繁體中文
     device: 'mobile',            // 裝置：手機版面
     google_domain: 'google.com.tw'
   }
   ```

3. **AI Overview 提取**
   - 優先搜尋 AI Overview 區塊
   - 提取 AI Overview 文字內容
   - 收集引用來源 URL 列表

4. **降級策略處理**
   - 如果沒有 AI Overview，使用有機搜尋結果
   - 合併前 5-10 個搜尋結果的 snippet
   - 標記為降級模式（fallbackUsed: true）

#### 輸出結果：
```typescript
{
  summaryText: string,      // AI Overview 文字或降級內容
  references: string[],     // 引用來源 URL 陣列  
  fallbackUsed: boolean,    // 是否使用降級模式
  source: 'ai_overview' | 'organic_results'
}
```

---

### 階段 2: 批量內容爬取 (30-60% 進度)
**負責服務：** `crawl4aiService`  
**處理時間：** 30-120 秒（取決於頁面數量）  
**目標：** 爬取用戶頁面和競爭對手頁面的乾淨內容

#### 詳細步驟：

##### 2.1 用戶頁面爬取 (30-40% 進度)
1. **啟動 Playwright 瀏覽器**
   - 使用 Chromium 引擎
   - 設定 User-Agent 模擬真實用戶
   - 啟用 JavaScript 執行

2. **頁面載入與等待**
   ```javascript
   await page.goto(userPageUrl, { 
     waitUntil: 'networkidle',
     timeout: 30000 
   });
   await page.waitForTimeout(2000); // 等待動態內容載入
   ```

3. **內容提取**
   - 標題：`page.title()`
   - 元描述：`meta[name="description"]`
   - 主要內容：移除導覽、廣告、腳本
   - 標題結構：提取 H1-H6 標題
   - 清理 HTML 轉為純文字

##### 2.2 競爭對手批量爬取 (40-60% 進度)
1. **URL 清單準備**
   - 合併 AI Overview 引用 + 額外競爭對手 URL
   - 去重並過濾無效 URL
   - 限制最多 15 個 URL 避免超時

2. **並行爬取策略**
   ```javascript
   // 同時開啟多個頁面進行並行爬取
   const results = await Promise.allSettled(
     urls.map(url => this.scrapePage(url))
   );
   ```

3. **錯誤處理與重試**
   - 對失敗的頁面進行最多 2 次重試
   - 記錄失敗原因（超時、403、404等）
   - 繼續處理成功的頁面

#### 輸出結果：
```typescript
{
  url: string,
  title: string,
  headings: string[],           // H1-H6 標題陣列
  cleanedContent: string,       // 清理後的純文字內容
  metaDescription: string,
  success: boolean,
  error?: string
}
```

---

### 階段 3: 內容精煉與摘要 (60-80% 進度)
**負責服務：** `contentRefinementService`  
**使用模型：** Gemini  
**目標：** 將長篇內容智能壓縮為關鍵點摘要

#### 詳細步驟：

##### 3.1 內容分塊 (Chunking)
1. **分塊策略選擇**
   ```javascript
   if (content.length > 6000) {
     // 使用標題分塊
     chunks = this.chunkByHeadings(content);
   } else {
     // 使用遞歸字符分塊
     chunks = this.chunkRecursively(content, 3000);
   }
   ```

2. **Token 計算**
   - 使用 tiktoken 精確計算 token 數量
   - 確保每個 chunk 不超過模型限制
   - 預留空間給 prompt 指令

##### 3.2 並行摘要處理
1. **Prompt 準備**
   - 使用 Content Refinement Prompt
   - 針對每個 chunk 單獨處理
   - 設定溫度值 0.3 確保一致性

2. **批量 API 呼叫**
   ```javascript
   const summaries = await Promise.allSettled(
     chunks.map(chunk => this.refineChunk(chunk))
   );
   ```

3. **成本追蹤**
   - 記錄每次 API 呼叫的 token 使用量
   - 累計計算總成本
   - 檢查是否超過每日限額

##### 3.3 結果彙整
1. **摘要合併**
   - 將所有 chunk 的摘要合併
   - 去除重複的關鍵點
   - 保持邏輯順序

2. **品質評估**
   - 檢查壓縮比例（原文 vs 摘要）
   - 驗證關鍵資訊是否保留
   - 標記處理成功/失敗狀態

#### 輸出結果：
```typescript
{
  url: string,
  originalLength: number,       // 原始內容長度
  refinedSummary: string,       // 精煉後的摘要
  keyPoints: string[],          // 關鍵點陣列
  refinementSuccess: boolean,
  refinementStats: {
    totalChunks: number,
    successful: number,
    failed: number
  }
}
```

---

### 階段 4: E-E-A-T 差距分析 (80-95% 進度)
**負責服務：** `geminiService`  
**使用模型：** Gemini  
**目標：** 基於 E-E-A-T 原則進行深度差距分析

#### 詳細步驟：

##### 4.1 分析數據準備
1. **輸入結構組裝**
   ```json
   {
     "analysisContext": {
       "targetKeyword": "目標關鍵字",
       "aiOverview": {
         "text": "AI Overview 完整文字",
         "references": ["url1", "url2"]
       }
     },
     "userPage": {
       "url": "用戶頁面 URL",
       "essentialsSummary": "精煉後的摘要"
     },
     "competitorPages": [
       {
         "url": "競爭對手 URL",
         "essentialsSummary": "精煉後的摘要"
       }
     ]
   }
   ```

##### 4.2 Main Analysis Prompt 執行
1. **Prompt 渲染**
   - 使用 promptService 載入 Main Analysis Prompt
   - 替換模板變數
   - 設定溫度值 0.7 平衡創意與一致性

2. **API 呼叫配置**
   ```javascript
   {
     model: 'gpt-4o-mini',
     response_format: { type: 'json_object' },
     temperature: 0.7,
     max_tokens: 4000
   }
   ```

##### 4.3 結果解析與驗證
1. **JSON 格式驗證**
   - 檢查回傳是否為有效 JSON
   - 驗證必要欄位是否存在
   - 處理解析錯誤

2. **內容品質檢查**
   - 確保所有分數在合理範圍內
   - 驗證建議是否具體可執行
   - 檢查是否包含繁體中文內容

#### 輸出結果：
```typescript
{
  executiveSummary: {
    mainReasonForExclusion: string,
    topPriorityAction: string,
    confidenceScore: number
  },
  eatAnalysis: {
    experience: EATDimension,
    expertise: EATDimension, 
    authoritativeness: EATDimension,
    trustworthiness: EATDimension
  },
  contentGapAnalysis: {
    missingTopics: MissingTopic[],
    missingEntities: MissingEntity[],
    contentDepthGaps: ContentDepthGap[]
  },
  actionablePlan: {
    immediate: ActionItem[],
    shortTerm: ActionItem[],
    longTerm: ActionItem[]
  },
  competitorInsights: CompetitorInsights,
  successMetrics: SuccessMetrics
}
```

---

### 階段 5: 結果準備與品質評估 (95-100% 進度)
**負責服務：** `errorHandler`, `analysisWorker`  
**目標：** 彙整結果、評估品質、準備最終輸出

#### 詳細步驟：

##### 5.1 工作完成狀態評估
1. **步驟完成度檢查**
   ```javascript
   const completedSteps = [
     'serpapi',           // AI Overview 提取
     'user_scraping',     // 用戶頁面爬取
     'competitor_scraping', // 競爭對手爬取
     'content_refinement', // 內容精煉
     'ai_analysis'        // AI 分析
   ];
   ```

2. **錯誤分類與處理**
   - 嚴重錯誤：導致分析失敗
   - 警告：部分功能受限但可繼續
   - 降級：使用備用方案

##### 5.2 品質分數計算
```javascript
qualityScore = (
  completedSteps.length * 20 +          // 基礎分數
  refinementSuccessRate * 10 +          // 精煉成功率
  (aiAnalysisSuccess ? 20 : 0) +        // AI 分析成功
  (noFallbacks ? 10 : 0)                // 無降級使用
);
```

##### 5.3 最終結果組裝
1. **元數據添加**
   - 分析 ID 和時間戳
   - 處理步驟狀態
   - 成本統計資訊

2. **錯誤資訊轉譯**
   - 將技術錯誤轉為用戶友好訊息
   - 提供解決建議
   - 分類為錯誤/警告

#### 輸出結果：
```typescript
{
  ...analysisResult,           // 完整分析結果
  analysisId: string,
  timestamp: string,
  aiOverviewData: AIOverviewData,
  competitorUrls: string[],
  processingSteps: ProcessingSteps,
  jobCompletion: {
    status: 'completed' | 'completed_with_errors' | 'failed',
    qualityScore: number,
    fallbacksUsed: number
  },
  qualityAssessment: {
    score: number,
    level: 'excellent' | 'good' | 'fair' | 'poor',
    completedSteps: number,
    totalSteps: 5,
    criticalFailures: number
  },
  errors: FrontendError[],
  warnings: FrontendError[]
}
```

---

## 🔧 錯誤處理與降級策略

### 階段性降級處理
1. **SerpAPI 失敗** → 使用樣本數據或跳過分析
2. **爬取失敗** → 使用部分成功的頁面繼續
3. **精煉失敗** → 使用原始內容進行分析
4. **AI 分析失敗** → 提供基礎的降級分析結果

### 品質保證機制
- **重試邏輯**：關鍵步驟自動重試 2-3 次
- **超時保護**：每個階段設定合理超時時間
- **資源限制**：控制並行數量避免系統過載
- **成本控制**：追蹤 API 使用量並設定每日限額

---

## 📊 效能指標

### 標準處理時間
- **小型分析**（1 用戶頁面 + 5 競爭對手）：60-90 秒
- **中型分析**（1 用戶頁面 + 10 競爭對手）：90-150 秒  
- **大型分析**（1 用戶頁面 + 15 競爭對手）：120-200 秒

### 成本估算（基於 gpt-4o-mini）
- **內容精煉**：約 $0.01-0.05 per 頁面
- **主分析**：約 $0.05-0.10 per 分析  
- **總計**：約 $0.20-1.00 per 完整分析

### 成功率目標
- **總體完成率**：>95%
- **高品質分析**（分數 >80）：>70%
- **零降級分析**：>60%