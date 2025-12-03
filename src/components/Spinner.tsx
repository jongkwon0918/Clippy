
import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full min-h-[300px] bg-white">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
      <p className="mt-4 text-lg font-semibold text-dark">Clippy가 생각 중입니다...</p>
      <p className="text-medium">문서를 분석하고 있습니다.</p>
    </div>
  );
};
