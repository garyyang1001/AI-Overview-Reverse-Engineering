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
    <div className="report-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="report-section">
        <div>
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-blue-600" />
            <h1>AI SEO Content Gap Analyzer</h1>
          </div>
          <p>
            分析您的內容與 Google AI Overview 的差距，獲得可操作的優化建議
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main>
        {/* Analysis Form */}
        <div className="report-section">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-600" />
            <h2>開始分析</h2>
          </div>
          <AnalysisForm onSubmit={startAnalysis} isLoading={isLoading} />
        </div>
        
        {/* Results or Status */}
        {(analysisId || result) && (
          <div className="report-section">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h2>分析結果</h2>
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
      <footer className="report-section">
        <div>
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