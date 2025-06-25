const axios = require('axios');

async function testSerpAPI() {
  console.log('🔍 測試 SerpAPI...');
  
  const SERPAPI_KEY = '85e545c9b1f4871237dc011e6fcd465d76c88bc4120c5e241afc253722d508af';
  
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

async function testGemini() {
  console.log('\n🤖 測試 Gemini API...');
  
  const GEMINI_API_KEY = 'AIzaSyABZjYnXjO9ofLLO_GRoI2r7oq2SxWFOwk';
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: '請簡單回答：你好嗎？'
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Gemini API 響應成功');
    console.log('響應長度:', JSON.stringify(response.data).length);
    
  } catch (error) {
    console.log('❌ Gemini API 調用失敗:', error.message);
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
  
  await testSerpAPI();
  await testGemini();
  await testContentScraping();
  
  console.log('\n✅ 測試完成');
}

runTests().catch(console.error);