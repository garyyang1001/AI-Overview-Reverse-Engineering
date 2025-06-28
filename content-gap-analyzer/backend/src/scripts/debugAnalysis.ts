// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { promptService } from '../services/promptService';
import { openaiService } from '../services/geminiService';

async function debugAnalysis() {
  console.log('=== 開始調試分析流程 ===\n');

  // 1. 測試 Prompt 渲染
  console.log('1. 測試 Prompt 渲染...');
  try {
    const testData = {
      analysisContext: JSON.stringify({
        targetKeyword: "測試關鍵字",
        aiOverview: {
          text: "這是測試的 AI Overview 內容",
          references: ["https://test1.com", "https://test2.com"]
        }
      }),
      userPage: JSON.stringify({
        url: "https://user-test.com",
        essentialsSummary: "用戶頁面的測試摘要內容"
      }),
      competitorPages: JSON.stringify([
        {
          url: "https://competitor1.com",
          essentialsSummary: "競爭對手1的測試摘要"
        }
      ])
    };

    const prompt = promptService.renderPrompt('main_analysis', testData);
    
    if (prompt) {
      console.log('✅ Prompt 渲染成功');
      console.log(`Prompt 長度: ${prompt.length} 字符`);
      console.log('Prompt 前 200 字符:');
      console.log(prompt.substring(0, 200) + '...\n');
    } else {
      console.log('❌ Prompt 渲染失敗\n');
      return;
    }
  } catch (error) {
    console.log('❌ Prompt 渲染錯誤:', error);
    return;
  }

  // 2. 測試 OpenAI API 連接
  console.log('2. 測試 OpenAI API 連接...');
  try {
    const testInput = {
      targetKeyword: "測試關鍵字",
      userPage: {
        url: "https://user-test.com",
        cleanedContent: "這是用戶頁面的測試內容，包含一些基本的資訊。",
        title: "測試頁面標題",
        headings: ["標題1", "標題2"],
        metaDescription: "測試元描述"
      },
      aiOverview: {
        summaryText: "這是測試的 AI Overview 摘要",
        references: ["https://ref1.com", "https://ref2.com"]
      },
      competitorPages: [
        {
          url: "https://competitor1.com",
          cleanedContent: "競爭對手的測試內容，比較詳細的描述。",
          title: "競爭對手標題",
          headings: ["競爭標題1"],
          metaDescription: "競爭對手元描述"
        }
      ],
      jobId: "test-job-" + Date.now()
    };

    console.log('發送測試請求到 OpenAI...');
    const result = await openaiService.analyzeContentGap(testInput);
    
    console.log('✅ OpenAI API 調用成功');
    console.log('返回結果類型:', typeof result);
    console.log('返回結果鍵:', Object.keys(result));
    
    if (result.reportFooter) {
      console.log('報告結尾:', result.reportFooter);
    }
    
    console.log('\n=== 調試完成 ===');
  } catch (error: any) {
    console.log('❌ OpenAI API 調用失敗');
    console.log('錯誤類型:', error.constructor.name);
    console.log('錯誤訊息:', error.message);
    if (error.response) {
      console.log('API 回應狀態:', error.response.status);
      console.log('API 回應數據:', error.response.data);
    }
    console.log('完整錯誤:', error);
  }
}

// 執行調試
debugAnalysis().catch(console.error);