// Shared types between frontend and backend

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
}

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

// Legacy types for backward compatibility
export interface TopicCoverage {
  score: number;
  missingTopics: string[];
  analysis: string;
}

export interface EntityGaps {
  missingEntities: string[];
  analysis: string;
}

export interface EEATSignals {
  score: number;
  recommendations: string[];
}

export interface GapAnalysis {
  topicCoverage: TopicCoverage;
  entityGaps: EntityGaps;
  E_E_A_T_signals: EEATSignals;
}

// v5.1 Analysis Result
export interface AnalysisResult {
  // Core v5.1 structure (matches prompt template output)
  executiveSummary: ExecutiveSummary;
  contentGapAnalysis: ContentGapAnalysis;
  eatAnalysis: EATAnalysis;
  actionablePlan: ActionablePlan;
  competitorInsights?: CompetitorInsights;
  successMetrics?: SuccessMetrics;
  
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
  qualityAssessment?: any;
  jobCompletion?: any;
  errors?: string[];
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
  
  // Legacy compatibility - deprecated but maintained for backward compatibility
  gapAnalysis?: GapAnalysis;
}

export interface AnalysisError {
  error: string;
  code: string;
  details?: any;
}