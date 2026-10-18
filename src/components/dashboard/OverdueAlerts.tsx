import React, { useState } from 'react';
import { AlertTriangle, Send, CheckCircle2, Phone, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima, OverdueItem } from '../../context/BodimaContext';
import { RemindModal } from '../common/RemindModal';

export const OverdueAlerts: React.FC = () => {
  const { t, language } = useLanguage();
  const { getOverduePayments, updatePaymentStatus, generateWhatsAppReminderLink } = useBodima();
  const [selectedReminder, setSelectedReminder] = useState<OverdueItem | null>(null);

  const overdueList = getOverduePayments();

  if (overdueList.length === 0) {
    return null; // All clear!
  }

  const handleOpenReminder = (item: OverdueItem) => {
    setSelectedReminder(item);
  };

  const reminderInfo = selectedReminder
    ? generateWhatsAppReminderLink(selectedReminder.member.id, selectedReminder.poolId)
    : { url: '', messageText: '', memberPhone: '' };

  return (
    <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/5 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-rose-950 dark:text-rose-200">
              {t.dashboard.urgentReminders} ({overdueList.length})
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
              {language === 'si'
                ? 'සල්ලි පැහැරහැරීම් වැළැක්වීම සඳහා මෙම සාමාජිකයින්ට WhatsApp පණිවිඩයක් යවා මතක් කරන්න'
                : 'Send WhatsApp reminders to these members to prevent payment defaults'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {overdueList.map((item, idx) => {
          const poolTitle = language === 'si' ? item.poolTitleSi : item.poolTitleEn;
          return (
            <div
              key={`${item.poolId}-${item.member.id}-${idx}`}
              className="bg-white/95 dark:bg-slate-900/95 border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3 hover:border-rose-400 dark:hover:border-rose-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.member.avatar}
                    alt={item.member.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-300 dark:ring-rose-800"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {item.member.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <Phone className="w-3 h-3" /> {item.member.phone}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {t.common.lkr} {item.amount.toLocaleString()}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    <Clock className="w-3 h-3" />
                    {item.daysOverdue} {t.common.daysOverdue}
                  </span>
                </div>
              </div>

              {/* Pool & Collector info */}
              <div className="text-xs bg-gray-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800 space-y-1 text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[200px]" title={poolTitle}>
                    {poolTitle}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {t.common.collector}: <span className="font-semibold text-gray-700 dark:text-gray-200">{item.collector.name.split(' ')[0]}</span>
                  </span>
                </div>
                {item.collector.bankDetails && item.collector.bankDetails.accountNumber && (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold pt-0.5 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
                    <span>💳 {item.collector.bankDetails.bankName}</span>
                    <span>A/C: {item.collector.bankDetails.accountNumber}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenReminder(item)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp මතක් කිරීම</span>
                </button>

                <button
                  onClick={() => updatePaymentStatus(item.poolId, item.member.id, true, 'cash')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors"
                  title="Mark as paid"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.common.markAsPaid}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Remind Modal */}
      {selectedReminder && (
        <RemindModal
          isOpen={!!selectedReminder}
          onClose={() => setSelectedReminder(null)}
          memberName={selectedReminder.member.name}
          memberPhone={selectedReminder.member.phone}
          poolTitle={language === 'si' ? selectedReminder.poolTitleSi : selectedReminder.poolTitleEn}
          amount={selectedReminder.amount}
          dueDate={selectedReminder.dueDate}
          collectorName={selectedReminder.collector.name}
          defaultMessage={reminderInfo.messageText}
          whatsappUrl={reminderInfo.url}
        />
      )}
    </div>
  );
};
