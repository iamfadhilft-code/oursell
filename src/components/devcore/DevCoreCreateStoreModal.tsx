'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { BusinessCategory, PlanTier } from '@/types/pos';
import {
  X,
  Store,
  Sparkles,
  ShieldCheck,
  Building,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CreditCard,
  MapPin,
  FileText,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface DevCoreCreateStoreModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onStoreCreated?: (brandId: string, appId: string) => void;
}

const CATEGORIES: BusinessCategory[] = [
  'Supermarket',
  'Grocery',
  'Fashion',
  'Electronics',
  'Pharmacy',
  'Bakery',
  'Restaurant',
  'Cafe',
  'General Retail',
  'Specialty Gift',
];

const SAMPLE_PRESETS = [
  {
    brandName: 'Apex Electronics & Smart Gadgets',
    category: 'Electronics' as BusinessCategory,
    ownerName: 'Kiran Verma',
    city: 'MG Road Tech Hub, Kochi',
    planTier: 'Professional' as PlanTier,
    outlets: 1,
    terminals: 3,
  },
  {
    brandName: 'Bloom Organic Supermarket',
    category: 'Grocery' as BusinessCategory,
    ownerName: 'Sara Abraham',
    city: 'Green Square, Marine Drive, Kochi',
    planTier: 'Professional' as PlanTier,
    outlets: 2,
    terminals: 4,
  },
  {
    brandName: 'Urban Chic Haute Couture',
    category: 'Fashion' as BusinessCategory,
    ownerName: 'Pooja Nair',
    city: 'Central Avenue, Infopark Phase 2',
    planTier: 'Starter' as PlanTier,
    outlets: 1,
    terminals: 2,
  },
  {
    brandName: 'HealthFirst Care & Wellness Pharmacy',
    category: 'Pharmacy' as BusinessCategory,
    ownerName: 'Dr. Joseph Kurian',
    city: 'Hospital Junction, Kakkanad',
    planTier: 'Professional' as PlanTier,
    outlets: 1,
    terminals: 2,
  },
  {
    brandName: 'Artisan Sourdough & French Bakery',
    category: 'Bakery' as BusinessCategory,
    ownerName: 'Faizal Khan',
    city: 'Fort Kochi Heritage Row, Kochi',
    planTier: 'Starter' as PlanTier,
    outlets: 1,
    terminals: 1,
  },
  {
    brandName: 'Green Valley Grand Hypermarket',
    category: 'Supermarket' as BusinessCategory,
    ownerName: 'Mansoor Ali',
    city: 'Highway Junction, Bypass Road',
    planTier: 'Enterprise' as PlanTier,
    outlets: 3,
    terminals: 6,
  },
  {
    brandName: 'The Royal Bistro & Specialty Coffee',
    category: 'Cafe' as BusinessCategory,
    ownerName: 'Ananya Sen',
    city: 'Bayview Promenade, Panampilly Nagar',
    planTier: 'Starter' as PlanTier,
    outlets: 1,
    terminals: 2,
  },
];

