import React, { useState } from 'react';
import {
  Lock, Mail, ArrowRight, ShieldCheck, Sun, Moon,
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SmartSchoolLogo } from '../common/SmartSchoolLogo';

interface LoginProps {
  onSuccess?: () => void;
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onLoginSuccess }) => {
  const triggerSuccess = onLoginSuccess || onSuccess;
  const { loginWithCredentials, isLoading } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('faisalabbas@gmail.com');
  const [password, setPassword] = useState('faisal@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrUsername.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      await loginWithCredentials(emailOrUsername.trim(), password);
      if (triggerSuccess) triggerSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Invalid credentials. Please verify your email and password.';
      setError(msg);
    }
  };

  return (
    <div className={`relative h-dvh w-full flex flex-col overflow-hidden font-sans text-slate-800 antialiased selection:bg-[#C62828] selection:text-white ${isDarkMode ? 'dark' : ''}`}>
      {/* 100% Width and 100vh Height Fullscreen Background Image */}
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=80')`,
        }}
      />
      {/* Subtle overlay gradient across 100% width and 100vh height */}
      <div className={`fixed inset-0 backdrop-blur-[0.5px] ${isDarkMode ? 'bg-gradient-to-r from-black/65 via-black/50 to-black/70' : 'bg-gradient-to-r from-black/45 via-black/25 to-black/55'}`} />

      {/* Top Header - Matches Hand-Drawn Sketch (Logo + Finance & Accounts Portal) */}
      <header className="relative z-20 shrink-0 border-b border-white/20 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-md sticky top-0 dark:border-slate-700 dark:bg-slate-950/95">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SmartSchoolLogo height={64} variant="full" />
            <div className="hidden sm:block border-l border-slate-200 pl-3.5">
              <span className="block text-xs font-extrabold uppercase tracking-wider text-[#C62828]">
                Finance &amp; Accounts Portal
              </span>
              <span className="text-[11px] text-slate-500 font-medium dark:text-slate-400">
                The Smart School System • Academic Session 2025–2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-3 py-1 text-xs font-semibold text-red-800 shadow-xs dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C62828]" />
              <span className="hidden sm:inline">Enterprise Auth Guard Active</span>
              <span className="sm:hidden">Protected</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C62828]/40 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Pushed to the Right over 100% width & 100vh height background */}
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4 sm:py-8">
        {/* Elevated Form Card Container matching the sketch wireframe */}
        <div className="my-auto w-full max-w-md mx-auto lg:mr-0 rounded-3xl bg-white/98 backdrop-blur-xl p-6 sm:p-8 lg:p-9 shadow-2xl border border-white/60 dark:border-slate-700 dark:bg-slate-950/95">
          <div className="w-full space-y-5">
              
              {/* Form Header */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C62828]">
                  Verified Access
                </span>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5 dark:text-white">
                  Sign In to The Smart School
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-300">
                  Enter your verified staff or supplier credentials to proceed.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-shake dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5 dark:text-red-300" />
                  <div className="leading-snug">{error}</div>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5 dark:text-slate-200">
                    Official Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="e.g. faisalabbas@gmail.com"
                      required
                      autoFocus
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#C62828] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 transition dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    />
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Case sensitive
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#C62828] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 transition dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-400"
                    />
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      defaultChecked
                      className="rounded border-slate-300 text-[#C62828] focus:ring-[#C62828]"
                    />
                    <label htmlFor="rememberMe" className="text-xs text-slate-600 select-none dark:text-slate-300">
                      Keep me signed in
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-[#C62828] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#B71C1C] active:scale-[0.99] transition disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Bottom security assurance */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>256-bit Encrypted Session</span>
                </span>
                <span>The Smart School • ISO Certified</span>
              </div>

            </div>
          </div>
        </main>

      {/* Footer matching portal styling */}
      <footer className="relative z-20 shrink-0 border-t border-white/20 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 text-center text-xs text-slate-500 shadow-md dark:border-slate-700 dark:bg-slate-950/95 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 The Smart School System. Official Financial &amp; Administrative Management Portal.</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Head Office Campus • Faisal Abbas (GM / Super Admin)</p>
        </div>
      </footer>
    </div>
  );
};

export const LoginPage = Login;

