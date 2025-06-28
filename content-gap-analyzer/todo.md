# Todo List

This document outlines the steps to fix the current issues with the backend analysis process.

## Issue 1: Inefficient Analysis - User Page Analyzed as Competitor

*   **Problem:** The user's own URL is being included in the list of competitor URLs, causing it to be scraped and processed twice.
*   **File to Edit:** `backend/src/services/analysisService.ts`
*   **Task:** Modify the URL filtering logic to correctly remove the user's page URL from the competitor list. This should handle variations in URLs, such as the presence or absence of a trailing slash.

## Issue 2: Critical Failure in Core Analysis - Broken Prompt

*   **Problem:** The `main_analysis` tests are failing because the prompt sent to the Gemini AI is not constructed correctly. The template is missing the correct placeholders for the data it needs.
*   **Files to Edit:**
    *   `backend/src/services/promptService.ts`
    *   `backend/src/services/testingService.ts`
*   **Task:**
    1.  Correct the `main_analysis_v2` prompt template in `promptService.ts` to use the correct variables (`analysisContext`, `userPage`, `competitorPages`) instead of the incorrect `scrapedContent` placeholder.
    2.  Ensure the `variables` array for the prompt reflects these changes.
    3.  Verify that the `testingService.ts` passes the correct data structure to the prompt rendering service.

## Verification Plan

*   **Command:** `npm run test:golden -- --full`
*   **Directory:** `backend`
*   **Goal:** After applying the fixes, run the full test suite. The primary success metric is to have all tests, especially in the `main_analysis` category, pass successfully.
