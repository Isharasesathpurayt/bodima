import React, { useState } from 'react';
import { Plus, Search, Filter, Wallet } from 'lucide-react';
import { CollectionCategory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { CollectionCard } from './CollectionCard';
import { AddCollectionModal } from './AddCollectionModal';
import { OverdueAlerts } from '../dashboard/OverdueAlerts';

export const CollectionListView: React.FC = () => {
  const { t, language } = useLanguage();
  const { collections } = useBodima();
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeCount = collections.filter(p => !p.isCompleted).length;
  const completedCount = collections.filter(p => p.isCompleted).length;

  const filteredCollections = collections.filter(pool => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !pool.isCompleted) ||
      (statusFilter === 'completed' && pool.isCompleted);
    const matchesCategory = selectedCategory === 'all' || pool.category === selectedCategory;
    const matchesSearch =
      pool.titleSi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.collections.title}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'si' ? 'බෝඩිමේ සියලු එකතුකිරීම් සහ ගෙවීම් පාලනය' : 'Manage boarding collections and roommate contributions'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs: Active vs Completed */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.home.activeTab} ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.home.completedTab} ({completedCount})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.common.all}
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.home.addCollection}</span>
          </button>
        </div>
      </div>

      {/* Overdue Payments Alert Section */}
      <OverdueAlerts />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t.common.all} ({collections.length})
          </button>

          {(['rent', 'food', 'toiletries', 'utilities', 'other'] as CollectionCategory[]).map(
            cat => {
              const count = collections.filter(c => c.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
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
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCollections.map(pool => (
            <CollectionCard key={pool.id} pool={pool} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-12 text-center">
          <Wallet className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
            {t.collections.emptyState}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {language === 'si'
              ? 'මාසික කුලිය, කෑම මුදල් හෝ සබන් සඳහා අලුත් එකතුකිරීමක් අරඹන්න.'
              : 'Start a new collection pool for monthly rent, weekly cooking, or shared supplies.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.collections.addNew}</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AddCollectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
