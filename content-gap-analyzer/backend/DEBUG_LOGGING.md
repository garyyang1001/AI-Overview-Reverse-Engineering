# Debug Logging Guide

This guide explains the comprehensive debug logging system implemented throughout the content gap analyzer to help diagnose issues, especially "內容未提供" problems.

## Environment Variables

### Basic Debug Control

```bash
# Enable all debug logging
DEBUG=true

# Or use alternative flag
DEBUG_LOGGING=true

# Control log format
LOG_FORMAT=json  # Use JSON format instead of custom format
```

### Specialized Debug Flags

```bash
# Debug content flow specifically (helps diagnose "內容未提供" issues)
DEBUG_CONTENT_FLOW=true

# Debug performance metrics
DEBUG_PERFORMANCE=true

# Debug API calls and responses
DEBUG_API=true
```

## Log Categories and Prefixes

The system uses descriptive prefixes to categorize logs:

### Service Prefixes
- `🚀 [ANALYSIS]` - Main analysis service orchestration
- `🔍 [SERPAPI]` - Google search and AI Overview extraction
- `🤖 [CRAWL4AI]` - Web content scraping
- `🧠 [GEMINI]` - AI analysis with Google Gemini
- `🔧 [PROMPT]` - Prompt template rendering
- `🚀 [WORKER]` - Background job processing

### Status Indicators
- `✅` - Successful operations
- `❌` - Failed operations
- `⚠️` - Warnings or partial failures
- `🔄` - Fallback operations
- `📊` - Statistics and metrics
- `🔍` - Detailed debugging information
- `📦` - Data packaging/preparation

## Key Logging Points

### 1. Content Flow Tracking

The system tracks content at every stage:

1. **SERP API Stage**
   - AI Overview content length
   - Number of references
   - Fallback usage

2. **Crawling Stage**
   - Content length for each scraped page
   - Successful vs failed scrapes
   - Content quality assessment

3. **Content Preparation**
   - Total content length being sent to Gemini
   - Number of pages with actual content
   - Content preview samples

4. **AI Analysis**
   - Prompt length after variable substitution
   - Response validation
   - Result quality metrics

### 2. Performance Tracking

Each major operation logs:
- Start time
- Duration in milliseconds
- Success/failure status

### 3. Error Context

When errors occur, the system logs:
- Error type and message
- Stack trace
- Relevant context (URLs, keywords, etc.)
- Duration until failure

## Common Debug Scenarios

### Diagnosing "內容未提供" Issues

1. Enable content flow debugging:
   ```bash
   DEBUG_CONTENT_FLOW=true npm run dev
   ```

2. Look for these key indicators:
   - `[CRAWL4AI] Scrape successful` - Check `contentLength`
   - `[CONTENT_PREP] Prepared content for Gemini` - Check `totalContentLength`
   - `[PROMPT] Variable contents` - Check if content variables are populated
   - `[GEMINI] Response content validation` - Check if response matches input

### Identifying Crawling Issues

1. Check crawling success rates:
   ```
   [CRAWL4AI] Batch scraping completed
   ```
   Shows success/failure counts and average content length

2. Look for extraction method used:
   ```
   [CRAWL4AI] Scrape successful ... extractionMethod: "markdown.raw_markdown"
   ```

### Tracking API Performance

1. Look for duration metrics:
   ```
   [GEMINI] Analysis completed successfully ... totalDuration: "2500ms"
   ```

2. Identify bottlenecks:
   - SERP API calls
   - Crawl4AI batch operations
   - Gemini API response time

## Debug Output Files

When debug logging is enabled, logs are also written to:
- `debug.log` - All debug-level logs in JSON format
- `error.log` - Error-level logs only (production)
- `combined.log` - All logs (production)

## Best Practices

1. **Development**: Use `DEBUG=true` for comprehensive logging
2. **Production**: Use specific flags like `DEBUG_CONTENT_FLOW=true` to minimize performance impact
3. **Troubleshooting**: Enable `LOG_FORMAT=json` for structured log analysis
4. **Performance Testing**: Use `DEBUG_PERFORMANCE=true` to identify bottlenecks

## Log Analysis Tips

1. **Filter by prefix**: 
   ```bash
   grep "\[CRAWL4AI\]" debug.log
   ```

2. **Track specific job**:
   ```bash
   grep "jobId.*YOUR_JOB_ID" debug.log
   ```

3. **Find content issues**:
   ```bash
   grep -E "(contentLength|totalContentLength|empty)" debug.log
   ```

4. **Identify failures**:
   ```bash
   grep "❌" debug.log
   ```