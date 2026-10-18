import React from 'react';
import {
  TrendingDown,
  Clock,
  AlertOctagon,
  ShoppingCart,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

export const StatsOverview: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    getMonthlyExpensesTotal,
    collections,
    getShoppingListTotal,
    getShoppingListPerPerson,
    getOverduePayments,
    members,
    setActiveTab
  } = useBodima();

  const monthlyTotal = getMonthlyExpensesTotal();
  const overduePayments = getOverduePayments();
  const shoppingTotal = getShoppingListTotal();
  const perPersonShopping = getShoppingListPerPerson();
  const activeMembersCount = members.filter(m => m.isActive).length;

  // Calculate pending collections
  const pendingCollectionAmount = collections.reduce((sum, pool) => {
    if (pool.isCompleted) return sum;
    const unpaidSum = pool.payments
      .filter(p => !p.isPaid)
      .reduce((sub, p) => sub + p.amount, 0);
    return sum + unpaidSum;
  }, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monthly Expenses */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.dashboard.totalExpensesThisMonth}
          </span>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 mr-1">{t.common.lkr}</span>
            {monthlyTotal.toLocaleString()}
          </div>
          <button
            onClick={() => setActiveTab('expenses')}
            className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>{language === 'si' ? 'සියලු වියදම් බලන්න' : 'View All Expenses'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Pending Collections */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {t.dashboard.pendingCollections}
          </span>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 mr-1">{t.common.lkr}</span>
            {pendingCollectionAmount.toLocaleString()}
          </div>
          <button
            onClick={() => setActiveTab('collections')}
            className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>{language === 'si' ? 'එකතු කිරීම් පිරික්සන්න' : 'View Collections'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Next Week Estimated Shopping & Per Person Share */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {t.dashboard.nextWeekEstimate}
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 tracking-tight">
            <span className="text-sm font-semibold text-emerald-600/70 dark:text-emerald-400/70 mr-1">{t.common.lkr}</span>
            {shoppingTotal.toLocaleString()}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg">
            <span>{language === 'si' ? 'එක් අයෙකුට:' : 'Per Person:'}</span>
            <span>{t.common.lkr} {perPersonShopping.toLocaleString()}</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4. Overdue Alerts */}
      <div className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${
        overduePayments.length > 0
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
          : 'bg-white dark:bg-slate-900 border-gray-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${
            overduePayments.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {t.dashboard.overdueAlerts}
          </span>
          <div className={`p-2.5 rounded-xl ${
            overduePayments.length > 0
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-bounce'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
          }`}>
            {overduePayments.length > 0 ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="mt-3">
          {overduePayments.length > 0 ? (
            <>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                {overduePayments.length} <span className="text-sm font-medium">{language === 'si' ? 'දෙනෙකු පමා වී ඇත' : 'members overdue'}</span>
              </div>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {language === 'si'
                  ? 'පැහැරහැරීම් වැළැක්වීමට වහාම WhatsApp මතක් කිරීමක් යවන්න'
                  : 'Send WhatsApp reminders promptly to prevent defaults'}
              </p>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {language === 'si' ? 'සියල්ල යාවත්කාලීනයි' : 'All Up to Date'}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t.dashboard.noOverdue}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
