import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AnalysisForm from './components/AnalysisForm';
import AnalysisResults from './components/AnalysisResults';
import ErrorBoundary from './components/ErrorBoundary';
import { DownloadButtons } from './components/DownloadButtons';
import { useAnalysis } from './hooks/useAnalysis';
import { Search, BarChart3, Target, Download } from 'lucide-react';

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
          <h1>AI摘要逆向工程分析器</h1>
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
            
            {/* Download Section */}
            {(result && analysisId) && (
              <div className="sidebar-download-section">
                <div className="feature-item">
                  <Download className="h-5 w-5" />
                  <span>下載報告</span>
                </div>
                <div className="download-buttons-container">
                  <DownloadButtons jobId={analysisId} className="sidebar-download-buttons" />
                </div>
              </div>
            )}
            
            {/* Company Information Section */}
            <div className="sidebar-footer">
              <p className="footer-description">
                本工具主要是為了減輕SEO在資料研究上的負擔而設計
              </p>
              <p className="footer-description">
                若在執行上需要更深度的分析、顧問諮詢<br />
                歡迎透過以下方式與我們聯絡，我們一起讓好事發生
              </p>
              <div className="company-info">
                <h4 className="company-name">好事發生數位有限公司</h4>
                <div className="contact-info">
                  <p>Email: gary@ohya.co</p>
                  <p>Threads: <a href="https://www.threads.com/@ohya.studio" target="_blank" rel="noopener noreferrer">@ohya.studio</a></p>
                </div>
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
  console.log('🚀 Application starting up...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;