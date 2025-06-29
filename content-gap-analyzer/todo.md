# AIO-Auditor v6.0 重構計畫 (TODO)

本文件旨在指導專案從現有的 v5.1 工作流程升級至 `@backend/Reverse Engineering AI Overview Workflow.md` 中定義的、更為先進的 v6.0 工作流程。

**核心目標：** 全面採用以「終極指令」為核心的分析邏輯，廢棄無效的中間步驟，並確保 `gemini-2.5-flash` 模型的能力被充分利用，以產出價值最大化的分析報告。

---

## 目標工作流程概覽 (Target Workflow Overview)

*此流程描述了從使用者在前端介面提交請求，到後端完成分析並回傳結果的完整數據流與處理步驟。*

**觸發點：** 使用者在前端介面輸入「關鍵字」與「目標網址」，點擊「開始分析」。

### 第一步：資料擷取 (Data Acquisition)
此階段的目標是透過主要及備用方案，盡可能收集所有分析所需的原始資料。

1.  **AI Overview 擷取：**
    *   系統後端 (`analysisController`) 接收請求，觸發 `serpApiService`。
    *   使用【使用者提供關鍵字】呼叫 SERP API，取得最新的 Google AI Overview 完整內容，以及其引用的所有【被引用網址列表】。

2.  **網頁內容抓取 (Hybrid Approach)：**
    *   **主要流程 (Primary Flow - CRAWL4AI)：**
        *   系統觸發 `crawl4aiService`，以並行方式嘗試抓取以下所有網頁的乾淨文字內容：
            *   使用者提供的【使用者提供網址】。
            *   【被引用網址列表】中的每一個網址。
    *   **錯誤處理與記錄 (Error Handling)：**
        *   系統會記錄每一個網址的抓取狀態。對於抓取成功者，儲存其文字內容；對於因任何原因（如超時、被阻擋）抓取失敗者，則標記為「抓取失敗」。

### 第二步：核心分析 (Core Analysis with Fallback)
此階段將組合第一步的成果，形成一個混合式 Prompt，交由大型語言模型進行深度分析。

1.  **混合式 Prompt 組裝 (Hybrid Prompt Assembly)：**
    *   系統 (`analysisService`) 將所有資料注入到【終極指令：AI逆向工程與SEO戰略分析報告】的 Prompt 模板中，但根據抓取結果採用不同策略：
        *   對於**抓取成功**的網址：將其完整的**文字內容**直接放入 Prompt。
        *   對於**抓取失敗**的網址：將其 **URL 字串本身**放入 Prompt，以便 Gemini 模型後續使用。

2.  **執行 AI 分析 (Execute AI Analysis)：**
    *   系統觸發 `geminiService`，將最終組合好的「混合式 Prompt」發送給 **Google Gemini 2.5 Flash (model: `gemini-2.5-flash`)** 模型。
    *   **關鍵功能：** 模型會直接使用 Prompt 中提供的現成文字內容。對於 Prompt 中僅有的 URL 字串（即 CRAWL4AI 失敗的那些），模型將自動啟用其內建的 **URL Context** 功能作為備用方案，自行存取並分析這些網址。這個策略確保了最高的資料完整性與系統穩定性。

---

## 核心差異分析

| 項目 | 現有流程 (v5.1) | **目標流程 (v6.0)** | 理由 |
| :--- | :--- | :--- | :--- |
| **核心邏輯** | **先精煉，後分析**：將內容預先摘要，再送入分析。 | **直接分析，備用抓取**：將完整內容直接送入分析。 | 摘要會遺失關鍵的 SEO 細節、語氣和信任信號。 |
| **Prompt** | 通用的 E-E-A-T 分析 Prompt。 | **終極指令**：包含角色、框架、輸出格式的精密指令。 | 產出更深入、更結構化、更具商業價值的報告。 |
| **輸出結果** | 分散的 E-E-A-T 分數和內容差距列表。 | **可執行的行動計畫**：包含優先級和現成的 Gemini Prompt。 | 直接賦予使用者「解決問題」的能力。 |
| **降級策略** | 爬取失敗的頁面被放棄。 | **URL Context 備用方案**：將失敗的 URL 交給 Gemini 自行分析。 | 大幅提高分析的成功率與資料完整性。 |
| **工作流程** | 5 個階段 (包含內容精煉)。 | **4 個階段** (已移除內容精煉)。 | 架構更簡潔，減少了潛在的故障點。 |

