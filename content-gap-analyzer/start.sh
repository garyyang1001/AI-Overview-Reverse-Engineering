#!/bin/bash

echo "🚀 啟動 AI SEO Content Gap Analyzer"

# 檢查 Redis 是否運行
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis 未運行，將在無快取模式下啟動"
else
    echo "✅ Redis 已連接"
fi

echo "📝 啟動說明："
echo "1. 後端將在 http://localhost:3001 運行"
echo "2. 前端將在 http://localhost:3000 運行"
echo "3. 需要設置 GEMINI_API_KEY 和 SERPAPI_KEY 環境變數"
echo ""

# 啟動後端
echo "🔧 啟動後端服務..."
cd backend
npm run dev &
BACKEND_PID=$!

# 等待後端啟動
sleep 5

# 啟動前端
echo "🎨 啟動前端應用..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✨ 應用已啟動！"
echo "後端 PID: $BACKEND_PID"
echo "前端 PID: $FRONTEND_PID"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待用戶中斷
wait