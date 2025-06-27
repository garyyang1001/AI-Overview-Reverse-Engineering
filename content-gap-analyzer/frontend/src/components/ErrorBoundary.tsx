import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 ErrorBoundary: React Error Caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🚨 React Error Boundary - Component Crash');
    console.error('💥 Error:', error);
    console.error('📍 Error Info:', errorInfo);
    console.error('📊 Component Stack:', errorInfo.componentStack);
    console.error('🔗 Error Stack:', error.stack);
    console.groupEnd();

    // Update state with error details for debugging
    this.setState({
      error,
      errorInfo,
    });

    // Log additional debugging information
    console.error('🔧 Debug Information:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorMessage: error.message,
      errorName: error.name,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h1 className="error-boundary-title">
              🚨 應用程式發生錯誤
            </h1>
            
            <p className="error-boundary-message">
              很抱歉，應用程式遇到了未預期的錯誤。請檢查瀏覽器開發者工具的 Console 以獲得詳細的錯誤資訊。
            </p>

            <div className="error-boundary-actions">
              <button 
                className="error-boundary-reload-btn"
                onClick={() => window.location.reload()}
              >
                🔄 重新載入頁面
              </button>
              
              <button 
                className="error-boundary-console-btn"
                onClick={() => {
                  console.clear();
                  console.error('🚨 Error Boundary State:', this.state);
                  alert('錯誤詳情已輸出到 Console，請按 F12 開啟開發者工具查看');
                }}
              >
                🔍 查看錯誤詳情
              </button>
            </div>

            {/* Development mode error details */}
            {process.env.NODE_ENV === 'development' && (
              <details className="error-boundary-details">
                <summary>🛠️ 開發者錯誤詳情</summary>
                <div className="error-boundary-debug">
                  <h3>錯誤訊息:</h3>
                  <pre>{this.state.error?.message}</pre>
                  
                  <h3>錯誤堆疊:</h3>
                  <pre>{this.state.error?.stack}</pre>
                  
                  <h3>組件堆疊:</h3>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;