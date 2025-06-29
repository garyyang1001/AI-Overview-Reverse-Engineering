/**
 * AIO-Auditor v5.1 測試執行腳本
 * 命令行工具用於執行黃金測試集
 */

import dotenv from 'dotenv';
import { testingService } from '../services/testingService';
import { goldenTestSet } from '../tests/goldenTestSet';
import logger from '../utils/logger';

// 載入環境變數
dotenv.config();

interface CLIOptions {
  category?: 'main_analysis';
  testId?: string;
  full?: boolean;
  report?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};
  
  // 解析命令行參數
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--category':
        options.category = args[++i] as 'main_analysis';
        break;
      case '--test-id':
        options.testId = args[++i];
        break;
      case '--full':
        options.full = true;
        break;
      case '--report':
        options.report = true;
        break;
      case '--help':
        printUsage();
        process.exit(0);
        break;
    }
  }
  
  try {
    if (options.testId) {
      // 執行單個測試
      await runSingleTest(options.testId);
    } else if (options.category) {
      // 執行特定類別測試
      await runCategoryTests(options.category, options.report);
    } else if (options.full) {
      // 執行完整測試套件
      await runFullTestSuite(options.report);
    } else {
      // 顯示測試集信息
      showTestSetInfo();
    }
  } catch (error) {
    logger.error('Test execution failed:', error);
    process.exit(1);
  }
}

async function runSingleTest(testId: string) {
  console.log(`\n🧪 執行單個測試: ${testId}`);
  console.log('=' .repeat(50));
  
  const testCase = goldenTestSet.getTestCaseById(testId);
  if (!testCase) {
    console.error(`❌ 測試案例 ${testId} 不存在`);
    process.exit(1);
  }
  
  const result = await testingService.runSingleTest(testCase);
  
  console.log(`\n📊 測試結果:`);
  console.log(`   名稱: ${result.testName}`);
  console.log(`   類別: ${result.category}`);
  console.log(`   狀態: ${result.success ? '✅ 通過' : '❌ 失敗'}`);
  console.log(`   分數: ${(result.score * 100).toFixed(1)}%`);
  console.log(`   執行時間: ${result.metrics.executionTime}ms`);
  
  if (result.errors.length > 0) {
    console.log(`\n❌ 錯誤:`);
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  警告:`);
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  console.log(`\n📈 品質指標:`);
  console.log(`   必需元素: ${result.metrics.requiredElementsFound}`);
  console.log(`   禁止元素: ${result.metrics.forbiddenElementsFound}`);
  console.log(`   輸出長度: ${result.metrics.outputLength} 字符`);
}

async function runCategoryTests(category: 'main_analysis', generateReport: boolean = false) {
  console.log(`\n🧪 執行 ${category} 測試`);
  console.log('=' .repeat(50));
  
  const results = await testingService.runCategoryTests(category);
  
  const passed = results.filter(r => r.success).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  console.log(`\n📊 測試摘要:`);
  console.log(`   總測試數: ${results.length}`);
  console.log(`   通過測試: ${passed}`);
  console.log(`   失敗測試: ${results.length - passed}`);
  console.log(`   通過率: ${(passed / results.length * 100).toFixed(1)}%`);
  console.log(`   平均分數: ${(avgScore * 100).toFixed(1)}%`);
  
  console.log(`\n📝 詳細結果:`);
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const score = (result.score * 100).toFixed(1);
    console.log(`   ${status} ${result.testName} (${score}%)`);
  });
  
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log(`\n❌ 失敗測試詳情:`);
    failedTests.forEach(test => {
      console.log(`\n   ${test.testName}:`);
      test.errors.forEach(error => console.log(`     錯誤: ${error}`));
      test.warnings.forEach(warning => console.log(`     警告: ${warning}`));
    });
  }
  
  if (generateReport) {
    console.log(`\n📄 生成詳細報告...`);
    // 這裡可以生成並保存報告文件
  }
}

async function runFullTestSuite(generateReport: boolean = false) {
  console.log(`\n🧪 執行完整測試套件`);
  console.log('=' .repeat(50));
  
  const testSuite = await testingService.runFullTestSuite();
  
  console.log(`\n📊 測試套件摘要:`);
  console.log(`   套件 ID: ${testSuite.suiteId}`);
  console.log(`   總測試數: ${testSuite.totalTests}`);
  console.log(`   通過測試: ${testSuite.passedTests}`);
  console.log(`   失敗測試: ${testSuite.failedTests}`);
  console.log(`   通過率: ${(testSuite.passedTests / testSuite.totalTests * 100).toFixed(1)}%`);
  console.log(`   平均分數: ${(testSuite.averageScore * 100).toFixed(1)}%`);
  console.log(`   執行時間: ${(testSuite.duration / 1000).toFixed(1)} 秒`);
  
  console.log(`\n📈 分類結果:`);
  Object.entries(testSuite.summary.byCategory).forEach(([category, stats]) => {
    const passRate = (stats.passed / (stats.passed + stats.failed) * 100).toFixed(1);
    console.log(`   ${category}: ${passRate}% 通過率 (平均分數: ${(stats.avgScore * 100).toFixed(1)}%)`);
  });
  
  console.log(`\n📊 難度分析:`);
  Object.entries(testSuite.summary.byDifficulty).forEach(([difficulty, stats]) => {
    if (stats.passed + stats.failed > 0) {
      const passRate = (stats.passed / (stats.passed + stats.failed) * 100).toFixed(1);
      console.log(`   ${difficulty}: ${passRate}% 通過率 (平均分數: ${(stats.avgScore * 100).toFixed(1)}%)`);
    }
  });
  
  if (generateReport) {
    const report = testingService.generateTestReport(testSuite);
    console.log(`\n📄 詳細報告:`);
    console.log(report);
  }
}

function showTestSetInfo() {
  console.log(`\n📚 黃金測試集信息`);
  console.log('=' .repeat(50));
  
  const stats = goldenTestSet.getStatistics();
  
  console.log(`\n📊 統計信息:`);
  console.log(`   總測試數: ${stats.total}`);
  console.log(`   按類別分布:`);
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`     ${category}: ${count}`);
  });
  console.log(`   按難度分布:`);
  Object.entries(stats.byDifficulty).forEach(([difficulty, count]) => {
    console.log(`     ${difficulty}: ${count}`);
  });
  console.log(`   按行業分布:`);
  Object.entries(stats.byIndustry).forEach(([industry, count]) => {
    console.log(`     ${industry}: ${count}`);
  });
  
  console.log(`\n📝 可用測試案例:`);
  const allTestCases = goldenTestSet.getAllTestCases();
  allTestCases.forEach(testCase => {
    console.log(`   ${testCase.id}: ${testCase.name} (${testCase.metadata.difficulty})`);
  });
}

function printUsage() {
  console.log(`
AIO-Auditor v5.1 測試執行工具

用法:
  npm run test:golden [選項]

選項:
  --full              執行完整測試套件
  --category <type>   執行特定類別測試 (main_analysis)
  --test-id <id>      執行單個測試案例
  --report            生成詳細報告
  --help              顯示此幫助信息

例子:
  npm run test:golden --full --report
  npm run test:golden --category main_analysis
  npm run test:golden --test-id cr_001_ecommerce_seo
  npm run test:golden
`);
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}