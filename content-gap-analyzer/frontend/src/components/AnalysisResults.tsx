import React, { useState } from 'react';
import { AnalysisResult, JobStatus, MissingTopic, MissingEntity, ActionItemV5 } from '../types';
import { Loader2, XCircle, TrendingUp, Users, Award, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import AIOverviewDisplay from './AIOverviewDisplay';
import ReferencesList from './ReferencesList';
import PriorityBlock from './PriorityBlock';
import ActionItem from './ActionItem';

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
          <FailedAnalysisDisplay status={status} targetKeyword={targetKeyword} />
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
      
      {/* Error Display for Completed Analysis with Issues */}
      {result && result.processingSteps && (
        <ErrorDetailsSection result={result} status={status} />
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
      {executiveSummary ? (
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
      ) : (
        <div className="report-section">
          <h2 className="section-title">執行摘要</h2>
          <div className="content-block">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
              <p className="text-yellow-800">
                <strong>⚠️ 執行摘要數據不完整</strong>
              </p>
              <p className="text-yellow-700 text-sm mt-2">
                分析結果可能不完整，請重新執行分析或檢查後端服務狀態。
              </p>
            </div>
          </div>
        </div>
      )}

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
                  {contentGapAnalysis.missingTopics.map((item: MissingTopic, index: number) => (
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
                  {contentGapAnalysis.missingEntities.map((item: MissingEntity, index: number) => (
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
            {actionablePlan.immediate.map((action: ActionItemV5, index: number) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.geminiPrompt}
                implementation={action.implementation}
                specificSteps={action.specificSteps}
                measurableGoals={action.measurableGoals}
              />
            ))}
          </PriorityBlock>
        )}

        {actionablePlan?.shortTerm && actionablePlan.shortTerm.length > 0 && (
          <PriorityBlock priority="P2" title="短期計劃 (1-2 個月)">
            {actionablePlan.shortTerm.map((action: ActionItemV5, index: number) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.geminiPrompt}
                implementation={action.implementation}
                specificSteps={action.specificSteps}
                measurableGoals={action.measurableGoals}
              />
            ))}
          </PriorityBlock>
        )}

        {actionablePlan?.longTerm && actionablePlan.longTerm.length > 0 && (
          <PriorityBlock priority="P3" title="長期策略 (3+ 個月)">
            {actionablePlan.longTerm.map((action: ActionItemV5, index: number) => (
              <ActionItem
                key={index}
                title={action.title}
                description={action.description}
                geminiPrompt={action.geminiPrompt}
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
                    {competitorInsights.topPerformingCompetitor.strengths.map((strength: string, index: number) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="detail-group">
                  <span className="detail-label">關鍵差異化因素:</span>
                  <ul className="list-unstyled">
                    {competitorInsights.topPerformingCompetitor.keyDifferentiators.map((diff: string, index: number) => (
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
                {competitorInsights.commonPatterns.map((pattern: string, index: number) => (
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
                  {successMetrics.trackingRecommendations.map((rec: string, index: number) => (
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

// Failed Analysis Display Component
const FailedAnalysisDisplay: React.FC<{ status: JobStatus; targetKeyword?: string }> = ({ status, targetKeyword }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  console.group('🚨 FailedAnalysisDisplay - Analysis Failed');
  console.error('💥 Failed Status:', status);
  console.error('🔍 Error Details:', {
    message: status.error?.message,
    status: status.status,
    createdAt: status.createdAt,
    startedAt: status.startedAt,
    completedAt: status.completedAt,
    targetKeyword,
  });
  console.groupEnd();
  
  const handleRetry = () => {
    console.log('🔄 User requested analysis retry');
    window.location.reload();
  };
  
  return (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        <XCircle className="h-16 w-16 mx-auto text-red-600 mb-6" />
        <h2 className="error-boundary-title text-2xl mb-4">
          🚨 分析失敗
        </h2>
        
        <div className="error-boundary-message text-lg mb-6">
          <p className="font-medium text-red-700 mb-2">
            關鍵字「{targetKeyword}」的分析過程中發生錯誤
          </p>
          <p className="text-gray-600">
            {status.error?.message || '系統遇到未預期的錯誤，請查看詳細資訊或重試'}
          </p>
        </div>

        <div className="error-boundary-actions mb-6">
          <button 
            className="error-boundary-reload-btn flex items-center gap-2"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4" />
            重新分析
          </button>
          
          <button 
            className="error-boundary-console-btn flex items-center gap-2"
            onClick={() => {
              console.clear();
              console.group('🚨 Manual Error Debug - Analysis Failure');
              console.error('📊 Complete Status Object:', status);
              console.error('🎯 Target Keyword:', targetKeyword);
              console.error('⏰ Timestamps:', {
                created: status.createdAt,
                started: status.startedAt,
                completed: status.completedAt,
              });
              console.groupEnd();
              alert('錯誤詳情已輸出到瀏覽器 Console，請按 F12 開啟開發者工具查看完整錯誤資訊');
            }}
          >
            🔍 查看技術詳情
          </button>
        </div>

        {/* Collapsible Error Details */}
        <div className="error-boundary-details">
          <summary 
            className="cursor-pointer flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span className="font-medium">🛠️ 詳細錯誤資訊</span>
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </summary>
          
          {showDetails && (
            <div className="error-boundary-debug p-4 border-t">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">錯誤訊息:</h3>
                  <pre className="bg-red-50 border border-red-200 p-3 rounded text-sm overflow-x-auto">
                    {status.error?.message || '無具體錯誤訊息'}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">分析狀態:</h3>
                  <pre className="bg-gray-50 border p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify({
                      status: status.status,
                      createdAt: status.createdAt,
                      startedAt: status.startedAt,
                      completedAt: status.completedAt,
                      targetKeyword: targetKeyword,
                    }, null, 2)}
                  </pre>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">📋 疑難排解建議:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 檢查網路連線是否正常</li>
                    <li>• 確認輸入的關鍵字和網址格式正確</li>
                    <li>• 若問題持續發生，請聯繫技術支援</li>
                    <li>• 查看瀏覽器 Console (F12) 獲得更多技術資訊</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Error Details Section Component
const ErrorDetailsSection: React.FC<{ result: AnalysisResult; status?: JobStatus }> = ({ result, status }) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  // Check if there are any errors or failures in the analysis
  const hasErrors = (
    status?.status === 'completed_with_errors' ||
    result.processingSteps?.serpApiStatus === 'failed' ||
    result.processingSteps?.userPageStatus === 'failed' ||
    result.processingSteps?.competitorPagesStatus === 'failed' ||
    result.processingSteps?.contentRefinementStatus === 'failed' ||
    result.processingSteps?.aiAnalysisStatus === 'failed' ||
    (result.qualityAssessment && result.qualityAssessment.score < 70)
  );
  
  const getStepErrorInfo = (stepName: string, stepStatus: string) => {
    if (stepStatus === 'failed') {
      switch (stepName) {
        case 'serpApiStatus':
          return 'SERPAPI 資料獲取失敗，可能是配額不足或網路問題';
        case 'userPageStatus':
          return '用戶頁面爬取失敗，可能是網頁無法訪問或被阻擋';
        case 'competitorPagesStatus':
          return '競爭對手頁面爬取失敗，影響分析完整性';
        case 'contentRefinementStatus':
          return '內容精煉處理失敗，使用原始內容進行分析';
        case 'aiAnalysisStatus':
          return 'AI 分析失敗，使用備用分析方案';
        default:
          return '該步驟執行失敗';
      }
    }
    return '';
  };
  
  if (!hasErrors) {
    return null;
  }
  
  console.group('⚠️ ErrorDetailsSection - Analysis Issues Detected');
  console.warn('🔍 Processing Steps with Issues:', result.processingSteps);
  console.warn('📊 Quality Assessment:', result.qualityAssessment);
  console.warn('⚠️ Status Warnings:', status?.warnings);
  console.groupEnd();
  
  return (
    <div className="warning-block">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="warning-block-title">⚠️ 分析警告與錯誤</h3>
        </div>
        <button
          onClick={() => setShowErrorDetails(!showErrorDetails)}
          className="flex items-center gap-1 text-sm text-orange-700 hover:text-orange-800"
        >
          {showErrorDetails ? '隱藏詳情' : '顯示詳情'}
          {showErrorDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Basic Error Summary */}
      <div className="mb-4">
        {status?.status === 'completed_with_errors' && (
          <p className="text-orange-700 mb-2">
            ✅ 分析已完成，但某些步驟遇到問題，可能影響結果品質
          </p>
        )}
        
        {result.qualityAssessment && result.qualityAssessment.score < 70 && (
          <p className="text-orange-700 mb-2">
            📊 分析品質較低 ({result.qualityAssessment.score}分)，建議檢查輸入資料或重新執行
          </p>
        )}
      </div>
      
      {/* Detailed Error Information */}
      {showErrorDetails && (
        <div className="space-y-4 border-t border-orange-200 pt-4">
          <div>
            <h4 className="font-medium text-orange-800 mb-2">🔍 步驟執行狀態:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(result.processingSteps || {}).map(([step, status]: [string, string]) => {
                const isError = status === 'failed';
                const errorInfo = getStepErrorInfo(step, status);
                
                return (
                  <div key={step} className={`flex items-center justify-between p-2 rounded ${
                    isError ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}>
                    <span className={isError ? 'text-red-700' : 'text-gray-700'}>
                      {step.replace('Status', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        status === 'completed' ? 'bg-green-100 text-green-800' :
                        status === 'failed' ? 'bg-red-100 text-red-800' :
                        status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {String(status)}
                      </span>
                    </div>
                    {errorInfo && (
                      <div className="col-span-2 mt-1 text-xs text-red-600">
                        {errorInfo}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Warnings from Status */}
          {status?.warnings && status.warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-800 mb-2">⚠️ 系統警告:</h4>
              <ul className="space-y-1 text-sm text-orange-700">
                {status.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Debug Information */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <h4 className="font-medium text-blue-800 mb-2">🛠️ 除錯資訊:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• 分析ID: {result.analysisId}</p>
              <p>• 時間戳記: {result.timestamp}</p>
              <p>• 使用備用資料: {result.usedFallbackData ? '是' : '否'}</p>
              <p>• 精煉成功: {result.refinementSuccessful ? '是' : '否'}</p>
              {result.qualityAssessment && (
                <p>• 品質評分: {result.qualityAssessment.score}/100 ({result.qualityAssessment.completedSteps}/{result.qualityAssessment.totalSteps} 步驟完成)</p>
              )}
            </div>
            
            <button
              onClick={() => {
                console.clear();
                console.group('🚨 Manual Debug - Analysis Issues');
                console.error('📊 Complete Analysis Result:', result);
                console.error('⚠️ Status Object:', status);
                console.error('🔍 Processing Steps:', result.processingSteps);
                console.error('📈 Quality Assessment:', result.qualityAssessment);
                console.groupEnd();
                alert('完整的除錯資訊已輸出到瀏覽器 Console，請按 F12 查看詳細內容');
              }}
              className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
            >
              🔍 輸出完整除錯資訊到 Console
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;