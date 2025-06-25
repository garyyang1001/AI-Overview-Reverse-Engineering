# 🚀 AIO-Auditor v5.1 - 完整開發規格書

**專案代號：** AIO-Auditor  
**版本：** 5.1 (生產級，商業級錯誤處理)  
**更新日期：** 2024-12-XX  
**文件目標：** 本文件是專案開發的唯一事實來源 (Single Source of Truth)，整合了強化實施計劃的所有技術細節，包括 BullMQ 非同步架構、Playwright 錯誤處理機制、gpt-4o-mini 統一策略。

## 📋 關鍵設計原則 (Design Principles)

**基於 Update.md + Playwright.md 的整合分析：**
- **智能成本分配：** gpt-4o-mini 統一策略 + Playwright 自建爬蟲
- **商業級健壯性：** 完整的分層錯誤處理機制  
- **非同步架構：** BullMQ + Redis 任務佇列
- **優雅降級：** 部分失敗不影響整體服務

---

### **1. 專案概述 (Project Overview)**

#### **1.1. 願景與目標 (Vision & Objective)**
本專案旨在打造一個健壯、高效、可擴展的 SaaS 平台，賦能內容策略師與 SEO 專家。透過對 Google AI Overviews (AIO) 的深度逆向工程與智能內容精煉，平台將提供從「差距診斷」到「策略執行」的一站式解決方案，最終幫助使用者打造能主導 AIO 內容生成的權威內容。

#### **1.2. 核心挑戰 (Core Challenge)**
本專案的核心挑戰在於處理大量、非結構化的網頁內容（長文本）。直接將數萬字的原始文本提交給高性能 AI 模型會導致以下問題：
1.  **高昂的成本：** Token 消耗巨大。
2.  **高延遲：** 處理時間過長。
3.  **品質下降：** AI 可能因「迷失在中間」而忽略關鍵資訊。
4.  **上下文限制：** 可能超出模型的最大上下文窗口。

本規格書提出的**「分層摘要與精煉」**架構，是為了解決上述所有挑戰而設計的。

---

### **2. 系統架構與工作流 (System Architecture & Workflow)**

#### **2.1. 技術棧 (Tech Stack)**
*   **後端:** Node.js, Express.js
*   **任務佇列:** BullMQ + Redis (非同步處理核心)
*   **網頁爬取:** Playwright (自建，成本效益策略)
*   **AI 模型:** gpt-4o-mini (統一模型策略)
*   **前端:** React, TypeScript
*   **外部 API:** SerpApi, OpenAI
*   **容器化:** Docker + docker-compose
*   **監控:** Sentry (錯誤追蹤)

#### **2.2. 工作流 (Job Flow)**
系統採用非同步任務佇列架構，確保使用者體驗流暢。
1.  **任務入隊 (Enqueuing):** 前端觸發 `POST /api/analyze`。後端驗證請求，將任務推入 BullMQ 佇列，並立即返回一個唯一的 `jobId`。
2.  **Worker 執行 (Execution):** 一個獨立的 Worker 程序從佇列中取出任務，並嚴格按以下順序執行：

    *   **步骤一：AIO 數據提取 (AIO Data Fetching)**
        *   **工具：** SerpApi
        *   **動作：** 使用 `目標關鍵字` 進行搜尋，提取並儲存 `AI Overview` 的完整摘要文本及其引用的 `所有外部連結 (AIO References)`。

    *   **步骤二：批量內容爬取 (Batch Content Scraping)**
        *   **工具：** Playwright (自建爬蟲服務)
        *   **動作：** 使用強化版 Playwright 服務並行爬取 `我的網頁URL` 和 `AIO References` 列表中的所有網址
        *   **錯誤處理策略：**
            - **致命錯誤：** 用戶頁面爬取失敗 → 整個任務失敗
            - **非致命錯誤：** 部分競爭者頁面失敗 → 繼續分析並警告
            - **錯誤分類：** TimeoutError, NavigationError, SelectorNotFound, AntiScraping, UnexpectedContent

    *   **步骤三：內容精煉 (Content Refinement)**
        *   **目標：** 將長篇 Markdown 智能地壓縮成包含核心論點的精簡摘要。
        *   **動作：** 對於**步驟二**中爬取的**每一個**頁面，並行執行以下任務：
            1.  **分塊 (Chunking):** 將單個頁面的長 Markdown 按邏輯邊界（如 H2 標題）或遞歸字符策略分割成多個文本塊 (Chunks)。
            2.  **並行摘要 (Parallel Summarization):** 使用**gpt-4o-mini** 和**「精煉 Prompt v2.0」**（見 3.1 節），對每個文本塊提取核心論點、數據和實體。
            3.  **彙整 (Aggregation):** 將所有文本塊的摘要結果合併，為每個原始頁面生成一份濃縮的**「關鍵點摘要 (Essentials Summary)」**。

    *   **步骤四：最終差距分析 (Final Gap Analysis)**
        *   **目標：** 比較使用者和競爭者的核心內容，生成優化策略。
        *   **動作：**
            1.  **組裝數據：** 將**步驟三**中產生的**「關鍵點摘要」**組裝成主分析 Prompt 所需的 JSON 輸入格式。
            2.  **執行分析：** 使用**gpt-4o-mini** 和**「主分析 Prompt v2.0」**（見 3.2 節），生成最終的結構化 JSON 分析報告。

