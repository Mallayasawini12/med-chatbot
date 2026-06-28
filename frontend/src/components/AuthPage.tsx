import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogIn, User as UserIcon, Lock } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { googleLogin, user, bypassAuth } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setSubmitting(true);
    try {
      // Direct local login bypass using inputted Name
      bypassAuth(name, 'patient@symptomcare.ai');
      navigate('/dashboard');
    } catch (err: any) {
      setError('Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await googleLogin('john.doe@gmail.com', 'John Doe', 'google_oauth_123456789');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-md p-8 bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl shadow-xl backdrop-blur-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">SymptomCare AI</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consult with our AI medical assistant</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="yash"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer mt-6"
          >
            <LogIn className="w-4 h-4" />
            <span>{submitting ? 'Connecting...' : 'Login'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-semibold tracking-wider">Or</span>
          </div>
        </div>

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleMockGoogleLogin}
          disabled={submitting}
          className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-700 dark:text-slate-300 font-semibold transition-all flex items-center justify-center space-x-2 text-sm bg-white/30 cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 0 12 0 7.35 0 3.37 2.67 1.43 6.56l3.86 3C6.26 6.56 8.94 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.65 2.84c2.14-1.97 3.38-4.88 3.38-8.54z" />
            <path fill="#FBBC05" d="M5.29 14.6c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.43 7.08C.52 8.92 0 10.98 0 13.12s.52 4.2 1.43 6.04l3.86-3.04z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.31 1.09-3.06 0-5.74-2.02-6.71-5.04l-3.86 3C3.37 21.33 7.35 24 12 24z" />
          </svg>
          <span>Login with Google</span>
        </button>
      </div>
    </div>
  );
};
