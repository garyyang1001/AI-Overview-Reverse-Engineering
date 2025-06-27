import axios from 'axios';
import { AnalysisRequest, AnalysisResult, StartAnalysisResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface StartAnalysisResponse {
  jobId: string;
  status: string;
  message?: string;
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'completed_with_errors';
  progress?: number;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  warnings?: Array<{
    code: string;
    message: string;
    details?: string;
  }>;
  data?: AnalysisResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export const analysisApi = {
  startAnalysis: async (data: AnalysisRequest): Promise<StartAnalysisResponse> => {
    const response = await api.post<StartAnalysisResponse>('/analyze', data);
    return response.data;
  },
  
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    const response = await api.get<JobStatus>(`/results/${jobId}`);
    return response.data;
  },
  
  // Backward compatibility methods
  getAnalysisStatus: async (analysisId: string): Promise<JobStatus> => {
    return analysisApi.getJobStatus(analysisId);
  },
  
  getAnalysisResult: async (analysisId: string): Promise<AnalysisResult> => {
    const jobStatus = await analysisApi.getJobStatus(analysisId);
    if (jobStatus.data) {
      return jobStatus.data;
    }
    throw new Error('Analysis result not available');
  },
};

export default api;