import React, { useState } from 'react';
import { FileDown, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { downloadBlob, generateFilename } from '../utils/download';

interface DownloadButtonsProps {
  jobId: string;
  className?: string;
}

export const DownloadButtons: React.FC<DownloadButtonsProps> = ({ jobId, className = '' }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [htmlLoading, setHtmlLoading] = useState(false);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/export/pdf/${jobId}`, {
        responseType: 'blob'
      });
      
      const filename = generateFilename('seo-analysis', 'pdf', jobId);
      downloadBlob(response.data, filename);
      
      toast.success('PDF 報告下載成功！');
    } catch (error: any) {
      console.error('PDF download failed:', error);
      
      if (error.response?.status === 404) {
        toast.error('找不到報告，請重新執行分析');
      } else if (error.response?.status === 400) {
        toast.error('報告尚未完成，請稍後再試');
      } else {
        toast.error('PDF 下載失敗，請稍後再試');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadHTML = async () => {
    setHtmlLoading(true);
    try {
      const response = await api.get(`/export/html/${jobId}`, {
        responseType: 'blob'
      });
      
      const filename = generateFilename('seo-analysis', 'html', jobId);
      downloadBlob(response.data, filename);
      
      toast.success('HTML 報告下載成功！');
    } catch (error: any) {
      console.error('HTML download failed:', error);
      
      if (error.response?.status === 404) {
        toast.error('找不到報告，請重新執行分析');
      } else if (error.response?.status === 400) {
        toast.error('報告尚未完成，請稍後再試');
      } else {
        toast.error('HTML 下載失敗，請稍後再試');
      }
    } finally {
      setHtmlLoading(false);
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <button
        onClick={handleDownloadPDF}
        disabled={pdfLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="下載 PDF 格式報告"
      >
        {pdfLoading ? (
          <>
            <Download className="w-5 h-5 animate-bounce" />
            <span>正在生成 PDF...</span>
          </>
        ) : (
          <>
            <FileDown className="w-5 h-5" />
            <span>下載 PDF 報告</span>
          </>
        )}
      </button>

      <button
        onClick={handleDownloadHTML}
        disabled={htmlLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="下載 HTML 格式報告"
      >
        {htmlLoading ? (
          <>
            <Download className="w-5 h-5 animate-bounce" />
            <span>正在生成 HTML...</span>
          </>
        ) : (
          <>
            <FileDown className="w-5 h-5" />
            <span>下載 HTML 報告</span>
          </>
        )}
      </button>
    </div>
  );
};