export function DevCoreCreateStoreModal({
  isOpen,
  onClose,
  onStoreCreated,
}: DevCoreCreateStoreModalProps) {
  const { isCreateStoreModalOpen, closeCreateStoreModal, createActiveStore, theme } = useDevCoreStore();
  const isDark = theme === 'dark';

  const modalVisible = isOpen !== undefined ? isOpen : isCreateStoreModalOpen;

  // Form Fields
  const [brandName, setBrandName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Supermarket');
  const [ownerName, setOwnerName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('shop@123');
  const [pin, setPin] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [planTier, setPlanTier] = useState<PlanTier>('Starter');
  const [outletCount, setOutletCount] = useState(1);
  const [terminalCount, setTerminalCount] = useState(2);
  const [currency, setCurrency] = useState('₹');
  const [taxRateDefault, setTaxRateDefault] = useState(5);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Result state after creation
  const [creationResult, setCreationResult] = useState<{
    brandId: string;
    brandName: string;
    username: string;
    password: string;
    pin: string;
    planTier: string;
    appId: string;
  } | null>(null);

  // Quick fill random sample data
  const handleQuickFill = () => {
    const randomPreset = SAMPLE_PRESETS[Math.floor(Math.random() * SAMPLE_PRESETS.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedUsername =
      randomPreset.brandName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8) + randomNum;

    setBrandName(randomPreset.brandName);
    setLegalName(`${randomPreset.brandName} Private Limited`);
    setCategory(randomPreset.category);
    setOwnerName(randomPreset.ownerName);
    setUsername(generatedUsername);
    setEmail(`${generatedUsername}@retailnet.in`);
    setPhone(`+91 98${Math.floor(10000000 + Math.random() * 90000000)}`);
    setBusinessAddress(randomPreset.city);
    setGstin(`32ABCDE${randomNum}F1Z5`);
    setPlanTier(randomPreset.planTier);
    setOutletCount(randomPreset.outlets);
    setTerminalCount(randomPreset.terminals);
    setPassword('shop@123');
    setPin('1234');
    setErrorMessage(null);
  };

  // Auto-generate username & legal name on brandName change if username was default/empty
  const handleBrandNameChange = (val: string) => {
    setBrandName(val);
    if (!legalName || legalName.endsWith('Private Limited')) {
      setLegalName(val ? `${val.trim()} Private Limited` : '');
    }
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    if (clean && (!username || username.startsWith(clean.slice(0, 4)))) {
      setUsername(clean);
      if (!email || email.includes('@retailnet.in')) {
        setEmail(`${clean}@retailnet.in`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanBrand = brandName.trim();
    const cleanUser = username.trim().toLowerCase();
    const cleanOwner = ownerName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanBrand) {
      setErrorMessage('Please enter the store or brand name.');
      return;
    }
    if (!cleanOwner) {
      setErrorMessage('Please enter the owner or manager name.');
      return;
    }
    if (!cleanUser) {
      setErrorMessage('Please enter a unique admin username.');
      return;
    }
    if (cleanUser.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createActiveStore({
        brandName: cleanBrand,
        legalName: legalName.trim() || cleanBrand,
        businessCategory: category,
        ownerName: cleanOwner,
        email: cleanEmail || `${cleanUser}@retailnet.in`,
        phone: phone.trim() || '+91 9800000000',
        username: cleanUser,
        password: password.trim(),
        pin: pin.trim() || '1234',
        planTier,
        outletCount,
        terminalCount,
        gstin: gstin.trim() || undefined,
        businessAddress: businessAddress.trim() || undefined,
        currency,
        taxRateDefault,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create and activate store.');
        setIsSubmitting(false);
        return;
      }

      setCreationResult({
        brandId: res.brandId || '',
        brandName: cleanBrand,
        username: cleanUser,
        password: password.trim(),
        pin: pin.trim() || '1234',
        planTier,
        appId: res.appId || '',
      });

      if (onStoreCreated && res.brandId && res.appId) {
        onStoreCreated(res.brandId, res.appId);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during store creation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!creationResult) return;
    const creds = `=== OURSELL STORE CREDENTIALS ===\nStore: ${creationResult.brandName}\nStore ID: ${creationResult.brandId}\nLogin Username: ${creationResult.username}\nPassword: ${creationResult.password}\nPIN: ${creationResult.pin}\nStore Route: /shop/${creationResult.brandId}`;
    navigator.clipboard.writeText(creds);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const handleResetAndClose = () => {
    setBrandName('');
    setLegalName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setBusinessAddress('');
    setGstin('');
    setCreationResult(null);
    setErrorMessage(null);
    if (onClose) onClose();
    closeCreateStoreModal();
  };

  if (!modalVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-3xl rounded-[28px] border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all ${
          isDark
            ? 'bg-[#111717] border-[#232D2B] text-slate-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-[#232D2B] bg-[#0E1413]' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Store className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg">Create New Store</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Auto-Active (Dev Core)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct Provisioning Console • Instant Active Status & Production POS Access
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {creationResult ? (
          /* SUCCESS STATE VIEW */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Store Created & Auto-Activated!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Because this store was created by Dev Core, it bypassed the pending approval queue
                and is now <strong className="text-emerald-500 font-bold">ACTIVE & LIVE</strong> in production.
              </p>
            </div>

            {/* Store Information Card */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#141C1A] border-[#232D2B]' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    STORE NAME & IDENTIFIER
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {creationResult.brandName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 font-mono text-xs font-bold border border-emerald-500/30">
                      {creationResult.brandId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    STATUS: ACTIVE
                  </span>
                </div>
              </div>

              {/* Login Credentials Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0E1413] border-[#232D2B]' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">
                    Admin Username
                  </span>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all">
                    {creationResult.username}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0E1413] border-[#232D2B]' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">
                    Admin Password
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {creationResult.password}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    isDark ? 'bg-[#0E1413] border-[#232D2B]' : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">
                    Security PIN
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {creationResult.pin}
                  </span>
                </div>
              </div>

              {/* URL Direct link banner */}
              <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-xl bg-black/10 dark:bg-black/30 text-slate-600 dark:text-slate-300">
                <span>Workspace URL: /shop/{creationResult.brandId}</span>
                <span className="text-[10px] text-emerald-500 font-bold uppercase">Ready to Use</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopyCredentials}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  copiedSuccess
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    : isDark
                    ? 'bg-[#182321] hover:bg-[#202E2B] text-slate-200 border-[#232D2B]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Credentials Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Credentials</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/shop/${creationResult.brandId}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <span>Visit Store POS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs transition shadow-sm hover:opacity-90 cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">
              {/* Notice & Quick Fill bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                      Dev Core Direct Auto-Activation
                    </span>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                      Store created here will be automatically set to <strong>ACTIVE</strong> with instant workspace, credentials, and subscriptions provisioned.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Quick Fill Sample Data</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Section 1: Store & Entity Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-mono uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">
                    Store Identity & Category
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Brand / Store Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => handleBrandNameChange(e.target.value)}
                      placeholder="e.g. Apex Supermarket"
                      required
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Business Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Legal Business Name
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="e.g. Apex Supermarket Private Limited"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Store Admin Login Credentials */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-mono uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">
                    Store Admin Credentials (Auto-Created)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Owner / Manager Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Kiran Verma"
                      required
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Admin Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-slate-400 font-bold">
                        s/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        placeholder="apexstore"
                        required
                        className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                          isDark
                            ? 'bg-[#0E1413] border-[#232D2B] text-emerald-400 focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-emerald-600 focus:border-emerald-600'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Admin Login Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="shop@123"
                        required
                        className={`w-full px-3.5 pr-10 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                          isDark
                            ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      POS Fast PIN (4 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Contact & Location */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-mono uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">
                    Contact & Address
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@retailnet.in"
                      required
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Store Address / City
                    </label>
                    <input
                      type="text"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="e.g. Sector 4, Tech Park, Kochi"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      GSTIN / Tax Registration No.
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 32ABCDE1234F1Z5"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Subscription Plan & Capacity */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-mono uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">
                    Plan & Hardware Capacity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Assigned Plan Tier
                    </label>
                    <select
                      value={planTier}
                      onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    >
                      <option value="Starter">Starter (₹999/mo)</option>
                      <option value="Professional">Professional (₹1,999/mo)</option>
                      <option value="Enterprise">Enterprise (₹4,999/mo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Number of Outlets
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={outletCount}
                      onChange={(e) => setOutletCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      POS Terminals Allowed
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={terminalCount}
                      onChange={(e) => setTerminalCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs outline-none border transition ${
                        isDark
                          ? 'bg-[#0E1413] border-[#232D2B] text-white focus:border-emerald-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div
              className={`px-6 py-4 border-t flex items-center justify-between gap-3 shrink-0 ${
                isDark ? 'border-[#232D2B] bg-[#0E1413]' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Store...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create & Auto-Activate Store</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
