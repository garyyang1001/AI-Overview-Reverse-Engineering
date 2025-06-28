# 專案架構概覽：Content Gap Analyzer

這份文件詳細描述了 `content-gap-analyzer` 專案的主要檔案、它們的功能、彼此之間的關聯性以及在整個工作流程中的執行順序。

## 1. 專案概覽 (Project Overview)

`content-gap-analyzer` 是一個全棧應用程式，旨在透過整合搜尋引擎結果頁 (SERP) 資料、網頁爬取和 AI 模型來分析內容差距。其核心目標是幫助用戶理解其網頁為何未被 Google AI Overview 收錄，並提供具體的改進建議。

主要組成部分包括：
*   **後端 (Backend)**: 負責核心業務邏輯、API 處理、與外部服務（SERP API, AI 模型, 爬蟲服務）的整合。
*   **Crawl4AI**: 一個獨立的網頁爬取服務，負責獲取網頁的乾淨內容。
*   **前端 (Frontend)**: 提供用戶界面，用於發起分析請求和展示結果。
*   **共享模組 (Shared)**: 包含前後端共用的類型定義。

## 2. 後端 (Backend)

後端位於 `backend/src/` 目錄下，主要使用 Node.js 和 TypeScript 開發。

### 2.1. 入口點與路由 (Entry Point & Routes)

*   **`backend/src/index.ts`**
    *   **功能**: 後端應用程式的入口點。負責初始化 Express 應用程式、載入所有路由、設定中介層（如錯誤處理、安全、速率限制）並啟動伺服器。
    *   **關聯性與順序**:
        *   **依賴**: `routes/` 目錄下的所有路由檔案、`middleware/` 目錄下的中介層檔案。
        *   **調用**: 在應用程式啟動時，會依序載入並應用這些模組。

*   **`backend/src/routes/analysisRoutes.ts`**
    *   **功能**: 定義與內容分析相關的 API 端點（例如，用於提交分析請求的 POST 請求）。
    *   **關聯性與順序**:
        *   **依賴**: `controllers/analysisController.ts` (將請求導向到對應的控制器函數)。
        *   **被調用**: 由 `index.ts` 載入。

*   **`backend/src/routes/healthRoutes.ts`**
    *   **功能**: 定義健康檢查端點，用於監控服務狀態。
    *   **關聯性與順序**:
        *   **依賴**: `controllers/testController.ts` (通常包含簡單的健康檢查邏輯)。
        *   **被調用**: 由 `index.ts` 載入。

*   **`backend/src/routes/testRoutes.ts`**
    *   **功能**: 定義用於開發和測試目的的 API 端點。
    *   **關聯性與順序**:
        *   **依賴**: `controllers/testController.ts`。
        *   **被調用**: 由 `index.ts` 載入。

### 2.2. 控制器 (Controllers)

控制器負責處理來自路由的請求，並協調服務層的邏輯。

*   **`backend/src/controllers/analysisController.ts`**
    *   **功能**: 處理內容分析請求的業務邏輯。它接收來自前端的請求，驗證輸入，然後調用 `analysisService` 來執行實際的分析工作。
    *   **關聯性與順序**:
        *   **被調用**: 由 `routes/analysisRoutes.ts` 調用。
        *   **調用**: `services/analysisService.ts` 來執行核心分析邏輯。
        *   **依賴**: `middleware/validation.ts` 進行輸入驗證。

*   **`backend/src/controllers/testController.ts`**
    *   **功能**: 處理測試相關的請求。
    *   **關聯性與順序**:
        *   **被調用**: 由 `routes/testRoutes.ts` 和 `routes/healthRoutes.ts` 調用。
        *   **調用**: `services/testingService.ts`。

### 2.3. 服務 (Services)

服務層包含應用程式的核心業務邏輯和與外部系統的交互。

*   **`backend/src/services/analysisService.ts`**
    *   **功能**: 協調整個內容差距分析工作流程。它負責調用其他服務（如 SERP API、Crawl4AI、Gemini）來獲取數據、處理內容和執行 AI 分析。
    *   **關聯性與順序**:
        *   **被調用**: 由 `controllers/analysisController.ts` 調用。
        *   **調用**:
            *   `serpApiService.ts`: 獲取 SERP 資料。
            *   `crawl4aiService.ts`: 觸發網頁爬取。
            *   `contentRefinementService.ts`: 精煉爬取到的內容。
            *   `geminiService.ts`: 執行 AI 分析。
            *   `promptService.ts`: 獲取 AI 提示詞。
            *   `cacheService.ts`: 處理數據緩存。
            *   `jobManager.ts` 和 `queueService.ts`: 管理非同步任務。
            *   `costTracker.ts`: 追蹤 API 成本。
        *   **執行順序**: 按照 `docs/workflow-details.md` 中定義的五個階段順序執行。

