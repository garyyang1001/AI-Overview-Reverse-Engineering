/**
 * Error Analysis Agent
 * Specializes in analyzing TypeScript compilation errors and identifying root causes
 */

import { BaseAgent, AgentMessage, AgentCapability } from './BaseAgent';
import * as path from 'path';
import logger from '../utils/logger';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  category: 'syntax' | 'type' | 'reference' | 'declaration' | 'other';
}

interface ErrorAnalysis {
  errors: TypeScriptError[];
  summary: {
    totalErrors: number;
    byCategory: Record<string, number>;
    byFile: Record<string, number>;
  };
  recommendations: string[];
}

export class ErrorAnalysisAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      {
        name: 'analyzeErrors',
        description: 'Analyze TypeScript compilation errors',
        inputSchema: {
          type: 'object',
          properties: {
            errorLog: { type: 'string' },
            projectPath: { type: 'string' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            analysis: { type: 'object' }
          }
        }
      }
    ];

    super({
      name: 'ErrorAnalysisAgent',
      description: 'Analyzes TypeScript compilation errors and provides insights',
      capabilities,
      priority: 10
    });
  }

  protected async handleMessage(message: AgentMessage): Promise<any> {
    const { type, payload } = message;

    switch (type) {
      case 'request':
        if (payload.action === 'analyzeErrors') {
          return await this.analyzeErrors(payload.errorLog, payload.projectPath);
        }
        break;
    }

    throw new Error(`Unknown message type or action: ${type}`);
  }

  private async analyzeErrors(errorLog: string, projectPath: string): Promise<ErrorAnalysis> {
    logger.info('Analyzing TypeScript errors...');
    
    const errors = this.parseTypeScriptErrors(errorLog);
    const analysis: ErrorAnalysis = {
      errors,
      summary: this.summarizeErrors(errors),
      recommendations: await this.generateRecommendations(errors, projectPath)
    };

    logger.info(`Analyzed ${errors.length} errors`);
    return analysis;
  }

  private parseTypeScriptErrors(errorLog: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = errorLog.split('\n');
    
    const errorPattern = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
    
    for (const line of lines) {
      const match = line.match(errorPattern);
      if (match) {
        const [, file, lineNum, colNum, code, message] = match;
        errors.push({
          file,
          line: parseInt(lineNum),
          column: parseInt(colNum),
          code,
          message,
          category: this.categorizeError(code, message)
        });
      }
    }

    return errors;
  }

  private categorizeError(code: string, message: string): TypeScriptError['category'] {
    const codeNum = parseInt(code.substring(2));
    
    // TypeScript error code ranges (approximate)
    if (codeNum >= 1000 && codeNum < 2000) {
      return 'syntax';
    } else if (codeNum >= 2300 && codeNum < 2800) {
      return 'type';
    } else if (codeNum >= 2300 && codeNum < 2400) {
      return 'reference';
    } else if (codeNum >= 1100 && codeNum < 1200) {
      return 'declaration';
    }
    
    // Additional heuristics based on message
    if (message.includes('Cannot find')) {
      return 'reference';
    } else if (message.includes('Type') || message.includes('assignable')) {
      return 'type';
    } else if (message.includes('expected') || message.includes('token')) {
      return 'syntax';
    }
    
    return 'other';
  }

  private summarizeErrors(errors: TypeScriptError[]): ErrorAnalysis['summary'] {
    const byCategory: Record<string, number> = {};
    const byFile: Record<string, number> = {};

    for (const error of errors) {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      byFile[error.file] = (byFile[error.file] || 0) + 1;
    }

    return {
      totalErrors: errors.length,
      byCategory,
      byFile
    };
  }

  private async generateRecommendations(errors: TypeScriptError[], _projectPath: string): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Group errors by type for recommendations
    const syntaxErrors = errors.filter(e => e.category === 'syntax');
    const typeErrors = errors.filter(e => e.category === 'type');
    const referenceErrors = errors.filter(e => e.category === 'reference');

    if (syntaxErrors.length > 0) {
      recommendations.push('Fix syntax errors first as they prevent proper parsing');
      
      // Check for common syntax issues
      const templateLiteralErrors = syntaxErrors.filter(e => 
        e.message.includes('expected') && e.code === 'TS1005'
      );
      if (templateLiteralErrors.length > 0) {
        recommendations.push('Check for unescaped backticks in template strings');
      }
    }

    if (referenceErrors.length > 0) {
      recommendations.push('Resolve missing imports and undefined references');
      
      // Group by missing items
      const missingItems = new Set<string>();
      referenceErrors.forEach(e => {
        const match = e.message.match(/Cannot find name '(.+)'/);
        if (match) {
          missingItems.add(match[1]);
        }
      });
      
      if (missingItems.size > 0) {
        recommendations.push(`Missing references: ${Array.from(missingItems).join(', ')}`);
      }
    }

    if (typeErrors.length > 0) {
      recommendations.push('Fix type mismatches and incompatible assignments');
    }

    // File-specific recommendations
    const criticalFiles = Object.entries(errors.reduce((acc, e) => {
      acc[e.file] = (acc[e.file] || 0) + 1;
      return acc;
    }, {} as Record<string, number>))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (criticalFiles.length > 0) {
      recommendations.push(`Focus on files with most errors: ${criticalFiles.map(([f]) => path.basename(f)).join(', ')}`);
    }

    return recommendations;
  }
}