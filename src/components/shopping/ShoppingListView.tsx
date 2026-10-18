import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  ThumbsUp,
  CheckCircle2,
  Users,
  Trash2,
  DollarSign,
  ArrowRight,
  Sparkles,
  Check,
  Receipt
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { AddShoppingModal } from './AddShoppingModal';

export const ShoppingListView: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    shoppingList,
    members,
    getShoppingListTotal,
    getShoppingListPerPerson,
    toggleVoteShoppingRequest,
    togglePurchasedShoppingRequest,
    deleteShoppingRequest,
    convertShoppingListToExpense,
    getMemberById
  } = useBodima();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPayerId, setSelectedPayerId] = useState(members[0]?.id || '');
  const [showConvertModal, setShowConvertModal] = useState(false);

  const activeMembers = members.filter(m => m.isActive);
  const eatingMembers = members.filter(m => m.isActive && m.eatsAtBodima !== false);
  const nonEatingMembers = members.filter(m => m.isActive && m.eatsAtBodima === false);
  const totalBudget = getShoppingListTotal();
  const perPersonShare = getShoppingListPerPerson();

  const unpurchasedItems = shoppingList.filter(item => !item.isPurchased);
  const purchasedItems = shoppingList.filter(item => item.isPurchased);

  const handleConvert = () => {
    convertShoppingListToExpense(selectedPayerId);
    setShowConvertModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{t.shopping.title}</span>
        </h2>

        <div className="flex items-center gap-2">
          {unpurchasedItems.length > 0 && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.shopping.convertToExpense}</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'si' ? '+ බඩු ඉල්ලීමක්' : '+ Request Item'}</span>
          </button>
        </div>
      </div>

      {/* Hero Breakdown Cards: Total & Per-Person Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Next Week Estimated Cost */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              {t.shopping.totalBudget}
            </span>
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight">
              <span className="text-lg font-semibold text-emerald-200 mr-1">{t.common.lkr}</span>
              {totalBudget.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-emerald-100/90">
              {language === 'si'
                ? `අයිතම ${unpurchasedItems.length} ක් සඳහා ඇස්තමේන්තුව`
                : `Estimate for ${unpurchasedItems.length} items`}
            </p>
          </div>

          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Per-Person Cost Calculation (The main user requirement!) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                {t.shopping.perPersonShare}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {language === 'si' ? `කෑම කන ${eatingMembers.length} දෙනා අතර` : `Among ${eatingMembers.length} Diners`}
              </span>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mr-1">{t.common.lkr}</span>
              {perPersonShare.toLocaleString()}
            </div>

            {/* Formula visualization */}
            <div className="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span>{t.shopping.calculatedFormula}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {t.common.lkr} {totalBudget.toLocaleString()} ÷ {eatingMembers.length || 1} = {t.common.lkr} {perPersonShare.toLocaleString()}
                </span>
              </div>
              {nonEatingMembers.length > 0 && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span>
                    {language === 'si' ? 'කෑම නොගන්නා අය: ' : 'Non-diners: '}
                    {nonEatingMembers.map(m => m.name.split(' ')[0]).join(', ')}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {language === 'si' ? 'නිදහස් (රු. 0)' : 'Exempt (Rs. 0)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shopping Requests List */}
      {unpurchasedItems.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {language === 'si'
                ? `මිලදී ගැනීමට අවශ්‍ය බඩු (${unpurchasedItems.length})`
                : `Items to Purchase (${unpurchasedItems.length})`}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:inline">
              {language === 'si'
                ? 'මිල දර්ශකයෙන් ස්වයංක්‍රීයව පිරවූ සහ අලුතින් එක් කළ බඩු'
                : 'Auto-filled from catalog or custom items'}
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {unpurchasedItems.map(item => {
              const requester = getMemberById(item.requestedById);
              const subtotal = item.unitPrice * item.quantity;
              const title = language === 'si' ? item.nameSi : item.nameEn;

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Left: Checkbox + Name & Requester */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => togglePurchasedShoppingRequest(item.id)}
                      className="mt-1 w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition-colors shrink-0"
                      title={t.shopping.markPurchased}
                    >
                      {item.isPurchased && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                          {item.quantity} {item.unit}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {t.shopping.unitPrice}: <strong className="text-gray-700 dark:text-gray-300">{t.common.lkr} {item.unitPrice}</strong> / 1 {item.unit}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <img
                            src={requester?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                            alt={requester?.name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span>
                            {language === 'si' ? 'ඉල්ලුවේ: ' : 'Requested by: '}
                            <strong className="text-gray-700 dark:text-gray-200">{requester?.name.split(' ')[0]}</strong>
                          </span>
                        </span>
                      </div>

                      {item.notes && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Subtotal + Votes + Delete */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {t.common.lkr} {subtotal.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        ({item.quantity} × {item.unitPrice})
                      </span>
                    </div>

                    {/* Agree / Upvote Button */}
                    <button
                      onClick={() => toggleVoteShoppingRequest(item.id, members[0]?.id || '')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 text-gray-700 dark:text-gray-300 transition-colors"
                      title={language === 'si' ? 'එකඟ වන්න' : 'Vote / Agree'}
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.votes.length} {language === 'si' ? 'එකඟයි' : 'Agreed'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(language === 'si' ? 'මෙම අයිතමය ඉවත් කරන්නද?' : 'Remove this item?')) {
                          deleteShoppingRequest(item.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-1">
            {t.shopping.emptyState}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {language === 'si'
              ? 'ඊළඟ සතියට බෝඩිමට අවශ්‍ය බඩු (හාල්, පරිප්පු, බිත්තර, සබන්) දැන්ම ඉල්ලුම් කරන්න.'
              : 'Request items for next week (rice, dhal, eggs, soap) in advance.'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.shopping.addNew}</span>
          </button>
        </div>
      )}

      {/* Purchased / Completed History */}
      {purchasedItems.length > 0 && (
        <div className="bg-gray-50/70 dark:bg-slate-900/40 rounded-2xl border border-gray-200/60 dark:border-slate-800/60 p-4">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'si'
                ? `දැනටමත් මිලදී ගත් බඩු (${purchasedItems.length})`
                : `Already Purchased Items (${purchasedItems.length})`}
            </span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {purchasedItems.map(item => (
              <span
                key={item.id}
                onClick={() => togglePurchasedShoppingRequest(item.id)}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 line-through hover:opacity-80 transition-opacity"
                title={language === 'si' ? 'නැවත ලැයිස්තුවට ගන්න' : 'Click to restore'}
              >
                <Check className="w-3 h-3 text-emerald-500" />
                <span>{language === 'si' ? item.nameSi : item.nameEn} ({item.quantity} {item.unit})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AddShoppingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Convert to Expense Confirmation Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {language === 'si' ? 'බඩු ලැයිස්තුව වියදමක් ලෙස සටහන් කිරීම' : 'Record Shopping List as Expense'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'si' ? 'මුළු මුදල: ' : 'Total Amount: '}
                  <strong className="text-emerald-600">{t.common.lkr} {totalBudget.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {language === 'si' ? 'මෙම බඩු සඳහා මුදල් ගෙවූ සාමාජිකයා:' : 'Member who paid for these items:'}
              </label>
              <select
                value={selectedPayerId}
                onChange={e => setSelectedPayerId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({language === 'si' ? m.roleDescriptionSi : m.roleDescriptionEn})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'si'
                ? 'මෙය තහවුරු කළ විට මෙම අයිතම සියල්ල වියදම් ලැයිස්තුවට එක් වී, බඩු ලැයිස්තුවේ මිලදී ගත් ලෙස සලකුණු වේ. (පසුව බිල්පතක් අමුණා ගත හැක).'
                : 'Confirming will log all items into the expense list and mark them as purchased. You can attach a bill photo later.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConvert}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20"
              >
                {language === 'si' ? 'වියදම ලෙස සටහන් කරන්න' : 'Record as Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