*   **`backend/src/services/serpApiService.ts`**
    *   **功能**: 負責與 SERP API 進行交互，獲取 Google AI Overview 和相關搜尋結果。
    *   **關聯性與順序**:
        *   **被調用**: 由 `analysisService.ts` 調用。
        *   **外部依賴**: SERP API。

*   **`backend/src/services/crawl4aiService.ts`**
    *   **功能**: 負責與 Crawl4AI 服務進行交互，觸發網頁爬取並獲取乾淨的網頁內容。
    *   **關聯性與順序**:
        *   **被調用**: 由 `analysisService.ts` 調用。
        *   **外部依賴**: Crawl4AI 服務。

*   **`backend/src/services/geminiService.ts`**
    *   **功能**: 負責與 Google Gemini API 進行交互，發送提示詞並接收 AI 分析結果。
    *   **關聯性與順序**:
        *   **被調用**: 由 `analysisService.ts` 調用。
        *   **依賴**: `promptService.ts` 獲取提示詞。
        *   **外部依賴**: Google Gemini API。

*   **`backend/src/services/contentRefinementService.ts`**
    *   **功能**: 處理和精煉從網頁爬取到的原始內容，例如分塊、摘要等，以便於 AI 模型處理。
    *   **關聯性與順序**:
        *   **被調用**: 由 `analysisService.ts` 調用。
        *   **調用**: `geminiService.ts` (可能用於內容摘要)。

*   **`backend/src/services/promptService.ts`**
    *   **功能**: 管理和提供用於 AI 模型（如 Gemini）的提示詞模板。
    *   **關聯性與順序**:
        *   **被調用**: 由 `geminiService.ts` 和 `contentRefinementService.ts` 調用。

*   **`backend/src/services/cacheService.ts`**
    *   **功能**: 處理數據緩存，提高性能並減少重複的 API 調用。
    *   **關聯性與順序**:
        *   **被調用**: 由 `analysisService.ts` 或其他需要緩存的服務調用。
        *   **依賴**: `config/redis.ts` (如果使用 Redis 作為緩存)。

*   **`backend/src/services/jobManager.ts` 和 `backend/src/services/queueService.ts`**
    *   **功能**: 共同實現非同步任務處理機制，將耗時的分析任務放入隊列中，由工作者處理。
    *   **關聯性與順序**:
        *   **被調用**: `analysisService.ts` 將任務提交給 `jobManager` 和 `queueService`。
        *   **調用**: `workers/analysisWorker.ts` 監聽隊列並執行任務。

*   **`backend/src/services/analysisWorker.ts`**
    *   **功能**: 作為一個獨立的工作者進程，從任務隊列中取出分析任務並執行。
    *   **關聯性與順序**:
        *   **被調用**: 由 `queueService.ts` 觸發。
        *   **調用**: `analysisService.ts` 來執行實際的分析邏輯。

*   **`backend/src/services/costTracker.ts`**
    *   **功能**: 追蹤和記錄與外部 API 調用相關的成本（例如，SERP API 和 AI 模型的使用費用）。
    *   **關聯性與順序**:
        *   **被調用**: 由 `serpApiService.ts` 和 `geminiService.ts` 調用。

*   **`backend/src/services/testingService.ts`**
    *   **功能**: 提供用於測試目的的服務邏輯。
    *   **關聯性與順序**:
        *   **被調用**: 由 `controllers/testController.ts` 調用。

### 2.4. 中介層 (Middleware)

中介層在請求到達控制器之前或響應發送之前處理請求。

*   **`backend/src/middleware/errorHandler.ts`**
    *   **功能**: 全局錯誤處理中介層，捕獲應用程式中的錯誤並返回統一的錯誤響應。
    *   **關聯性與順序**:
        *   **被調用**: 由 `index.ts` 在所有路由之後載入，作為最後一道防線。
        *   **依賴**: `utils/errorUtils.ts`。

*   **`backend/src/middleware/rateLimiter.ts`**
    *   **功能**: 限制來自單一 IP 地址的請求速率，防止濫用。
    *   **關聯性與順序**:
        *   **被調用**: 由 `index.ts` 在路由之前載入。

