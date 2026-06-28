import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, ShieldCheck, ShieldAlert, BadgeInfo } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Profile Header glass card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 glow-teal">
        <div className="w-20 h-20 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-3xl border border-teal-200/20 shadow-inner">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{user?.name}</h2>
          <p className="text-xs text-slate-400">Consultation Account Profile</p>
          <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
            {user?.isVerified ? (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Account</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Pending Verification</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Detailed stats fields */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white text-base border-b border-slate-100 dark:border-slate-900 pb-3">
          Account Specifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-450">
              <User className="w-5 h-5" />
              <span className="text-sm font-semibold">Registered Name</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-450">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-semibold">Email Address</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-450">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-semibold">Member Since</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {formatDate(user?.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Information widget */}
      <div className="p-4.5 bg-blue-500/5 border border-blue-500/25 rounded-2xl flex items-start space-x-3">
        <BadgeInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700/85 dark:text-blue-400/85 leading-relaxed">
          Need to link credentials or modify account parameters? For security reasons, please contact system administrators or trigger security resets on the login screen.
        </p>
      </div>

    </div>
  );
};
