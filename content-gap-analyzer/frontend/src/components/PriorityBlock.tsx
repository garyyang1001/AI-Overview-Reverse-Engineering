import React from 'react';

interface PriorityBlockProps {
  priority: 'P1' | 'P2' | 'P3';
  title: string;
  children: React.ReactNode;
}

const PriorityBlock: React.FC<PriorityBlockProps> = ({ priority, title, children }) => {
  const headerClass = `priority-header ${priority.toLowerCase()}`;

  return (
    <div className="priority-block">
      <div className={headerClass}>
        {priority} - {title}
      </div>
      <div className="priority-body">
        {children}
      </div>
    </div>
  );
};

export default PriorityBlock;
