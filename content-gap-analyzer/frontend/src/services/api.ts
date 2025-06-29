import axios, { AxiosError } from 'axios';
import { AnalysisRequest, AnalysisReportWithMetadata, StartAnalysisResponse, JobStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

console.log('🔧 API Service initialized with base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout
});

// Enhanced error logging utility
const logApiError = (operation: string, error: any, requestData?: any) => {
  console.group(`🚨 API Error: ${operation}`);
  console.error('Error details:', error);
  
  if (requestData) {
    console.log('📤 Request data:', requestData);
  }
  
  if (error instanceof AxiosError) {
    console.error('📡 Network Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestURL: error.config?.url,
      requestMethod: error.config?.method,
      timeout: error.code === 'ECONNABORTED',
    });
  } else {
    console.error('💥 Unexpected Error Type:', {
      type: typeof error,
      constructor: error?.constructor?.name,
      message: error?.message,
      stack: error?.stack,
    });
  }
  
  console.groupEnd();
};

// Add request/response interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.url}`, {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  (error) => {
    const operation = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
    logApiError(`Response Error - ${operation}`, error);
    return Promise.reject(error);
  }
);

// JobStatus interface moved to shared types

export const analysisApi = {
  startAnalysis: async (data: AnalysisRequest): Promise<StartAnalysisResponse> => {
    try {
      console.log('🚀 Starting analysis with data:', data);
      const response = await api.post<StartAnalysisResponse>('/analyze', data);
      console.log('✅ Analysis started successfully:', response.data);
      return response.data;
    } catch (error) {
      logApiError('startAnalysis', error, data);
      throw error;
    }
  },
  
  getJobStatus: async (jobId: string): Promise<JobStatus> => {
    try {
      console.log(`🔍 Checking job status for ID: ${jobId}`);
      const response = await api.get<JobStatus>(`/results/${jobId}`);
      console.log(`📊 Job status received:`, response.data);
      
      // Log specific status details
      if (response.data.status === 'failed') {
        console.error('❌ Job failed:', response.data.error);
      } else if (response.data.status === 'completed_with_errors') {
        console.warn('⚠️ Job completed with errors:', response.data.warnings);
      } else if (response.data.status === 'completed') {
        console.log('✅ Job completed successfully');
      }
      
      return response.data;
    } catch (error) {
      logApiError('getJobStatus', error, { jobId });
      throw error;
    }
  },
  
  // Backward compatibility methods
  getAnalysisStatus: async (analysisId: string): Promise<JobStatus> => {
    console.log(`🔄 Getting analysis status (backward compatibility) for: ${analysisId}`);
    return analysisApi.getJobStatus(analysisId);
  },
  
  getAnalysisResult: async (analysisId: string): Promise<AnalysisReportWithMetadata> => {
    try {
      console.log(`📋 Getting analysis result for: ${analysisId}`);
      const jobStatus = await analysisApi.getJobStatus(analysisId);
      
      if (jobStatus.data) {
        console.log('✅ Analysis result retrieved successfully');
        return jobStatus.data as AnalysisReportWithMetadata;
      }
      
      console.error('❌ Analysis result not available:', {
        analysisId,
        status: jobStatus.status,
        error: jobStatus.error,
        warnings: jobStatus.warnings,
      });
      
      throw new Error(`Analysis result not available. Status: ${jobStatus.status}`);
    } catch (error) {
      logApiError('getAnalysisResult', error, { analysisId });
      throw error;
    }
  },
};

export default api;