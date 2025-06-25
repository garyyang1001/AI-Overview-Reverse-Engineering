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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
          目標關鍵字 *
        </label>
        <input
          id="keyword"
          type="text"
          value={targetKeyword}
          onChange={(e) => setTargetKeyword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：如何挑選咖啡豆"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="userUrl" className="block text-sm font-medium text-gray-700 mb-1">
          您的網頁 URL *
        </label>
        <input
          id="userUrl"
          type="url"
          value={userPageUrl}
          onChange={(e) => setUserPageUrl(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/your-article"
          required
          disabled={isLoading}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              自動競爭對手分析
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              系統將自動從 Google AI Overview 中提取競爭對手網頁並進行分析，無需手動輸入。
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !targetKeyword || !userPageUrl}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
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