import React from 'react';
import { AnalysisResult } from '../../../shared/types';
import { AnalysisStatus } from '../services/api';
import { Loader2, CheckCircle, XCircle, TrendingUp, Users, Award } from 'lucide-react';
import AIOverviewDisplay from './AIOverviewDisplay';
import ReferencesList from './ReferencesList';

interface AnalysisResultsProps {
  analysisId?: string;
  status?: AnalysisStatus;
  result?: AnalysisResult;
  targetKeyword?: string;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ status, result, targetKeyword }) => {
  if (status && status.status !== 'completed') {
    return (
      <div className="text-center py-12">
        {status.status === 'processing' && (
          <>
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">正在分析您的內容...</p>
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
            <p className="text-sm text-gray-600 mt-2">{status.error}</p>
          </>
        )}
      </div>
    );
  }

  if (!result) return null;

  const { executiveSummary, gapAnalysis, actionablePlan } = result;

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
      
      {/* Executive Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">執行摘要</h3>
        <p className="text-blue-800 whitespace-pre-line">{executiveSummary}</p>
      </div>

      {/* Gap Analysis */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Topic Coverage */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">主題覆蓋度</h4>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {gapAnalysis.topicCoverage.score}%
            </span>
          </div>
          
          {gapAnalysis.topicCoverage.missingTopics.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">缺少的主題：</p>
              <ul className="space-y-1">
                {gapAnalysis.topicCoverage.missingTopics.map((topic, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-red-400 mr-1">•</span>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Entity Gaps */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold">實體覆蓋</h4>
          </div>
          
          {gapAnalysis.entityGaps.missingEntities.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">缺少的實體：</p>
              <div className="flex flex-wrap gap-2">
                {gapAnalysis.entityGaps.missingEntities.map((entity, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* E-E-A-T Signals */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold">E-E-A-T 信號</h4>
            </div>
            <span className="text-2xl font-bold text-orange-600">
              {gapAnalysis.E_E_A_T_signals.score}%
            </span>
          </div>
          
          {gapAnalysis.E_E_A_T_signals.recommendations.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">建議改進：</p>
              <ul className="space-y-1">
                {gapAnalysis.E_E_A_T_signals.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <CheckCircle className="inline h-3 w-3 text-green-500 mr-1" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Plan */}
      <div>
        <h3 className="font-semibold text-lg mb-4">行動計畫</h3>
        <div className="space-y-3">
          {actionablePlan.map((action, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 ${
                action.priority === 'High' 
                  ? 'border-red-200 bg-red-50' 
                  : action.priority === 'Medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      action.priority === 'High' 
                        ? 'bg-red-200 text-red-800' 
                        : action.priority === 'Medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {action.priority === 'High' ? '高優先級' : action.priority === 'Medium' ? '中優先級' : '低優先級'}
                    </span>
                    <span className="text-xs text-gray-500 uppercase">
                      {action.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;