const { chromium } = require('playwright');

async function testBrowserNetworking() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🔍 Testing browser networking configurations...');
    
    // Test different browser launch configurations
    const configs = [
      {
        name: 'Standard Config',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      },
      {
        name: 'Network Debugging Config',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--ignore-certificate-errors',
          '--ignore-ssl-errors',
          '--allow-running-insecure-content'
        ]
      },
      {
        name: 'Minimal Config',
        args: ['--no-sandbox']
      }
    ];
    
    for (const config of configs) {
      console.log(`\n🧪 Testing ${config.name}...`);
      
      try {
        browser = await chromium.launch({
          headless: true,
          args: config.args,
          timeout: 10000
        });
        
        console.log('✅ Browser launched');
        
        page = await browser.newPage();
        
        // Test with a very simple URL first
        console.log('🔍 Testing simple HTTP navigation...');
        
        // Set a shorter timeout for quicker testing
        page.setDefaultTimeout(8000);
        
        const response = await page.goto('http://httpbin.org/ip', { 
          waitUntil: 'domcontentloaded',
          timeout: 8000 
        });
        
        console.log(`✅ HTTP navigation successful, status: ${response.status()}`);
        
        // Test HTTPS
        console.log('🔍 Testing HTTPS navigation...');
        const response2 = await page.goto('https://httpbin.org/ip', { 
          waitUntil: 'domcontentloaded',
          timeout: 8000 
        });
        
        console.log(`✅ HTTPS navigation successful, status: ${response2.status()}`);
        
        console.log(`🎉 ${config.name} WORKS!`);
        break; // Stop testing once we find a working configuration
        
      } catch (error) {
        console.log(`❌ ${config.name} failed: ${error.message}`);
        
        if (error.name === 'TimeoutError') {
          console.log('   → Timeout issue, trying next config...');
        } else if (error.message.includes('net::ERR_')) {
          console.log('   → Network error, trying next config...');
        } else {
          console.log('   → Other error:', error.name);
        }
      } finally {
        if (page) {
          await page.close().catch(() => {});
          page = null;
        }
        if (browser) {
          await browser.close().catch(() => {});
          browser = null;
        }
      }
    }
    
    // If all configs failed, provide diagnostic information
    console.log('\n🔧 System Diagnostics:');
    console.log('Node.js version:', process.version);
    console.log('Platform:', process.platform);
    console.log('Architecture:', process.arch);
    
    // Check if we can reach the internet at all
    const https = require('https');
    console.log('🌐 Testing Node.js HTTPS connectivity...');
    
    const nodeHttpsTest = new Promise((resolve, reject) => {
      const req = https.get('https://httpbin.org/ip', { timeout: 5000 }, (res) => {
        console.log('✅ Node.js HTTPS works, status:', res.statusCode);
        resolve(true);
      });
      
      req.on('error', (error) => {
        console.log('❌ Node.js HTTPS failed:', error.message);
        reject(error);
      });
      
      req.on('timeout', () => {
        console.log('❌ Node.js HTTPS timeout');
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
    
    await nodeHttpsTest.catch(() => {});
    
  } catch (error) {
    console.error('❌ General test failure:', error);
  }
}

testBrowserNetworking();