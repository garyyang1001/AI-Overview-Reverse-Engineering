import React from 'react';
import { AIOverviewData } from '../types';

interface AIOverviewDisplayProps {
  aiOverviewData: AIOverviewData;
  targetKeyword: string;
}

const AIOverviewDisplay: React.FC<AIOverviewDisplayProps> = ({ 
  aiOverviewData, 
  targetKeyword 
}) => {
  if (!aiOverviewData) {
    return null;
  }

  return (
    <div className="ai-overview-section">
      <h3 className="section-title">
        📊 Google AI Overview for "{targetKeyword}"
      </h3>
      
      <div className="ai-overview-card">
        <div className="ai-overview-header">
          <span className="ai-overview-badge">AI Overview</span>
          <span className="reference-count">
            {aiOverviewData.references.length} 個引用來源
          </span>
        </div>
        
        <div className="ai-overview-content">
          <p>{aiOverviewData.summaryText}</p>
        </div>
        
        {aiOverviewData.references.length > 0 && (
          <div className="ai-overview-footer">
            <span className="footer-label">Google 引用的網站：</span>
            <div className="reference-links">
              {aiOverviewData.references.slice(0, 3).map((url, index) => (
                <a 
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reference-link"
                >
                  {new URL(url).hostname}
                </a>
              ))}
              {aiOverviewData.references.length > 3 && (
                <span className="more-references">
                  +{aiOverviewData.references.length - 3} 更多
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOverviewDisplay;