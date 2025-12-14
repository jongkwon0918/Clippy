import React from 'react';
import { Decision } from '../types';
import { BsPatchCheck } from "react-icons/bs";

interface DecisionCardProps {
  decision: Decision;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({ decision }) => {
  return (
    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
      <div className="flex-shrink-0 pt-1">
        <BsPatchCheck className="h-5 w-5 text-primary" />
      </div>
      <p className="text-dark">
        {decision.description}
      </p>
    </div>
  );
};