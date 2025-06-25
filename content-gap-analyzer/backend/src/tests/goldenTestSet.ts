/**
 * AIO-Auditor v5.1 黃金測試集
 * 高品質測試案例用於 Prompt v2.0 品質保證和回歸測試
 */

export interface GoldenTestCase {
  id: string;
  name: string;
  description: string;
  category: 'content_refinement' | 'main_analysis';
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
 * 黃金測試集 - Content Refinement
 */
export const contentRefinementTestCases: GoldenTestCase[] = [
  {
    id: 'cr_001_ecommerce_seo',
    name: 'E-commerce SEO Guide - Content Refinement',
    description: 'Test content refinement on comprehensive e-commerce SEO content',
    category: 'content_refinement',
    input: {
      content: `# The Ultimate Guide to E-commerce SEO in 2024

E-commerce SEO is crucial for online retailers who want to increase their organic visibility and drive more qualified traffic to their product pages. According to recent studies by BrightEdge, organic search accounts for 53.3% of all website traffic, making it the largest source of trackable website traffic.

## Understanding E-commerce SEO Fundamentals

Search engine optimization for e-commerce websites differs significantly from traditional website SEO. The primary goal is to optimize product pages, category pages, and the overall site structure to rank higher in search engine results pages (SERPs).

Key statistics show that:
- 37% of consumers start their product search on Amazon
- Google Shopping ads generate 85.3% of all clicks on Google Ads
- The average e-commerce conversion rate is 2.86%

## Technical SEO for E-commerce

Site speed is critical for e-commerce success. Google's Core Web Vitals include Largest Contentful Paint (LCP), First Input Delay (FID), and Cumulative Layout Shift (CLS). Amazon found that a 100ms delay in page load time cost them 1% in sales.

Important technical elements include:
- Implementing structured data markup (JSON-LD)
- Optimizing for mobile-first indexing
- Creating XML sitemaps for products and categories
- Setting up proper internal linking structure

## Product Page Optimization

Product pages should include:
- Unique, descriptive titles under 60 characters
- Meta descriptions between 150-160 characters
- High-quality product images with alt text
- Customer reviews and ratings (schema markup)
- Detailed product descriptions with specifications

Case study: Zalando increased organic traffic by 152% after implementing comprehensive product page optimization, including user-generated content integration and technical SEO improvements.

## Content Marketing Strategy

Content marketing for e-commerce involves creating valuable resources that attract potential customers. Successful strategies include:
- Product comparison guides
- How-to tutorials and usage guides
- Industry trend reports
- Customer success stories

Tools like SEMrush, Ahrefs, and Screaming Frog are essential for keyword research and technical audits.`
    },
    qualityMetrics: {
      minContentLength: 200,
      requiredElements: [
        'statistics or data points',
        'specific product names or tools',
        'actionable recommendations',
        'bullet points format'
      ],
      forbiddenElements: [
        'introductory phrases',
        'subjective adjectives',
        'promotional language'
      ]
    },
    metadata: {
      industry: 'E-commerce',
      difficulty: 'medium',
      language: 'en',
      dateCreated: '2024-01-15',
      lastTested: '2024-01-15'
    }
  },
  {
    id: 'cr_002_saas_marketing',
    name: 'SaaS Marketing Metrics - Content Refinement',
    description: 'Test refinement on SaaS marketing content with specific metrics',
    category: 'content_refinement',
    input: {
      content: `# SaaS Marketing Metrics That Actually Matter

In the competitive SaaS landscape, tracking the right metrics is essential for sustainable growth. While vanity metrics might make you feel good, they don't necessarily translate to business success.

## Customer Acquisition Cost (CAC)

Customer Acquisition Cost represents the total cost of acquiring a new customer. This includes marketing spend, sales team salaries, and any other costs directly related to customer acquisition.

The formula is: CAC = Total Acquisition Costs / Number of New Customers Acquired

Industry benchmarks:
- B2B SaaS: $205 - $429 (depending on ACV)
- B2C SaaS: $87 - $265
- Enterprise SaaS: $14,000+ (according to ProfitWell data)

## Customer Lifetime Value (CLV)

CLV predicts the total revenue a customer will generate during their relationship with your company. For SaaS businesses, this metric is particularly important because of the subscription model.

CLV calculation: (Average Revenue Per User × Gross Margin %) / Customer Churn Rate

Companies like Salesforce maintain a CLV:CAC ratio of 5:1, which is considered excellent in the industry.

## Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR)

MRR is the predictable revenue generated each month from subscriptions. ARR is simply MRR × 12.

Key MRR metrics include:
- New MRR: Revenue from new customers
- Expansion MRR: Additional revenue from existing customers
- Churned MRR: Lost revenue from cancelled subscriptions
- Net MRR Growth Rate

HubSpot reported that their Net Revenue Retention rate is 102%, indicating strong expansion revenue.

## Churn Rate Analysis

Churn rate measures the percentage of customers who cancel their subscriptions during a given period.

Annual churn rate benchmarks:
- SMB SaaS: 10-15%
- Mid-market SaaS: 5-7%
- Enterprise SaaS: 5-7%

Intercom reduced their churn rate from 15% to 5% by implementing proactive customer success strategies and improving onboarding processes.`
    },
    qualityMetrics: {
      minContentLength: 150,
      requiredElements: [
        'specific metrics and formulas',
        'company names and examples',
        'numerical benchmarks',
        'industry data'
      ],
      forbiddenElements: [
        'general statements',
        'marketing fluff',
        'unnecessary explanations'
      ]
    },
    metadata: {
      industry: 'SaaS',
      difficulty: 'hard',
      language: 'en',
      dateCreated: '2024-01-15',
      lastTested: '2024-01-15'
    }
  }
];

/**
 * 黃金測試集 - Main Analysis
 */
export const mainAnalysisTestCases: GoldenTestCase[] = [
  {
    id: 'ma_001_seo_tools_comparison',
    name: 'SEO Tools Comparison - Gap Analysis',
    description: 'Test main analysis on SEO tools comparison scenario',
    category: 'main_analysis',
    input: {
      analysisContext: JSON.stringify({
        targetKeyword: "best SEO tools 2024",
        aiOverview: {
          text: "The best SEO tools for 2024 include SEMrush for comprehensive keyword research, Ahrefs for backlink analysis, and Screaming Frog for technical SEO audits. These tools offer different pricing tiers and feature sets to accommodate various business needs.",
          references: [
            "https://semrush.com",
            "https://ahrefs.com", 
            "https://screamingfrog.co.uk"
          ]
        }
      }),
      userPage: JSON.stringify({
        url: "https://example-user.com/seo-tools-guide",
        essentialsSummary: "- SEO tools help improve website rankings\n- Popular tools include SEMrush and Ahrefs\n- Tools can be expensive for small businesses\n- Important to choose based on your needs"
      }),
      competitorPages: JSON.stringify([
        {
          url: "https://semrush.com",
          essentialsSummary: "- Comprehensive keyword research platform\n- Over 21 billion keywords in database\n- Used by 10 million+ marketers globally\n- Offers competitor analysis and rank tracking\n- Pricing starts at $119.95/month\n- Founded in 2008 by Oleg Shchegolev"
        },
        {
          url: "https://ahrefs.com",
          essentialsSummary: "- World's largest backlink database with 16 trillion links\n- Site Explorer shows organic search traffic estimates\n- Keywords Explorer provides search volume data\n- Used by marketers at Apple, Microsoft, Adobe\n- Pricing starts at $99/month\n- Founded by Dmitry Gerasimenko in 2010"
        }
      ])
    },
    qualityMetrics: {
      minContentLength: 500,
      requiredElements: [
        'executiveSummary with confidence score',
        'eatAnalysis with scores',
        'contentGapAnalysis with specific gaps',
        'actionablePlan with timeline',
        'competitorInsights'
      ],
      forbiddenElements: [
        'generic recommendations',
        'placeholder text',
        'incomplete analysis sections'
      ]
    },
    metadata: {
      industry: 'SEO/Marketing',
      difficulty: 'medium',
      language: 'en',
      dateCreated: '2024-01-15',
      lastTested: '2024-01-15'
    }
  },
  {
    id: 'ma_002_ai_writing_tools',
    name: 'AI Writing Tools Analysis',
    description: 'Test analysis on competitive AI writing tools market',
    category: 'main_analysis',
    input: {
      analysisContext: JSON.stringify({
        targetKeyword: "AI writing tools for content creation",
        aiOverview: {
          text: "AI writing tools like Jasper, Copy.ai, and Writesonic help content creators generate articles, social media posts, and marketing copy. These tools use large language models to produce human-like text based on prompts and templates.",
          references: [
            "https://jasper.ai",
            "https://copy.ai",
            "https://writesonic.com"
          ]
        }
      }),
      userPage: JSON.stringify({
        url: "https://example-user.com/ai-writing-guide", 
        essentialsSummary: "- AI writing tools can help create content faster\n- Many tools available in the market\n- Some tools are better than others\n- Important to test different options"
      }),
      competitorPages: JSON.stringify([
        {
          url: "https://jasper.ai",
          essentialsSummary: "- Enterprise-grade AI writing platform\n- Over 105,000 customers including IBM and Airbnb\n- Supports 29+ languages\n- Pricing starts at $49/month\n- Founded by Dave Rogenmoser and JP Morgan in 2021\n- Uses GPT-3 and proprietary models\n- Offers brand voice training and team collaboration"
        },
        {
          url: "https://copy.ai",
          essentialsSummary: "- AI-powered copywriting assistant\n- Over 10 million users worldwide\n- Free plan available with 2,000 words/month\n- Pro plan costs $49/month\n- Founded by Paul Yacoubian and Chris Lu in 2020\n- Offers 90+ copywriting templates\n- Integrates with popular marketing tools"
        }
      ])
    },
    qualityMetrics: {
      minContentLength: 600,
      requiredElements: [
        'detailed E-E-A-T analysis',
        'specific competitor advantages',
        'actionable improvement plan',
        'success metrics definition'
      ],
      forbiddenElements: [
        'vague recommendations',
        'missing competitor insights',
        'unrealistic timelines'
      ]
    },
    metadata: {
      industry: 'AI/Technology',
      difficulty: 'hard',
      language: 'en',
      dateCreated: '2024-01-15',
      lastTested: '2024-01-15'
    }
  }
];

/**
 * 所有測試案例的統一導出
 */
export const goldenTestSet = {
  contentRefinement: contentRefinementTestCases,
  mainAnalysis: mainAnalysisTestCases,
  
  // 獲取所有測試案例
  getAllTestCases(): GoldenTestCase[] {
    return [...contentRefinementTestCases, ...mainAnalysisTestCases];
  },
  
  // 根據類別獲取測試案例
  getTestCasesByCategory(category: 'content_refinement' | 'main_analysis'): GoldenTestCase[] {
    return category === 'content_refinement' ? contentRefinementTestCases : mainAnalysisTestCases;
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
        content_refinement: contentRefinementTestCases.length,
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