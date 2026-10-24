import React, { useState } from 'react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Plus,
  Utensils,
  Home as HomeIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingCart,
  Users,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { useAuth } from '../../context/AuthContext';
import { CollectionCategory } from '../../types';
import { CollectionCard } from '../collections/CollectionCard';
import { AddCollectionModal } from '../collections/AddCollectionModal';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { OverdueAlerts } from '../dashboard/OverdueAlerts';

export const HomeView: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    collections,
    expenses,
    getFinancialSummary,
    getShoppingListTotal,
    getShoppingListPerPerson,
    setActiveTab,
    members
  } = useBodima();
  const { user, isCollectorOrAdmin } = useAuth();

  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [collectionTab, setCollectionTab] = useState<'active' | 'completed'>('active');

  const summary = getFinancialSummary();
  const shoppingTotal = getShoppingListTotal();
  const shoppingPerPerson = getShoppingListPerPerson();

  const activePools = collections.filter(p => !p.isCompleted);
  const completedPools = collections.filter(p => p.isCompleted);

  const displayedPools = collectionTab === 'active' ? activePools : completedPools;

  const categoryIcons: { [key in CollectionCategory]: React.ElementType } = {
    food: Utensils,
    rent: HomeIcon,
    toiletries: Sparkles,
    utilities: Receipt,
    other: Wallet
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Actions */}
      <section className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-3xl border border-[#e6e9df] dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-5 sm:px-7 sm:py-6 shadow-[0_12px_32px_-24px_rgba(31,51,37,0.35)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-100/70 dark:bg-emerald-900/20 blur-2xl" />
        <div>
          <p className="mb-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
            {language === 'si' ? 'එකට ජීවත් වෙමු, එකට සැලසුම් කරමු' : 'A little more organised, together'}
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span>{t.home.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.home.subtitle}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 font-bold text-xs shadow-sm transition-all"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{t.home.addExpense}</span>
          </button>

          <button
            onClick={() => setIsAddCollectionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.home.addCollection}</span>
          </button>
        </div>
      </section>

      {/* Overdue Urgent Alert if any missed payments */}
      <OverdueAlerts />

      {/* HERO FINANCIAL BALANCE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#e6e9df] dark:border-slate-800 shadow-[0_10px_28px_-24px_rgba(31,51,37,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t.home.totalCollected}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mr-1">{t.common.lkr}</span>
              {summary.totalCollected.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {t.home.totalCollectedSub}
            </p>
          </div>
        </div>

        {/* Card 2: Total Spent / Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-[#e6e9df] dark:border-slate-800 shadow-[0_10px_28px_-24px_rgba(31,51,37,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t.home.totalSpent}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              <span className="text-base font-semibold text-blue-600 dark:text-blue-400 mr-1">{t.common.lkr}</span>
              {summary.totalExpenses.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {t.home.totalSpentSub} ({expenses.length})
            </p>
          </div>
        </div>

        {/* Card 3: Net Remaining Balance */}
        <div className={`rounded-2xl p-5 border-2 shadow-md relative overflow-hidden flex flex-col justify-between ${
          summary.remainingBalance >= 0
          ? 'bg-gradient-to-br from-[#246444] to-[#397c5b] text-white border-emerald-500/30 shadow-emerald-900/10'
            : 'bg-gradient-to-br from-rose-700 to-[#9c573b] text-white border-rose-500/30 shadow-rose-900/10'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                {summary.remainingBalance >= 0 ? t.home.netBalance : t.home.deficit}
              </span>
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                <span className="text-base font-semibold opacity-90 mr-1">{t.common.lkr}</span>
                {Math.abs(summary.remainingBalance).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Formula visualization */}
          <div className="mt-2 text-[10px] font-semibold bg-black/20 p-2 rounded-xl backdrop-blur-xs flex items-center justify-between">
            <span>{t.home.formula}</span>
            <span className="font-bold">
              {summary.totalCollected.toLocaleString()} - {summary.totalExpenses.toLocaleString()} = {summary.remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.home.categoryBreakdownTitle}</span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {t.home.categoryBreakdownSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {summary.categories.map(cat => {
            const Icon = categoryIcons[cat.category] || Wallet;
            const hasActivity = cat.collected > 0 || cat.expenses > 0;
            const isSurplus = cat.balance >= 0;

            return (
              <div
                key={cat.category}
                className={`p-4 rounded-xl border transition-all ${
                  hasActivity
                    ? 'bg-gray-50/70 dark:bg-slate-800/40 border-gray-200/80 dark:border-slate-700/80'
                    : 'bg-gray-50/30 dark:bg-slate-850/20 border-gray-100 dark:border-slate-800/50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                        {language === 'si' ? cat.labelSi : cat.labelEn}
                      </h4>
                      {cat.activeCount > 0 && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {cat.activeCount} {t.home.activeCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400">{t.home.balance}</span>
                    <div className={`text-xs font-black ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {t.common.lkr} {cat.balance.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 3 Metrics Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/60 dark:border-slate-700/60 text-center">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                    <span className="block text-[10px] font-semibold text-gray-400">{t.home.collected}</span>
                    <strong className="text-xs font-bold text-gray-900 dark:text-white">
                      {cat.collected.toLocaleString()}
                    </strong>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                    <span className="block text-[10px] font-semibold text-gray-400">{t.home.spent}</span>
                    <strong className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {cat.expenses.toLocaleString()}
                    </strong>
                  </div>

                  <div className={`p-2 rounded-lg border ${
                    isSurplus
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}>
                    <span className="block text-[10px] font-semibold opacity-80">
                      {isSurplus ? t.home.remaining : t.home.deficit}
                    </span>
                    <strong className="text-xs font-black">
                      {isSurplus ? '+' : ''}{cat.balance.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEXT WEEK SHOPPING LIST CALLOUT BANNER */}
      <div
        onClick={() => setActiveTab('shopping')}
        className="cursor-pointer bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm hover:shadow-md group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                {t.home.shoppingBannerTitle}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {t.home.shoppingBannerBadge}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t.home.shoppingEstTotal} <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{t.common.lkr} {shoppingTotal.toLocaleString()}</strong> • {t.home.shoppingPerPerson} <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{t.common.lkr} {shoppingPerPerson.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('shopping')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>{t.home.goToShopping}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* COLLECTIONS MANAGEMENT SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.home.collectionsSectionTitle}</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.home.collectionsSectionSubtitle}
            </p>
          </div>

          {/* Active vs Completed Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setCollectionTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                collectionTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              {t.home.activeTab} ({activePools.length})
            </button>

            <button
              onClick={() => setCollectionTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                collectionTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              {t.home.completedTab} ({completedPools.length})
            </button>
          </div>
        </div>

        {/* Collections Cards Grid */}
        {displayedPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedPools.map(pool => (
              <CollectionCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" />
            <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
              {collectionTab === 'active' ? t.home.noActive : t.home.noCompleted}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {collectionTab === 'active'
                ? t.home.noActiveDesc
                : t.home.noCompletedDesc}
            </p>
            {collectionTab === 'active' && (
              <button
                onClick={() => setIsAddCollectionOpen(true)}
                className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.home.startNewCollection}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCollectionModal
        isOpen={isAddCollectionOpen}
        onClose={() => setIsAddCollectionOpen(false)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
};
