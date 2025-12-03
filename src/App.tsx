import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadScreen } from './components/UploadScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { HomeScreen } from './components/HomeScreen';
import { MyTasksScreen } from './components/MyTasksScreen';
import { TeamTasksScreen } from './components/TeamTasksScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { analyzeContent } from './services/geminiService';
import { AnalysisResult, Task, Team, Announcement, User } from './types';
import { Spinner } from './components/Spinner';
import { PlusIcon, XMarkIcon } from './components/icons';
import { ReviewScreen } from './components/ReviewScreen';
import { AuthScreen } from './components/AuthScreen';
import { ManualTaskModal } from './components/ManualTaskModal';
import { v4 as uuidv4 } from 'uuid';

export type TabView = 'home' | 'my-tasks' | 'team-tasks' | 'calendar' | 'settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('home');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showManualTaskModal, setShowManualTaskModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pendingAnalysisResult, setPendingAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentUploadContext, setCurrentUploadContext] = useState<{context: 'personal' | 'team', teamId?: string} | null>(null);
  
  // Context for manual task creation
  const [manualContext, setManualContext] = useState<{ type: 'personal' | 'team', teamId?: string }>({ type: 'personal' });

  // Navigation State
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string>('');
  
  // New State
  const [teams, setTeams] = useState<Team[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // 1. Load Data on Mount
  useEffect(() => {
    // Session
    const storedSession = localStorage.getItem('clippy_session');
    if (storedSession) {
        try {
            setCurrentUser(JSON.parse(storedSession));
        } catch (e) {
            localStorage.removeItem('clippy_session');
        }
    }

    // Analysis Result (Tasks)
    const storedData = localStorage.getItem('clippy_data');
    if (storedData) {
        try {
            setAnalysisResult(JSON.parse(storedData));
        } catch(e) {
            console.error("Failed to load data", e);
        }
    }

    // Teams
    const storedTeams = localStorage.getItem('clippy_teams');
    if (storedTeams) {
        try {
            setTeams(JSON.parse(storedTeams));
        } catch(e) {
            console.error("Failed to load teams", e);
        }
    }

    // Announcements
    const storedAnnouncements = localStorage.getItem('clippy_announcements');
    if (storedAnnouncements) {
        try {
            setAnnouncements(JSON.parse(storedAnnouncements));
        } catch(e) {
            console.error("Failed to load announcements", e);
        }
    }
  }, []);

  // 2. Save Data on Change
  useEffect(() => {
      // Only save if we have data.
      if (analysisResult) {
          localStorage.setItem('clippy_data', JSON.stringify(analysisResult));
      }
  }, [analysisResult]);

  useEffect(() => {
      localStorage.setItem('clippy_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
      localStorage.setItem('clippy_announcements', JSON.stringify(announcements));
  }, [announcements]);


  const handleLogin = (user: User) => {
      setCurrentUser(user);
  };

  const handleLogout = () => {
      localStorage.removeItem('clippy_session');
      setCurrentUser(null);
      setActiveTab('home');
  };

  const handleDeleteAccount = () => {
      if (!currentUser) return;

      // 1. Remove from user list
      const users = JSON.parse(localStorage.getItem('clippy_users') || '[]');
      const updatedUsers = users.filter((u: any) => u.username !== currentUser.username);
      localStorage.setItem('clippy_users', JSON.stringify(updatedUsers));

      // 2. Remove session
      localStorage.removeItem('clippy_session');

      // 3. Reset State & Logout
      setCurrentUser(null);
      setActiveTab('home');
      
      alert('회원 탈퇴가 완료되었습니다. 계정 정보가 삭제되었습니다.');
  };

  const handleUpdateUserProfile = (newName: string) => {
      if (!currentUser) return;
      
      const oldName = currentUser.name;
      const updatedUser = { ...currentUser, name: newName };
      setCurrentUser(updatedUser);
      
      // Update session
      localStorage.setItem('clippy_session', JSON.stringify(updatedUser));
      
      // Update user record
      const users = JSON.parse(localStorage.getItem('clippy_users') || '[]');
      const updatedUsers = users.map((u: any) => 
          u.username === currentUser.username ? { ...u, name: newName } : u
      );
      localStorage.setItem('clippy_users', JSON.stringify(updatedUsers));

      // Update Tasks: If a task was assigned to oldName, update to newName
      setAnalysisResult(prev => {
          if (!prev) return null;
          const newTasks = prev.tasks.map(t => {
              if (t.assignee === oldName) {
                  return { ...t, assignee: newName };
              }
              // Handle admin convention from team creation
              if (t.assignee === `${oldName} (Admin)`) {
                   return { ...t, assignee: `${newName} (Admin)` };
              }
              return t;
          });
          
          const newResult = { ...prev, tasks: newTasks };
          localStorage.setItem('clippy_data', JSON.stringify(newResult));
          return newResult;
      });
      
      // Update Teams members list
      setTeams(prev => prev.map(team => ({
          ...team,
          members: team.members.map(m => {
              if (m === oldName) return newName;
              if (m === `${oldName} (Admin)`) return `${newName} (Admin)`;
              return m;
          })
      })));
      
      // Update Announcements author
      setAnnouncements(prev => prev.map(a => {
          if (a.author === oldName) return { ...a, author: newName };
          return a;
      }));
  };

  // Navigation Handlers
  const handleNavigateToMyTasks = () => {
      setActiveTab('my-tasks');
  };

  const handleNavigateToTeam = (teamId: string) => {
      setTargetTeamId(teamId);
      setActiveTab('team-tasks');
  };

  const processAnalysis = async (content: string, name: string, context: 'personal' | 'team' = 'personal', teamId?: string, mimeType?: string) => {
    setIsLoading(true);
    setError(null);
    setFileName(name);

    try {
      // Close upload modal immediately to show global spinner clearly if not already handled
      setShowUploadModal(false);

      // Identify team members for context
      let teamMembers: string[] | undefined;
      if (context === 'team' && teamId) {
          teamMembers = teams.find(t => t.id === teamId)?.members;
      }

      // Pass content (text or base64) and mimeType to service
      const result = await analyzeContent(content, mimeType, teamMembers);
      
      // Add source info to tasks
      const enhancedTasks = result.tasks.map(task => ({
          ...task,
          source: context,
          teamId: teamId
      }));

      const enhancedResult = { ...result, tasks: enhancedTasks };
      
      // Instead of saving immediately, set as pending and show review modal
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

  const handleConfirmAnalysis = (selectedTasks: Task[]) => {
    if (!pendingAnalysisResult || !currentUploadContext) return;

    // Attach the summary to the selected tasks so it can be viewed individually
    let tasksToSave = selectedTasks.map(task => ({
        ...task,
        relatedSummary: pendingAnalysisResult.summary
    }));

    // If context is personal, overwrite assignee to current user for selected tasks
    if (currentUploadContext.context === 'personal' && currentUser) {
        tasksToSave = tasksToSave.map(t => ({
            ...t,
            assignee: currentUser.name
        }));
    }

    setAnalysisResult(prev => {
        if (!prev) {
            const newResult = {
                ...pendingAnalysisResult,
                tasks: tasksToSave,
            };
            localStorage.setItem('clippy_data', JSON.stringify(newResult));
            return newResult;
        }
        
        const newResult = {
            ...prev,
            tasks: [...prev.tasks, ...tasksToSave],
            decisions: [...prev.decisions, ...pendingAnalysisResult.decisions],
            summary: pendingAnalysisResult.summary // Keep global summary for Home screen
        };
        localStorage.setItem('clippy_data', JSON.stringify(newResult));
        return newResult;
    });

    setShowReviewModal(false);
    setPendingAnalysisResult(null);
    setCurrentUploadContext(null);

    if (currentUploadContext.context === 'personal') {
        setActiveTab('home');
    }
  };

  const handleCancelReview = () => {
      setShowReviewModal(false);
      setPendingAnalysisResult(null);
      setCurrentUploadContext(null);
  };

  const handleManualTaskCreate = (taskData: Omit<Task, 'id' | 'completed' | 'source' | 'assignee' | 'department'>) => {
      const isTeam = manualContext.type === 'team';
      const assigneeName = currentUser?.name || '나';

      const newTask: Task = {
          id: uuidv4(),
          description: taskData.description,
          priority: taskData.priority,
          deadline: taskData.deadline,
          completed: false,
          source: manualContext.type,
          teamId: manualContext.teamId,
          assignee: assigneeName, // Default to creator
          department: isTeam ? '팀 업무' : '개인',
          relatedSummary: '직접 추가한 할 일입니다.'
      };

      setAnalysisResult(prev => {
          if (!prev) {
              const newResult = {
                  summary: '',
                  tasks: [newTask],
                  decisions: []
              };
              localStorage.setItem('clippy_data', JSON.stringify(newResult));
              return newResult;
          }
          
          const newResult = {
              ...prev,
              tasks: [...prev.tasks, newTask]
          };
          localStorage.setItem('clippy_data', JSON.stringify(newResult));
          return newResult;
      });

      setShowManualTaskModal(false);
      setShowUploadModal(false);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      await processAnalysis(content, file.name, 'personal');
    };
    reader.onerror = () => {
      setError('파일을 읽는 데 실패했습니다.');
      setIsLoading(false);
    };
    reader.readAsText(file);
  }, []);

  const handleAudioUpload = useCallback(async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      await processAnalysis(base64Data, file.name, 'personal', undefined, file.type);
    };
    reader.onerror = () => {
      setError('오디오 파일을 읽는 데 실패했습니다.');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTextUpload = useCallback(async (text: string) => {
      await processAnalysis(text, "텍스트 메모", 'personal');
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
      } else if (text) {
          await processAnalysis(text, "팀 업무 메모", 'team', teamId);
      }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setAnalysisResult(prev => {
        if (!prev) return null;
        
        const newResult = {
            ...prev,
            tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        };
        localStorage.setItem('clippy_data', JSON.stringify(newResult));
        return newResult;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setAnalysisResult(prev => {
        if (!prev) return null;
        
        const newResult = {
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
        };
        localStorage.setItem('clippy_data', JSON.stringify(newResult));
        return newResult;
    });
  };

  // Team Management
  const handleCreateTeam = (teamName: string) => {
      const newTeam: Team = {
          id: uuidv4(),
          name: teamName,
          members: currentUser ? [`${currentUser.name} (Admin)`] : ['나 (Admin)'],
          createdBy: currentUser?.username || 'me'
      };
      setTeams([...teams, newTeam]);
  };

  const handleDeleteTeam = (teamId: string) => {
      // Only creator can delete
      const team = teams.find(t => t.id === teamId);
      if (!team || !currentUser || team.createdBy !== currentUser.username) {
          alert('팀을 삭제할 권한이 없습니다.');
          return;
      }

      setTeams(prev => prev.filter(t => t.id !== teamId));
      setAnnouncements(prev => prev.filter(a => a.teamId !== teamId));
      
      if (analysisResult) {
          const newTasks = analysisResult.tasks.filter(t => t.teamId !== teamId);
          setAnalysisResult({ ...analysisResult, tasks: newTasks });
      }
  };

  // New Feature: Join Team by Code
  const handleJoinTeam = (teamId: string, inviteCode: string) => {
      // 1. Find user by invitation code
      const users = JSON.parse(localStorage.getItem('clippy_users') || '[]');
      const invitedUser = users.find((u: any) => u.invitationCode === inviteCode);

      if (!invitedUser) {
          alert("유효하지 않은 초대 코드입니다.");
          return;
      }

      // 2. Add user to team
      setTeams(prev => prev.map(team => {
          if (team.id === teamId) {
              if (team.members.includes(invitedUser.name)) {
                  alert('이미 팀에 존재하는 멤버입니다.');
                  return team;
              }
              // Add simple name, no Admin tag
              return { ...team, members: [...team.members, invitedUser.name] };
          }
          return team;
      }));

      alert(`${invitedUser.name}님이 팀에 성공적으로 합류했습니다.`);
  };

  // New Feature: Leave Team
  const handleLeaveTeam = (teamId: string) => {
      if (!currentUser) return;
      
      const myName = currentUser.name;

      // 1. Remove from Team Members
      setTeams(prev => prev.map(team => {
          if (team.id === teamId) {
              const newMembers = team.members.filter(m => 
                  m !== myName && m !== `${myName} (Admin)`
              );
              return { ...team, members: newMembers };
          }
          return team;
      }));

      // 2. Remove All Announcements for this Team (as per instruction)
      setAnnouncements(prev => prev.filter(a => a.teamId !== teamId));

      // 3. Remove My Tasks for this Team (as per instruction)
      setAnalysisResult(prev => {
          if (!prev) return null;
          const newTasks = prev.tasks.filter(t => {
              // Keep task if: (Different Team) OR (Same Team BUT not assigned to me)
              if (t.teamId !== teamId) return true;
              
              // Check assignment
              const assignee = (t.assignee || '').toLowerCase();
              const userName = myName.toLowerCase();
              
              const isMe = assignee === '나' || assignee === 'me';
              const isMyName = userName && assignee.includes(userName);

              // If it IS assigned to me in this team, filter it out (return false)
              return !(isMe || isMyName);
          });
          
          const newResult = { ...prev, tasks: newTasks };
          localStorage.setItem('clippy_data', JSON.stringify(newResult));
          return newResult;
      });

      alert('팀을 나갔습니다.');
      setActiveTab('home');
  };

  const handleAddAnnouncement = (content: string, teamId: string) => {
      const newNotice: Announcement = {
          id: uuidv4(),
          teamId: teamId,
          content: content,
          createdAt: new Date().toISOString().split('T')[0],
          author: currentUser?.name || '나'
      };
      setAnnouncements([newNotice, ...announcements]);
  };

  const getCurrentTeamMembers = () => {
      if (currentUploadContext?.context === 'team' && currentUploadContext.teamId) {
          return teams.find(t => t.id === currentUploadContext.teamId)?.members;
      }
      return undefined;
  };

  const renderContent = () => {
    if (isLoading && !showUploadModal && !showReviewModal) {
      return (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
             <Spinner />
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen 
            analysisResult={analysisResult} 
            fileName={fileName}
            teams={teams}
            onUploadClick={() => {
                setManualContext({ type: 'personal' });
                setShowUploadModal(true);
            }}
            onDeleteTeam={handleDeleteTeam}
            onNavigateToMyTasks={handleNavigateToMyTasks}
            onNavigateToTeam={handleNavigateToTeam}
          />
        );
      case 'my-tasks':
        return (
          <MyTasksScreen 
            tasks={analysisResult?.tasks || []} 
            teams={teams}
            currentUser={currentUser}
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask} 
          />
        );
      case 'team-tasks':
        return (
          <TeamTasksScreen 
            tasks={analysisResult?.tasks || []} 
            teams={teams}
            announcements={announcements}
            initialTeamId={targetTeamId}
            currentUser={currentUser}
            onCreateTeam={handleCreateTeam}
            onDeleteTeam={handleDeleteTeam}
            onLeaveTeam={handleLeaveTeam} 
            onJoinTeam={handleJoinTeam} // Pass new handler
            onAddAnnouncement={handleAddAnnouncement}
            onTeamTaskUpload={handleTeamTaskUpload}
            onManualCreate={(teamId) => {
                setManualContext({ type: 'team', teamId });
                setShowManualTaskModal(true);
            }}
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask} 
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            tasks={analysisResult?.tasks || []}
            currentUser={currentUser}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            user={currentUser}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateUserProfile}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return null;
    }
  };

  if (!currentUser) {
      return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-light font-sans text-dark pb-20">
      <Header />
      
      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        {error && !showUploadModal && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">오류:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}
        
        {renderContent()}
      </main>

      {!showUploadModal && !showReviewModal && !isLoading && activeTab === 'home' && (
        <button 
          onClick={() => {
            setManualContext({ type: 'personal' });
            setShowUploadModal(true);
          }}
          className="fixed bottom-24 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-hover transition-transform hover:scale-105 z-40"
          aria-label="새 회의 분석"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden relative min-h-[400px] flex flex-col">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="p-6 flex-grow flex flex-col">
               {isLoading ? <Spinner /> : (
                 <UploadScreen 
                    onFileUpload={handleFileUpload} 
                    onTextUpload={handleTextUpload} 
                    onAudioUpload={handleAudioUpload} 
                    onManualCreate={() => setShowManualTaskModal(true)}
                 />
               )}
            </div>
          </div>
        </div>
      )}

      {showReviewModal && pendingAnalysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
                <ReviewScreen 
                    result={pendingAnalysisResult} 
                    context={currentUploadContext?.context || 'personal'}
                    teamMembers={getCurrentTeamMembers()}
                    onConfirm={handleConfirmAnalysis}
                    onCancel={handleCancelReview}
                />
            </div>
        </div>
      )}

      {showManualTaskModal && (
          <ManualTaskModal 
              onConfirm={handleManualTaskCreate}
              onCancel={() => setShowManualTaskModal(false)}
          />
      )}

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;