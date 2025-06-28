// Shared types between frontend and backend

export interface StartAnalysisResponse {
  jobId: string;
  status: string;
  message?: string;
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
  progress?: number;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
  createdAt?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  data?: AnalysisResult;
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

export interface OpenAIInput {
  targetKeyword: string;
  aiOverview: AIOverviewData;
  userPage: PageContent;
  competitorPages: PageContent[];
  jobId?: string;
}

// =================================================================
// Final Analysis Report Structure (Unified based on Claude.md)
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

  // Additional metadata for internal processing/debugging (not part of the core AI output JSON)
  analysisId?: string;
  timestamp?: string;
  aiOverviewData?: AIOverviewData;
  competitorUrls?: string[];
  processingSteps?: {
    serpApiStatus: string;
    userPageStatus: string;
    competitorPagesStatus: string;
    contentRefinementStatus: string;
    aiAnalysisStatus: string;
  };
  qualityAssessment?: {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor';
    completedSteps: number;
    totalSteps: number;
    criticalFailures: number;
    fallbacksUsed: string[];
  };
  usedFallbackData?: boolean;
  refinementSuccessful?: boolean;
  errors?: string[];
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
}

// For backward compatibility or specific Claude.md prompt usage if needed
export type ClaudeAnalysisReport = AnalysisReport;


