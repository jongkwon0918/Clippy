
import React, { useState, useEffect } from 'react';
import { AnalysisResult, Task } from '../types';
import { CheckIcon, XMarkIcon, SummaryIcon, UserIcon } from './icons';

interface ReviewScreenProps {
  result: AnalysisResult;
  context: 'personal' | 'team';
  teamMembers?: string[];
  onConfirm: (selectedTasks: Task[]) => void;
  onCancel: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ result, context, teamMembers, onConfirm, onCancel }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [editedTasks, setEditedTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Initialize editedTasks from result.tasks
    setEditedTasks([...result.tasks]);

    // Default select all tasks
    const allIds = result.tasks.map(t => t.id);
    setSelectedTaskIds(new Set(allIds));
  }, [result]);

  const handleToggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleAssigneeChange = (taskId: string, newAssignee: string) => {
    setEditedTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, assignee: newAssignee } : t
    ));
  };

  const handleConfirm = () => {
    const selectedTasks = editedTasks.filter(t => selectedTaskIds.has(t.id));
    onConfirm(selectedTasks);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <div>
            <h2 className="text-xl font-bold text-dark">분석 결과 검토</h2>
            <p className="text-sm text-gray-500">등록할 항목을 선택해주세요.</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        {/* Summary Section */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <SummaryIcon className="h-5 w-5" />
            <h3>요약 미리보기</h3>
          </div>
          <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">{result.summary}</p>
        </div>

        {/* Tasks Selection */}
        <div>
          <h3 className="font-bold text-dark mb-3 flex items-center justify-between">
            <span>추출된 할 일 ({editedTasks.length})</span>
            <span className="text-xs text-primary font-normal">
              {selectedTaskIds.size}개 선택됨
            </span>
          </h3>
          <div className="space-y-3">
            {editedTasks.map((task) => (
              <div 
                key={task.id}
                className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  selectedTaskIds.has(task.id) 
                    ? 'bg-white border-primary ring-1 ring-primary shadow-sm' 
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <div 
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center cursor-pointer ${
                        selectedTaskIds.has(task.id) ? 'bg-primary border-primary' : 'border-gray-400 bg-white'
                    }`}
                >
                    {selectedTaskIds.has(task.id) && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                </div>
                <div className="flex-grow">
                    <p className="text-sm font-medium text-dark mb-1">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {/* Assignee Selection for Team Context */}
                        {context === 'team' && teamMembers && teamMembers.length > 0 ? (
                            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                <UserIcon className="h-3 w-3" />
                                <select 
                                    value={task.assignee} 
                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs font-semibold text-dark cursor-pointer p-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <option value="미지정">담당자 선택</option>
                                    {teamMembers.map((member, idx) => (
                                        // Simple parsing to remove (Admin) for cleaner value if needed, 
                                        // but for now keeping full string for consistency
                                        <option key={idx} value={member.split(' (')[0]}>{member}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded">담당: {task.assignee}</span>
                        )}
                        
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded">{task.deadline}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0 rounded-b-2xl">
        <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
            취소
        </button>
        <button 
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-colors shadow-sm flex justify-center items-center gap-2"
        >
            <CheckIcon className="h-5 w-5" />
            <span>{selectedTaskIds.size}개 항목 등록하기</span>
        </button>
      </div>
    </div>
  );
};
