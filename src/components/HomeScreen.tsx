
import React, { useMemo } from 'react';
import { AnalysisResult, Team } from '../types';
import { SummaryIcon, UserGroupIcon, CheckIcon, TrashIcon } from './icons';

interface HomeScreenProps {
  analysisResult: AnalysisResult | null;
  fileName: string;
  teams: Team[];
  onUploadClick: () => void;
  onDeleteTeam: (teamId: string) => void;
  onNavigateToMyTasks: () => void;
  onNavigateToTeam: (teamId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
    analysisResult, fileName, teams, onUploadClick, onDeleteTeam, onNavigateToMyTasks, onNavigateToTeam 
}) => {
  
  // Priority Logic: Find first High priority task, otherwise first Medium, otherwise first available.
  const priorityTask = useMemo(() => {
    if (!analysisResult) return null;
    return (
      analysisResult.tasks.find(t => t.priority === 'High' && !t.completed) ||
      analysisResult.tasks.find(t => t.priority === 'Medium' && !t.completed) ||
      analysisResult.tasks.find(t => !t.completed)
    );
  }, [analysisResult]);

  // Workspace Logic: Count active tasks by Team
  const teamStats = useMemo(() => {
    if (!teams || teams.length === 0) return [];
    
    return teams.map(team => {
        // Count tasks that belong to this team and are NOT completed
        const activeCount = analysisResult?.tasks.filter(
            t => t.teamId === team.id && !t.completed
        ).length || 0;
        
        return {
            id: team.id,
            name: team.name,
            activeCount
        };
    }).sort((a, b) => b.activeCount - a.activeCount); // Sort by busiest teams
  }, [analysisResult, teams]);

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="bg-red-50 p-6 rounded-full">
          <SummaryIcon className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-dark mb-2">환영합니다!</h2>
          <p className="text-medium max-w-xs mx-auto">
            아직 분석된 회의록이 없습니다.<br/>
            우측 하단의 + 버튼을 눌러 시작해보세요.
          </p>
        </div>
        <button 
          onClick={onUploadClick}
          className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-hover transition-colors"
        >
          회의록 분석하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div>
        <h2 className="text-xl font-bold text-dark">홈 대시보드</h2>
        <p className="text-sm text-medium">오늘의 업무 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Today's Task Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-dark">오늘의 할 일</h3>
          <span 
            onClick={onNavigateToMyTasks}
            className="text-xs text-primary font-semibold cursor-pointer hover:underline"
          >
            더보기
          </span>
        </div>
        {priorityTask ? (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
            <div className="pl-3">
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                  {priorityTask.priority === 'High' ? '긴급' : '우선'}
                </span>
                <span className="text-xs text-gray-500">{priorityTask.deadline || '기한 미정'}</span>
              </div>
              <h4 className="text-lg font-bold text-dark mb-1 line-clamp-1">{priorityTask.description}</h4>
              <div className="flex items-center text-sm text-medium mt-2">
                <span className="mr-2">담당자: {priorityTask.assignee}</span>
                <span className="text-gray-300">|</span>
                <span className="ml-2">{priorityTask.department}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <CheckIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-medium">진행 중인 우선 작업이 없습니다.</p>
          </div>
        )}
      </section>

      {/* Recent Summary Section */}
      <section>
        <h3 className="text-lg font-bold text-dark mb-3">최근 생성된 요약</h3>
        <div className="bg-gradient-to-br from-red-500 to-orange-500 p-5 rounded-xl shadow-md text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <SummaryIcon className="h-5 w-5" />
              <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
            </div>
            <div className="space-y-2">
              {analysisResult.decisions.slice(0, 3).map((decision, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm opacity-90">
                  <span className="mt-1.5 w-1 h-1 bg-white rounded-full flex-shrink-0"></span>
                  <p className="line-clamp-2 leading-relaxed">{decision.description}</p>
                </div>
              ))}
              {analysisResult.decisions.length === 0 && (
                  <p className="text-sm opacity-80">주요 결정사항이 없습니다.</p>
              )}
            </div>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
        </div>
      </section>

      {/* Team Workspace Section */}
      <section>
        <h3 className="text-lg font-bold text-dark mb-3">팀 워크스페이스</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamStats.length > 0 ? (
            teamStats.map((team) => (
              <div 
                key={team.id} 
                onClick={() => onNavigateToTeam(team.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-primary hover:bg-red-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <UserGroupIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-dark truncate max-w-[120px]">{team.name}</h5>
                    <p className="text-xs text-medium">잔여 업무</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${team.activeCount > 0 ? 'text-primary' : 'text-gray-300'}`}>
                        {team.activeCount}
                    </span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            if(window.confirm(`'${team.name}' 팀을 삭제하시겠습니까?`)) {
                                onDeleteTeam(team.id);
                            }
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="팀 삭제"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-6 rounded-xl text-center border border-dashed border-gray-200">
              <UserGroupIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-medium text-sm mb-1">생성된 팀이 없습니다.</p>
              <p className="text-xs text-gray-400">'팀 할 일' 탭에서 새로운 팀을 만들어보세요.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
