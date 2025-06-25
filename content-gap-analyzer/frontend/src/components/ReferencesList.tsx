import React, { useState } from 'react';

interface ReferencesListProps {
  references: string[];
  title?: string;
}

const ReferencesList: React.FC<ReferencesListProps> = ({ 
  references, 
  title = "AI Overview 引用來源"
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!references || references.length === 0) {
    return null;
  }

  const displayReferences = isExpanded ? references : references.slice(0, 5);

  return (
    <div className="references-section">
      <h4 className="references-title">
        🔗 {title} ({references.length})
      </h4>
      
      <div className="references-list">
        {displayReferences.map((url, index) => {
          try {
            const domain = new URL(url).hostname;
            const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
            
            return (
              <div key={index} className="reference-item">
                <img 
                  src={favicon} 
                  alt={domain}
                  className="reference-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <a 
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reference-url"
                  title={url}
                >
                  <span className="reference-domain">{domain}</span>
                  <span className="reference-path">
                    {new URL(url).pathname.substring(0, 50)}
                    {new URL(url).pathname.length > 50 ? '...' : ''}
                  </span>
                </a>
                <span className="reference-index">#{index + 1}</span>
              </div>
            );
          } catch (error) {
            return (
              <div key={index} className="reference-item">
                <span className="reference-invalid">❌</span>
                <span className="reference-url invalid" title={url}>
                  {url.substring(0, 60)}
                  {url.length > 60 ? '...' : ''}
                </span>
                <span className="reference-index">#{index + 1}</span>
              </div>
            );
          }
        })}
      </div>
      
      {references.length > 5 && (
        <button 
          className="expand-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : `顯示全部 ${references.length} 個引用來源`}
        </button>
      )}
    </div>
  );
};

export default ReferencesList;