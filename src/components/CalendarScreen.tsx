import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';
import { TaskCard } from './TaskCard';
import { BsChevronLeft, BsChevronRight, BsX } from "react-icons/bs";

interface CalendarScreenProps {
  tasks: Task[];
  currentUser?: User | null;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ tasks, currentUser, onUpdateTask, onDeleteTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const tasksByDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
        if (task.deadline && task.deadline !== '기한 없음') {
            try {
                const cleanDate = task.deadline.replace('T', ' ').trim();
                const match = cleanDate.match(/^(\d{4}-\d{2}-\d{2})/);
                
                let dateKey = '';
                if (match) {
                    dateKey = match[1];
                } else {
                    const d = new Date(cleanDate);
                    if (!isNaN(d.getTime())) {
                         const year = d.getFullYear();
                         const month = String(d.getMonth() + 1).padStart(2, '0');
                         const day = String(d.getDate()).padStart(2, '0');
                         dateKey = `${year}-${month}-${day}`;
                    }
                }

                if (dateKey) {
                    if (!acc[dateKey]) {
                        acc[dateKey] = [];
                    }
                    acc[dateKey].push(task);
                }
            } catch(e) {
                console.warn(`Invalid date format for task deadline: ${task.deadline}`);
            }
        }
        return acc;
    }, {} as Record<string, Task[]>);
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    return tasksByDate[dateKey] || [];
  }, [selectedDate, tasksByDate]);
  
  const changeMonth = (amount: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`blank-${i}`} className="border-r border-b border-gray-200 min-h-[80px]"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${d}`;

      const dayTasks = tasksByDate[dateKey] || [];
      
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <div 
          key={day} 
          className={`p-1 border-r border-b border-gray-200 cursor-pointer transition-colors min-h-[80px] flex flex-col items-center ${isSelected ? 'bg-red-50 ring-2 ring-inset ring-primary' : 'hover:bg-gray-50'}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className={`text-xs font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-dark'}`}>
            {day}
          </span>
          
          <div className="flex flex-col gap-1 w-full px-1">
             {dayTasks.slice(0, 3).map((task) => (
                 <div key={task.id} className={`h-1.5 w-full rounded-full ${
                     task.priority === 'High' ? 'bg-red-400' : 
                     task.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                 }`} />
             ))}
             {dayTasks.length > 3 && (
                 <span className="text-[8px] text-gray-400 text-center">+{dayTasks.length - 3}</span>
             )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <BsChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-dark">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100">
          <BsChevronRight className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center font-semibold text-sm text-gray-500 py-2 border-r border-b border-gray-200 bg-gray-50">{day}</div>
        ))}
        {renderDays()}
      </div>
      
      {selectedDate && (
        <>
        <div className="fixed inset-0 bg-black bg-opacity-30 z-20" onClick={() => setSelectedDate(null)}></div>
        <div className="fixed bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out translate-y-0 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-bold text-dark">
                    {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="p-2 rounded-full hover:bg-gray-100">
                    <BsX className="h-6 w-6 text-gray-600" />
                </button>
            </div>
            <div className="overflow-y-auto space-y-3 pb-10">
                {selectedDayTasks.length > 0 ? (
                    selectedDayTasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            currentUser={currentUser}
                            onUpdate={onUpdateTask} 
                            onDelete={onDeleteTask} 
                        />
                    ))
                ) : (
                    <div className="py-10 text-center text-gray-400">
                        <p>등록된 일정이 없습니다.</p>
                    </div>
                )}
            </div>
        </div>
        </>
      )}
    </div>
  );
};