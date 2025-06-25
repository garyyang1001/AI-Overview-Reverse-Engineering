const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testSerpAPI() {
  console.log('🔍 測試 SerpAPI...');
  
  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  
  if (!SERPAPI_KEY) {
    console.log('❌ 未找到 SERPAPI_KEY 環境變數');
    console.log('請確保 backend/.env 文件包含有效的 SERPAPI_KEY');
    return;
  }
  
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        q: '如何挑選咖啡豆',
        api_key: SERPAPI_KEY,
        engine: 'google',
        gl: 'us',
        hl: 'en',
        ai_overview: true
      },
      timeout: 30000
    });
    
    console.log('✅ SerpAPI 響應成功');
    console.log('AI Overview:', response.data.ai_overview ? '✅ 找到' : '❌ 未找到');
    
    if (response.data.error) {
      console.log('❌ SerpAPI 錯誤:', response.data.error);
    }
    
    if (response.data.ai_overview) {
      console.log('AI Overview 文本長度:', response.data.ai_overview.text?.length || 0);
      console.log('引用數量:', response.data.ai_overview.sources?.length || 0);
    }
    
  } catch (error) {
    console.log('❌ SerpAPI 調用失敗:', error.message);
    if (error.response) {
      console.log('響應狀態:', error.response.status);
      console.log('響應數據:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testOpenAI() {
  console.log('\n🤖 測試 OpenAI API...');
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    console.log('❌ 未找到 OPENAI_API_KEY 環境變數');
    console.log('請確保 backend/.env 文件包含有效的 OPENAI_API_KEY');
    return;
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: '請簡單回答：你好嗎？'
        }],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ OpenAI API 響應成功');
    console.log('響應長度:', JSON.stringify(response.data).length);
    
  } catch (error) {
    console.log('❌ OpenAI API 調用失敗:', error.message);
    if (error.response) {
      console.log('響應狀態:', error.response.status);
      console.log('響應數據:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testContentScraping() {
  console.log('\n🌐 測試內容爬取...');
  
  try {
    const response = await axios.get('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    console.log('✅ 內容爬取成功');
    console.log('內容長度:', response.data.length);
    
  } catch (error) {
    console.log('❌ 內容爬取失敗:', error.message);
  }
}

async function runTests() {
  console.log('🧪 開始調試測試...\n');
  console.log('📋 確保 backend/.env 文件包含必要的 API 密鑰\n');
  
  await testSerpAPI();
  await testOpenAI();
  await testContentScraping();
  
  console.log('\n✅ 測試完成');
  console.log('\n🔒 安全提醒：此腳本使用環境變數，不包含硬編碼的 API 密鑰');
}

runTests().catch(console.error);