
// =================================================================
// API Request/Response Contracts
// =================================================================

/**
 * The initial request body sent from the frontend to start an analysis.
 * POST /api/analysis
 */
export interface AnalysisRequest {
  keyword: string;
  userUrl: string;
}

/**
 * The immediate response from the server after accepting an analysis job.
 */
export interface AnalysisJob {
  jobId: string;
}

/**
 * The status of an ongoing analysis job.
 */
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * The structure for polling the status and getting the final report.
 * GET /api/analysis/status/:jobId
 */
export interface AnalysisResult {
  status: AnalysisStatus;
  report?: AnalysisReport;
  error?: string;
}

// =================================================================
// Analysis Report Structure
// This is the main data structure for the final report.
// =================================================================

/**
 * A single, actionable recommendation within the strategic plan.
 */
export interface ActionItem {
  recommendation: string;
  geminiPrompt: string;
}

/**
 * Analysis of a single source that the AI Overview cited.
 */
export interface SourceAnalysis {
  url: string;
  contentSummary: string;
  contribution: string;
  eeatAnalysis: {
    experience: string;
    expertise: string;
    authoritativeness: string;
    trustworthiness: string;
  };
}

/**
 * The final, comprehensive analysis report.
 * This structure mirrors the 5-part analysis from the workflow document.
 */
export interface AnalysisReport {
  /**
   * Part 1: Synthesized Strategy & Action Plan
   */
  strategyAndPlan: {
    p1_immediate: ActionItem[];
    p2_mediumTerm: ActionItem[];
    p3_longTerm: ActionItem[];
  };

  /**
   * Part 2: Keyword Intent Analysis
   */
  keywordIntent: {
    coreIntent: string;
    latentIntents: string[];
  };

  /**
   * Part 3: AI Overview Reverse Engineering
   */
  aiOverviewAnalysis: {
    summary: string;
    presentationAnalysis: string;
  };

  /**
   * Part 4: Cited Source Analysis
   */
  citedSourceAnalysis: SourceAnalysis[];

  /**
   * Part 5: Your Website Assessment
   */
  websiteAssessment: {
    contentSummary: string;
    contentGaps: string[];
    pageExperience: string;
    structuredDataRecs: string;
  };

  /**
   * The final CTA/footer block as requested in the prompt.
   */
  reportFooter: string;
}
