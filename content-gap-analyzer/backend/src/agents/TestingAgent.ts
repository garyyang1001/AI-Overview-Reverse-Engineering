/**
 * Testing Agent
 * Specializes in running tests and validating fixes
 */

import { BaseAgent, AgentMessage, AgentCapability } from './BaseAgent';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import logger from '../utils/logger';

const execAsync = promisify(exec);

interface TestResult {
  success: boolean;
  compilationErrors: string[];
  testResults?: {
    passed: number;
    failed: number;
    skipped: number;
    errors: string[];
  };
  lintResults?: {
    errors: number;
    warnings: number;
    details: string[];
  };
  performance?: {
    compilationTime: number;
    testExecutionTime?: number;
  };
}

export class TestingAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      {
        name: 'runTests',
        description: 'Run compilation, tests, and linting',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: { type: 'string' },
            testsToRun: { 
              type: 'array',
              items: { type: 'string', enum: ['compile', 'unit', 'lint', 'all'] }
            }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            results: { type: 'object' }
          }
        }
      }
    ];

    super({
      name: 'TestingAgent',
      description: 'Runs tests and validates code changes',
      capabilities,
      priority: 6
    });
  }

  protected async handleMessage(message: AgentMessage): Promise<any> {
    const { type, payload } = message;

    switch (type) {
      case 'request':
        if (payload.action === 'runTests') {
          return await this.runTests(
            payload.projectPath,
            payload.testsToRun || ['compile']
          );
        }
        break;
    }

    throw new Error(`Unknown message type or action: ${type}`);
  }

  private async runTests(projectPath: string, testsToRun: string[]): Promise<TestResult> {
    logger.info(`Running tests: ${testsToRun.join(', ')}`);
    
    const result: TestResult = {
      success: true,
      compilationErrors: [],
      performance: {
        compilationTime: 0
      }
    };

    // Always run compilation first
    if (testsToRun.includes('compile') || testsToRun.includes('all')) {
      const compileResult = await this.runCompilation(projectPath);
      result.compilationErrors = compileResult.errors;
      result.performance!.compilationTime = compileResult.time;
      
      if (compileResult.errors.length > 0) {
        result.success = false;
        // Don't run other tests if compilation fails
        return result;
      }
    }

    // Run unit tests
    if (testsToRun.includes('unit') || testsToRun.includes('all')) {
      const testResult = await this.runUnitTests(projectPath);
      result.testResults = testResult.results;
      result.performance!.testExecutionTime = testResult.time;
      
      if (testResult.results.failed > 0) {
        result.success = false;
      }
    }

    // Run linting
    if (testsToRun.includes('lint') || testsToRun.includes('all')) {
      const lintResult = await this.runLinting(projectPath);
      result.lintResults = lintResult;
      
      if (lintResult.errors > 0) {
        result.success = false;
      }
    }

    return result;
  }

  private async runCompilation(projectPath: string): Promise<{ errors: string[]; time: number }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    try {
      logger.info('Running TypeScript compilation...');
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: path.join(projectPath, 'backend')
      });
      
      // Parse compilation output for errors
      if (stderr) {
        const errorLines = stderr.split('\n').filter(line => 
          line.includes('error TS') || line.includes('Error:')
        );
        errors.push(...errorLines);
      }
      
      // Also check stdout for TypeScript errors
      if (stdout) {
        const errorLines = stdout.split('\n').filter(line => 
          line.includes('error TS') || line.includes('Error:')
        );
        errors.push(...errorLines);
      }
      
    } catch (error: any) {
      // Compilation failed
      if (error.stdout) {
        const errorLines = error.stdout.split('\n').filter((line: string) => 
          line.includes('error TS') || line.includes('Error:')
        );
        errors.push(...errorLines);
      }
      if (error.stderr) {
        errors.push(error.stderr);
      }
    }
    
    const time = Date.now() - startTime;
    logger.info(`Compilation completed in ${time}ms with ${errors.length} errors`);
    
    return { errors, time };
  }

  private async runUnitTests(projectPath: string): Promise<{ results: any; time: number }> {
    const startTime = Date.now();
    const results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    try {
      logger.info('Running unit tests...');
      const { stdout } = await execAsync('npm test -- --json', {
        cwd: path.join(projectPath, 'backend')
      });
      
      // Parse Jest JSON output
      try {
        const testOutput = JSON.parse(stdout);
        results.passed = testOutput.numPassedTests || 0;
        results.failed = testOutput.numFailedTests || 0;
        results.skipped = testOutput.numPendingTests || 0;
        
        if (testOutput.testResults) {
          for (const suite of testOutput.testResults) {
            if (suite.status === 'failed') {
              results.errors.push(`Failed: ${suite.name}`);
            }
          }
        }
      } catch (parseError) {
        // Fallback to regex parsing if JSON fails
        const passMatch = stdout.match(/(\d+) passed/);
        const failMatch = stdout.match(/(\d+) failed/);
        
        if (passMatch) results.passed = parseInt(passMatch[1]);
        if (failMatch) results.failed = parseInt(failMatch[1]);
      }
      
    } catch (error: any) {
      // Tests failed
      results.errors.push(error.message || 'Test execution failed');
      results.failed = 1;
    }
    
    const time = Date.now() - startTime;
    logger.info(`Tests completed in ${time}ms: ${results.passed} passed, ${results.failed} failed`);
    
    return { results, time };
  }

  private async runLinting(projectPath: string): Promise<any> {
    const results = {
      errors: 0,
      warnings: 0,
      details: [] as string[]
    };
    
    try {
      logger.info('Running ESLint...');
      const { stdout } = await execAsync('npm run lint -- --format json', {
        cwd: path.join(projectPath, 'backend')
      });
      
      // Parse ESLint JSON output
      try {
        const lintOutput = JSON.parse(stdout);
        for (const file of lintOutput) {
          results.errors += file.errorCount || 0;
          results.warnings += file.warningCount || 0;
          
          for (const message of file.messages || []) {
            results.details.push(
              `${file.filePath}:${message.line}:${message.column} - ${message.message}`
            );
          }
        }
      } catch (parseError) {
        // Fallback to simple counting
        results.details.push('Linting completed with errors');
      }
      
    } catch (error: any) {
      // Linting failed
      if (error.stdout) {
        try {
          const lintOutput = JSON.parse(error.stdout);
          for (const file of lintOutput) {
            results.errors += file.errorCount || 0;
            results.warnings += file.warningCount || 0;
          }
        } catch (parseError) {
          results.errors = 1;
          results.details.push('Linting failed');
        }
      }
    }
    
    logger.info(`Linting found ${results.errors} errors and ${results.warnings} warnings`);
    
    return results;
  }
}