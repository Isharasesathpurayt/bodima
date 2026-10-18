import React, { useState, useEffect } from 'react';
import { X, Plus, Wallet, Calendar, User, DollarSign, CreditCard, Utensils, Users, Check } from 'lucide-react';
import { CollectionCategory } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCollectionModal: React.FC<AddCollectionModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { members, createCollectionPool } = useBodima();

  const [titleSi, setTitleSi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState<CollectionCategory>('food');
  const [collectorId, setCollectorId] = useState(members[0]?.id || '');
  const [targetPerPerson, setTargetPerPerson] = useState<number>(1500);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [cycle, setCycle] = useState<'weekly' | 'monthly' | 'one-time'>('weekly');
  const [descriptionSi, setDescriptionSi] = useState('');

  // Participating Members selection
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Collector Bank Details
  const [collectorBankName, setCollectorBankName] = useState('Commercial Bank');
  const [collectorAccountNumber, setCollectorAccountNumber] = useState('');
  const [collectorAccountName, setCollectorAccountName] = useState('');
  const [collectorBranch, setCollectorBranch] = useState('');

  // Initialize selected members when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      if (category === 'food') {
        setSelectedMemberIds(members.filter(m => m.isActive && m.eatsAtBodima !== false).map(m => m.id));
      } else {
        setSelectedMemberIds(members.filter(m => m.isActive).map(m => m.id));
      }
    }
  }, [isOpen, category, members]);

  // Sync bank details when collector changes
  useEffect(() => {
    const collector = members.find(m => m.id === collectorId);
    if (collector && collector.bankDetails) {
      setCollectorBankName(collector.bankDetails.bankName || 'Commercial Bank');
      setCollectorAccountNumber(collector.bankDetails.accountNumber || '');
      setCollectorAccountName(collector.bankDetails.accountName || collector.name);
      setCollectorBranch(collector.bankDetails.branch || '');
    } else if (collector) {
      setCollectorAccountName(collector.name);
    }
  }, [collectorId, members]);

  if (!isOpen) return null;

  const handleCategorySelect = (cat: CollectionCategory) => {
    setCategory(cat);
    if (cat === 'food') {
      setSelectedMemberIds(members.filter(m => m.isActive && m.eatsAtBodima !== false).map(m => m.id));
      if (!titleSi) setTitleSi('සතියේ කෑම සහ උයන බඩු');
    } else if (cat === 'rent') {
      setSelectedMemberIds(members.filter(m => m.isActive).map(m => m.id));
      if (!titleSi) setTitleSi('මාසික බෝඩිම් කුලිය');
    } else if (cat === 'toiletries') {
      setSelectedMemberIds(members.filter(m => m.isActive).map(m => m.id));
      if (!titleSi) setTitleSi('සබන් සහ කුස්සියේ පොදු බඩු');
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const selectEatersOnly = () => {
    setSelectedMemberIds(members.filter(m => m.isActive && m.eatsAtBodima !== false).map(m => m.id));
  };

  const selectAllMembers = () => {
    setSelectedMemberIds(members.filter(m => m.isActive).map(m => m.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleSi && !titleEn) return;
    if (selectedMemberIds.length === 0) {
      alert(language === 'si' ? 'කරුණාකර අවම වශයෙන් එක් සාමාජිකයෙකුවත් තෝරන්න.' : 'Please select at least one participating member.');
      return;
    }

    createCollectionPool({
      titleSi: titleSi || titleEn,
      titleEn: titleEn || titleSi,
      category,
      collectorId,
      targetPerPerson: Number(targetPerPerson),
      dueDate,
      cycle,
      descriptionSi,
      descriptionEn: descriptionSi,
      participatingMemberIds: selectedMemberIds,
      collectorBankDetails: collectorAccountNumber.trim() ? {
        bankName: collectorBankName.trim(),
        accountNumber: collectorAccountNumber.trim(),
        accountName: collectorAccountName.trim() || (members.find(m => m.id === collectorId)?.name || ''),
        branch: collectorBranch.trim()
      } : undefined
    });

    onClose();
  };

  const totalPoolTarget = targetPerPerson * selectedMemberIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.collections.addNew}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'si'
                  ? 'බෝඩිමේ වියදම් එකතු කිරීමට අලුත් පූල් එකක් සකසන්න'
                  : 'Set up a new pool to collect shared boarding expenses'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {language === 'si' ? 'වියදම් අංශය *' : 'Expense Category *'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['food', 'rent', 'toiletries', 'utilities', 'other'] as CollectionCategory[]).map(
                cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                      category === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-300'
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
                {language === 'si' ? 'මාතෘකාව (සිංහලෙන්) *' : 'Title (Sinhala) *'}
              </label>
              <input
                type="text"
                required
                placeholder={language === 'si' ? 'උදා: සතියේ කෑම මුදල්' : 'e.g. Weekly Food Pool (Sinhala)'}
                value={titleSi}
                onChange={e => setTitleSi(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'මාතෘකාව (ඉංග්‍රීසි)' : 'Title (English)'}
              </label>
              <input
                type="text"
                placeholder={language === 'si' ? 'උදා: Weekly Food Pool' : 'e.g. Weekly Food Pool'}
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Collector & Target Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'මුදල් භාරකරු *' : 'Collector *'}
              </label>
              <select
                value={collectorId}
                onChange={e => setCollectorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({language === 'si' ? m.roleDescriptionSi : m.roleDescriptionEn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? `එක් අයෙකුගෙන් එකතු කරන මුදල (${t.common.lkr}) *` : `Target Amount Per Person (${t.common.lkr}) *`}
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={targetPerPerson}
                onChange={e => setTargetPerPerson(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* PARTICIPATING MEMBERS SELECTION */}
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-xs font-bold text-gray-900 dark:text-white">
                  {language === 'si' ? 'සල්ලි ගෙවිය යුතු සාමාජිකයන් තෝරන්න *' : 'Select Participating Members *'}
                </label>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {language === 'si' ? `${selectedMemberIds.length} දෙනෙක් තෝරා ඇත` : `${selectedMemberIds.length} selected`}
              </span>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectEatersOnly}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
              >
                <Utensils className="w-3 h-3" />
                <span>{language === 'si' ? 'කෑම කන අය පමණක්' : 'Diners Only'}</span>
              </button>

              <button
                type="button"
                onClick={selectAllMembers}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-slate-700 hover:bg-emerald-50 transition-all"
              >
                <Users className="w-3 h-3" />
                <span>{language === 'si' ? 'සියලුම සාමාජිකයන්' : 'All Members'}</span>
              </button>
            </div>

            {/* Member Checkbox Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto">
              {members.filter(m => m.isActive).map(m => {
                const isChecked = selectedMemberIds.includes(m.id);
                const eats = m.eatsAtBodima !== false;

                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMember(m.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-1 ring-emerald-400/40'
                        : 'bg-gray-50/70 dark:bg-slate-850 border-gray-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                      <div className="truncate text-left">
                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {m.name.split(' ')[0]}
                        </div>
                        <span className={`text-[10px] font-semibold ${eats ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {eats ? (language === 'si' ? '🍽️ කෑම කනවා' : '🍽️ Diners') : (language === 'si' ? '🚫 කෑම නෑ' : '🚫 No Meals')}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 dark:border-slate-700'
                    }`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pool Total Summary */}
            <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
              <span>{language === 'si' ? 'එකතු වන සම්පූර්ණ ඉලක්කය:' : 'Total Pool Target:'}</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                {t.common.lkr} {totalPoolTarget.toLocaleString()} ({targetPerPerson} × {selectedMemberIds.length})
              </strong>
            </div>
          </div>

          {/* COLLECTOR'S BANK DETAILS SECTION */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <label className="text-xs font-bold text-gray-900 dark:text-white">
                {language === 'si' ? 'සල්ලි භාරකරුගේ බැංකු ගිණුම් විස්තර (Online Transfer සඳහා)' : 'Collector Bank Account (for Online Transfer)'}
              </label>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'si'
                ? 'සාමාජිකයින්ට Online Banking මගින් එකතු කරන මුදල් භාරකරුට transfer කිරීමට මෙම ගිණුම පෙන්වයි.'
                : 'This bank account is shown to members to transfer their collection share via online banking.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {language === 'si' ? 'බැංකුව' : 'Bank'}
                </label>
                <select
                  value={collectorBankName}
                  onChange={e => setCollectorBankName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Commercial Bank">Commercial Bank</option>
                  <option value="Bank of Ceylon (BOC)">Bank of Ceylon (BOC)</option>
                  <option value="People's Bank">People's Bank</option>
                  <option value="Sampath Bank">Sampath Bank</option>
                  <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
                  <option value="National Savings Bank (NSB)">National Savings Bank (NSB)</option>
                  <option value="Seylan Bank">Seylan Bank</option>
                  <option value="Nations Trust Bank (NTB)">Nations Trust Bank</option>
                  <option value="DFCC Bank">DFCC Bank</option>
                  <option value="Other Bank">{language === 'si' ? 'වෙනත් බැංකුවක්' : 'Other Bank'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {language === 'si' ? 'ගිණුම් අංකය' : 'Account Number'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'si' ? 'උදා: 8001234567' : 'e.g. 8001234567'}
                  value={collectorAccountNumber}
                  onChange={e => setCollectorAccountNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {language === 'si' ? 'ගිණුම් හිමියාගේ නම' : 'Account Name'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'si' ? 'භාරකරුගේ නම' : 'Account Holder Name'}
                  value={collectorAccountName}
                  onChange={e => setCollectorAccountName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {language === 'si' ? 'ශාඛාව' : 'Branch'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'si' ? 'උදා: මහරගම / නුවර' : 'e.g. Maharagama / Kandy'}
                  value={collectorBranch}
                  onChange={e => setCollectorBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Due date & Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'අවසන් දිනය *' : 'Due Date *'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'කාලසීමාව' : 'Cycle'}
              </label>
              <select
                value={cycle}
                onChange={e => setCycle(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="weekly">{t.collections.cycles.weekly}</option>
                <option value="monthly">{t.collections.cycles.monthly}</option>
                <option value="one-time">{t.collections.cycles['one-time']}</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {language === 'si' ? 'අමතර විස්තර' : 'Additional Notes'}
            </label>
            <input
              type="text"
              placeholder={language === 'si' ? 'උදා: සතියේ එළවලු සහ හාල් සඳහා' : 'e.g. For weekly vegetables and rice'}
              value={descriptionSi}
              onChange={e => setDescriptionSi(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Actions */}
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
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
