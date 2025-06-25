import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { analysisApi, AnalysisStatus } from '../services/api';
import { AnalysisRequest, AnalysisResult } from '../../../shared/types';

export const useAnalysis = () => {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentRequest, setCurrentRequest] = useState<AnalysisRequest | null>(null);
  const queryClient = useQueryClient();

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: analysisApi.startAnalysis,
    onSuccess: (data) => {
      if (data.fromCache && data.result) {
        // If result is from cache, set it immediately
        setResult(data.result);
        toast.success('從快取中獲取分析結果！');
      } else {
        // Otherwise, set analysis ID to poll for status
        setAnalysisId(data.analysisId);
        toast.success('分析已開始，請稍候...');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || '分析失敗，請重試');
    },
  });

  // Poll for analysis status
  const { data: status } = useQuery<AnalysisStatus>({
    queryKey: ['analysisStatus', analysisId],
    queryFn: () => analysisApi.getAnalysisStatus(analysisId!),
    enabled: !!analysisId && !result,
    refetchInterval: 2000,
    refetchIntervalInBackground: false,
  });

  // Fetch result when analysis is completed
  useEffect(() => {
    if (status?.status === 'completed' && analysisId) {
      // Stop polling
      queryClient.invalidateQueries({ queryKey: ['analysisStatus', analysisId] });
      
      analysisApi.getAnalysisResult(analysisId)
        .then((data) => {
          setResult(data);
          setAnalysisId(null);
          toast.success('分析完成！');
        })
        .catch((error) => {
          toast.error('無法獲取分析結果');
        });
    } else if (status?.status === 'failed') {
      // Stop polling on failure
      queryClient.invalidateQueries({ queryKey: ['analysisStatus', analysisId] });
      setAnalysisId(null);
      toast.error('分析失敗');
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
    isLoading: startAnalysisMutation.isPending || (!!analysisId && status?.status === 'processing'),
  };
};