3.  **結果儲存與查詢 (Result Handling):** Worker 將生成的 JSON 報告與 `jobId` 關聯並儲存。前端透過 `GET /api/results/{jobId}` 輪詢狀態，並在完成時獲取報告。

---

### **3. AI 核心 Prompt 策略 (Core AI Prompt Strategy)**

#### **3.1. Refinement Prompt v2.0 (內容精煉 Prompt)**
*   **用途：** 用於工作流的「步驟三」，由 gpt-4o-mini 執行。
*   **目標：** 從單個文本塊中快速、準確地提取事實性、關鍵性信息。

```prompt
You are an information extraction engine. Your task is to read the following text block and extract ONLY the core factual information.

Extract the following elements:
- Key arguments, claims, and conclusions.
- Specific data points, statistics, numbers, dates, or costs.
- Named entities: products, technologies, laws, people, or organizations.
- Actionable advice, steps, or "how-to" instructions.

Follow these rules STRICTLY:
1. Output ONLY as a Markdown unordered list (using "-").
2. DO NOT include introductions, summaries, or conversational text.
3. Be objective. Exclude subjective language and marketing fluff.
4. Preserve the original language of the text.

[此處插入文本塊]
```

#### **3.2. Main Analysis Prompt v2.0 (主分析 Prompt)**
*   **用途：** 用於工作流的「步驟四」，由 gpt-4o-mini 執行。
*   **目標：** 基於精煉後的關鍵點摘要，進行深度、多維度的差距分析，並生成結構化的行動計畫。

```prompt
# [SYSTEM] Persona & Role
You are "AIO-Auditor-GPT", an elite SEO Content Strategist. Your analysis is rooted in Google's E-E-A-T principles (Experience, Expertise, Authoritativeness, Trustworthiness). Your goal is to reverse-engineer Google's AI Overview logic based on pre-processed, summarized content and deliver a structured, actionable report.

# [CONTEXT]
You are analyzing why a user's webpage was NOT included in Google's AI Overview. Your entire analysis must be based *solely* on the provided concise `essentialsSummary` for each page, comparing them against the official `aiOverview.text`. Do not infer information beyond what is provided in the summaries.

# [TASK]
Execute a structured analysis and generate a JSON output that strictly adheres to the specified schema. Your process is:
1. **Executive Summary:** Diagnose the single most critical weakness and prescribe the top-priority action.
2. **Gap Analysis:** Quantify and qualify the gaps in Topic Coverage, Named Entities, and inferred E-E-A-T signals.
3. **Actionable Plan:** Create a prioritized, concrete list of actions for the user to implement.

# [OUTPUT SCHEMA]
{
  "executiveSummary": {
    "mainReasonForExclusion": "...",
    "topPriorityAction": "..."
  },
  "gapAnalysis": {
    "topicCoverage": { "score": "0-100", "missingTopics": [], "analysis": "..." },
    "entityGaps": { "missingEntities": [], "analysis": "..." },
    "E_E_A_T_signals": { "score": "0-100", "recommendations": [] }
  },
  "actionablePlan": [
    { "type": "ADD_SECTION", "title": "...", "description": "...", "priority": "High" }
  ]
}
```

