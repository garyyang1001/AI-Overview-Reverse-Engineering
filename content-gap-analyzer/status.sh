#!/bin/bash

echo "🔍 AI SEO Content Gap Analyzer - 狀態檢查"
echo "========================================="

# 檢查前端
echo "1. 檢查前端服務 (Port 3000)..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ 前端正常運行"
    echo "   🌐 URL: http://localhost:3000"
else
    echo "   ❌ 前端無法訪問"
fi

echo ""

# 檢查後端
echo "2. 檢查後端服務 (Port 3001)..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "   ✅ 後端正常運行"
    echo "   🔌 API URL: http://localhost:3001"
    
    # 獲取健康狀態詳情
    HEALTH=$(curl -s http://localhost:3001/api/health)
    UPTIME=$(echo "$HEALTH" | jq -r '.uptime' 2>/dev/null || echo "未知")
    echo "   ⏱️  運行時間: ${UPTIME}秒"
else
    echo "   ❌ 後端無法訪問"
fi

echo ""

# 檢查 Redis
echo "3. 檢查 Redis 服務..."
if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis 正常運行"
else
    echo "   ⚠️  Redis 未運行 (可選服務)"
fi

echo ""

# 檢查 API 功能
echo "4. 測試 API 功能..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3001/api/analysis/start \
  -H "Content-Type: application/json" \
  -d '{"targetKeyword":"test","userPageUrl":"https://example.com"}' 2>/dev/null)

if echo "$TEST_RESPONSE" | grep -q "analysisId"; then
    echo "   ✅ API 端點正常響應"
    ANALYSIS_ID=$(echo "$TEST_RESPONSE" | jq -r '.analysisId' 2>/dev/null)
    echo "   🆔 測試分析 ID: $ANALYSIS_ID"
else
    echo "   ❌ API 端點無法正常響應"
fi

echo ""

# 環境變數檢查
echo "5. 檢查環境變數..."
if [ -f "backend/.env" ]; then
    echo "   ✅ .env 配置文件存在"
    
    if grep -q "OPENAI_API_KEY=" backend/.env && [ -n "$(grep OPENAI_API_KEY= backend/.env | cut -d= -f2)" ]; then
        echo "   ✅ OPENAI_API_KEY 已設置"
    else
        echo "   ⚠️  OPENAI_API_KEY 未設置或為空"
    fi
    
    if grep -q "SERPAPI_KEY=" backend/.env && [ -n "$(grep SERPAPI_KEY= backend/.env | cut -d= -f2)" ]; then
        echo "   ✅ SERPAPI_KEY 已設置"
    else
        echo "   ⚠️  SERPAPI_KEY 未設置或為空"
    fi
else
    echo "   ❌ .env 配置文件不存在"
fi

echo ""

# 總結
echo "📋 總結:"
if curl -s http://localhost:3000 > /dev/null && curl -s http://localhost:3001/api/health > /dev/null; then
    echo "🎉 應用程式正常運行！"
    echo ""
    echo "🚀 開始使用:"
    echo "   1. 打開瀏覽器訪問: http://localhost:3000"
    echo "   2. 輸入目標關鍵字和網頁 URL"
    echo "   3. 點擊「開始分析」按鈕"
    echo ""
    echo "💡 提示: 確保 OPENAI_API_KEY 和 SERPAPI_KEY 已正確設置以進行完整分析"
else
    echo "⚠️  部分服務未正常運行，請檢查上述錯誤"
fi