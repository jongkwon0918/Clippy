
import React, { useState } from 'react';
import { BsFileEarmarkText, BsMic, BsClipboard, BsPencilSquare, BsX} from "react-icons/bs";
interface UploadScreenProps {
  onFileUpload: (file: File) => void;
  onTextUpload: (text: string) => void;
  onAudioUpload: (file: File) => void;
  onManualCreate?: () => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onFileUpload, onTextUpload, onAudioUpload, onManualCreate }) => {
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAudioUpload(e.target.files[0]);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
        onTextUpload(textInput);
        setTextInput('');
        setShowTextModal(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto text-center relative">
      <h2 className="text-2xl font-bold text-dark mb-2">회의 요약 & 할 일 생성</h2>
      <p className="text-medium mb-6">분석할 파일을 선택하거나, 내용을 입력하세요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Text File Upload */}
        <label htmlFor="file-upload" className="group cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-red-50 transition-colors h-40">
          <BsFileEarmarkText className="h-8 w-8 text-gray-400 group-hover:text-primary mb-2" />
          <h3 className="font-semibold text-dark text-sm">파일 업로드</h3>
          <p className="text-[10px] text-gray-500 mt-1">.txt 파일</p>
        </label>
        <input 
          type="file"
          id="file-upload"
          className="hidden"
          accept=".txt"
          onChange={handleFileChange}
        />

        {/* Audio File Upload */}
        <label htmlFor="audio-upload" className="group cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-red-50 transition-colors h-40">
          <BsMic className="h-8 w-8 text-gray-400 group-hover:text-primary mb-2" />
          <h3 className="font-semibold text-dark text-sm">음성 파일</h3>
          <p className="text-[10px] text-gray-500 mt-1">.mp3, .wav 등</p>
        </label>
        <input 
          type="file"
          id="audio-upload"
          className="hidden"
          accept="audio/*"
          onChange={handleAudioChange}
        />

        {/* Paste Text */}
        <div onClick={() => setShowTextModal(true)} className="group cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-red-50 transition-colors h-40">
            <BsClipboard className="h-8 w-8 text-gray-400 group-hover:text-primary mb-2" />
            <h3 className="font-semibold text-dark text-sm">텍스트 입력</h3>
            <p className="text-[10px] text-gray-500 mt-1">직접 붙여넣기</p>
        </div>

        {/* Manual Create */}
        {onManualCreate && (
            <div onClick={onManualCreate} className="group cursor-pointer p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-red-50 transition-colors h-40">
                <BsPencilSquare className="h-8 w-8 text-gray-400 group-hover:text-primary mb-2" />
                <h3 className="font-semibold text-dark text-sm">직접 추가</h3>
                <p className="text-[10px] text-gray-500 mt-1">할 일 직접 생성</p>
            </div>
        )}
      </div>

      {/* Text Input Modal */}
      {showTextModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-bold text-lg">텍스트 직접 입력</h3>
                    <button onClick={() => setShowTextModal(false)} className="text-gray-400 hover:text-gray-600">
                        <BsX className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-4 flex-grow">
                    <textarea 
                        className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary resize-none"
                        placeholder="회의 내용이나 할 일을 여기에 붙여넣으세요..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    ></textarea>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
                    <button 
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim()}
                        className={`px-4 py-2 rounded-lg font-semibold ${textInput.trim() ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        분석 시작
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};
