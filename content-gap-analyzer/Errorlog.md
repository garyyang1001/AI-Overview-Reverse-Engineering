[1] No issues found.
[0] 2025-06-30 12:51:54.004 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba is waiting in queue
[0] 2025-06-30 12:51:54.004 [info] Analysis job f54b5770-661b-4f1b-a42c-d97955310fba added to queue
[0] 2025-06-30 12:51:54.004 [info] Created analysis job f54b5770-661b-4f1b-a42c-d97955310fba for keyword: 手機殼推薦
[0] 2025-06-30 12:51:54.004 [info] Analysis job f54b5770-661b-4f1b-a42c-d97955310fba created for keyword: 手機殼推薦
[0] 2025-06-30 12:51:54.009 [info] Starting analysis job f54b5770-661b-4f1b-a42c-d97955310fba for keyword: 手機殼推薦
[0] 2025-06-30 12:51:54.010 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba started processing
[0] 2025-06-30 12:51:54.010 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba: Fetching AI Overview for keyword: 手機殼推薦
[0] 2025-06-30 12:51:54.010 [info] SerpAPI key configured successfully
[0] 2025-06-30 12:51:54.010 [info] === SERPAPI CALL START ===
[0] 2025-06-30 12:51:54.011 [info] Fetching AI Overview for keyword: "手機殼推薦"
[0] 2025-06-30 12:51:54.011 [info] SerpAPI endpoint: https://serpapi.com/search.json
[0] 2025-06-30 12:51:54.036 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba progress: 10%
[0] 2025-06-30 12:51:54.125 [info] Google search completed successfully
[0] 2025-06-30 12:51:54.125 [info] Response received: 41110 characters
[0] 2025-06-30 12:51:54.125 [info] === USING BASIC AI OVERVIEW ===
[0] 2025-06-30 12:51:54.125 [info] Using basic AI Overview data from search results
[0] 2025-06-30 12:51:54.125 [info] Extracted summary from text_blocks: 778 characters
[0] 2025-06-30 12:51:54.125 [info] Extracted 13 references from ai_overview.references
[0] 2025-06-30 12:51:54.126 [info] Basic AI Overview extracted: 778 chars, 13 references
[0] 2025-06-30 12:51:54.126 [info] === SERPAPI CALL END (SUCCESS - BASIC) ===
[0] 2025-06-30 12:51:54.126 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba progress: 30%
[0] 2025-06-30 12:51:54.127 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba: Starting content scraping phase
[0] 2025-06-30T04:51:54.127Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://shop.rhinoshield.tw/"
[0] }
[0] 2025-06-30 12:51:54.127 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://shop.rhinoshield.tw/"
[0] }
[0] 2025-06-30 12:51:57.218 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "3091ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:51:57.219 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://shop.rhinoshield.tw/",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:51:57.219 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://shop.rhinoshield.tw/",
[0]   "contentLength": 12961,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "1ms",
[0]   "totalDuration": "3092ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛..."
[0] }
[0] 2025-06-30 12:51:57.219 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba progress: 40%
[0] 2025-06-30T04:51:57.220Z [info] 🤖 [CRAWL4AI] Starting batch scrape {
[0]   "urlCount": 10,
[0]   "urls": [
[0]     "https://www.onion-net.com.tw/news_detail/226#:~:text=%E6%8C%91%E9%81%B8%E6%89%8B%E6%A9%9F%E6%AE%BC%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%20*%20%E4%B8%8D%E8%A6%81%E6%8C%91%E9%81%B8%E5%A1%91%E6%96%99%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8C%E9%81%B8%E6%93%87%E7%9F%BD%E8%86%A0%E9%A1%9E%E6%89%8B%E6%A9%9F%E6%AE%BC%20%E7%9F%BD%E8%86%A0%E6%9D%90%E8%B3%AA%E8%BC%83%E8%BB%9F%E4%B8%8D%E5%82%B7%E6%89%8B%E6%A9%9F%E5%A4%96%EF%BC%8C%E4%B9%9F%E6%9C%83%E6%AF%94%E7%A1%AC%E8%B3%AA%E7%9A%84%E5%A1%91%E8%86%A0%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%84%E8%A6%81%E6%8A%97%E9%98%B2%E6%91%94%E3%80%82%20*%20%E4%BF%9D%E8%AD%B7%E6%AE%BC%E9%A0%88%E9%AB%98%E6%96%BC%E8%9E%A2%E5%B9%95%E3%80%81%E9%8F%A1%E9%A0%AD%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%8A%E6%A1%86%E9%A0%88%E9%AB%98%E6%96%BC%E6%89%8B%E6%A9%9F%E8%9E%A2%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E6%A8%A1%E7%B5%84%EF%BC%8C%E6%89%8D%E8%83%BD%E6%9C%89%E6%95%88%E9%98%B2%E6%AD%A2%E6%89%8B%E6%A9%9F%E5%B1%8F%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E7%A2%8E%E8%A3%82%E3%80%81%E5%88%AE%E5%82%B7%E3%80%82%20*%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AD%94%E4%BD%8D%E9%A0%88%E7%B2%BE%E6%BA%96",
[0]     "https://www.gq.com.tw/article/apple-iphone-16-cases",
[0]     "https://tw.my-best.com/114158",
[0]     "https://mbzhu.com/mobile/best-iphone-case/#:~:text=Magsafe%20%E5%85%85%E9%9B%BB%E9%81%A9%E9%85%8D%E5%BA%A6%E6%9C%89%E6%84%9F%E6%8F%90%E5%8D%87%EF%BC%8C%E5%96%AE%E5%B1%A4%E9%87%91%E5%B1%AC%E8%83%8C%E6%9D%BF%E9%99%A4%E4%BA%86%E6%B8%9B%E5%B0%91%E9%87%8D%E9%87%8F%E5%A4%96%EF%BC%8C%E7%84%A1%E7%B7%9A%E5%85%85%E9%9B%BB%E6%9B%B4%E6%B2%92%E9%98%BB%E7%A4%99%20*%20Ostand%20Spin%20MagSafe%20iPhone%E6%94%AF%E6%9E%B6%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90,*%20%E9%BB%9E%E6%88%91%E8%B3%BC%E8%B2%B7%20*%20MUDZ%20Feather%20Weave/Unicord%20%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90",
[0]     "https://daid207.pixnet.net/blog/post/86339485#:~:text=%E7%B8%BD%E7%B5%90%20%E4%BE%9D%E7%85%A7%E3%80%8E%E9%A0%90%E7%AE%97%E3%80%8F%E5%88%86%E9%A1%9E%EF%BC%8C%E9%A0%90%E7%AE%97%E8%BC%83%E8%B6%B3%E7%9A%84%E8%A9%B1%EF%BC%8C%E5%84%AA%E5%85%88%E5%8F%83%E8%80%83%E3%80%8Edevilcase%E3%80%81Alto%E3%80%81UAG%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%EF%BC%9B%E5%85%B6%E6%AC%A1%E7%9A%84%E8%A9%B1%EF%BC%8C%E6%8E%A8%E8%96%A6%E3%80%8ESpacesuit%E3%80%81JTLengend%E3%80%81Hoda%E3%80%8F%EF%BC%8C%E6%98%AF%E5%80%8B%E9%AB%98CP%E5%80%BC%E7%9A%84%E5%A5%BD%E9%81%B8%E6%93%87%EF%BC%9B%E8%8B%A5%E7%B6%93%E5%B8%B8%E6%9B%BFiPhone%E2%80%9C%E6%8F%9B%E6%AE%BC%E2%80%9D%E5%8F%AF%E6%8C%91%E9%81%B8%E5%88%B0%E5%B9%B3%E5%83%B9%E7%9A%84%E7%B6%B2%E8%B7%AF%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%BA%97%E3%80%8E%E6%A5%B5%E9%99%903C%E3%80%81CW%E3%80%8F%EF%BC%81%20%E5%B0%8D%E4%BF%9D%E8%AD%B7%E5%8A%9B%E8%88%87%E5%A4%96%E5%9E%8B%E8%A8%AD%E8%A8%88%E6%9C%89%E9%AB%98%E8%A6%81%E6%B1%82%E8%80%85%EF%BC%8C%E6%8E%A8%E8%96%A6%E5%8F%83%E8%80%83%E3%80%8EDevilcase%20%E3%80%81Alto%E3%80%8F%EF%BC%8C%E9%80%99%E4%BA%9B%E9%83%BD%E6%98%AF%E8%BC%83%E7%82%BA%E4%B8%AD%E6%80%A7%E8%A8%AD%E8%A8%88%2C%E5%A5%B3%E6%80%A7%E7%9A%84%E8%A9%B1%E6%8E%A8%E8%96%A6%E6%8C%91%E9%81%B8%E3%80%8Ecasetify%E3%80%81ARNO%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%E6%BA%96%E6%B2%92%E9%8C%AF%EF%BC%81%20%E5%8F%A6%E5%A4%96OVERDIGI%20%E4%B9%9F%E5%BE%88%E6%8E%A8%E8%96%A6%E7%B5%A6%E5%B9%B4%E8%BC%95%E5%A5%B3%E6%80%A7%E3%80%82%20%E5%B0%8D%E6%96%BC%E5%93%81%E7%89%8C%E4%BE%86%E8%AA%AA%EF%BC%8C%E8%87%AA%E5%B7%B1%E6%9C%80%E6%84%9B%E7%94%A8Alto%E3%80%81SPACESUIT%E3%80%81UAG%E3%80%81Casetify%EF%BC%8C%E7%B6%B2%E5%8F%8B%E5%90%84%E6%96%B9%E9%9D%A2%E8%A1%A8%E7%8F%BE%E5%92%8C%E8%A9%95%E5%83%B9%E5%B9%BE%E4%B9%8E%E6%98%AF%E6%A5%B5%E9%AB%98%EF%BC%8C%E3%80%82"
[0]   ]
[0] }
[0] 2025-06-30T04:51:57.220Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://www.onion-net.com.tw/news_detail/226#:~:text=%E6%8C%91%E9%81%B8%E6%89%8B%E6%A9%9F%E6%AE%BC%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%20*%20%E4%B8%8D%E8%A6%81%E6%8C%91%E9%81%B8%E5%A1%91%E6%96%99%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8C%E9%81%B8%E6%93%87%E7%9F%BD%E8%86%A0%E9%A1%9E%E6%89%8B%E6%A9%9F%E6%AE%BC%20%E7%9F%BD%E8%86%A0%E6%9D%90%E8%B3%AA%E8%BC%83%E8%BB%9F%E4%B8%8D%E5%82%B7%E6%89%8B%E6%A9%9F%E5%A4%96%EF%BC%8C%E4%B9%9F%E6%9C%83%E6%AF%94%E7%A1%AC%E8%B3%AA%E7%9A%84%E5%A1%91%E8%86%A0%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%84%E8%A6%81%E6%8A%97%E9%98%B2%E6%91%94%E3%80%82%20*%20%E4%BF%9D%E8%AD%B7%E6%AE%BC%E9%A0%88%E9%AB%98%E6%96%BC%E8%9E%A2%E5%B9%95%E3%80%81%E9%8F%A1%E9%A0%AD%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%8A%E6%A1%86%E9%A0%88%E9%AB%98%E6%96%BC%E6%89%8B%E6%A9%9F%E8%9E%A2%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E6%A8%A1%E7%B5%84%EF%BC%8C%E6%89%8D%E8%83%BD%E6%9C%89%E6%95%88%E9%98%B2%E6%AD%A2%E6%89%8B%E6%A9%9F%E5%B1%8F%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E7%A2%8E%E8%A3%82%E3%80%81%E5%88%AE%E5%82%B7%E3%80%82%20*%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AD%94%E4%BD%8D%E9%A0%88%E7%B2%BE%E6%BA%96"
[0] }
[0] 2025-06-30 12:51:57.220 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://www.onion-net.com.tw/news_detail/226#:~:text=%E6%8C%91%E9%81%B8%E6%89%8B%E6%A9%9F%E6%AE%BC%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%20*%20%E4%B8%8D%E8%A6%81%E6%8C%91%E9%81%B8%E5%A1%91%E6%96%99%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8C%E9%81%B8%E6%93%87%E7%9F%BD%E8%86%A0%E9%A1%9E%E6%89%8B%E6%A9%9F%E6%AE%BC%20%E7%9F%BD%E8%86%A0%E6%9D%90%E8%B3%AA%E8%BC%83%E8%BB%9F%E4%B8%8D%E5%82%B7%E6%89%8B%E6%A9%9F%E5%A4%96%EF%BC%8C%E4%B9%9F%E6%9C%83%E6%AF%94%E7%A1%AC%E8%B3%AA%E7%9A%84%E5%A1%91%E8%86%A0%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%84%E8%A6%81%E6%8A%97%E9%98%B2%E6%91%94%E3%80%82%20*%20%E4%BF%9D%E8%AD%B7%E6%AE%BC%E9%A0%88%E9%AB%98%E6%96%BC%E8%9E%A2%E5%B9%95%E3%80%81%E9%8F%A1%E9%A0%AD%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%8A%E6%A1%86%E9%A0%88%E9%AB%98%E6%96%BC%E6%89%8B%E6%A9%9F%E8%9E%A2%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E6%A8%A1%E7%B5%84%EF%BC%8C%E6%89%8D%E8%83%BD%E6%9C%89%E6%95%88%E9%98%B2%E6%AD%A2%E6%89%8B%E6%A9%9F%E5%B1%8F%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E7%A2%8E%E8%A3%82%E3%80%81%E5%88%AE%E5%82%B7%E3%80%82%20*%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AD%94%E4%BD%8D%E9%A0%88%E7%B2%BE%E6%BA%96",
[0]   "cleanedUrl": "https://www.onion-net.com.tw/news_detail/226",
[0]   "fragmentRemoved": "#:~:text=%E6%8C%91%E9%81%B8%E6%89%8B%E6%A9%9F%E6%AE%BC%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85%20*%20%E4%B8%8D%E8%A6%81%E6%8C%91%E9%81%B8%E5%A1%91%E6%96%99%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8C%E9%81%B8%E6%93%87%E7%9F%BD%E8%86%A0%E9%A1%9E%E6%89%8B%E6%A9%9F%E6%AE%BC%20%E7%9F%BD%E8%86%A0%E6%9D%90%E8%B3%AA%E8%BC%83%E8%BB%9F%E4%B8%8D%E5%82%B7%E6%89%8B%E6%A9%9F%E5%A4%96%EF%BC%8C%E4%B9%9F%E6%9C%83%E6%AF%94%E7%A1%AC%E8%B3%AA%E7%9A%84%E5%A1%91%E8%86%A0%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%84%E8%A6%81%E6%8A%97%E9%98%B2%E6%91%94%E3%80%82%20*%20%E4%BF%9D%E8%AD%B7%E6%AE%BC%E9%A0%88%E9%AB%98%E6%96%BC%E8%9E%A2%E5%B9%95%E3%80%81%E9%8F%A1%E9%A0%AD%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E9%82%8A%E6%A1%86%E9%A0%88%E9%AB%98%E6%96%BC%E6%89%8B%E6%A9%9F%E8%9E%A2%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E6%A8%A1%E7%B5%84%EF%BC%8C%E6%89%8D%E8%83%BD%E6%9C%89%E6%95%88%E9%98%B2%E6%AD%A2%E6%89%8B%E6%A9%9F%E5%B1%8F%E5%B9%95%E5%8F%8A%E9%8F%A1%E9%A0%AD%E7%A2%8E%E8%A3%82%E3%80%81%E5%88%AE%E5%82%B7%E3%80%82%20*%20%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AD%94%E4%BD%8D%E9%A0%88%E7%B2%BE%E6%BA%96"
[0] }
[0] 2025-06-30 12:51:57.220 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://www.onion-net.com.tw/news_detail/226"
[0] }
[0] 2025-06-30T04:51:57.220Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://www.gq.com.tw/article/apple-iphone-16-cases"
[0] }
[0] 2025-06-30 12:51:57.220 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://www.gq.com.tw/article/apple-iphone-16-cases"
[0] }
[0] 2025-06-30T04:51:57.221Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://tw.my-best.com/114158"
[0] }
[0] 2025-06-30 12:51:57.221 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://tw.my-best.com/114158"
[0] }
[0] 2025-06-30T04:51:57.221Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://mbzhu.com/mobile/best-iphone-case/#:~:text=Magsafe%20%E5%85%85%E9%9B%BB%E9%81%A9%E9%85%8D%E5%BA%A6%E6%9C%89%E6%84%9F%E6%8F%90%E5%8D%87%EF%BC%8C%E5%96%AE%E5%B1%A4%E9%87%91%E5%B1%AC%E8%83%8C%E6%9D%BF%E9%99%A4%E4%BA%86%E6%B8%9B%E5%B0%91%E9%87%8D%E9%87%8F%E5%A4%96%EF%BC%8C%E7%84%A1%E7%B7%9A%E5%85%85%E9%9B%BB%E6%9B%B4%E6%B2%92%E9%98%BB%E7%A4%99%20*%20Ostand%20Spin%20MagSafe%20iPhone%E6%94%AF%E6%9E%B6%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90,*%20%E9%BB%9E%E6%88%91%E8%B3%BC%E8%B2%B7%20*%20MUDZ%20Feather%20Weave/Unicord%20%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90"
[0] }
[0] 2025-06-30 12:51:57.221 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://mbzhu.com/mobile/best-iphone-case/#:~:text=Magsafe%20%E5%85%85%E9%9B%BB%E9%81%A9%E9%85%8D%E5%BA%A6%E6%9C%89%E6%84%9F%E6%8F%90%E5%8D%87%EF%BC%8C%E5%96%AE%E5%B1%A4%E9%87%91%E5%B1%AC%E8%83%8C%E6%9D%BF%E9%99%A4%E4%BA%86%E6%B8%9B%E5%B0%91%E9%87%8D%E9%87%8F%E5%A4%96%EF%BC%8C%E7%84%A1%E7%B7%9A%E5%85%85%E9%9B%BB%E6%9B%B4%E6%B2%92%E9%98%BB%E7%A4%99%20*%20Ostand%20Spin%20MagSafe%20iPhone%E6%94%AF%E6%9E%B6%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90,*%20%E9%BB%9E%E6%88%91%E8%B3%BC%E8%B2%B7%20*%20MUDZ%20Feather%20Weave/Unicord%20%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90",
[0]   "cleanedUrl": "https://mbzhu.com/mobile/best-iphone-case/",
[0]   "fragmentRemoved": "#:~:text=Magsafe%20%E5%85%85%E9%9B%BB%E9%81%A9%E9%85%8D%E5%BA%A6%E6%9C%89%E6%84%9F%E6%8F%90%E5%8D%87%EF%BC%8C%E5%96%AE%E5%B1%A4%E9%87%91%E5%B1%AC%E8%83%8C%E6%9D%BF%E9%99%A4%E4%BA%86%E6%B8%9B%E5%B0%91%E9%87%8D%E9%87%8F%E5%A4%96%EF%BC%8C%E7%84%A1%E7%B7%9A%E5%85%85%E9%9B%BB%E6%9B%B4%E6%B2%92%E9%98%BB%E7%A4%99%20*%20Ostand%20Spin%20MagSafe%20iPhone%E6%94%AF%E6%9E%B6%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90,*%20%E9%BB%9E%E6%88%91%E8%B3%BC%E8%B2%B7%20*%20MUDZ%20Feather%20Weave/Unicord%20%E8%B3%BC%E8%B2%B7%E9%80%A3%E7%B5%90"
[0] }
[0] 2025-06-30 12:51:57.221 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://mbzhu.com/mobile/best-iphone-case/"
[0] }
[0] 2025-06-30T04:51:57.221Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://daid207.pixnet.net/blog/post/86339485#:~:text=%E7%B8%BD%E7%B5%90%20%E4%BE%9D%E7%85%A7%E3%80%8E%E9%A0%90%E7%AE%97%E3%80%8F%E5%88%86%E9%A1%9E%EF%BC%8C%E9%A0%90%E7%AE%97%E8%BC%83%E8%B6%B3%E7%9A%84%E8%A9%B1%EF%BC%8C%E5%84%AA%E5%85%88%E5%8F%83%E8%80%83%E3%80%8Edevilcase%E3%80%81Alto%E3%80%81UAG%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%EF%BC%9B%E5%85%B6%E6%AC%A1%E7%9A%84%E8%A9%B1%EF%BC%8C%E6%8E%A8%E8%96%A6%E3%80%8ESpacesuit%E3%80%81JTLengend%E3%80%81Hoda%E3%80%8F%EF%BC%8C%E6%98%AF%E5%80%8B%E9%AB%98CP%E5%80%BC%E7%9A%84%E5%A5%BD%E9%81%B8%E6%93%87%EF%BC%9B%E8%8B%A5%E7%B6%93%E5%B8%B8%E6%9B%BFiPhone%E2%80%9C%E6%8F%9B%E6%AE%BC%E2%80%9D%E5%8F%AF%E6%8C%91%E9%81%B8%E5%88%B0%E5%B9%B3%E5%83%B9%E7%9A%84%E7%B6%B2%E8%B7%AF%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%BA%97%E3%80%8E%E6%A5%B5%E9%99%903C%E3%80%81CW%E3%80%8F%EF%BC%81%20%E5%B0%8D%E4%BF%9D%E8%AD%B7%E5%8A%9B%E8%88%87%E5%A4%96%E5%9E%8B%E8%A8%AD%E8%A8%88%E6%9C%89%E9%AB%98%E8%A6%81%E6%B1%82%E8%80%85%EF%BC%8C%E6%8E%A8%E8%96%A6%E5%8F%83%E8%80%83%E3%80%8EDevilcase%20%E3%80%81Alto%E3%80%8F%EF%BC%8C%E9%80%99%E4%BA%9B%E9%83%BD%E6%98%AF%E8%BC%83%E7%82%BA%E4%B8%AD%E6%80%A7%E8%A8%AD%E8%A8%88%2C%E5%A5%B3%E6%80%A7%E7%9A%84%E8%A9%B1%E6%8E%A8%E8%96%A6%E6%8C%91%E9%81%B8%E3%80%8Ecasetify%E3%80%81ARNO%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%E6%BA%96%E6%B2%92%E9%8C%AF%EF%BC%81%20%E5%8F%A6%E5%A4%96OVERDIGI%20%E4%B9%9F%E5%BE%88%E6%8E%A8%E8%96%A6%E7%B5%A6%E5%B9%B4%E8%BC%95%E5%A5%B3%E6%80%A7%E3%80%82%20%E5%B0%8D%E6%96%BC%E5%93%81%E7%89%8C%E4%BE%86%E8%AA%AA%EF%BC%8C%E8%87%AA%E5%B7%B1%E6%9C%80%E6%84%9B%E7%94%A8Alto%E3%80%81SPACESUIT%E3%80%81UAG%E3%80%81Casetify%EF%BC%8C%E7%B6%B2%E5%8F%8B%E5%90%84%E6%96%B9%E9%9D%A2%E8%A1%A8%E7%8F%BE%E5%92%8C%E8%A9%95%E5%83%B9%E5%B9%BE%E4%B9%8E%E6%98%AF%E6%A5%B5%E9%AB%98%EF%BC%8C%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.221 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://daid207.pixnet.net/blog/post/86339485#:~:text=%E7%B8%BD%E7%B5%90%20%E4%BE%9D%E7%85%A7%E3%80%8E%E9%A0%90%E7%AE%97%E3%80%8F%E5%88%86%E9%A1%9E%EF%BC%8C%E9%A0%90%E7%AE%97%E8%BC%83%E8%B6%B3%E7%9A%84%E8%A9%B1%EF%BC%8C%E5%84%AA%E5%85%88%E5%8F%83%E8%80%83%E3%80%8Edevilcase%E3%80%81Alto%E3%80%81UAG%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%EF%BC%9B%E5%85%B6%E6%AC%A1%E7%9A%84%E8%A9%B1%EF%BC%8C%E6%8E%A8%E8%96%A6%E3%80%8ESpacesuit%E3%80%81JTLengend%E3%80%81Hoda%E3%80%8F%EF%BC%8C%E6%98%AF%E5%80%8B%E9%AB%98CP%E5%80%BC%E7%9A%84%E5%A5%BD%E9%81%B8%E6%93%87%EF%BC%9B%E8%8B%A5%E7%B6%93%E5%B8%B8%E6%9B%BFiPhone%E2%80%9C%E6%8F%9B%E6%AE%BC%E2%80%9D%E5%8F%AF%E6%8C%91%E9%81%B8%E5%88%B0%E5%B9%B3%E5%83%B9%E7%9A%84%E7%B6%B2%E8%B7%AF%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%BA%97%E3%80%8E%E6%A5%B5%E9%99%903C%E3%80%81CW%E3%80%8F%EF%BC%81%20%E5%B0%8D%E4%BF%9D%E8%AD%B7%E5%8A%9B%E8%88%87%E5%A4%96%E5%9E%8B%E8%A8%AD%E8%A8%88%E6%9C%89%E9%AB%98%E8%A6%81%E6%B1%82%E8%80%85%EF%BC%8C%E6%8E%A8%E8%96%A6%E5%8F%83%E8%80%83%E3%80%8EDevilcase%20%E3%80%81Alto%E3%80%8F%EF%BC%8C%E9%80%99%E4%BA%9B%E9%83%BD%E6%98%AF%E8%BC%83%E7%82%BA%E4%B8%AD%E6%80%A7%E8%A8%AD%E8%A8%88%2C%E5%A5%B3%E6%80%A7%E7%9A%84%E8%A9%B1%E6%8E%A8%E8%96%A6%E6%8C%91%E9%81%B8%E3%80%8Ecasetify%E3%80%81ARNO%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%E6%BA%96%E6%B2%92%E9%8C%AF%EF%BC%81%20%E5%8F%A6%E5%A4%96OVERDIGI%20%E4%B9%9F%E5%BE%88%E6%8E%A8%E8%96%A6%E7%B5%A6%E5%B9%B4%E8%BC%95%E5%A5%B3%E6%80%A7%E3%80%82%20%E5%B0%8D%E6%96%BC%E5%93%81%E7%89%8C%E4%BE%86%E8%AA%AA%EF%BC%8C%E8%87%AA%E5%B7%B1%E6%9C%80%E6%84%9B%E7%94%A8Alto%E3%80%81SPACESUIT%E3%80%81UAG%E3%80%81Casetify%EF%BC%8C%E7%B6%B2%E5%8F%8B%E5%90%84%E6%96%B9%E9%9D%A2%E8%A1%A8%E7%8F%BE%E5%92%8C%E8%A9%95%E5%83%B9%E5%B9%BE%E4%B9%8E%E6%98%AF%E6%A5%B5%E9%AB%98%EF%BC%8C%E3%80%82",
[0]   "cleanedUrl": "https://daid207.pixnet.net/blog/post/86339485",
[0]   "fragmentRemoved": "#:~:text=%E7%B8%BD%E7%B5%90%20%E4%BE%9D%E7%85%A7%E3%80%8E%E9%A0%90%E7%AE%97%E3%80%8F%E5%88%86%E9%A1%9E%EF%BC%8C%E9%A0%90%E7%AE%97%E8%BC%83%E8%B6%B3%E7%9A%84%E8%A9%B1%EF%BC%8C%E5%84%AA%E5%85%88%E5%8F%83%E8%80%83%E3%80%8Edevilcase%E3%80%81Alto%E3%80%81UAG%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%EF%BC%9B%E5%85%B6%E6%AC%A1%E7%9A%84%E8%A9%B1%EF%BC%8C%E6%8E%A8%E8%96%A6%E3%80%8ESpacesuit%E3%80%81JTLengend%E3%80%81Hoda%E3%80%8F%EF%BC%8C%E6%98%AF%E5%80%8B%E9%AB%98CP%E5%80%BC%E7%9A%84%E5%A5%BD%E9%81%B8%E6%93%87%EF%BC%9B%E8%8B%A5%E7%B6%93%E5%B8%B8%E6%9B%BFiPhone%E2%80%9C%E6%8F%9B%E6%AE%BC%E2%80%9D%E5%8F%AF%E6%8C%91%E9%81%B8%E5%88%B0%E5%B9%B3%E5%83%B9%E7%9A%84%E7%B6%B2%E8%B7%AF%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%BA%97%E3%80%8E%E6%A5%B5%E9%99%903C%E3%80%81CW%E3%80%8F%EF%BC%81%20%E5%B0%8D%E4%BF%9D%E8%AD%B7%E5%8A%9B%E8%88%87%E5%A4%96%E5%9E%8B%E8%A8%AD%E8%A8%88%E6%9C%89%E9%AB%98%E8%A6%81%E6%B1%82%E8%80%85%EF%BC%8C%E6%8E%A8%E8%96%A6%E5%8F%83%E8%80%83%E3%80%8EDevilcase%20%E3%80%81Alto%E3%80%8F%EF%BC%8C%E9%80%99%E4%BA%9B%E9%83%BD%E6%98%AF%E8%BC%83%E7%82%BA%E4%B8%AD%E6%80%A7%E8%A8%AD%E8%A8%88%2C%E5%A5%B3%E6%80%A7%E7%9A%84%E8%A9%B1%E6%8E%A8%E8%96%A6%E6%8C%91%E9%81%B8%E3%80%8Ecasetify%E3%80%81ARNO%E3%80%8F%E9%80%99%E4%BA%9B%E5%93%81%E7%89%8C%E6%BA%96%E6%B2%92%E9%8C%AF%EF%BC%81%20%E5%8F%A6%E5%A4%96OVERDIGI%20%E4%B9%9F%E5%BE%88%E6%8E%A8%E8%96%A6%E7%B5%A6%E5%B9%B4%E8%BC%95%E5%A5%B3%E6%80%A7%E3%80%82%20%E5%B0%8D%E6%96%BC%E5%93%81%E7%89%8C%E4%BE%86%E8%AA%AA%EF%BC%8C%E8%87%AA%E5%B7%B1%E6%9C%80%E6%84%9B%E7%94%A8Alto%E3%80%81SPACESUIT%E3%80%81UAG%E3%80%81Casetify%EF%BC%8C%E7%B6%B2%E5%8F%8B%E5%90%84%E6%96%B9%E9%9D%A2%E8%A1%A8%E7%8F%BE%E5%92%8C%E8%A9%95%E5%83%B9%E5%B9%BE%E4%B9%8E%E6%98%AF%E6%A5%B5%E9%AB%98%EF%BC%8C%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.222 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://daid207.pixnet.net/blog/post/86339485"
[0] }
[0] 2025-06-30T04:51:57.222Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://shopee.tw/blog/phone-case-brands/#:~:text=%E2%9E%9C%E2%9E%9C%20%E6%9B%B4%E5%A4%9A%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%E6%8E%A8%E8%96%A6%EF%BC%9A%E8%BB%8D%E8%A6%8F%E6%89%8B%E6%A9%9F%E6%AE%BC%20*%20%E5%9C%96%EF%BC%8FUAG%20%E5%8F%B0%E7%81%A3%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8F%E7%8A%80%E7%89%9B%E7%9B%BE%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E9%A4%A8,%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8Fbitplay%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8FMoshi%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97"
[0] }
[0] 2025-06-30 12:51:57.222 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://shopee.tw/blog/phone-case-brands/#:~:text=%E2%9E%9C%E2%9E%9C%20%E6%9B%B4%E5%A4%9A%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%E6%8E%A8%E8%96%A6%EF%BC%9A%E8%BB%8D%E8%A6%8F%E6%89%8B%E6%A9%9F%E6%AE%BC%20*%20%E5%9C%96%EF%BC%8FUAG%20%E5%8F%B0%E7%81%A3%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8F%E7%8A%80%E7%89%9B%E7%9B%BE%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E9%A4%A8,%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8Fbitplay%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8FMoshi%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97",
[0]   "cleanedUrl": "https://shopee.tw/blog/phone-case-brands/",
[0]   "fragmentRemoved": "#:~:text=%E2%9E%9C%E2%9E%9C%20%E6%9B%B4%E5%A4%9A%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%E6%8E%A8%E8%96%A6%EF%BC%9A%E8%BB%8D%E8%A6%8F%E6%89%8B%E6%A9%9F%E6%AE%BC%20*%20%E5%9C%96%EF%BC%8FUAG%20%E5%8F%B0%E7%81%A3%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8F%E7%8A%80%E7%89%9B%E7%9B%BE%E9%98%B2%E6%91%94%E6%89%8B%E6%A9%9F%E6%AE%BC%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E9%A4%A8,%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8Fbitplay%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97%20*%20%E5%9C%96%EF%BC%8FMoshi%20%E5%AE%98%E6%96%B9%E6%97%97%E8%89%A6%E5%BA%97"
[0] }
[0] 2025-06-30 12:51:57.222 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://shopee.tw/blog/phone-case-brands/"
[0] }
[0] 2025-06-30T04:51:57.222Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://f5desksetup.com/iphone-phone-case-brands-top-10/#:~:text=TORRAS%E5%9C%96%E6%8B%89%E6%96%AF%E5%9C%A8%E4%BA%9E%E9%A6%AC%E9%81%9C%E5%B9%B3%E5%8F%B0%E5%B8%B8%E5%B1%85%E9%8A%B7%E5%94%AE%E6%A6%9C%E9%A6%96%EF%BC%8C%E5%9B%A0%E5%85%B6%E5%8D%93%E8%B6%8A%E7%9A%84%E5%8A%9F%E8%83%BD%E6%80%A7%E5%92%8C%E6%99%82%E5%B0%9A%E8%A8%AD%E8%A8%88%E5%8F%97%E5%88%B0%E7%94%A8%E6%88%B6%E5%96%9C%E6%84%9B%E3%80%82%20%E5%93%81%E7%89%8C%E4%BB%A5%E5%A4%9A%E5%8A%9F%E8%83%BD%E9%98%B2%E6%91%94%E6%AE%BC%E8%91%97%E7%A8%B1%EF%BC%8C%E7%B5%90%E5%90%88%E7%A3%81%E5%90%B8%E3%80%81%E6%89%8B%E6%A9%9F%E6%94%AF%E6%9E%B6%E3%80%81%E6%8C%87%E7%92%B0%E6%89%A3%E7%AD%89%E5%A4%9A%E7%A8%AE%E5%AF%A6%E7%94%A8%E5%8A%9F%E8%83%BD%EF%BC%8C%E7%82%BA%E7%94%A8%E6%88%B6%E6%8F%90%E4%BE%9B%E6%A5%B5%E9%AB%98%E7%9A%84%E4%BE%BF%E5%88%A9%E6%80%A7%E3%80%82%20%E6%8E%A8%E8%96%A6%E5%9E%8B%E8%99%9F%E5%A6%82MagEZ%20Case%20Pro%EF%BC%8C%E4%B8%8D%E5%83%85%E6%94%AF%E6%8F%B4MagSafe%E5%8A%9F%E8%83%BD%EF%BC%8C%E9%82%84%E5%85%B7%E5%82%99SGS%E8%AA%8D%E8%AD%89%E7%9A%84%E8%BB%8D%E8%A6%8F%E9%98%B2%E6%91%94%E8%83%BD%E5%8A%9B%EF%BC%8C%E6%98%AF%E4%B8%80%E6%AC%BE%E5%85%BC%E5%85%B7%E5%AF%A6%E7%94%A8%E8%88%87%E7%BE%8E%E8%A7%80%E7%9A%84%E5%84%AA%E8%B3%AA%E9%81%B8%E6%93%87%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.222 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://f5desksetup.com/iphone-phone-case-brands-top-10/#:~:text=TORRAS%E5%9C%96%E6%8B%89%E6%96%AF%E5%9C%A8%E4%BA%9E%E9%A6%AC%E9%81%9C%E5%B9%B3%E5%8F%B0%E5%B8%B8%E5%B1%85%E9%8A%B7%E5%94%AE%E6%A6%9C%E9%A6%96%EF%BC%8C%E5%9B%A0%E5%85%B6%E5%8D%93%E8%B6%8A%E7%9A%84%E5%8A%9F%E8%83%BD%E6%80%A7%E5%92%8C%E6%99%82%E5%B0%9A%E8%A8%AD%E8%A8%88%E5%8F%97%E5%88%B0%E7%94%A8%E6%88%B6%E5%96%9C%E6%84%9B%E3%80%82%20%E5%93%81%E7%89%8C%E4%BB%A5%E5%A4%9A%E5%8A%9F%E8%83%BD%E9%98%B2%E6%91%94%E6%AE%BC%E8%91%97%E7%A8%B1%EF%BC%8C%E7%B5%90%E5%90%88%E7%A3%81%E5%90%B8%E3%80%81%E6%89%8B%E6%A9%9F%E6%94%AF%E6%9E%B6%E3%80%81%E6%8C%87%E7%92%B0%E6%89%A3%E7%AD%89%E5%A4%9A%E7%A8%AE%E5%AF%A6%E7%94%A8%E5%8A%9F%E8%83%BD%EF%BC%8C%E7%82%BA%E7%94%A8%E6%88%B6%E6%8F%90%E4%BE%9B%E6%A5%B5%E9%AB%98%E7%9A%84%E4%BE%BF%E5%88%A9%E6%80%A7%E3%80%82%20%E6%8E%A8%E8%96%A6%E5%9E%8B%E8%99%9F%E5%A6%82MagEZ%20Case%20Pro%EF%BC%8C%E4%B8%8D%E5%83%85%E6%94%AF%E6%8F%B4MagSafe%E5%8A%9F%E8%83%BD%EF%BC%8C%E9%82%84%E5%85%B7%E5%82%99SGS%E8%AA%8D%E8%AD%89%E7%9A%84%E8%BB%8D%E8%A6%8F%E9%98%B2%E6%91%94%E8%83%BD%E5%8A%9B%EF%BC%8C%E6%98%AF%E4%B8%80%E6%AC%BE%E5%85%BC%E5%85%B7%E5%AF%A6%E7%94%A8%E8%88%87%E7%BE%8E%E8%A7%80%E7%9A%84%E5%84%AA%E8%B3%AA%E9%81%B8%E6%93%87%E3%80%82",
[0]   "cleanedUrl": "https://f5desksetup.com/iphone-phone-case-brands-top-10/",
[0]   "fragmentRemoved": "#:~:text=TORRAS%E5%9C%96%E6%8B%89%E6%96%AF%E5%9C%A8%E4%BA%9E%E9%A6%AC%E9%81%9C%E5%B9%B3%E5%8F%B0%E5%B8%B8%E5%B1%85%E9%8A%B7%E5%94%AE%E6%A6%9C%E9%A6%96%EF%BC%8C%E5%9B%A0%E5%85%B6%E5%8D%93%E8%B6%8A%E7%9A%84%E5%8A%9F%E8%83%BD%E6%80%A7%E5%92%8C%E6%99%82%E5%B0%9A%E8%A8%AD%E8%A8%88%E5%8F%97%E5%88%B0%E7%94%A8%E6%88%B6%E5%96%9C%E6%84%9B%E3%80%82%20%E5%93%81%E7%89%8C%E4%BB%A5%E5%A4%9A%E5%8A%9F%E8%83%BD%E9%98%B2%E6%91%94%E6%AE%BC%E8%91%97%E7%A8%B1%EF%BC%8C%E7%B5%90%E5%90%88%E7%A3%81%E5%90%B8%E3%80%81%E6%89%8B%E6%A9%9F%E6%94%AF%E6%9E%B6%E3%80%81%E6%8C%87%E7%92%B0%E6%89%A3%E7%AD%89%E5%A4%9A%E7%A8%AE%E5%AF%A6%E7%94%A8%E5%8A%9F%E8%83%BD%EF%BC%8C%E7%82%BA%E7%94%A8%E6%88%B6%E6%8F%90%E4%BE%9B%E6%A5%B5%E9%AB%98%E7%9A%84%E4%BE%BF%E5%88%A9%E6%80%A7%E3%80%82%20%E6%8E%A8%E8%96%A6%E5%9E%8B%E8%99%9F%E5%A6%82MagEZ%20Case%20Pro%EF%BC%8C%E4%B8%8D%E5%83%85%E6%94%AF%E6%8F%B4MagSafe%E5%8A%9F%E8%83%BD%EF%BC%8C%E9%82%84%E5%85%B7%E5%82%99SGS%E8%AA%8D%E8%AD%89%E7%9A%84%E8%BB%8D%E8%A6%8F%E9%98%B2%E6%91%94%E8%83%BD%E5%8A%9B%EF%BC%8C%E6%98%AF%E4%B8%80%E6%AC%BE%E5%85%BC%E5%85%B7%E5%AF%A6%E7%94%A8%E8%88%87%E7%BE%8E%E8%A7%80%E7%9A%84%E5%84%AA%E8%B3%AA%E9%81%B8%E6%93%87%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.222 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://f5desksetup.com/iphone-phone-case-brands-top-10/"
[0] }
[0] 2025-06-30T04:51:57.223Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://devilcase.com.tw/forum/108/post/194"
[0] }
[0] 2025-06-30 12:51:57.223 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://devilcase.com.tw/forum/108/post/194"
[0] }
[0] 2025-06-30T04:51:57.223Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://tw.my-best.com/115262#:~:text=Android%E6%89%8B%E6%A9%9F%E6%AE%BC%E4%BA%BA%E6%B0%A3%E6%8E%A8%E8%96%A6%E6%8E%92%E8%A1%8C%E6%A6%9CTOP5%20*%20%E7%AC%AC1%E5%90%8D:%20UAG%EF%BD%9C%E8%80%90%E8%A1%9D%E6%93%8A%E4%BF%9D%E8%AD%B7%E6%AE%BC%2D%E9%80%8F%E6%98%8E(UAG)%20*%20%E7%AC%AC2%E5%90%8D:%20%E7%8A%80%E7%89%9B%E7%9B%BE%EF%BD%9CCrashGuard,SEIDIO%EF%BD%9C%E5%A4%9A%E5%8A%9F%E8%83%BD%E7%9A%AE%E9%9D%A9%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%EF%BD%9CCSP3SGTXLK%2DBK.%20*%20%E7%AC%AC4%E5%90%8D:%20GCOMM%EF%BD%9CMagRing.%20*%20%E7%AC%AC5%E5%90%8D:%20PKG%EF%BD%9C%E5%81%B4%E7%BF%BB%E7%9A%AE%E5%A5%97"
[0] }
[0] 2025-06-30 12:51:57.223 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://tw.my-best.com/115262#:~:text=Android%E6%89%8B%E6%A9%9F%E6%AE%BC%E4%BA%BA%E6%B0%A3%E6%8E%A8%E8%96%A6%E6%8E%92%E8%A1%8C%E6%A6%9CTOP5%20*%20%E7%AC%AC1%E5%90%8D:%20UAG%EF%BD%9C%E8%80%90%E8%A1%9D%E6%93%8A%E4%BF%9D%E8%AD%B7%E6%AE%BC%2D%E9%80%8F%E6%98%8E(UAG)%20*%20%E7%AC%AC2%E5%90%8D:%20%E7%8A%80%E7%89%9B%E7%9B%BE%EF%BD%9CCrashGuard,SEIDIO%EF%BD%9C%E5%A4%9A%E5%8A%9F%E8%83%BD%E7%9A%AE%E9%9D%A9%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%EF%BD%9CCSP3SGTXLK%2DBK.%20*%20%E7%AC%AC4%E5%90%8D:%20GCOMM%EF%BD%9CMagRing.%20*%20%E7%AC%AC5%E5%90%8D:%20PKG%EF%BD%9C%E5%81%B4%E7%BF%BB%E7%9A%AE%E5%A5%97",
[0]   "cleanedUrl": "https://tw.my-best.com/115262",
[0]   "fragmentRemoved": "#:~:text=Android%E6%89%8B%E6%A9%9F%E6%AE%BC%E4%BA%BA%E6%B0%A3%E6%8E%A8%E8%96%A6%E6%8E%92%E8%A1%8C%E6%A6%9CTOP5%20*%20%E7%AC%AC1%E5%90%8D:%20UAG%EF%BD%9C%E8%80%90%E8%A1%9D%E6%93%8A%E4%BF%9D%E8%AD%B7%E6%AE%BC%2D%E9%80%8F%E6%98%8E(UAG)%20*%20%E7%AC%AC2%E5%90%8D:%20%E7%8A%80%E7%89%9B%E7%9B%BE%EF%BD%9CCrashGuard,SEIDIO%EF%BD%9C%E5%A4%9A%E5%8A%9F%E8%83%BD%E7%9A%AE%E9%9D%A9%E6%89%8B%E6%A9%9F%E4%BF%9D%E8%AD%B7%E6%AE%BC%EF%BD%9CCSP3SGTXLK%2DBK.%20*%20%E7%AC%AC4%E5%90%8D:%20GCOMM%EF%BD%9CMagRing.%20*%20%E7%AC%AC5%E5%90%8D:%20PKG%EF%BD%9C%E5%81%B4%E7%BF%BB%E7%9A%AE%E5%A5%97"
[0] }
[0] 2025-06-30 12:51:57.223 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://tw.my-best.com/115262"
[0] }
[0] 2025-06-30T04:51:57.223Z [info] 🤖 [CRAWL4AI] Starting page scrape {
[0]   "url": "https://www.landtop.com.tw/reviews/321#:~:text=%E4%B8%80%E3%80%81Rhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%89%8B%E6%A9%9F%E6%AE%BC&text=%E5%A6%82%E6%9E%9C%E6%82%A8%E6%98%AF%E8%BF%BD%E6%B1%82%E5%80%8B%E6%80%A7%E8%88%87%E9%98%B2%E6%91%94%E5%85%BC%E5%85%B7%E7%9A%84%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8CRhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%98%AF%E4%B8%8D%E9%8C%AF%E7%9A%84%E9%81%B8%E6%93%87%E3%80%82%20%E6%8E%A1%E7%94%A8ShockSpread%20%E6%9D%90%E6%96%99%EF%BC%8C%E5%8D%B3%E4%BD%BF%E5%BE%9E3.5%20%E5%85%AC%E5%B0%BA%E9%AB%98%E8%99%95%E8%B7%8C%E8%90%BD%E4%B9%9F%E8%83%BD%E4%BF%9D%E8%AD%B7%E7%84%A1%E8%99%9E%E3%80%82%20%E5%85%A7%E5%B5%8C%E8%9C%82%E5%B7%A2%E7%B5%90%E6%A7%8B%E6%8F%90%E5%8D%8710%25%E8%A1%9D%E6%93%8A%E5%90%B8%E6%94%B6%E5%8A%9B%EF%BC%8C%E8%80%90%E7%94%A8%E4%B8%94%E6%8A%97%E6%B3%9B%E9%BB%83%EF%BC%9B%E5%85%B6%E5%8F%AF%E6%8B%86%E6%8F%9B%E8%83%8C%E8%93%8B%E5%92%8C%E5%A4%9A%E6%AC%BE%E8%81%AF%E5%90%8D%E8%A8%AD%E8%A8%88%EF%BC%8C%E8%AE%93%E4%BD%A0%E8%BC%95%E9%AC%86%E6%89%93%E9%80%A0%E7%8D%A8%E7%89%B9%E9%A2%A8%E6%A0%BC%E3%80%82%20%E4%B8%8D%E5%83%85%E6%98%AF%E5%A0%85%E5%9B%BA%E7%9A%84%E9%98%B2%E8%AD%B7%E7%9B%BE%EF%BC%8C%E6%9B%B4%E6%98%AF%E5%80%8B%E6%80%A7%E5%8D%81%E8%B6%B3%E7%9A%84%E6%99%82%E5%B0%9A%E9%85%8D%E4%BB%B6%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.224 [info] 🧹 [CRAWL4AI] URL cleaned {
[0]   "originalUrl": "https://www.landtop.com.tw/reviews/321#:~:text=%E4%B8%80%E3%80%81Rhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%89%8B%E6%A9%9F%E6%AE%BC&text=%E5%A6%82%E6%9E%9C%E6%82%A8%E6%98%AF%E8%BF%BD%E6%B1%82%E5%80%8B%E6%80%A7%E8%88%87%E9%98%B2%E6%91%94%E5%85%BC%E5%85%B7%E7%9A%84%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8CRhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%98%AF%E4%B8%8D%E9%8C%AF%E7%9A%84%E9%81%B8%E6%93%87%E3%80%82%20%E6%8E%A1%E7%94%A8ShockSpread%20%E6%9D%90%E6%96%99%EF%BC%8C%E5%8D%B3%E4%BD%BF%E5%BE%9E3.5%20%E5%85%AC%E5%B0%BA%E9%AB%98%E8%99%95%E8%B7%8C%E8%90%BD%E4%B9%9F%E8%83%BD%E4%BF%9D%E8%AD%B7%E7%84%A1%E8%99%9E%E3%80%82%20%E5%85%A7%E5%B5%8C%E8%9C%82%E5%B7%A2%E7%B5%90%E6%A7%8B%E6%8F%90%E5%8D%8710%25%E8%A1%9D%E6%93%8A%E5%90%B8%E6%94%B6%E5%8A%9B%EF%BC%8C%E8%80%90%E7%94%A8%E4%B8%94%E6%8A%97%E6%B3%9B%E9%BB%83%EF%BC%9B%E5%85%B6%E5%8F%AF%E6%8B%86%E6%8F%9B%E8%83%8C%E8%93%8B%E5%92%8C%E5%A4%9A%E6%AC%BE%E8%81%AF%E5%90%8D%E8%A8%AD%E8%A8%88%EF%BC%8C%E8%AE%93%E4%BD%A0%E8%BC%95%E9%AC%86%E6%89%93%E9%80%A0%E7%8D%A8%E7%89%B9%E9%A2%A8%E6%A0%BC%E3%80%82%20%E4%B8%8D%E5%83%85%E6%98%AF%E5%A0%85%E5%9B%BA%E7%9A%84%E9%98%B2%E8%AD%B7%E7%9B%BE%EF%BC%8C%E6%9B%B4%E6%98%AF%E5%80%8B%E6%80%A7%E5%8D%81%E8%B6%B3%E7%9A%84%E6%99%82%E5%B0%9A%E9%85%8D%E4%BB%B6%E3%80%82",
[0]   "cleanedUrl": "https://www.landtop.com.tw/reviews/321",
[0]   "fragmentRemoved": "#:~:text=%E4%B8%80%E3%80%81Rhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%89%8B%E6%A9%9F%E6%AE%BC&text=%E5%A6%82%E6%9E%9C%E6%82%A8%E6%98%AF%E8%BF%BD%E6%B1%82%E5%80%8B%E6%80%A7%E8%88%87%E9%98%B2%E6%91%94%E5%85%BC%E5%85%B7%E7%9A%84%E6%89%8B%E6%A9%9F%E6%AE%BC%EF%BC%8CRhinoshield%20%E7%8A%80%E7%89%9B%E7%9B%BEMod%20NX%20%E6%98%AF%E4%B8%8D%E9%8C%AF%E7%9A%84%E9%81%B8%E6%93%87%E3%80%82%20%E6%8E%A1%E7%94%A8ShockSpread%20%E6%9D%90%E6%96%99%EF%BC%8C%E5%8D%B3%E4%BD%BF%E5%BE%9E3.5%20%E5%85%AC%E5%B0%BA%E9%AB%98%E8%99%95%E8%B7%8C%E8%90%BD%E4%B9%9F%E8%83%BD%E4%BF%9D%E8%AD%B7%E7%84%A1%E8%99%9E%E3%80%82%20%E5%85%A7%E5%B5%8C%E8%9C%82%E5%B7%A2%E7%B5%90%E6%A7%8B%E6%8F%90%E5%8D%8710%25%E8%A1%9D%E6%93%8A%E5%90%B8%E6%94%B6%E5%8A%9B%EF%BC%8C%E8%80%90%E7%94%A8%E4%B8%94%E6%8A%97%E6%B3%9B%E9%BB%83%EF%BC%9B%E5%85%B6%E5%8F%AF%E6%8B%86%E6%8F%9B%E8%83%8C%E8%93%8B%E5%92%8C%E5%A4%9A%E6%AC%BE%E8%81%AF%E5%90%8D%E8%A8%AD%E8%A8%88%EF%BC%8C%E8%AE%93%E4%BD%A0%E8%BC%95%E9%AC%86%E6%89%93%E9%80%A0%E7%8D%A8%E7%89%B9%E9%A2%A8%E6%A0%BC%E3%80%82%20%E4%B8%8D%E5%83%85%E6%98%AF%E5%A0%85%E5%9B%BA%E7%9A%84%E9%98%B2%E8%AD%B7%E7%9B%BE%EF%BC%8C%E6%9B%B4%E6%98%AF%E5%80%8B%E6%80%A7%E5%8D%81%E8%B6%B3%E7%9A%84%E6%99%82%E5%B0%9A%E9%85%8D%E4%BB%B6%E3%80%82"
[0] }
[0] 2025-06-30 12:51:57.224 [debug] 🚀 [CRAWL4AI] Calling API {
[0]   "endpoint": "http://localhost:11235/crawl",
[0]   "url": "https://www.landtop.com.tw/reviews/321"
[0] }
[0] 2025-06-30 12:52:01.776 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "4552ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:01.776 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://tw.my-best.com/115262",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:01.776 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://tw.my-best.com/115262",
[0]   "contentLength": 39635,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "4553ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[![mybest](https://assets.tw.my-best.com/_next/static/media/mybest_logo_black.e567e915.svg)](https:/..."
[0] }
[0] 2025-06-30 12:52:03.055 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "5834ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:03.055 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://tw.my-best.com/114158",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:03.055 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://tw.my-best.com/114158",
[0]   "contentLength": 99675,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "5834ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[![mybest](https://assets.tw.my-best.com/_next/static/media/mybest_logo_black.e567e915.svg)](https:/..."
[0] }
[0] 2025-06-30 12:52:03.154 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "5931ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:03.154 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://devilcase.com.tw/forum/108/post/194",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:03.154 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://devilcase.com.tw/forum/108/post/194",
[0]   "contentLength": 25178,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "5931ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "購物車\n×\n合計 NT 0\n繼續購物 前往結帳\n您的購物車沒有商品\n新品上市特別優惠 | 全館購物金額滿 ＄600 超取免運\n[![DEVILCASE 手機殼](https://devilcase.c..."
[0] }
[0] 2025-06-30 12:52:03.322 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "6101ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:03.322 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://mbzhu.com/mobile/best-iphone-case/",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:03.323 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://mbzhu.com/mobile/best-iphone-case/",
[0]   "contentLength": 25845,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "1ms",
[0]   "totalDuration": "6102ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[ ![mbzhu\\(碼幫主\\) | 你的首席3C購物顧問](https://mbzhu.com/wp-content/uploads/2021/04/碼幫主LOGO_1000x1000_tw_-bl..."
[0] }
[0] 2025-06-30 12:52:03.765 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "6545ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:03.765 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://www.onion-net.com.tw/news_detail/226",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:03.765 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://www.onion-net.com.tw/news_detail/226",
[0]   "contentLength": 15556,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "6545ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[洋蔥網通](https://www.onion-net.com.tw/ \"洋蔥網通mobile，挑戰通訊行最低價\")\n  * [關於洋蔥](https://www.onion-net.com.tw/..."
[0] }
[0] 2025-06-30 12:52:04.151 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "6929ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:04.151 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://shopee.tw/blog/phone-case-brands/",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:04.151 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://shopee.tw/blog/phone-case-brands/",
[0]   "contentLength": 25157,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "6929ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[跳至主要內容](https://shopee.tw/blog/phone-case-brands/#content)\n[ Search ](https://shopee.tw/blog/phone-..."
[0] }
[0] 2025-06-30 12:52:04.500 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "7278ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:04.500 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://daid207.pixnet.net/blog/post/86339485",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:04.501 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://daid207.pixnet.net/blog/post/86339485",
[0]   "contentLength": 40843,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "1ms",
[0]   "totalDuration": "7280ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "[ ](https://www.pixnet.net?utm_source=PIXNET&utm_medium=navbar&utm_term=home \"PIXNET\") [ ](https://a..."
[0] }
[0] 2025-06-30 12:52:04.718 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "7494ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:04.719 [warn] ⚠️ [CRAWL4AI] Scrape failed or no content {
[0]   "url": "https://www.landtop.com.tw/reviews/321",
[0]   "success": false,
[0]   "errorMessage": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://www.landtop.com.tw/reviews/321, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):",
[0]   "totalDuration": "7495ms"
[0] }
[0] 2025-06-30 12:52:04.719 [debug] 🔍 [CRAWL4AI] Failed response structure: {
[0]   "url": "https://www.landtop.com.tw/reviews/321",
[0]   "success": false,
[0]   "errorMessage": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://www.landtop.com.tw/reviews/321, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):",
[0]   "hasResult": true,
[0]   "allKeys": [
[0]     "url",
[0]     "html",
[0]     "success",
[0]     "cleaned_html",
[0]     "media",
[0]     "links",
[0]     "downloaded_files",
[0]     "js_execution_result",
[0]     "screenshot",
[0]     "pdf",
[0]     "mhtml",
[0]     "extracted_content",
[0]     "metadata",
[0]     "error_message",
[0]     "session_id",
[0]     "response_headers",
[0]     "status_code",
[0]     "ssl_certificate",
[0]     "dispatch_result",
[0]     "redirected_url",
[0]     "network_requests",
[0]     "console_messages",
[0]     "tables"
[0]   ],
[0]   "rawResponse": "{\"url\":\"https://www.landtop.com.tw/reviews/321\",\"html\":\"\",\"success\":false,\"cleaned_html\":null,\"media\":{},\"links\":{},\"downloaded_files\":null,\"js_execution_result\":null,\"screenshot\":null,\"pdf\":null,\"mhtml\":null,\"extracted_content\":null,\"metadata\":null,\"error_message\":\"Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\\nError: Process HTML, Failed to extract content from the website: https://www.landtop.com.tw/review"
[0] }
[0] 2025-06-30 12:52:04.830 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "7610ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:04.830 [debug] 🔍 [CRAWL4AI] Starting content extraction {
[0]   "url": "https://www.gq.com.tw/article/apple-iphone-16-cases",
[0]   "hasMarkdown": true,
[0]   "markdownType": "object"
[0] }
[0] 2025-06-30 12:52:04.830 [info] ✅ [CRAWL4AI] Scrape successful {
[0]   "url": "https://www.gq.com.tw/article/apple-iphone-16-cases",
[0]   "contentLength": 27818,
[0]   "extractionMethod": "markdown.raw_markdown",
[0]   "extractionDuration": "0ms",
[0]   "totalDuration": "7610ms",
[0]   "hasTitle": true,
[0]   "hasMetaDescription": true,
[0]   "contentPreview": "Privacy Center\nCurrently, only residents from certain countries and US states can opt out of certain..."
[0] }
[0] 2025-06-30 12:52:06.002 [debug] 📡 [CRAWL4AI] API response received {
[0]   "statusCode": 200,
[0]   "duration": "8780ms",
[0]   "hasResults": true,
[0]   "resultsCount": 1
[0] }
[0] 2025-06-30 12:52:06.003 [warn] ⚠️ [CRAWL4AI] Scrape failed or no content {
[0]   "url": "https://f5desksetup.com/iphone-phone-case-brands-top-10/",
[0]   "success": false,
[0]   "errorMessage": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://f5desksetup.com/iphone-phone-case-brands-top-10/, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):",
[0]   "totalDuration": "8781ms"
[0] }
[0] 2025-06-30 12:52:06.003 [debug] 🔍 [CRAWL4AI] Failed response structure: {
[0]   "url": "https://f5desksetup.com/iphone-phone-case-brands-top-10/",
[0]   "success": false,
[0]   "errorMessage": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://f5desksetup.com/iphone-phone-case-brands-top-10/, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):",
[0]   "hasResult": true,
[0]   "allKeys": [
[0]     "url",
[0]     "html",
[0]     "success",
[0]     "cleaned_html",
[0]     "media",
[0]     "links",
[0]     "downloaded_files",
[0]     "js_execution_result",
[0]     "screenshot",
[0]     "pdf",
[0]     "mhtml",
[0]     "extracted_content",
[0]     "metadata",
[0]     "error_message",
[0]     "session_id",
[0]     "response_headers",
[0]     "status_code",
[0]     "ssl_certificate",
[0]     "dispatch_result",
[0]     "redirected_url",
[0]     "network_requests",
[0]     "console_messages",
[0]     "tables"
[0]   ],
[0]   "rawResponse": "{\"url\":\"https://f5desksetup.com/iphone-phone-case-brands-top-10/\",\"html\":\"\",\"success\":false,\"cleaned_html\":null,\"media\":{},\"links\":{},\"downloaded_files\":null,\"js_execution_result\":null,\"screenshot\":null,\"pdf\":null,\"mhtml\":null,\"extracted_content\":null,\"metadata\":null,\"error_message\":\"Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\\nError: Process HTML, Failed to extract content from the website: https://f5desks"
[0] }
[0] 2025-06-30 12:52:06.003 [info] 🎉 [CRAWL4AI] Batch scraping completed {
[0]   "urlCount": 10,
[0]   "successCount": 8,
[0]   "failureCount": 2,
[0]   "successRate": "80%",
[0]   "totalDuration": "8783ms",
[0]   "avgDuration": "878ms",
[0]   "totalContentLength": 299707,
[0]   "avgContentLength": 37463
[0] }
[0] 2025-06-30 12:52:06.004 [warn] ⚠️ [CRAWL4AI] Batch scraping failures: {
[0]   "failureCount": 2,
[0]   "failures": [
[0]     {
[0]       "url": "https://f5desksetup.com/iphone-phone-case-brands-top-10/",
[0]       "error": "CRAWL4AI_SCRAPE_FAILED",
[0]       "details": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://f5desksetup.com/iphone-phone-case-brands-top-10/, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):"
[0]     },
[0]     {
[0]       "url": "https://www.landtop.com.tw/reviews/321",
[0]       "error": "CRAWL4AI_SCRAPE_FAILED",
[0]       "details": "Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):\nError: Process HTML, Failed to extract content from the website: https://www.landtop.com.tw/reviews/321, error: '<body>' tag is not found in fetched html. Consider adding wait_for=\"css:body\" to wait for body tag to be loaded into DOM.\n\nCode context:\n 485                   )\n 486   \n 487           except InvalidCSSSelectorError as e:\n 488               raise ValueError(str(e))\n 489           except Exception as e:\n 490 →             raise ValueError(\n 491                   f\"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}\"\n 492               )\n 493   \n 494           # Extract results - handle both dict and ScrapingResult\n 495           if isinstance(result, dict):"
[0]     }
[0]   ]
[0] }
[0] 2025-06-30 12:52:06.004 [warn] Job f54b5770-661b-4f1b-a42c-d97955310fba: 2/10 competitor pages failed to scrape
[0] 2025-06-30 12:52:06.005 [warn] Failed to scrape https://f5desksetup.com/iphone-phone-case-brands-top-10/: CRAWL4AI_SCRAPE_FAILED - Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):
[0] Error: Process HTML, Failed to extract content from the website: https://f5desksetup.com/iphone-phone-case-brands-top-10/, error: '<body>' tag is not found in fetched html. Consider adding wait_for="css:body" to wait for body tag to be loaded into DOM.
[0] 
[0] Code context:
[0]  485                   )
[0]  486   
[0]  487           except InvalidCSSSelectorError as e:
[0]  488               raise ValueError(str(e))
[0]  489           except Exception as e:
[0]  490 →             raise ValueError(
[0]  491                   f"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}"
[0]  492               )
[0]  493   
[0]  494           # Extract results - handle both dict and ScrapingResult
[0]  495           if isinstance(result, dict):
[0] 2025-06-30 12:52:06.005 [warn] Failed to scrape https://www.landtop.com.tw/reviews/321: CRAWL4AI_SCRAPE_FAILED - Unexpected error in _crawl_web at line 490 in aprocess_html (../usr/local/lib/python3.12/site-packages/crawl4ai/async_webcrawler.py):
[0] Error: Process HTML, Failed to extract content from the website: https://www.landtop.com.tw/reviews/321, error: '<body>' tag is not found in fetched html. Consider adding wait_for="css:body" to wait for body tag to be loaded into DOM.
[0] 
[0] Code context:
[0]  485                   )
[0]  486   
[0]  487           except InvalidCSSSelectorError as e:
[0]  488               raise ValueError(str(e))
[0]  489           except Exception as e:
[0]  490 →             raise ValueError(
[0]  491                   f"Process HTML, Failed to extract content from the website: {url}, error: {str(e)}"
[0]  492               )
[0]  493   
[0]  494           # Extract results - handle both dict and ScrapingResult
[0]  495           if isinstance(result, dict):
[0] 2025-06-30 12:52:06.005 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba: Performing content gap analysis
[0] 2025-06-30 12:52:06.005 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba: Preparing data for Gemini analysis {
[0]   "targetKeyword": "手機殼推薦",
[0]   "userPageUrl": "https://shop.rhinoshield.tw/",
[0]   "aiOverviewLength": 778,
[0]   "crawledContentLength": 313164,
[0]   "citedUrlsCount": 13
[0] }
[0] 2025-06-30 12:52:06.006 [info] Gemini API key configured successfully
[0] 2025-06-30 12:52:06.006 [info] Falling back to v5.1 data structure, but converting to v6.0 format
[0] 2025-06-30 12:52:06.006 [info] Building v6.0 format analysis data for fallback {
[0]   "targetKeyword": "手機殼推薦",
[0]   "userPageUrl": "https://shop.rhinoshield.tw/",
[0]   "aiOverviewLength": 778,
[0]   "competitorCount": 8,
[0]   "crawledContentLength": 313164,
[0]   "citedUrlsCount": 13
[0] }
[0] 2025-06-30 12:52:06.006 [debug] User page content preview: {
[0]   "url": "https://shop.rhinoshield.tw/",
[0]   "preview": "🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n[![..."
[0] }
[0] 2025-06-30 12:52:06.006 [debug] Competitor 0 content preview: {
[0]   "url": "https://www.onion-net.com.tw/news_detail/226",
[0]   "preview": "[洋蔥網通](https://www.onion-net.com.tw/ \"洋蔥網通mobile，挑戰通訊行最低價\")\n  * [關於洋蔥](https://www.onion-net.com.tw/about/3 \"關於洋蔥\")\n  * [相關須知](https://www.onion-net.c..."
[0] }
[0] 2025-06-30 12:52:06.006 [debug] Competitor 1 content preview: {
[0]   "url": "https://www.gq.com.tw/article/apple-iphone-16-cases",
[0]   "preview": "Privacy Center\nCurrently, only residents from certain countries and US states can opt out of certain Tracking Technologies through our Consent Managem..."
[0] }
[0] 2025-06-30 12:52:06.006 [debug] Competitor 2 content preview: {
[0]   "url": "https://tw.my-best.com/114158",
[0]   "preview": "[![mybest](https://assets.tw.my-best.com/_next/static/media/mybest_logo_black.e567e915.svg)](https://tw.my-best.com/)\n手機殼好物推薦服務\n搜尋\n選購要點排行榜\n  1. [TOP](..."
[0] }
[0] 2025-06-30 12:52:06.006 [debug] Competitor 3 content preview: {
[0]   "url": "https://mbzhu.com/mobile/best-iphone-case/",
[0]   "preview": "[ ![mbzhu\\(碼幫主\\) | 你的首席3C購物顧問](https://mbzhu.com/wp-content/uploads/2021/04/碼幫主LOGO_1000x1000_tw_-blackword.png) ![mbzhu\\(碼幫主\\) | 你的首席3C購物顧問](https://..."
[0] }
[0] 2025-06-30 12:52:06.006 [debug] Competitor 4 content preview: {
[0]   "url": "https://daid207.pixnet.net/blog/post/86339485",
[0]   "preview": "[ ](https://www.pixnet.net?utm_source=PIXNET&utm_medium=navbar&utm_term=home \"PIXNET\") [ ](https://appmarket.pixnet.tw/?utm_source=PIXNET&utm_medium=n..."
[0] }
[0] 2025-06-30 12:52:06.007 [debug] Competitor 5 content preview: {
[0]   "url": "https://shopee.tw/blog/phone-case-brands/",
[0]   "preview": "[跳至主要內容](https://shopee.tw/blog/phone-case-brands/#content)\n[ Search ](https://shopee.tw/blog/phone-case-brands/)\n[蝦皮購物部落格─蝦品輯](https://shopee.tw/blog..."
[0] }
[0] 2025-06-30 12:52:06.007 [debug] Competitor 6 content preview: {
[0]   "url": "https://devilcase.com.tw/forum/108/post/194",
[0]   "preview": "購物車\n×\n合計 NT 0\n繼續購物 前往結帳\n您的購物車沒有商品\n新品上市特別優惠 | 全館購物金額滿 ＄600 超取免運\n[![DEVILCASE 手機殼](https://devilcase.com.tw/images/header_logo.png)](https://devilcase.c..."
[0] }
[0] 2025-06-30 12:52:06.007 [debug] Competitor 7 content preview: {
[0]   "url": "https://tw.my-best.com/115262",
[0]   "preview": "[![mybest](https://assets.tw.my-best.com/_next/static/media/mybest_logo_black.e567e915.svg)](https://tw.my-best.com/)\n手機殼好物推薦服務\n搜尋\n選購要點排行榜\n  1. [TOP](..."
[0] }
[0] 2025-06-30 12:52:06.007 [info] Built v6.0 format data for fallback: {
[0]   "targetKeyword": "手機殼推薦",
[0]   "userPageUrl": "https://shop.rhinoshield.tw/",
[0]   "aiOverviewLength": 778,
[0]   "crawledContentLength": 313164
[0] }
[0] 2025-06-30 12:52:06.007 [info] 🔧 [PROMPT] Starting prompt template rendering {
[0]   "templateId": "main_analysis_v2",
[0]   "templateName": "Main Analysis Prompt v2.0 (繁體中文)",
[0]   "version": "2.0.0",
[0]   "variablesProvided": [
[0]     "targetKeyword",
[0]     "userPageUrl",
[0]     "aiOverviewContent",
[0]     "citedUrls",
[0]     "crawledContent"
[0]   ],
[0]   "templateLength": 6510,
[0]   "expectedVariables": [
[0]     "targetKeyword",
[0]     "userPageUrl",
[0]     "aiOverviewContent",
[0]     "citedUrls",
[0]     "crawledContent"
[0]   ],
[0]   "missingVariables": []
[0] }
[0] 2025-06-30 12:52:06.008 [debug] 📊 [PROMPT] Variable contents: {
[0]   "targetKeyword": "手機殼推薦",
[0]   "userPageUrl": "https://shop.rhinoshield.tw/",
[0]   "aiOverviewContentLength": 778,
[0]   "aiOverviewContentPreview": "手機殼推薦的選擇眾多，主要可依照品牌、材質、功能和個人喜好來挑選。 根據手機殼推薦網站my-best.com 的資訊，熱門品牌如犀牛盾、UAG、CASETiFY 等，都有推出多種防摔、透明、設計感十足...",
[0]   "citedUrlsCount": 13,
[0]   "crawledContentLength": 313164,
[0]   "crawledContentSample": "--- URL: https://shop.rhinoshield.tw/ ---\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n[![RHINOSHI..."
[0] }
[0] 2025-06-30 12:52:06.008 [debug] ✅ [PROMPT] Replaced {{targetKeyword}} {
[0]   "occurrences": 1,
[0]   "valueLength": 5,
[0]   "lengthChange": -12
[0] }
[0] 2025-06-30 12:52:06.008 [debug] ✅ [PROMPT] Replaced {{userPageUrl}} {
[0]   "occurrences": 1,
[0]   "valueLength": 28,
[0]   "lengthChange": 13
[0] }
[0] 2025-06-30 12:52:06.008 [debug] ✅ [PROMPT] Replaced {{aiOverviewContent}} {
[0]   "occurrences": 1,
[0]   "valueLength": 778,
[0]   "lengthChange": 757
[0] }
[0] 2025-06-30 12:52:06.008 [debug] ✅ [PROMPT] Replaced {{citedUrls}} {
[0]   "occurrences": 1,
[0]   "valueLength": 8204,
[0]   "lengthChange": 8191
[0] }
[0] 2025-06-30 12:52:06.009 [debug] ✅ [PROMPT] Replaced {{crawledContent}} {
[0]   "occurrences": 1,
[0]   "valueLength": 313164,
[0]   "lengthChange": 313146
[0] }
[0] 2025-06-30 12:52:06.011 [info] ✅ [PROMPT] All template variables successfully resolved: {
[0]   "replacementsMade": 5,
[0]   "finalPromptLength": 328605,
[0]   "compressionRatio": "50.48",
[0]   "renderDuration": "4ms",
[0]   "replacementDetails": {
[0]     "targetKeyword": {
[0]       "occurrences": 1,
[0]       "valueLength": 5,
[0]       "lengthChange": -12,
[0]       "valuePreview": "手機殼推薦"
[0]     },
[0]     "userPageUrl": {
[0]       "occurrences": 1,
[0]       "valueLength": 28,
[0]       "lengthChange": 13,
[0]       "valuePreview": "https://shop.rhinoshield.tw/"
[0]     },
[0]     "aiOverviewContent": {
[0]       "occurrences": 1,
[0]       "valueLength": 778,
[0]       "lengthChange": 757,
[0]       "valuePreview": "手機殼推薦的選擇眾多，主要可依照品牌、材質、功能和個人喜好來挑選。 根據手機殼推薦網站my-best.com 的資訊，熱門品牌如犀牛盾、UAG、CASETiFY 等，都有推出多種防摔、透明、設計感十足..."
[0]     },
[0]     "citedUrls": {
[0]       "occurrences": 1,
[0]       "valueLength": 8204,
[0]       "lengthChange": 8191,
[0]       "valuePreview": "https://www.onion-net.com.tw/news_detail/226#:~:text=%E6%8C%91%E9%81%B8%E6%89%8B%E6%A9%9F%E6%AE%BC%E..."
[0]     },
[0]     "crawledContent": {
[0]       "occurrences": 1,
[0]       "valueLength": 313164,
[0]       "lengthChange": 313146,
[0]       "valuePreview": "--- URL: https://shop.rhinoshield.tw/ ---\n🚛 台灣訂單滿 $400 元輕鬆免運無負擔！🚛（中港澳訂單滿 $1,800 元亦享免運優惠）\n🚛 台灣訂單滿 ..."
[0]     }
[0]   }
[0] }
[0] 2025-06-30 12:52:06.012 [info] 📊 [PROMPT] Prompt rendering complete {
[0]   "category": "main_analysis",
[0]   "originalLength": 6510,
[0]   "finalLength": 328605,
[0]   "expansionFactor": "50.48",
[0]   "renderDuration": "4ms",
[0]   "hasUnresolvedVars": false
[0] }
[0] 2025-06-30 12:52:06.012 [info] 📝 [GEMINI] Prompt rendered successfully: {
[0]   "promptLength": 328605,
[0]   "promptPreview": "當您提供以下資料時，我將會依照這個經過調整的格式為您產出報告：\n\n【使用者提供關鍵字】: 手機殼推薦\n【使用者提供網址】: https://shop.rhinoshield.tw/\n【AI Overview 內容】: 手機殼推薦的選擇眾多，主要可依照品牌、材質、功能和個人喜好來挑選。 根據手機殼推薦網站my-best.com 的資訊，熱門品牌如犀牛盾、UAG、CASETiFY 等，都有推出多種防摔、透明、設計感十足的款式。 建議考量個人使用習慣，例如是否容易摔手機、是否需要防摔功能、是否追求個性化設計等，再從中挑選最適合自己的手機殼。\n\n以下是一些手機殼推薦的重點整理：\n\n1. 防摔性：\n\n以...",
[0]   "containsTargetKeyword": true,
[0]   "targetKeywordOccurrences": 40
[0] }
[0] 2025-06-30 12:52:06.012 [info] Starting Gemini analysis...
[0] 2025-06-30 12:53:02.224 [info] Gemini response length: 10784 chars
[0] 2025-06-30 12:53:02.229 [info] Response content validation passed: {
[0]   "isValid": true,
[0]   "reasons": [
[0]     "P1 recommendations do not contain target keyword \"手機殼推薦\"",
[0]     "Keyword intent analysis does not contain target keyword \"手機殼推薦\""
[0]   ],
[0]   "confidence": 33.33333333333333
[0] }
[0] 2025-06-30 12:53:02.229 [info] Gemini analysis completed successfully
[0] 2025-06-30 12:53:02.235 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba progress: 95%
[0] 2025-06-30 12:53:02.239 [info] Job completion evaluated: completed (quality: 100) {
[0]   "status": "completed",
[0]   "completedSteps": [
[0]     "serpapi",
[0]     "user_scraping",
[0]     "competitor_scraping",
[0]     "ai_analysis"
[0]   ],
[0]   "failedSteps": [],
[0]   "warnings": [],
[0]   "errors": [],
[0]   "qualityScore": 100,
[0]   "fallbacksUsed": []
[0] }
[0] 2025-06-30 12:53:02.240 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba progress: 100%
[0] 2025-06-30 12:53:02.240 [info] 🎉 [WORKER] Job completed {
[0]   "jobId": "f54b5770-661b-4f1b-a42c-d97955310fba",
[0]   "status": "completed",
[0]   "statusMessage": "completed successfully",
[0]   "qualityScore": 100,
[0]   "qualityLevel": "excellent",
[0]   "totalDuration": "68231ms",
[0]   "finalPhaseDuration": "56235ms",
[0]   "completedSteps": 4,
[0]   "totalSteps": 4,
[0]   "errors": 0,
[0]   "warnings": 0,
[0]   "phases": {
[0]     "serpApi": "completed",
[0]     "userPage": "completed",
[0]     "competitorPages": "partial",
[0]     "aiAnalysis": "completed"
[0]   }
[0] }
[0] 2025-06-30 12:53:02.243 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba completed successfully
[0] 2025-06-30 12:53:02.244 [info] Job f54b5770-661b-4f1b-a42c-d97955310fba completed successfully
[0] 2025-06-30 12:53:02.502 [debug] Job f54b5770-661b-4f1b-a42c-d97955310fba completed with result: {
[0]   "hasResult": true,
[0]   "resultKeys": [
[0]     "strategyAndPlan",
[0]     "keywordIntent",
[0]     "aiOverviewAnalysis",
[0]     "citedSourceAnalysis",
[0]     "websiteAssessment",
[0]     "reportFooter",
[0]     "analysisId",
[0]     "timestamp",
[0]     "aiOverviewData",
[0]     "competitorUrls",
[0]     "processingSteps",
[0]     "usedFallbackData",
[0]     "jobCompletion",
[0]     "errors",
[0]     "warnings",
[0]     "qualityAssessment"
[0]   ],
[0]   "hasAnalysisId": true,
[0]   "hasStrategyAndPlan": true,
[0]   "hasKeywordIntent": true,
[0]   "resultSize": 27057
[0] }
