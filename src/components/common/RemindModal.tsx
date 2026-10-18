import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface RemindModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberPhone: string;
  poolTitle: string;
  amount: number;
  dueDate: string;
  collectorName: string;
  defaultMessage: string;
  whatsappUrl: string;
}

export const RemindModal: React.FC<RemindModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberPhone,
  poolTitle,
  amount,
  dueDate,
  collectorName,
  defaultMessage,
  whatsappUrl
}) => {
  const { t, language } = useLanguage();
  const [customMessage, setCustomMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  // Update custom message when default changes
  React.useEffect(() => {
    setCustomMessage(defaultMessage);
  }, [defaultMessage]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    let cleanPhone = memberPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }
    const targetUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;
    window.open(targetUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.collections.reminderModalTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {memberName} ({memberPhone})
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{poolTitle}</span> • {t.common.lkr} {amount.toLocaleString()} • {t.common.dueDate}: {dueDate}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'si' ? 'යැවීමට නියමිත පණිවිඩය (සංස්කරණය කළ හැක):' : 'Message to send (editable):'}
            </label>
            <textarea
              rows={7}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {memberPhone}
            </span>
            <span>{t.common.collector}: {collectorName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? t.common.copied : t.common.copy}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              {t.common.sendWhatsApp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
