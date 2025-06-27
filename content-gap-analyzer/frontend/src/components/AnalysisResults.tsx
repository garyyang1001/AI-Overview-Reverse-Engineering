import React from 'react';
import { AnalysisResult } from '../../../shared/types';
import { JobStatus } from '../services/api';
import { Loader2, XCircle, TrendingUp, Users, Award } from 'lucide-react';
import AIOverviewDisplay from './AIOverviewDisplay';
import ReferencesList from './ReferencesList';

interface AnalysisResultsProps {
  analysisId?: string;
  status?: JobStatus;
  result?: AnalysisResult;
  targetKeyword?: string;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ status, result, targetKeyword }) => {
  if (status && !['completed', 'completed_with_errors'].includes(status.status)) {
    return (
      <div className="text-center py-12">
        {(status.status === 'processing' || status.status === 'pending') && (
          <>
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">
              {status.status === 'pending' ? '任務排隊中...' : '正在分析您的內容...'}
            </p>
            {status.progress && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">{status.progress}%</p>
              </div>
            )}
          </>
        )}
        
        {status.status === 'failed' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <p className="text-red-600">分析失敗</p>
            <p className="text-sm text-gray-600 mt-2">{status.error?.message || '未知錯誤'}</p>
          </>
        )}
      </div>
    );
  }

  if (!result) return null;

  const { executiveSummary, contentGapAnalysis, eatAnalysis, actionablePlan, competitorInsights, successMetrics } = result;

  return (
    <div className="space-y-6">
      {/* AI Overview Display */}
      {result.aiOverviewData && (
        <AIOverviewDisplay 
          aiOverviewData={result.aiOverviewData}
          targetKeyword={targetKeyword || "目標關鍵詞"}
        />
      )}
      
      {/* References List */}
      {result.competitorUrls && result.competitorUrls.length > 0 && (
        <ReferencesList 
          references={result.competitorUrls}
          title="競爭對手引用來源"
        />
      )}
      
      {/* Processing Steps Details */}
      {result.processingSteps && (
        <div className="processing-steps-section">
          <h2 className="section-title">🔄 處理步驟詳情</h2>
          
          <div className="processing-steps-grid">
            <div className="space-y-3">
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.serpApiStatus}`}></div>
                  <span className="step-name">AI Overview 提取</span>
                </div>
                <span className="step-status-text">{result.processingSteps.serpApiStatus}</span>
              </div>
              
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.userPageStatus}`}></div>
                  <span className="step-name">用戶頁面爬取</span>
                </div>
                <span className="step-status-text">{result.processingSteps.userPageStatus}</span>
              </div>
              
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.competitorPagesStatus}`}></div>
                  <span className="step-name">競爭對手爬取</span>
                </div>
                <span className="step-status-text">{result.processingSteps.competitorPagesStatus}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.contentRefinementStatus}`}></div>
                  <span className="step-name">內容精煉</span>
                </div>
                <span className="step-status-text">{result.processingSteps.contentRefinementStatus}</span>
              </div>
              
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.aiAnalysisStatus}`}></div>
                  <span className="step-name">AI 差距分析</span>
                </div>
                <span className="step-status-text">{result.processingSteps.aiAnalysisStatus}</span>
              </div>
            </div>
          </div>
          
          {/* Quality Assessment */}
          {result.qualityAssessment && (
            <div className="quality-assessment-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-small font-medium">整體品質評估</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-small font-semibold ${result.qualityAssessment.level}`}>
                    {result.qualityAssessment.score}分
                  </span>
                  <span className="text-tiny text-tertiary">
                    ({result.qualityAssessment.completedSteps}/{result.qualityAssessment.totalSteps} 步驟完成)
                  </span>
                </div>
              </div>
              <div className="quality-score-bar-container">
                <div 
                  className={`quality-score-bar ${result.qualityAssessment.level}`}
                  style={{ width: `${result.qualityAssessment.score}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Warnings for completed_with_errors */}
      {status?.status === 'completed_with_errors' && status.warnings && status.warnings.length > 0 && (
        <div className="warning-block">
          <h3 className="warning-block-title">⚠️ 分析警告</h3>
          <ul className="warning-list">
            {status.warnings.map((warning, index) => (
              <li key={index}>
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Summary */}
      <div className="report-section">
        <h2 className="section-title">執行摘要</h2>
        <div className="content-block">
          <p><strong>主要排除原因:</strong> {executiveSummary.mainReasonForExclusion}</p>
          <p><strong>優先行動:</strong> {executiveSummary.topPriorityAction}</p>
          {executiveSummary.confidenceScore && (
            <p><strong>信心分數:</strong> {executiveSummary.confidenceScore}%</p>
          )}
        </div>
      </div>

      {/* Content Gap Analysis */}
      <div className="report-section">
        <h2 className="section-title">內容差距分析</h2>
        <div className="grid-3-cols">
          {/* Missing Topics */}
          <div className="content-block">
            <div className="block-header">
              <TrendingUp className="icon-small" />
              <h4 className="block-title">缺失主題</h4>
              <span className="block-count">{contentGapAnalysis?.missingTopics?.length || 0}</span>
            </div>
            
            {contentGapAnalysis?.missingTopics && contentGapAnalysis.missingTopics.length > 0 && (
              <div className="block-content">
                <p className="block-description">需要補充的主題：</p>
                <ul className="list-unstyled">
                  {contentGapAnalysis.missingTopics.map((item, index) => (
                    <li key={index}>
                      <span className="list-bullet">•</span>
                      <strong>{item.topic}</strong>
                      <p className="list-description">{item.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Missing Entities */}
          <div className="content-block">
            <div className="block-header">
              <Users className="icon-small" />
              <h4 className="block-title">缺失實體</h4>
              <span className="block-count">{contentGapAnalysis?.missingEntities?.length || 0}</span>
            </div>
            
            {contentGapAnalysis?.missingEntities && contentGapAnalysis.missingEntities.length > 0 && (
              <div className="block-content">
                <p className="block-description">需要添加的實體：</p>
                <div className="entity-list">
                  {contentGapAnalysis.missingEntities.map((item, index) => (
                    <div key={index} className="entity-item">
                      <span className="entity-tag">{item.entity}</span>
                      <p className="entity-description">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* E-E-A-T Analysis Summary */}
          <div className="content-block">
            <div className="block-header">
              <Award className="icon-small" />
              <h4 className="block-title">E-E-A-T 分析</h4>
              <span className="block-count">
                {eatAnalysis ? Math.round((eatAnalysis.experience.userScore + eatAnalysis.expertise.userScore + eatAnalysis.authoritativeness.userScore + eatAnalysis.trustworthiness.userScore) / 4) : 0}%
              </span>
            </div>
            
            {eatAnalysis && (
              <div className="block-content">
                <div className="score-item">
                  <span>經驗 (E)</span>
                  <span className="score-value">{eatAnalysis.experience.userScore}%</span>
                </div>
                <div className="score-item">
                  <span>專業 (E)</span>
                  <span className="score-value">{eatAnalysis.expertise.userScore}%</span>
                </div>
                <div className="score-item">
                  <span>權威 (A)</span>
                  <span className="score-value">{eatAnalysis.authoritativeness.userScore}%</span>
                </div>
                <div className="score-item">
                  <span>信任 (T)</span>
                  <span className="score-value">{eatAnalysis.trustworthiness.userScore}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Plan */}
      <div>
        <h3 className="font-semibold text-lg mb-4">行動計畫</h3>

        {actionablePlan?.immediate && actionablePlan.immediate.length > 0 && (
          <PriorityBlock priority="P1" title="立即行動 (1-2 週)">
            {actionablePlan.immediate.map((action, index) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.implementation} // Assuming implementation is the prompt
                implementation={action.implementation}
                specificSteps={action.specificSteps}
                measurableGoals={action.measurableGoals}
              />
            ))}
          </PriorityBlock>
        )}

        {actionablePlan?.shortTerm && actionablePlan.shortTerm.length > 0 && (
          <PriorityBlock priority="P2" title="短期計劃 (1-2 個月)">
            {actionablePlan.shortTerm.map((action, index) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.implementation} // Assuming implementation is the prompt
                implementation={action.implementation}
                specificSteps={action.specificSteps}
                measurableGoals={action.measurableGoals}
              />
            ))}
          </PriorityBlock>
        )}

        {actionablePlan?.longTerm && actionablePlan.longTerm.length > 0 && (
          <PriorityBlock priority="P3" title="長期策略 (3+ 個月)">
            {actionablePlan.longTerm.map((action, index) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.implementation} // Assuming implementation is the prompt
                implementation={action.implementation}
                specificSteps={action.specificSteps}
                measurableGoals={action.measurableGoals}
              />
            ))}
          </PriorityBlock>
        )}
      </div>

      {/* Competitor Insights */}
      {competitorInsights && (
        <div className="report-section">
          <h2 className="section-title">競爭對手洞察</h2>
          
          {competitorInsights.topPerformingCompetitor && (
            <div className="content-block">
              <h3 className="block-title">表現最佳競爭對手</h3>
              <div className="content-details">
                <p className="text-normal">{competitorInsights.topPerformingCompetitor.url}</p>
                <div className="detail-group">
                  <span className="detail-label">優勢:</span>
                  <ul className="list-unstyled">
                    {competitorInsights.topPerformingCompetitor.strengths.map((strength, index) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="detail-group">
                  <span className="detail-label">關鍵差異化因素:</span>
                  <ul className="list-unstyled">
                    {competitorInsights.topPerformingCompetitor.keyDifferentiators.map((diff, index) => (
                      <li key={index}>• {diff}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {competitorInsights.commonPatterns && competitorInsights.commonPatterns.length > 0 && (
            <div className="content-block">
              <h3 className="block-title">共同模式</h3>
              <ul className="list-unstyled">
                {competitorInsights.commonPatterns.map((pattern, index) => (
                  <li key={index}>• {pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Success Metrics */}
      {successMetrics && (
        <div className="report-section">
          <h2 className="section-title">成功指標</h2>
          
          <div className="content-block">
            <div className="detail-group">
              <span className="detail-label">主要 KPI:</span>
              <span className="text-normal">{successMetrics.primaryKPI}</span>
            </div>
            
            {successMetrics.trackingRecommendations && successMetrics.trackingRecommendations.length > 0 && (
              <div className="detail-group">
                <span className="detail-label">追蹤建議:</span>
                <ul className="list-unstyled">
                  {successMetrics.trackingRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="detail-group">
              <span className="detail-label">預期時程:</span>
              <span className="text-normal">{successMetrics.timeframe}</span>
            </div>
          </div>
        </div>
      )}

      {/* Report Footer */}
      {result.reportFooter && (
        <div className="report-section cta-block">
          <p className="text-small text-tertiary">{result.reportFooter}</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;