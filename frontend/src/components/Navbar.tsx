import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Stethoscope, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/chat': return 'AI Consultation';
      case '/profile': return 'My Profile';
      case '/emergency': return 'Emergency Help';
      default: return 'SymptomCare AI';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between transition-colors duration-300">
      
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 md:hidden hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2 md:hidden">
          <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <span className="font-bold text-slate-800 dark:text-white text-base">SymptomCare AI</span>
        </div>

        <h1 className="hidden md:block font-bold text-xl text-slate-800 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold hover:scale-105 transition-all cursor-pointer border border-teal-200/20"
              title="View Profile"
            >
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </button>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{user.name}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1"></span>
                Account Active
              </p>
            </div>
          </div>
        )}
      </div>

    </header>
  );
};
