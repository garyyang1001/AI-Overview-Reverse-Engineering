/**
 * AIO-Auditor v6.0 黃金測試集
 * 高品質測試案例用於 v6.0 品質保證和回歸測試
 */

export interface GoldenTestCase {
  id: string;
  name: string;
  description: string;
  category: 'main_analysis';
  input: any;
  expectedOutput?: any;
  qualityMetrics: {
    minContentLength: number;
    requiredElements: string[];
    forbiddenElements: string[];
  };
  metadata: {
    industry: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    dateCreated: string;
    lastTested: string;
  };
}

/**
 * 黃金測試集 - Main Analysis (v6.0)
 */
export const mainAnalysisTestCases: GoldenTestCase[] = [
  {
    id: 'ma_001_seo_tools_comparison',
    name: 'SEO Tools Comparison - Gap Analysis',
    description: 'Test main analysis on SEO tools comparison scenario',
    category: 'main_analysis',
    input: {
      targetKeyword: 'best SEO tools 2024',
      userPageUrl: 'https://example.com/seo-tools-guide',
      aiOverviewContent: 'AI Overview content about SEO tools...',
      citedUrls: 'https://moz.com/blog/seo-tools\nhttps://ahrefs.com/blog/seo-tools',
      crawledContent: '--- START OF CONTENT FOR https://example.com/seo-tools-guide ---\nContent about SEO tools...\n--- END OF CONTENT FOR https://example.com/seo-tools-guide ---'
    },
    expectedOutput: {
      strategyAndPlan: {
        p1_immediate: [{
          recommendation: 'Add comprehensive tool comparison table',
          geminiPrompt: 'Create a detailed comparison table...'
        }],
        p2_mediumTerm: [],
        p3_longTerm: []
      }
    },
    qualityMetrics: {
      minContentLength: 2000,
      requiredElements: ['strategyAndPlan', 'keywordIntent', 'aiOverviewAnalysis'],
      forbiddenElements: ['incompleteAnalysis', 'genericRecommendations']
    },
    metadata: {
      industry: 'Digital Marketing',
      difficulty: 'medium',
      language: 'en',
      dateCreated: '2024-01-20',
      lastTested: '2024-01-20'
    }
  },
  {
    id: 'ma_002_travel_guide',
    name: 'Travel Destination Guide Analysis',
    description: 'Test analysis on travel content with multiple competitor sources',
    category: 'main_analysis',
    input: {
      targetKeyword: 'Tokyo travel guide',
      userPageUrl: 'https://example.com/tokyo-guide',
      aiOverviewContent: 'Tokyo, Japan\'s capital, offers a blend of traditional and modern attractions...',
      citedUrls: 'https://lonelyplanet.com/tokyo\nhttps://timeout.com/tokyo',
      crawledContent: '--- START OF CONTENT FOR https://example.com/tokyo-guide ---\nTokyo travel information...\n--- END OF CONTENT FOR https://example.com/tokyo-guide ---'
    },
    qualityMetrics: {
      minContentLength: 1500,
      requiredElements: ['citedSourceAnalysis', 'websiteAssessment'],
      forbiddenElements: ['outdatedInformation', 'copiedContent']
    },
    metadata: {
      industry: 'Travel',
      difficulty: 'easy',
      language: 'en',
      dateCreated: '2024-01-21',
      lastTested: '2024-01-21'
    }
  }
];

/**
 * 所有測試案例的統一導出
 */
export const goldenTestSet = {
  mainAnalysis: mainAnalysisTestCases,
  
  // 獲取所有測試案例 (v6.0 - only main analysis)
  getAllTestCases(): GoldenTestCase[] {
    return [...mainAnalysisTestCases];
  },
  
  // 根據類別獲取測試案例 (v6.0 - only main analysis)
  getTestCasesByCategory(): GoldenTestCase[] {
    return mainAnalysisTestCases;
  },
  
  // 根據 ID 獲取特定測試案例
  getTestCaseById(id: string): GoldenTestCase | undefined {
    return this.getAllTestCases().find(testCase => testCase.id === id);
  },
  
  // 獲取統計信息
  getStatistics() {
    const all = this.getAllTestCases();
    return {
      total: all.length,
      byCategory: {
        content_refinement: 0, // Removed in v6.0
        main_analysis: mainAnalysisTestCases.length
      },
      byDifficulty: {
        easy: all.filter(t => t.metadata.difficulty === 'easy').length,
        medium: all.filter(t => t.metadata.difficulty === 'medium').length,
        hard: all.filter(t => t.metadata.difficulty === 'hard').length
      },
      byIndustry: all.reduce((acc, test) => {
        acc[test.metadata.industry] = (acc[test.metadata.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
};