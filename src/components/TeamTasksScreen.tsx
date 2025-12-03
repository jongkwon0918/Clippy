import React, { useState, useEffect, useMemo } from 'react';
import { Task, Announcement, Team, User } from '../types';
import { TaskCard } from './TaskCard';
import { UserGroupIcon, PlusIcon, MegaphoneIcon, UserPlusIcon, XMarkIcon, CogIcon, TrashIcon, CheckAllIcon } from './icons';
import { UploadScreen } from './UploadScreen';

interface TeamTasksScreenProps {
  tasks: Task[];
  teams: Team[];
  announcements: Announcement[];
  initialTeamId: string | null;
  currentUser: User | null;
  onCreateTeam: (teamName: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onLeaveTeam: (teamId: string) => void;
  onJoinTeam: (teamId: string, inviteCode: string) => void; // Renamed logic to match App.tsx intent (Add member via code)
  onAddAnnouncement: (content: string, teamId: string) => void;
  onTeamTaskUpload: (file: File | null, text: string | null, teamId: string) => void;
  onManualCreate: (teamId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TeamTasksScreen: React.FC<TeamTasksScreenProps> = ({ 
    tasks, teams, announcements, initialTeamId, currentUser, onCreateTeam, onDeleteTeam, onLeaveTeam, onJoinTeam, onAddAnnouncement, onTeamTaskUpload, onManualCreate, onUpdateTask, onDeleteTask 
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notices'>('tasks');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState(''); // Changed to code
  const [showTaskModal, setShowTaskModal] = useState(false); 
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');

  // Handle Initial Team ID Selection (Deep Linking)
  useEffect(() => {
      if (initialTeamId && teams.find(t => t.id === initialTeamId)) {
          setSelectedTeamId(initialTeamId);
      }
  }, [initialTeamId, teams]);

  useEffect(() => {
      if (teams.length > 0 && !teams.find(t => t.id === selectedTeamId)) {
          setSelectedTeamId(teams[0].id);
      }
  }, [teams, selectedTeamId]);

  const currentTeam = teams.find(t => t.id === selectedTeamId);

  const handleCreateTeam = () => {
      if (newTeamName.trim()) {
          onCreateTeam(newTeamName);
          setNewTeamName('');
          setShowCreateTeam(false);
      }
  };

  const handleAddNotice = () => {
      if (noticeContent.trim() && currentTeam) {
          onAddAnnouncement(noticeContent, currentTeam.id);
          setNoticeContent('');
          setShowNoticeModal(false);
      }
  };

  const handleInviteSubmit = () => {
      if (inviteCode.trim() && currentTeam) {
          onJoinTeam(currentTeam.id, inviteCode.trim());
          setInviteCode('');
          setShowInviteModal(false);
      }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === 'create_new') {
          setShowCreateTeam(true);
      } else {
          setSelectedTeamId(value);
      }
  };

  // Filter data by current selected Team ID
  const teamTasks = useMemo(() => tasks.filter(t => t.teamId === selectedTeamId), [tasks, selectedTeamId]);
  const teamAnnouncements = announcements.filter(a => a.teamId === selectedTeamId);

  const activeTeamTasks = teamTasks.filter(t => !t.completed);
  const completedTeamTasks = teamTasks.filter(t => t.completed);

  const renderCreateTeamModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
                <UserGroupIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-dark">새 팀 만들기</h3>
          </div>
          <button 
            onClick={() => setShowCreateTeam(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <label className="block text-sm font-bold text-dark mb-2">팀 이름</label>
            <input 
                type="text" 
                placeholder="예: 마케팅팀, 디자인팀" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white placeholder-gray-400"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
            />
            <p className="text-xs text-medium mt-2 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                팀원들을 초대하여 업무를 공유할 수 있는 공간입니다.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateTeam(false)} 
              className="flex-1 py-3.5 text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-dark rounded-xl font-bold transition-all"
            >
              취소
            </button>
            <button 
              onClick={handleCreateTeam} 
              disabled={!newTeamName.trim()}
              className={`flex-1 py-3.5 rounded-xl font-bold transition-all text-white shadow-md shadow-red-100 flex justify-center items-center gap-2 ${
                newTeamName.trim() ? 'bg-primary hover:bg-primary-hover hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <PlusIcon className="h-5 w-5" />
              팀 생성하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsModal = () => {
      if (!currentTeam) return null;
      const isOwner = currentTeam.createdBy === 'me' || (currentUser && currentTeam.createdBy === currentUser.username);

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                  <CogIcon className="h-5 w-5 text-gray-500" />
                  팀 설정
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">팀 이름</h4>
                  <p className="text-lg font-bold text-dark">{currentTeam.name}</p>
              </div>

              <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">멤버 목록 ({currentTeam.members.length})</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-[150px] overflow-y-auto">
                      {currentTeam.members.map((member, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-dark font-medium">{member}</span>
                              {member.includes('Admin') && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">관리자</span>}
                          </div>
                      ))}
                  </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                  {isOwner ? (
                       <button 
                       onClick={() => {
                           if(window.confirm(`'${currentTeam.name}' 팀을 영구적으로 삭제하시겠습니까?\n모든 공지사항과 할 일이 함께 삭제됩니다.`)) {
                               onDeleteTeam(currentTeam.id);
                               setShowSettingsModal(false);
                           }
                       }}
                       className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                     >
                       <TrashIcon className="h-5 w-5" />
                       팀 삭제하기
                     </button>
                  ) : (
                      <button 
                      onClick={() => {
                          if(window.confirm(`'${currentTeam.name}' 팀에서 나가시겠습니까?`)) {
                              onLeaveTeam(currentTeam.id);
                              setShowSettingsModal(false);
                          }
                      }}
                      className="w-full py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      팀 나가기
                    </button>
                  )}
                  <p className="text-center text-xs text-gray-400 mt-3">
                      {isOwner ? '팀을 삭제하면 복구할 수 없습니다.' : '팀에서 나가면 다시 초대받아야 합니다.'}
                  </p>
              </div>
            </div>
          </div>
        </div>
      );
  }

  if (teams.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <div className="bg-red-50 p-6 rounded-full mb-6">
                <UserGroupIcon className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-dark mb-2">팀 워크스페이스</h2>
            <p className="text-medium mb-8 max-w-xs leading-relaxed">
            팀원들과 함께 할 일을 공유하고,<br/>AI에게 스마트한 업무 배정을 맡겨보세요.
            </p>
            
            <button 
                onClick={() => setShowCreateTeam(true)}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2"
            >
                <PlusIcon className="h-5 w-5" />
                첫 번째 팀 만들기
            </button>
        </div>
        {showCreateTeam && renderCreateTeamModal()}
      </>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Team Selector */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col">
              <div className="relative inline-block w-full max-w-[200px]">
                  <select 
                    value={selectedTeamId}
                    onChange={handleTeamChange}
                    className="appearance-none w-full text-xl font-bold text-dark bg-transparent pr-8 py-1 focus:outline-none cursor-pointer"
                  >
                      {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                      <option value="create_new" className="text-primary font-bold">+ 새 팀 만들기</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
              </div>
              <p className="text-xs text-medium mt-1">
                  {currentTeam ? `${currentTeam.members.length}명의 멤버` : '팀을 선택하세요'}
              </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="팀 설정"
            >
                <CogIcon className="h-6 w-6" />
            </button>
            <button 
                onClick={() => setShowInviteModal(true)}
                className="p-2 text-primary hover:bg-red-50 rounded-full transition-colors"
                title="멤버 초대"
            >
                <UserPlusIcon className="h-6 w-6" />
            </button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
              업무
          </button>
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 ${activeTab === 'notices' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
              공지
          </button>
      </div>

      {/* Content */}
      {activeTab === 'tasks' && (
          <div className="space-y-6">
              <div>
                <button 
                    onClick={() => setShowTaskModal(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-medium hover:border-primary hover:text-primary hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>업무 추가</span>
                </button>

                <div className="space-y-3">
                    {activeTeamTasks.length > 0 ? (
                        activeTeamTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                teamName={currentTeam?.name}
                                currentUser={currentUser}
                                onUpdate={onUpdateTask} 
                                onDelete={onDeleteTask} 
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-medium">
                            진행 중인 팀 업무가 없습니다.
                        </div>
                    )}
                </div>
              </div>

              {completedTeamTasks.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3 border-t border-gray-100 pt-4">
                        <CheckAllIcon className="h-5 w-5 text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-500">완료된 업무 ({completedTeamTasks.length})</h3>
                    </div>
                    <div className="space-y-3 opacity-80">
                        {completedTeamTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                teamName={currentTeam?.name}
                                currentUser={currentUser}
                                onUpdate={onUpdateTask} 
                                onDelete={onDeleteTask} 
                            />
                        ))}
                    </div>
                </div>
              )}
          </div>
      )}

      {activeTab === 'notices' && (
          <div className="space-y-4">
              <button 
                onClick={() => setShowNoticeModal(true)}
                className="w-full py-3 bg-red-50 text-primary rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                  <MegaphoneIcon className="h-5 w-5" />
                  새 공지 등록
              </button>
              
              <div className="space-y-3">
                  {teamAnnouncements.length > 0 ? (
                      teamAnnouncements.map(notice => (
                          <div key={notice.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="font-bold text-dark text-sm">{notice.author}</span>
                                  <span className="text-xs text-gray-400">{notice.createdAt}</span>
                              </div>
                              <p className="text-dark whitespace-pre-wrap text-sm">{notice.content}</p>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-10 text-medium">
                          등록된 공지사항이 없습니다.
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">멤버 초대</h3>
                  <div className="mb-4">
                      <label className="block text-sm font-bold text-dark mb-1">초대 코드</label>
                      <input 
                          type="text" 
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          placeholder="6자리 코드 입력"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary outline-none font-mono tracking-wider text-center uppercase"
                          onKeyDown={(e) => e.key === 'Enter' && handleInviteSubmit()}
                      />
                      <p className="text-xs text-gray-400 mt-2 text-center">
                          팀원의 '설정 &gt; 계정 관리'에서 초대 코드를 확인할 수 있습니다.
                      </p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setShowInviteModal(false)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium">취소</button>
                      <button onClick={handleInviteSubmit} className="flex-1 bg-primary text-white py-2 rounded-lg font-bold">초대하기</button>
                  </div>
              </div>
          </div>
      )}

      {/* Unified Create Team Modal */}
      {showCreateTeam && renderCreateTeamModal()}
      
      {/* Settings Modal */}
      {showSettingsModal && renderSettingsModal()}

      {/* Task Upload Modal */}
      {showTaskModal && currentTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative">
                <button 
                onClick={() => setShowTaskModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-center">팀 업무 추가 ({currentTeam.name})</h3>
                    <UploadScreen 
                        onFileUpload={(file) => {
                            onTeamTaskUpload(file, null, currentTeam.id);
                            setShowTaskModal(false);
                        }} 
                        onTextUpload={(text) => {
                            onTeamTaskUpload(null, text, currentTeam.id);
                            setShowTaskModal(false);
                        }}
                        onAudioUpload={(file) => {
                            onTeamTaskUpload(file, null, currentTeam.id);
                            setShowTaskModal(false);
                        }}
                        onManualCreate={() => {
                            onManualCreate(currentTeam.id);
                            setShowTaskModal(false);
                        }}
                    />
                </div>
            </div>
          </div>
      )}
      
      {/* Notice Modal */}
      {showNoticeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">공지사항 등록</h3>
                  <textarea 
                    className="w-full h-32 border border-gray-300 rounded-lg p-3 mb-4 resize-none focus:ring-primary focus:border-primary"
                    placeholder="공지할 내용을 입력하세요..."
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                  ></textarea>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNoticeModal(false)} className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded font-medium">취소</button>
                    <button onClick={handleAddNotice} className="flex-1 py-2 bg-primary text-white rounded hover:bg-primary-hover font-bold">등록</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};