import React, { useState } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, Check, X, Tag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

export const CatalogView: React.FC = () => {
  const { t, language } = useLanguage();
  const { catalog, addCatalogItem, updateCatalogItemPrice, deleteCatalogItem } = useBodima();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  // New item modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNameSi, setNewNameSi] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newPrice, setNewPrice] = useState<number>(200);
  const [newCategory, setNewCategory] = useState('Groceries');

  const filteredCatalog = catalog.filter(item =>
    item.nameSi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEdit = (id: string, currentPrice: number) => {
    setEditingItemId(id);
    setEditingPrice(currentPrice);
  };

  const saveEdit = (id: string) => {
    updateCatalogItemPrice(id, Number(editingPrice));
    setEditingItemId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameSi && !newNameEn) return;

    addCatalogItem({
      nameSi: newNameSi || newNameEn,
      nameEn: newNameEn || newNameSi,
      category: newCategory,
      unit: newUnit,
      estimatedPrice: Number(newPrice)
    });

    setNewNameSi('');
    setNewNameEn('');
    setNewPrice(200);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{t.catalog.title}</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.catalog.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.catalog.addNew}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder={t.catalog.searchPlaceholder}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-gray-900 dark:text-white"
        />
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map(item => {
          const isEditing = editingItemId === item.id;
          const title = language === 'si' ? item.nameSi : item.nameEn;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mt-1.5">
                    {title}
                  </h4>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {language === 'si' ? 'ඒකකය:' : 'Unit:'} 1 {item.unit}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(language === 'si' ? 'මෙම භාණ්ඩය ඉවත් කරන්නද?' : 'Delete item?')) {
                      deleteCatalogItem(item.id);
                    }
                  }}
                  className="p-1 text-gray-300 hover:text-rose-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Price Row */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                    {language === 'si' ? 'ඇස්තමේන්තු මිල' : 'Estimated Price'} (1 {item.unit})
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-purple-600">{t.common.lkr}</span>
                      <input
                        type="number"
                        min="1"
                        value={editingPrice}
                        onChange={e => setEditingPrice(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-xs font-bold bg-gray-50 dark:bg-slate-950 border border-purple-400 rounded-lg focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-base font-black text-purple-600 dark:text-purple-400">
                      {t.common.lkr} {item.estimatedPrice.toLocaleString()}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => startEdit(item.id, item.estimatedPrice)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{language === 'si' ? 'මිල වෙනස් කරන්න' : 'Update Price'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Catalog Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.catalog.addNew}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'භාණ්ඩයේ නම (සිංහලෙන්) *' : 'Item Name (Sinhala) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'si' ? 'උදා: සෝයා මීට්' : 'e.g. Soya Meat (Sinhala)'}
                  value={newNameSi}
                  onChange={e => setNewNameSi(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'භාණ්ඩයේ නම (ඉංග්‍රීසි)' : 'Item Name (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Soya Meat"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? `ඒකක මිල (${t.common.lkr}) *` : `Unit Price (${t.common.lkr}) *`}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? 'ඒකකය' : 'Unit'}
                  </label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="kg">{language === 'si' ? 'kg (කිලෝ)' : 'kg'}</option>
                    <option value="packet">{language === 'si' ? 'packet (පැකට්)' : 'packet'}</option>
                    <option value="bottle">{language === 'si' ? 'bottle (බෝතල්)' : 'bottle'}</option>
                    <option value="bar">{language === 'si' ? 'bar (කැට)' : 'bar'}</option>
                    <option value="unit">{language === 'si' ? 'unit (එකක්)' : 'unit'}</option>
                    <option value="pack (10)">pack (10)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'කාණ්ඩය' : 'Category'}
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Groceries">{language === 'si' ? 'කෑම බඩු' : 'Groceries'}</option>
                  <option value="Vegetables">{language === 'si' ? 'එළවලු' : 'Vegetables'}</option>
                  <option value="Toiletries">{language === 'si' ? 'සබන් සහ පිරිසිදුකාරක' : 'Toiletries'}</option>
                  <option value="Utilities">{language === 'si' ? 'ගෑස් සහ වෙනත්' : 'Utilities'}</option>
                  <option value="Other">{language === 'si' ? 'වෙනත්' : 'Other'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/20"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
