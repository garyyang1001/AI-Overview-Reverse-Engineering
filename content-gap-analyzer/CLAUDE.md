# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI SEO Content Gap Analyzer - An AI-powered tool that reverse engineers Google AI Overview to help content creators optimize their articles by identifying content gaps. The project is currently transitioning from v5.1 to v6.0 with major workflow improvements.

## Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Run development servers (backend + frontend)
npm run dev

# Build for production
npm run build

# Run tests
cd backend && npm test
cd backend && npm run test:golden  # Run golden test set

# Linting and formatting
cd backend && npm run lint
cd backend && npm run format
```

### Deployment
```bash
# Automated startup
./run-app.sh

# Test application
./test-app.sh
```

## Architecture

### Backend Structure
```
backend/src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
│   ├── analysisService.ts      # Core analysis orchestration
│   ├── geminiService.ts        # Google Gemini AI integration
│   ├── serpApiService.ts       # Google search data extraction
│   ├── crawl4aiService.ts      # Web scraping coordination
│   └── promptService.ts        # Prompt template management
├── workers/         # Background job processors
├── middleware/      # Express middleware
└── utils/          # Utility functions
```

### Key Services Integration
1. **Google Gemini API**: AI analysis using `gemini-2.5-flash` model
2. **SerpAPI**: Extracts Google AI Overview and search results
3. **Crawl4AI**: Python service for web content scraping (must be running separately)
4. **Redis + BullMQ**: Job queue for async processing
5. **Express**: HTTP server with security middleware

### Frontend Structure
React TypeScript application with TanStack Query for data fetching and Tailwind CSS for styling.

## Current Workflow (v6.0)

The analysis follows a 4-stage process:
1. **AI Overview Extraction** (15%): Extract Google AI Overview via SerpAPI
2. **Batch Content Crawling** (40%): Parallel scraping of user and competitor pages
3. **Core Analysis** (85%): AI analysis with hybrid prompt strategy
4. **Result Preparation** (100%): Quality assessment and final output

## Critical Dependencies

- **Crawl4AI Service**: Must be running separately at `CRAWL4AI_BASE_URL`
- **Redis**: Required for job queue management
- **API Keys**: `GEMINI_API_KEY` and `SERPAPI_KEY` must be configured

## Language Context

The application primarily uses Traditional Chinese (Taiwan) for:
- User interface text
- Analysis results
- Error messages
- Prompt templates

## Active Development Areas

Based on todo.md, current focus areas include:
- Implementing v6.0 workflow with improved error handling
- Optimizing prompt strategies for better analysis
- Enhancing crawling reliability
- Improving result quality assessment

## Testing Approach

- Unit tests with Jest in `backend/src/**/*.test.ts`
- Golden test set for validation: `backend/src/tests/golden/`
- Test individual services before full workflow testing