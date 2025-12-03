import React from 'react';
import { SummaryIcon } from './icons';

interface SummaryCardProps {
  summary: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-3">
        <SummaryIcon className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-dark ml-2">요약</h3>
      </div>
      <p className="text-medium leading-relaxed">
        {summary}
      </p>
    </div>
  );
};