#### **3.3. 主分析 Prompt 輸入結構 (Input Structure for Main Analysis Prompt)**
```json
{
  "analysisContext": {
    "targetKeyword": "如何挑選適合的咖啡豆",
    "aiOverview": {
      "text": "挑選咖啡豆時，應考慮產地、烘焙程度和處理法。例如，衣索比亞的豆子通常帶有花果香，而蘇門答臘的則偏向厚實的土質風味..."
    }
  },
  "userPage": {
    "url": "https://user-blog.com/how-to-choose-coffee-beans",
    "essentialsSummary": "- 咖啡豆主要分阿拉比卡與羅布斯塔。\n- 烘焙程度分為淺、中、深焙。\n- 淺焙豆酸質明亮。"
  },
  "competitorPages": [
    {
      "url": "https://competitor-a.com/coffee-guide",
      "essentialsSummary": "- 處理法影響風味：日曬法果感強，水洗法乾淨。\n- 衣索比亞耶加雪菲是著名水洗豆。\n- SCA（精品咖啡協會）有風味輪可參考。"
    },
    {
      "url": "https://competitor-b.com/pro-tips-for-coffee",
      "essentialsSummary": "- 海拔高度影響咖啡豆密度與風味。\n- 公平貿易認證確保咖啡農權益。\n- 提到特定莊園名稱，如 Finca El Injerto。"
    }
  ]
}
```

---

## **4. 🚀 AIO-Auditor v5.1 強化實施計劃**

### **🏗️ 第一階段：核心架構重構 (2-3週)**

#### **4.1.1 BullMQ + Redis 基礎設施**
**目標：** 建立穩定的非同步任務處理架構

**具體任務：**
- 安裝 `bullmq`, `ioredis` 依賴
- 配置 Redis 連接和任務佇列
- 建立任務狀態追蹤機制（pending → processing → completed/failed）
- 實現 Worker 程序與 API 服務分離

**交付物：**
```typescript
// queueService.ts - 任務佇列核心服務
// redisClient.ts - Redis 連接配置
// jobManager.ts - 任務狀態管理
```

#### **4.1.2 強化版 Playwright 服務**
**目標：** 實現商業級錯誤處理機制

**錯誤分類策略：**
```typescript
interface ScrapeResult {
  url: string;
  content: string | null;
  success: boolean;
  error?: 'TimeoutError' | 'NavigationError' | 'SelectorNotFound' | 'AntiScraping' | 'UnexpectedContent';
  errorDetails?: string;
}
```

**具體錯誤處理機制：**
- **網路連線錯誤：** 超時、DNS 失敗、HTTP 錯誤碼
- **反爬蟲機制：** CAPTCHA、IP 封鎖、Cloudflare 保護
- **內容結構錯誤：** 選擇器失效、動態加載超時
- **非預期內容：** 檔案下載、重導向失敗

#### **4.1.3 分層錯誤傳播系統**
**目標：** 建立從後端到前端的完整錯誤處理鏈

**錯誤傳播路徑：**
```
[Playwright 錯誤] → [Worker 分類處理] → [BullMQ 狀態標記] → [API 友好轉譯] → [前端優雅呈現]
```

**錯誤分級策略：**
- **致命錯誤：** 用戶頁面爬取失敗 → 整個任務失敗
- **非致命錯誤：** 部分競爭者頁面失敗 → 繼續分析並警告

---

### **🧠 第二階段：AI 統一與 Prompt 工程 (1-2週)**

#### **4.2.1 模型統一為 gpt-4o-mini**
**目標：** 簡化配置並統一成本控制

**具體任務：**
- 內容精煉階段：`gpt-4o-mini`
- 最終分析階段：`gpt-4o-mini`
- 統一 token 計算和成本控制邏輯
- 更新所有 AI 服務調用接口

#### **4.2.2 標準化 Prompt 實施**
**目標：** 實現 v2.0 版本的精確 Prompt 規格

**Refinement Prompt v2.0：**
- 英文統一格式，提高一致性
- 嚴格的輸出格式要求
- 客觀事實提取策略

**Main Analysis Prompt v2.0：**
- 基於 E-E-A-T 原則的分析框架
- 結構化 JSON 輸出格式
- 可操作的改進建議生成

#### **4.2.3 黃金測試集建立**
**目標：** 建立 AI 品質保證機制

