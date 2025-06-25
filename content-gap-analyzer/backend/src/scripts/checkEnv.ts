import dotenv from 'dotenv';

// 手動載入 .env 文件
dotenv.config();

console.log('=== 環境變數檢查 ===');
console.log('OPENAI_API_KEY 存在:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY 長度:', process.env.OPENAI_API_KEY?.length || 0);
console.log('OPENAI_API_KEY 前10字符:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'N/A');

console.log('\nSERPAPI_KEY 存在:', !!process.env.SERPAPI_KEY);
console.log('SERPAPI_KEY 長度:', process.env.SERPAPI_KEY?.length || 0);

console.log('\nPORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// 測試 OpenAI key 格式
const openaiKey = process.env.OPENAI_API_KEY;
if (openaiKey) {
  if (openaiKey.startsWith('sk-')) {
    console.log('\n✅ OpenAI key 格式看起來正確');
  } else {
    console.log('\n❌ OpenAI key 格式不正確，應該以 sk- 開頭');
  }
}