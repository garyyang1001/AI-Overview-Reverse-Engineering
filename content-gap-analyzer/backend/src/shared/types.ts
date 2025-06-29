// Shared types between frontend and backend

export interface StartAnalysisResponse {
  jobId: string;
  status: string;
  message?: string;
}

export interface AnalysisRequest {
  targetKeyword: string;
  userPageUrl: string;
  competitorUrls?: string[];
}

export interface PageContent {
  url: string;
  cleanedContent: string;
  headings: string[];
  title?: string;
  metaDescription?: string;
  rawHtml?: string;
  metadata?: {
    description?: string;
    keywords?: string;
    language?: string;
    statusCode?: number;
  };
}

export interface AIOverviewData {
  summaryText: string;
  references: string[];
  structure?: any;
  fallbackUsed?: boolean;
  source?: 'ai_overview' | 'organic_results' | 'fallback';
  dataSource?: string;
}

// =================================================================
// v6.0 Analysis Report Structure
// =================================================================

export interface ActionItem {
  recommendation: string;
  geminiPrompt: string;
}

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

export interface AnalysisReport {
  strategyAndPlan: {
    p1_immediate: ActionItem[];
    p2_mediumTerm: ActionItem[];
    p3_longTerm: ActionItem[];
  };
  keywordIntent: {
    coreIntent: string;
    latentIntents: string[];
  };
  aiOverviewAnalysis: {
    summary: string;
    presentationAnalysis: string;
  };
  citedSourceAnalysis: SourceAnalysis[];
  websiteAssessment: {
    contentSummary: string;
    contentGaps: string[];
    pageExperience: string;
    structuredDataRecs: string;
  };
  reportFooter: string;
}

// Processing metadata interface for v6.0 workflow (4 stages)
export interface ProcessingSteps {
  serpApiStatus: string;
  userPageStatus: string;
  competitorPagesStatus: string;
  aiAnalysisStatus: string;  // Removed contentRefinementStatus for v6.0
}

export interface QualityAssessment {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  completedSteps: number;
  totalSteps: number;  // Should be 4 for v6.0 workflow
  criticalFailures: number;
  fallbacksUsed: string[];
}

// Extended AnalysisReport with processing metadata for system monitoring
export interface AnalysisReportWithMetadata extends AnalysisReport {
  // Additional data
  analysisId: string;
  timestamp: string;
  aiOverviewData?: AIOverviewData;
  competitorUrls?: string[];

  // Processing metadata
  processingSteps?: ProcessingSteps;

  // Quality and error information
  qualityAssessment?: QualityAssessment;
  usedFallbackData?: boolean;
  jobCompletion?: any;
  errors?: string[];
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
}

export interface AnalysisError {
  error: string;
  code: string;
  details?: any;
}

export interface GeminiInput {
  targetKeyword: string;
  aiOverview: AIOverviewData;
  userPage: PageContent;
  competitorPages: PageContent[];
  jobId?: string;
  // v6.0 prompt data for direct template rendering
  promptData?: {
    targetKeyword: string;
    userPageUrl: string;
    aiOverviewContent: string;
    citedUrls: string;
    crawledContent: string;
  };
}

