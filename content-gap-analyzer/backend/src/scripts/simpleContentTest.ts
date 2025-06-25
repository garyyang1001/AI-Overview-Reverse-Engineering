// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { contentRefinementService } from '../services/contentRefinementService';

async function testContentRefinement() {
  console.log('=== 測試內容精煉 ===\n');

  const testContent1 = {
    url: 'https://test1.com',
    title: '如何挑選適合的咖啡豆',
    headings: ['咖啡豆選擇技巧', '烘焙程度指南'],
    cleanedContent: '這是關於如何挑選適合的咖啡豆的詳細指南。選擇咖啡豆時要考慮烘焙程度、產地和個人喜好。淺焙豆適合喜愛果酸的人，深焙豆適合喜愛苦味的人。',
    metaDescription: '咖啡豆挑選指南'
  };

  const testContent2 = {
    url: 'https://test2.com',
    title: '睡眠習慣改善方法',
    headings: ['健康睡眠', '睡眠品質提升'],
    cleanedContent: '這是關於睡眠習慣改善的實用建議。規律作息、良好的睡眠環境和適當的運動都有助於提高睡眠品質。建議每晚睡眠7-8小時。',
    metaDescription: '睡眠習慣改善指南'
  };

  console.log('1. 測試咖啡豆內容精煉...');
  const refined1 = await contentRefinementService.refinePage(testContent1, 'test-1');
  console.log('原始內容:', testContent1.cleanedContent);
  console.log('精煉結果:', refined1.refinedSummary);
  console.log('');

  console.log('2. 測試睡眠習慣內容精煉...');
  const refined2 = await contentRefinementService.refinePage(testContent2, 'test-2');
  console.log('原始內容:', testContent2.cleanedContent);
  console.log('精煉結果:', refined2.refinedSummary);
  console.log('');

  console.log('=== 測試完成 ===');
}

testContentRefinement().catch(console.error);