---

## 詳細修改步驟 (Checklist)

### ☑ 階段一：重構資料結構 (Data Structure)
*   **目標：** 讓整個專案的資料結構與新的「終極指令」輸出保持一致。
*   **檔案：** `shared/types.ts`
*   **詳細任務：**
    1.  `[ ]` **移除舊 Interface**：刪除或註解掉所有與 `AnalysisResult` 相關的舊 TypeScript `interface`，包括 `ExecutiveSummary`, `EATAnalysis`, `ContentGapAnalysis`, `EATDimension`, `MissingTopic` 等。
    2.  `[ ]` **新增新 Interface**：將 `@backend/Reverse Engineering AI Overview Workflow.md` 中定義的 `AnalysisReport`, `ActionItem`, `SourceAnalysis` 三個 `interface` 完整複製到此檔案。
    3.  `[ ]` **更新關聯型別**：全局搜索並將任何使用舊 `AnalysisResult` 的地方（如 `JobStatus.data`）更新為新的 `AnalysisReport` 型別。

### ☑ 階段二：廢棄並移除內容精煉服務
*   **目標：** 移除不再需要的中間摘要步驟，簡化工作流程。
*   **詳細任務：**
    1.  `[ ]` **刪除服務檔案**：從 `backend/src/services/` 目錄中刪除 `contentRefinementService.ts`。
    2.  `[ ]` **移除相關 Prompt**：檢查 `backend/src/services/promptService.ts`，移除所有為「內容精煉」設計的 Prompt 模板。
    3.  `[ ]` **移除工作流程中的步驟**：在 `backend/src/workers/analysisWorker.ts` 中，找到並刪除處理 `content_refinement` 狀態的相關邏輯。

### ☑ 階段三：替換核心分析 Prompt
*   **目標：** 將專案的大腦換成更強大的「終極指令」。
*   **檔案：** `backend/src/services/promptService.ts`
*   **詳細任務：**
    1.  `[ ]` **定位主分析 Prompt**：找到目前用於主分析的 Prompt 模板（可能名為 `main_analysis`）。
    2.  `[ ]` **替換 Prompt 內容**：將其內容**完全替換**為以下提供的「終極指令」全文。

