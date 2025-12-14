import React from 'react';
import { BsHouse, BsCardChecklist, BsPeople, BsCalendar2Check, BsGear } from "react-icons/bs";
import { TabView } from '../App';

interface BottomNavigationProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabView; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: '홈', icon: BsHouse },
    { id: 'my-tasks', label: '할 일', icon: BsCardChecklist },
    { id: 'team-tasks', label: '팀 할 일', icon: BsPeople },
    { id: 'calendar', label: '캘린더', icon: BsCalendar2Check },
    { id: 'settings', label: '설정', icon: BsGear },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-4 z-40">
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-2 transition-colors group ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon 
                className={`h-6 w-6 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} 
              />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};