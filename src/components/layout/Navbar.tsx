import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Globe,
  Home,
  ShieldCheck,
  User,
  Lock,
  LogOut,
  Bell
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useBodima } from '../../context/BodimaContext';
import { useAuth } from '../../context/AuthContext';
import { MobileDrawer } from './MobileDrawer';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { activeTab, setActiveTab, getOverduePayments } = useBodima();
  const { user, bodima, isAuthenticated, isCollectorOrAdmin, openAuthModal, openSettings, leaveBodima, logout } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: Hamburger Menu (ඉරි තුන) + Clean Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button (ඉරි තුනක්) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 -ml-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open Menu"
              title={language === 'si' ? 'මෙනුව' : 'Menu'}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo: Just "බෝඩිම" without any sentence underneath */}
            <div
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold group-hover:scale-105 transition-transform">
                <Home className="w-4 h-4" />
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white font-sans">
                {language === 'si' ? 'බෝඩිම' : 'Bodima'}
              </span>
              {bodima && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    leaveBodima();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                  title={t.nav.switchBodima}
                >
                  <span>🏠 {bodima.name}</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-normal">↺ {t.common.switch}</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls: Language, Theme, Auth, Settings */}
          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <button
              onClick={toggleLanguage}
              className="p-1.5 px-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors"
              title="Change language"
            >
              {language === 'si' ? 'EN' : 'සිංහල'}
            </button>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Overdue Payments Alert Bell (Notification for missed payments) */}
            {getOverduePayments().length > 0 && (
              <button
                onClick={() => setActiveTab('collections')}
                className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 transition-colors"
                title={`${getOverduePayments().length} overdue payments`}
              >
                <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm">
                  {getOverduePayments().length}
                </span>
              </button>
            )}

            {/* User Profile / Collector Admin Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                  title="Collector Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.common.adminPanel}</span>
                </button>

                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.name}
                  onClick={openSettings}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40 cursor-pointer hover:ring-emerald-500 transition-all"
                  title={t.nav.settings}
                />
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Lock className="w-3 h-3" />
                <span>{t.common.connectBodima}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Sidebar Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