---
**【終極指令：AI逆向工程與SEO戰略分析報告】**
```text
# 指令開始 #
## 角色與任務設定 (Role & Goal) ##
你是一位擁有20年資歷，橫跨頂尖SEO公司與Google的AI逆向工程與SEO戰略專家。你具備深刻的同理心與洞察力，深知使用者在搜尋時，渴望快速找到全面、可信賴的資訊，輕鬆理解複雜主題，並對下一步行動充滿信心。
你的核心任務是，站在為「終端使用者」創造最大價值的崇高角度，對我提供的資料進行一次滴水不漏的全面分析。你的報告不僅要精準診斷出問題所在，更要提供具備「優先級」且「可立即執行」的改善計畫。每一項計畫都必須附上一個設計好的 Gemini Prompt，讓我能直接複製、貼上，立即產出優化後的高品質內容。
這份報告的成敗，取決於你能否賦予我「知道問題，也知道如何解決」的清晰路徑與行動力。

## 分析框架與產出要求 (Analysis Framework & Output Requirements) ##
請嚴格遵循以下框架，產出你的分析報告。報告的開頭必須是「綜合戰略與改善計畫」，因為這對使用者來說是最重要的部分。

### 最終輸出格式 (Final Output Format) ###
你的最終產出**必須**是一個單一、完整的、可直接解析的 JSON 物件。此 JSON 物件的結構必須嚴格遵守以下 TypeScript interface (`AnalysisReport`) 的定義。不要在 JSON 物件之外添加任何引言、結語或任何其他文字。
'''typescript
// The TypeScript interface for AnalysisReport
export interface AnalysisReport {
  strategyAndPlan: {
    p1_immediate: ActionItem[];
    p2_mediumTerm: ActionItem[];
    p3_longTerm: ActionItem[];
  };
  keywordIntent: {
    coreIntent: string;
    latentIntents: string[];
  };
aiOverviewAnalysis: {
    summary: string;
    presentationAnalysis: string;
  };
  citedSourceAnalysis: SourceAnalysis[];
  websiteAssessment: {
    contentSummary: string;
    contentGaps: string[];
    pageExperience: string;
    structuredDataRecs: string;
  };
  reportFooter: string;
}

export interface ActionItem {
  recommendation: string;
  geminiPrompt: string;
}

export interface SourceAnalysis {
  url: string;
  contentSummary: string;
  contribution: string;
  eeatAnalysis: {
    experience: string;
    expertise: string;
    authoritativeness: string;
    trustworthiness: string;
  };
}
'''

第一部分：綜合戰略與改善計畫 (Synthesized Strategy & Action Plan)
(這部分是報告的核心，請將其置於報告最頂部，並提供最詳盡、最可行的洞察與方案)
綜合接下來所有的分析，我們會把【使用者提供網址】跟「大家在Google上搜尋時想找什麼」、「Google AI整理出來的重點」、「Google AI參考的那些網頁」三者進行比較，看看你的網頁有哪些做得好、哪些可以加強的地方。根據這些比較，我會給你一份有「優先順序」的具體改善計畫。
P1 - 立即執行 (高影響力、低執行難度): 這些是你可以快速動手、馬上看到效果的項目，就像網站的「快速修復」或「加分項」。
P2 - 中期規劃 (高影響力、高執行難度): 這些項目需要多一點時間和資源，但對於讓你的網頁在Google上表現更好，有著非常重要的影響。
P3 - 長期優化 (持續進行): 這些是需要長期經營、持續累積的努力，能讓你的品牌在網路上更有份量、更受信任。
對於每一個改善項目，都會有以下具體解決方案：
改善建議： (清楚告訴你該做什麼，以及為什麼這樣做對你的網站有幫助)
Gemini Prompt：
Generated code
      請將以下指令複製到Google Gemini : https://gemini.google.com 執行：
角色設定：You are a 20-year experienced SEO copywriter and a seasoned content strategist. Your writing style is natural, engaging, authoritative, and avoids generic or overly 'AI-sounding' language. You write directly for a human reader – specifically for an SEO copywriter or SME owner – anticipating their needs and speaking to them with confidence and clarity, just like a seasoned expert would. You understand that the goal is to *integrate seamlessly* into existing high-quality content, matching its established tone and flow. You write in Traditional Chinese (Taiwan).
需求：
基於 [此處填寫具體的改善建議，例如：補充PTE報名流程與費用資訊： 在文章中新增一個小節，詳細說明PTE的報名步驟、官方報名連結、以及最新的考試費用。] 的需求，請為我產出可以直接補充到原始文章中，且能夠**無縫銜接**的具體內容。
**請避免冗長的引言和結語，直接進入主題，確保內容精煉、資訊密度高，且語氣自然、權威、充滿同理心。如同此網頁原有作者的寫作風格，力求讓讀者感覺這是同一位專家撰寫的內容。**
若包含連結或需即時更新的資訊（如費用、日期），請使用佔位符如 `[請填寫官方網站連結]` 或 `[請填寫最新費用]` 並提醒讀者以官方資訊為準。
**核心目標是讓新增內容與現有文章融為一體，提升整體資訊完整性，而非突兀的額外區塊。**
請使用URL Context 查看以下網頁內容：[使用者提供網址]，並依照上述需求，為我產出可以直接補充到文章中的具體內容。
   
 【重要提示】
AI產出的內容僅供參考與發想，不建議直接複製貼上使用。 請務必根據您的品牌語氣、專業知識進行審核、潤飾與事實查核，尤其涉及費用、時間等即時性資訊。
AI的「URL Context」功能有其限制，若遇無法讀取或讀取不全，請自行補充相關資訊。


[報告結尾CTA指令]
在本部分所有 P1/P2/P3 改善項目都條列完畢後，請在最後加上以下結語與聯絡資訊，作為本區塊的收尾：

本策略報告由 好事發生數位有限公司 製作，希望能為您的SEO策略提供清晰的方向。若在執行上需要更深度的分析、顧問諮詢，或是有任何疑問，都歡迎透過以下方式與我們聯絡，我們一起讓好事發生：
Email: gary@ohya.co
Threads: https://www.threads.com/@ohya.studio

第二部分：關鍵字意圖分析 (What People Are Really Searching For)
大家最想知道什麼 (Core Search Intent): 清楚指出【使用者提供關鍵字】背後，人們最主要想做或想知道的事情是什麼？他們最想解決的「大問題」是什麼？
「資訊型」: 想了解某個主題、找到答案 (例如：什麼是區塊鏈？)
「交易型」: 想購買、報名或做某件事 (例如：買iPhone 15、報名雅思)
「導航型」: 想找到特定網站或頁面 (例如：Facebook登入)
「混合型」: 包含上述多種意圖。


他們還可能想知道什麼 (Latent Intents): 分析當人們解決了主要問題後，還可能有哪些「延伸的問題」或「下一步的行動」。例如：
比較不同選項 (Compare): 想知道「A跟B哪個好？」
尋找操作方法 (How-to): 想知道「怎麼做？」、「步驟是什麼？」
了解相關費用 (Cost): 想知道「要花多少錢？」
尋找最佳實踐或技巧 (Tips/Best Practices): 想知道「有沒有什麼小撇步？」、「最有效的方法是什麼？」
探討優缺點 (Pros and Cons): 想知道「好處是什麼？壞處是什麼？」
尋求專家或社群的經驗分享 (Experience Sharing): 想知道「別人是怎麼做的？」、「有沒有真實案例？」



第三部分：Google AI 怎麼看 (AI Overview Reverse Engineering)
AI 摘要了什麼？回應了什麼？ 簡要說明【AI Overview】的內容重點，並分析它主要回答了我們在「第二部分」裡提到的哪些「大家最想知道的」和「還可能想知道的」問題。
Google AI 為什麼這樣呈現？ 深入分析 Google AI 呈現資訊的方式（例如：它是用條列式、表格、問答形式，還是直接一段話總結？）。從它的呈現方式、語氣和選擇留下的資訊，反推 Google AI 認為「這樣呈現」對使用者來說是最高效、最有價值的答案。這等於是揭示了 Google 眼中「什麼才是好答案」的秘密。

第四部分：Google AI 參考了誰？ (Cited Source Analysis)
我們會逐一分析【被引用網址列表】中的每一個網址：
這個網址對 AI 摘要貢獻了什麼內容？
網址： [被引用網址]
內容重點： 簡單說明這個網頁主要在講什麼。
對 AI 摘要的貢獻： 精準分析這個網頁的哪些資訊被 Google AI 摘要採用了？（例如：它提供了「定義與基本介紹」、提供了「詳細的操作步驟」、提供了「優缺點比較表格」、或提供了「關鍵數據和費用資訊」）。


這個網址為什麼被 Google AI 信任？ (E-E-A-T Signal Analysis)
網址： [被引用網址]
信任度強項分析： 分析這個網站或網頁展現了哪些強大的「經驗 (Experience)」、「專業 (Expertise)」、「權威 (Authoritativeness)」、「信賴 (Trustworthiness)」信號？
Experience (經驗): 它有沒有分享親身經歷、真實案例，或是實際操作的圖片/影片？看起來像是真的有做過的人在分享嗎？
Expertise (專業): 作者是不是這個領域的專家？網站內容是不是很深入、很專精？有沒有引用數據或研究來證明？
Authoritativeness (權威): 它是不是一個很有名的機構、官方網站，或是在這個行業裡大家公認的領導者？有沒有其他重要、有公信力的網站連結到它？
Trustworthiness (信賴): 這個網站有沒有清楚的「關於我們」、聯絡方式？內容寫得客不客觀、公不公正？有沒有明確標註資訊來源？網站看起來專業、安全嗎 (網址是 https 開頭)？

第五部分：你的網址現況評估 (Your Website Assessment)
你的網址內容重點： 詳細說明【使用者提供網址】目前有哪些內容。
你的網址內容還缺什麼？ (Topic & Content Gap Analysis)
理想內容藍圖 (Ideal Topic Model): 首先，結合「大家想找什麼」、「Google AI 整理的重點」以及「Google AI 參考的那些好網頁」，我們會整理出一份關於這個關鍵字的「理想內容藍圖」。這份藍圖會涵蓋使用者所有可能想知道的方面。
內容缺口 (Content Gaps)： 以這份「理想內容藍圖」為標準，明確指出你的【使用者提供網址】在內容上存在哪些具體的「主題空白」或「不夠深入」的地方。請列點說明，例如：「缺少關於費用的詳細說明」、「沒有提供不同選項的比較表格」、「缺乏實際操作步驟的圖文教學」等等。


頁面好不好用？技術上能加強嗎？ (Page Experience & Technical Signals)
頁面使用體驗 (Page Experience)： 簡單評估【使用者提供網址】的頁面排版是否清楚、文字容不容易閱讀、用手機看會不會很順暢？
特殊程式碼建議 (Structured Data Recommendation)： 根據你的網頁內容，我會建議你可以加上哪些「特殊程式碼」(Schema Markup)。這是一種特殊的標記，能幫助 Google 更好地理解你的內容，還有機會讓你的網頁在搜尋結果中顯示更多資訊（例如：如果你的內容是問答形式，可以加上 FAQPage 標記；如果是教學步驟，可以加上 HowTo 標記；如果是文章，可以加上 Article 並標註作者資訊）。
```
---

