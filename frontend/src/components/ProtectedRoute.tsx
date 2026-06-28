import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <div className="absolute w-8 h-8 bg-teal-500/10 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium animate-pulse">Securing session...</p>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page, preserving the original destination path
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
