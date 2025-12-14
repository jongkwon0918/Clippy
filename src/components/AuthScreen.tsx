import React, { useState } from 'react';
import { User } from '../types';
// 파이어베이스 기능 임포트
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

// ✅ 오리지널 선 스타일 클립 아이콘 (SVG 직접 정의로 라이브러리 의존성 제거)
const PaperclipIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" />
  </svg>
);

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); 

  // 6자리 초대 코드 생성
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (isSignup) {
            // === 회원가입 로직 ===
            if (!email || !password || !name || !confirmPassword) {
                 throw new Error('모든 필드를 입력해주세요.');
            }
            if (password !== confirmPassword) {
                 throw new Error('비밀번호가 일치하지 않습니다.');
            }

            // 1. 파이어베이스 인증 서버에 계정 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // 2. 초대 코드 생성
            const newInviteCode = generateInviteCode();

            // 3. 프로필 업데이트 (표시 이름 설정)
            await updateProfile(user, { displayName: name });

            // 4. Firestore DB에 사용자 추가 정보 저장
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                name: name,
                invitationCode: newInviteCode,
                createdAt: new Date().toISOString()
            });

            // 5. 앱 로그인 상태 처리
            onLogin({ 
                username: user.email || '', 
                name: name, 
                invitationCode: newInviteCode 
            });

        } else {
            // === 로그인 로직 ===
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Firestore에서 사용자 정보 가져오기
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                onLogin({ 
                    username: user.email || '', 
                    name: userData.name || user.displayName || '사용자', 
                    invitationCode: userData.invitationCode || '' 
                });
            } else {
                onLogin({
                    username: user.email || '',
                    name: user.displayName || '사용자',
                    invitationCode: ''
                });
            }
        }
    } catch (err: any) {
        console.error(err);
        if (err instanceof FirebaseError) {
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('이미 사용 중인 이메일입니다.');
                    break;
                case 'auth/invalid-email':
                    setError('유효하지 않은 이메일 형식입니다.');
                    break;
                case 'auth/weak-password':
                    setError('비밀번호는 6자리 이상이어야 합니다.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('이메일 또는 비밀번호가 올바르지 않습니다.');
                    break;
                default:
                    setError('로그인/가입 중 오류가 발생했습니다: ' + err.code);
            }
        } else {
            setError(err.message || '알 수 없는 오류가 발생했습니다.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsSignup(!isSignup);
      setError('');
      setEmail('');
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
                        disabled={isLoading}
                    />
                </div>
            )}
            
            <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">이메일</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="example@clippy.com"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                        disabled={isLoading}
                    />
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-primary text-white py-3.5 rounded-lg font-bold transition-colors shadow-md mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-hover'}`}
            >
                {isLoading ? '처리 중...' : (isSignup ? '가입하기' : '로그인')}
            </button>
          </form>

          <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                  {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
                  <button 
                    onClick={toggleMode}
                    className="text-primary font-bold hover:underline ml-1"
                    disabled={isLoading}
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