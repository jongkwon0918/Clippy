import React, { useState } from 'react';
import { User } from '../types';
import { PaperclipIcon } from './icons';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Helper to generate 6-char code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      // Signup Logic
      if (!username || !password || !name || !confirmPassword) {
         setError('모든 필드를 입력해주세요.');
         return;
      }
      if (password !== confirmPassword) {
         setError('비밀번호가 일치하지 않습니다.');
         return;
      }
      
      const users = JSON.parse(localStorage.getItem('clippy_users') || '[]');
      if (users.find((u: any) => u.username === username)) {
          setError('이미 존재하는 아이디입니다.');
          return;
      }

      // Create new user with invitation code
      const newUser = { 
          username, 
          password, 
          name,
          invitationCode: generateInviteCode() 
      };

      users.push(newUser);
      localStorage.setItem('clippy_users', JSON.stringify(users));
      
      // Auto login after signup
      const userSession = { username, name, invitationCode: newUser.invitationCode };
      localStorage.setItem('clippy_session', JSON.stringify(userSession));
      onLogin(userSession);
    } else {
      // Login Logic
      const users = JSON.parse(localStorage.getItem('clippy_users') || '[]');
      const user = users.find((u: any) => u.username === username && u.password === password);
      
      if (user) {
          // Ensure migration for old users who might not have a code
          if (!user.invitationCode) {
              user.invitationCode = generateInviteCode();
              // Update user in storage
              const updatedUsers = users.map((u: any) => u.username === user.username ? user : u);
              localStorage.setItem('clippy_users', JSON.stringify(updatedUsers));
          }

          const userSession = { username: user.username, name: user.name, invitationCode: user.invitationCode };
          localStorage.setItem('clippy_session', JSON.stringify(userSession));
          onLogin(userSession);
      } else {
          setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    }
  };

  const toggleMode = () => {
      setIsSignup(!isSignup);
      setError('');
      setUsername('');
      setPassword('');
      setName('');
      setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-white p-3 rounded-full shadow-lg">
                <PaperclipIcon className="h-10 w-10 text-primary" />
             </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Clippy</h1>
          <p className="text-red-100">AI 회의 비서 서비스</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-dark mb-6 text-center">
            {isSignup ? '회원가입' : '로그인'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">이름 (본인 지정용)</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="예: 김철수"
                    />
                </div>
            )}
            
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">아이디</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="아이디를 입력하세요"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">비밀번호</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="비밀번호를 입력하세요"
                />
            </div>

            {isSignup && (
                <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">비밀번호 확인</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        placeholder="비밀번호를 다시 입력하세요"
                    />
                </div>
            )}

            <button 
                type="submit" 
                className="w-full bg-primary text-white py-3.5 rounded-lg font-bold hover:bg-primary-hover transition-colors shadow-md mt-4"
            >
                {isSignup ? '가입하기' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                  {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
                  <button 
                    onClick={toggleMode}
                    className="text-primary font-bold hover:underline ml-1"
                  >
                      {isSignup ? '로그인' : '회원가입'}
                  </button>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};