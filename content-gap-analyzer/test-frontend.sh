#!/bin/bash

echo "🧪 測試前端和後端完整集成"
echo "=============================="

# 測試前端可訪問性
echo "1. 測試前端頁面..."
if curl -s http://localhost:3000 | grep -q "react"; then
    echo "   ✅ 前端頁面正常加載"
else
    echo "   ❌ 前端頁面無法正常加載"
    exit 1
fi

# 測試後端 API
echo "2. 測試後端 API..."
if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
    echo "   ✅ 後端 API 正常運行"
else
    echo "   ❌ 後端 API 無法正常運行"
    exit 1
fi

# 測試完整分析流程
echo "3. 測試完整分析流程..."
ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/analysis/start \
  -H "Content-Type: application/json" \
  -d '{
    "targetKeyword": "澳洲打工度假",
    "userPageUrl": "https://studycentralau.com/work-in-australia/working-holiday-in-australia/"
  }')

if echo "$ANALYSIS_RESPONSE" | grep -q "analysisId\|result"; then
    echo "   ✅ 分析請求成功"
    
    # 檢查是否有結果
    if echo "$ANALYSIS_RESPONSE" | grep -q "fromCache.*true"; then
        echo "   ✅ 返回了快取結果"
        echo "   📊 結果摘要:"
        echo "$ANALYSIS_RESPONSE" | jq -r '.result.executiveSummary' 2>/dev/null || echo "     (無法解析摘要)"
    else
        ANALYSIS_ID=$(echo "$ANALYSIS_RESPONSE" | jq -r '.analysisId' 2>/dev/null)
        if [ "$ANALYSIS_ID" != "null" ] && [ -n "$ANALYSIS_ID" ]; then
            echo "   🔄 分析進行中，ID: $ANALYSIS_ID"
            
            # 等待一下並檢查狀態
            sleep 3
            STATUS_RESPONSE=$(curl -s http://localhost:3001/api/analysis/status/$ANALYSIS_ID)
            STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)
            echo "   📊 分析狀態: $STATUS"
        fi
    fi
else
    echo "   ❌ 分析請求失敗"
    echo "   錯誤響應: $ANALYSIS_RESPONSE"
    exit 1
fi

echo ""
echo "🎉 所有測試通過！"
echo ""
echo "📱 使用說明:"
echo "   1. 打開瀏覽器訪問: http://localhost:3000"
echo "   2. 輸入關鍵字: 澳洲打工度假"
echo "   3. 輸入網頁 URL: https://studycentralau.com/work-in-australia/working-holiday-in-australia/"
echo "   4. 點擊「開始分析」按鈕"
echo "   5. 查看分析結果"
echo ""
echo "⚠️  注意: 目前使用測試數據，實際部署需要正確配置 Gemini API"