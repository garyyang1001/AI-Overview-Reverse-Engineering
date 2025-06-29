# AI SEO Content Gap Analyzer

一個基於 AI 的 SEO 內容差距分析工具，透過逆向工程 Google AI Overview 來幫助內容創作者優化他們的文章。

## 功能特點

- 🔍 **AI Overview 分析**：自動獲取並分析 Google AI Overview 的內容
- 📊 **內容差距診斷**：精準定位您的內容與頂尖來源之間的差距
- 💡 **可操作建議**：提供具體的內容改進建議
- 🎯 **E-E-A-T 優化**：根據 Google 的品質指南優化內容
- ⚡ **智能快取**：避免重複分析，節省 API 成本
- 📥 **報告匯出**：支援 PDF 和 HTML 格式下載分析報告

## 技術架構

### 後端
- Node.js + Express + TypeScript
- Google Gemini AI API
- SerpAPI
- Redis 快取
- Cheerio 網頁爬蟲
- Puppeteer (PDF 生成)

### 前端
- React + TypeScript
- TanStack Query
- Tailwind CSS
- Lucide Icons

## 快速開始

### 環境需求
- Node.js 18+
- Redis (可選，用於快取)
- Google Gemini API Key
- SerpAPI Key

### 安裝步驟

1. **安裝所有依賴**
```bash
cd content-gap-analyzer
npm run install:all
```

2. **設置環境變數**
```bash
# 編輯 backend/.env 文件
cd backend
cp .env.example .env
# 填入您的 API keys：
# GEMINI_API_KEY=your_key_here
# SERPAPI_KEY=your_key_here
```

3. **啟動應用（推薦）**
```bash
# 回到根目錄
cd ..
./run-app.sh
```

### 手動啟動（可選）

如果自動啟動腳本有問題，可以手動啟動：

```bash
# 終端 1 - 啟動後端
cd backend
npm run dev

# 終端 2 - 啟動前端
cd frontend
npm start
```

### 測試應用

```bash
# 測試應用是否正常運行
./test-app.sh
```

## 使用方法

1. 在網頁界面輸入目標關鍵字
2. 輸入您要分析的網頁 URL
3. （可選）添加競爭對手的 URL
4. 點擊「開始分析」
5. 等待分析完成，查看詳細報告
6. 完成後可下載 PDF 或 HTML 格式報告

## API 端點

- `POST /api/analyze` - 開始新的分析
- `GET /api/results/:jobId` - 獲取分析狀態和結果
- `GET /api/export/pdf/:jobId` - 下載 PDF 格式報告
- `GET /api/export/html/:jobId` - 下載 HTML 格式報告
- `GET /api/health` - 健康檢查

## 配置說明

### 環境變數

```env
# 後端配置
PORT=3001
NODE_ENV=development

# API Keys
GEMINI_API_KEY=your_gemini_api_key
SERPAPI_KEY=your_serpapi_key

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 部署

### Docker 部署
```bash
# 建構映像
docker build -t content-gap-analyzer .

# 執行容器
docker run -p 3001:3001 --env-file .env content-gap-analyzer
```

### PM2 部署
```bash
# 安裝 PM2
npm install -g pm2

# 啟動應用
pm2 start ecosystem.config.js
```

## 成本優化

- 實施 24 小時快取策略
- 批量處理相似請求
- 限制競爭對手分析數量
- 使用 Gemini Pro 模型以平衡成本與效能

## 貢獻指南

歡迎提交 Pull Request 或開啟 Issue！

## 授權

MIT License