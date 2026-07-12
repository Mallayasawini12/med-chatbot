import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, MessageSquarePlus, User, AlertOctagon, LogOut, Stethoscope, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chat', label: 'AI Consultation', icon: MessageSquarePlus },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/emergency', label: 'Emergency Help', icon: AlertOctagon, highlight: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-45 bg-slate-900/40 backdrop-blur-sm md:hidden"
        ></div>
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 glass-panel border-r border-slate-200 dark:border-slate-800/80 p-5 flex flex-col justify-between transition-transform duration-300 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900">
            <div className="flex items-center space-x-2.5 text-teal-600 dark:text-teal-400">
              <Stethoscope className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">SymptomCare</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 md:hidden hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10'
                        : item.highlight
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer/Logout Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-900">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold border border-teal-500/10">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