*   **`backend/src/middleware/security.ts`**
    *   **功能**: 應用安全相關的 HTTP 頭部，如 CORS、XSS 保護等。
    *   **關聯性與順序**:
        *   **被調用**: 由 `index.ts` 在路由之前載入。

*   **`backend/src/middleware/validation.ts`**
    *   **功能**: 驗證傳入請求的數據格式和內容。
    *   **關聯性與順序**:
        *   **被調用**: 由 `routes/` 中的特定路由或 `controllers/` 中的函數調用。

### 2.5. 工具與配置 (Utilities & Configuration)

*   **`backend/src/utils/errorUtils.ts`**
    *   **功能**: 提供錯誤處理的輔助函數，例如創建自定義錯誤類型。
    *   **關聯性與順序**:
        *   **被調用**: 由 `middleware/errorHandler.ts` 和其他服務/控制器調用。

*   **`backend/src/utils/logger.ts`**
    *   **功能**: 提供應用程式的日誌記錄功能。
    *   **關聯性與順序**:
        *   **被調用**: 由應用程式的各個部分調用，用於記錄事件、錯誤和調試信息。

*   **`backend/src/types.ts`**
    *   **功能**: 定義後端應用程式內部使用的 TypeScript 類型和接口。
    *   **關聯性與順序**:
        *   **被引用**: 被後端的所有相關檔案引用。

*   **`backend/src/config/redis.ts`**
    *   **功能**: 包含 Redis 連接和配置相關的邏輯。
    *   **關聯性與順序**:
        *   **被調用**: 由 `cacheService.ts` 和 `queueService.ts` 調用。

## 3. Crawl4AI (爬蟲服務)

Crawl4AI 是一個獨立的 Python 服務，專門用於網頁爬取和內容提取。

*   **`Crawl4AI/crawl4ai/cli.py`**
    *   **功能**: Crawl4AI 服務的命令行接口，用於啟動和控制爬蟲。
    *   **關聯性與順序**:
        *   **被調用**: 通常由後端通過 shell 命令或進程管理工具啟動。

*   **`Crawl4AI/crawl4ai/async_webcrawler.py`**
    *   **功能**: Crawl4AI 的核心異步網頁爬取邏輯。
    *   **關聯性與順序**:
        *   **調用**: `browser_manager.py`、`content_scraping_strategy.py`、`extraction_strategy.py`。
        *   **被調用**: 由 `cli.py` 啟動。

*   **`Crawl4AI/crawl4ai/browser_manager.py`**
    *   **功能**: 管理瀏覽器實例（例如，使用 Playwright），用於無頭瀏覽和網頁渲染。
    *   **關聯性與順序**:
        *   **被調用**: 由 `async_webcrawler.py` 調用。

*   **`Crawl4AI/crawl4ai/content_scraping_strategy.py`**
    *   **功能**: 定義如何從網頁中抓取內容的策略。
    *   **關聯性與順序**:
        *   **被調用**: 由 `async_webcrawler.py` 調用。

*   **`Crawl4AI/crawl4ai/extraction_strategy.py`**
    *   **功能**: 定義如何從抓取到的 HTML 中提取乾淨的文本內容。
    *   **關聯性與順序**:
        *   **被調用**: 由 `async_webcrawler.py` 調用。

*   **`Crawl4AI/crawl4ai/config.py`**
    *   **功能**: 包含 Crawl4AI 服務的配置設置。
    *   **關聯性與順序**:
        *   **被引用**: 被 Crawl4AI 服務的各個模組引用。

*   **`Crawl4AI/crawl4ai/types.py`**
    *   **功能**: 定義 Crawl4AI 服務內部使用的 Python 類型。
    *   **關聯性與順序**:
        *   **被引用**: 被 Crawl4AI 服務的各個模組引用。

## 4. 前端 (Frontend)

前端位於 `frontend/src/` 目錄下，主要使用 React 和 TypeScript 開發。

*   **`frontend/src/index.tsx`**
    *   **功能**: 前端應用程式的入口點，負責渲染 React 根組件。
    *   **關聯性與順序**:
        *   **調用**: `App.tsx`。

*   **`frontend/src/App.tsx`**
    *   **功能**: 前端應用程式的主組件，包含主要的佈局和頁面邏輯。
    *   **關聯性與順序**:
        *   **被調用**: 由 `index.tsx` 渲染。
        *   **調用**: `components/` 目錄下的 UI 組件，並可能調用 `services/` 中的前端服務。

