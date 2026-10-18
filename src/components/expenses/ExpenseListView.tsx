import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Trash2,
  FileCheck,
  FileX
} from 'lucide-react';
import { CollectionCategory, ExpenseItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { AddExpenseModal } from './AddExpenseModal';
import { ReceiptModal } from '../common/ReceiptModal';

export const ExpenseListView: React.FC = () => {
  const { t, language } = useLanguage();
  const { expenses, getMemberById, deleteExpense } = useBodima();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeReceiptExpense, setActiveReceiptExpense] = useState<ExpenseItem | null>(null);

  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesSearch =
      exp.titleSi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>{t.expenses.title}</span>
        </h2>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'si' ? '+ බිල්පතක් දමන්න' : '+ Add Bill / Expense'}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.common.all} ({expenses.length})
          </button>

          {(['food', 'toiletries', 'utilities', 'rent', 'other'] as CollectionCategory[]).map(
            cat => {
              const count = expenses.filter(e => e.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t.collections.categories[cat]} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.common.search}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Expenses Feed */}
      {filteredExpenses.length > 0 ? (
        <div className="space-y-3">
          {filteredExpenses.map(expense => {
            const payer = getMemberById(expense.paidById);
            const title = language === 'si' ? expense.titleSi : expense.titleEn;
            const categoryLabel = t.collections.categories[expense.category];

            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={payer?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={payer?.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 shrink-0 mt-0.5"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {categoryLabel}
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {expense.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      {title}
                    </h3>

                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {t.expenses.spender}: <strong className="text-gray-900 dark:text-gray-200">{payer?.name || (language === 'si' ? 'නොදන්නා' : 'Unknown')}</strong>
                    </div>

                    {expense.notes && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg inline-block">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Info: Amount & Receipt Button */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-black text-blue-600 dark:text-blue-400">
                      {t.common.lkr} {expense.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {expense.receiptUrl ? (
                      <button
                        onClick={() => setActiveReceiptExpense(expense)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.common.viewReceipt}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500">
                        <FileX className="w-3 h-3" />
                        <span>{t.common.noReceipt}</span>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (window.confirm(language === 'si' ? 'මෙම වියදම ඉවත් කරන්නද?' : 'Delete this expense?')) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                      title={language === 'si' ? 'වියදම මකන්න' : 'Delete expense'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
            {t.expenses.emptyState}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {language === 'si' ? 'ගෙනා බඩු වල බිල්පත් සහ වියදම් සියල්ල මෙතැනින් එක් කරන්න.' : 'Record and upload all grocery bills and boarding expenses here.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.expenses.addNew}</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Receipt Viewer Lightbox */}
      {activeReceiptExpense && (
        <ReceiptModal
          isOpen={!!activeReceiptExpense}
          onClose={() => setActiveReceiptExpense(null)}
          imageUrl={activeReceiptExpense.receiptUrl}
          title={language === 'si' ? activeReceiptExpense.titleSi : activeReceiptExpense.titleEn}
          amount={activeReceiptExpense.amount}
          payerName={getMemberById(activeReceiptExpense.paidById)?.name || ''}
          date={activeReceiptExpense.date}
          notes={activeReceiptExpense.notes}
        />
      )}
    </div>
  );
};
