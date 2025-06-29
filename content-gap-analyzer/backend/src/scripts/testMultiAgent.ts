/**
 * Test script for the multi-agent workforce
 */

import { AgentOrchestrator } from '../agents';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testMultiAgentWorkforce() {
  console.log('🤖 Testing Multi-Agent Workforce');
  console.log('================================\n');

  try {
    // Read the error log
    const errorLogPath = path.join(__dirname, '../../../Errorlog.md');
    const errorLog = await fs.readFile(errorLogPath, 'utf-8');
    
    // Get project path
    const projectPath = path.join(__dirname, '../..');
    
    // Create orchestrator
    const orchestrator = new AgentOrchestrator();
    
    // Test 1: Dry run to see what fixes would be applied
    console.log('Test 1: Running dry run analysis...\n');
    
    const dryRunResult = await orchestrator.runWorkflow(errorLog, projectPath, {
      dryRun: true,
      skipTests: true
    });
    
    console.log('Dry Run Results:');
    console.log('================');
    console.log(`Total errors found: ${dryRunResult.errorAnalysis?.summary.totalErrors || 0}`);
    console.log(`Fixes proposed: ${dryRunResult.fixes?.fixes.length || 0}`);
    console.log(`Review score: ${dryRunResult.review?.score || 0}/100`);
    console.log(`Would be approved: ${dryRunResult.review?.approved ? 'Yes' : 'No'}`);
    
    if (dryRunResult.errorAnalysis?.recommendations) {
      console.log('\nRecommendations:');
      dryRunResult.errorAnalysis.recommendations.forEach((rec: string) => {
        console.log(`  • ${rec}`);
      });
    }
    
    if (dryRunResult.fixes?.fixes) {
      console.log('\nProposed fixes:');
      dryRunResult.fixes.fixes.slice(0, 5).forEach((fix: any) => {
        console.log(`  • ${fix.file}:${fix.line} - ${fix.description}`);
      });
      if (dryRunResult.fixes.fixes.length > 5) {
        console.log(`  ... and ${dryRunResult.fixes.fixes.length - 5} more`);
      }
    }
    
    // Test 2: Agent communication
    console.log('\n\nTest 2: Testing agent communication...\n');
    
    const status = orchestrator.getStatus();
    console.log('Active agents:');
    status.agents.forEach(agent => {
      console.log(`  • ${agent.name}: ${agent.active ? '✅ Active' : '❌ Inactive'}`);
    });
    
    // Cleanup
    await orchestrator.shutdown();
    
    console.log('\n✅ Multi-agent workforce test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testMultiAgentWorkforce().catch(console.error);