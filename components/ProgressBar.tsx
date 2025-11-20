import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, total, colorClass }) => {
  const percentage = Math.min((value / total) * 100, 100);
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)} h</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
