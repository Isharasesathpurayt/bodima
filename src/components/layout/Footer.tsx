import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xs py-4 px-4 text-center transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-bold text-gray-800 dark:text-gray-200">{language === 'si' ? 'බෝඩිම' : 'Bodima'}</span>
          <span>•</span>
          <span>{language === 'si' ? 'වියදම් කළමනාකරණ පද්ධතිය' : 'Boarding Expense Management'}</span>
          <span>•</span>
          <span>© {currentYear}</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300">
          <span>{language === 'si' ? 'නිර්මාණය කළේ' : 'Created by'}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wide">
            Ishara Sesathpura
          </span>
        </div>
      </div>
    </footer>
  );
};
