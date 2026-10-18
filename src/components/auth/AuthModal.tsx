import React, { useState } from 'react';
import {
  X,
  Home,
  Key,
  User,
  Phone,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, joinBodima, registerBodima } = useAuth();
  const { language } = useLanguage();

  const [mode, setMode] = useState<'join' | 'register'>('join');

  // Join fields
  const [bodimaName, setBodimaName] = useState('අපේ බෝඩිම');
  const [bodimaPassword, setBodimaPassword] = useState('1234');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('+94');

  // Register Bodima fields
  const [newBodimaName, setNewBodimaName] = useState('');
  const [newBodimaPassword, setNewBodimaPassword] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorPhone, setCreatorPhone] = useState('+94');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await joinBodima(bodimaName, bodimaPassword, userName || 'සාමාජික', userPhone);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'සම්බන්ධ වීමට නොහැකි විය');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await registerBodima(newBodimaName, newBodimaPassword, creatorName, creatorPhone);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'බෝඩිම ලියාපදිංචි කිරීම අසාර්ථක විය');
    }
  };

  const handleQuickJoin = (bName: string, bPass: string, uName: string) => {
    setBodimaName(bName);
    setBodimaPassword(bPass);
    setUserName(uName);
    joinBodima(bName, bPass, uName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {mode === 'join'
                  ? (language === 'si' ? 'බෝඩිමට සම්බන්ධ වන්න' : 'Connect to Bodima')
                  : (language === 'si' ? 'අලුත් බෝඩිමක් ලියාපදිංචි කරන්න' : 'Register New Bodima')}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {mode === 'join'
                  ? (language === 'si' ? 'බෝඩිමේ නම සහ මුරපදය ගසා සම්බන්ධ වන්න' : 'Enter bodima name and password to connect')
                  : (language === 'si' ? 'ඔබේ බෝඩිමට නමක් සහ මුරපදයක් සාදන්න' : 'Create a name and password for your bodima')}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-100/50 dark:bg-slate-950">
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              mode === 'join'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {language === 'si' ? 'බෝඩිමට සම්බන්ධ වීම' : 'Join Bodima'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {language === 'si' ? '+ අලුත් බෝඩිමක්' : '+ Register Bodima'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Join Bodima Form */}
        {mode === 'join' ? (
          <div className="p-6 space-y-4">
            <form onSubmit={handleJoinSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'බෝඩිමේ නම *' : 'Bodima Name *'}
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'si' ? 'උදා: අපේ බෝඩිම' : 'e.g. ape bodima'}
                    value={bodimaName}
                    onChange={e => setBodimaName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'බෝඩිමේ මුරපදය *' : 'Bodima Password *'}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={bodimaPassword}
                    onChange={e => setBodimaPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'ඔබේ නම' : 'Your Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={language === 'si' ? 'උදා: කසුන් / චාමර' : 'e.g. Kasun / Chamara'}
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{loading ? (language === 'si' ? 'සම්බන්ධ වෙමින්...' : 'Connecting...') : (language === 'si' ? 'බෝඩිමට සම්බන්ධ වන්න' : 'Connect to Bodima')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Demo Connect */}
            <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block mb-2">
                {language === 'si' ? 'ක්ෂණිකව සම්බන්ධ වීමට (Demo):' : 'Quick Connect (Demo):'}
              </span>
              <button
                type="button"
                onClick={() => handleQuickJoin('අපේ බෝඩිම', '1234', 'කසුන් පෙරේරා')}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left border border-gray-200 dark:border-slate-700 transition-colors flex items-center justify-between"
              >
                <div>
                  <strong className="block text-xs text-gray-900 dark:text-white">අපේ බෝඩිම</strong>
                  <span className="text-[10px] text-gray-500">{language === 'si' ? 'මුරපදය: 1234' : 'Password: 1234'}</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {language === 'si' ? 'සම්බන්ධ වන්න →' : 'Connect →'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Register New Bodima Form */
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'අලුත් බෝඩිමේ නම *' : 'New Bodima Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'si' ? 'උදා: මහරගම කොල්ලන්ගෙ බෝඩිම' : 'e.g. Maharagama Bodima'}
                value={newBodimaName}
                onChange={e => setNewBodimaName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'බෝඩිමට පොදු මුරපදයක් *' : 'Bodima Password *'}
              </label>
              <input
                type="password"
                required
                placeholder={language === 'si' ? 'සාමාජිකයින්ට සම්බන්ධ වීමට දෙන මුරපදය' : 'Password to share with roommates'}
                value={newBodimaPassword}
                onChange={e => setNewBodimaPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'ඔබේ නම (Admin) *' : 'Your Name (Admin) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'si' ? 'උදා: කසුන්' : 'e.g. Kasun'}
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'WhatsApp දුරකථන *' : 'WhatsApp Phone *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+947XXXXXXXX"
                  value={creatorPhone}
                  onChange={e => setCreatorPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
              {language === 'si'
                ? '✓ බෝඩිම සෑදූ පසු ඔබට කුලිය, කෑම හා සබන් එකතුකිරීම් ස්වයංක්‍රීයව ලැබේ.'
                : '✓ Rent, food, and supply collections will be automatically set up for your boarding house.'}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{loading ? (language === 'si' ? 'ලියාපදිංචි කරමින්...' : 'Registering...') : (language === 'si' ? 'බෝඩිම සාදන්න' : 'Create Bodima')}</span>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
