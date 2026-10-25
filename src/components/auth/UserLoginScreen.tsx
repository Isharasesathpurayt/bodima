import React, { useState } from 'react';
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  Sun,
  Moon,
  Home,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const UserLoginScreen: React.FC = () => {
  const { loginUser, registerUser, openSettings } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup inputs
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+94');
  const [signupPassword, setSignupPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(language === 'si' ? 'කරුණාකර දුරකථන අංකය ඇතුළත් කරන්න' : 'Please enter your phone number');
      return;
    }

    setError(null);
    setLoading(true);
    const res = await loginUser(identifier, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || (language === 'si' ? 'ලොග් වීම අසාර්ථක විය' : 'Login failed'));
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !signupPassword.trim()) {
      setError(language === 'si' ? 'නම, දුරකථන අංකය සහ මුරපදය අත්‍යවශ්‍යයි' : 'Name, phone and password are required');
      return;
    }

    setError(null);
    setLoading(true);
    const res = await registerUser(name, phone, signupPassword);
    setLoading(false);
    if (!res.success) {
      setError(res.error || (language === 'si' ? 'ගිණුම සෑදීම අසාර්ථක විය' : 'Sign up failed'));
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8f0e8_0%,_#f7f7f3_50%,_#f7f7f3_100%)] dark:bg-[radial-gradient(ellipse_at_top,_#17271d_0%,_#101713_55%,_#101713_100%)] flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header Controls */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md font-bold">
            <Home className="w-5 h-5" />
          </div>
          <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white">
            {language === 'si' ? 'බෝඩිම' : 'Bodima'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Database / Settings Toggle */}
          <button
            type="button"
            onClick={openSettings}
            className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-xs transition-colors"
            title={language === 'si' ? 'ඩේටාබේස් සහ සැකසුම්' : 'Database & Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-1.5 px-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-xs transition-colors"
          >
            {language === 'si' ? 'EN' : 'සිංහල'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 shadow-xs transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-4">
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-[2rem] shadow-[0_24px_80px_-36px_rgba(33,58,41,0.4)] border border-[#e6e9df] dark:border-slate-800 overflow-hidden">
          {/* Step Pill & Title */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/30">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'si' ? 'පියවර 1: පරිශීලක පිවිසුම' : 'Step 1: User Login'}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {mode === 'login'
                ? (language === 'si' ? 'ඔබගේ ගිණුමට ඇතුල් වන්න' : 'Log in to your account')
                : (language === 'si' ? 'නව ගිණුමක් සාදන්න' : 'Create a new account')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {mode === 'login'
                ? (language === 'si' ? 'බෝඩිමේ වියදම් සහ විස්තර බැලීමට පළමුව ලොග් වන්න' : 'Log in first to view boarding expenses and balance')
                : (language === 'si' ? 'නම, දුරකථන අංකය සහ මුරපදයක් දී ලියාපදිංචි වන්න' : 'Sign up with your name, phone and password')}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'si' ? 'පිවිසෙන්න' : 'Log In'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'si' ? 'නව ගිණුමක්' : 'Sign Up'}</span>
            </button>
          </div>

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {(error.includes('දැනටමත් ගිණුමක් ඇත') || error.toLowerCase().includes('already')) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setIdentifier(phone || name);
                      setError(null);
                    }}
                    className="self-start sm:self-auto px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shadow-xs"
                  >
                    {language === 'si' ? '👉 පිවිසෙන්න (Log In)' : '👉 Log In now'}
                  </button>
                )}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'දුරකථන අංකය' : 'Phone number'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={language === 'si' ? 'උදා: +9477... හෝ Kasun / ishara' : 'e.g. +9477... or Kasun / ishara'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'මුරපදය' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={language === 'si' ? 'මුරපදය ඇතුළත් කරන්න (Default: 123456)' : 'Enter password (Default: 123456)'}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{language === 'si' ? 'සත්‍යාපනය වෙමින්...' : 'Logging in...'}</span>
                  ) : (
                    <>
                      <span>{language === 'si' ? 'ලොග් වන්න' : 'Log In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'ඔබගේ නම *' : 'Your Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={language === 'si' ? 'උදා: ඉෂාර' : 'e.g. Ishara'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'දුරකථන අංකය (WhatsApp) *' : 'WhatsApp Phone *'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'රහස් මුරපදය *' : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder={language === 'si' ? 'අවම අකුරු 4ක මුරපදයක් සාදන්න' : 'Create a password (min 4 chars)'}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{language === 'si' ? 'ගිණුම සෑදෙමින්...' : 'Creating account...'}</span>
                  ) : (
                    <>
                      <span>{language === 'si' ? 'ගිණුම සාදන්න' : 'Sign Up'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
        <div>
          {language === 'si' ? 'බෝඩිමේ වියදම් කළමනාකරණ පද්ධතිය • Bodima.lk' : 'Boarding House Expense Management • Bodima.lk'}
        </div>
        <div className="font-medium text-gray-600 dark:text-gray-300">
          <span>{language === 'si' ? 'නිර්මාණය කළේ ' : 'Created by '}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ishara Sesathpura</span>
        </div>
      </footer>
    </div>
  );
};
