import React, { useState } from 'react';
import { AnalysisReportWithMetadata, JobStatus, ActionItem } from '../types';
import { Loader2, XCircle, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import AIOverviewDisplay from './AIOverviewDisplay';
import ReferencesList from './ReferencesList';
import PriorityBlock from './PriorityBlock';
import { ActionItemComponent } from './ActionItem';

interface AnalysisResultsProps {
  analysisId?: string;
  status?: JobStatus;
  result?: AnalysisReportWithMetadata;
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

  // Check if this is the new v6.0 format (AnalysisReport) or legacy v5.1 format
  const isV6Format = 'strategyAndPlan' in result;
  
  if (!isV6Format) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Legacy Analysis Format Detected</h3>
        <p className="text-yellow-700">
          This analysis result uses the legacy v5.1 format. Please re-run the analysis to get the new v6.0 format with improved insights.
        </p>
      </div>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="step-item">
                <div className="flex items-center">
                  <div className={`step-status-indicator ${result.processingSteps.aiAnalysisStatus}`}></div>
                  <span className="step-name">AI 分析</span>
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

      {/* Strategy and Action Plan - v6.0 Format */}
      {result.strategyAndPlan && (
        <div className="report-section">
          <h2 className="section-title">🎯 戰略與改善計畫</h2>
          
          {/* P1 - Immediate Actions */}
          {result.strategyAndPlan.p1_immediate && result.strategyAndPlan.p1_immediate.length > 0 && (
            <PriorityBlock priority="P1" title="立即執行 (高影響力、低執行難度)">
              {result.strategyAndPlan.p1_immediate.map((action: ActionItem, index: number) => (
                <ActionItemComponent
                  key={index}
                  title={`P1-${index + 1}`}
                  description={action.recommendation}
                  geminiPrompt={action.geminiPrompt}
                />
              ))}
            </PriorityBlock>
          )}
          
          {/* P2 - Medium Term Actions */}
          {result.strategyAndPlan.p2_mediumTerm && result.strategyAndPlan.p2_mediumTerm.length > 0 && (
            <PriorityBlock priority="P2" title="中期規劃 (高影響力、高執行難度)">
              {result.strategyAndPlan.p2_mediumTerm.map((action: ActionItem, index: number) => (
                <ActionItemComponent
                  key={index}
                  title={`P2-${index + 1}`}
                  description={action.recommendation}
                  geminiPrompt={action.geminiPrompt}
                />
              ))}
            </PriorityBlock>
          )}
          
          {/* P3 - Long Term Actions */}
          {result.strategyAndPlan.p3_longTerm && result.strategyAndPlan.p3_longTerm.length > 0 && (
            <PriorityBlock priority="P3" title="長期優化 (持續進行)">
              {result.strategyAndPlan.p3_longTerm.map((action: ActionItem, index: number) => (
                <ActionItemComponent
                  key={index}
                  title={`P3-${index + 1}`}
                  description={action.recommendation}
                  geminiPrompt={action.geminiPrompt}
                />
              ))}
            </PriorityBlock>
          )}
        </div>
      )}

      {/* Keyword Intent Analysis - v6.0 Format */}
      {result.keywordIntent && (
        <div className="report-section">
          <h2 className="section-title">🔍 關鍵字意圖分析</h2>
          <div className="content-block">
            <div className="mb-4">
              <h4 className="block-title">核心搜尋意圖</h4>
              <p className="text-normal">{result.keywordIntent.coreIntent}</p>
            </div>
            
            {result.keywordIntent.latentIntents && result.keywordIntent.latentIntents.length > 0 && (
              <div>
                <h4 className="block-title">潛在搜尋意圖</h4>
                <ul className="list-unstyled">
                  {result.keywordIntent.latentIntents.map((intent: string, index: number) => (
                    <li key={index}>
                      <span className="list-bullet">•</span>
                      {intent}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* AI Overview Analysis - v6.0 Format */}
      {result.aiOverviewAnalysis && (
        <div className="report-section">
          <h2 className="section-title">🤖 AI Overview 逆向分析</h2>
          <div className="content-block">
            <div className="mb-4">
              <h4 className="block-title">AI 摘要內容</h4>
              <p className="text-normal">{result.aiOverviewAnalysis.summary}</p>
            </div>
            
            <div>
              <h4 className="block-title">呈現方式分析</h4>
              <p className="text-normal">{result.aiOverviewAnalysis.presentationAnalysis}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cited Source Analysis - v6.0 Format */}
      {result.citedSourceAnalysis && result.citedSourceAnalysis.length > 0 && (
        <div className="report-section">
          <h2 className="section-title">📚 引用來源分析</h2>
          <div className="space-y-4">
            {result.citedSourceAnalysis.map((source, index) => (
              <div key={index} className="content-block">
                <h4 className="block-title">{source.url}</h4>
                <div className="space-y-2">
                  <div>
                    <span className="detail-label">內容摘要:</span>
                    <p className="text-normal">{source.contentSummary}</p>
                  </div>
                  <div>
                    <span className="detail-label">貢獻內容:</span>
                    <p className="text-normal">{source.contribution}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <span className="detail-label">經驗 (E):</span>
                      <p className="text-sm">{source.eeatAnalysis.experience}</p>
                    </div>
                    <div>
                      <span className="detail-label">專業 (E):</span>
                      <p className="text-sm">{source.eeatAnalysis.expertise}</p>
                    </div>
                    <div>
                      <span className="detail-label">權威 (A):</span>
                      <p className="text-sm">{source.eeatAnalysis.authoritativeness}</p>
                    </div>
                    <div>
                      <span className="detail-label">信任 (T):</span>
                      <p className="text-sm">{source.eeatAnalysis.trustworthiness}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Website Assessment - v6.0 Format */}
      {result.websiteAssessment && (
        <div className="report-section">
          <h2 className="section-title">🌐 網站評估</h2>
          <div className="content-block">
            <div className="mb-4">
              <h4 className="block-title">內容摘要</h4>
              <p className="text-normal">{result.websiteAssessment.contentSummary}</p>
            </div>
            
            {result.websiteAssessment.contentGaps && result.websiteAssessment.contentGaps.length > 0 && (
              <div className="mb-4">
                <h4 className="block-title">內容缺口</h4>
                <ul className="list-unstyled">
                  {result.websiteAssessment.contentGaps.map((gap: string, index: number) => (
                    <li key={index}>
                      <span className="list-bullet">•</span>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mb-4">
              <h4 className="block-title">頁面體驗</h4>
              <p className="text-normal">{result.websiteAssessment.pageExperience}</p>
            </div>
            
            <div>
              <h4 className="block-title">結構化資料建議</h4>
              <p className="text-normal">{result.websiteAssessment.structuredDataRecs}</p>
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
const ErrorDetailsSection: React.FC<{ result: AnalysisReportWithMetadata; status?: JobStatus }> = ({ result, status }) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  // Check if there are any errors or failures in the analysis
  const hasErrors = (
    status?.status === 'completed_with_errors' ||
    result.processingSteps?.serpApiStatus === 'failed' ||
    result.processingSteps?.userPageStatus === 'failed' ||
    result.processingSteps?.competitorPagesStatus === 'failed' ||
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