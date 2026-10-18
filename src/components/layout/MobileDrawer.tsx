import React from 'react';
import {
  X,
  ShoppingCart,
  Receipt,
  Wallet,
  Users,
  BookOpen,
  ShieldCheck,
  Lock,
  LogOut,
  User,
  Home
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { activeTab, setActiveTab } = useBodima();
  const { user, bodima, isAuthenticated, isCollectorOrAdmin, openAuthModal, openSettings, leaveBodima, logout } = useAuth();

  if (!isOpen) return null;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const navLinks = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'shopping', label: t.nav.shopping, icon: ShoppingCart },
    { id: 'collections', label: t.nav.collections, icon: Wallet },
    { id: 'expenses', label: t.nav.expenses, icon: Receipt },
    { id: 'members', label: t.nav.members, icon: Users },
    { id: 'catalog', label: t.nav.catalog, icon: BookOpen }
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Slide-out Sidebar Drawer */}
      <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between border-r border-gray-200 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Drawer Top Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold">
                <Home className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-gray-900 dark:text-white">
                {language === 'si' ? 'බෝඩිම' : 'Bodima'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Account Section */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-200 dark:border-slate-800">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/40"
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.2 rounded-full">
                    {language === 'si'
                      ? (user?.roleTitleSi || (isCollectorOrAdmin ? 'මුදල් භාරකරු' : 'සාමාජික'))
                      : (user?.roleTitleEn || (isCollectorOrAdmin ? 'Collector' : 'Boarder'))}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  openAuthModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t.common.connectBodima}</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;

              return (
                <button
                  key={link.id}
                  onClick={() => handleSelectTab(link.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Collector Admin Dashboard Link */}
            <div className="pt-2">
              <button
                onClick={() => handleSelectTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="flex-1">
                  <div>{t.nav.admin}</div>
                  <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                    {t.nav.adminSubtitle}
                  </span>
                </div>
              </button>
            </div>

            {/* Settings & Profile Photo button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  openSettings();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left border border-gray-200 dark:border-slate-800"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span>⚙️ {t.nav.settings}</span>
              </button>
            </div>
          </div>

          {/* Current Bodima Name & Password Pill */}
          {bodima && (
            <div className="mx-3 mt-1 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-200 dark:border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>{t.nav.bodimaLabel}</span>
                <strong className="text-gray-900 dark:text-white font-bold">{bodima.name}</strong>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                <span>{t.nav.passwordLabel}</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{bodima.password || '1234'}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Logout & Switch Bodima */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-1">
          <button
            onClick={() => {
              onClose();
              leaveBodima();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t.nav.switchBodima}</span>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.nav.logout}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
