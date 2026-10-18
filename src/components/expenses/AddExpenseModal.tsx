import React, { useState, useRef } from 'react';
import { X, Plus, Upload, Image as ImageIcon, Trash2, Receipt } from 'lucide-react';
import { CollectionCategory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { members, addExpense, collections } = useBodima();

  const [titleSi, setTitleSi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<CollectionCategory>('food');
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptName, setReceiptName] = useState<string>('');
  const [collectionPoolId, setCollectionPoolId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleSi && !titleEn) return;
    if (amount <= 0) return;

    addExpense({
      titleSi: titleSi || titleEn,
      titleEn: titleEn || titleSi,
      category,
      amount: Number(amount),
      paidById,
      date,
      receiptUrl: receiptUrl || undefined,
      receiptName: receiptName || undefined,
      notes: notes || undefined,
      collectionPoolId: collectionPoolId || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.expenses.addNew}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'si' ? 'ගෙනා බඩු වල විස්තර සහ බිල්පත (Receipt) උඩුගත කරන්න' : 'Enter expense details and upload receipt photo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'si' ? 'වියදමේ අංශය *' : 'Expense Category *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['food', 'toiletries', 'utilities', 'rent', 'other'] as CollectionCategory[]).map(
                cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                      category === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {t.collections.categories[cat]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'වියදමේ විස්තරය (සිංහලෙන්) *' : 'Description (Sinhala) *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'si' ? 'උදා: කාගීල්ස් සතිපතා බඩු බිල' : 'e.g. Weekly Grocery (Sinhala)'}
                value={titleSi}
                onChange={e => setTitleSi(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'විස්තරය (English)' : 'Description (English)'}
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly Grocery Bill"
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? `වියදම් වූ මුදල (${t.common.lkr}) *` : `Amount Paid (${t.common.lkr}) *`}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="උදා: 3850"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'දිනය *' : 'Date *'}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Spender */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'සල්ලි ගෙවූ සාමාජිකයා *' : 'Paid By Member *'}
            </label>
            <select
              value={paidById}
              onChange={e => setPaidById(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({language === 'si' ? m.roleDescriptionSi : m.roleDescriptionEn})
                </option>
              ))}
            </select>
          </div>

          {/* Receipt / Bill Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'බිල්පතේ ඡායාරූපය' : 'Receipt / Bill Photo'}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {receiptUrl ? (
              <div className="relative p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={receiptUrl}
                    alt="Receipt thumbnail"
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-slate-700 bg-white"
                  />
                  <div className="truncate">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {receiptName || (language === 'si' ? 'බිල්පත අමුණා ඇත' : 'Receipt Attached')}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {language === 'si' ? '✓ බිල්පත සාර්ථකව ලැබුණි' : '✓ Receipt uploaded successfully'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setReceiptName('');
                  }}
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-6 text-center bg-gray-50/50 dark:bg-slate-800/30 hover:bg-blue-50/20 transition-all"
              >
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t.expenses.dropOrSelect}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                  {language === 'si' ? 'JPG, PNG, WebP (කැමරාවෙන් හෝ Gallery එකෙන් ෆොටෝ එකක් දමන්න)' : 'JPG, PNG, WebP (Upload photo from camera or gallery)'}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'අමතර සටහන්' : 'Additional Notes'}
            </label>
            <input
              type="text"
              placeholder={language === 'si' ? 'උදා: පරිප්පු 2kg, බිත්තර 10, තෙල්' : 'e.g. Dhal 2kg, Eggs 10, Cooking oil'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
