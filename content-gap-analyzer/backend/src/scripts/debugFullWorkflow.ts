// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { serpApiService } from '../services/serpApiService';
// import { contentRefinementService } from '../services/contentRefinementService'; // Service removed
import { geminiService } from '../services/geminiService';

async function debugFullWorkflow() {
  console.log('=== 完整工作流程調試 ===\n');

  // 測試兩個不同的關鍵字
  const testKeywords = [
    '如何挑選適合的咖啡豆',
    '最佳睡眠習慣建議'
  ];

  const testUserPage = 'https://example.com/test-page';

  for (let i = 0; i < testKeywords.length; i++) {
    const keyword = testKeywords[i];
    console.log(`\n### 測試關鍵字 ${i + 1}: "${keyword}" ###\n`);

    try {
      // 1. 測試 SerpApi
      console.log('1. 測試 SerpApi...');
      const aiOverview = await serpApiService.getAIOverview(keyword);
      
      if (!aiOverview) {
        console.log('❌ SerpApi 返回 null');
        continue;
      }
      
      console.log('✅ SerpApi 調用成功');
      console.log(`AI Overview 長度: ${aiOverview.summaryText?.length || 0} 字符`);
      console.log(`引用連結數量: ${aiOverview.references?.length || 0}`);
      console.log(`AI Overview 前100字符: ${aiOverview.summaryText?.substring(0, 100) || 'N/A'}...`);
      console.log(`是否使用回退數據: ${aiOverview.fallbackUsed ? '是' : '否'}\n`);

      // 2. 測試頁面爬取（模擬）
      console.log('2. 測試頁面爬取...');
      const mockUserPage = {
        url: testUserPage,
        title: `測試頁面 - ${keyword}`,
        headings: [`如何${keyword}`, '專業建議', '實用技巧'],
        cleanedContent: `這是關於${keyword}的詳細指南。本文將深入探討相關技巧和建議，幫助您了解最佳實踐。我們將涵蓋多個重要面向，包括基礎知識、進階技巧、以及專家見解。無論您是初學者還是有經驗的人士，都能從本文中獲得有價值的資訊。`,
        metaDescription: `了解${keyword}的完整指南`
      };

      const mockCompetitorPages = [
        {
          url: aiOverview.references?.[0] || 'https://competitor1.com',
          title: `競爭對手1 - ${keyword}指南`,
          headings: ['專業分析', '數據支持'],
          cleanedContent: `競爭對手1的${keyword}專業分析。包含最新研究數據和行業趨勢分析。我們的專家團隊經過多年研究，提供科學依據的建議。`,
          metaDescription: `專業的${keyword}分析`
        },
        {
          url: aiOverview.references?.[1] || 'https://competitor2.com',
          title: `競爭對手2 - ${keyword}深度解析`,
          headings: ['實用案例', '專家建議'],
          cleanedContent: `競爭對手2提供${keyword}的深度解析和實用案例。通過真實案例展示最佳實踐，並提供可執行的行動建議。`,
          metaDescription: `${keyword}的深度解析`
        }
      ];

      console.log('✅ 頁面內容準備完成\n');

      // 3. 跳過內容精煉（服務已移除）
      console.log('3. 跳過內容精煉（服務已移除）...');
      console.log('✅ 使用原始內容進行測試');
      console.log('');

      // 4. 測試最終分析
      console.log('4. 測試 Gemini 最終分析...');

      const analysisResult = await geminiService.analyzeContentGap({
        targetKeyword: keyword,
        userPage: mockUserPage,
        aiOverview,
        competitorPages: mockCompetitorPages,
        jobId: `debug-full-${i}-${Date.now()}`
      });

      console.log('✅ OpenAI 分析完成');
      console.log('分析結果類型:', typeof analysisResult);
      console.log('分析結果鍵:', Object.keys(analysisResult));
      
      // 嘗試解析結果（可能是 JSON 字符串）
      let parsedResult = analysisResult;
      if (typeof analysisResult === 'string') {
        try {
          parsedResult = JSON.parse(analysisResult);
        } catch (e) {
          console.log('無法解析 JSON 結果');
        }
      }
      
      if (parsedResult && typeof parsedResult === 'object') {
        if ((parsedResult as any).executiveSummary) {
          const exec = (parsedResult as any).executiveSummary;
          console.log(`主要排除原因: ${exec.mainReasonForExclusion || '無'}`);
          console.log(`頂級優先行動: ${exec.topPriorityAction || '無'}`);
          console.log(`信心分數: ${exec.confidenceScore || '無'}`);
        }
        
        if ((parsedResult as any).contentGapAnalysis?.missingTopics) {
          const gaps = (parsedResult as any).contentGapAnalysis.missingTopics;
          console.log(`缺失主題數量: ${gaps.length}`);
          if (gaps.length > 0) {
            console.log(`第一個缺失主題: ${gaps[0].topic || '無'}`);
          }
        }
      }

    } catch (error: any) {
      console.log(`❌ 測試失敗: ${error.message}`);
      console.log('錯誤詳情:', error);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('=== 調試完成 ===');
}

// 執行調試
debugFullWorkflow().catch(console.error);