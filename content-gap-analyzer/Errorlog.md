garyyang@Macmini content-gap-analyzer % npm run dev  

> content-gap-analyzer@1.0.0 dev
> concurrently "npm run dev:backend" "npm run dev:frontend"

[1] 
[1] > content-gap-analyzer@1.0.0 dev:frontend
[1] > cd frontend && npm start
[1] 
[0] 
[0] > content-gap-analyzer@1.0.0 dev:backend
[0] > cd backend && npm run dev
[0] 
[0] 
[0] > content-gap-analyzer-backend@1.0.0 dev
[0] > nodemon --exec ts-node src/index.ts
[0] 
[1] 
[1] > frontend@0.1.0 start
[1] > react-scripts start
[1] 
[0] [nodemon] 3.1.10
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): *.*
[0] [nodemon] watching extensions: ts,json
[0] [nodemon] starting `ts-node src/index.ts`
[1] (node:85785) [DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead
[1] (Use `node --trace-deprecation ...` to show where the warning was created)
[1] (node:85785) [DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
[1] (node:85785) [DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated. Please use the 'setupMiddlewares' option.
[0] info: Registered prompt: Main Analysis Prompt v2.0 (繁體中文) (2.0.0) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.461Z"}
[0] info: Initialized Prompt Service with v2.0 templates {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.462Z"}
[1] Starting the development server...
[1] 
[0] info: Crawl4AI service initialized with base URL: http://localhost:11235 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.617Z"}
[0] info: Analysis Worker initialized successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.659Z"}
[0] info: Environment variables loaded {"NODE_ENV":"development","OPENAI_API_KEY":"NOT SET","SERPAPI_KEY":"SET","service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.660Z"}
[0] info: Test routes enabled in development mode {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.661Z"}
[0] info: Server running on port 3002 in development mode {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.667Z"}
[0] info: Server accessible at: http://localhost:3002 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.667Z"}
[0] info: Analysis worker is ready and waiting for jobs {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:03:58.672Z"}
[1] Compiled successfully!
[1] 
[1] You can now view frontend in the browser.
[1] 
[1]   Local:            http://localhost:3000
[1]   On Your Network:  http://192.168.1.109:3000
[1] 
[1] Note that the development build is not optimized.
[1] To create a production build, use npm run build.
[1] 
[1] webpack compiled successfully
[1] Files successfully emitted, waiting for typecheck results...
[1] Issues checking in progress...
[1] No issues found.
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 is waiting in queue {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.524Z"}
[0] info: Analysis job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 added to queue {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.525Z"}
[0] info: Created analysis job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 for keyword: 澳洲打工度假 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.525Z"}
[0] info: Analysis job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 created for keyword: 澳洲打工度假 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.525Z"}
[0] info: Starting analysis job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 for keyword: 澳洲打工度假 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.531Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7: Fetching AI Overview for keyword: 澳洲打工度假 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.532Z"}
[0] info: SerpAPI key configured successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.532Z"}
[0] info: === SERPAPI CALL START === {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.532Z"}
[0] info: Fetching AI Overview for keyword: "澳洲打工度假" {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.533Z"}
[0] info: SerpAPI endpoint: https://serpapi.com/search.json {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.533Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 started processing {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.555Z"}
[0] debug: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 progress: 10% {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:10.556Z"}
[0] info: Google search completed successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.609Z"}
[0] info: Response received: 27221 characters {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: === NO AI OVERVIEW FOUND === {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: No AI Overview found for keyword: "澳洲打工度假", trying fallback strategies {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: Note: AI Overview currently has limited support for zh-TW language {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: === ORGANIC RESULTS FALLBACK SUCCESS === {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: Using organic results snippets as fallback for "澳洲打工度假" {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: Organic results fallback: 453 chars, 8 references {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: Fallback result: SUCCESS {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] info: === SERPAPI CALL END (FALLBACK) === {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.610Z"}
[0] debug: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 progress: 30% {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.611Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7: Starting content scraping phase {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.611Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://studycentralau.com/work-in-australia/working-holiday-in-australia/ {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:14.612Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://studycentralau.com/work-in-australia/working-holiday-in-australia/ (28789 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.421Z"}
[0] debug: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 progress: 40% {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.422Z"}
[0] info: 🤖 [CRAWL4AI] Batch scraping 8 pages {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.422Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=4892E8B8F5C0E174&s=E4CFAE92581A7EB7 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.422Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://crossing.cw.com.tw/article/19666 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.423Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://www.isec.com.tw/blog-27-working_holiday_visa.html {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.423Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://www.ef.com.tw/working-holiday/destinations/australia/ {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.423Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://pilotstudy.com.tw/blog/%E6%BE%B3%E6%B4%B2%E6%89%93%E5%B7%A5%E5%BA%A6%E5%81%87/ {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.424Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=6386&s=113469 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.424Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://heartbeat-cafe.com/australia-working-holiday-job/ {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.424Z"}
[0] info: 🤖 [CRAWL4AI] Attempting to scrape: https://www.abcwithyou.com/Australia_Blog/Working_Holiday_Visa.html {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:16.425Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://www.abcwithyou.com/Australia_Blog/Working_Holiday_Visa.html (19806 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:19.047Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://www.isec.com.tw/blog-27-working_holiday_visa.html (16104 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:19.425Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://pilotstudy.com.tw/blog/%E6%BE%B3%E6%B4%B2%E6%89%93%E5%B7%A5%E5%BA%A6%E5%81%87/ (22198 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:19.539Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=6386&s=113469 (16970 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:19.750Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=4892E8B8F5C0E174&s=E4CFAE92581A7EB7 (17135 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:20.255Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://heartbeat-cafe.com/australia-working-holiday-job/ (20422 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:20.480Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://www.ef.com.tw/working-holiday/destinations/australia/ (13939 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:21.540Z"}
[0] info: ✅ [CRAWL4AI] Scraped successfully: https://crossing.cw.com.tw/article/19666 (17955 chars) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.428Z"}
[0] info: 🤖 [CRAWL4AI] Batch scraping completed: 8/8 successful {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.429Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7: Performing content gap analysis {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.429Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7: Preparing data for Gemini analysis {"aiOverviewLength":453,"citedUrlsCount":8,"crawledContentLength":175090,"service":"content-gap-analyzer","targetKeyword":"澳洲打工度假","timestamp":"2025-06-28T18:04:22.429Z","userPageUrl":"https://studycentralau.com/work-in-australia/working-holiday-in-australia/"}
[0] info: Gemini API key configured successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.429Z"}
[0] info: Falling back to v5.1 data structure, but converting to v6.0 format {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z"}
[0] info: Building v6.0 format analysis data for fallback {"aiOverviewLength":453,"citedUrlsCount":8,"competitorCount":8,"crawledContentLength":175090,"service":"content-gap-analyzer","targetKeyword":"澳洲打工度假","timestamp":"2025-06-28T18:04:22.430Z","userPageUrl":"https://studycentralau.com/work-in-australia/working-holiday-in-australia/"}
[0] debug: User page content preview: {"preview":"[跳至主要內容](https://studycentralau.com/work-in-australia/working-holiday-in-australia/#main)\n  * [最新消息](https://studycentralau.com/work-in-australia/work...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://studycentralau.com/work-in-australia/working-holiday-in-australia/"}
[0] debug: Competitor 0 content preview: {"preview":"[跳到主要內容區塊](https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=5676&sms=1442&s=106363#base-content \"跳到主要內容區塊\")\n手機版選單\nsearch\n[搜尋](https://ww...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=4892E8B8F5C0E174&s=E4CFAE92581A7EB7"}
[0] debug: Competitor 1 content preview: {"preview":"為提供您更多優質的內容，本網站使用cookies分析技術。若繼續閱覽本網站內容， 即表示您同意我們使用 cookies，關於更多cookies以及相關政策更新資訊，請閱讀我們的 [隱私權政策](https://member.cwg.tw/privacy-policy)。 \n我知道了\n您的帳號尚未驗證...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://crossing.cw.com.tw/article/19666"}
[0] debug: Competitor 2 content preview: {"preview":"[ ](https://www.isec.com.tw/)\nMenu \n[聯絡我們](https://www.isec.com.tw/contactus.php \"聯絡我們\") [線上預約](https://www.isec.com.tw/appointment.php \"線上預約\") [ ![登入...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://www.isec.com.tw/blog-27-working_holiday_visa.html"}
[0] debug: Competitor 3 content preview: {"preview":"![](https://a.storyblok.com/f/61891/750x78/6b58768994/ef-60yrs_m.jpg)\n選單\n[](https://www.ef.com.tw/)\n[0800 878000](tel:0800878000 )\n  * [首頁歡迎來到EF](http...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://www.ef.com.tw/working-holiday/destinations/australia/"}
[0] debug: Competitor 4 content preview: {"preview":"Skip links\n  * [ Skip to primary navigation](https://pilotstudy.com.tw/blog/%E6%BE%B3%E6%B4%B2%E6%89%93%E5%B7%A5%E5%BA%A6%E5%81%87/#primary)\n  * [ Ski...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://pilotstudy.com.tw/blog/%E6%BE%B3%E6%B4%B2%E6%89%93%E5%B7%A5%E5%BA%A6%E5%81%87/"}
[0] debug: Competitor 5 content preview: {"preview":"[跳到主要內容區塊](https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=6386&s=113469#base-content \"跳到主要內容區塊\")\n手機版選單\nsearch\n[搜尋](https://www.youthta...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://www.youthtaiwan.net/workingholiday/Cus_WHNation.aspx?n=6386&s=113469"}
[0] debug: Competitor 6 content preview: {"preview":"[ 跳至主要內容](https://heartbeat-cafe.com/australia-working-holiday-job/#content \"跳至主要內容\")\n[![洞心咖啡](https://heartbeat-cafe.com/wp-content/uploads/2024/07/h...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://heartbeat-cafe.com/australia-working-holiday-job/"}
[0] debug: Competitor 7 content preview: {"preview":"[ ![](https://www.abcwithyou.com/Australia_Blog/images/common_icon/logo.png) ](https://www.abcwithyou.com/Australia_Blog/ \"澳洲打工遊學,留學代辦,渡假旅遊\")\nABC澳洲背包客...","service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.430Z","url":"https://www.abcwithyou.com/Australia_Blog/Working_Holiday_Visa.html"}
[0] info: Built v6.0 format data for fallback: {"aiOverviewLength":453,"crawledContentLength":175090,"service":"content-gap-analyzer","targetKeyword":"澳洲打工度假","timestamp":"2025-06-28T18:04:22.430Z","userPageUrl":"https://studycentralau.com/work-in-australia/working-holiday-in-australia/"}
[0] debug: Rendering prompt template: {"service":"content-gap-analyzer","templateId":"main_analysis_v2","templateLength":5985,"templateName":"Main Analysis Prompt v2.0 (繁體中文)","timestamp":"2025-06-28T18:04:22.431Z","variablesProvided":["targetKeyword","userPageUrl","aiOverviewContent","citedUrls","crawledContent"]}
[0] debug: Successfully replaced {{targetKeyword}} with value of length 6 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] debug: Successfully replaced {{userPageUrl}} with value of length 74 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] debug: Successfully replaced {{aiOverviewContent}} with value of length 453 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] debug: Successfully replaced {{citedUrls}} with value of length 549 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] debug: Successfully replaced {{crawledContent}} with value of length 175090 {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] info: All template variables successfully resolved: {"finalPromptLength":182073,"replacementsMade":5,"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] debug: Rendered prompt for main_analysis: 182073 characters {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] info: Starting Gemini analysis... {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:04:22.431Z"}
[0] info: Gemini response length: 16230 chars {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.977Z"}
[0] error: Response content validation failed: {"confidence":66.66666666666666,"isValid":false,"reasons":["P1 recommendations do not contain target keyword \"澳洲打工度假\""],"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.978Z"}
[0] error: Response contains content for wrong keyword. This indicates template variable substitution failure. {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.978Z"}
[0] error: Sample recommendation content: {"0":"更","1":"新","10":"與","100":"新","101":"至","102":"最","103":"新","104":"（","105":"例","106":"如","107":"2","108":"0","109":"2","11":"相","110":"5","111":"年","112":"最","113":"新","114":"資","115":"訊","116":"）","117":"，","118":"並","119":"明","12":"關","120":"確","121":"標","122":"註","123":"更","124":"新","125":"日","126":"期","127":"或","128":"來","129":"源","13":"日","130":"。","131":"同","132":"時","133":"，","134":"針","135":"對","136":"文","137":"章","138":"中","139":"出","14":"期","140":"現","141":"的","142":"\"","143":"2","144":"0","145":"2","146":"5","147":"\"","148":"字","149":"樣","15":"：","150":"進","151":"行","152":"審","153":"核","154":"，","155":"確","156":"保","157":"其","158":"為","159":"實","16":"A","160":"際","161":"更","162":"新","163":"年","164":"份","165":"，","166":"而","167":"非","168":"預","169":"設","17":"I","170":"值","171":"。","18":" ","19":"O","2":"並","20":"v","21":"e","22":"r","23":"v","24":"i","25":"e","26":"w","27":"和","28":"多","29":"個","3":"精","30":"引","31":"用","32":"網","33":"址","34":"都","35":"強","36":"調","37":"了","38":"簽","39":"證","4":"確","40":"費","41":"用","42":"和","43":"最","44":"新","45":"日","46":"期","47":"。","48":"使","49":"用","5":"化","50":"者","51":"網","52":"頁","53":"雖","54":"然","55":"有","56":"提","57":"到","58":"，","59":"但","6":"簽","60":"資","61":"訊","62":"可","63":"能","64":"不","65":"夠","66":"即","67":"時","68":"或","69":"精","7":"證","70":"確","71":"。","72":"建","73":"議","74":"在","75":"文","76":"章","77":"中","78":"將","79":"所","8":"費","80":"有","81":"提","82":"及","83":"的","84":"簽","85":"證","86":"費","87":"用","88":"、","89":"最","9":"用","90":"低","91":"薪","92":"資","93":"、","94":"稅","95":"率","96":"等","97":"數","98":"字","99":"更","service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.979Z"}
[0] info: Gemini analysis completed successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.981Z"}
[0] debug: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 progress: 95% {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.982Z"}
[0] info: Job completion evaluated: completed (quality: 100) {"completedSteps":["serpapi","user_scraping"],"errors":[],"failedSteps":[],"fallbacksUsed":[],"qualityScore":100,"service":"content-gap-analyzer","status":"completed","timestamp":"2025-06-28T18:05:42.983Z","warnings":[]}
[0] debug: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 progress: 100% {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.984Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7: Analysis completed successfully (quality: 100) {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.984Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 completed successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.991Z"}
[0] info: Job 88c3b1e5-71f6-4c8b-9129-579a01ffddd7 completed successfully {"service":"content-gap-analyzer","timestamp":"2025-06-28T18:05:42.991Z"}
