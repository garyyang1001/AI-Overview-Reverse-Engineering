/**
 * Code Fix Agent
 * Specializes in applying fixes to TypeScript code based on error analysis
 */

import { BaseAgent, AgentMessage, AgentCapability } from './BaseAgent';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../utils/logger';

interface CodeFix {
  file: string;
  line: number;
  column: number;
  originalCode: string;
  fixedCode: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

interface FixResult {
  fixes: CodeFix[];
  filesModified: string[];
  success: boolean;
  backupLocation?: string;
}

export class CodeFixAgent extends BaseAgent {
  private backupDir: string;

  constructor() {
    const capabilities: AgentCapability[] = [
      {
        name: 'applyFixes',
        description: 'Apply fixes to TypeScript code based on error analysis',
        inputSchema: {
          type: 'object',
          properties: {
            errorAnalysis: { type: 'object' },
            projectPath: { type: 'string' },
            dryRun: { type: 'boolean' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            result: { type: 'object' }
          }
        }
      }
    ];

    super({
      name: 'CodeFixAgent',
      description: 'Applies automated fixes to TypeScript code',
      capabilities,
      priority: 8
    });

    this.backupDir = '/tmp/typescript-fixes-backup';
  }

  protected async handleMessage(message: AgentMessage): Promise<any> {
    const { type, payload } = message;

    switch (type) {
      case 'request':
        if (payload.action === 'applyFixes') {
          return await this.applyFixes(
            payload.errorAnalysis,
            payload.projectPath,
            payload.dryRun || false
          );
        }
        break;
    }

    throw new Error(`Unknown message type or action: ${type}`);
  }

  private async applyFixes(
    errorAnalysis: any,
    projectPath: string,
    dryRun: boolean
  ): Promise<FixResult> {
    logger.info(`${dryRun ? '[DRY RUN] ' : ''}Applying fixes...`);
    
    const fixes: CodeFix[] = [];
    const filesModified = new Set<string>();
    let backupLocation: string | undefined;

    // Create backup if not dry run
    if (!dryRun) {
      backupLocation = await this.createBackup(errorAnalysis.errors, projectPath);
    }

    // Generate fixes for each error
    for (const error of errorAnalysis.errors) {
      const fix = await this.generateFix(error, projectPath);
      if (fix) {
        fixes.push(fix);
        filesModified.add(fix.file);
      }
    }

    // Apply fixes if not dry run
    if (!dryRun) {
      await this.applyFixesToFiles(fixes);
    }

    return {
      fixes,
      filesModified: Array.from(filesModified),
      success: true,
      backupLocation
    };
  }

  private async generateFix(error: any, projectPath: string): Promise<CodeFix | null> {
    const filePath = path.join(projectPath, error.file);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Get context around the error
      const errorLine = lines[error.line - 1] || '';
      
      // Handle specific error types
      switch (error.code) {
        case 'TS1005': // Syntax error - expected token
          return this.fixSyntaxError(error, errorLine, filePath);
        
        case 'TS2304': // Cannot find name
          return this.fixMissingReference(error, errorLine, filePath);
        
        case 'TS2307': // Cannot find module
          return this.fixMissingModule(error, errorLine, filePath);
        
        case 'TS2345': // Argument type mismatch
          return this.fixTypeMismatch(error, errorLine, filePath);
        
        case 'TS2451': // Cannot redeclare variable
          return this.fixRedeclaration(error, lines, error.line - 1, filePath);
        
        default:
          logger.debug(`No fix available for error code ${error.code}`);
          return null;
      }
    } catch (err) {
      logger.error(`Error reading file ${filePath}:`, err);
      return null;
    }
  }

