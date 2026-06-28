import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle, Eye, EyeOff, Activity, Stethoscope, Lock, Mail, User as UserIcon, LogIn, KeyRound } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, googleLogin, forgotPassword, resetPassword, verifyEmail, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine active view from URL search params (default to sign-in)
  const viewParam = searchParams.get('view') || 'signin';
  const tokenParam = searchParams.get('token') || '';

  const [activeView, setActiveView] = useState<'signin' | 'signup' | 'forgot' | 'verify' | 'reset'>(
    viewParam as any
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status handlers
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password strength calculation
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-red-500' });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Sync view with query parameters
    if (viewParam === 'verify' || viewParam === 'reset-password') {
      setActiveView(viewParam === 'verify' ? 'verify' : 'reset');
    } else {
      setActiveView(viewParam as any);
    }
    setError(null);
    setSuccess(null);
  }, [viewParam]);

  // Handle direct verification link trigger
  useEffect(() => {
    if (activeView === 'verify' && tokenParam) {
      handleVerification(tokenParam);
    }
  }, [activeView, tokenParam]);

  const handleVerification = async (tok: string) => {
    setSubmitting(true);
    try {
      const msg = await verifyEmail(tok);
      setSuccess(msg);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);

    if (!val) {
      setPasswordStrength({ score: 0, label: '', color: 'bg-transparent' });
      return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/\d/.test(val)) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;

    let label = 'Very Weak';
    let color = 'bg-red-500';

    if (score === 2) {
      label = 'Weak';
      color = 'bg-orange-500';
    } else if (score === 3) {
      label = 'Moderate';
      color = 'bg-yellow-500';
    } else if (score >= 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
    }

    setPasswordStrength({ score, label, color });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (activeView === 'signin') {
        await login(email, password, rememberMe);
        navigate('/dashboard');
      } else if (activeView === 'signup') {
        if (passwordStrength.score < 3) {
          throw new Error('Please choose a stronger password.');
        }
        const msg = await register(name, email, password);
        setSuccess(msg);
        // Clear fields
        setName('');
        setEmail('');
        setPassword('');
      } else if (activeView === 'forgot') {
        const msg = await forgotPassword(email);
        setSuccess(msg);
        setEmail('');
      } else if (activeView === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const msg = await resetPassword(password, tokenParam);
        setSuccess(msg);
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSearchParams({ view: 'signin' });
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      // Simulate Google Login payload
      await googleLogin(
        'john.doe@gmail.com',
        'John Doe',
        'google_oauth_123456789'
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
        
        {/* Left column: App Branding Info */}
        <div className="md:col-span-5 flex flex-col justify-between p-6 text-slate-800 dark:text-slate-200">
          <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400">
            <Stethoscope className="w-9 h-9" />
            <span className="text-2xl font-bold tracking-tight">SymptomCare AI</span>
          </div>

          <div className="my-10 space-y-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              AI-Powered <br />
              <span className="text-teal-600 dark:text-teal-400">Symptom Checking</span> <br />
              Made Instant & Safe.
            </h1>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Log in to consult with our medical AI assistant, view condition statistics, and track your clinical symptoms dynamically.
            </p>

            {/* Health Pulse Line simulation */}
            <div className="pt-4 flex items-center space-x-4">
              <div className="p-3 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Empathetic Consultations</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Trained on healthcare guidelines</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            &copy; 2026 SymptomCare AI. All rights reserved. Not a replacement for professional clinical care.
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="glass-panel-heavy p-8 rounded-3xl shadow-xl w-full max-w-lg mx-auto glow-teal relative">
            
            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded-xl flex items-center space-x-2 text-sm"
                >
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center space-x-2 text-sm"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              
              {/* 1. SIGN IN VIEW */}
              {activeView === 'signin' && (
                <motion.div
                  key="signin"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your details to log in to your account</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Password</label>
                        <button
                          type="button"
                          onClick={() => setSearchParams({ view: 'forgot' })}
                          className="text-xs font-semibold text-teal-600 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & submit */}
                    <div className="flex items-center justify-between py-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Remember Me</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                    </button>
                  </form>

                  {/* Google OAuth Option */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500 dark:text-slate-400">Or continue with</span></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMockGoogleLogin}
                    disabled={submitting}
                    className="w-full py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-300 font-semibold transition-all flex items-center justify-center space-x-2 text-sm bg-white/30"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 0 12 0 7.35 0 3.37 2.67 1.43 6.56l3.86 3C6.26 6.56 8.94 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.65 2.84c2.14-1.97 3.38-4.88 3.38-8.54z" />
                      <path fill="#FBBC05" d="M5.29 14.6c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.43 7.08C.52 8.92 0 10.98 0 13.12s.52 4.2 1.43 6.04l3.86-3.04z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.31 1.09-3.06 0-5.74-2.02-6.71-5.04l-3.86 3C3.37 21.33 7.35 24 12 24z" />
                    </svg>
                    <span>Google Sign In (Instant Mock)</span>
                  </button>

                  <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    New to SymptomCare?{' '}
                    <button
                      onClick={() => setSearchParams({ view: 'signup' })}
                      className="font-bold text-teal-600 hover:underline"
                    >
                      Create Account
                    </button>
                  </p>
                </motion.div>
              )}

              {/* 2. SIGN UP VIEW */}
              {activeView === 'signup' && (
                <motion.div
                  key="signup"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Register to evaluate symptoms and save checks</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Min 6 characters, 1 number"
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Password strength meter */}
                      {password && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Strength:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{passwordStrength.label}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 text-sm mt-4"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{submitting ? 'Registering...' : 'Register'}</span>
                    </button>
                  </form>

                  <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => setSearchParams({ view: 'signin' })}
                      className="font-bold text-teal-600 hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.div>
              )}

              {/* 3. FORGOT PASSWORD VIEW */}
              {activeView === 'forgot' && (
                <motion.div
                  key="forgot"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Enter your email and we'll send a link to reset your credentials</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{submitting ? 'Requesting Reset...' : 'Send Reset Link'}</span>
                    </button>
                  </form>

                  <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Back to{' '}
                    <button
                      onClick={() => setSearchParams({ view: 'signin' })}
                      className="font-bold text-teal-600 hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.div>
              )}

              {/* 4. VERIFY EMAIL VIEW (Redirected landing) */}
              {activeView === 'verify' && (
                <motion.div
                  key="verify"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Email Verification</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Processing your authentication token...</p>

                  {submitting && (
                    <div className="py-6 flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                      <span className="text-xs text-slate-400 font-medium">Verifying code...</span>
                    </div>
                  )}

                  {!submitting && (
                    <button
                      onClick={() => setSearchParams({ view: 'signin' })}
                      className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md"
                    >
                      Go to Sign In
                    </button>
                  )}
                </motion.div>
              )}

              {/* 5. RESET PASSWORD VIEW */}
              {activeView === 'reset' && (
                <motion.div
                  key="reset"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Define a new password for your account</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Min 6 characters, 1 number"
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {/* Password strength meter */}
                      {password && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Strength:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{passwordStrength.label}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{submitting ? 'Resetting Password...' : 'Save New Password'}</span>
                    </button>
                  </form>
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};
