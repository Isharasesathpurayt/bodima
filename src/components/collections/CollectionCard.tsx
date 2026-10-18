import React, { useState } from 'react';
import {
  Wallet,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Trash2,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { CollectionPool, BoardingMember } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';
import { useAuth } from '../../context/AuthContext';
import { RemindModal } from '../common/RemindModal';

interface CollectionCardProps {
  pool: CollectionPool;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ pool }) => {
  const { t, language } = useLanguage();
  const { user, isCollectorOrAdmin, openAuthModal } = useAuth();
  const {
    getMemberById,
    updatePaymentStatus,
    completeCollectionPool,
    deleteCollectionPool,
    generateWhatsAppReminderLink
  } = useBodima();

  const [expanded, setExpanded] = useState(true);
  const [selectedRemindMemberId, setSelectedRemindMemberId] = useState<string | null>(null);
  const [bankCopied, setBankCopied] = useState(false);

  const collector = getMemberById(pool.collectorId);
  const bank = pool.collectorBankDetails || collector?.bankDetails;
  const userPayment = user ? pool.payments.find(p => p.memberId === user.id) : null;
  const isUserUnpaid = Boolean(userPayment && !userPayment.isPaid);
  const isThisPoolCollector = user && (user.id === pool.collectorId || isCollectorOrAdmin);

  const totalTarget = pool.targetPerPerson * pool.payments.length;
  const paidCount = pool.payments.filter(p => p.isPaid).length;
  const totalCollected = pool.payments
    .filter(p => p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);
  const progressPercent = Math.round((paidCount / (pool.payments.length || 1)) * 100);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = pool.dueDate < today && !pool.isCompleted;

  const title = language === 'si' ? pool.titleSi : pool.titleEn;
  const categoryLabel = t.collections.categories[pool.category];
  const cycleLabel = t.collections.cycles[pool.cycle];

  const handleTogglePayment = (memberId: string, currentPaid: boolean) => {
    if (!isCollectorOrAdmin) {
      alert(language === 'si' ? 'සල්ලි ගෙවූ බව සලකුනු කිරීමට හැකි මුදල් භාරකරුට පමණි. කරුණාකර පළමුව ලොග් වන්න.' : 'Only the designated collector can mark payments. Please login first.');
      openAuthModal();
      return;
    }
    updatePaymentStatus(pool.id, memberId, !currentPaid, 'cash');
  };

  const remindInfo = selectedRemindMemberId
    ? generateWhatsAppReminderLink(selectedRemindMemberId, pool.id)
    : { url: '', messageText: '', memberPhone: '' };

  const selectedMember = selectedRemindMemberId ? getMemberById(selectedRemindMemberId) : undefined;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top Banner / Category & Status */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {categoryLabel}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                {cycleLabel}
              </span>
              {pool.isCompleted ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {t.common.completedBadge}
                </span>
              ) : isOverdue ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-3 h-3" /> {t.common.overdue}
                </span>
              ) : null}
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
              {title}
            </h3>

            {pool.descriptionSi && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {language === 'si' ? pool.descriptionSi : pool.descriptionEn || pool.descriptionSi}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (window.confirm(t.common.confirmRemoveCollection)) {
                deleteCollectionPool(pool.id);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete pool"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Collector Badge & Due Date */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50/80 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <img
              src={collector?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
              alt={collector?.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                {t.common.collector}
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {collector?.name || '-'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
              <Calendar className="w-3 h-3" /> {t.common.dueDate}
            </div>
            <div className={`text-xs font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-gray-200'}`}>
              {pool.dueDate}
            </div>
          </div>
        </div>

        {/* Progress Bar & Amounts */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-gray-600 dark:text-gray-400">
              {t.common.collected}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{t.common.lkr} {totalCollected.toLocaleString()}</span> / {t.common.lkr} {totalTarget.toLocaleString()}
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{progressPercent}%</span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : isOverdue
                  ? 'bg-rose-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {t.common.perPerson}: <strong className="text-gray-900 dark:text-white font-bold">{t.common.lkr} {pool.targetPerPerson.toLocaleString()}</strong>
            </span>
            <span>
              {paidCount} / {pool.payments.length} {t.common.paidMembersCount}
            </span>
          </div>
        </div>

        {/* Overdue Warning Alert Banner */}
        {isOverdue && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
              <span>
                {language === 'si'
                  ? `ගෙවීමේ අවසන් දිනය (${pool.dueDate}) ඉක්මවා ඇත! කරුණාකර මුදල් භාරකරුට ලබාදෙන්න හෝ Online Transfer කරන්න.`
                  : `Payment deadline (${pool.dueDate}) has passed! Please pay the designated collector or transfer online.`}
              </span>
            </div>
            {isUserUnpaid && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shrink-0 animate-bounce">
                {t.common.youOweThis}
              </span>
            )}
          </div>
        )}

        {/* User Unpaid Gentle Reminder */}
        {isUserUnpaid && !isOverdue && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {language === 'si'
                  ? `ඔබගේ කොටස වන ${t.common.lkr} ${pool.targetPerPerson.toLocaleString()} තවම ගෙවා නැත.`
                  : `Your share of ${t.common.lkr} ${pool.targetPerPerson.toLocaleString()} is not paid yet.`}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
              {t.common.dueDate}: {pool.dueDate}
            </span>
          </div>
        )}

        {/* Collector Bank Info Card for Online Transfers */}
        {bank && bank.accountNumber && (
          <div className="mt-3.5 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.common.bankAccountForTransfer}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                {bank.bankName}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-200/80 dark:border-slate-800">
              <div className="min-w-0">
                <div className="font-mono font-bold text-gray-900 dark:text-white text-xs tracking-wider">
                  {bank.accountNumber}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {bank.accountName} {bank.branch ? `• ${bank.branch}` : ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(bank.accountNumber);
                  setBankCopied(true);
                  setTimeout(() => setBankCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
                title="Copy Account Number"
              >
                {bankCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{bankCopied ? t.common.copied : t.common.copyAccount}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Payments Collapsible List */}
      <div className="border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 bg-gray-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span>{t.collections.memberPaymentList} ({pool.payments.length})</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="divide-y divide-gray-100 dark:divide-slate-800/80 px-4 py-1">
            {pool.payments.map((p) => {
              const member = getMemberById(p.memberId);
              if (!member) return null;

              return (
                <div
                  key={p.memberId}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      {p.note && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                          {p.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Button */}
                    <button
                      onClick={() => handleTogglePayment(p.memberId, p.isPaid)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        p.isPaid
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/80'
                          : isOverdue
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                          : 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      }`}
                      title={p.isPaid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
                    >
                      {p.isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.common.paid}</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isOverdue ? t.common.overdue : t.common.pending}</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Remind button if not paid */}
                    {!p.isPaid && (
                      <button
                        onClick={() => setSelectedRemindMemberId(p.memberId)}
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title={t.collections.remindTooltip}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collector Management Action Bar */}
      {isThisPoolCollector && (
        <div className="px-4 py-2.5 bg-gray-50/90 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold">{t.common.collector}:</span>
            {pool.isCompleted ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t.common.finishedStatus}</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">{t.common.activeStatus}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!pool.isCompleted ? (
              <button
                type="button"
                onClick={() => completeCollectionPool(pool.id, true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                title="Mark this collection as finished"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.common.finishCollection}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => completeCollectionPool(pool.id, false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 font-bold text-[11px] transition-all"
                title="Reopen collection"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.common.reopenCollection}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.common.confirmRemoveCollection)) {
                  deleteCollectionPool(pool.id);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-semibold border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
              title="Delete/Remove pool"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.common.removeCollection}</span>
            </button>
          </div>
        </div>
      )}

      {/* Remind Modal */}
      {selectedRemindMemberId && selectedMember && (
        <RemindModal
          isOpen={!!selectedRemindMemberId}
          onClose={() => setSelectedRemindMemberId(null)}
          memberName={selectedMember.name}
          memberPhone={selectedMember.phone}
          poolTitle={title}
          amount={pool.targetPerPerson}
          dueDate={pool.dueDate}
          collectorName={collector?.name || (language === 'si' ? 'භාරකරු' : 'Collector')}
          defaultMessage={remindInfo.messageText}
          whatsappUrl={remindInfo.url}
        />
      )}
    </div>
  );
};
