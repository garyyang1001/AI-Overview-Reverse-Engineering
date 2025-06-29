#!/usr/bin/env node

/**
 * CLI tool to fix TypeScript errors using the multi-agent workforce
 */

import { AgentOrchestrator } from '../agents';
import * as fs from 'fs/promises';
import * as path from 'path';
import { program } from 'commander';
import chalk from 'chalk';

async function main() {
  program
    .name('fix-errors')
    .description('Fix TypeScript compilation errors using multi-agent workforce')
    .option('-e, --error-log <file>', 'Path to error log file', '../Errorlog.md')
    .option('-p, --project <path>', 'Project path', process.cwd())
    .option('-d, --dry-run', 'Perform dry run without applying fixes')
    .option('-s, --skip-tests', 'Skip running tests after fixes')
    .option('-a, --auto-approve', 'Auto-approve fixes without review')
    .option('-v, --verbose', 'Enable verbose logging')
    .parse(process.argv);

  const options = program.opts();

  console.log(chalk.blue('🤖 Multi-Agent TypeScript Error Fixer'));
  console.log(chalk.gray('================================\n'));

  try {
    // Read error log
    let errorLog: string;
    if (options.errorLog === '-') {
      // Read from stdin
      errorLog = await readStdin();
    } else {
      const errorLogPath = path.resolve(options.errorLog);
      errorLog = await fs.readFile(errorLogPath, 'utf-8');
    }

    // Create orchestrator
    const orchestrator = new AgentOrchestrator();

    // Run workflow
    console.log(chalk.yellow('🔍 Starting error analysis...'));
    
    const result = await orchestrator.runWorkflow(errorLog, options.project, {
      dryRun: options.dryRun,
      skipTests: options.skipTests,
      autoApprove: options.autoApprove
    });

    // Display results
    displayResults(result, options.verbose);

    // Cleanup
    await orchestrator.shutdown();

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);

  } catch (error: any) {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

function displayResults(result: any, verbose: boolean) {
  console.log('\n' + chalk.blue('📊 Workflow Results'));
  console.log(chalk.gray('=================='));

  // Error Analysis
  if (result.errorAnalysis) {
    console.log('\n' + chalk.yellow('📋 Error Analysis:'));
    console.log(`  Total errors: ${result.errorAnalysis.summary.totalErrors}`);
    console.log('  By category:');
    for (const [category, count] of Object.entries(result.errorAnalysis.summary.byCategory)) {
      console.log(`    ${category}: ${count}`);
    }
    
    if (verbose && result.errorAnalysis.recommendations.length > 0) {
      console.log('  Recommendations:');
      result.errorAnalysis.recommendations.forEach((rec: string) => {
        console.log(`    • ${rec}`);
      });
    }
  }

  // Fixes Applied
  if (result.fixes) {
    console.log('\n' + chalk.green('🔧 Fixes:'));
    console.log(`  Total fixes: ${result.fixes.fixes.length}`);
    console.log(`  Files modified: ${result.fixes.filesModified.length}`);
    
    if (verbose) {
      console.log('  Details:');
      result.fixes.fixes.forEach((fix: any) => {
        console.log(`    • ${fix.file}:${fix.line} - ${fix.description}`);
      });
    }
    
    if (result.fixes.backupLocation) {
      console.log(`  Backup saved at: ${result.fixes.backupLocation}`);
    }
  }

  // Code Review
  if (result.review) {
    console.log('\n' + chalk.cyan('👀 Code Review:'));
    console.log(`  Score: ${result.review.score}/100`);
    console.log(`  Approved: ${result.review.approved ? '✅ Yes' : '❌ No'}`);
    console.log(`  Issues: ${result.review.issues.length}`);
    
    if (verbose && result.review.issues.length > 0) {
      console.log('  Issues found:');
      result.review.issues.forEach((issue: any) => {
        const icon = issue.severity === 'error' ? '❌' : 
                    issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`    ${icon} ${issue.message}`);
      });
    }
    
    if (result.review.suggestions.length > 0) {
      console.log('  Suggestions:');
      result.review.suggestions.forEach((suggestion: string) => {
        console.log(`    • ${suggestion}`);
      });
    }
  }

  // Test Results
  if (result.testResults) {
    console.log('\n' + chalk.magenta('🧪 Test Results:'));
    console.log(`  Compilation: ${result.testResults.compilationErrors.length === 0 ? '✅ Success' : '❌ Failed'}`);
    
    if (result.testResults.compilationErrors.length > 0) {
      console.log(`  Compilation errors: ${result.testResults.compilationErrors.length}`);
      if (verbose) {
        result.testResults.compilationErrors.forEach((error: string) => {
          console.log(`    • ${error}`);
        });
      }
    }
    
    if (result.testResults.testResults) {
      const tests = result.testResults.testResults;
      console.log(`  Unit tests: ${tests.passed} passed, ${tests.failed} failed`);
    }
    
    if (result.testResults.lintResults) {
      const lint = result.testResults.lintResults;
      console.log(`  Linting: ${lint.errors} errors, ${lint.warnings} warnings`);
    }
  }

  // Workflow Summary
  console.log('\n' + chalk.blue('📈 Summary:'));
  console.log(`  Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
  
  if (verbose) {
    console.log('  Workflow steps:');
    result.steps.forEach((step: any) => {
      const icon = step.status === 'completed' ? '✅' : 
                  step.status === 'failed' ? '❌' : '⏳';
      const duration = step.endTime && step.startTime ? 
        `(${((step.endTime.getTime() - step.startTime.getTime()) / 1000).toFixed(2)}s)` : '';
      console.log(`    ${icon} ${step.agent}.${step.action} ${duration}`);
    });
  }
}

// Run the CLI
main().catch(console.error);