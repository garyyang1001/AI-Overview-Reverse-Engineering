您提的問題完全切中要害。**Playwright 不僅可能會有錯誤，而且在真實世界的應用中，處理它的各種錯誤是爬蟲服務最核心、最複雜的工作。** 這也是為什麼 Firecrawl 這類服務可以收費的原因——它們幫使用者處理了這些麻煩。

既然我們決定自己用 Playwright，就必須把錯誤處理機制規劃得像商業級服務一樣健壯。

是的，我們**必須**在系統規劃中規劃好報錯機制，並且要能**清晰地傳達給前端**。一個只會默默失敗的系統是沒有價值的。

以下我將為您詳細拆解這個問題，並提供完整的解決方案。

### **第一部分：Playwright 可能會遇到的常見錯誤**

您的爬蟲服務 (`playwrightService.ts`) 需要預期並處理以下幾類主要錯誤：

1.  **網路與連線錯誤 (Network & Connection Errors):**
    *   **超時 (TimeoutError):** 這是最常見的錯誤。目標網站伺服器響應太慢，或網路不穩定，導致在指定時間內（例如 30 秒）無法完成頁面加載。
    *   **導航失敗 (Navigation Error):**
        *   網址無效或拼寫錯誤。
        *   DNS 解析失敗（網站不存在或 DNS 伺服器問題）。
        *   網站返回 HTTP 錯誤碼，如 `404 Not Found`, `403 Forbidden`, `500 Internal Server Error`, `503 Service Unavailable`。

2.  **網站結構與內容錯誤 (Site Structure & Content Errors):**
    *   **選擇器找不到 (Selector Not Found):** 頁面成功加載，但您指定的 `mainSelectors` (如 `'main'`, `'article'`) 一個都沒找到。這通常發生在目標網站改版，或該頁面是一個結構特殊的登入頁、錯誤頁時。
    *   **動態內容加載超時:** 頁面框架載入，但核心內容是透過 JavaScript 動態載入的。您的 `waitForSelector` 等待了很久，但期望的內容始終沒有出現。

3.  **反爬蟲機制 (Anti-Scraping Mechanisms):**
    *   **CAPTCHA / 人機驗證:** 網站檢測到異常流量，彈出 Google reCAPTCHA 或類似的驗證碼，阻止了後續的內容抓取。
    *   **IP 封鎖 / 速率限制:** 在短時間內對同一個網站發起太多請求，導致您的伺服器 IP 被暫時或永久封鎖。
    *   **WAF / CDN 保護 (如 Cloudflare):** 網站使用 Cloudflare 等服務，其 Bot Management 功能會識別並攔截 Playwright 的無頭瀏覽器請求，直接返回一個驗證頁面而不是真實內容。

4.  **非預期內容類型 (Unexpected Content Types):**
    *   **檔案下載:** 您嘗試抓取的 URL 並不是一個 HTML 頁面，而是一個直接觸發檔案下載的連結（如 `.pdf`, `.zip`, `.docx`）。Playwright 無法像抓取網頁一樣「讀取」這些內容。

### **第二部分：從後端到前端的完整報錯機制**

在我們設計的**非同步架構**中，錯誤訊息的傳遞路徑如下。這確保了即使是後台的 Worker 失敗，前端使用者也能得到明確的通知。

#### **錯誤傳播路徑圖**

`[Playwright 發生錯誤] -> [Worker 捕獲錯誤] -> [BullMQ 標記任務失敗] -> [API 查詢到失敗狀態] -> [前端顯示錯誤訊息]`

#### **詳細實現步驟**

