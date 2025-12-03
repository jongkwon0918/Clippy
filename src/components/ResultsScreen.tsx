import React from 'react';
import { AnalysisResult, Task } from '../types';
import { TaskCard } from './TaskCard';
import { SummaryCard } from './SummaryCard';
import { DecisionCard } from './DecisionCard';
import { CheckAllIcon, DecisionIcon, RegenerateIcon, StartOverIcon } from './icons';

interface ResultsScreenProps {
  result: AnalysisResult;
  fileName: string;
  onRegenerate: () => void;
  onStartOver: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, fileName, onRegenerate, onStartOver, onUpdateTask, onDeleteTask }) => {

  const tasks = result.tasks || [];
  const decisions = result.decisions || [];

  const groupedTasks = tasks.reduce((acc, task) => {
    const { department } = task;
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark">분석 완료</h2>
          <p className="text-medium text-sm">분석 결과: <span className="font-semibold">{fileName}</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onRegenerate} className="flex items-center gap-2 bg-red-100 text-primary font-semibold py-2 px-4 rounded-lg hover:bg-red-200 transition-colors text-sm">
            <RegenerateIcon className="h-4 w-4" />
            다시 생성
          </button>
          <button onClick={onStartOver} className="flex items-center gap-2 bg-gray-200 text-dark font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm">
            <StartOverIcon className="h-4 w-4" />
            처음부터
          </button>
        </div>
      </div>
      
      <SummaryCard summary={result.summary} />

      {decisions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <DecisionIcon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-dark ml-2">주요 결정사항</h3>
            </div>
            <div className="space-y-3">
                {decisions.map(decision => (
                    <DecisionCard key={decision.id} decision={decision} />
                ))}
            </div>
        </div>
      )}
      
      {tasks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
                <CheckAllIcon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-bold text-dark ml-2">파트별 할 일</h3>
            </div>
            <div className="space-y-6">
                {Object.entries(groupedTasks).map(([department, departmentTasks]: [string, Task[]]) => (
                    <div key={department}>
                        <h4 className="font-bold text-md text-dark pb-2 mb-3 border-b border-gray-200">{department}</h4>
                        <div className="space-y-3">
                            {departmentTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    onUpdate={onUpdateTask} 
                                    onDelete={onDeleteTask}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {tasks.length === 0 && decisions.length === 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-medium">분석 결과에서 할 일이나 결정사항을 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  );
};