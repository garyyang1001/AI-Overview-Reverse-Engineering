/**
 * Code Review Agent
 * Specializes in reviewing code changes and ensuring quality
 */

import { BaseAgent, AgentMessage, AgentCapability } from './BaseAgent';
import logger from '../utils/logger';

interface ReviewResult {
  approved: boolean;
  issues: ReviewIssue[];
  suggestions: string[];
  score: number; // 0-100
}

interface ReviewIssue {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line?: number;
  message: string;
  category: 'syntax' | 'logic' | 'style' | 'security' | 'performance';
}

export class CodeReviewAgent extends BaseAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      {
        name: 'reviewChanges',
        description: 'Review code changes for quality and correctness',
        inputSchema: {
          type: 'object',
          properties: {
            fixes: { type: 'array' },
            projectPath: { type: 'string' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            review: { type: 'object' }
          }
        }
      }
    ];

    super({
      name: 'CodeReviewAgent',
      description: 'Reviews code changes for quality assurance',
      capabilities,
      priority: 7
    });
  }

  protected async handleMessage(message: AgentMessage): Promise<any> {
    const { type, payload } = message;

    switch (type) {
      case 'request':
        if (payload.action === 'reviewChanges') {
          return await this.reviewChanges(payload.fixes, payload.projectPath);
        }
        break;
    }

    throw new Error(`Unknown message type or action: ${type}`);
  }

  private async reviewChanges(fixes: any[], projectPath: string): Promise<ReviewResult> {
    logger.info('Reviewing code changes...');
    
    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];
    
    // Review each fix
    for (const fix of fixes) {
      const fixIssues = await this.reviewFix(fix, projectPath);
      issues.push(...fixIssues);
    }

    // Generate suggestions based on issues
    suggestions.push(...this.generateSuggestions(issues));

    // Calculate quality score
    const score = this.calculateScore(issues);
    const approved = score >= 70 && !issues.some(i => i.severity === 'error');

    return {
      approved,
      issues,
      suggestions,
      score
    };
  }

  private async reviewFix(fix: any, _projectPath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Check fix confidence
    if (fix.confidence === 'low') {
      issues.push({
        severity: 'warning',
        file: fix.file,
        line: fix.line,
        message: 'Low confidence fix - manual review recommended',
        category: 'logic'
      });
    }

    // Validate the fix
    if (fix.fixedCode) {
      // Check for potential issues in the fixed code
      const validationIssues = this.validateCode(fix.fixedCode, fix.file, fix.line);
      issues.push(...validationIssues);
    }

    // Check if fix might introduce new issues
    if (fix.description.includes('Comment out')) {
      issues.push({
        severity: 'info',
        file: fix.file,
        line: fix.line,
        message: 'Code commented out - verify this doesn\'t break functionality',
        category: 'logic'
      });
    }

    return issues;
  }

  private validateCode(code: string, file: string, line: number): ReviewIssue[] {
    const issues: ReviewIssue[] = [];

    // Check for common issues
    
    // 1. Unescaped strings in templates
    if (code.includes('`') && !code.includes('\\`')) {
      const unescapedBackticks = (code.match(/(?<!\\)`/g) || []).length;
      if (unescapedBackticks % 2 !== 0) {
        issues.push({
          severity: 'error',
          file,
          line,
          message: 'Potentially unmatched template literal backticks',
          category: 'syntax'
        });
      }
    }

    // 2. TODO or FIXME comments
    if (code.match(/\/\/\s*(TODO|FIXME)/i)) {
      issues.push({
        severity: 'info',
        file,
        line,
        message: 'Contains TODO/FIXME comment',
        category: 'style'
      });
    }

    // 3. Console.log statements
    if (code.includes('console.log')) {
      issues.push({
        severity: 'warning',
        file,
        line,
        message: 'Contains console.log statement',
        category: 'style'
      });
    }

    // 4. Hardcoded values that might need configuration
    if (code.match(/["']\d+\.\d+\.\d+\.\d+["']/) || code.match(/localhost:\d+/)) {
      issues.push({
        severity: 'warning',
        file,
        line,
        message: 'Contains hardcoded IP address or localhost URL',
        category: 'security'
      });
    }

    // 5. Any type usage
    if (code.includes(': any') || code.includes('<any>')) {
      issues.push({
        severity: 'warning',
        file,
        line,
        message: 'Uses "any" type - consider using specific types',
        category: 'style'
      });
    }

    return issues;
  }

  private generateSuggestions(issues: ReviewIssue[]): string[] {
    const suggestions: string[] = [];
    
    // Count issues by category
    const issuesByCategory = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate category-specific suggestions
    if (issuesByCategory.syntax > 0) {
      suggestions.push('Consider using a TypeScript-aware linter to catch syntax issues early');
    }

    if (issuesByCategory.style > 0) {
      suggestions.push('Apply consistent code formatting with Prettier or similar tool');
    }

    if (issuesByCategory.security > 0) {
      suggestions.push('Review security-related issues and use environment variables for sensitive data');
    }

    if (issuesByCategory.logic > 0) {
      suggestions.push('Manual testing recommended for logic-related changes');
    }

    // General suggestions
    if (issues.filter(i => i.severity === 'error').length > 0) {
      suggestions.push('Fix all error-level issues before proceeding');
    }

    if (issues.filter(i => i.severity === 'warning').length > 3) {
      suggestions.push('Consider addressing warnings to improve code quality');
    }

    return suggestions;
  }

  private calculateScore(issues: ReviewIssue[]): number {
    let score = 100;
    
    // Deduct points based on issue severity
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }
}