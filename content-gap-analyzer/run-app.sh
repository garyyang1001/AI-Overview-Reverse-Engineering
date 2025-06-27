#!/bin/bash

# 載入並檢查後端環境變數（但不導出所有變數）
if [ -f "backend/.env" ]; then
  # 只讀取需要檢查的 API Keys
  GEMINI_API_KEY=$(grep "^GEMINI_API_KEY=" backend/.env | cut -d= -f2-)
  SERPAPI_KEY=$(grep "^SERPAPI_KEY=" backend/.env | cut -d= -f2-)
  echo "✅ 已載入 backend/.env 環境變數"
else
  echo "⚠️ 找不到 backend/.env 文件，請確保已配置 API Keys"
fi

echo "🚀 啟動 AI SEO Content Gap Analyzer"
echo "=================================="

# 檢查端口是否被占用
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 3002 被占用，正在清理..."
    pkill -f "node.*3002"
    sleep 2
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 3000 被占用，正在清理..."
    pkill -f "react-scripts"
    sleep 2
fi

echo "📋 API Keys 狀態:"
echo "  GEMINI_API_KEY: $([ -n "$GEMINI_API_KEY" ] && echo "✅ 已設置" || echo "❌ 未設置")"
echo "  SERPAPI_KEY: $([ -n "$SERPAPI_KEY" ] && echo "✅ 已設置" || echo "❌ 未設置")"
echo ""

echo "🔧 啟動後端服務 (port 3002)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   後端 PID: $BACKEND_PID"

# 等待後端啟動
echo "   等待後端啟動..."
sleep 5

# 檢查後端是否成功啟動
if curl -s http://localhost:3002/api/health > /dev/null; then
    echo "   ✅ 後端啟動成功"
else
    echo "   ❌ 後端啟動失敗，請檢查 backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎨 啟動前端應用 (port 3000)..."
cd ../frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID"

echo ""
echo "✨ 應用已啟動！"
echo "   🌐 前端: http://localhost:3000"
echo "   🔌 後端: http://localhost:3002"
echo "   📊 健康檢查: http://localhost:3002/api/health"
echo ""
echo "📝 日誌文件:"
echo "   後端: backend.log"
echo "   前端: frontend.log"
echo ""
echo "按 Ctrl+C 停止所有服務"

# 創建停止函數
cleanup() {
    echo ""
    echo "🛑 正在停止服務..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ 服務已停止"
    exit 0
}

# 捕獲中斷信號
trap cleanup SIGINT SIGTERM

# 等待用戶中斷
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 後端服務異常退出"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 前端服務異常退出"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    sleep 5
done