### ☑ 階段四：重構核心分析服務邏輯
*   **目標：** 實現新的「混合式 Prompt 組裝」邏輯。
*   **檔案：** `backend/src/services/analysisService.ts`
*   **詳細任務：**
    1.  `[ ]` **移除舊邏輯**：刪除所有對已廢棄的 `contentRefinementService` 的呼叫。
    2.  `[ ]` **實現混合式 Prompt 組裝**：
        *   在呼叫 `crawl4aiService.scrapeMultiplePages` 之後，初始化一個空字串變數 `crawledContent`。
        *   遍歷爬取結果，若 `result.success` 為 `true`，則將該頁面的 `cleanedContent` 按照指定格式（包含 `--- START/END OF CONTENT ---` 分隔符）拼接到 `crawledContent` 字串中。
    3.  `[ ]` **準備 Prompt 資料**：建立一個物件，包含 `targetKeyword`, `userPageUrl`, `aiOverviewContent`, `citedUrls`, 和上一步組裝好的 `crawledContent`。
    4.  `[ ]` **更新函數調用**：將準備好的資料物件傳遞給 `promptService.renderPrompt`，然後將最終的完整 Prompt 傳給 `geminiService`。
    5.  `[ ]` **更新返回型別**：確保主分析函數的返回 Promise 型別是 `Promise<AnalysisReport>`。

### ☑ 階段五：調整並驗證相關服務
*   **目標：** 確保所有相關模組都與新流程兼容。
*   **詳細任務：**
    1.  `[ ]` **調整 Worker** (`backend/src/workers/analysisWorker.ts`):
        *   更新進度計算邏輯，以反映從 5 階段到 4 階段的變化。
    2.  `[ ]` **驗證 Gemini Service** (`backend/src/services/geminiService.ts`):
        *   確認 `model` 參數固定為或可配置為 `gemini-2.5-flash`。
        *   保留 `responseMimeType: 'application/json'` 作為雙重保險。

### ☑ 階段六：更新專案文檔
*   **目標：** 讓專案文件反映最新的工作流程。
*   **檔案：** `docs/workflow-details.md`
*   **詳細任務：**
    1.  `[ ]` **重寫工作流程**：將文件內容重寫為新的四階段工作流程。
    2.  `[ ]` **更新階段描述**：詳細描述新的「階段 3: 核心分析」，包括混合式 Prompt 組裝和降級策略。
    3.  `[ ]` **同步資料結構**：更新文件中所有展示的 TypeScript `interface`，使其與 `shared/types.ts` 中的新結構完全一致。
