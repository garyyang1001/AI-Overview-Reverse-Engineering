好的，我完全理解您的需求。您需要一份單一、完整、結構化的**「開發規格書 (Development Specification)」**，這份文件將作為 AI 開發的核心藍圖。它將無縫整合我們討論過的所有概念：生產級架構、非同步工作流、以及至關重要的「大內容處理與分層摘要」策略。

這份文件將以極其清晰和結構化的方式呈現，以便 AI 或開發團隊能夠直接依此進行開發，無需參考先前的對話。

---

### **AI 開發規格書：SEO 內容優化平台**

**專案代號：** AIO-Auditor
**版本：** 4.0 (生產級，含分層摘要)
**文件目標：** 本文件是專案開發的唯一事實來源 (Single Source of Truth)。它詳細定義了專案的目標、架構、工作流程、AI 核心策略和開發路線圖，旨在指導整個開發過程。

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
*   **任務佇列:** BullMQ + Redis
*   **前端:** React
*   **外部 API:** SerpApi, Firecrawl, OpenAI (或 Google Gemini)

#### **2.2. 工作流 (Job Flow)**
系統採用非同步任務佇列架構，確保使用者體驗流暢。
1.  **任務入隊 (Enqueuing):** 前端觸發 `POST /api/analyze`。後端驗證請求，將任務推入 BullMQ 佇列，並立即返回一個唯一的 `jobId`。
2.  **Worker 執行 (Execution):** 一個獨立的 Worker 程序從佇列中取出任務，並嚴格按以下順序執行：

    *   **步骤一：AIO 數據提取 (AIO Data Fetching)**
        *   **工具：** SerpApi
        *   **動作：** 使用 `目標關鍵字` 進行搜尋，提取並儲存 `AI Overview` 的完整摘要文本及其引用的 `所有外部連結 (AIO References)`。

    *   **步骤二：批量內容爬取 (Batch Content Scraping)**
        *   **工具：** Firecrawl API
        *   **動作：** 調用 Firecrawl 的**批量爬取 (Batch Scrape)** 功能，一次性爬取 `我的網頁URL` 和 `AIO References` 列表中的所有網址，獲取其乾淨的 Markdown 內容。

    *   **步骤三：內容精煉 (Content Refinement)**
        *   **目標：** 將長篇 Markdown 智能地壓縮成包含核心論點的精簡摘要。
        *   **動作：** 對於**步驟二**中爬取的**每一個**頁面，並行執行以下任務：
            1.  **分塊 (Chunking):** 將單個頁面的長 Markdown 按邏輯邊界（如 H2 標題）或遞歸字符策略分割成多個文本塊 (Chunks)。
            2.  **並行摘要 (Parallel Summarization):** 使用**低成本、高速模型 (如 `gpt-3.5-turbo`)** 和**「精煉 Prompt」**（見 3.1 節），對每個文本塊提取核心論點、數據和實體。
            3.  **彙整 (Aggregation):** 將所有文本塊的摘要結果合併，為每個原始頁面生成一份濃縮的**「關鍵點摘要 (Essentials Summary)」**。

    *   **步骤四：最終差距分析 (Final Gap Analysis)**
        *   **目標：** 比較使用者和競爭者的核心內容，生成優化策略。
        *   **動作：**
            1.  **組裝數據：** 將**步驟三**中產生的**「關鍵點摘要」**組裝成主分析 Prompt 所需的 JSON 輸入格式。
            2.  **執行分析：** 使用**高性能模型 (如 `gpt-4-turbo`)** 和**「主分析 Prompt」**（見 3.2 節），生成最終的結構化 JSON 分析報告。

3.  **結果儲存與查詢 (Result Handling):** Worker 將生成的 JSON 報告與 `jobId` 關聯並儲存。前端透過 `GET /api/results/{jobId}` 輪詢狀態，並在完成時獲取報告。

---

### **3. AI 核心 Prompt 策略 (Core AI Prompt Strategy)**

