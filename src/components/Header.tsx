import React from 'react';
import { PaperclipIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-start">
        <div className="flex items-center">
            <PaperclipIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-dark ml-2">Clippy</h1>
        </div>
      </div>
    </header>
  );
};