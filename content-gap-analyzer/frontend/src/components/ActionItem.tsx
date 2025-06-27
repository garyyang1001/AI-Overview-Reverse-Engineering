import React from 'react';
import GeminiPromptWrapper from './GeminiPromptWrapper';

interface ActionItemProps {
  title: string;
  description: string;
  geminiPrompt: string;
  implementation?: string;
  specificSteps?: string[];
  measurableGoals?: string[];
}

const ActionItem: React.FC<ActionItemProps> = ({
  title,
  description,
  geminiPrompt,
  implementation,
  specificSteps,
  measurableGoals,
}) => {
  return (
    <div className="action-item">
      <h3 className="item-suggestion-title">改善建議：{title}</h3>
      <p className="item-suggestion-desc">{description}</p>
      {implementation && <p className="item-suggestion-desc">**實施方式:** {implementation}</p>}

      {specificSteps && specificSteps.length > 0 && (
        <div className="item-details">
          <h4>具體步驟:</h4>
          <ul>
            {specificSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      {measurableGoals && measurableGoals.length > 0 && (
        <div className="item-details">
          <h4>可衡量目標:</h4>
          <ul>
            {measurableGoals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      <GeminiPromptWrapper promptContent={geminiPrompt} />
    </div>
  );
};

export default ActionItem;
