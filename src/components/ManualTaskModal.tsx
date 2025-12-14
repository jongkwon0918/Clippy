import React, { useState } from 'react';
import { Task } from '../types';
import { BsX, BsCheckLg, BsCalendarEvent } from "react-icons/bs";
import { v4 as uuidv4 } from 'uuid';
interface ManualTaskModalProps {
  onConfirm: (task: Omit<Task, 'id' | 'completed' | 'source' | 'assignee' | 'department'>) => void;
  onCancel: () => void;
}

export const ManualTaskModal: React.FC<ManualTaskModalProps> = ({ onConfirm, onCancel }) => {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [deadline, setDeadline] = useState('');
  const [includeTime, setIncludeTime] = useState(false);

  const handleConfirm = () => {
    if (!description.trim()) return;

    let finalDeadline = deadline;
    if (finalDeadline && includeTime) {
        finalDeadline = finalDeadline.replace('T', ' ');
    } else if (finalDeadline) {
        finalDeadline = finalDeadline.split('T')[0];
    } else {
        finalDeadline = '기한 없음';
    }

    onConfirm({
      description,
      priority,
      deadline: finalDeadline || '기한 없음',
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDeadline(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-dark">할 일 직접 추가</h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-dark mb-2">할 일 내용</label>
            <input 
                type="text" 
                placeholder="해야 할 일을 입력하세요" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-dark mb-2">우선순위</label>
            <div className="flex gap-2">
                {(['High', 'Medium', 'Low'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all border ${
                            priority === p 
                            ? p === 'High' ? 'bg-red-100 text-red-700 border-red-200' 
                            : p === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                            : 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {p === 'High' ? '높음' : p === 'Medium' ? '중간' : '낮음'}
                    </button>
                ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-dark">마감 기한</label>
                <button 
                    onClick={() => {
                        setIncludeTime(!includeTime);
                        setDeadline('');
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                >
                    {includeTime ? '날짜만 입력' : '시간 추가'}
                </button>
            </div>
            <div className="relative">
                <input 
                    type={includeTime ? "datetime-local" : "date"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white"
                    value={deadline}
                    onChange={handleDateChange}
                />
                {!deadline && (
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 text-sm">
                        <BsCalendarEvent className="h-5 w-5" />
                    </div>
                )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              onClick={onCancel} 
              className="flex-1 py-3.5 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-dark rounded-xl font-bold transition-all"
            >
              취소
            </button>
            <button 
              onClick={handleConfirm} 
              disabled={!description.trim()}
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all text-white shadow-md shadow-red-100 flex justify-center items-center gap-2 ${
                description.trim() ? 'bg-primary hover:bg-primary-hover hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <BsCheckLg className="h-5 w-5" />
              추가하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};