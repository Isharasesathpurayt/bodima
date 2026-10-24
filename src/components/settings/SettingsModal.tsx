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
  Utensils,
  Database,
  Server,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getSupabaseConfig, saveSupabaseConfig, SUPABASE_SQL_SETUP } from '../../lib/supabase';
import { apiFetch, getCustomApiUrl, saveCustomApiUrl } from '../../lib/apiClient';
import { cloudDb } from '../../lib/cloudDb';

export const SettingsModal: React.FC = () => {
  const { user, bodima, isSettingsOpen, closeSettings, updateProfile, leaveBodima } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'profile' | 'database'>('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+94');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [roleTitleSi, setRoleTitleSi] = useState(user?.roleTitleSi || 'සාමාජික');
  const [eatsAtBodima, setEatsAtBodima] = useState(user?.eatsAtBodima !== false);
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || 'Commercial Bank');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');
  const [accountName, setAccountName] = useState(user?.bankDetails?.accountName || '');
  const [branch, setBranch] = useState(user?.bankDetails?.branch || '');

  // Database Form state
  const initialSupabase = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabase.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialSupabase.anonKey);
  const [customApiUrl, setCustomApiUrl] = useState(getCustomApiUrl());

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedDbSuccess, setSavedDbSuccess] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
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

  const handleSaveDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    saveCustomApiUrl(customApiUrl);
    setSavedDbSuccess(true);
    setTimeout(() => {
      setSavedDbSuccess(false);
    }, 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(language === 'si' ? 'සම්බන්ධතාවය පරීක්ෂා කරමින්...' : 'Testing connection...');
    saveSupabaseConfig(supabaseUrl, supabaseAnonKey);
    saveCustomApiUrl(customApiUrl);

    if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
      const res = await cloudDb.testConnection();
      if (res.success) {
        setTestStatus('success');
        setTestMessage(res.message);
        return;
      }

      try {
        const backendResponse = await apiFetch('/api/health');
        if (backendResponse.ok) {
          setTestStatus('success');
          setTestMessage(language === 'si'
            ? `SQLite දත්ත සමුදාය සම්බන්ධයි. Supabase පරීක්ෂාව: ${res.message}`
            : `SQLite database connected. Supabase check: ${res.message}`);
        } else {
          setTestStatus('error');
          setTestMessage(`${res.message} · SQLite API returned HTTP ${backendResponse.status}`);
        }
      } catch (err: unknown) {
        setTestStatus('error');
        const message = err instanceof Error ? err.message : 'Server unavailable';
        setTestMessage(`${res.message} · ${message}`);
      }
      return;
    }

    try {
      const backendResponse = await apiFetch('/api/health');
      if (backendResponse.ok) {
        setTestStatus('success');
        setTestMessage(language === 'si' ? 'SQLite දත්ත සමුදාය සාර්ථකව සම්බන්ධයි.' : 'SQLite database connected successfully.');
      } else {
        setTestStatus('error');
        setTestMessage(`Server returned HTTP ${backendResponse.status}`);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : (language === 'si' ? 'සර්වර් එක සම්බන්ධ කරගත නොහැක' : 'Could not connect to the server'));
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleShareInvite = () => {
    if (!bodima) return;
    const { url: sbUrl, anonKey: sbKey } = getSupabaseConfig();
    let inviteUrl = window.location.origin;
    if (sbUrl && sbKey) {
      inviteUrl = `${inviteUrl}?db_url=${encodeURIComponent(sbUrl)}&db_key=${encodeURIComponent(sbKey)}`;
    }

    const shareText = language === 'si'
      ? `මචං, අපේ බෝඩිමේ (${bodima.name}) වියදම්, කෑම සල්ලි සහ බිල්පත් බලන්න bodima.lk එකට මෙන්න ලින්ක් එක:\n\n🔗 ${inviteUrl}\n🏠 බෝඩිමේ නම: ${bodima.name}\n🔑 මුරපදය: ${bodima.password || '1234'}\n\nලින්ක් එක ඔබලා කෙලින්ම සම්බන්ධ වෙන්න! 🙏`
      : `Hey! Check out our boarding house (${bodima.name}) expenses and bills on bodima.lk:\n\n🔗 ${inviteUrl}\n🏠 Bodima Name: ${bodima.name}\n🔑 Password: ${bodima.password || '1234'}\n\nClick link to join us directly! 🙏`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyCredentials = () => {
    if (!bodima) return;
    const { url: sbUrl, anonKey: sbKey } = getSupabaseConfig();
    let inviteUrl = window.location.origin;
    if (sbUrl && sbKey) {
      inviteUrl = `${inviteUrl}?db_url=${encodeURIComponent(sbUrl)}&db_key=${encodeURIComponent(sbKey)}`;
    }

    const creds = language === 'si'
      ? `🔗 ලින්ක් එක: ${inviteUrl}\n🏠 බෝඩිමේ නම: ${bodima.name}\n🔑 මුරපදය: ${bodima.password || '1234'}`
      : `🔗 Link: ${inviteUrl}\n🏠 Bodima Name: ${bodima.name}\n🔑 Password: ${bodima.password || '1234'}`;
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

  const isSupabaseActive = Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/40">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
            {language === 'si' ? 'පද්ධති සහ ගිණුම් සැකසුම්' : 'System & Account Settings'}
          </h3>
          <button
            onClick={closeSettings}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-850">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 font-bold text-xs border-b-2 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === 'si' ? 'මගේ ගිණුම සහ බෝඩිම' : 'Profile & Bodima'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-2.5 px-4 font-bold text-xs border-b-2 flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'database'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{language === 'si' ? 'ඩේටාබේස් (Cloud Database)' : 'Cloud Database'}</span>
            {isSupabaseActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            )}
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5 overflow-y-auto flex-1">
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
        )}

        {/* DATABASE TAB */}
        {activeTab === 'database' && (
          <form onSubmit={handleSaveDatabase} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Status Card */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              isSupabaseActive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isSupabaseActive ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm">
                    {isSupabaseActive
                      ? (language === 'si' ? 'Cloud Database (Supabase) සක්‍රියයි' : 'Supabase Cloud Database Configured')
                      : (language === 'si' ? 'දුරකථනයේ තාවකාලිකව සුරැකේ (Local Storage)' : 'Local Storage Fallback')}
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isSupabaseActive
                      ? (language === 'si' ? 'Supabase සැකසුම ඇත. සැබෑ සම්බන්ධතාවය තහවුරු කිරීමට පහත පරීක්ෂාව භාවිතා කරන්න.' : 'Supabase is configured. Use the connection check below to confirm it works.')
                      : (language === 'si' ? 'දත්ත සර්වරයේ SQLite දත්ත සමුදායට සුරැකේ. වෙනත් උපාංග සමඟ බෙදාගැනීමට සර්වරය සබැඳිව තිබිය යුතුයි.' : 'Data is saved to the server SQLite database. The server must be online to share across devices.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Connection Alert Result */}
            {testStatus !== 'idle' && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testStatus === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-blue-200'
                  : testStatus === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
              }`}>
                {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span className="font-medium flex-1">{testMessage}</span>
              </div>
            )}

            {/* Supabase Connection Credentials */}
            <div className="space-y-3.5 bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                    {language === 'si' ? 'Supabase Project විස්තර (නොමිලේ)' : 'Supabase Credentials (Free)'}
                  </h4>
                </div>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>supabase.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'Supabase Project URL' : 'Supabase Project URL'}
                </label>
                <input
                  type="text"
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'si' ? 'Supabase Anon Public Key' : 'Supabase Anon Public API Key'}
                </label>
                <textarea
                  rows={2}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI..."
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {/* 1-Click SQL Copy helper */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {language === 'si' ? 'Supabase SQL Editor එකට දැමීමට Tables Script එක:' : 'Database Tables Schema Script:'}
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? (language === 'si' ? 'SQL පිටපත් කළා!' : 'SQL Copied!') : (language === 'si' ? 'SQL Script එක Copy කරන්න' : 'Copy SQL Schema')}</span>
                </button>
              </div>
            </div>

            {/* Optional Custom API Backend URL */}
            <div className="space-y-2 bg-gray-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                  {language === 'si' ? 'Custom Backend Server (විකල්ප)' : 'Custom Backend Server (Optional)'}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {language === 'si'
                  ? 'ඔබ Express/Node backend එකක් Glitch හෝ වෙනත් තැනක Run කරන්නේ නම් එම URL එක මෙතැනට දෙන්න.'
                  : 'If you host the Node.js/SQLite server on Glitch or Render, enter its URL here.'}
              </p>
              <input
                type="text"
                placeholder="https://your-bodima-api.glitch.me"
                value={customApiUrl}
                onChange={e => setCustomApiUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Step-by-step Quick Setup Guide in Sinhala */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>{language === 'si' ? 'විනාඩි 2න් Database එක හදාගන්නේ මෙහෙමයි:' : 'Quick 2-minute setup guide:'}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                <li><a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">supabase.com</a> වෙත ගොස් නොමිලේ Account එකක් සාදන්න (Start your project - Card අනවශ්‍යයි).</li>
                <li><strong>New project</strong> එකක් සාදා නම සහ Database Password එකක් ලබාදෙන්න.</li>
                <li>Project Settings &gt; API වෙතින් <strong>Project URL</strong> සහ <strong>anon public API Key</strong> මෙතැනට Paste කරන්න.</li>
                <li>ඉහත <strong>'SQL Script එක Copy කරන්න'</strong> ඔබා, Supabase Dashboard හි <strong>SQL Editor</strong> වෙත ගොස් Paste කර <strong>Run</strong> කරන්න.</li>
                <li>පහත <strong>'සම්බන්ධතාවය පරීක්ෂා කරන්න'</strong> ඔබන්න. වැඩේ සාර්ථකයි! 🎉</li>
              </ol>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>{language === 'si' ? 'සම්බන්ධතාවය පරීක්ෂා කරන්න' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeSettings}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
                >
                  {language === 'si' ? 'වසන්න' : 'Close'}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {savedDbSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'si' ? 'සුරැකිණි!' : 'Saved!'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{language === 'si' ? 'සැකසුම් සුරකින්න' : 'Save Database'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

