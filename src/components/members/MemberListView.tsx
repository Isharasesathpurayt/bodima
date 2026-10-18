import React, { useState } from 'react';
import { Users, Plus, Phone, MessageSquare, Shield, Check, Trash2, X, CreditCard, Utensils } from 'lucide-react';
import { BoardingMember } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useBodima } from '../../context/BodimaContext';

export const MemberListView: React.FC = () => {
  const { t, language } = useLanguage();
  const { members, addMember, updateMember, deleteMember, collections } = useBodima();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+94');
  const [roleDescriptionSi, setRoleDescriptionSi] = useState('සාමාජික');
  const [roleDescriptionEn, setRoleDescriptionEn] = useState('Boarder');
  const [eatsAtBodima, setEatsAtBodima] = useState(true);
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  ];

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addMember({
      name,
      phone,
      roleDescriptionSi,
      roleDescriptionEn,
      avatar,
      isActive: true,
      eatsAtBodima,
      isCollectorFor: []
    });

    setName('');
    setPhone('+94');
    setEatsAtBodima(true);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{t.members.title} ({members.length})</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t.members.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.members.addNew}</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map(member => {
          // Check which pools this person is the designated collector for
          const managedPools = collections.filter(c => c.collectorId === member.id);

          return (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">
                        {member.name}
                      </h4>
                      <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Shield className="w-3 h-3" />
                        <span>{language === 'si' ? member.roleDescriptionSi : member.roleDescriptionEn}</span>
                      </div>
                    </div>
                  </div>

                  {members.length > 2 && (
                    <button
                      onClick={() => {
                        if (window.confirm(language === 'si' ? 'මෙම සාමාජිකයා ඉවත් කරන්නද?' : 'Delete member?')) {
                          deleteMember(member.id);
                        }
                      }}
                      className="p-1.5 text-gray-300 hover:text-rose-500 rounded-lg transition-colors"
                      title="Delete member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Eating Status Badge & Bank Info */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    member.eatsAtBodima !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'
                  }`}>
                    <Utensils className="w-3 h-3" />
                    <span>
                      {member.eatsAtBodima !== false
                        ? (language === 'si' ? 'බෝඩිමෙන් කනවා' : 'Boarding Meals')
                        : (language === 'si' ? 'කෑම නෑ (කෑම සල්ලි රු. 0)' : 'No Meals (Rs. 0)')}
                    </span>
                  </span>

                  {member.bankDetails && member.bankDetails.accountNumber && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <CreditCard className="w-3 h-3" />
                      <span>{member.bankDetails.bankName}: {member.bankDetails.accountNumber}</span>
                    </span>
                  )}
                </div>

                {/* Managed Collections */}
                {managedPools.length > 0 && (
                  <div className="mt-3 p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                      {language === 'si' ? 'භාරකාරත්වය දරන එකතුකිරීම්:' : 'Managed Pools:'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {managedPools.map(pool => (
                        <span
                          key={pool.id}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
                        >
                          {language === 'si' ? pool.titleSi : pool.titleEn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact & WhatsApp Action */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{member.phone}</span>
                </span>

                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t.members.addNew}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'නම *' : 'Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'si' ? 'උදා: මාලිංග පෙරේරා' : 'e.g. Malinga Perera'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'දුරකථන අංකය (WhatsApp) *' : 'WhatsApp Phone *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+947XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'වගකීම / භාරකාරත්වය *' : 'Role / Responsibility *'}
                </label>
                <select
                  value={roleDescriptionSi}
                  onChange={e => {
                    setRoleDescriptionSi(e.target.value);
                    if (e.target.value === 'මාසික බෝඩිම් කුලී භාරකරු') setRoleDescriptionEn('Monthly Rent Collector');
                    else if (e.target.value === 'සතිපතා කෑම මුදල් භාරකරු') setRoleDescriptionEn('Weekly Food Collector');
                    else if (e.target.value === 'සබන් සහ පිරිසිදුකාරක භාරකරු') setRoleDescriptionEn('Soap & Supplies Collector');
                    else setRoleDescriptionEn('Boarder');
                  }}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="මාසික බෝඩිම් කුලී භාරකරු">
                    {language === 'si' ? 'මාසික බෝඩිම් කුලී භාරකරු' : 'Monthly Rent Collector'}
                  </option>
                  <option value="සතිපතා කෑම මුදල් භාරකරු">
                    {language === 'si' ? 'සතිපතා කෑම මුදල් භාරකරු' : 'Weekly Food Collector'}
                  </option>
                  <option value="සබන් සහ පිරිසිදුකාරක භාරකරු">
                    {language === 'si' ? 'සබන් සහ පිරිසිදුකාරක භාරකරු' : 'Soap & Supplies Collector'}
                  </option>
                  <option value="සාමාජික">
                    {language === 'si' ? 'සාමාජික (සාමාන්‍ය)' : 'General Boarder'}
                  </option>
                </select>
              </div>

              {/* Meal eating status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {language === 'si' ? 'බෝඩිමෙන් කෑම ගන්නවාද?' : 'Eats meals at bodima?'}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {language === 'si' ? 'නැතහොත් කෑම සල්ලි බෙදීමේදී නිදහස් වේ' : 'If unchecked, exempt from meal split'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={eatsAtBodima}
                  onChange={e => setEatsAtBodima(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'Avatar තෝරන්න' : 'Choose Avatar'}
                </label>
                <div className="flex items-center gap-2">
                  {avatarPresets.map((p, idx) => (
                    <img
                      key={idx}
                      src={p}
                      alt="Preset"
                      onClick={() => setAvatar(p)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                        avatar === p ? 'border-emerald-600 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {t.common.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
