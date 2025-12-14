
import React, { useState, useMemo } from 'react';
import { Task, Team, User } from '../types';
import { TaskCard } from './TaskCard';
import { BsCardChecklist, BsCheckAll } from "react-icons/bs";

interface MyTasksScreenProps {
  tasks: Task[];
  teams: Team[];
  currentUser: User | null;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type FilterType = 'all' | 'personal' | 'team';

export const MyTasksScreen: React.FC<MyTasksScreenProps> = ({ tasks, teams, currentUser, onUpdateTask, onDeleteTask }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Helper to find team name
  const getTeamName = (teamId?: string) => {
      if (!teamId) return undefined;
      return teams.find(t => t.id === teamId)?.name;
  };

  // Helper to check if a task is assigned to "Me" or the Current User's Name
  const isAssignedToMe = (assignee: string) => {
      if (!assignee) return false;
      const lowerAssignee = assignee.toLowerCase();
      const userName = currentUser?.name?.toLowerCase();
      
      // Check for generic 'me'
      if (lowerAssignee.includes('나') || lowerAssignee === 'me') return true;
      
      // Check if task assignee matches the current user's name
      if (userName && lowerAssignee.includes(userName)) return true;
      
      // Optional: Check unassigned? Assuming strict assignment for now
      if (lowerAssignee.includes('미지정')) return true;

      return false;
  };

  const filteredTasks = useMemo(() => {
    // Filter Logic
    return tasks.filter(task => {
        const isMine = isAssignedToMe(task.assignee);

        if (filter === 'all') {
            // Show: Personal tasks OR (Team tasks assigned to Me)
            if (task.source === 'personal') return true;
            if (task.source === 'team' && isMine) return true;
            return false;
        }

        if (filter === 'personal') {
            // Show: Only Personal tasks
            return task.source === 'personal';
        }

        if (filter === 'team') {
            // Show: Only Team tasks assigned to Me
            return task.source === 'team' && isMine;
        }

        return true;
    });
  }, [tasks, filter, currentUser]);

  const activeTasks = useMemo(() => {
      return filteredTasks.filter(t => !t.completed).sort((a, b) => {
          if (a.deadline === '기한 없음') return 1;
          if (b.deadline === '기한 없음') return -1;
          return a.deadline.localeCompare(b.deadline);
      });
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
      return filteredTasks.filter(t => t.completed).sort((a, b) => {
          if (a.deadline === '기한 없음') return 1;
          if (b.deadline === '기한 없음') return -1;
          return b.deadline.localeCompare(a.deadline);
      });
  }, [filteredTasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BsCardChecklist className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-medium">등록된 할 일이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-dark">할 일 목록</h2>
          
          {/* Filter Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  전체
              </button>
              <button 
                onClick={() => setFilter('personal')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'personal' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  개인 업무
              </button>
              <button 
                onClick={() => setFilter('team')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'team' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  팀 업무
              </button>
          </div>
      </div>

      <div className="space-y-6">
        {/* Active Tasks */}
        <div className="space-y-3">
            {activeTasks.length > 0 ? (
                activeTasks.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    teamName={getTeamName(task.teamId)}
                    currentUser={currentUser}
                    onUpdate={onUpdateTask} 
                    onDelete={onDeleteTask} 
                />
                ))
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-medium text-sm">
                        진행 중인 할 일이 없습니다.
                    </p>
                </div>
            )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
            <div>
                <div className="flex items-center gap-2 mb-3 mt-6 border-t border-gray-100 pt-4">
                    <BsCheckAll className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-500">완료된 할 일 ({completedTasks.length})</h3>
                </div>
                <div className="space-y-3 opacity-80">
                    {completedTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        teamName={getTeamName(task.teamId)}
                        currentUser={currentUser}
                        onUpdate={onUpdateTask} 
                        onDelete={onDeleteTask} 
                    />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
