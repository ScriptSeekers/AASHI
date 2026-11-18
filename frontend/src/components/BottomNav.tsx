import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Zap, History, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const tabs = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Quick Duel', path: '/duel', icon: Zap },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'History', path: '/history', icon: History },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-aashi-cloud/95 backdrop-blur-lg border-t border-aashi-pink/40 px-2 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-aashi-berry font-bold scale-105'
                  : 'text-aashi-plum/60 hover:text-aashi-plum'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-aashi-pink/40' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