#### **3.1. Prompt 1: 內容精煉 Prompt (Content Refinement Prompt)**
*   **用途：** 用於工作流的「步驟三」，由低成本、高速模型執行。
*   **目標：** 從單個文本塊中快速、準確地提取事實性、關鍵性信息。

```prompt
你是一個SEO內容分析助理。你的任務是閱讀以下提供的文本塊，並僅提取出其中所有包含以下元素的關鍵資訊：
- 核心論點、主張和結論。
- 具體的數據、統計數字、年份、或金額。
- 提到的特定產品名稱、技術術語、法律法規、人物、或組織機構名稱 (實體)。
- 清晰、可執行的建議、技巧或操作步驟。

你的輸出必須遵循以下規則：
1. 以無序列表的格式返回結果（使用'-'符號）。
2. 忽略所有引言、問候、過渡性語句和主觀性強的形容詞。
3. 保持中立和客觀，只提煉事實和關鍵點。

[此處插入文本塊]
```

#### **3.2. Prompt 2: 主分析 Prompt (Main Analysis Prompt)**
*   **用途：** 用於工作流的「步驟四」，由高性能模型執行。
*   **目標：** 基於精煉後的關鍵點摘要，進行深度、多維度的差距分析，並生成結構化的行動計畫。

```prompt
# [SYSTEM] Persona & Role
You are "AIO-Gap-Analyzer-GPT", an elite SEO analyst and data scientist. Your expertise lies in meticulously comparing web content against Google's AI Overviews (AIO) to identify actionable optimization opportunities. You think in terms of topics, entities, user intent, and E-E-A-T signals. Your output must be structured, data-driven, and directly usable by a web developer or content creator.

# [USER] Context & Task
You will receive a JSON object containing all the necessary data for your analysis. The data provided has been pre-processed into concise summaries of key points. Your analysis MUST be based on these provided summaries. The data includes:
1.  `analysisContext`: The target keyword and the exact text of the Google AI Overview.
2.  `userPage`: The URL and a concise `essentialsSummary` of the user's page.
3.  `competitorPages`: An array of pages referenced in the AI Overview, each with its URL and concise `essentialsSummary`.

Your task is to perform a comprehensive gap analysis and generate a strategic report.

# [SYSTEM] Output Format
Your entire response MUST be a single, valid JSON object, without any surrounding text or markdown. Adhere strictly to the following schema. Use the provided descriptions to guide the content of each field.
{
  "executiveSummary": {
    "mainReasonForExclusion": "A concise, one-sentence explanation of the primary reason the user's page was not featured in the AI Overview, based on the provided summaries.",
    "topPriorityAction": "The single most impactful change the user should make."
  },
  "contentGapAnalysis": {
    "missingTopics": [
      {
        "topic": "The specific missing topic or question.",
        "description": "Why this topic is important and how competitors' summaries cover it.",
        "sourceCompetitors": ["url-of-competitor-1.com"]
      }
    ],
    "entityGap": [
      {
        "entity": "A key person, product, or organization missing from the user's summary.",
        "description": "Why mentioning this entity adds authority or context.",
        "sourceCompetitors": ["url-of-competitor-1.com"]
      }
    ]
  },
  "actionableImprovementPlan": {
    "highPriority": [
      { "actionType": "ADD_NEW_SECTION", "suggestion": "...", "details": "...", "rationale": "..." }
    ],
    "mediumPriority": [
      { "actionType": "ENRICH_EXISTING_CONTENT", "suggestion": "...", "details": "...", "rationale": "..." }
    ],
    "lowPriority": [
      { "actionType": "IMPROVE_E_E_A_T", "suggestion": "...", "details": "...", "rationale": "..." }
    ]
  }
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

### **4. 開發路線圖 (Detailed Development Roadmap)**

#### **第一階段：後端核心服務與 AI 策略驗證 (2-3 週)**
*   **目標：** 搭建後端基礎架構，開發並獨立測試所有核心服務模組，驗證並鎖定兩個 Prompt 的分析品質。
*   **任務：**
    1.  **環境搭建：** 初始化 Node.js 專案，設定 Express, BullMQ, Redis。
    2.  **外部 API 服務開發：** 創建 `serpapi.service.js` 和 `firecrawl.service.js`，包含錯誤處理和重試機制。
    3.  **內容精煉服務開發：** 創建 `contentRefiner.service.js`，實現文本分塊、並行摘要和結果彙整邏輯。
    4.  **Prompt 工程與驗證 (本階段核心)：**
        *   **創建「黃金測試集」：** 手動準備 5-10 組高品質測試案例，每個案例包含目標關鍵字、AIO 文本，以及**精煉後的**使用者與競爭者摘要。
        *   **迭代「精煉 Prompt」：** 使用原始長文本，驗證 `contentRefiner.service` 產生的摘要是否準確、無損。
        *   **迭代「主分析 Prompt」：** 使用黃金測試集中的精煉摘要，驗證 `aiAnalyzer.service` 產生的報告是否深度、準確、可操作。
*   **交付物：** 所有後端服務模組，一份經過驗證的「黃金測試集」，以及兩個鎖定版本的 Prompt。

#### **第二階段：後端整合與 API 實現 (1-2 週)**
*   **目標：** 將所有獨立模組串聯成一個由任務佇列驅動的完整工作流，並透過 API 暴露給外部。
*   **任務：**
    1.  **開發 Worker 程序：** 創建 `analysis.worker.js`，按 `步骤一 -> ... -> 步骤四` 的順序調用所有服務，並實現進度更新和錯誤處理。
    2.  **開發 API 端點：** 實現 `POST /api/analyze` 和 `GET /api/results/{jobId}`。
    3.  **整合與端到端測試：** 使用 API 測試工具（如 Postman）對整個後端流程進行完整測試。
*   **交付物：** 一個可完整執行分析流程的 Worker 腳本，兩個功能完整的 API 端點，一份測試報告。

#### **第三階段：前端開發與使用者體驗 (2-3 週)**
*   **目標：** 開發一個直觀、響應迅速的前端介面，並以富有洞察力的方式展示分析報告。
*   **任務：**
    1.  **UI/UX 設計：** 設計輸入頁、處理中頁面（含進度條）和報告頁面（視覺化呈現 JSON 數據）。
    2.  **前端開發：** 使用 React 建立可重用的 UI 組件。
    3.  **API 對接：** 實現表單提交、任務輪詢邏輯，並將獲取的報告數據動態渲染。
*   **交付物：** 一套 UI 設計稿，一個功能完整的單頁應用 (SPA)。

#### **第四階段：部署、優化與上線準備 (1-2 週)**
*   **目標：** 將應用部署到雲端，進行性能優化，並建立監控和反饋機制。
*   **任務：**
    1.  **部署：** 將後端 API、Worker、Redis 和前端應用分別部署到合適的雲端平台。
    2.  **成本與性能優化：**
        *   **實現快取機制：** 在 API 層對近期已完成的相同請求直接返回結果，避免重複計算。
    3.  **建立監控與反饋系統：**
        *   整合錯誤監控服務（如 Sentry）。
        *   建立結構化的日誌系統。
        *   在前端報告中加入「建議是否有用」的反饋按鈕，收集數據用於未來微調 Prompt。
*   **交付物：** 一個公開可訪問的線上應用，實作了快取邏輯，並整合了監控與反饋功能。

---

### **5. 風險評估 (Risk Assessment)**
*   **API 依賴風險：** 外部 API 格式變更或服務中斷。**應對：** 選擇專業服務商，並在代碼中做好錯誤處理。
*   **分析品質風險：** AI 生成不準確的建議。**應對：** 持續進行 Prompt 工程，依賴「黃金測試集」進行回歸測試，並在 UI 中提示使用者結合專家判斷。
*   **成本風險：** API 呼叫費用超出預期。**應對：** **分層摘要架構**是主要控制手段。結合後端快取和合理的使用者收費方案，嚴格控制成本。
*   **爬蟲穩定性風險：** 網站反爬蟲機制。**應對：** 依賴 Firecrawl 這類專業服務。對爬取失敗的單個頁面進行優雅降級，不中斷整個分析任務。