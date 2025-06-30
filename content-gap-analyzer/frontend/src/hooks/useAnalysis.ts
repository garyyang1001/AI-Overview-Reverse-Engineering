import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analysisApi } from '../services/api';
import { AnalysisRequest, AnalysisReportWithMetadata, JobStatus } from '../types';

export const useAnalysis = () => {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisReportWithMetadata | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AnalysisRequest | null>(null);

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: analysisApi.startAnalysis,
    onSuccess: (data) => {
      console.log('✅ Analysis started successfully:', data);
      // v5.1: Backend always returns jobId, no cache response
      setAnalysisId(data.jobId);
      toast.success('分析已開始，請稍候...');
    },
    onError: (error: any) => {
      console.error('❌ Analysis start failed:', error);
      const errorMessage = error.response?.data?.message || error.message || '分析失敗，請重試';
      toast.error(errorMessage);
    },
  });

  // Poll for analysis status
  const { data: status } = useQuery<JobStatus>({
    queryKey: ['jobStatus', analysisId],
    queryFn: () => analysisApi.getJobStatus(analysisId!),
    enabled: !!analysisId && !result,
    refetchInterval: (query) => {
      // Stop polling when analysis is completed
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'completed_with_errors' || data?.status === 'failed') {
        return false;
      }
      return 2000;
    },
    refetchIntervalInBackground: false,
  });

  // Handle job completion
  useEffect(() => {
    // Log status for debugging
    if (status && analysisId) {
      console.log(`📊 Job ${analysisId} status update:`, {
        status: status.status,
        hasData: !!status.data,
        dataKeys: status.data ? Object.keys(status.data) : [],
        progress: status.progress,
        warnings: status.warnings?.length || 0,
        error: status.error
      });
    }
    
    if (status?.status === 'completed' && status.data && analysisId) {
      console.log('✅ Analysis completed successfully:', status);
      console.log('📋 Result data structure:', {
        hasStrategyAndPlan: !!status.data.strategyAndPlan,
        hasKeywordIntent: !!status.data.keywordIntent,
        hasAiOverviewAnalysis: !!status.data.aiOverviewAnalysis,
        hasCitedSourceAnalysis: !!status.data.citedSourceAnalysis,
        hasWebsiteAssessment: !!status.data.websiteAssessment,
        dataSize: JSON.stringify(status.data).length
      });
      
      // Set result directly from status data (backend returns AnalysisReportWithMetadata)
      setResult(status.data as AnalysisReportWithMetadata);
      // Keep analysisId for download functionality - don't set to null
      toast.success('分析完成！');
    } else if (status?.status === 'completed_with_errors' && status.data && analysisId) {
      console.warn('⚠️ Analysis completed with errors:', status);
      console.log('📋 Result data structure (with errors):', {
        hasStrategyAndPlan: !!status.data.strategyAndPlan,
        hasKeywordIntent: !!status.data.keywordIntent,
        hasAiOverviewAnalysis: !!status.data.aiOverviewAnalysis,
        hasCitedSourceAnalysis: !!status.data.citedSourceAnalysis,
        hasWebsiteAssessment: !!status.data.websiteAssessment,
        dataSize: JSON.stringify(status.data).length
      });
      
      setResult(status.data as AnalysisReportWithMetadata);
      // Keep analysisId for download functionality - don't set to null
      toast.success('分析完成，但有部分警告');
      
      // Log warnings for debugging
      if (status.warnings && status.warnings.length > 0) {
        console.warn('⚠️ Analysis warnings:', status.warnings);
      }
    } else if (status?.status === 'failed') {
      console.error('❌ Analysis failed:', status);
      setAnalysisId(null);
      
      const errorMessage = status.error?.message || '分析失敗';
      toast.error(errorMessage);
      
      // Log detailed error information
      console.error('💥 Analysis failure details:', {
        jobId: analysisId,
        error: status.error,
        warnings: status.warnings,
        createdAt: status.createdAt,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
      });
    }
  }, [status, analysisId]);

  const startAnalysis = useCallback((data: AnalysisRequest) => {
    // Reset previous state
    setAnalysisId(null);
    setResult(null);
    
    // Store current request data
    setCurrentRequest(data);
    
    // Start new analysis
    startAnalysisMutation.mutate(data);
  }, [startAnalysisMutation]);

  return {
    startAnalysis,
    analysisId,
    status,
    result,
    currentRequest,
    isLoading: startAnalysisMutation.isPending || (!!analysisId && ['pending', 'processing'].includes(status?.status || '')),
  };
};