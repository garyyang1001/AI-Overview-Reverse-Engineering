import React from 'react';

interface GeminiPromptWrapperProps {
  promptContent: string;
}

const GeminiPromptWrapper: React.FC<GeminiPromptWrapperProps> = ({ promptContent }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(promptContent);
    alert('Prompt 已複製到剪貼簿！'); // 可以替換為更優雅的通知
  };

  return (
    <div className="item-prompt-wrapper">
      <div className="prompt-header">
        <span>Gemini Prompt</span>
        <button className="copy-button" onClick={handleCopy}>
          複製
        </button>
      </div>
      <div className="prompt-body">
        <pre><code>{promptContent}</code></pre>
      </div>
      <div className="prompt-note">
        <strong>【重要提示】</strong> AI產出的內容僅供參考與發想，不建議直接複製貼上使用。 請務必根據您的品牌語氣、專業知識進行審核、潤飾與事實查核，尤其涉及費用、時間等即時性資訊。
      </div>
    </div>
  );
};

export default GeminiPromptWrapper;
