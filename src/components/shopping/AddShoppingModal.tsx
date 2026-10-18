import React, { useState, useEffect } from 'react';
import { X, Plus, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

interface AddShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddShoppingModal: React.FC<AddShoppingModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { catalog, members, addShoppingRequest } = useBodima();

  const [isCustomItem, setIsCustomItem] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(catalog[0]?.id || '');
  const [customNameSi, setCustomNameSi] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [unit, setUnit] = useState('kg');
  const [unitPrice, setUnitPrice] = useState<number>(catalog[0]?.estimatedPrice || 0);
  const [quantity, setQuantity] = useState<number>(1);
  const [requestedById, setRequestedById] = useState(members[0]?.id || '');
  const [notes, setNotes] = useState('');

  // When catalog item changes, auto-fill unit and price!
  useEffect(() => {
    if (!isCustomItem && selectedCatalogId) {
      const item = catalog.find(c => c.id === selectedCatalogId);
      if (item) {
        setUnitPrice(item.estimatedPrice);
        setUnit(item.unit);
      }
    }
  }, [selectedCatalogId, isCustomItem, catalog]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCustomItem) {
      if (!customNameSi && !customNameEn) return;
      if (unitPrice <= 0) return;

      addShoppingRequest({
        nameSi: customNameSi || customNameEn,
        nameEn: customNameEn || customNameSi,
        unitPrice: Number(unitPrice),
        quantity: Number(quantity),
        unit,
        requestedById,
        notes: notes || undefined
      });
    } else {
      const item = catalog.find(c => c.id === selectedCatalogId);
      if (!item) return;

      addShoppingRequest({
        catalogItemId: item.id,
        nameSi: item.nameSi,
        nameEn: item.nameEn,
        unitPrice: Number(unitPrice),
        quantity: Number(quantity),
        unit: item.unit,
        requestedById,
        notes: notes || undefined
      });
    }

    onClose();
  };

  const calculatedSubtotal = unitPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.shopping.addNew}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'si' ? 'ඊළඟ සතියට අවශ්‍ය බඩු ඉල්ලුම් කරන්න' : 'Request items needed for next week'}
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
          {/* Mode Switch: Select Catalog vs New Item */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'si' ? 'බාණ්ඩය තේරීම' : 'Item Selection'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsCustomItem(false)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  !isCustomItem
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                }`}
              >
                {language === 'si' ? 'ලැයිස්තුවේ ඇති බාණ්ඩයක්' : 'From Catalog (Auto-price)'}
              </button>

              <button
                type="button"
                onClick={() => setIsCustomItem(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  isCustomItem
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                }`}
              >
                {language === 'si' ? '+ අලුත් බාණ්ඩයක්' : '+ New Item (Set Price)'}
              </button>
            </div>
          </div>

          {!isCustomItem ? (
            /* Choose from Catalog */
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'නිතර ගන්නා බාණ්ඩ ලැයිස්තුවෙන් තෝරන්න *' : 'Select from frequent items catalog *'}
              </label>
              <select
                value={selectedCatalogId}
                onChange={e => setSelectedCatalogId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {catalog.map(item => (
                  <option key={item.id} value={item.id}>
                    {language === 'si' ? item.nameSi : item.nameEn} — {t.common.lkr} {item.estimatedPrice} (1 {item.unit})
                  </option>
                ))}
              </select>

              <div className="mt-2 p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'si'
                    ? `මිල දර්ශකයේ ඇති මිල (${t.common.lkr} ${unitPrice}) ස්වයංක්‍රීයව සටහන් විය.`
                    : `Catalog estimated price (${t.common.lkr} ${unitPrice}) auto-filled.`}
                </span>
              </div>
            </div>
          ) : (
            /* Custom New Item Inputs */
            <div className="space-y-3 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/40">
              <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {language === 'si'
                    ? 'අලුත් බාණ්ඩයක් බැවින් එහි නම සහ ඇස්තමේන්තු මිල ඇතුලත් කරන්න:'
                    : 'Enter item name and estimated unit price for the new item:'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? 'බාණ්ඩයේ නම (සිංහලෙන්) *' : 'Item Name (Sinhala) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'si' ? 'උදා: සෝයා මීට්' : 'e.g. Soya Meat (Sinhala)'}
                    value={customNameSi}
                    onChange={e => setCustomNameSi(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? 'බාණ්ඩයේ නම (English)' : 'Item Name (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Soya Meat"
                    value={customNameEn}
                    onChange={e => setCustomNameEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? `ඒකක මිල (${t.common.lkr}) *` : `Unit Price (${t.common.lkr}) *`}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="උදා: 150"
                    value={unitPrice || ''}
                    onChange={e => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {language === 'si' ? 'ඒකකය' : 'Unit'}
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="kg">{language === 'si' ? 'kg (කිලෝග්‍රෑම්)' : 'kg (Kilogram)'}</option>
                    <option value="packet">{language === 'si' ? 'packet (පැකට්)' : 'packet'}</option>
                    <option value="bottle">{language === 'si' ? 'bottle (බෝතල්)' : 'bottle'}</option>
                    <option value="bar">{language === 'si' ? 'bar (කැට)' : 'bar'}</option>
                    <option value="unit">{language === 'si' ? 'unit (එකක්)' : 'unit'}</option>
                    <option value="pack (10)">pack (10)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Unit Price tweak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'අවශ්‍ය ප්‍රමාණය *' : 'Quantity *'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
                  {unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? `ඒකක මිල (${t.common.lkr})` : `Unit Price (${t.common.lkr})`}
              </label>
              <input
                type="number"
                min="0"
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Subtotal preview banner */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {language === 'si' ? 'උප එකතුව:' : 'Subtotal:'}
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {t.common.lkr} {calculatedSubtotal.toLocaleString()}
            </span>
          </div>

          {/* Requested By */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'ඉල්ලුම් කරන සාමාජිකයා *' : 'Requested By Member *'}
            </label>
            <select
              value={requestedById}
              onChange={e => setRequestedById(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'අමතර සටහන් / විශේෂ අවශ්‍යතා' : 'Additional Notes'}
            </label>
            <input
              type="text"
              placeholder={language === 'si' ? 'උදා: සිකුරාදාට කලින් ගේන්න' : 'e.g. Bring before Friday'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>{t.common.add}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
