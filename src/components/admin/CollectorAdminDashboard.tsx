import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Wallet,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Receipt,
  UserCheck,
  UserX,
  CreditCard,
  Banknote,
  LogOut,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBodima } from '../../context/BodimaContext';
import { useLanguage } from '../../context/LanguageContext';
import { RemindModal } from '../common/RemindModal';
import { AddCollectionModal } from '../collections/AddCollectionModal';
import { AddExpenseModal } from '../expenses/AddExpenseModal';

export const CollectorAdminDashboard: React.FC = () => {
  const { user, isCollectorOrAdmin, openAuthModal, logout } = useAuth();
  const { collections, updatePaymentStatus, getMemberById, generateWhatsAppReminderLink } = useBodima();
  const { t, language } = useLanguage();

  const [selectedPoolId, setSelectedPoolId] = useState<string>(collections[0]?.id || '');
  const [remindMemberId, setRemindMemberId] = useState<string | null>(null);
  const [isAddPoolOpen, setIsAddPoolOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // If user is not logged in or not a collector/admin, show lock screen
  if (!isCollectorOrAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-gray-900 dark:text-white">
          {language === 'si' ? 'මුදල් භාරකරු ඇඩ්මින් පැනලය' : 'Collector Admin Dashboard'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-6">
          {language === 'si'
            ? 'සල්ලි දීපු අයව සහ නොදීපු අයව සලකුනු කිරීමට සහ කළමනාකරණය කිරීමට මුරපදය (Password) ඇතුලත් කර ලොග් වන්න.'
            : 'Log in with password to mark who paid, send reminders and manage collection pools.'}
        </p>

        <button
          onClick={() => openAuthModal()}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'si' ? 'මුරපදය දී ලොග් වන්න' : 'Log In with Password'}</span>
        </button>
      </div>
    );
  }

  const selectedPool = collections.find(c => c.id === selectedPoolId) || collections[0];

  const paidCount = selectedPool?.payments.filter(p => p.isPaid).length || 0;
  const unpaidCount = (selectedPool?.payments.length || 0) - paidCount;
  const totalCollected = selectedPool?.payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalTarget = (selectedPool?.targetPerPerson || 0) * (selectedPool?.payments.length || 1);
  const progressPercent = Math.round((paidCount / (selectedPool?.payments.length || 1)) * 100);

  const remindInfo = remindMemberId && selectedPool
    ? generateWhatsAppReminderLink(remindMemberId, selectedPool.id)
    : { url: '', messageText: '', memberPhone: '' };

  const remindMember = remindMemberId ? getMemberById(remindMemberId) : null;

  return (
    <div className="space-y-6">
      {/* Admin Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
            alt={user?.name}
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base tracking-tight">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                {user?.roleTitleSi || (language === 'si' ? 'ඇඩ්මින් භාරකරු' : 'Admin Collector')}
              </span>
            </div>
            <p className="text-xs text-emerald-100">
              {language === 'si' ? 'සල්ලි භාරකරු කළමනාකරණ පැනලය' : 'Collector Management Dashboard'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddPoolOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'si' ? '+ අලුත් එකතුකිරීමක්' : '+ New Collection'}</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-bold text-xs border border-white/20 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{language === 'si' ? '+ වියදමක්/බිලක්' : '+ Add Bill/Expense'}</span>
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Select Pool Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {collections.map(pool => {
          const isSelected = (selectedPool?.id === pool.id);
          const poolUnpaid = pool.payments.filter(p => !p.isPaid).length;

          return (
            <button
              key={pool.id}
              onClick={() => setSelectedPoolId(pool.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{language === 'si' ? pool.titleSi : pool.titleEn}</span>
                {poolUnpaid > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {poolUnpaid} {language === 'si' ? 'ක් හිඟයි' : 'unpaid'}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-200">{language === 'si' ? '✓ සම්පූර්ණයි' : '✓ Completed'}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Collection Pool Detail Card */}
      {selectedPool && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          {/* Summary Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                {t.collections.categories[selectedPool.category]}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {language === 'si' ? selectedPool.titleSi : selectedPool.titleEn}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'si' ? 'අවසන් දිනය: ' : 'Due Date: '}
                <strong className="text-gray-700 dark:text-gray-300">{selectedPool.dueDate}</strong> • {language === 'si' ? 'එක් අයෙකුට: ' : 'Per Person: '}
                <strong className="text-gray-700 dark:text-gray-300">{t.common.lkr} {selectedPool.targetPerPerson.toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-gray-500 dark:text-gray-400">{language === 'si' ? 'එකතු වී ඇති මුදල:' : 'Collected so far:'}</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {t.common.lkr} {totalCollected.toLocaleString()} <span className="text-xs text-gray-400">/ {totalTarget.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-emerald-700 dark:text-emerald-300 text-sm">
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Member Payments Checklist (The main interactive feature!) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {language === 'si' ? 'සාමාජිකයින්ගේ ගෙවීම් සලකුනු කිරීම' : 'Member Payments Checklist'}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {paidCount} {language === 'si' ? 'ගෙවා ඇත' : 'paid'} • {unpaidCount} {language === 'si' ? 'ගෙවීමට ඇත' : 'pending'}
              </span>
            </div>

            <div className="space-y-2.5">
              {selectedPool.payments.map(p => {
                const member = getMemberById(p.memberId);
                if (!member) return null;

                return (
                  <div
                    key={p.memberId}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      p.isPaid
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                    }`}
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{member.name}</span>
                          {p.isPaid && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.2 rounded-full">
                              ✓ {p.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {t.common.lkr} {selectedPool.targetPerPerson.toLocaleString()}
                          {p.paidAt && ` • ${language === 'si' ? 'ගෙවූ දිනය: ' : 'Paid on: '}${p.paidAt}`}
                          {p.note && ` • "${p.note}"`}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Mark Paid / Unpaid Button + WhatsApp Remind */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                      {/* Toggle Paid Button */}
                      <button
                        onClick={() => updatePaymentStatus(selectedPool.id, p.memberId, !p.isPaid, 'cash')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                          p.isPaid
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 border border-gray-300 dark:border-slate-700'
                        }`}
                      >
                        {p.isPaid ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{language === 'si' ? 'ගෙවා ඇත' : 'Paid'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            <span>{language === 'si' ? 'නොගෙවූ' : 'Mark as Paid'}</span>
                          </>
                        )}
                      </button>

                      {/* If unpaid, WhatsApp reminder button */}
                      {!p.isPaid && (
                        <button
                          onClick={() => setRemindMemberId(p.memberId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors"
                          title={language === 'si' ? 'WhatsApp මතක් කිරීමක් යවන්න' : 'Send WhatsApp Reminder'}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{language === 'si' ? 'මතක් කරන්න' : 'Remind'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Remind Modal */}
      {remindMemberId && remindMember && selectedPool && (
        <RemindModal
          isOpen={!!remindMemberId}
          onClose={() => setRemindMemberId(null)}
          memberName={remindMember.name}
          memberPhone={remindMember.phone}
          poolTitle={language === 'si' ? selectedPool.titleSi : selectedPool.titleEn}
          amount={selectedPool.targetPerPerson}
          dueDate={selectedPool.dueDate}
          collectorName={user?.name || (language === 'si' ? 'භාරකරු' : 'Collector')}
          defaultMessage={remindInfo.messageText}
          whatsappUrl={remindInfo.url}
        />
      )}

      {/* Modals */}
      <AddCollectionModal
        isOpen={isAddPoolOpen}
        onClose={() => setIsAddPoolOpen(false)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
};
