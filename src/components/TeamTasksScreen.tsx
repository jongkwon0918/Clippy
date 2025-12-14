import React, { useState, useEffect, useMemo } from 'react';
import { Task, Announcement, Team, User, MeetingLog, InsightReport } from '../types';
import { TaskCard } from './TaskCard';
import { BsPeople, BsPlusLg, BsMegaphone, BsPersonPlus, BsX, BsGear, BsTrash, BsCheckAll, BsLightningCharge, BsClockHistory, BsChatQuote, BsFileText, BsArrowRepeat } from "react-icons/bs";
import { UploadScreen } from './UploadScreen';
import { generateTeamInsights } from '../services/geminiService';
import { Spinner } from './Spinner';

interface TeamTasksScreenProps {
  tasks: Task[];
  teams: Team[];
  announcements: Announcement[];
  meetingHistory: MeetingLog[];
  teamInsights: Record<string, InsightReport>;
  initialTeamId: string | null;
  currentUser: User | null;
  onCreateTeam: (teamName: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onLeaveTeam: (teamId: string) => void;
  onJoinTeam: (teamId: string, inviteCode: string) => void;
  onAddAnnouncement: (content: string, teamId: string) => void;
  onTeamTaskUpload: (file: File | null, text: string | null, teamId: string) => void;
  onManualCreate: (teamId: string) => void;
  onSaveInsight: (teamId: string, report: InsightReport) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TeamTasksScreen: React.FC<TeamTasksScreenProps> = ({ 
    tasks, teams, announcements, meetingHistory, teamInsights, initialTeamId, currentUser, onCreateTeam, onDeleteTeam, onLeaveTeam, onJoinTeam, onAddAnnouncement, onTeamTaskUpload, onManualCreate, onSaveInsight, onUpdateTask, onDeleteTask 
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notices' | 'history'>('tasks');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false); 
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [noticeContent, setNoticeContent] = useState('');
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');

  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

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
  const currentInsight = currentTeam ? teamInsights[currentTeam.id] : null;

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

  const handleGenerateInsight = async () => {
      if (!currentTeam) return;
      const history = meetingHistory.filter(h => h.teamId === currentTeam.id);
      
      if (history.length === 0) {
          alert('분석할 회의 기록이 없습니다. 먼저 회의록을 업로드해주세요.');
          return;
      }

      setIsGeneratingInsight(true);
      try {
          const report = await generateTeamInsights(history);
          onSaveInsight(currentTeam.id, report);
      } catch (e) {
          alert('인사이트 생성에 실패했습니다.');
          console.error(e);
      } finally {
          setIsGeneratingInsight(false);
      }
  };

  const teamTasks = useMemo(() => tasks.filter(t => t.teamId === selectedTeamId), [tasks, selectedTeamId]);
  const teamAnnouncements = announcements.filter(a => a.teamId === selectedTeamId);
  const teamHistory = meetingHistory.filter(h => h.teamId === selectedTeamId).sort((a, b) => b.createdAt - a.createdAt);

  const activeTeamTasks = teamTasks.filter(t => !t.completed);
  const completedTeamTasks = teamTasks.filter(t => t.completed);

  // ... (Modal Render Helpers)
  const renderCreateTeamModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
        <h3 className="text-lg font-bold text-dark mb-4">새 팀 만들기</h3>
        <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-primary" placeholder="팀 이름" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
        <div className="flex gap-3">
            <button onClick={() => setShowCreateTeam(false)} className="flex-1 py-3 text-gray-500 bg-gray-100 rounded-xl">취소</button>
            <button onClick={handleCreateTeam} className="flex-1 py-3 bg-primary text-white rounded-xl">생성</button>
        </div>
      </div>
    </div>
  );

  const renderSettingsModal = () => {
      if (!currentTeam) return null;
      const isOwner = currentTeam.createdBy === 'me' || (currentUser && currentTeam.createdBy === currentUser.username);
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2"><BsGear /> 팀 설정</h3>
                <button onClick={() => setShowSettingsModal(false)}><BsX className="h-6 w-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
                <div><h4 className="text-xs font-bold text-gray-400 mb-2">팀 이름</h4><p className="text-lg font-bold">{currentTeam.name}</p></div>
                <div><h4 className="text-xs font-bold text-gray-400 mb-2">멤버 ({currentTeam.members.length})</h4><div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">{currentTeam.members.map((m, i) => <div key={i} className="text-sm py-1">{m}</div>)}</div></div>
                <div className="pt-4 border-t">
                    <button onClick={() => { if(window.confirm(isOwner ? '삭제하시겠습니까?' : '나가시겠습니까?')) { isOwner ? onDeleteTeam(currentTeam.id) : onLeaveTeam(currentTeam.id); setShowSettingsModal(false); }}} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${isOwner ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-100'}`}>
                        {isOwner ? <><BsTrash /> 팀 삭제</> : <><BsX /> 팀 나가기</>}
                    </button>
                </div>
            </div>
          </div>
        </div>
      );
  };

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-red-50 p-6 rounded-full mb-6"><BsPeople className="h-12 w-12 text-primary" /></div>
        <h2 className="text-2xl font-bold text-dark mb-4">팀 워크스페이스</h2>
        <button onClick={() => setShowCreateTeam(true)} className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2"><BsPlusLg /> 첫 번째 팀 만들기</button>
        {showCreateTeam && renderCreateTeamModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col">
              <div className="relative inline-block w-full max-w-[200px]">
                  <select value={selectedTeamId} onChange={handleTeamChange} className="appearance-none w-full text-xl font-bold text-dark bg-transparent pr-8 py-1 focus:outline-none cursor-pointer">
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      <option value="create_new" className="text-primary font-bold">+ 새 팀 만들기</option>
                  </select>
              </div>
              <p className="text-xs text-medium mt-1">{currentTeam ? `${currentTeam.members.length}명의 멤버` : '팀을 선택하세요'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettingsModal(true)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><BsGear className="h-6 w-6" /></button>
            <button onClick={() => setShowInviteModal(true)} className="p-2 text-primary hover:bg-red-50 rounded-full"><BsPersonPlus className="h-6 w-6" /></button>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>업무</button>
          <button onClick={() => setActiveTab('notices')} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'notices' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>공지</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
              <span className="flex items-center justify-center gap-1"><BsLightningCharge /> 인사이트</span>
          </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
          <div className="space-y-6">
              <button onClick={() => setShowTaskModal(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-medium hover:border-primary hover:text-primary hover:bg-red-50 transition-colors flex items-center justify-center gap-2 mb-4">
                  <BsPlusLg className="h-5 w-5" /><span>업무 추가</span>
              </button>
              <div className="space-y-3">
                  {activeTeamTasks.map(task => <TaskCard key={task.id} task={task} teamName={currentTeam?.name} currentUser={currentUser} onUpdate={onUpdateTask} onDelete={onDeleteTask} />)}
                  {activeTeamTasks.length === 0 && <div className="text-center py-8 text-medium">진행 중인 업무가 없습니다.</div>}
              </div>
              {completedTeamTasks.length > 0 && (
                <div className="opacity-80 mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3"><BsCheckAll className="text-gray-400" /><h3 className="text-sm font-bold text-gray-500">완료됨 ({completedTeamTasks.length})</h3></div>
                    {completedTeamTasks.map(task => <TaskCard key={task.id} task={task} teamName={currentTeam?.name} currentUser={currentUser} onUpdate={onUpdateTask} onDelete={onDeleteTask} />)}
                </div>
              )}
          </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
          <div className="space-y-4">
              <button onClick={() => setShowNoticeModal(true)} className="w-full py-3 bg-red-50 text-primary rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center gap-2"><BsMegaphone /> 새 공지 등록</button>
              <div className="space-y-3">
                  {teamAnnouncements.map(notice => (
                      <div key={notice.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2"><span className="font-bold text-dark text-sm">{notice.author}</span><span className="text-xs text-gray-400">{notice.createdAt}</span></div>
                          <p className="text-dark whitespace-pre-wrap text-sm">{notice.content}</p>
                      </div>
                  ))}
                  {teamAnnouncements.length === 0 && <div className="text-center py-10 text-medium">공지사항이 없습니다.</div>}
              </div>
          </div>
      )}

      {/* ✅ Insight & History Tab (버튼 로딩 효과 적용) */}
      {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Insight Card */}
              {currentInsight ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 p-6 rounded-xl shadow-sm relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900 mb-1 flex items-center gap-2"><BsLightningCharge /> 프로젝트 인사이트</h3>
                                    <p className="text-xs text-indigo-400">{new Date(currentInsight.generatedAt).toLocaleDateString()} 생성됨</p>
                                </div>
                                {/* ✅ 업데이트 버튼: 로딩 중일 때 비활성화 + 텍스트 변경 */}
                                <button 
                                    onClick={handleGenerateInsight} 
                                    disabled={isGeneratingInsight} 
                                    className={`text-xs border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${isGeneratingInsight ? 'bg-indigo-50 opacity-70 cursor-not-allowed' : 'bg-white hover:bg-indigo-50'}`}
                                >
                                    {isGeneratingInsight ? (
                                        <>
                                            <BsArrowRepeat className="animate-spin" /> 업데이트 중...
                                        </>
                                    ) : '업데이트'}
                                </button>
                          </div>
                          
                          <div className="mb-6">
                              <h4 className="text-sm font-bold text-indigo-800 mb-2 pb-1 border-b border-indigo-100">💡 핵심 결정 (Key Decisions)</h4>
                              <ul className="space-y-3">
                                  {currentInsight.items.map((item, idx) => (
                                      <li key={idx} className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm text-sm">
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="font-bold text-indigo-700">{item.title}</span>
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.impact === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{item.impact}</span>
                                          </div>
                                          <p className="text-indigo-900 font-medium mb-1">{item.decision}</p>
                                          <p className="text-gray-600 text-xs leading-relaxed mb-2">{item.rationale}</p>
                                          {item.controversy && (
                                            <div className="bg-red-50 p-2 rounded text-xs text-red-800 flex gap-2 items-start">
                                                <BsChatQuote className="mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <strong className="block mb-0.5">🔥 쟁점 & 반대 의견:</strong> 
                                                    {item.controversy}
                                                </div>
                                            </div>
                                          )}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><BsLightningCharge className="h-6 w-6" /></div>
                      <h3 className="font-bold text-dark mb-2">팀 인사이트 리포트</h3>
                      <p className="text-sm text-gray-500 mb-6">축적된 회의 기록을 분석하여<br/>프로젝트의 중요한 결정과 흐름을 정리해드립니다.</p>
                      
                      {/* ✅ 생성하기 버튼: 로딩 중일 때 뱅글뱅글 돌아가는 스피너와 텍스트 표시 */}
                      <button 
                          onClick={handleGenerateInsight} 
                          disabled={isGeneratingInsight} 
                          className={`bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center justify-center gap-2 mx-auto transition-all ${isGeneratingInsight ? 'opacity-80 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                      >
                          {isGeneratingInsight ? (
                              <>
                                  {/* 자체 SVG 스피너 사용 (외부 컴포넌트 없이 깔끔하게) */}
                                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  분석 중...
                              </>
                          ) : (
                              '리포트 생성하기'
                          )}
                      </button>
                  </div>
              )}

              {/* History List */}
              <div className="mt-8">
                  <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><BsClockHistory /> 회의 기록 아카이브 ({teamHistory.length})</h4>
                  <div className="space-y-3">
                      {teamHistory.map(log => (
                          <div key={log.id} className="bg-white p-4 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-dark text-sm truncate max-w-[200px]">{log.fileName}</span>
                                  <span className="text-xs text-gray-400">{log.date}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                                  <BsFileText /> <span>요약본</span>
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{log.summary}</p>
                          </div>
                      ))}
                      {teamHistory.length === 0 && <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200"><p className="text-xs">아직 저장된 회의 기록이 없습니다.</p></div>}
                  </div>
              </div>
          </div>
      )}

      {/* Modals */}
      {showInviteModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3 className="font-bold mb-4">초대 코드</h3><input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} className="border w-full p-2 mb-4 rounded" placeholder="코드 입력" /><div className="flex gap-2"><button onClick={()=>setShowInviteModal(false)} className="flex-1 bg-gray-100 p-2 rounded">취소</button><button onClick={handleInviteSubmit} className="flex-1 bg-primary text-white p-2 rounded">확인</button></div></div></div>}
      {showCreateTeam && renderCreateTeamModal()}
      {showSettingsModal && renderSettingsModal()}
      {showTaskModal && currentTeam && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="bg-white rounded-xl w-full max-w-lg p-6 relative"><button onClick={()=>setShowTaskModal(false)} className="absolute top-4 right-4"><BsX className="h-6 w-6 text-gray-400"/></button><h3 className="text-center font-bold mb-4">업무 추가</h3><UploadScreen onFileUpload={(f)=>{onTeamTaskUpload(f,null,currentTeam.id);setShowTaskModal(false)}} onTextUpload={(t)=>{onTeamTaskUpload(null,t,currentTeam.id);setShowTaskModal(false)}} onAudioUpload={(f)=>{onTeamTaskUpload(f,null,currentTeam.id);setShowTaskModal(false)}} onManualCreate={()=>{onManualCreate(currentTeam.id);setShowTaskModal(false)}} /></div></div>}
      {showNoticeModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-full max-w-md"><h3 className="font-bold mb-4">공지 등록</h3><textarea value={noticeContent} onChange={e=>setNoticeContent(e.target.value)} className="w-full border p-2 h-32 mb-4 rounded" /><div className="flex gap-2"><button onClick={()=>setShowNoticeModal(false)} className="flex-1 bg-gray-100 p-2 rounded">취소</button><button onClick={handleAddNotice} className="flex-1 bg-primary text-white p-2 rounded">등록</button></div></div></div>}
    </div>
  );
};