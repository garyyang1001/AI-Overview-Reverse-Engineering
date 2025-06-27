import React, { useState } from 'react';
import { AnalysisRequest } from '../../../shared/types';
import { Loader2 } from 'lucide-react';

interface AnalysisFormProps {
  onSubmit: (data: AnalysisRequest) => void;
  isLoading: boolean;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onSubmit, isLoading }) => {
  const [targetKeyword, setTargetKeyword] = useState('');
  const [userPageUrl, setUserPageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetKeyword,
      userPageUrl,
    });
  };


  return (
    <form onSubmit={handleSubmit} className="form-group-spacing">
      <div>
        <label htmlFor="keyword" className="form-label">
          目標關鍵字 *
        </label>
        <input
          id="keyword"
          type="text"
          value={targetKeyword}
          onChange={(e) => setTargetKeyword(e.target.value)}
          className="form-input"
          placeholder="例如：如何挑選咖啡豆"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="userUrl" className="form-label">
          您的網頁 URL *
        </label>
        <input
          id="userUrl"
          type="url"
          value={userPageUrl}
          onChange={(e) => setUserPageUrl(e.target.value)}
          className="form-input"
          placeholder="https://example.com/your-article"
          required
          disabled={isLoading}
        />
      </div>

      <div className="info-box">
        <svg className="info-box-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="info-box-content">
          <h3 className="info-box-title">
            自動競爭對手分析
          </h3>
          <p className="info-box-description">
            系統將自動從 Google AI Overview 中提取競爭對手網頁並進行分析，無需手動輸入。
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !targetKeyword || !userPageUrl}
        className="primary-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="loader-icon" />
            分析中...
          </>
        ) : (
          '開始分析'
        )}
      </button>
    </form>
  );
};

export default AnalysisForm;