  private fixSyntaxError(error: any, line: string, file: string): CodeFix | null {
    // Handle template literal issues
    if (error.message.includes('expected') && line.includes("'''")) {
      return {
        file,
        line: error.line,
        column: error.column,
        originalCode: line,
        fixedCode: line.replace(/'''/g, '\\`\\`\\`'),
        description: 'Fix unescaped backticks in template literal',
        confidence: 'high'
      };
    }

    // Handle missing commas
    if (error.message.includes("',' expected")) {
      const beforeColumn = line.substring(0, error.column - 1);
      const afterColumn = line.substring(error.column - 1);
      return {
        file,
        line: error.line,
        column: error.column,
        originalCode: line,
        fixedCode: beforeColumn + ',' + afterColumn,
        description: 'Add missing comma',
        confidence: 'medium'
      };
    }

    return null;
  }

  private fixMissingReference(error: any, _line: string, file: string): CodeFix | null {
    const missingName = error.message.match(/Cannot find name '(.+)'/)?.[1];
    
    if (!missingName) return null;

    // Common missing imports
    const commonImports: Record<string, string> = {
      'promptService': "import { promptService } from './promptService';",
      'AnalysisReport': "import { AnalysisReport } from '../types';",
      'AnalysisReportWithMetadata': "import { AnalysisReportWithMetadata } from '../types';"
    };

    if (commonImports[missingName]) {
      return {
        file,
        line: 1, // Add import at top
        column: 0,
        originalCode: '',
        fixedCode: commonImports[missingName] + '\n',
        description: `Add missing import for ${missingName}`,
        confidence: 'high'
      };
    }

    return null;
  }

  private fixMissingModule(error: any, line: string, file: string): CodeFix | null {
    const moduleName = error.message.match(/Cannot find module '(.+)'/)?.[1];
    
    if (!moduleName) return null;

    // Check if it's a deleted file
    if (moduleName.includes('contentRefinementService')) {
      return {
        file,
        line: error.line,
        column: error.column,
        originalCode: line,
        fixedCode: '// ' + line + ' // Service removed',
        description: 'Comment out import for removed service',
        confidence: 'high'
      };
    }

    return null;
  }

  private fixTypeMismatch(error: any, line: string, file: string): CodeFix | null {
    // Handle specific type mismatches
    if (error.message.includes("'content_refinement'") && error.message.includes("'main_analysis'")) {
      return {
        file,
        line: error.line,
        column: error.column,
        originalCode: line,
        fixedCode: line.replace('content_refinement', 'main_analysis'),
        description: 'Fix prompt category type',
        confidence: 'high'
      };
    }

    return null;
  }

  private fixRedeclaration(error: any, lines: string[], lineIndex: number, file: string): CodeFix | null {
    const variableName = error.message.match(/Cannot redeclare block-scoped variable '(.+)'/)?.[1];
    
    if (!variableName) return null;

    // Comment out duplicate declaration
    return {
      file,
      line: error.line,
      column: error.column,
      originalCode: lines[lineIndex],
      fixedCode: '// ' + lines[lineIndex] + ' // Duplicate declaration',
      description: `Comment out duplicate declaration of ${variableName}`,
      confidence: 'medium'
    };
  }

  private async createBackup(errors: any[], projectPath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);
    
    await fs.mkdir(backupPath, { recursive: true });
    
    // Backup files that will be modified
    const filesToBackup = new Set(errors.map((e: any) => e.file));
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(projectPath, file);
      const destPath = path.join(backupPath, file);
      
      try {
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(sourcePath, destPath);
      } catch (err) {
        logger.error(`Error backing up ${file}:`, err);
      }
    }
    
    logger.info(`Backup created at: ${backupPath}`);
    return backupPath;
  }

  private async applyFixesToFiles(fixes: CodeFix[]): Promise<void> {
    // Group fixes by file
    const fixesByFile = fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) acc[fix.file] = [];
      acc[fix.file].push(fix);
      return acc;
    }, {} as Record<string, CodeFix[]>);

    // Apply fixes to each file
    for (const [file, fileFixes] of Object.entries(fixesByFile)) {
      try {
        let content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');
        
        // Sort fixes by line number (descending) to avoid offset issues
        fileFixes.sort((a, b) => b.line - a.line);
        
        for (const fix of fileFixes) {
          if (fix.line === 1 && fix.column === 0 && fix.originalCode === '') {
            // Add import at top
            lines.unshift(fix.fixedCode.trim());
          } else {
            lines[fix.line - 1] = fix.fixedCode;
          }
        }
        
        await fs.writeFile(file, lines.join('\n'), 'utf-8');
        logger.info(`Applied ${fileFixes.length} fixes to ${file}`);
      } catch (err) {
        logger.error(`Error applying fixes to ${file}:`, err);
      }
    }
  }
}