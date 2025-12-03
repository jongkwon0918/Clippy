import React, { useState } from 'react';
import { LogoutIcon, UserIcon, EditIcon, CheckIcon, XMarkIcon, TrashIcon } from './icons';
import { User } from '../types';

interface SettingsScreenProps {
  user: User | null;
  onLogout: () => void;
  onUpdateProfile: (newName: string) => void;
  onDeleteAccount: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout, onUpdateProfile, onDeleteAccount }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');

  const handleSaveProfile = () => {
    if (editedName.trim()) {
        onUpdateProfile(editedName.trim());
        setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-xl font-bold text-dark">설정</h2>
      
      {/* Account Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-dark">계정 관리</h3>
            {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                    <EditIcon className="h-4 w-4" />
                    수정
                </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                  <UserIcon className="h-6 w-6" />
              </div>
              <div className="flex-grow">
                  {isEditing ? (
                      <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="이름 입력"
                            autoFocus
                          />
                          <button onClick={handleSaveProfile} className="p-1 text-green-600 hover:bg-green-100 rounded">
                              <CheckIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setIsEditing(false); setEditedName(user?.name || ''); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded">
                              <XMarkIcon className="h-4 w-4" />
                          </button>
                      </div>
                  ) : (
                      <>
                        <p className="font-bold text-sm text-dark">{user?.name || '사용자'}</p>
                        <p className="text-xs text-gray-500">{user?.username || ''}</p>
                      </>
                  )}
              </div>
          </div>

          {/* Invitation Code Display */}
          {user?.invitationCode && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
                <div>
                    <span className="text-xs text-primary font-bold block">나의 초대 코드</span>
                    <span className="text-lg font-mono font-bold text-dark">{user.invitationCode}</span>
                </div>
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(user.invitationCode);
                        alert('초대 코드가 복사되었습니다.');
                    }}
                    className="text-xs bg-white text-primary px-3 py-1.5 rounded-md border border-primary font-bold hover:bg-red-50"
                >
                    복사
                </button>
            </div>
          )}
          
          <button 
              onClick={() => {
                  if(window.confirm('로그아웃 하시겠습니까?')) {
                      onLogout();
                  }
              }}
              className="flex items-center w-full text-left text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
              <LogoutIcon className="h-5 w-5 mr-2" />
              <span>로그아웃</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-dark">앱 정보</h3>
          <p className="text-sm text-medium mt-1">Clippy: AI 회의 비서 (v1.1.0)</p>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-red-100">
        <div className="p-4">
             <button 
               onClick={() => {
                 if(window.confirm('정말로 탈퇴하시겠습니까?\n계정 및 모든 개인 정보가 영구적으로 삭제됩니다.')) {
                   onDeleteAccount();
                 }
               }}
               className="flex items-center w-full text-left text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
             >
               <TrashIcon className="h-5 w-5 mr-2" />
               <span>탈퇴하기 (계정 삭제)</span>
             </button>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-400 mt-8">
        Powered by Google Gemini
      </div>
    </div>
  );
};