import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  User,
  Phone,
  Home,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  LogOut,
  Save,
  RotateCcw,
  CreditCard,
  Utensils
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const SettingsModal: React.FC = () => {
  const { user, bodima, isSettingsOpen, closeSettings, updateProfile, leaveBodima } = useAuth();
  const { language } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+94');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [roleTitleSi, setRoleTitleSi] = useState(user?.roleTitleSi || 'සාමාජික');
  const [eatsAtBodima, setEatsAtBodima] = useState(user?.eatsAtBodima !== false);
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || 'Commercial Bank');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.bankDetails?.accountName || '');
  const [branch, setBranch] = useState(user?.bankDetails?.branch || '');

  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '+94');
      setAvatar(user.avatar || '');
      setRoleTitleSi(user.roleTitleSi || 'සාමාජික');
      setEatsAtBodima(user.eatsAtBodima !== false);
      if (user.bankDetails) {
        setBankName(user.bankDetails.bankName || 'Commercial Bank');
        setAccountNumber(user.bankDetails.accountNumber || '');
        setAccountName(user.bankDetails.accountName || '');
        setBranch(user.bankDetails.branch || '');
      }
    }
  }, [user, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile({
      name,
      phone,
      avatar,
      roleTitleSi,
      eatsAtBodima,
      bankDetails: accountNumber.trim() ? {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || name,
        branch: branch.trim()
      } : undefined
    });
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeSettings();
    }, 1200);
  };

  const handleShareInvite = () => {
    if (!bodima) return;
    const shareText = language === 'si'
      ? `මචං, අපේ බෝඩිමේ වියදම්, කෑම සල්ලි සහ බිල්පත් බලන්න bodima.lk එකට ඇවිල්ලා:\n\n🏠 බෝඩිමේ නම: ${bodima.name}\n🔑 මුරපදය: ${bodima.password || '1234'}\n\nසම්බන්ධ වෙන්න! 🙏`
      : `Hey! Check out our boarding house expenses and bills on bodima.lk:\n\n🏠 Bodima Name: ${bodima.name}\n🔑 Password: ${bodima.password || '1234'}\n\nJoin us! 🙏`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyCredentials = () => {
    if (!bodima) return;
    const creds = language === 'si'
      ? `බෝඩිමේ නම: ${bodima.name}\nමුරපදය: ${bodima.password || '1234'}`
      : `Bodima Name: ${bodima.name}\nPassword: ${bodima.password || '1234'}`;
    navigator.clipboard.writeText(creds);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {language === 'si' ? 'ගිණුම් සහ බෝඩිමේ සැකසුම්' : 'Account & Bodima Settings'}
            </h3>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/30 border-2 border-white dark:border-slate-800 shadow-md bg-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-105"
                title={language === 'si' ? 'ෆොටෝ එක වෙනස් කරන්න' : 'Change Photo'}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
              {language === 'si' ? 'ෆොටෝ එකක් දමන්න' : 'Upload Photo'}
            </span>

            {/* Quick Preset Avatars */}
            <div className="flex items-center gap-1.5 mt-2.5">
              {avatarPresets.map((p, idx) => (
                <img
                  key={idx}
                  src={p}
                  alt="Preset"
                  onClick={() => setAvatar(p)}
                  className={`w-7 h-7 rounded-full object-cover cursor-pointer border transition-all ${
                    avatar === p ? 'border-emerald-600 ring-2 ring-emerald-400 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* User Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'ඔබේ නම *' : 'Your Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'දුරකථන අංකය (WhatsApp) *' : 'Phone (WhatsApp) *'}
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {language === 'si' ? 'වගකීම / භාරකාරත්වය' : 'Role / Responsibility'}
              </label>
              <select
                value={roleTitleSi}
                onChange={e => setRoleTitleSi(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="මාසික බෝඩිම් කුලී භාරකරු">{language === 'si' ? 'මාසික බෝඩිම් කුලී භාරකරු' : 'Monthly Rent Collector'}</option>
                <option value="සතිපතා කෑම මුදල් භාරකරු">{language === 'si' ? 'සතිපතා කෑම මුදල් භාරකරු' : 'Weekly Food Collector'}</option>
                <option value="සබන් සහ පිරිසිදුකාරක භාරකරු">{language === 'si' ? 'සබන් සහ පිරිසිදුකාරක භාරකරු' : 'Soap & Supplies Collector'}</option>
                <option value="සාමාජික">{language === 'si' ? 'සාමාජික' : 'General Boarder'}</option>
              </select>
            </div>

            {/* Meal / Eating status at Bodima */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eatsAtBodima}
                  onChange={e => setEatsAtBodima(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-700 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{language === 'si' ? 'මම බෝඩිමෙන් කෑම ගන්නවා' : 'I eat meals at Bodima'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {eatsAtBodima
                      ? (language === 'si' ? 'ඔබ සතිපතා කෑම සහ උයන බඩු වියදම් බෙදාගැනීමට ඇතුලත් වේ.' : 'You participate in weekly meals and grocery splits.')
                      : (language === 'si' ? 'ඔබ කෑම නොගන්නා බැවින් සතිපතා කෑම/උයන වියදම් වලින් ඔබව නිදහස් කෙරේ (රු. 0).' : 'You do not eat meals here and are exempt from grocery costs (Rs. 0).')}
                  </p>
                </div>
              </label>
            </div>

            {/* Collector Bank Details Section */}
            <div className="p-3.5 bg-gray-50/80 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                  {language === 'si' ? 'සල්ලි භාරකරුගේ බැංකු විස්තර' : 'Collector Bank Details'}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {language === 'si'
                  ? 'ඔබ බෝඩිමේ මුදල් එකතු කරන විට අනික් සාමාජිකයන්ට Online Transfer කිරීමට මෙම ගිණුම පෙන්වයි.'
                  : 'Shown to members when you collect funds so they can transfer directly online.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {language === 'si' ? 'බැංකුව' : 'Bank Name'}
                  </label>
                  <select
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
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
                    placeholder="උදා: 8001234567"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {language === 'si' ? 'ගිණුම් හිමියාගේ නම' : 'Account Holder Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={name || (language === 'si' ? 'ඔබගේ නම' : 'Your name')}
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {language === 'si' ? 'ශාඛාව' : 'Branch'}
                  </label>
                  <input
                    type="text"
                    placeholder="උදා: Colombo 07, Kandy"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current Bodima Information & Invite Card */}
          {bodima && (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                  {language === 'si' ? 'දැනට සම්බන්ධ වී ඇති බෝඩිම:' : 'Connected Bodima:'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold">
                  Active
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language === 'si' ? 'බෝඩිමේ නම:' : 'Bodima Name:'}
                  </span>
                  <strong className="text-gray-900 dark:text-white font-bold">{bodima.name}</strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language === 'si' ? 'බෝඩිමේ මුරපදය:' : 'Bodima Password:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      {showPassword ? (bodima.password || '1234') : '••••'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons for Roommates Invite */}
              <div className="pt-2 flex items-center gap-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'si' ? 'යාලුවන්ට Share කරන්න' : 'Share with Roommates'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-emerald-200 dark:border-slate-700 font-semibold text-[11px]"
                  title="Copy details"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (language === 'si' ? 'පිටපත් කළා' : 'Copied!') : (language === 'si' ? 'පිටපත්' : 'Copy')}</span>
                </button>
              </div>

              {/* Switch Bodima Button */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    closeSettings();
                    leaveBodima();
                  }}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                >
                  {language === 'si' ? 'වෙනත් බෝඩිමකට මාරු වන්න' : 'Switch to Another Bodima'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Save Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeSettings}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              {language === 'si' ? 'වසන්න' : 'Close'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'si' ? 'සුරැකිණි!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? (language === 'si' ? 'සුරකිමින්...' : 'Saving...') : (language === 'si' ? 'වෙනස්කම් සුරකින්න' : 'Save Changes')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