**具體任務：**
- 創建 5-10 組高品質測試案例
- 建立自動化測試腳本
- Prompt 版本管理和回歸測試

---

### **🔄 第三階段：Worker 程序與 API 重構 (1-2週)**

#### **4.3.1 獨立 Worker 程序**
**目標：** 實現完整的 5 階段非同步工作流

```typescript
// analysisWorker.ts - 完整 5 階段工作流
// 1. SerpAPI 數據獲取 (含優雅降級)
// 2. Playwright 批量爬取 (含錯誤分類)  
// 3. 內容精煉 (並行處理)
// 4. AI 最終分析 (JSON 格式化)
// 5. 結果存儲與狀態更新
```

#### **4.3.2 API 端點標準化**
**目標：** 實現標準化的 RESTful API 接口

```typescript
POST /api/analyze -> { jobId: string }
GET /api/results/{jobId} -> {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors',
  progress?: number,
  data?: AnalysisResult,
  error?: ErrorResponse,
  warnings?: Warning[]
}
```

#### **4.3.3 錯誤回應結構化**
```json
{
  "status": "failed",
  "error_code": "USER_PAGE_SCRAPE_FAILED", 
  "message": "無法分析您提供的網頁",
  "details": "系統在嘗試抓取您的頁面時超時..."
}
```

---

### **📦 第四階段：Docker 容器化 (1週)**

#### **4.4.1 多容器架構**
- `api-server`: Express.js API 服務
- `worker`: 分析處理 Worker
- `redis`: 任務佇列和快取
- `docker-compose.yml`: 完整開發環境

#### **4.4.2 環境配置管理**
- 開發/測試/生產環境分離
- 敏感資訊 (.env) 管理
- 容器間網路配置

---

### **🔍 第五階段：監控與優化 (1週)**

#### **4.5.1 監控系統**
- Sentry 錯誤追蹤整合
- 結構化日誌記錄
- API 使用量監控

#### **4.5.2 性能優化**
- Redis 快取機制 (避免重複分析)
- Token 使用量追蹤
- 成本控制儀表板

---

## **5. 🎯 關鍵技術亮點 (Key Technical Highlights)**

### **5.1 商業級錯誤處理**
- **4 類主要錯誤：** 網路、結構、反爬蟲、內容類型
- **分層傳播機制：** 後端分類 → API 轉譯 → 前端友好顯示
- **優雅降級：** 部分失敗不影響整體服務

### **5.2 成本效益策略**
- **Playwright 自建：** 避免 Firecrawl 費用
- **統一 gpt-4o-mini：** 簡化配置，控制成本
- **智能快取：** 避免重複計算

### **5.3 生產級架構**
- **完全非同步：** BullMQ 任務佇列
- **容器化部署：** Docker + docker-compose
- **狀態追蹤：** 實時進度反饋

---

## **6. 風險評估與應對策略 (Risk Assessment)**

### **6.1 技術風險**
*   **API 依賴風險：** SerpApi 格式變更或服務中斷  
    **應對：** 實現多重降級策略，錯誤重試機制
    
*   **爬蟲穩定性風險：** 反爬蟲機制與 IP 封鎖  
    **應對：** 商業級錯誤處理，優雅降級，不中斷分析任務
    
*   **Redis 依賴風險：** 任務佇列服務中斷  
    **應對：** Redis 持久化配置，定期備份，監控告警

### **6.2 業務風險**
*   **分析品質風險：** AI 生成不準確的建議  
    **應對：** 黃金測試集回歸測試，Prompt 版本管理
    
*   **成本風險：** gpt-4o-mini 使用量超出預期  
    **應對：** Token 使用監控，智能快取機制，使用量限制
    
*   **性能風險：** 高並發下系統穩定性  
    **應對：** BullMQ 任務限流，Docker 水平擴展，負載均衡

---

## **7. 📊 預期交付成果 (Expected Deliverables)**

1. **健壯的非同步分析系統** - 處理各種異常情況
2. **標準化的 AI 工程** - 一致、可測試的 Prompt v2.0
3. **專業級錯誤處理** - 從後端到前端的完整錯誤傳播
4. **容器化部署方案** - 開發到生產的無縫切換
5. **監控與成本控制** - 商業運營必備功能

**最終目標：** 打造一個生產級、可擴展、成本可控的 SEO 內容分析平台，為 AIO 內容優化提供專業級解決方案。