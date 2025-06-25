import axios from 'axios';
import { AnalysisRequest, AnalysisResult } from '../../../shared/types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface StartAnalysisResponse {
  analysisId: string;
  status: string;
  fromCache?: boolean;
  result?: AnalysisResult;
  message?: string;
}

export interface AnalysisStatus {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export const analysisApi = {
  startAnalysis: async (data: AnalysisRequest): Promise<StartAnalysisResponse> => {
    const response = await api.post<StartAnalysisResponse>('/analysis/start', data);
    return response.data;
  },
  
  getAnalysisStatus: async (analysisId: string): Promise<AnalysisStatus> => {
    const response = await api.get<AnalysisStatus>(`/analysis/status/${analysisId}`);
    return response.data;
  },
  
  getAnalysisResult: async (analysisId: string): Promise<AnalysisResult> => {
    const response = await api.get<AnalysisResult>(`/analysis/result/${analysisId}`);
    return response.data;
  },
};

export default api;