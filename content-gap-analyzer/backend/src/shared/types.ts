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
// Analysis Report Structure (v5.1 - Current Implementation)
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

// Additional v5.1 interfaces from prompt template
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

// v5.1 Types - Actionable Plan (Enhanced with detailed implementation)
export interface ActionItem {
  action: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeline: string;
  implementation: string;
  expectedOutcome: string;
  specificSteps?: string[];           // 具體實施步驟
  measurableGoals?: string[];         // 可衡量的目標
}

export interface ActionablePlan {
  immediate?: ActionItem[];
  shortTerm?: ActionItem[];
  longTerm?: ActionItem[];
}

// Main Analysis Result Interface (v5.1 - Current Implementation)
export interface AnalysisResult {
  executiveSummary: ExecutiveSummary;
  contentGapAnalysis: ContentGapAnalysis;
  eatAnalysis: EATAnalysis;
  actionablePlan: ActionablePlan;
  competitorInsights?: CompetitorInsights;
  successMetrics?: SuccessMetrics;
  reportFooter: string; // Added based on workflow document

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
  jobCompletion?: any; // This will be refined later if needed
  errors?: string[]; // This will be refined later if needed
  warnings?: Array<{ // This will be refined later if needed
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

export interface OpenAIInput {
  targetKeyword: string;
  aiOverview: AIOverviewData;
  userPage: PageContent;
  competitorPages: PageContent[];
  jobId?: string;
  scrapedContent?: string;
}

// =================================================================
// Required AnalysisReport Interface from Claude.md Specifications
// =================================================================

export interface ClaudeAnalysisActionItem {
  recommendation: string;
  geminiPrompt: string;
}

export interface ClaudeSourceAnalysis {
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

export interface ClaudeAnalysisReport {
  strategyAndPlan: {
    p1_immediate: ClaudeAnalysisActionItem[];
    p2_mediumTerm: ClaudeAnalysisActionItem[];
    p3_longTerm: ClaudeAnalysisActionItem[];
  };
  keywordIntent: {
    coreIntent: string;
    latentIntents: string[];
  };
  aiOverviewAnalysis: {
    summary: string;
    presentationAnalysis: string;
  };
  citedSourceAnalysis: ClaudeSourceAnalysis[];
  websiteAssessment: {
    contentSummary: string;
    contentGaps: string[];
    pageExperience: string;
    structuredDataRecs: string;
  };
  reportFooter: string;
}