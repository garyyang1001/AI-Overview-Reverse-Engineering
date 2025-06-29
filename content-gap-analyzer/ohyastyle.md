<!DOCTYPE html>
<html lang="zh-Hant" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>後設提示 (Meta-Prompting) 完全指南：一份互動式報告</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Chosen Palette: Custom Theme (#d3e59f, #0a7489, #3b5067) -->
    <!-- Application Structure Plan: The SPA uses a single-page, vertical scrolling layout with a sticky top navigation for easy access to key thematic sections. This structure transforms the linear report into a non-linear, exploratory experience. The flow is designed to guide the user from foundational concepts ('What is it?') to practical applications ('How to use it?') and real-world impact ('Does it work?'). Key sections include an interactive comparison of prompting techniques, visual diagrams for architectural modalities, a 'playbook' for implementation patterns, a case-study breakdown of Parahelp's architecture, and a data visualization of performance benchmarks. This design was chosen to make the dense, technical information digestible and engaging for a broad audience, from developers to product managers, by prioritizing visual and interactive learning over static text. -->
    <!-- Visualization & Content Choices:
        - Prompting Techniques Table -> Goal: Compare -> Viz: Interactive Tabbed Cards -> Interaction: Click to reveal details -> Justification: More engaging and digestible than a static table. (HTML/CSS/JS)
        - Architectural Modalities -> Goal: Compare/Explain -> Viz: HTML/CSS flexbox diagrams -> Interaction: Hover highlights -> Justification: Visually clarifies abstract process flows (Generative vs. Orchestrative). (HTML/CSS)
        - Parahelp Case Study -> Goal: Explain Process -> Viz: HTML/CSS flow diagram -> Interaction: None needed, clarity is key -> Justification: Deconstructs a complex commercial system into an easily understandable verification loop. (HTML/CSS)
        - Performance Benchmarks -> Goal: Inform/Prove -> Viz: Bar Chart -> Interaction: Hover tooltips with precise data -> Justification: Provides compelling, quantitative evidence of meta-prompting's effectiveness. (Chart.js)
        - Implementation Patterns -> Goal: Organize/Inform -> Viz: Tabbed code/text viewer -> Interaction: Click tabs to switch patterns -> Justification: Neatly organizes actionable code examples without cluttering the page. (HTML/CSS/JS)
        - All choices confirmed to use Canvas/HTML/CSS, not SVG or Mermaid, to adhere to constraints while maximizing clarity and interactivity.
    -->
    <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
    <style>
        :root {
            --primary-light: #d3e59f;
            --primary-bg: #f7f9f2; /* Lighter version of primary-light */
            --accent-dark: #0a7489;
            --accent-light: #e6f1f3; /* Lighter version of accent-dark */
            --text-main: #3b5067;
            --text-light: #ffffff;
            --border-color: #d1d5db; /* A neutral gray */
        }
        body {
            font-family: 'Noto Sans TC', 'Inter', sans-serif;
            background-color: var(--primary-bg);
            color: var(--text-main);
        }
        .section-title {
            color: var(--accent-dark);
        }
        .section-subtitle {
            color: var(--text-main);
        }
        .tab.active {
            background-color: var(--accent-dark);
            color: var(--text-light);
        }
        .chart-container {
            position: relative;
            margin: auto;
            height: 400px;
            max-width: 800px;
        }
        .gemini-loader::after {
            content: ' ...';
            animation: loading-dots 1.4s infinite;
        }
        @keyframes loading-dots {
            0%, 20% { content: ' .'; }
            40% { content: ' ..'; }
            60%, 100% { content: ' ...'; }
        }
        .btn-primary {
            background-color: var(--accent-dark);
            color: var(--text-light);
        }
        .btn-primary:hover {
            background-color: #085a6a; /* Darker accent */
        }
        .link-style {
            color: var(--accent-dark);
        }
        .link-style:hover {
            text-decoration: underline;
        }
        .card-neutral {
            background-color: #f3f4f6; /* gray-100 */
            border: 1px solid #e5e7eb; /* gray-200 */
            color: #374151; /* gray-700 */
        }
        .card-accent {
            background-color: var(--accent-light);
            border: 1px solid #bde0e6;
        }
        .card-accent .font-semibold { color: var(--accent-dark); }
        .card-accent .text-sm { color: #0a7489; }

        .conclusion-box {
            background-color: var(--primary-light);
            color: var(--text-main);
        }
        .api-status-success { color: #059669; } /* green-600 */
        .api-status-error { color: #dc2626; } /* red-600 */
        .api-status-warn { color: #f59e0b; } /* amber-500 */
    </style>
</head>
<body class="bg-primary-bg">

    <!-- Main Content -->
    <main>
        <!-- Section: Title -->
        <section id="introduction" class="pt-20 pb-10 bg-white">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-4xl font-bold tracking-tight section-title sm:text-5xl">後設提示 (Meta-Prompting) 完全指南</h1>
                <p class="mt-4 text-lg max-w-3xl mx-auto section-subtitle">一份探索如何「教 AI 學會下指令」的互動式報告</p>
            </div>
        </section>
        
        <!-- Section: Table of Contents -->
        <section id="toc" class="pb-10 bg-white">
             <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div class="max-w-2xl mx-auto bg-primary-bg p-6 rounded-xl border border-gray-200">
                    <h2 class="text-xl font-bold section-title text-center mb-4">📖 目錄</h2>
                    <ol class="list-decimal list-inside space-y-2">
                        <li><a href="#what-is-it" class="link-style">給新手的快速解釋：什麼是後設提示？</a></li>
                        <li><a href="#api-settings" class="link-style">設定您的 Gemini API 金鑰 (互動功能前置作業)</a></li>
                        <li><a href="#landscape" class="link-style">指令的演變歷程：從單純命令到系統化</a></li>
                        <li><a href="#modalities" class="link-style">兩種核心運作模式</a></li>
                        <li><a href="#playbook" class="link-style">互動實戰手冊 (Gemini 驅動)</a></li>
                        <li><a href="#casestudy" class="link-style">案例研究：Parahelp 的「經理指令」架構</a></li>
                        <li><a href="#performance" class="link-style">效能表現：為什麼它更強大？</a></li>
                        <li><a href="#future" class="link-style">未來趨勢與 AI 應用腦力激盪</a></li>
                    </ol>
                </div>
            </div>
        </section>

        <!-- Section: What is Meta Prompting for Noobs -->
        <section id="what-is-it" class="py-20">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div class="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <h2 class="text-2xl font-bold section-title text-center">給新手的快速解釋：什麼是後設提示？</h2>
                    <p class="mt-4 section-subtitle text-center">想像一下，您想讓一位 AI 廚師為您做一道完美的義大利麵。</p>
                    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="card-neutral p-6 rounded-lg">
                            <h3 class="font-semibold text-lg">傳統指令 (Normal Prompt)</h3>
                            <p class="mt-2">您只對廚師說：「做一份義大利麵。」</p>
                            <p class="mt-3 text-sm">結果可能不差，但未必是您想要的。可能是番茄口味、奶油口味，麵條可能太軟或太硬。</p>
                        </div>
                        <div class="card-accent p-6 rounded-lg">
                             <h3 class="font-semibold text-lg">後設提示 (Meta-Prompt)</h3>
                            <p class="mt-2">您給廚師一份**「食譜」**。這份食譜詳細教導廚師：</p>
                            <ul class="list-disc list-inside mt-2 space-y-1 text-sm">
                                <li><strong>角色：</strong> 「你是一位五星級義大利餐廳主廚。」</li>
                                <li><strong>步驟：</strong> 「先燒水、放鹽、煮麵 8 分鐘...」</li>
                                <li><strong>規則：</strong> 「絕對不准用番茄醬，只能用新鮮番茄。」</li>
                                <li><strong>目標：</strong> 「最終成品要是一道正宗的蒜香白酒蛤蜊麵。」</li>
                             </ul>
                        </div>
                    </div>
                    <div class="mt-6 conclusion-box p-4 rounded-lg text-center">
                        <p class="font-semibold">結論：「後設提示」就是不直接命令 AI 做事，而是給 AI 一套更詳盡的「思考框架」或「做事方法」，讓它自己學會如何把任務做到最好。您從「下命令的人」變成了「寫SOP的經理」。</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section: API Key Settings -->
        <section id="api-settings" class="py-20 bg-primary-bg">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                 <div class="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-300">
                    <h2 class="text-2xl font-bold section-title text-center">⚙️ 設定您的 Gemini API 金鑰</h2>
                    <p class="mt-4 text-center section-subtitle">為了使用本頁面的 AI 互動功能，您需要一組自己的 Gemini API 金鑰。金鑰將會安全地儲存在您的瀏覽器中，不會上傳到任何伺服器。</p>
                    <div class="mt-6">
                        <label for="user-api-key-input" class="block text-sm font-medium text-main mb-1">您的 Gemini API 金鑰</label>
                        <input id="user-api-key-input" type="password" placeholder="請在此貼上您的 API 金鑰" class="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:ring-2 focus:outline-none" style="--tw-ring-color: var(--accent-dark)">
                    </div>
                    <div class="mt-4">
                         <button id="save-api-key-btn" class="w-full text-white font-semibold px-6 py-2 rounded-md transition-colors" style="background-color: var(--accent-dark); border: 1px solid var(--accent-dark);" onmouseover="this.style.backgroundColor='#085a6a'" onmouseout="this.style.backgroundColor='var(--accent-dark)'">儲存金鑰</button>
                    </div>
                    <p id="api-key-status" class="mt-4 text-center text-sm font-medium"></p>
                    <div class="mt-6 text-center text-xs text-gray-500 border-t pt-4">
                        <p>沒有金鑰嗎？別擔心，您可以透過以下連結免費取得。</p>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" class="link-style">點我前往 Google AI Studio 取得您的免費 API 金鑰</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section: The Prompting Landscape -->
        <section id="landscape" class="py-20">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">指令的演變歷程</h2>
                    <p class="mt-4 max-w-2xl mx-auto section-subtitle">「提示工程」(Prompt Engineering) 的發展，反映了我們追求更精準控制 AI 思維的渴望。本章節將以互動方式，比較各種主流的指令模式，從簡單的命令到後設層級的統籌管理。點擊不同模式，來探索其核心概念與應用場景。</p>
                </div>
                <div class="mt-12">
                    <div id="prompting-techniques-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                        <!-- JS will populate this -->
                    </div>
                    <div id="prompting-techniques-details" class="mt-8 p-6 bg-white rounded-xl shadow-md min-h-[200px] transition-all duration-300">
                        <!-- JS will populate this -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Section: Two Core Modalities -->
        <section id="modalities" class="py-20 bg-primary-bg">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">兩種核心運作模式</h2>
                    <p class="mt-4 max-w-2xl mx-auto section-subtitle">「後設提示」主要有兩種表現形式，各自代表了不同的複雜度與控制層級。本章節將透過視覺化的的方式拆解這兩種架構，呈現從「優化指令」到「統籌系統」的轉變。</p>
                </div>
                <div class="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Modality 1: Generative/Reflective -->
                    <div class="bg-white rounded-xl shadow-md p-8">
                        <h3 class="text-xl font-semibold section-title">1. 生成／反思模式</h3>
                        <p class="mt-2 section-subtitle">AI 模型化身為一名協作的<span class="font-semibold" style="color: var(--accent-dark)">「指令工程師」</span>，為使用者或它自己優化指令。</p>
                        <div class="mt-6 p-4 bg-primary-bg rounded-lg">
                            <div class="flex flex-col space-y-4">
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">U</div><div>使用者提供一個模糊的目標或粗略的指令。</div></div>
                                <div class="self-center text-3xl" style="color: var(--border-color)">↓</div>
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">AI</div><div>AI 分析目標，並運用最佳實踐來產生更佳的指令。</div></div>
                                <div class="self-center text-3xl" style="color: var(--border-color)">↓</div>
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--primary-light); color: var(--text-main)">✓</div><div>一個更具體、有效、且經過優化的指令誕生，用於最終任務。</div></div>
                            </div>
                        </div>
                    </div>

                    <!-- Modality 2: Orchestrative/Agentic -->
                    <div class="bg-white rounded-xl shadow-md p-8">
                        <h3 class="text-xl font-semibold section-title">2. 協調／代理模式</h3>
                        <p class="mt-2 section-subtitle">AI 模型扮演一位<span class="font-semibold" style="color: var(--accent-dark)">「系統指揮家」</span>，管理多位專家代理人來解決一個複雜問題。</p>
                        <div class="mt-6 p-4 bg-primary-bg rounded-lg">
                            <div class="flex flex-col space-y-4">
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">U</div><div>使用者提出一個複雜、高層次的難題。</div></div>
                                <div class="self-center text-3xl" style="color: var(--border-color)">↓</div>
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">C</div><div>一位「指揮家」AI 將問題拆解成數個子任務。</div></div>
                                <div class="self-center text-3xl" style="color: var(--border-color)">↔</div>
                                <div class="flex justify-around">
                                    <div class="flex flex-col items-center"><div class="w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">E¹</div><p class="text-xs mt-1">專家 1</p></div>
                                    <div class="flex flex-col items-center"><div class="w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">E²</div><p class="text-xs mt-1">專家 2</p></div>
                                    <div class="flex flex-col items-center"><div class="w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark)">E³</div><p class="text-xs mt-1">專家 3</p></div>
                                </div>
                                <div class="self-center text-3xl" style="color: var(--border-color)">↓</div>
                                <div class="flex items-center space-x-3"><div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold" style="background-color: var(--primary-light); color: var(--text-main)">✓</div><div>「指揮家」整合所有專家的產出，形成最終的完整解答。</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Section: Implementation Playbook with Gemini -->
        <section id="playbook" class="py-20 bg-white">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">互動實戰手冊 (Gemini 驅動)</h2>
                    <p class="mt-4 max-w-2xl mx-auto section-subtitle">親身體驗後設提示的力量！在這裡，您可以輸入自己模糊的想法，選擇一種實作模式，然後點擊按鈕，讓 Gemini AI 即時為您生成一個更精準、更強大的指令。</p>
                </div>
                <div class="mt-12 max-w-4xl mx-auto">
                    <div id="patterns-tabs" class="flex flex-wrap justify-center gap-2 mb-4">
                        <!-- JS will populate tabs -->
                    </div>
                    <div id="patterns-content" class="bg-white rounded-xl shadow-lg p-6 md:p-8 transition-all duration-300 border border-gray-200">
                        <!-- JS will populate content -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Section: Case Study: Parahelp -->
        <section id="casestudy" class="py-20 bg-primary-bg">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">案例研究：Parahelp 的「經理指令」</h2>
                    <p class="mt-4 max-w-3xl mx-auto section-subtitle">由 Y Combinator 支持的新創公司 Parahelp，提供了一個強大的真實世界範例。他們的「AI 同事」使用一套雙指令系統，來確保客戶服務的自動化流程既安全又可靠。下方的圖解將拆解他們的驗證架構。</p>
                </div>
                <div class="mt-12 max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <div class="flex flex-col space-y-6">
                        <div class="flex items-start space-x-4"><div class="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 text-lg">1</div><div><h4 class="font-semibold text-lg">收到客戶問題單</h4><p>一個新的支援請求進入系統。</p></div></div>
                        <div class="flex items-start space-x-4"><div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark);">2</div><div><h4 class="font-semibold text-lg">「代理人」指令分析</h4><p>第一位 AI，「代理人」，分析問題單、對話紀錄和內部資料。它會提出一個具體行動，例如呼叫某個工具。</p><div class="mt-2 p-3 bg-primary-bg rounded-md text-sm font-mono">process_refund(customer_id='123', amount=50)</div></div></div>
                        <div class="flex items-start space-x-4"><div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark);">3</div><div><h4 class="font-semibold text-lg">「經理」指令驗證 (後設提示)</h4><p>第二位 AI，「經理」，接收到提議的行動。它扮演驗證者的角色，根據兩個關鍵輸入來檢查該行動：</p><div class="mt-3 flex flex-col md:flex-row gap-4"><div class="flex-1 p-3 bg-primary-bg rounded-md text-sm"><span class="font-semibold">輸入 A：</span>完整的客戶服務政策</div><div class="flex-1 p-3 bg-primary-bg rounded-md text-sm"><span class="font-semibold">輸入 B：</span>針對此特定工具的檢查清單</div></div></div></div>
                        <div class="flex items-start space-x-4">
                            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold" style="background-color: var(--accent-light); color: var(--accent-dark);">4</div>
                            <div class="min-w-0 flex-1">
                                <h4 class="font-semibold text-lg">批准或駁回</h4>
                                <p>根據驗證結果，「經理」做出最終決定。這建立了一道關鍵的安全防線，防止不正確的行動發生。</p>
                                <div class="mt-3 flex flex-col md:flex-row gap-4">
                                    <div class="flex-1 p-3 card-accent rounded-md">
                                        <h5 class="font-semibold">接受</h5>
                                        <p class="text-sm mt-1">行動合規，並被執行。</p>
                                        <div class="mt-2 font-mono text-xs break-all">&lt;manager_verify&gt;accept&lt;/manager_verify&gt;</div>
                                    </div>
                                    <div class="flex-1 p-3 card-neutral rounded-md">
                                        <h5 class="font-semibold">駁回</h5>
                                        <p class="text-sm mt-1">行動被阻止。修正建議被回饋給「代理人」。</p>
                                        <div class="mt-2 font-mono text-xs break-all">&lt;manager_verify&gt;reject&lt;/manager_verify&gt;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Section: Performance & Applications -->
        <section id="performance" class="py-20 bg-white">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">解鎖頂尖效能</h2>
                    <p class="mt-4 max-w-2xl mx-auto section-subtitle">「後設提示」的力量不僅僅是理論。透過強制執行嚴謹、按部就班的思考結構，它能讓基礎模型在沒有經過特定微調的情況下，在複雜的基準測試中達到頂尖水準。</p>
                </div>
                <div class="mt-12 chart-container">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>
        </section>

        <!-- Section: Future & Challenges with Gemini -->
        <section id="future" class="py-20 bg-primary-bg">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold section-title">未來趨勢與關鍵挑戰</h2>
                    <p class="mt-4 max-w-2xl mx-auto section-subtitle">隨著「後設提示」的發展，社群正努力朝向完全自動化邁進，同時也面臨著重大的技術和道德挑戰。本章節將平衡地呈現前方令人興奮的道路，以及我們必須克服的障礙。</p>
                </div>
                <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Future Directions -->
                    <div class="bg-white rounded-xl shadow p-8">
                        <h3 class="text-xl font-semibold section-title">未來展望</h3>
                        <ul class="mt-4 space-y-4">
                            <li class="flex items-start"><span class="mr-3 mt-1" style="color:var(--accent-dark)">✓</span><div><span class="font-semibold">自動化優化：</span>像 "PromptBreeder" 這樣的技術，利用遺傳演算法來自動「演化」出高效的指令，超越了手動工程的極限。</div></li>
                            <li class="flex items-start"><span class="mr-3 mt-1" style="color:var(--accent-dark)">✓</span><div><span class="font-semibold">跨領域通用性：</span>這個核心概念正被應用於電腦視覺、數學推理和邏輯謎題，證明瞭它超越自然語言的廣泛適用性。</div></li>
                            <li class="flex items-start"><span class="mr-3 mt-1" style="color:var(--accent-dark)">✓</span><div><span class="font-semibold">後設學習系統指令：</span>研究的目標是創造出通用的、基礎的系統指令，賦予模型處理任何未知任務的通用解難能力。</div></li>
                        </ul>
                    </div>
                    <!-- Challenges -->
                    <div class="bg-white rounded-xl shadow p-8">
                        <h3 class="text-xl font-semibold section-title">挑戰與限制</h3>
                         <ul class="mt-4 space-y-4">
                            <li class="flex items-start"><span class="text-red-500 mr-3 mt-1">!</span><div><span class="font-semibold">成本與延遲：</span>協調式系統每次查詢都需要多次呼叫模型，增加了計算開銷和回應時間。</div></li>
                            <li class="flex items-start"><span class="text-red-500 mr-3 mt-1">!</span><div><span class="font-semibold">複雜性與可解釋性：</span>多代理人系統可能難以建構、除錯和理解，產生了「黑盒子」挑戰。</div></li>
                            <li class="flex items-start"><span class="text-red-500 mr-3 mt-1">!</span><div><span class="font-semibold">錯誤傳播：</span>鏈式流程中一個早期的微小錯誤，可能會被放大，導致最終產出嚴重不正確。</div></li>
                             <li class="flex items-start"><span class="text-red-500 mr-3 mt-1">!</span><div><span class="font-semibold">道德監督：</span>隨著代理人變得更加自主，健全的指導方針和「人在迴路」的控制機制變得至關重要，以防止意外後果。</div></li>
                        </ul>
                    </div>
                </div>

                <!-- Gemini Idea Generator -->
                <div class="mt-16 max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                    <h3 class="text-2xl font-semibold text-center section-title">✨ AI 應用腦力激盪</h3>
                    <p class="mt-2 text-center section-subtitle">輸入一個您感興趣的產業或領域，讓 Gemini 為您發想後設提示的創新應用！</p>
                    <div class="mt-6 flex flex-col sm:flex-row gap-2">
                        <input id="idea-domain-input" type="text" placeholder="例如：線上教育、健康照護、遊戲設計..." class="flex-grow w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md focus:ring-2 focus:outline-none" style="--tw-ring-color: var(--accent-dark)">
                        <button id="generate-ideas-btn" class="btn-primary font-semibold px-6 py-2 rounded-md transition-colors shrink-0">腦力激盪新應用</button>
                    </div>
                    <div id="ideas-output" class="mt-6 p-4 bg-primary-bg rounded-md min-h-[100px] whitespace-pre-wrap">請先設定您的 API 金鑰，然後輸入一個領域並點擊按鈕。</div>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer style="background-color: var(--text-main); color: var(--primary-light);">
        <div class="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div class="text-center">
                <h3 class="text-lg font-semibold text-white">好事發生數位有限公司</h3>
                <p class="mt-4 text-sm max-w-2xl mx-auto">本策略報告由 好事發生數位有限公司 製作，希望能為您的SEO策略提供清晰的方向。若在執行上需要更深度的分析、顧問諮詢，或是有任何疑問，都歡迎透過以下方式與我們聯絡，讓我們一起讓好事發生：</p>
                <div class="mt-6 flex justify-center items-center flex-wrap gap-x-6 gap-y-2">
                    <a href="mailto:gary@ohya.co" class="text-sm text-white hover:underline">Email: gary@ohya.co</a>
                    <a href="https://www.threads.net/@ohya.studio" target="_blank" class="text-sm text-white hover:underline">Threads: @ohya.studio</a>
                </div>
            </div>
        </div>
    </footer>

<script>
document.addEventListener('DOMContentLoaded', function () {
    let userApiKey = ''; // Global variable to hold the user's API key

    const themeColors = {
        primaryLight: '#d3e59f',
        accentDark: '#0a7489',
        textMain: '#3b5067'
    };

    // --- Data from Report ---
    const promptingTechniques = [
        { ch: '一般指令', en: 'Normal Prompt', details: { concept: '一個直接的問題或命令。', focus: '執行任務', useCase: '針對簡單查詢，獲取直接、即時的答案。' } },
        { ch: '少樣本提示', en: 'Few-Shot Prompting', details: { concept: '提供數個「輸入-輸出」範例來引導模型。', focus: '內容引導', useCase: '透過範例教會模型一種特定的格式或風格。' } },
        { ch: '巨無霸指令', en: 'Mega-Prompt', details: { concept: '一個極度冗長且詳細的指令，包含所有細節。', focus: '產出完整成品', useCase: '一次性生成高度特定、細節豐富的內容。' } },
        { ch: '後設提示 (生成式)', en: 'Meta-Prompt, Generative', details: { concept: '利用 AI 來為某個任務產生或優化指令。', focus: '指令優化', useCase: '將模糊的指令改進，或從一個描述中生成任務專用指令。' } },
        { ch: '後設提示 (協調式)', en: 'Meta-Prompt, Orchestrative', details: { concept: '利用 AI 作為「指揮家」來管理多個子任務或「專家」代理人。', focus: '流程統籌', useCase: '解決需要驗證和綜合分析的複雜、多步驟問題。' } },
    ];
    const implementationPatterns = [
        { name: '簡易優化器', description: '此模式將您模糊的想法，交給 AI 轉化為一個結構完整、要素齊全的專業指令。', metaPromptTemplate: (userInput) => `你是一位提示工程專家 (Prompt Engineering Expert)，專門優化和強化使用者提供的指令。你的目標是將一個模糊的想法，轉化為一個清晰、具體、且高效的指令。請根據以下使用者提供的粗略想法，生成一個更完整、更強大的指令。\n\n## 你的優化策略包含：\n- **釐清意圖：** 深入思考使用者真正的目標是什麼。\n- **增加情境：** 提供執行任務必要的背景資訊。\n- **定義格式：** 要求 AI 以特定格式（如 JSON, Markdown）輸出，方便後續處理。\n- **提供範例：** 給出 1-2 個簡潔的輸入/輸出範例 (Few-shot) 來引導 AI。\n- **設定角色與語氣：** 明確指定 AI 應扮演的角色 (Persona) 和說話的風格。\n\n## 使用者提供的粗略想法：\n"${userInput}"\n\n## 請直接輸出你優化後的完整指令：` },
        { name: '結構化規劃師', description: '此模式賦予 AI 一個專業角色，指示它將一個高層次的目標，拆解成一份有條理、結構化的執行計畫。', metaPromptTemplate: (userInput) => `你是一位頂尖的專案管理顧問。你的任務是將使用者提出的高層次目標，拆解成一份清晰、可執行的結構化專案計畫。請使用 YAML 格式來呈現計畫。\n\n## 計畫應包含的關鍵部分：\n- **ProjectIdentity:** 專案的核心身份與目標。\n- **KeyMilestones:** 按順序列出的主要里程碑。\n- **InitialTasks:** 每個里程碑下需要執行的前 2-3 個具體任務。\n- **SuccessMetrics:** 衡量專案成功的關鍵指標。\n\n## 使用者提出的高層次目標：\n"${userInput}"\n\n## 請直接輸出 YAML 格式的專案計畫：` },
        { name: '多代理人系統', description: '此模式模擬一個團隊合作的流程：一位「提議者」AI 提出方案，另一位「驗證者」AI 負責審核，確保結果的品質與準確性。', metaPromptTemplate: (userInput) => `你是一個多代理人系統的總指揮。你的任務是協調兩位 AI 專家來完成使用者的請求：一位是創意思考家（提議者），另一位是嚴謹的評論家（驗證者）。\n\n## 流程如下：\n1.  **提議者：** 針對使用者請求，提出一個具體的、有創意的解決方案。\n2.  **驗證者：** 評估提議者的方案，指出其潛在的優點和風險。\n3.  **你（總指揮）：** 綜合兩者意見，給出最終的行動建議。\n\n## 使用者請求：\n"${userInput}"\n\n## 請模擬並輸出整個對話與決策過程：` }
    ];

    // --- API Key Management ---
    const apiKeyInput = document.getElementById('user-api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyStatus = document.getElementById('api-key-status');

    function loadApiKey() {
        const savedKey = localStorage.getItem('geminiUserApiKey');
        if (savedKey) {
            userApiKey = savedKey;
            apiKeyInput.value = savedKey;
            apiKeyStatus.textContent = '已載入您儲存的金鑰。';
            apiKeyStatus.className = 'mt-4 text-center text-sm font-medium api-status-success';
        } else {
             apiKeyStatus.textContent = '尚未設定 API 金鑰。互動功能將無法使用。';
             apiKeyStatus.className = 'mt-4 text-center text-sm font-medium api-status-error';
        }
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            userApiKey = key;
            localStorage.setItem('geminiUserApiKey', key);
            apiKeyStatus.textContent = '金鑰已成功儲存！';
            apiKeyStatus.className = 'mt-4 text-center text-sm font-medium api-status-success';
        } else {
            localStorage.removeItem('geminiUserApiKey');
            userApiKey = '';
            apiKeyStatus.textContent = '金鑰已清除。';
            apiKeyStatus.className = 'mt-4 text-center text-sm font-medium api-status-warn';
        }
    });

    // --- Gemini API Call Function ---
    async function callGeminiAPI(prompt, outputElement, buttonElement) {
        if (!userApiKey) {
            outputElement.textContent = '錯誤：請先在頁面上方的「API 設定」區塊中設定您的 Gemini API 金鑰。';
            const settingsSection = document.getElementById('api-settings');
            settingsSection.scrollIntoView({ behavior: 'smooth' });
            settingsSection.querySelector('input').focus();
            return;
        }

        const originalButtonText = buttonElement.textContent;
        buttonElement.disabled = true;
        buttonElement.classList.add('gemini-loader', 'cursor-not-allowed');
        buttonElement.textContent = 'AI 思考中';
        outputElement.textContent = '正在與 Gemini 連線，請稍候...';
        
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (response.ok && result.candidates && result.candidates.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                outputElement.textContent = text.trim();
            } else {
                console.error('API Error:', result);
                let errorMessage = 'AI 呼叫失敗。';
                if(result.error) {
                    errorMessage += ` 錯誤 (${result.error.code}): ${result.error.message}`;
                    if(result.error.status === 'INVALID_ARGUMENT') {
                        errorMessage += '\n請檢查您的 API 金鑰是否正確。';
                    }
                }
                outputElement.textContent = errorMessage;
            }
        } catch (error) {
            console.error('Network or other error:', error);
            outputElement.textContent = '呼叫 AI 時發生網路錯誤，請檢查主控台以獲取更多資訊。';
        } finally {
            buttonElement.disabled = false;
            buttonElement.classList.remove('gemini-loader', 'cursor-not-allowed');
            buttonElement.textContent = originalButtonText;
        }
    }

    // --- Section: Prompting Landscape ---
    const techniquesContainer = document.getElementById('prompting-techniques-container');
    const detailsContainer = document.getElementById('prompting-techniques-details');
    let activeTechnique = null;
    promptingTechniques.forEach((tech, index) => {
        const button = document.createElement('button');
        button.className = 'prompt-technique-btn p-3 h-20 text-sm font-semibold bg-white rounded-lg shadow-sm hover:bg-accent-dark hover:text-white transition-all duration-200 flex flex-col justify-center items-center text-center';
        button.innerHTML = `<span>${tech.ch}</span><span class="text-xs opacity-80 font-normal mt-1">${tech.en}</span>`;
        button.addEventListener('click', () => {
            if (activeTechnique) {
                activeTechnique.style.backgroundColor = 'white';
                activeTechnique.style.color = 'var(--text-main)';
            }
            button.style.backgroundColor = 'var(--accent-dark)';
            button.style.color = 'var(--text-light)';
            activeTechnique = button;
            detailsContainer.innerHTML = `<h3 class="font-bold text-xl">${tech.ch} <span class="text-lg font-normal text-gray-500">(${tech.en})</span></h3><p class="mt-2"><strong class="font-semibold">核心概念：</strong> ${tech.details.concept}</p><p class="mt-2"><strong class="font-semibold">主要焦點：</strong> ${tech.details.focus}</p><p class="mt-2"><strong class="font-semibold">關鍵用途：</strong> ${tech.details.useCase}</p>`;
        });
        techniquesContainer.appendChild(button);
        if (index === 0) button.click();
    });

    // --- Section: Implementation Playbook with Gemini ---
    const patternsTabsContainer = document.getElementById('patterns-tabs');
    const patternsContentContainer = document.getElementById('patterns-content');
    let activePatternTab = null;
    implementationPatterns.forEach((pattern, index) => {
        const tab = document.createElement('button');
        tab.className = 'tab px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 transition-colors';
        tab.textContent = pattern.name;
        tab.dataset.index = index;
        tab.addEventListener('click', () => {
            if(activePatternTab) activePatternTab.classList.remove('active');
            tab.classList.add('active');
            activePatternTab = tab;
            patternsContentContainer.innerHTML = `<p class="mb-4">${pattern.description}</p><div class="space-y-4"><div><label for="playbook-input" class="block text-sm font-medium mb-1">1. 輸入您的原始想法或目標：</label><textarea id="playbook-input" rows="3" class="w-full p-2 bg-slate-100 border border-slate-200 rounded-md focus:ring-2 focus:outline-none" style="--tw-ring-color: var(--accent-dark)" placeholder="例如：幫我寫一封行銷郵件，宣傳新的咖啡豆"></textarea></div><button id="gemini-playbook-btn" class="w-full btn-primary font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center text-lg">✨ 啟動 AI 優化指令</button><div><label class="block text-sm font-medium mb-1">2. AI 優化後的指令：</label><div id="playbook-output" class="p-4 bg-gray-800 text-white font-mono text-sm rounded-md min-h-[200px] whitespace-pre-wrap">請先設定您的 API 金鑰，然後輸入想法並點擊按鈕。</div></div></div>`;
            document.getElementById('gemini-playbook-btn').addEventListener('click', (e) => {
                const userInput = document.getElementById('playbook-input').value;
                if (!userInput.trim()) {
                    document.getElementById('playbook-output').textContent = '請先輸入您的想法！';
                    return;
                }
                const selectedPattern = implementationPatterns[activePatternTab.dataset.index];
                const finalPrompt = selectedPattern.metaPromptTemplate(userInput);
                callGeminiAPI(finalPrompt, document.getElementById('playbook-output'), e.currentTarget);
            });
        });
        patternsTabsContainer.appendChild(tab);
        if (index === 0) tab.click();
    });

    // --- Section: Future with Gemini Idea Generator ---
    document.getElementById('generate-ideas-btn').addEventListener('click', (e) => {
        const domainInput = document.getElementById('idea-domain-input').value;
        const ideasOutput = document.getElementById('ideas-output');
        if (!domainInput.trim()) {
            ideasOutput.textContent = '請先輸入一個產業或領域！';
            return;
        }
        const ideaPrompt = `你是一位頂尖的 AI 策略顧問。你的專長是為不同行業發想創新的「後設提示」(Meta-Prompting) 應用。請針對使用者提供的領域「${domainInput}」，腦力激盪出 2 個具體的、創新的應用點子。\n\n## 你的回答必須包含以下結構：\n\n**應用點子 1：[應用名稱]**\n- **核心問題：** 這個應用解決了該領域的什麼核心痛點？\n- **運作模式：** 這是「生成/反思模式」還是「協調/代理模式」的應用？\n- **系統設計簡述：** 簡單描述這個後設提示系統是如何運作的（例如：哪個 AI 扮演什麼角色，它們如何互動）。\n\n**應用點子 2：[應用名稱]**\n- **核心問題：** ...\n- **運作模式：** ...\n- **系統設計簡述：** ...\n\n請以條理分明、易於理解的方式呈現你的想法。`;
        callGeminiAPI(ideaPrompt, ideasOutput, e.currentTarget);
    });

    // --- Section: Performance Chart ---
    const ctx = document.getElementById('performanceChart').getContext('2d');
    new Chart(ctx, { type: 'bar', data: { labels: ['MATH Benchmark (競賽級數學)', 'Game of 24 (邏輯謎題)', 'GSM8K (小學數學)'], datasets: [{ label: '其他指令技巧 (平均分數)', data: [35, 70, 75], backgroundColor: 'rgba(59, 80, 103, 0.6)', borderColor: 'rgba(59, 80, 103, 1)', borderWidth: 1 }, { label: '後設提示 (結構導向)', data: [46.3, 100, 83.5], backgroundColor: 'rgba(10, 116, 137, 0.6)', borderColor: 'rgba(10, 116, 137, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '後設提示在複雜推理任務上的表現 (成功率 %)', font: { size: 16, family: "'Noto Sans TC', sans-serif" }, color: themeColors.textMain, padding: { bottom: 20 } }, tooltip: { callbacks: { label: function(context) { return `${context.dataset.label}: ${context.raw}%`; } }, bodyFont: { family: "'Noto Sans TC', sans-serif" }, titleFont: { family: "'Noto Sans TC', sans-serif" } } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: '成功率 (%)', color: themeColors.textMain, font: { family: "'Noto Sans TC', sans-serif" } }, grid: { color: 'rgba(209, 213, 219, 0.5)' } }, x: { grid: { display: false }, ticks: { font: { family: "'Noto Sans TC', sans-serif" }, color: themeColors.textMain } } } } });
    
    // --- Initial Load ---
    loadApiKey();
});
</script>
</body>
</html>