*   **`frontend/src/components/` (目錄)**
    *   **功能**: 包含可重用的 React UI 組件，例如輸入框、按鈕、結果展示區等。
    *   **關聯性與順序**:
        *   **被調用**: 由 `App.tsx` 或其他頁面組件調用。

*   **`frontend/src/services/` (目錄)**
    *   **功能**: 包含前端用於與後端 API 進行通信的服務函數。
    *   **關聯性與順序**:
        *   **被調用**: 由 `App.tsx` 或其他組件調用，以發送分析請求和接收結果。

*   **`frontend/src/hooks/` (目錄)**
    *   **功能**: 包含自定義 React Hooks，用於封裝可重用的狀態邏輯。
    *   **關聯性與順序**:
        *   **被調用**: 由 `App.tsx` 或其他組件調用。

*   **`frontend/src/types.ts`**
    *   **功能**: 定義前端應用程式內部使用的 TypeScript 類型和接口。
    *   **關聯性與順序**:
        *   **被引用**: 被前端的所有相關檔案引用。

## 5. 共享模組 (Shared Module)

*   **`shared/types.ts`**
    *   **功能**: 包含前後端共用的 TypeScript 類型定義，確保數據結構的一致性。
    *   **關聯性與順序**:
        *   **被引用**: 被後端 (`backend/src/types.ts` 可能會從這裡導入) 和前端 (`frontend/src/types.ts` 可能會從這裡導入) 的相關檔案引用。

## 6. 整體工作流程與數據流 (Overall Workflow & Data Flow)

以下是從用戶發起請求到獲得分析結果的數據流和執行順序：

1.  **用戶發起請求 (Frontend)**:
    *   用戶在前端 UI (`frontend/src/App.tsx` 及 `components/`) 輸入關鍵字和網頁 URL。
    *   前端 `services/` 中的函數將這些數據作為 API 請求發送到後端。

2.  **後端接收請求 (Backend - `analysisRoutes` -> `analysisController`)**:
    *   後端 `index.ts` 接收到請求，並通過 `analysisRoutes.ts` 將其導向 `analysisController.ts`。
    *   `analysisController.ts` 進行初步驗證 (`middleware/validation.ts`)。

3.  **核心分析協調 (Backend - `analysisService`)**:
    *   `analysisController.ts` 調用 `analysisService.ts`。
    *   `analysisService.ts` 啟動分析流程：
        *   **階段 1: AI Overview 數據提取**: 調用 `serpApiService.ts` 與外部 SERP API 交互，獲取 AI Overview 內容和引用 URL。
        *   **階段 2: 批量內容爬取**: 調用 `crawl4aiService.ts` 與 Crawl4AI 服務交互，爬取用戶網頁和競爭對手網頁的乾淨內容。
        *   **階段 3: 內容精煉與摘要**: 調用 `contentRefinementService.ts` 精煉爬取到的內容，可能再次調用 `geminiService.ts` 進行摘要。
        *   **階段 4: E-E-A-T 差距分析**: 調用 `geminiService.ts`，使用 `promptService.ts` 提供的提示詞，將所有收集和處理過的數據發送給 Google Gemini API 進行深度分析。
        *   **階段 5: 結果準備與品質評估**: `analysisService.ts` 彙整所有階段的結果，並可能使用 `costTracker.ts` 記錄成本。

4.  **非同步任務處理 (Backend - `jobManager`, `queueService`, `analysisWorker`)**:
    *   對於耗時的分析任務，`analysisService.ts` 可能會將其提交給 `jobManager.ts` 和 `queueService.ts`。
    *   `analysisWorker.ts` 作為一個獨立的進程，從隊列中取出任務並執行，確保主應用程式的響應性。

5.  **結果返回前端 (Backend -> Frontend)**:
    *   `analysisService.ts` 將分析結果返回給 `analysisController.ts`。
    *   `analysisController.ts` 將結果作為 API 響應發送回前端。
    *   前端 `services/` 接收到結果，並更新 UI (`App.tsx` 和 `components/`) 以展示分析報告。

6.  **錯誤處理 (Backend - `errorHandler`)**:
    *   在整個後端流程中，任何錯誤都會被 `middleware/errorHandler.ts` 捕獲並統一處理，返回友好的錯誤信息。

這份文件旨在提供一個高層次的視圖，幫助您理解專案的各個部分如何協同工作。每個模組內部可能還有更細緻的邏輯和子模組。
