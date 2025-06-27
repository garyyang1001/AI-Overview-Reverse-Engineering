【Muji 風格報告設計系統與執行指令】
🎯 設計哲學：以無印良品的精神，打造一份極致清晰的報告

核心原則
功能至上 (Function over Form): 每個設計元素（間距、顏色、線條）都服務於「理解」與「行動」，去除一切不必要的裝飾。
呼吸感 (Breathing Room): 充足的留白是引導視線、降低資訊焦慮的最佳工具。


設計系統 (Design System)
1. 色彩系統 (Color Palette)
規則：嚴格的黑白灰系統，用明度對比建立視覺焦點。

/* 基礎架構 */
--bg-primary: #f8f8f8;       /* 頁面主背景 - 米灰 */
--bg-secondary: #ffffff;     /* 報告主容器 - 純白 */

/* 報告區塊 */
--bg-section: #ffffff;       /* 普通報告區塊背景 */
--bg-priority-block: #fafafa; /* P1/P2/P3 優先級計畫區塊背景 - 極淺灰 */
--bg-prompt-wrapper: #f8f8f8; /* Gemini Prompt 包裝容器 - 米灰 */
--bg-cta: #fafafa;           /* 頁尾CTA區塊背景 */

/* 文字色彩 */
--text-primary: #2c2c2c;      /* 主要標題/正文 - 近黑 */
--text-secondary: #666666;   /* 次要說明文字/標籤 - 中灰 */
--text-tertiary: #999999;     /* 輔助/註釋文字 - 淺灰 */
--text-white: #ffffff;       /* 用於深色背景的文字 */
--text-prompt: #333333;       /* Prompt 程式碼文字 */

/* 邊框與分隔 */
--border-light: #f0f0f0;     /* 區塊內部分隔線 */
--border-normal: #e0e0e0;    /* 區塊間分隔線 */

/* 優先級與行動指示 */
--p1-header-bg: #2c2c2c;      /* P1 標頭背景 - 近黑 */
--p2-header-bg: #808080;      /* P2 標頭背景 - 中灰 */
--p3-header-bg: #b0b0b0;      /* P3 標頭背景 - 淺灰 */
--action-button-bg: #2c2c2c;  /* 可複製按鈕背景 */
--action-button-hover-bg: #555555; /* 按鈕懸停背景 */
2. 字體系統 (Typography)
規則：使用無襯線字體確保現代感與易讀性，程式碼則使用等寬字體。

/* 字體族 */
--font-sans: 'Helvetica Neue', 'Arial', 'Hiragino Sans GB', 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-mono: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;

/* 字重 */
--font-normal: 400;      /* 正文 */
--font-medium: 500;      /* 小標題、改善建議 */
--font-bold: 600;        /* 報告主標題 H1 */

/* 字級 */
--text-h1: 2.2rem;       /* 報告主標題 */
--text-h2: 1.5rem;       /* 各部分標題 (e.g., 第二部分：...) */
--text-h3: 1.1rem;       /* 「改善建議」標題 */
--text-normal: 1rem;     /* 主要說明文字 */
--text-small: 0.9rem;    /* 次要說明、CTA文字 */
--text-tiny: 0.8rem;     /* 註釋、重要提示 */
--text-prompt: 0.85rem;  /* Gemini Prompt 程式碼 */

/* 行高 */
--line-height-heading: 1.3;
--line-height-body: 1.6;
--line-height-prompt: 1.5;
3. 間距與佈局 (Spacing & Layout)
規則：使用 8px 為基礎單位，建立一致的垂直與水平節奏。

/* 間距變數 */
--space-xs: 8px;   /* 0.5rem */
--space-sm: 16px;  /* 1rem */
--space-md: 24px;  /* 1.5rem */
--space-lg: 32px;  /* 2rem */
--space-xl: 48px;  /* 3rem */

/* 佈局規則 */
.report-container {
    max-width: 960px; /* 專注的閱讀寬度 */
    margin: var(--space-xl) auto;
    background: var(--bg-secondary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.report-section {
    padding: var(--space-xl);
    border-bottom: 1px solid var(--border-normal);
}


核心組件庫 (Core Component Library)
1. 優先級計畫區塊 (.priority-block)
用途：承載 P1/P2/P3 行動計畫，是報告最重要的視覺區塊。

結構 (HTML):

<div class="priority-block">
    <div class="priority-header p1">P1 - 立即執行 (高影響力、低執行難度)</div>
    <div class="priority-body">
        <!-- 內部包含多個 .action-item 組件 -->
    </div>
</div>

樣式 (CSS):

.priority-block {
    background: var(--bg-priority-block);
    margin: var(--space-lg) 0;
    border: 1px solid var(--border-light);
}
.priority-header {
    padding: var(--space-sm) var(--space-md);
    color: var(--text-white);
    font-weight: var(--font-medium);
}
.priority-header.p1 { background: var(--p1-header-bg); }
.priority-header.p2 { background: var(--p2-header-bg); }
.priority-header.p3 { background: var(--p3-header-bg); }
.priority-body {
    padding: var(--space-lg) var(--space-md);
}
2. 行動項目 (.action-item)
用途：清晰地呈現單一「改善建議」及其對應的「Gemini Prompt」。

結構 (HTML):

<div class="action-item">
    <h3 class="item-suggestion-title">改善建議：[標題]</h3>
    <p class="item-suggestion-desc">[說明文字]</p>
    <!-- 嵌入 .item-prompt-wrapper 組件 -->
    <div class="item-prompt-wrapper">
      ...
    </div>
</div>

樣式 (CSS):

.action-item {
    margin-bottom: var(--space-xl);
}
.action-item:last-child {
    margin-bottom: 0;
}
.item-suggestion-title { /* h3 */
    font-size: var(--text-h3);
    font-weight: var(--font-medium);
    margin-bottom: var(--space-xs);
    color: var(--text-primary);
}
.item-suggestion-desc {
    font-size: var(--text-normal);
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
}
3. Gemini Prompt 容器 (.item-prompt-wrapper)
用途：報告中最核心的互動元素，設計必須極度清晰、易用。

結構 (HTML):

<div class="item-prompt-wrapper">
    <div class="prompt-header">
        <span>Gemini Prompt</span>
        <button class="copy-button">複製</button>
    </div>
    <div class="prompt-body">
        <pre><code>...複製的內容...</code></pre>
    </div>
    <div class="prompt-note">
        <strong>【重要提示】</strong> AI產出的內容僅供參考...
    </div>
</div>

樣式 (CSS):

.item-prompt-wrapper {
    background: var(--bg-prompt-wrapper);
    border: 1px solid var(--border-light);
}
.prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs) var(--space-sm);
    border-bottom: 1px solid var(--border-light);
}
.copy-button {
    background: var(--action-button-bg);
    color: var(--text-white);
    border: none;
    padding: 4px 12px;
    font-size: var(--text-tiny);
    cursor: pointer;
    transition: background-color 0.2s;
}
.copy-button:hover {
    background: var(--action-button-hover-bg);
}
.prompt-body {
    padding: var(--space-sm);
    font-family: var(--font-mono);
    font-size: var(--text-prompt);
    line-height: var(--line-height-prompt);
    white-space: pre-wrap;
    overflow-x: auto;
}
.prompt-note {
    background: rgba(0,0,0,0.02);
    padding: var(--space-sm);
    font-size: var(--text-tiny);
    color: var(--text-secondary);
    border-top: 1px solid var(--border-light);
}


終極執行指令 (Final Implementation Prompt)
用途：當需要生成此報告的視覺稿或前端代碼時，使用此終極指令。

