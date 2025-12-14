import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, User } from '../types';
import { BsPerson, BsFlag, BsPencil, BsTrash, BsCheckLg, BsArrowCounterclockwise, BsCalendarEvent, BsBriefcase, BsFileText, BsCheck, BsX } from "react-icons/bs";

interface TaskCardProps {
  task: Task;
  teamName?: string;
  currentUser?: User | null;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, teamName, currentUser, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const currentOffsetX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [editedAssignee, setEditedAssignee] = useState(task.assignee);
  const [editedPriority, setEditedPriority] = useState<Task['priority']>(task.priority);
  const [editedDeadline, setEditedDeadline] = useState(task.deadline);
  
  const [includeTime, setIncludeTime] = useState(false);

  useEffect(() => {
    setEditedDescription(task.description);
    setEditedAssignee(task.assignee);
    setEditedPriority(task.priority);
    setEditedDeadline(task.deadline);
    const hasTime = task.deadline.includes(':') || task.deadline.includes('T');
    setIncludeTime(hasTime);
  }, [task]);

  useEffect(() => {
      setOffsetX(0);
      currentOffsetX.current = 0;
  }, [task.completed]);

  const deadlineStatus = useMemo(() => {
    if (task.completed || !task.deadline || task.deadline === '기한 없음') return 'normal';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cleanDate = task.deadline.replace('T', ' ');
    const dateParts = cleanDate.split(' ')[0].split('-');
    if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const day = parseInt(dateParts[2]);
        const d = new Date(year, month, day);
        if (isNaN(d.getTime())) return 'normal';
        const diffTime = d.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 2) return 'nearing';
    }
    return 'normal';
  }, [task.deadline, task.completed]);

  const handleStart = (clientX: number) => {
      if (isEditing) return;
      setIsDragging(true);
      startX.current = clientX;
  };

  const handleMove = (clientX: number) => {
      if (!isDragging || isEditing) return;
      const diff = clientX - startX.current;
      if (!task.completed) {
          if (diff > 0) setOffsetX(Math.min(diff, 200)); 
      } else {
          if (diff < 0) setOffsetX(Math.max(diff, -200));
      }
      currentOffsetX.current = diff;
  };

  const handleEnd = () => {
      if (!isDragging || isEditing) return;
      setIsDragging(false);
      const threshold = 80;
      const currentOffset = offsetX;
      if (Math.abs(currentOffset) <= threshold) {
          setOffsetX(0);
          return;
      }
      if (!task.completed && currentOffset > threshold) {
          if (task.source === 'team' && currentUser) {
             const assignee = (task.assignee || '').trim().toLowerCase();
             const myName = (currentUser.name || '').trim().toLowerCase();
             const isMe = assignee === '나' || assignee === 'me';
             const isMyName = myName && assignee.includes(myName);
             if (!isMe && !isMyName) {
                 alert(`담당자(${task.assignee})만 상태를 변경할 수 있습니다.`);
                 setOffsetX(0);
                 return;
             }
          }
          onUpdate({ ...task, completed: true });
          setOffsetX(0);
      } 
      else if (task.completed && currentOffset < -threshold) {
          if (task.source === 'team' && currentUser) {
             const assignee = (task.assignee || '').trim().toLowerCase();
             const myName = (currentUser.name || '').trim().toLowerCase();
             const isMe = assignee === '나' || assignee === 'me';
             const isMyName = myName && assignee.includes(myName);
             if (!isMe && !isMyName) {
                 alert(`담당자(${task.assignee})만 상태를 변경할 수 있습니다.`);
                 setOffsetX(0);
                 return;
             }
          }
          onUpdate({ ...task, completed: false });
          setOffsetX(0);
      } 
      else {
          setOffsetX(0);
      }
  };

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if(isDragging) handleEnd(); };
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  const handleSave = () => {
    let finalDeadline = editedDeadline || '기한 없음';
    if (finalDeadline !== '기한 없음' && finalDeadline.includes('T')) {
        finalDeadline = finalDeadline.replace('T', ' ');
    }
    onUpdate({ 
        ...task, 
        description: editedDescription,
        assignee: editedAssignee,
        priority: editedPriority,
        deadline: finalDeadline
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setEditedDescription(task.description);
    setEditedAssignee(task.assignee);
    setEditedPriority(task.priority);
    setEditedDeadline(task.deadline);
    setIncludeTime(task.deadline.includes(':') || task.deadline.includes('T'));
    setIsEditing(false);
  };

  const formatDeadlineForInput = (val: string, withTime: boolean) => {
      if (!val || val === '기한 없음') return '';
      const standardVal = val.replace(' ', 'T');
      if (withTime) {
          if (!standardVal.includes('T')) return `${standardVal}T09:00`;
          return standardVal.substring(0, 16);
      } else {
          return standardVal.split('T')[0];
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      if (includeTime) {
          setEditedDeadline(val.replace('T', ' '));
      } else {
          setEditedDeadline(val);
      }
  };

  const toggleTimeInput = () => {
      const willIncludeTime = !includeTime;
      setIncludeTime(willIncludeTime);
      if (editedDeadline && editedDeadline !== '기한 없음') {
          const baseDate = editedDeadline.replace('T', ' ').split(' ')[0];
          if (willIncludeTime) {
              setEditedDeadline(`${baseDate} 09:00`);
          } else {
              setEditedDeadline(baseDate);
          }
      }
  };

  const priorityStyles: { [key in Task['priority']]: string } = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  };
  
  const priorityLabels: { [key in Task['priority']]: string } = {
    High: '높음',
    Medium: '중간',
    Low: '낮음',
  };

  const getContainerStyles = () => {
      if (isEditing) return 'bg-white border-primary ring-1 ring-primary';
      if (task.completed) return 'bg-white border-gray-100 opacity-80';
      switch (deadlineStatus) {
          case 'overdue': return 'bg-white border-red-300 ring-1 ring-red-100 shadow-sm';
          case 'nearing': return 'bg-white border-amber-300 ring-1 ring-amber-100 shadow-sm';
          default: return 'bg-white border-gray-200';
      }
  };

  return (
    <div className="relative select-none touch-pan-y mb-3">
        {/* Swipe Background */}
        <div className="absolute inset-0 rounded-lg flex items-center justify-between px-6 overflow-hidden">
            <div 
                className={`flex items-center gap-2 font-bold transition-opacity duration-300 ${!task.completed && offsetX > 0 ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: `scale(${Math.min(offsetX / 50, 1.2)})` }}
            >
                <div className="bg-green-500 text-white p-2 rounded-full shadow-sm"><BsCheckLg className="h-6 w-6" /></div>
                <span className="text-green-600 text-sm">완료!</span>
            </div>
            <div 
                className={`flex items-center gap-2 font-bold transition-opacity duration-300 ml-auto ${task.completed && offsetX < 0 ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: `scale(${Math.min(Math.abs(offsetX) / 50, 1.2)})` }}
            >
                <span className="text-amber-600 text-sm">취소</span>
                <div className="bg-amber-500 text-white p-2 rounded-full shadow-sm"><BsArrowCounterclockwise className="h-6 w-6" /></div>
            </div>
        </div>

        {/* Card Content */}
        <div 
            ref={cardRef}
            className={`p-4 rounded-lg transition-transform duration-200 border ${getContainerStyles()} relative flex flex-col shadow-sm`}
            style={{ 
                transform: `translateX(${offsetX}px)`,
                cursor: isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab')
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {isEditing ? (
                <div className="space-y-3" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500">할 일 내용</label>
                        <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2" rows={2} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500">담당자</label>
                            <input type="text" value={editedAssignee} onChange={(e) => setEditedAssignee(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500">우선순위</label>
                            <select value={editedPriority} onChange={(e) => setEditedPriority(e.target.value as Task['priority'])} className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2">
                                <option value="High">높음</option><option value="Medium">중간</option><option value="Low">낮음</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 flex justify-between"><span>마감 기한</span><button onClick={toggleTimeInput} className="text-[10px] text-primary underline">{includeTime ? '날짜만' : '시간'}</button></label>
                            <input type={includeTime ? "datetime-local" : "date"} value={formatDeadlineForInput(editedDeadline, includeTime)} onChange={handleDateChange} className="w-full border-gray-300 rounded-md shadow-sm text-sm p-2" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancel} className="p-2 text-gray-600 bg-gray-200 rounded-lg"><BsX className="h-5 w-5" /></button>
                        <button onClick={handleSave} className="p-2 text-white bg-green-500 rounded-lg"><BsCheck className="h-5 w-5" /></button>
                    </div>
                </div>
            ) : (
                <>
                    {/* ✅ Row 1: Badges (Team/Status) + Actions (Edit/Delete) - Flex Between */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {task.source === 'team' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">
                                    <BsBriefcase className="h-3 w-3" />
                                    {teamName || '팀'}
                                </span>
                            )}
                            {!task.completed && deadlineStatus === 'overdue' && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">마감 지남</span>}
                            {!task.completed && deadlineStatus === 'nearing' && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">마감 임박</span>}
                        </div>
                        
                        <div className="flex gap-1" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-primary rounded-full" title="수정"><BsPencil className="h-4 w-4" /></button>
                            <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full" title="삭제"><BsTrash className="h-4 w-4" /></button>
                        </div>
                    </div>

                    {/* ✅ Row 2: Description (Full Width) */}
                    <div className="mb-3">
                        <p className={`text-dark text-sm font-medium transition-all leading-relaxed ${task.completed ? 'line-through text-gray-400' : ''}`}>
                            {task.description}
                        </p>
                    </div>

                    {/* ✅ Row 3: Meta Info (User, Priority, Date) - All in one line */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-xs text-gray-500 border-t border-gray-50 pt-2">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <BsPerson className="h-3 w-3" />
                            <span>{task.assignee}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded font-bold ${task.completed ? 'bg-gray-100 text-gray-500' : priorityStyles[task.priority]}`}>
                            <BsFlag className="h-3 w-3" />
                            <span>{priorityLabels[task.priority]}</span>
                        </div>
                        {/* ✅ Date moved here */}
                        {(task.deadline && task.deadline !== '기한 없음') ? (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded font-semibold ${
                                task.completed ? 'bg-gray-50 text-gray-400' :
                                deadlineStatus === 'overdue' ? 'bg-red-50 text-red-600' :
                                deadlineStatus === 'nearing' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-50 text-gray-600'
                            }`}>
                                <BsCalendarEvent className="h-3 w-3" />
                                <span>{task.deadline}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-400">
                                <BsCalendarEvent className="h-3 w-3" />
                                <span>기한 없음</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {task.relatedSummary && !isEditing && (
                <div className="mt-2 border-t border-gray-100 pt-2" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                    <button onClick={() => setShowSummary(!showSummary)} className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary">
                        <BsFileText className="h-3 w-3" />
                        {showSummary ? "요약 접기" : "요약 보기"}
                    </button>
                    {showSummary && <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{task.relatedSummary}</div>}
                </div>
            )}
        </div>
    </div>
  );
};