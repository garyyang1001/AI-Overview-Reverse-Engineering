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
}

export interface AIOverviewData {
  summaryText: string;
  references: string[];
  structure?: any;
}

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

export interface ActionItem {
  type: 'ADD_SECTION' | 'RESTRUCTURE' | 'ENRICH_CONTENT' | 'ADD_ENTITY' | 'IMPROVE_EEAT';
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AnalysisResult {
  executiveSummary: string;
  gapAnalysis: GapAnalysis;
  actionablePlan: ActionItem[];
  timestamp: string;
  analysisId: string;
}

export interface AnalysisError {
  error: string;
  code: string;
  details?: any;
}