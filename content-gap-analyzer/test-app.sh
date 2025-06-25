#!/bin/bash

echo "🧪 測試 AI SEO Content Gap Analyzer"
echo "================================="

# 測試後端健康檢查
echo "1. 測試後端健康檢查..."
if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
    echo "   ✅ 後端健康檢查通過"
else
    echo "   ❌ 後端健康檢查失敗"
    exit 1
fi

# 測試前端是否可訪問
echo "2. 測試前端可訪問性..."
if curl -s http://localhost:3000 | grep -q "react"; then
    echo "   ✅ 前端可正常訪問"
else
    echo "   ❌ 前端無法訪問"
    exit 1
fi

# 測試 API 端點
echo "3. 測試 API 端點..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/analysis/status/test | grep -q "404"; then
    echo "   ✅ API 端點正常響應"
else
    echo "   ❌ API 端點異常"
    exit 1
fi

echo ""
echo "🎉 所有測試通過！應用正常運行"
echo ""
echo "📖 使用說明:"
echo "   1. 打開瀏覽器訪問 http://localhost:3000"
echo "   2. 輸入目標關鍵字（例如：如何挑選咖啡豆）"
echo "   3. 輸入您的網頁 URL"
echo "   4. 點擊「開始分析」"
echo ""
echo "⚠️  注意: 需要設置 GEMINI_API_KEY 和 SERPAPI_KEY 才能進行實際分析"