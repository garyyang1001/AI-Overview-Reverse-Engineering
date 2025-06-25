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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">🔄 處理步驟詳情</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    result.processingSteps.serpApiStatus === 'completed' ? 'bg-green-500' :
                    result.processingSteps.serpApiStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">AI Overview 提取</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{result.processingSteps.serpApiStatus}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    result.processingSteps.userPageStatus === 'completed' ? 'bg-green-500' :
                    result.processingSteps.userPageStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">用戶頁面爬取</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{result.processingSteps.userPageStatus}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    result.processingSteps.competitorPagesStatus === 'completed' ? 'bg-green-500' :
                    result.processingSteps.competitorPagesStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">競爭對手爬取</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{result.processingSteps.competitorPagesStatus}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    result.processingSteps.contentRefinementStatus === 'completed' ? 'bg-green-500' :
                    result.processingSteps.contentRefinementStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">內容精煉</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{result.processingSteps.contentRefinementStatus}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    result.processingSteps.aiAnalysisStatus === 'completed' ? 'bg-green-500' :
                    result.processingSteps.aiAnalysisStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">AI 差距分析</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">{result.processingSteps.aiAnalysisStatus}</span>
              </div>
            </div>
          </div>
          
          {/* Quality Assessment */}
          {result.qualityAssessment && (
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">整體品質評估</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-semibold ${
                    result.qualityAssessment.level === 'excellent' ? 'text-green-600' :
                    result.qualityAssessment.level === 'good' ? 'text-blue-600' :
                    result.qualityAssessment.level === 'fair' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {result.qualityAssessment.score}分
                  </span>
                  <span className="text-xs text-gray-500">
                    ({result.qualityAssessment.completedSteps}/{result.qualityAssessment.totalSteps} 步驟完成)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    result.qualityAssessment.level === 'excellent' ? 'bg-green-500' :
                    result.qualityAssessment.level === 'good' ? 'bg-blue-500' :
                    result.qualityAssessment.level === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${result.qualityAssessment.score}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Warnings for completed_with_errors */}
      {status?.status === 'completed_with_errors' && status.warnings && status.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 分析警告</h3>
          <ul className="text-yellow-800 space-y-1">
            {status.warnings.map((warning, index) => (
              <li key={index} className="text-sm">
                • {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Executive Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">執行摘要</h3>
        <div className="text-blue-800 space-y-2">
          <p><strong>主要排除原因:</strong> {executiveSummary.mainReasonForExclusion}</p>
          <p><strong>優先行動:</strong> {executiveSummary.topPriorityAction}</p>
          {executiveSummary.confidenceScore && (
            <p><strong>信心分數:</strong> {executiveSummary.confidenceScore}%</p>
          )}
        </div>
      </div>

      {/* Content Gap Analysis */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Missing Topics */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold">缺失主題</h4>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {contentGapAnalysis?.missingTopics?.length || 0}
            </span>
          </div>
          
          {contentGapAnalysis?.missingTopics && contentGapAnalysis.missingTopics.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">需要補充的主題：</p>
              <ul className="space-y-1">
                {contentGapAnalysis.missingTopics.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="text-red-400 mr-1">•</span>
                    <strong>{item.topic}</strong>
                    <p className="text-xs text-gray-500 ml-3">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Missing Entities */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold">缺失實體</h4>
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {contentGapAnalysis?.missingEntities?.length || 0}
            </span>
          </div>
          
          {contentGapAnalysis?.missingEntities && contentGapAnalysis.missingEntities.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">需要添加的實體：</p>
              <div className="space-y-2">
                {contentGapAnalysis.missingEntities.map((item, index) => (
                  <div key={index} className="text-sm">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {item.entity}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* E-E-A-T Analysis */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold">E-E-A-T 分析</h4>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {eatAnalysis ? Math.round((eatAnalysis.experience.userScore + eatAnalysis.expertise.userScore + eatAnalysis.authoritativeness.userScore + eatAnalysis.trustworthiness.userScore) / 4) : 0}%
            </span>
          </div>
          
          {eatAnalysis && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>經驗 (E)</span>
                <span className="font-semibold">{eatAnalysis.experience.userScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>專業 (E)</span>
                <span className="font-semibold">{eatAnalysis.expertise.userScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>權威 (A)</span>
                <span className="font-semibold">{eatAnalysis.authoritativeness.userScore}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>信任 (T)</span>
                <span className="font-semibold">{eatAnalysis.trustworthiness.userScore}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Plan */}
      <div>
        <h3 className="font-semibold text-lg mb-4">行動計畫</h3>
        
        {/* Immediate Actions */}
        {actionablePlan?.immediate && actionablePlan.immediate.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-red-700 mb-3">🚀 立即行動 (1-2 週)</h4>
            <div className="space-y-3">
              {actionablePlan.immediate.map((action, index) => (
                <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-red-200 text-red-800">
                          高影響
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{action.timeline}</span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-1">{action.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <p className="text-xs text-gray-500 mb-2">{action.implementation}</p>
                      
                      {/* 具體實施步驟 */}
                      {action.specificSteps && action.specificSteps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">具體步驟：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.specificSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start">
                                <span className="text-gray-400 mr-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 可衡量目標 */}
                      {action.measurableGoals && action.measurableGoals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">預期成果：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.measurableGoals.map((goal, goalIndex) => (
                              <li key={goalIndex} className="flex items-start">
                                <span className="text-green-500 mr-1">✓</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Short Term Actions */}
        {actionablePlan?.shortTerm && actionablePlan.shortTerm.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-yellow-700 mb-3">📈 短期計劃 (1-2 個月)</h4>
            <div className="space-y-3">
              {actionablePlan.shortTerm.map((action, index) => (
                <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-200 text-yellow-800">
                          中影響
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{action.timeline}</span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-1">{action.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <p className="text-xs text-gray-500 mb-2">{action.implementation}</p>
                      
                      {/* 具體實施步驟 */}
                      {action.specificSteps && action.specificSteps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">具體步驟：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.specificSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start">
                                <span className="text-gray-400 mr-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 可衡量目標 */}
                      {action.measurableGoals && action.measurableGoals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">預期成果：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.measurableGoals.map((goal, goalIndex) => (
                              <li key={goalIndex} className="flex items-start">
                                <span className="text-green-500 mr-1">✓</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long Term Actions */}
        {actionablePlan?.longTerm && actionablePlan.longTerm.length > 0 && (
          <div>
            <h4 className="font-semibold text-blue-700 mb-3">🎯 長期策略 (3+ 個月)</h4>
            <div className="space-y-3">
              {actionablePlan.longTerm.map((action, index) => (
                <div key={index} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-200 text-blue-800">
                          戰略影響
                        </span>
                        <span className="text-xs text-gray-500 uppercase">{action.timeline}</span>
                      </div>
                      <h5 className="font-semibold text-gray-800 mb-1">{action.title}</h5>
                      <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                      <p className="text-xs text-gray-500 mb-2">{action.implementation}</p>
                      
                      {/* 具體實施步驟 */}
                      {action.specificSteps && action.specificSteps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">具體步驟：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.specificSteps.map((step, stepIndex) => (
                              <li key={stepIndex} className="flex items-start">
                                <span className="text-gray-400 mr-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 可衡量目標 */}
                      {action.measurableGoals && action.measurableGoals.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">預期成果：</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {action.measurableGoals.map((goal, goalIndex) => (
                              <li key={goalIndex} className="flex items-start">
                                <span className="text-green-500 mr-1">✓</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Competitor Insights (v5.1 Optional) */}
      {competitorInsights && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">🔍 競爭對手洞察</h3>
          
          {competitorInsights.topPerformingCompetitor && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">表現最佳競爭對手</h4>
              <div className="bg-white p-3 rounded border">
                <p className="text-sm text-blue-600 mb-2">{competitorInsights.topPerformingCompetitor.url}</p>
                <div className="mb-2">
                  <span className="text-sm font-medium">優勢:</span>
                  <ul className="text-sm text-gray-600 ml-4">
                    {competitorInsights.topPerformingCompetitor.strengths.map((strength, index) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-sm font-medium">關鍵差異化因素:</span>
                  <ul className="text-sm text-gray-600 ml-4">
                    {competitorInsights.topPerformingCompetitor.keyDifferentiators.map((diff, index) => (
                      <li key={index}>• {diff}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {competitorInsights.commonPatterns && competitorInsights.commonPatterns.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">共同模式</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {competitorInsights.commonPatterns.map((pattern, index) => (
                  <li key={index}>• {pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Success Metrics (v5.1 Optional) */}
      {successMetrics && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-4">📊 成功指標</h3>
          
          <div className="space-y-3">
            <div>
              <span className="font-medium text-green-800">主要 KPI:</span>
              <span className="ml-2 text-green-700">{successMetrics.primaryKPI}</span>
            </div>
            
            {successMetrics.trackingRecommendations && successMetrics.trackingRecommendations.length > 0 && (
              <div>
                <span className="font-medium text-green-800">追蹤建議:</span>
                <ul className="text-sm text-green-700 mt-1 ml-4">
                  {successMetrics.trackingRecommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <span className="font-medium text-green-800">預期時程:</span>
              <span className="ml-2 text-green-700">{successMetrics.timeframe}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;