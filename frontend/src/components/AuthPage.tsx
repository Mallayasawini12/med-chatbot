import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, 
  LogIn, 
  User as UserIcon, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify';

export const AuthPage: React.FC = () => {
  const { login, googleLogin, register, forgotPassword, resetPassword, verifyEmail, bypassAuth, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine initial view based on query parameters
  const getInitialView = (): AuthView => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'verify') return 'verify';
    if (viewParam === 'reset-password') return 'reset';
    return 'signin';
  };

  const [view, setView] = useState<AuthView>(getInitialView());
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Verification View states
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Password requirements criteria
  const isLengthValid = password.length >= 6;
  const hasDigit = /\d/.test(password);
  const hasSpecialOrUpper = /[!@#$%^&*(),.?":{}|<>]/.test(password) || /[A-Z]/.test(password);

  // Password strength scoring: 0 = Empty, 1 = Weak, 2 = Medium, 3 = Strong
  const getPasswordStrength = () => {
    if (!password) return 0;
    if (isLengthValid && hasDigit) {
      return hasSpecialOrUpper ? 3 : 2;
    }
    return 1;
  };

  const strengthScore = getPasswordStrength();

  // Navigate to dashboard if user is already logged in
  useEffect(() => {
    if (user && view !== 'verify') {
      navigate('/dashboard');
    }
  }, [user, view, navigate]);

  // Sync state view if URL params change (e.g. email verification link clicked)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'verify') {
      setView('verify');
    } else if (viewParam === 'reset-password') {
      setView('reset');
    }
  }, [searchParams]);

  // Email verification auto-trigger on view mount
  useEffect(() => {
    if (view === 'verify') {
      const token = searchParams.get('token');
      if (token) {
        handleEmailVerification(token);
      } else {
        setVerificationError('No verification token was provided in the link.');
      }
    }
  }, [view]);

  const handleEmailVerification = async (token: string) => {
    setVerifying(true);
    setVerificationError(null);
    try {
      await verifyEmail(token);
      setSuccessMsg('Email verified successfully! You can now sign in.');
    } catch (err: any) {
      setVerificationError(err.message || 'Email verification failed or link has expired.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (view === 'signin') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please fill in all credentials.');
        }
        await login(email, password, rememberMe);
        navigate('/dashboard');
      } 
      else if (view === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error('All fields are required.');
        }
        if (!isLengthValid || !hasDigit) {
          throw new Error('Password does not meet validation requirements.');
        }
        const message = await register(name, email, password);
        setSuccessMsg(message || 'Account created successfully! Check your inbox to verify.');
        setView('signin');
        // Clear fields
        setName('');
        setEmail('');
        setPassword('');
      } 
      else if (view === 'forgot') {
        if (!email.trim()) {
          throw new Error('Email address is required.');
        }
        const message = await forgotPassword(email);
        setSuccessMsg(message || 'A password reset link has been dispatched to your email.');
      } 
      else if (view === 'reset') {
        const token = searchParams.get('token');
        if (!token) {
          throw new Error('Reset token is missing from the link.');
        }
        if (!password.trim()) {
          throw new Error('Please enter a new password.');
        }
        if (!isLengthValid || !hasDigit) {
          throw new Error('Password does not meet validation requirements.');
        }
        const message = await resetPassword(password, token);
        setSuccessMsg(message || 'Your password has been reset. You can now log in.');
        setSearchParams({});
        setView('signin');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await googleLogin('john.doe@gmail.com', 'John Doe', 'google_oauth_123456789');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestBypass = () => {
    setError(null);
    bypassAuth('Guest Patient', 'guest@symptomcare.ai');
    navigate('/dashboard');
  };

  const switchView = (targetView: AuthView) => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setSearchParams({});
    setView(targetView);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative Spheres in background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Centered Glassmorphic Form Panel */}
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-xl backdrop-blur-md relative overflow-hidden glow-teal z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
            <Stethoscope className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">SymptomCare AI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">AI-Powered Medical Symptom Assistant</p>
        </div>

        <AnimatePresence mode="wait">
          
          {/* VIEW: EMAIL VERIFICATION */}
          {view === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Account Verification</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verifying your clinical portal security token</p>
              </div>

              {verifying ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  <span className="text-xs text-slate-500">Contacting auth server...</span>
                </div>
              ) : verificationError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-start space-x-3 text-left">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">Verification Failed</p>
                    <p className="leading-relaxed">{verificationError}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-start space-x-3 text-left">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">Verification Successful</p>
                    <p className="leading-relaxed">{successMsg || 'Your email address is verified. You may now log in.'}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => switchView('signin')}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Go to Sign In</span>
              </button>
            </motion.div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <button
                  onClick={() => switchView('signin')}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-350 rounded-xl transition-all mb-4 flex items-center space-x-1 text-[11px] font-semibold border border-transparent dark:border-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Forgot Password?</h2>
                  <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">We will send you instructions to reset your password</p>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-205 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Send Recovery Link</span>}
                </button>
              </form>
            </motion.div>
          )}

          {/* VIEW: RESET PASSWORD */}
          {view === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Password</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Set a secure password for your clinical portal</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-205 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength UI */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Password Strength</span>
                      <span className={`font-bold uppercase ${
                        strengthScore === 1 ? 'text-red-500' :
                        strengthScore === 2 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {strengthScore === 1 ? 'Weak' : strengthScore === 2 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : ''}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : ''}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : ''}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${isLengthValid ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>Min 6 characters</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasDigit ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>At least 1 number</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 col-span-2 mt-0.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasSpecialOrUpper ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>Uppercase & Special character (optional)</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || strengthScore < 2}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Update Password</span>}
                </button>
              </form>
            </motion.div>
          )}

          {/* VIEW: SIGN IN */}
          {view === 'signin' && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sign in to resume clinical evaluations</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5 animate-bounce">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    Remember My Session
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md hover:shadow-teal-500/10 flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                </button>
              </form>

              {/* Separator */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold tracking-wider">Or</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  className="w-full py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 font-bold transition-all flex items-center justify-center space-x-2 text-xs bg-white/30 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 0 12 0 7.35 0 3.37 2.67 1.43 6.56l3.86 3C6.26 6.56 8.94 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.65 2.84c2.14-1.97 3.38-4.88 3.38-8.54z" />
                    <path fill="#FBBC05" d="M5.29 14.6c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.43 7.08C.52 8.92 0 10.98 0 13.12s.52 4.2 1.43 6.04l3.86-3.04z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.31 1.09-3.06 0-5.74-2.02-6.71-5.04l-3.86 3C3.37 21.33 7.35 24 12 24z" />
                  </svg>
                  <span>Login with Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestBypass}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold rounded-2xl transition-all flex items-center justify-center space-x-1.5 text-xs cursor-pointer border border-transparent dark:border-slate-800/40"
                >
                  <span>Continue as Guest</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-450 dark:text-slate-400">New to portal? </span>
                <button
                  onClick={() => switchView('signup')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW: SIGN UP */}
          {view === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Portal Account</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Register for secure clinical analysis logs</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center flex items-center justify-center space-x-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-350 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength UI */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-550 dark:text-slate-400 font-bold uppercase">Password Strength</span>
                      <span className={`font-bold uppercase ${
                        strengthScore === 1 ? 'text-red-500' :
                        strengthScore === 2 ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {strengthScore === 1 ? 'Weak' : strengthScore === 2 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? 'bg-red-500' : ''}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : ''}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : ''}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${isLengthValid ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>Min 6 characters</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasDigit ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>At least 1 number</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 col-span-2 mt-0.5">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasSpecialOrUpper ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>Uppercase & Special character (optional)</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || strengthScore < 2}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Register Account</span>}
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold tracking-wider">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={submitting}
                className="w-full py-3 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 font-bold transition-all flex items-center justify-center space-x-2 text-xs bg-white/30 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 0 12 0 7.35 0 3.37 2.67 1.43 6.56l3.86 3C6.26 6.56 8.94 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.65 2.84c2.14-1.97 3.38-4.88 3.38-8.54z" />
                  <path fill="#FBBC05" d="M5.29 14.6c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.43 7.08C.52 8.92 0 10.98 0 13.12s.52 4.2 1.43 6.04l3.86-3.04z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.31 1.09-3.06 0-5.74-2.02-6.71-5.04l-3.86 3C3.37 21.33 7.35 24 12 24z" />
                </svg>
                <span>Sign Up with Google</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-450 dark:text-slate-400">Already registered? </span>
                <button
                  onClick={() => switchView('signin')}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};
