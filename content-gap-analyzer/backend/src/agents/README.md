# Multi-Agent TypeScript Error Fixing System

## Overview

This multi-agent workforce system automatically analyzes and fixes TypeScript compilation errors using specialized AI agents that work together to diagnose, fix, review, and test code changes.

## Architecture

### Agents

1. **ErrorAnalysisAgent**
   - Analyzes TypeScript compilation errors
   - Categorizes errors (syntax, type, reference, declaration)
   - Provides recommendations for fixing

2. **CodeFixAgent**
   - Generates fixes based on error analysis
   - Applies fixes to source files
   - Creates backups before modifications
   - Supports dry-run mode

3. **CodeReviewAgent**
   - Reviews proposed fixes for quality
   - Checks for potential issues
   - Provides quality score (0-100)
   - Makes approval decisions

4. **TestingAgent**
   - Runs TypeScript compilation
   - Executes unit tests
   - Performs linting
   - Validates fixes work correctly

### Agent Orchestrator

The `AgentOrchestrator` coordinates all agents in a workflow:
1. Error Analysis → 2. Code Fixing → 3. Code Review → 4. Testing

## Usage

### CLI Tool

```bash
# Fix errors with dry run
npm run fix-errors -- --dry-run

# Fix errors and apply changes
npm run fix-errors

# Fix errors with verbose output
npm run fix-errors -- --verbose

# Skip tests after fixing
npm run fix-errors -- --skip-tests

# Auto-approve fixes without manual review
npm run fix-errors -- --auto-approve

# Use custom error log file
npm run fix-errors -- --error-log path/to/errors.log
```

### Programmatic Usage

```typescript
import { AgentOrchestrator } from './agents';

const orchestrator = new AgentOrchestrator();

const result = await orchestrator.runWorkflow(errorLog, projectPath, {
  dryRun: false,
  skipTests: false,
  autoApprove: false
});

console.log('Success:', result.success);
console.log('Fixes applied:', result.fixes.fixes.length);
```

## Workflow Example

```
🤖 Multi-Agent TypeScript Error Fixer
================================

🔍 Starting error analysis...

📊 Workflow Results
==================

📋 Error Analysis:
  Total errors: 37
  By category:
    syntax: 25
    reference: 8
    type: 4
  Recommendations:
    • Fix syntax errors first as they prevent proper parsing
    • Check for unescaped backticks in template strings
    • Resolve missing imports and undefined references

🔧 Fixes:
  Total fixes: 15
  Files modified: 4
  Backup saved at: /tmp/typescript-fixes-backup/2024-01-01T12-00-00

👀 Code Review:
  Score: 85/100
  Approved: ✅ Yes
  Issues: 3
  Suggestions:
    • Apply consistent code formatting with Prettier

🧪 Test Results:
  Compilation: ✅ Success
  Unit tests: 42 passed, 0 failed
  Linting: 0 errors, 5 warnings

📈 Summary:
  Status: ✅ Success
  Duration: 12.45s
```

## Error Categories

- **Syntax Errors**: Missing tokens, unmatched brackets, invalid syntax
- **Type Errors**: Type mismatches, incompatible assignments
- **Reference Errors**: Missing imports, undefined variables
- **Declaration Errors**: Duplicate declarations, invalid declarations

## Safety Features

1. **Backup Creation**: All modified files are backed up before changes
2. **Dry Run Mode**: Preview changes without applying them
3. **Code Review**: All fixes are reviewed before approval
4. **Confidence Levels**: Fixes are marked as high/medium/low confidence
5. **Testing**: Automated testing ensures fixes don't break functionality

## Extending the System

To add a new agent:

1. Create a new class extending `BaseAgent`
2. Implement the `handleMessage` method
3. Define agent capabilities
4. Register the agent in `AgentOrchestrator`

Example:
```typescript
export class CustomAgent extends BaseAgent {
  constructor() {
    super({
      name: 'CustomAgent',
      description: 'Custom agent description',
      capabilities: [/* ... */],
      priority: 5
    });
  }

  protected async handleMessage(message: AgentMessage): Promise<any> {
    // Implementation
  }
}
```