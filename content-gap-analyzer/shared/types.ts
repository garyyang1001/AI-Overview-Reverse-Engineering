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

// =================================================================
// v5.1 Analysis Result Structure (Backend Implementation)
// =================================================================

// v5.1 Types - Executive Summary
export interface ExecutiveSummary {
  mainReasonForExclusion: string;
  topPriorityAction: string;
  confidenceScore?: number;
}

// v5.1 Types - Content Gap Analysis
export interface MissingTopic {
  topic: string;
  description: string;
  importance?: string;
  competitorCoverage?: number;
  implementationComplexity?: string;
}

export interface MissingEntity {
  entity: string;
  type: string;
  relevance: string;
  competitorMentions?: number;
  description: string;
}

export interface ContentDepthGap {
  area: string;
  currentDepth: string;
  requiredDepth: string;
  competitorAdvantage: string;
}

export interface ContentGapAnalysis {
  missingTopics: MissingTopic[];
  missingEntities: MissingEntity[];
  contentDepthGaps?: ContentDepthGap[];
}

// v5.1 Types - E-E-A-T Analysis
export interface EATDimension {
  userScore: number;
  competitorAverage: number;
  gaps: string[];
  opportunities: string[];
}

export interface EATAnalysis {
  experience: EATDimension;
  expertise: EATDimension;
  authoritativeness: EATDimension;
  trustworthiness: EATDimension;
}

// Additional v5.1 interfaces
export interface CompetitorInsights {
  topPerformingCompetitor: {
    url: string;
    strengths: string[];
    keyDifferentiators: string[];
  };
  commonPatterns: string[];
}

export interface SuccessMetrics {
  primaryKPI: string;
  trackingRecommendations: string[];
  timeframe: string;
}

// v5.1 Types - Actionable Plan
export interface ActionItemV5 {
  action: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeline: string;
  implementation: string;
  geminiPrompt: string; // Added to preserve Claude.md Gemini prompts
  expectedOutcome: string;
  specificSteps?: string[];
  measurableGoals?: string[];
}

export interface ActionablePlan {
  immediate?: ActionItemV5[];
  shortTerm?: ActionItemV5[];
  longTerm?: ActionItemV5[];
}

// Main Analysis Result Interface (v5.1 - Current Implementation)
export interface AnalysisResult {
  executiveSummary: ExecutiveSummary;
  contentGapAnalysis: ContentGapAnalysis;
  eatAnalysis: EATAnalysis;
  actionablePlan: ActionablePlan;
  competitorInsights?: CompetitorInsights;
  successMetrics?: SuccessMetrics;
  reportFooter: string;

  // Additional data
  analysisId: string;
  timestamp: string;
  aiOverviewData?: AIOverviewData;
  competitorUrls?: string[];

  // Processing metadata
  processingSteps?: {
    serpApiStatus: string;
    userPageStatus: string;
    competitorPagesStatus: string;
    contentRefinementStatus: string;
    aiAnalysisStatus: string;
  };

  // Quality and error information
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