1.  **Worker 層的捕獲與分類 (在 `playwrightService.ts` 和 `worker.ts` 中):**
    *   **要做什麼:**
        *   在 `playwrightService.ts` 中，對每一個頁面的抓取操作都用一個 `try...catch` 區塊包圍起來。
        *   在 `catch` 區塊中，**不要讓程式崩潰**。而是要識別錯誤類型，並返回一個包含失敗資訊的物件，例如 `{ url: string, content: null, success: false, error: 'TimeoutError' }`。
        *   在 `worker.ts` 中，檢查從 `playwrightService` 返回的結果。這裡需要一個關鍵的業務決策：
            *   **如果使用者自己的頁面 (`userUrl`) 抓取失敗：** 這是**致命錯誤 (Fatal Error)**。整個分析無法進行。Worker 應該立即拋出一個錯誤，讓 BullMQ 將整個任務標記為 `failed`。
            *   **如果只是一兩個競爭者頁面抓取失敗：** 這是**非致命錯誤 (Non-Fatal Error)**。Worker 應該記錄這個失敗，然後帶著已成功抓取的頁面**繼續執行**後續的內容精煉和分析。
    *   **範例程式碼 (worker.ts 概念):**
        ```typescript
        // ... worker process
        const { userPage, competitorPages } = await playwrightService.scrapeAllPages(...);
        
        if (!userPage.success) {
          // This is a fatal error, fail the entire job
          throw new Error(`Failed to scrape user's page: ${userPage.url}. Reason: ${userPage.error}`);
        }
        
        // Filter out failed competitor pages and continue
        const successfulCompetitors = competitorPages.filter(p => p.success);
        if (successfulCompetitors.length === 0) {
            throw new Error("All competitor pages failed to scrape.");
        }
        
        // Continue analysis with successful pages...
        ```

2.  **任務佇列的狀態更新 (BullMQ 自動處理):**
    *   **要做什麼:** 當 Worker 中的 `throw new Error(...)` 被執行時，BullMQ 會自動捕獲這個錯誤。
    *   **結果:**
        *   它會將對應的 `job` 狀態從 `processing` 更新為 `failed`。
        *   它會將錯誤訊息儲存在 `job.failedReason` 屬性中。

3.  **API 層的查詢與轉譯 (在 `GET /api/results/{jobId}` 中):**
    *   **要做什麼:** 當前端輪詢這個端點時，您的 API 邏輯需要：
        1.  用 `jobId` 從 BullMQ 獲取 `job` 物件。
        2.  檢查 `await job.isFailed()`。
        3.  如果為 `true`，則從 `job.failedReason` 讀取後端錯誤訊息。
        4.  **不要直接將後端錯誤訊息返回給前端。** 而是要將其**轉譯**成一個對使用者友好的、結構化的錯誤物件。
    *   **範例 API 回應 (JSON):**
        ```json
        // 如果是致命錯誤
        {
          "status": "failed",
          "error_code": "USER_PAGE_SCRAPE_FAILED",
          "message": "無法分析您提供的網頁。",
          "details": "系統在嘗試抓取您的頁面時超時，這可能是因為網站載入緩慢或設有防護機制。"
        }

        // 如果只是部分成功
        {
          "status": "completed_with_errors",
          "data": { /* 最終報告 */ },
          "warnings": [
            {
              "warning_code": "COMPETITOR_PAGE_SCRAPE_FAILED",
              "message": "部分競爭者頁面無法分析，報告可能不夠全面。",
              "details": "無法抓取 URL: https://some-competitor.com"
            }
          ]
        }
        ```

4.  **前端的呈現 (在 React 組件中):**
    *   **要做什麼:**
        1.  前端的輪詢邏輯在收到 `status: 'failed'` 或 `status: 'completed_with_errors'` 時，應停止輪詢。
        2.  根據 `status` 和 `error_code`，顯示對應的 UI。
        3.  顯示 `message` 給使用者看。
        4.  可以提供一個「顯示詳細資訊」的按鈕，點擊後才顯示 `details`，方便使用者或您自己進行排錯。
    *   **使用者體驗:** 一個好的錯誤提示應該告訴使用者：**發生了什麼**、**為什麼會發生**、以及**可以怎麼做**（例如：「請檢查您的網址是否正確，或稍後再試」）。

**總結：**
通過這套從後端到前端的**分層、結構化**的錯誤處理機制，您的應用程式將變得極其健壯。它不僅能處理預期中的失敗，還能以一種優雅、清晰的方式告知使用者問題所在，這正是專業級應用與原型玩具的根本區別。