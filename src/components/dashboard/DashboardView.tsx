import React, { useState } from 'react';
import {
  Wallet,
  Receipt,
  ShoppingCart,
  Plus,
  ArrowRight,
  Eye,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { StatsOverview } from './StatsOverview';
import { OverdueAlerts } from './OverdueAlerts';
import { CollectionCard } from '../collections/CollectionCard';
import { AddExpenseModal } from '../expenses/AddExpenseModal';
import { AddShoppingModal } from '../shopping/AddShoppingModal';
import { AddCollectionModal } from '../collections/AddCollectionModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { ExpenseItem } from '../../types';

export const DashboardView: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    collections,
    expenses,
    shoppingList,
    setActiveTab,
    getMemberById,
    getShoppingListTotal,
    getShoppingListPerPerson
  } = useBodima();

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [viewingReceiptExpense, setViewingReceiptExpense] = useState<ExpenseItem | null>(null);

  const activeCollections = collections.filter(c => !c.isCompleted).slice(0, 2);
  const recentExpenses = expenses.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>{t.dashboard.title}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Live
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <Receipt className="w-4 h-4" />
            <span>{t.dashboard.quickActionExpense}</span>
          </button>

          <button
            onClick={() => setIsShoppingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.dashboard.quickActionShopping}</span>
          </button>

          <button
            onClick={() => setIsCollectionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors"
          >
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>{t.dashboard.quickActionCollection}</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards */}
      <StatsOverview />

      {/* Urgent Overdue Payment Alerts & WhatsApp Reminders */}
      <OverdueAlerts />

      {/* Active Collections & Recent Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Collections Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.dashboard.activeCollections}</span>
            </h3>
            <button
              onClick={() => setActiveTab('collections')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{language === 'si' ? 'සියල්ල' : 'View All'} ({collections.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {activeCollections.length > 0 ? (
              activeCollections.map(pool => (
                <CollectionCard key={pool.id} pool={pool} />
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-8 text-center text-xs text-gray-500">
                {language === 'si' ? 'දැනට ක්‍රියාත්මක එකතුකිරීම් නොමැත.' : 'No active collections at the moment.'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses & Verified Receipts Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{t.dashboard.recentExpenses}</span>
            </h3>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{language === 'si' ? 'සියල්ල' : 'View All'} ({expenses.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentExpenses.length > 0 ? (
              recentExpenses.map(expense => {
                const payer = getMemberById(expense.paidById);
                const title = language === 'si' ? expense.titleSi : expense.titleEn;

                return (
                  <div
                    key={expense.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={payer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                        alt={payer?.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                          {title}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {payer?.name} • {expense.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                          {t.common.lkr} {expense.amount.toLocaleString()}
                        </div>
                      </div>

                      {expense.receiptUrl && (
                        <button
                          onClick={() => setViewingReceiptExpense(expense)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                          title="View Bill Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{language === 'si' ? 'බිල්පත' : 'Bill'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-8 text-center text-xs text-gray-500">
                {language === 'si' ? 'දැනට වියදම් සටහන් කර නොමැත.' : 'No expenses recorded yet.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <AddShoppingModal
        isOpen={isShoppingModalOpen}
        onClose={() => setIsShoppingModalOpen(false)}
      />

      <AddCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
      />

      {viewingReceiptExpense && (
        <ReceiptModal
          isOpen={!!viewingReceiptExpense}
          onClose={() => setViewingReceiptExpense(null)}
          imageUrl={viewingReceiptExpense.receiptUrl}
          title={language === 'si' ? viewingReceiptExpense.titleSi : viewingReceiptExpense.titleEn}
          amount={viewingReceiptExpense.amount}
          payerName={getMemberById(viewingReceiptExpense.paidById)?.name || ''}
          date={viewingReceiptExpense.date}
          notes={viewingReceiptExpense.notes}
        />
      )}
    </div>
  );
};
