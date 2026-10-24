import React, { useState } from 'react';
import {
  Home,
  Key,
  Lock,
  ArrowRight,
  PlusCircle,
  LogIn,
  Sun,
  Moon,
  AlertCircle,
  LogOut,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const BodimaLoginScreen: React.FC = () => {
  const { user, connectBodima, registerBodima, logout, openSettings } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'join' | 'register'>('join');

  // Join fields
  const [bodimaName, setBodimaName] = useState('');
  const [bodimaPassword, setBodimaPassword] = useState('');

  // Register fields
  const [newBodimaName, setNewBodimaName] = useState('');
  const [newBodimaPassword, setNewBodimaPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bodimaName.trim() || !bodimaPassword.trim()) {
      setError(language === 'si' ? 'බෝඩිමේ නම සහ මුරපදය ඇතුළත් කරන්න' : 'Bodima name and password are required');
      return;
    }

    setError(null);
    setLoading(true);
    const res = await connectBodima(bodimaName.trim(), bodimaPassword.trim());
    setLoading(false);
    if (!res.success) {
      setError(res.error || (language === 'si' ? 'බෝඩිමට සම්බන්ධ වීමට නොහැකි විය' : 'Failed to connect to bodima'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBodimaName.trim() || !newBodimaPassword.trim()) {
      setError(language === 'si' ? 'බෝඩිමේ නම සහ මුරපදය අත්‍යවශ්‍යයි' : 'Bodima name and password are required');
      return;
    }

    setError(null);
    setLoading(true);
    const res = await registerBodima(newBodimaName.trim(), newBodimaPassword.trim(), user?.name, user?.phone);
    setLoading(false);
    if (!res.success) {
      setError(res.error || (language === 'si' ? 'බෝඩිම ලියාපදිංචි කිරීම අසාර්ථක විය' : 'Failed to register bodima'));
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

      {/* Main Bodima Connect Card */}
      <main className="max-w-md w-full mx-auto my-auto py-4">
        {/* User Status Bar */}
        <div className="mb-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {language === 'si' ? `ආයුබෝවන්, ${user?.name}!` : `Welcome, ${user?.name}!`}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">
                {user?.phone}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            title={language === 'si' ? 'ගිණුමෙන් ඉවත් වන්න' : 'Log out'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'si' ? 'ඉවත්වන්න' : 'Logout'}</span>
          </button>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 rounded-[2rem] shadow-[0_24px_80px_-36px_rgba(33,58,41,0.4)] border border-[#e6e9df] dark:border-slate-800 overflow-hidden">
          {/* Step 2 Pill & Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/30">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{language === 'si' ? 'පියවර 2: බෝඩිමට පිවිසීම' : 'Step 2: Connect to Bodima'}</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {mode === 'join'
                ? (language === 'si' ? 'ඔබගේ බෝඩිමට සම්බන්ධ වන්න' : 'Connect to your Bodima')
                : (language === 'si' ? 'නව බෝඩිමක් ලියාපදිංචි කරන්න' : 'Register a New Bodima')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {mode === 'join'
                ? (language === 'si' ? 'බෝඩිමේ නම සහ මුරපදය ලබා දී සම්බන්ධ වන්න' : 'Enter bodima name and password to connect')
                : (language === 'si' ? 'නව බෝඩිමක් ලියාපදිංචි කර එහි පරිපාලක (Admin) වන්න' : 'Register a new bodima and become an Admin')}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'join'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'si' ? 'බෝඩිමට සම්බන්ධ වීම' : 'Join Bodima'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'si' ? 'අලුත් බෝඩිමක්' : 'Register Bodima'}</span>
            </button>
          </div>

          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'join' ? (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'බෝඩිමේ නම *' : 'Bodima Name *'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={bodimaName}
                      onChange={e => setBodimaName(e.target.value)}
                      placeholder={language === 'si' ? 'උදා: karagasthalawa හෝ අපේ බෝඩිම' : 'e.g. karagasthalawa or our bodima'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'බෝඩිමේ මුරපදය *' : 'Bodima Password *'}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={bodimaPassword}
                      onChange={e => setBodimaPassword(e.target.value)}
                      placeholder={language === 'si' ? 'බෝඩිමේ මුරපදය ඇතුළත් කරන්න' : 'Enter bodima password'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{language === 'si' ? 'සම්බන්ධ වෙමින්...' : 'Connecting...'}</span>
                  ) : (
                    <>
                      <span>{language === 'si' ? 'බෝඩිමට ඇතුල් වන්න' : 'Connect to Bodima'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'නව බෝඩිමේ නම *' : 'New Bodima Name *'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={newBodimaName}
                      onChange={e => setNewBodimaName(e.target.value)}
                      placeholder={language === 'si' ? 'උදා: karagasthalawa හෝ මල්වත්ත බෝඩිම' : 'e.g. karagasthalawa or Malwatta Bodima'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {language === 'si' ? 'බෝඩිමේ රහස් මුරපදය *' : 'Bodima Password *'}
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={newBodimaPassword}
                      onChange={e => setNewBodimaPassword(e.target.value)}
                      placeholder={language === 'si' ? 'සාමාජිකයන්ට දීමට මුරපදයක් සාදන්න' : 'Create a password to share with members'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    {language === 'si' ? 'භාරකරු විස්තර (Admin):' : 'Creator / Admin Details:'}
                  </div>
                  <div className="text-[11px] text-gray-700 dark:text-gray-300">
                    {language === 'si' ? 'නම:' : 'Name:'} <span className="font-bold">{user?.name}</span>
                  </div>
                  <div className="text-[11px] text-gray-700 dark:text-gray-300">
                    {language === 'si' ? 'දුරකථනය:' : 'Phone:'} <span className="font-bold">{user?.phone}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{language === 'si' ? 'ලියාපදිංචි වෙමින්...' : 'Registering...'}</span>
                  ) : (
                    <>
                      <span>{language === 'si' ? 'බෝඩිම ලියාපදිංචි කරන්න' : 'Register Bodima'}</span>
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
