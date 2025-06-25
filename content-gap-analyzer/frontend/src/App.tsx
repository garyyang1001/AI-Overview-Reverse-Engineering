import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AnalysisForm from './components/AnalysisForm';
import AnalysisResults from './components/AnalysisResults';
import { useAnalysis } from './hooks/useAnalysis';
import { Search, BarChart3, Target } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const { startAnalysis, analysisId, status, result, currentRequest, isLoading } = useAnalysis();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              AI SEO Content Gap Analyzer
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            分析您的內容與 Google AI Overview 的差距，獲得可操作的優化建議
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analysis Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">開始分析</h2>
          </div>
          <AnalysisForm onSubmit={startAnalysis} isLoading={isLoading} />
        </div>
        
        {/* Results or Status */}
        {(analysisId || result) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">分析結果</h2>
            </div>
            <AnalysisResults 
              analysisId={analysisId || undefined}
              status={status}
              result={result || undefined}
              targetKeyword={currentRequest?.targetKeyword}
            />
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-8 px-4 border-t bg-white">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>Powered by Google Gemini AI & SerpAPI</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;