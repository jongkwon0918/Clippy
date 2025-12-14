import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { HomeScreen } from './components/HomeScreen';
import { MyTasksScreen } from './components/MyTasksScreen';
import { TeamTasksScreen } from './components/TeamTasksScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { analyzeContent, generateTeamInsights } from './services/geminiService';
import { AnalysisResult, Task, Team, Announcement, User, MeetingLog, InsightReport } from './types';
import { Spinner } from './components/Spinner';
import { BsPlusLg, BsX } from "react-icons/bs";
import { ReviewScreen } from './components/ReviewScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { AuthScreen } from './components/AuthScreen';
import { ManualTaskModal } from './components/ManualTaskModal';
import { v4 as uuidv4 } from 'uuid';

// ✅ 파이어베이스 라이브러리 (로컬 환경에서만 작동)
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, where, getDocs, orderBy, setDoc, getDoc, arrayUnion, arrayRemove, writeBatch 
} from 'firebase/firestore';

export type TabView = 'home' | 'my-tasks' | 'team-tasks' | 'calendar' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('home');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showManualTaskModal, setShowManualTaskModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResultsScreen, setShowResultsScreen] = useState<boolean>(false);

  // 데이터 상태 (Firestore와 동기화됨)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentUploadContext, setCurrentUploadContext] = useState<{context: 'personal' | 'team', teamId?: string} | null>(null);
  
  const [lastUploadedData, setLastUploadedData] = useState<{
      content: string;
      name: string;
      mimeType?: string;
  } | null>(null);

  const [manualContext, setManualContext] = useState<{ type: 'personal' | 'team', teamId?: string }>({ type: 'personal' });
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetingHistory, setMeetingHistory] = useState<MeetingLog[]>([]);
  const [teamInsights, setTeamInsights] = useState<Record<string, InsightReport>>({});
  
  // ✅ 1. 인증 상태 감지 (로그인 유지)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore에서 사용자 추가 정보 가져오기
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            username: firebaseUser.email || '',
            name: userData.name || firebaseUser.displayName || '사용자',
            invitationCode: userData.invitationCode || ''
          });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ 2. 실시간 데이터 구독 (Firestore -> App State)
  useEffect(() => {
    if (!currentUser) return;

    // (1) 팀 데이터 구독
    const qTeams = query(collection(db, "teams")); 
    const unsubTeams = onSnapshot(qTeams, (snapshot) => {
      const loadedTeams = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Team));
      setTeams(loadedTeams);
    });

    // (2) 할 일 데이터 구독
    const qTasks = query(collection(db, "tasks"));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const loadedTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      
      // 홈 화면용 analysisResult 업데이트 (최신 상태 반영)
      setAnalysisResult(prev => ({
        summary: prev?.summary || "데이터 로드 완료",
        tasks: loadedTasks,
        decisions: prev?.decisions || []
      }));
    });

    // (3) 공지사항 구독
    const qAnnouncements = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
      setAnnouncements(loaded);
    });

    // (4) 회의 기록 구독
    const qHistory = query(collection(db, "meeting_logs"), orderBy("createdAt", "desc"));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MeetingLog));
      setMeetingHistory(loaded);
      
      // 가장 최근 회의록의 요약/결정사항을 홈 화면에 반영
      if (loaded.length > 0) {
        setAnalysisResult(prev => prev ? {
            ...prev,
            summary: loaded[0].summary,
            decisions: loaded[0].decisions
        } : null);
      }
    });

    // (5) 인사이트 구독
    const unsubInsights = onSnapshot(collection(db, "insights"), (snapshot) => {
      const insightsMap: Record<string, InsightReport> = {};
      snapshot.docs.forEach(d => {
        insightsMap[d.id] = d.data() as InsightReport;
      });
      setTeamInsights(insightsMap);
    });

    return () => {
      unsubTeams();
      unsubTasks();
      unsubAnnouncements();
      unsubHistory();
      unsubInsights();
    };
  }, [currentUser]); // currentUser가 바뀔 때마다 실행

  // --- Handlers (Firestore 연동) ---

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // 실제 로직은 onAuthStateChanged에서 처리됨
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setActiveTab('home');
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm("계정 삭제를 위해 로그아웃 합니다. (실제 삭제는 파이어베이스 콘솔에서 처리 필요)")) {
        await signOut(auth);
        setActiveTab('home');
    }
  };

  const handleUpdateUserProfile = async (newName: string) => {
    if (!currentUser || !auth.currentUser) return;
    try {
        // 1. Firestore 유저 정보 업데이트
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { name: newName });
        
        // 2. 로컬 상태 업데이트 (빠른 반응성)
        setCurrentUser({ ...currentUser, name: newName });
    } catch (e) {
        console.error("Profile update failed", e);
        alert("프로필 수정 실패");
    }
  };

  const handleNavigateToMyTasks = () => { setActiveTab('my-tasks'); setShowResultsScreen(false); };
  const handleNavigateToTeam = (teamId: string) => { setTargetTeamId(teamId); setActiveTab('team-tasks'); setShowResultsScreen(false); };
  const handleTabChange = (tab: TabView) => { setActiveTab(tab); setShowResultsScreen(false); };

  // AI 분석 로직 (변경 없음)
  const processAnalysis = async (content: string, name: string, context: 'personal' | 'team' = 'personal', teamId?: string, mimeType?: string) => {
    setIsLoading(true);
    setError(null);
    setFileName(name);
    setLastUploadedData({ content, name, mimeType });

    try {
      setShowUploadModal(false);
      let teamMembers: string[] | undefined;
      if (context === 'team' && teamId) {
          teamMembers = teams.find(t => t.id === teamId)?.members;
      }
      const result = await analyzeContent(content, mimeType, teamMembers);
      
      // ✅ [수정] TypeScript 에러 해결: 로컬 상태에는 undefined 허용
      const enhancedTasks = result.tasks.map(task => ({ 
          ...task, 
          source: context, 
          teamId: teamId 
      }));
      const enhancedResult = { ...result, tasks: enhancedTasks };
      
      setPendingAnalysisResult(enhancedResult);
      setCurrentUploadContext({ context, teamId });
      setShowReviewModal(true);
    } catch (err) {
      setError('분석에 실패했습니다. 다시 시도해 주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
      if (!lastUploadedData || !currentUploadContext) return;
      setShowReviewModal(false);
      setShowResultsScreen(false);
      setPendingAnalysisResult(null);
      await processAnalysis(lastUploadedData.content, lastUploadedData.name, currentUploadContext.context, currentUploadContext.teamId, lastUploadedData.mimeType);
  };

  // ✅ 분석 결과 저장 (Batch Write로 안전하게 저장)
  const handleConfirmAnalysis = async (selectedTasks: Task[]) => {
    if (!pendingAnalysisResult || !currentUploadContext) return;

    setIsLoading(true);
    try {
        const batch = writeBatch(db);

        // 1. 할 일 저장
        selectedTasks.forEach(task => {
            const taskRef = doc(collection(db, "tasks"));
            const taskData = {
                ...task,
                id: taskRef.id, 
                relatedSummary: pendingAnalysisResult.summary,
                assignee: (currentUploadContext.context === 'personal' && currentUser) ? currentUser.name : task.assignee,
                // ✅ [핵심 수정] DB 저장 시에는 null로 변환 (undefined 방지)
                teamId: task.teamId || null 
            };
            batch.set(taskRef, taskData);
        });

        // 2. 회의 기록 저장 (팀 모드일 경우)
        if (currentUploadContext.context === 'team' && currentUploadContext.teamId) {
            const logRef = doc(collection(db, "meeting_logs"));
            const logData: MeetingLog = {
                id: logRef.id,
                teamId: currentUploadContext.teamId,
                date: new Date().toISOString().split('T')[0],
                fileName: lastUploadedData?.name || '회의 기록',
                summary: pendingAnalysisResult.summary,
                decisions: pendingAnalysisResult.decisions,
                createdAt: Date.now()
            };
            batch.set(logRef, logData);
        }

        // 3. 일괄 전송
        await batch.commit();

        setShowReviewModal(false);
        setPendingAnalysisResult(null);
        setCurrentUploadContext(null);
        setShowResultsScreen(true);
    } catch (e) {
        console.error("Save failed", e);
        alert("저장에 실패했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancelReview = () => { setShowReviewModal(false); setPendingAnalysisResult(null); setCurrentUploadContext(null); setLastUploadedData(null); };
  const handleStartOver = () => { setShowResultsScreen(false); setLastUploadedData(null); setActiveTab('home'); };
  
  // ✅ 수동 할 일 추가
  const handleManualTaskCreate = async (taskData: any) => { 
      const isTeam = manualContext.type === 'team';
      const assigneeName = currentUser?.name || '나';
      
      try {
          await addDoc(collection(db, "tasks"), {
              ...taskData,
              completed: false,
              source: manualContext.type,
              // ✅ [핵심 수정] DB 저장 시에는 null로 변환
              teamId: manualContext.teamId || null, 
              assignee: assigneeName,
              department: isTeam ? '팀 업무' : '개인',
              relatedSummary: '직접 추가한 할 일입니다.'
          });
          setShowManualTaskModal(false); 
          setShowUploadModal(false);
      } catch (e) {
          console.error("Manual task create failed", e);
      }
  };

  // ✅ 인사이트 저장 핸들러
  const handleSaveInsight = async (teamId: string, report: InsightReport) => {
      try {
          await setDoc(doc(db, "insights", teamId), report);
      } catch (e) {
          console.error("Insight save failed", e);
      }
  };

  // ✅ 할 일 업데이트
  const handleUpdateTask = async (updatedTask: Task) => {
      try {
          await updateDoc(doc(db, "tasks", updatedTask.id), { ...updatedTask });
      } catch (e) {
          console.error("Task update failed", e);
      }
  };

  // ✅ 할 일 삭제
  const handleDeleteTask = async (taskId: string) => {
      try {
          await deleteDoc(doc(db, "tasks", taskId));
      } catch (e) {
          console.error("Task delete failed", e);
      }
  };

  // ✅ 팀 생성
  const handleCreateTeam = async (name: string) => {
      if (!currentUser) return;
      try {
          const teamRef = doc(collection(db, "teams"));
          await setDoc(teamRef, {
              id: teamRef.id,
              name: name,
              members: [`${currentUser.name} (Admin)`],
              createdBy: currentUser.username
          });
      } catch (e) {
          console.error("Team create failed", e);
      }
  };

  // ✅ 팀 삭제
  const handleDeleteTeam = async (id: string) => {
      try {
          await deleteDoc(doc(db, "teams", id));
      } catch (e) {
          console.error("Team delete failed", e);
      }
  };

  // ✅ 팀 나가기
  const handleLeaveTeam = async (teamId: string) => {
      if (!currentUser) return;
      try {
          const teamRef = doc(db, "teams", teamId);
          const teamDoc = await getDoc(teamRef);
          if (teamDoc.exists()) {
              const teamData = teamDoc.data() as Team;
              const newMembers = teamData.members.filter(m => !m.includes(currentUser.name));
              await updateDoc(teamRef, { members: newMembers });
          }
          setActiveTab('home');
      } catch (e) {
          console.error("Leave team failed", e);
      }
  };

  // ✅ 팀 참가
  const handleJoinTeam = async (teamId: string, inviteCode: string) => {
      try {
          const q = query(collection(db, "users"), where("invitationCode", "==", inviteCode));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
              alert("유효하지 않은 초대 코드입니다.");
              return;
          }

          const invitedUserDoc = querySnapshot.docs[0];
          const invitedUserData = invitedUserDoc.data();
          const invitedUserName = invitedUserData.name;

          const teamRef = doc(db, "teams", teamId);
          await updateDoc(teamRef, {
              members: arrayUnion(invitedUserName)
          });

          alert(`${invitedUserName}님이 팀에 합류했습니다.`);
      } catch (e) {
          console.error("Join team failed", e);
          alert("팀 참가 처리 중 오류가 발생했습니다.");
      }
  };

  // ✅ 공지사항 추가
  const handleAddAnnouncement = async (content: string, teamId: string) => {
      try {
          await addDoc(collection(db, "announcements"), {
              teamId: teamId,
              content: content,
              createdAt: new Date().toISOString().split('T')[0],
              author: currentUser?.name || '나'
          });
      } catch (e) {
          console.error("Announcement failed", e);
      }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      await processAnalysis(content, file.name, 'personal');
    };
    reader.readAsText(file);
  }, []);
  const handleTextUpload = useCallback(async (text: string) => { await processAnalysis(text, "텍스트 메모", 'personal'); }, []);
  const handleAudioUpload = useCallback(async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      await processAnalysis(base64Data, file.name, 'personal', undefined, file.type);
    };
    reader.readAsDataURL(file);
  }, []);
  const handleTeamTaskUpload = async (file: File | null, text: string | null, teamId: string) => {
      if (file) {
          const isAudio = file.type.startsWith('audio/');
          const reader = new FileReader();
          if (isAudio) {
             reader.onload = async (e) => {
                const result = e.target?.result as string;
                const base64Data = result.split(',')[1];
                await processAnalysis(base64Data, file.name, 'team', teamId, file.type);
             };
             reader.readAsDataURL(file);
          } else {
             reader.onload = async (e) => {
                const content = e.target?.result as string;
                await processAnalysis(content, file.name, 'team', teamId);
             };
             reader.readAsText(file);
          }
      } else if (text) { await processAnalysis(text, "팀 업무 메모", 'team', teamId); }
  };

  const getCurrentTeamMembers = () => { if (currentUploadContext?.context === 'team' && currentUploadContext.teamId) return teams.find(t => t.id === currentUploadContext.teamId)?.members; return undefined; };

  const renderContent = () => {
    if (showResultsScreen && analysisResult) return <ResultsScreen result={analysisResult} fileName={fileName} onRegenerate={handleRegenerate} onStartOver={handleStartOver} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />;
    if (isLoading && !showUploadModal && !showReviewModal) return <div className="fixed inset-0 z-50 bg-white flex items-center justify-center"><Spinner /></div>;

    switch (activeTab) {
      case 'home': return <HomeScreen analysisResult={analysisResult} fileName={fileName} teams={teams} onUploadClick={() => { setManualContext({ type: 'personal' }); setShowUploadModal(true); }} onDeleteTeam={handleDeleteTeam} onNavigateToMyTasks={handleNavigateToMyTasks} onNavigateToTeam={handleNavigateToTeam} />;
      case 'my-tasks': return <MyTasksScreen tasks={analysisResult?.tasks || []} teams={teams} currentUser={currentUser} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />;
      case 'team-tasks': 
        return <TeamTasksScreen 
            tasks={analysisResult?.tasks || []} 
            teams={teams} 
            announcements={announcements} 
            meetingHistory={meetingHistory} 
            teamInsights={teamInsights} 
            initialTeamId={targetTeamId} 
            currentUser={currentUser} 
            onCreateTeam={handleCreateTeam} 
            onDeleteTeam={handleDeleteTeam} 
            onLeaveTeam={handleLeaveTeam} 
            onJoinTeam={handleJoinTeam} 
            onAddAnnouncement={handleAddAnnouncement} 
            onTeamTaskUpload={handleTeamTaskUpload} 
            onManualCreate={(id) => { setManualContext({ type: 'team', teamId: id }); setShowManualTaskModal(true); }} 
            onSaveInsight={handleSaveInsight} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask} 
        />;
      case 'calendar': return <CalendarScreen tasks={analysisResult?.tasks || []} currentUser={currentUser} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} />;
      case 'settings': return <SettingsScreen user={currentUser} onLogout={handleLogout} onUpdateProfile={handleUpdateUserProfile} onDeleteAccount={handleDeleteAccount} />;
      default: return null;
    }
  };

  if (!currentUser) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-light font-sans text-dark pb-20">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        {error && !showUploadModal && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><strong className="font-bold">오류:</strong><span className="block sm:inline ml-2">{error}</span></div>}
        {renderContent()}
      </main>
      {!showUploadModal && !showReviewModal && !isLoading && !showResultsScreen && activeTab === 'home' && (
        <button onClick={() => { setManualContext({ type: 'personal' }); setShowUploadModal(true); }} className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105 z-40"><BsPlusLg className="h-6 w-6" /></button>
      )}
      {showUploadModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden relative min-h-[400px] flex flex-col"><button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-50"><BsX className="h-6 w-6" /></button><div className="p-6 flex-grow flex flex-col">{isLoading ? <Spinner /> : <UploadScreen onFileUpload={handleFileUpload} onTextUpload={handleTextUpload} onAudioUpload={handleAudioUpload} onManualCreate={() => setShowManualTaskModal(true)} />}</div></div></div>}
      {showReviewModal && pendingAnalysisResult && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]"><ReviewScreen result={pendingAnalysisResult} context={currentUploadContext?.context || 'personal'} teamMembers={getCurrentTeamMembers()} onConfirm={handleConfirmAnalysis} onCancel={handleCancelReview} onRegenerate={handleRegenerate} /></div></div>}
      {showManualTaskModal && <ManualTaskModal onConfirm={handleManualTaskCreate} onCancel={() => setShowManualTaskModal(false)} />}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default App;