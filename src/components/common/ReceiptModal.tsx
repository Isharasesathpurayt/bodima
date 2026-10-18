import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title: string;
  amount: number;
  payerName: string;
  date: string;
  notes?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  amount,
  payerName,
  date,
  notes
}) => {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {payerName} • {date} • {t.common.lkr} {amount.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-gray-100/50 dark:bg-slate-950/50">
          {imageUrl ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={imageUrl}
                alt="Receipt Bill"
                className="max-h-[60vh] object-contain rounded-lg shadow-md border border-gray-200 dark:border-slate-800 bg-white"
              />
              <div className="mt-3 flex gap-2">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {language === 'si' ? 'සම්පූර්ණ පින්තූරය බලන්න' : 'Open Full Image'}
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <p>{t.common.noReceipt}</p>
            </div>
          )}

          {notes && (
            <div className="w-full mt-4 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-800 text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {language === 'si' ? 'විස්තරය: ' : 'Note: '}
              </span>
              <span className="text-gray-600 dark:text-gray-400">{notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
