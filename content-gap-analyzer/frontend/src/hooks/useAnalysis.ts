import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analysisApi, JobStatus } from '../services/api';
import { AnalysisRequest, AnalysisResult } from '../types';

export const useAnalysis = () => {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AnalysisRequest | null>(null);
  const queryClient = useQueryClient();

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: analysisApi.startAnalysis,
    onSuccess: (data) => {
      // v5.1: Backend always returns jobId, no cache response
      setAnalysisId(data.jobId);
      toast.success('分析已開始，請稍候...');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '分析失敗，請重試');
    },
  });

  // Poll for analysis status
  const { data: status } = useQuery<JobStatus>({
    queryKey: ['jobStatus', analysisId],
    queryFn: () => analysisApi.getJobStatus(analysisId!),
    enabled: !!analysisId && !result,
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });

  // Handle job completion
  useEffect(() => {
    if (status?.status === 'completed' && status.data && analysisId) {
      // Stop polling
      queryClient.invalidateQueries({ queryKey: ['jobStatus', analysisId] });
      
      // Set result directly from status data
      setResult(status.data);
      setAnalysisId(null);
      toast.success('分析完成！');
    } else if (status?.status === 'completed_with_errors' && status.data && analysisId) {
      // Handle completion with warnings
      queryClient.invalidateQueries({ queryKey: ['jobStatus', analysisId] });
      
      setResult(status.data);
      setAnalysisId(null);
      toast.success('分析完成，但有部分警告');
    } else if (status?.status === 'failed') {
      // Stop polling on failure
      queryClient.invalidateQueries({ queryKey: ['jobStatus', analysisId] });
      setAnalysisId(null);
      
      const errorMessage = status.error?.message || '分析失敗';
      toast.error(errorMessage);
    }
  }, [status, analysisId, queryClient]);

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