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
    <div className="app-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Target className="h-8 w-8 text-blue-600" />
          <h1>Reverse Engineering AI Overview</h1>
        </div>
      </header>
      
      {/* Main Content Layout (30%/70% split) */}
      <div className="main-layout">
        {/* Left Sidebar (30%) */}
        <aside className="left-sidebar">
          <div className="sidebar-content">
            <h2>找出你的內容缺口</h2>
            <p>透過分析 Google AI Overview 與競爭對手內容，發現您的網站內容機會與改善建議。</p>
            
            <div className="sidebar-features">
              <div className="feature-item">
                <Search className="h-5 w-5" />
                <span>AI Overview 分析</span>
              </div>
              <div className="feature-item">
                <BarChart3 className="h-5 w-5" />
                <span>內容缺口檢測</span>
              </div>
              <div className="feature-item">
                <Target className="h-5 w-5" />
                <span>SEO 優化建議</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Right Main Area (70%) */}
        <main className="right-main">
          {/* Analysis Form Section */}
          <div className="main-section">
            <div className="section-header">
              <h2>關鍵字輸入欄位</h2>
              <p>輸入您想要分析的關鍵字和網址</p>
            </div>
            <AnalysisForm onSubmit={startAnalysis} isLoading={isLoading} />
          </div>
          
          {/* Results Section */}
          {(analysisId || result) && (
            <div className="main-section">
              <div className="section-header">
                <h2>系統輸出結果區</h2>
                <p>AI Overview 分析結果與改善建議</p>
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
      </div>
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