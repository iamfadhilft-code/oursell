'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoreDiscoveryModal } from '@/components/discovery/StoreDiscoveryModal';
import { RegisterConnectionModal } from '@/components/registration/RegisterConnectionModal';
import { PlanContactModal } from '@/components/pricing/PlanContactModal';
import { PricingPlan } from '@/types/pos';
import { BarcodeRenderer } from '@/components/barcodes/BarcodeRenderer';
import {
  ShoppingCart,
  ShieldCheck,
  Zap,
  Cpu,
  WifiOff,
  ChevronRight,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  Receipt,
  Smartphone,
  Star,
  Check,
  Clock,
  MapPin,
  Phone,
  Search,
  X,
  Languages,
  Package,
  Barcode,
  BarChart3,
  Globe2,
  ChevronDown,
  Building2,
  Sparkles,
} from 'lucide-react';

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    description: 'Perfect for small stores and startups.',
    monthlyPrice: 0,
    annualPrice: 0,
    staffLimit: 1,
    outletLimit: 1,
    terminalLimit: 2,
    productLimit: 1000,
    features: [
      '1 Staff',
      '1 Store Outlet',
      '2 POS Terminals',
      'Full POS Billing',
      'Offline Billing',
      'Barcode Studio',
      '80mm Thermal Receipts',
      'Up to 1,000 Products',
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'MOST POPULAR',
    description: 'Ideal for supermarkets, restaurants and multi-counter outlets.',
    monthlyPrice: 799,
    annualPrice: 7990,
    staffLimit: 3,
    outletLimit: 3,
    terminalLimit: 6,
    productLimit: null,
    features: [
      'Up to 3 Staff',
      'Up to 3 Outlets',
      '6 POS Terminals',
      'Unlimited Products',
      'Customer Khata & Credit Ledger',
      'Purchase Orders',
      'Supplier Management',
      'Advanced Inventory & Reports',
      'English, Malayalam & Arabic',
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'enterprise',
    name: 'Multi-Chain Enterprise',
    description: 'For retail chains, franchises and regional networks.',
    monthlyPrice: 3299,
    annualPrice: 32990,
    staffLimit: 5, // Strict maximum 5 staff accounts
    outletLimit: null,
    terminalLimit: null,
    productLimit: null,
    features: [
      'Up to 5 Staff',
      'Unlimited Outlets',
      'Unlimited POS Terminals',
      'Unlimited Products',
      'Centralized Fleet Management',
      'Dedicated Database Isolation',
      'Custom Domain',
      'Advanced Permissions',
      '24/7 Priority Support',
    ],
    isActive: true,
    sortOrder: 3,
  },
];

export default function HomePage() {
  const router = useRouter();

  // Multi-Language State (English, Malayalam, Arabic)
  const [lang, setLang] = useState<'en' | 'ml' | 'ar'>('en');

  // Connect Store Node Modal State (Reference Screenshot 2)
  const [isStoreNodeModalOpen, setIsStoreNodeModalOpen] = useState(false);

  // Register Connection Modal State (Reference Screenshot 2 - "Get started" UI)
  const [isRegisterConnectionOpen, setIsRegisterConnectionOpen] = useState(false);

  // Pricing Plans State & Billing Cycle Toggle (Monthly vs Annual)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(DEFAULT_PRICING_PLANS);
  const [selectedContactPlan, setSelectedContactPlan] = useState<PricingPlan | null>(null);
  const [isPlanContactModalOpen, setIsPlanContactModalOpen] = useState(false);

  // Fetch configured plans from Dev Core / Supabase on mount
  useEffect(() => {
    fetch('/api/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
          setPricingPlans(data.plans);
        }
      })
      .catch((e) => console.warn('Could not load remote plans, using defaults:', e));
  }, []);

  const handleOpenContact = (plan: PricingPlan) => {
    setSelectedContactPlan(plan);
    setIsPlanContactModalOpen(true);
  };

  // Interactive FAQ State (default expanded item: 1)
  const [activeFaq, setActiveFaq] = useState<number | null>(1);

  // Translations for Key Hero & Navigation Elements
  const translations = {
    en: {
      tag: 'ENTERPRISE MULTI-STORE RETAIL PLATFORM',
      heading1: 'Smarter Retail.',
      heading2: 'Simpler Business.',
      subtitle:
        'Manage your products, inventory, billing and business operations from one powerful retail platform.',
      ctaPrimary: 'Explore Oursell',
      ctaSecondary: 'Login to Your Store',
      locateShop: 'Connect to Your Store',
      watchDemo: 'Interactive Demo',
      features: 'Features',
      solutions: 'Solutions',
      pricing: 'Pricing',
      about: 'About',
      contact: 'Contact & Hours',
      login: 'Login',
      getStarted: 'Get Started',
    },
    ml: {
      tag: 'കേരളത്തിലെയും ആഗോള വ്യാപാരികൾക്കായുള്ള ആധുനിക POS',
      heading1: 'മികച്ച റീട്ടെയിൽ.',
      heading2: 'ലളിതമായ ബിസിനസ്സ്.',
      subtitle:
        'നിങ്ങളുടെ ഉൽപ്പന്നങ്ങൾ, ഇൻവെന്ററി, ബില്ലിംഗ്, ബിസിനസ്സ് പ്രവർത്തനങ്ങൾ എന്നിവ ഒരൊറ്റ ശക്തമായ പ്ലാറ്റ്‌ഫോമിൽ കൈകാര്യം ചെയ്യുക.',
      ctaPrimary: 'ഓർസെൽ പര്യവേക്ഷണം ചെയ്യുക',
      ctaSecondary: 'സ്റ്റോറിലേക്ക് പ്രവേശിക്കുക',
      locateShop: 'സ്റ്റോർ നോഡ് കണ്ടെത്തുക',
      watchDemo: 'ഡെമോ കാണുക',
      features: 'സവിശേഷതകൾ',
      solutions: 'സൊല്യൂഷനുകൾ',
      pricing: 'വിലവിവരം',
      about: 'ഞങ്ങളെക്കുറിച്ച്',
      contact: 'പ്രവർത്തന സമയം',
      login: 'ലോഗിൻ',
      getStarted: 'ആരംഭിക്കുക',
    },
    ar: {
      tag: 'منصة إدارة متاجر التجزئة المؤسسية المتقدمة',
      heading1: 'تجارة تجزئة أذكى.',
      heading2: 'أعمال تجارية أبسط.',
      subtitle:
        'قم بإدارة منتجاتك ومخزونك ونقاط البيع وعملياتك التجارية من منصة متكاملة وسريعة بدون انقطاع.',
      ctaPrimary: 'استكشف أورسيل',
      ctaSecondary: 'تسجيل الدخول لمتجرك',
      locateShop: 'ربط عقدة المتجر',
      watchDemo: 'عرض توضيحي',
      features: 'المميزات',
      solutions: 'الحلول',
      pricing: 'الأسعار',
      about: 'عن أورسيل',
      contact: 'ساعات العمل والفروع',
      login: 'تسجيل الدخول',
      getStarted: 'ابدأ الآن',
    },
  };

  const t = translations[lang];
  const isRtl = lang === 'ar';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#080B0B] text-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-slate-950 overflow-x-hidden"
    >
      {/* 1. FLOATING PILL TOP NAVIGATION BAR (Exact match to Reference Screenshot 1) */}
      <div className="sticky top-3 sm:top-5 z-50 w-full px-3 sm:px-6 max-w-7xl mx-auto">
        <header className="bg-[#070908]/90 backdrop-blur-md border border-[#1f2824] shadow-[0_10px_35px_rgba(0,0,0,0.7)] rounded-full px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          {/* Nav Links */}
          <nav className="flex items-center gap-5 sm:gap-7 text-xs font-bold tracking-wider overflow-x-auto py-1">
            <a href="#features" className="text-neutral-300 hover:text-white transition uppercase whitespace-nowrap">
              FEATURES
            </a>
            <a href="#roi" className="text-neutral-300 hover:text-white transition uppercase whitespace-nowrap">
              ROI
            </a>
            <a href="#pricing" className="text-neutral-300 hover:text-white transition uppercase whitespace-nowrap">
              PRICING
            </a>
            <a href="#faq" className="text-neutral-300 hover:text-white transition uppercase whitespace-nowrap">
              FAQ
            </a>
            <a
              href="#contact"
              className="text-[#00c957] hover:text-[#34d399] transition uppercase font-black whitespace-nowrap"
            >
              ENQUIRY
            </a>
          </nav>

          {/* Right Controls: Language Selector Pill, Locate Shop, Get started */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Selector Pill */}
            <div className="flex items-center bg-[#0d1210] border border-[#1f2824] rounded-full p-1 text-xs">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 sm:px-3 py-1 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#00c957] text-slate-950 shadow-md shadow-[#00c957]/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ml')}
                className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'ml'
                    ? 'bg-[#00c957] text-slate-950 shadow-md shadow-[#00c957]/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                മലയാളം
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-2 sm:px-2.5 py-1 rounded-full font-bold transition text-[11px] cursor-pointer ${
                  lang === 'ar'
                    ? 'bg-[#00c957] text-slate-950 shadow-md shadow-[#00c957]/20'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Locate Shop Button */}
            <button
              onClick={() => setIsStoreNodeModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-neutral-700 hover:border-neutral-500 bg-[#0d1210]/60 hover:bg-[#141b18] text-white text-xs font-bold transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Locate Shop</span>
            </button>

            {/* Get started Button (Exact UI match to Screenshot 1 & triggers Screenshot 2 modal) */}
            <button
              onClick={() => setIsRegisterConnectionOpen(true)}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#00c957] hover:bg-[#00b84f] active:scale-95 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-[#00c957]/25 transition flex items-center justify-center cursor-pointer whitespace-nowrap"
            >
              <span>Get started</span>
            </button>
          </div>
        </header>
      </div>

      {/* 2. HERO SECTION (Reference Screenshot 3 & 4) */}
      <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Protocol Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#151D1C] border border-[#252F2D] text-[#10B981] text-xs font-mono font-bold tracking-wider uppercase mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span>{t.tag}</span>
        </div>

        {/* Main Heading with Accent Lime */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#F8FAFC] max-w-4xl leading-[1.1]">
          {t.heading1}{' '}
          <span className="text-[#C4F12A] drop-shadow-[0_0_25px_rgba(196,241,42,0.3)]">
            {t.heading2}
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
          {t.subtitle}
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 text-xs font-bold">
          <button
            onClick={() => setIsRegisterConnectionOpen(true)}
            className="px-6 py-3.5 rounded-full bg-[#00c957] hover:bg-[#00b84f] text-slate-950 font-black shadow-xl shadow-[#00c957]/20 transition flex items-center gap-2 cursor-pointer"
          >
            <span>{t.getStarted}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            onClick={() => setIsStoreNodeModalOpen(true)}
            className="px-6 py-3.5 rounded-full bg-[#080B0B] hover:bg-[#111717] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#252F2D] transition flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#00c957]" />
            <span>Connect to Your Store</span>
          </button>
        </div>

        {/* Hero KPI Stats Bar */}
        <div className="mt-14 grid grid-cols-3 max-w-2xl w-full divide-x divide-[#252F2D] border-y border-[#252F2D] py-6">
          <div className="px-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[#F8FAFC] font-mono">
              2,400<span className="text-[#10B981]">+</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider mt-1">
              STORES ACTIVE
            </div>
          </div>
          <div className="px-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[#C4F12A] font-mono">
              0.3s
            </div>
            <div className="text-[10px] sm:text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider mt-1">
              CHECKOUT SPEED
            </div>
          </div>
          <div className="px-4 text-center">
            <div className="text-2xl sm:text-3xl font-black text-[#F8FAFC] font-mono">
              99.9<span className="text-[#10B981]">%</span>
            </div>
            <div className="text-[10px] sm:text-xs font-mono font-semibold text-[#94A3B8] uppercase tracking-wider mt-1">
              OFFLINE READY SLA
            </div>
          </div>
        </div>

        {/* Realistic Interactive Dashboard Preview (Reference Screenshot 4) */}
        <div className="mt-12 w-full max-w-5xl bg-[#111717] border border-[#252F2D] rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#252F2D] mb-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-xs font-mono text-[#94A3B8] ml-2 font-bold">
                node-1@oursell-pos-v3.2 • Live Terminal Preview
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>ONLINE • SYNC BUFFER 0</span>
            </div>
          </div>

          {/* Grid Layout inside Dashboard Preview */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Real-time Sales Chart Card */}
            <div className="lg:col-span-2 bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#94A3B8] uppercase font-mono font-semibold">
                    Today&apos;s Store Revenue
                  </span>
                  <div className="text-3xl font-black text-[#F8FAFC] font-mono mt-0.5">
                    ₹87,640.00
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +18.4% vs Yesterday
                  </span>
                  <span className="text-[10px] text-[#94A3B8] block font-mono mt-1">
                    128 Invoices Settled
                  </span>
                </div>
              </div>

              {/* Realistic SVG Metric Trendline */}
              <div className="h-36 w-full pt-4">
                <svg viewBox="0 0 500 120" className="w-full h-full stroke-[#10B981] fill-none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,90 Q 60,80 120,60 T 240,40 T 360,25 T 500,10 L 500,120 L 0,120 Z"
                    fill="url(#chartGrad)"
                    stroke="none"
                  />
                  <path
                    d="M 0,90 Q 60,80 120,60 T 240,40 T 360,25 T 500,10"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="500" cy="10" r="4" fill="#C4F12A" />
                </svg>
              </div>
            </div>

            {/* Live Transaction Stream Card */}
            <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#252F2D]">
                  <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                    Live Invoice Stream
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981]">AUTO-SYNC</span>
                </div>
                <div className="divide-y divide-[#252F2D]/60 text-xs font-mono mt-2 space-y-2">
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[#F8FAFC] font-bold block">Invoice #5904</span>
                      <span className="text-[10px] text-[#94A3B8]">Potato Chips, Mineral Water</span>
                    </div>
                    <span className="font-bold text-[#10B981]">₹95.00</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[#F8FAFC] font-bold block">Invoice #5903</span>
                      <span className="text-[10px] text-[#94A3B8]">Sourdough Bread, Fresh Milk</span>
                    </div>
                    <span className="font-bold text-[#10B981]">₹180.00</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="text-[#F8FAFC] font-bold block">Invoice #5902</span>
                      <span className="text-[10px] text-[#94A3B8]">Dark Chocolate Bar x2</span>
                    </div>
                    <span className="font-bold text-[#10B981]">₹198.00</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login"
                className="w-full mt-4 py-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] font-bold text-xs rounded-xl border border-[#10B981]/30 text-center transition block"
              >
                Access Full Register &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLATFORM CORE FEATURES */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
            Engineered for Modern Retail
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mt-2">
            Everything your store needs to scale.
          </h2>
          <p className="text-sm text-[#94A3B8] mt-3">
            Built from the ground up for high-volume retail chains, supermarkets, and boutiques.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">0.3s Barcode Checkout</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Instant hardware barcode reader integration with audio feedback and rapid cart calculation. Never keep customers waiting in line.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-[#C4F12A]/10 text-[#C4F12A] flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">100% Offline-First Engine</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Internet cuts? Your register keeps billing without missing a beat. Orders are saved safely in IndexedDB and sync seamlessly when reconnected.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">Multi-Store Tenancy</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Manage one flagship or a 50-store chain from a single interface. Isolated database tenancies ensure data security and zero cross-store leaks.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Barcode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">Built-In Barcode Studio</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Generate scannable EAN-13, EAN-8, UPC-A, and Code 128 barcodes directly for your items. Print thermal labels or standard A4 sheets with 1-click.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">80mm Thermal Receipt Layout</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Clean receipt printing with store header, cashier ID, itemized taxes, and QR code verification formatted for standard thermal POS printers.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] hover:border-[#10B981]/50 rounded-2xl p-6 space-y-3 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[#F8FAFC]">Trilingual English, മലയാളം & العربية</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Instant UI language switching across English, Malayalam, and Arabic with native Right-to-Left (RTL) mirroring and cultural font support.
            </p>
          </div>
        </div>
      </section>

      {/* 4. ROI & FINANCIAL IMPACT (Navigated via ROI in top bar) */}
      <section id="roi" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold text-[#00c957] uppercase tracking-wider">
            Measurable Return on Investment
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mt-2">
            Accelerate Cash Flow & Eliminate Downtime.
          </h2>
          <p className="text-sm text-[#94A3B8] mt-3">
            Every minute saved at the checkout counter and every recovered offline transaction converts directly to bottom-line profitability.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#0b0f0e] border border-[#1f2824] rounded-2xl p-6 space-y-2 hover:border-[#00c957]/40 transition">
            <span className="text-3xl font-black text-[#00c957] font-mono">0.3s</span>
            <h4 className="font-bold text-white text-base">Rapid Checkout Speed</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Eliminates counter queue congestion during rush hours with instant optical scanner recognition.
            </p>
          </div>

          <div className="bg-[#0b0f0e] border border-[#1f2824] rounded-2xl p-6 space-y-2 hover:border-[#00c957]/40 transition">
            <span className="text-3xl font-black text-[#00c957] font-mono">100%</span>
            <h4 className="font-bold text-white text-base">Offline Engine SLA</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Operate through broadband and power drops with local IndexedDB cache. Zero missed invoices.
            </p>
          </div>

          <div className="bg-[#0b0f0e] border border-[#1f2824] rounded-2xl p-6 space-y-2 hover:border-[#00c957]/40 transition">
            <span className="text-3xl font-black text-[#00c957] font-mono">+18.4%</span>
            <h4 className="font-bold text-white text-base">Revenue Velocity</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Instant customer credit Khata and WhatsApp invoice links boost repeat purchase cycles.
            </p>
          </div>

          <div className="bg-[#0b0f0e] border border-[#1f2824] rounded-2xl p-6 space-y-2 hover:border-[#00c957]/40 transition">
            <span className="text-3xl font-black text-[#00c957] font-mono">₹0</span>
            <h4 className="font-bold text-white text-base">Hardware Lock-In</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Runs in standard browsers across existing laptops, tablets, or phones with standard thermal printers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. RETAIL MANAGEMENT SOLUTIONS */}
      <section id="solutions" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D] bg-[#111717]/50 rounded-3xl my-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold text-[#C4F12A] uppercase tracking-wider">
            Tailored Industry Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mt-2">
            Built for your specific vertical.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-2.5">
            <span className="text-xs font-mono font-bold text-[#10B981]">01 / GROCERY & SUPERMARKETS</span>
            <h4 className="font-bold text-[#F8FAFC] text-base">Supermarkets & Marts</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Fast barcode scanning, scale integration, bulk category imports, and automated low-stock warnings.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-2.5">
            <span className="text-xs font-mono font-bold text-[#10B981]">02 / APPAREL & BOUTIQUES</span>
            <h4 className="font-bold text-[#F8FAFC] text-base">Fashion & Apparel</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Multi-variant matrices for Size, Color, and Material with individual variant barcodes and inventory tracking.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-2.5">
            <span className="text-xs font-mono font-bold text-[#10B981]">03 / DINING & TAKEAWAY</span>
            <h4 className="font-bold text-[#F8FAFC] text-base">Restaurants & Cafés</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Fast order line, held parked carts, kitchen order routing, and instant split payment calculations.
            </p>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-2.5">
            <span className="text-xs font-mono font-bold text-[#10B981]">04 / HARDWARE & ELECTRONICS</span>
            <h4 className="font-bold text-[#F8FAFC] text-base">Electronics & Mobile</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Serial number tracking, customer credit ledger (Khata), warranty receipt generation, and supplier purchase orders.
            </p>
          </div>
        </div>
      </section>

      {/* 5. BILLING & POS SHOWCASE */}
      <section id="billing" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-mono font-bold">
              LIGHTNING CHECKOUT
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC]">
              Frictionless billing that keeps queues moving.
            </h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              With integrated keyboard shortcuts (Space to Pay, F1 to Search, F2 to Park Cart), optical scanner triggers, and split payment options across Cash, Card, and UPI, Oursell reduces transaction time by 70%.
            </p>

            <ul className="space-y-3 text-xs text-[#F8FAFC] font-semibold">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Automatic GST & tax breakdown per invoice item</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Park and recall customer carts for busy counter rushes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Customer loyalty points and store credit ledger (Khata)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>Shift cash float tracking with automatic variance calculation</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#151D1C] border border-[#252F2D] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#252F2D]">
              <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                Cart Settlement Demo
              </span>
              <span className="text-xs text-[#10B981] font-mono font-bold">SHIFT #01 ACTIVE</span>
            </div>

            <div className="py-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Potato Chips Masala 50g (x2)</span>
                <span className="text-[#F8FAFC]">₹40.00</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Natural Mineral Water 1L (x1)</span>
                <span className="text-[#F8FAFC]">₹20.00</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Single Origin Dark Chocolate (x1)</span>
                <span className="text-[#F8FAFC]">₹99.00</span>
              </div>
              <div className="pt-3 border-t border-[#252F2D] flex justify-between font-bold text-sm text-[#F8FAFC]">
                <span>Grand Total (Taxes incl.)</span>
                <span className="text-[#C4F12A]">₹159.00</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-bold">
              <div className="p-2.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-[#F8FAFC]">
                Cash
              </div>
              <div className="p-2.5 bg-[#10B981]/20 border border-[#10B981] rounded-xl text-[#10B981]">
                Card / POS
              </div>
              <div className="p-2.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-[#F8FAFC]">
                UPI QR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BARCODE STUDIO SHOWCASE */}
      <section id="barcodes" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="bg-[#111717] border border-[#252F2D] rounded-3xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
                Integrated Hardware Studio
              </span>
              <h2 className="text-3xl font-black text-[#F8FAFC]">
                Oursell Barcode Studio Module
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                Generate real, scannable barcodes in multiple international formats: EAN-13, EAN-8, UPC-A, Code 128, Code 39, and QR Code. Print stickers in thermal roll formats (50x25mm, 38x25mm, 60x40mm) or multi-label A4 sheets.
              </p>
            </div>

            {/* Barcode Sticker Preview Graphic */}
            <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-6 text-center space-y-3 font-mono">
              <span className="text-[10px] text-[#94A3B8] block uppercase">Sample 50x25mm Label</span>
              <div className="bg-white p-4 rounded-xl text-slate-900 inline-block shadow-lg">
                <div className="text-[11px] font-bold truncate max-w-[200px]">Artisan Potato Crisps 50g</div>
                {/* Real Scannable EAN-13 Barcode */}
                <div className="my-1.5 flex items-center justify-center">
                  <BarcodeRenderer
                    type="EAN13"
                    value="8902000000016"
                    width={1.2}
                    height={36}
                    displayValue={true}
                    fontSize={10}
                  />
                </div>
                <div className="text-xs font-black text-slate-950 mt-1">₹25.00</div>
              </div>
              <span className="text-[11px] text-[#10B981] block font-sans font-bold">
                ✓ 100% Optical Scanner Certified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING PLANS (Exact Match to Reference Design) */}
      <section id="pricing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative">
        {/* Ambient Emerald Glow Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-[#00e599]/5 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#00e599]/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#00e599]/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] text-[11px] font-mono font-bold tracking-widest uppercase shadow-sm">
            <span>OUR PRICING PLANS</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mt-5 tracking-tight">
            Our <span className="text-[#00e599]">pricing plans</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 mt-3.5 max-w-xl mx-auto leading-relaxed">
            Designed for every stage of your journey. Start today, no credit card required.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 inline-flex items-center p-1 bg-[#0c1412] border border-[#1e2a26] rounded-full shadow-lg">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                billingCycle === 'MONTHLY'
                  ? 'bg-[#00e599] text-slate-950 font-black shadow-md shadow-[#00e599]/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                billingCycle === 'ANNUAL'
                  ? 'bg-[#00e599] text-slate-950 font-black shadow-md shadow-[#00e599]/30'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Annual Billing
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-stretch">
          {pricingPlans.map((plan) => {
            const isPro = plan.id === 'professional' || plan.name?.toLowerCase().includes('pro');
            const displayPrice = billingCycle === 'ANNUAL' ? (plan.annualPrice || 0) : plan.monthlyPrice;
            const periodLabel = billingCycle === 'ANNUAL' ? '/ month' : '/ month';

            return (
              <div
                key={plan.id}
                className={`rounded-[28px] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isPro
                    ? 'bg-[#0e1614] border-2 border-[#00e599] shadow-[0_0_50px_rgba(0,229,153,0.18)] hover:-translate-y-1'
                    : 'bg-[#101715] border border-[#1e2a26] hover:border-[#2b3c37] hover:-translate-y-1 shadow-xl'
                }`}
              >
                {/* MOST POPULAR Badge */}
                {isPro && (
                  <span className="absolute -top-3.5 right-8 bg-[#00e599] text-slate-950 font-black text-[10px] tracking-wider uppercase px-3.5 py-1 rounded-full shadow-md shadow-[#00e599]/30">
                    MOST POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  {/* Plan Name */}
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {plan.id === 'starter' && !plan.name.toLowerCase().includes('plan')
                      ? `${plan.name} Plan`
                      : plan.name}
                  </h3>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs sm:text-sm text-neutral-400 font-sans">
                        {periodLabel}
                      </span>
                    </div>
                    {billingCycle === 'ANNUAL' && plan.annualPrice > 0 && (
                      <span className="text-[11px] font-mono text-[#00e599] block mt-1">
                        Billed annually (₹{plan.annualPrice.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>

                  {/* Plan Description */}
                  <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>

                  {/* Button: Contact Us → */}
                  <div className="pt-2">
                    <a
                      href="https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox?compose=GTvVlcSHxGmSbXfBbdtCFBqNwNrHfgTqSCHRbKLBqRRBTNJLddxFFjTmNKGrvFMZtMTqSBDNXwxnJ"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3 sm:py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                        isPro
                          ? 'bg-[#00e599] hover:bg-[#00d08a] text-slate-950 font-black shadow-lg shadow-[#00e599]/25 hover:shadow-[#00e599]/40'
                          : 'bg-[#15201d] hover:bg-[#1c2a26] text-white border border-[#263732]'
                      }`}
                    >
                      <span>Contact Us</span>
                      <span className="text-sm font-bold">→</span>
                    </a>
                  </div>

                  {/* FEATURES Checklist */}
                  <div className="pt-4 border-t border-[#1a2522] space-y-3.5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 block">
                      FEATURES
                    </span>
                    <ul className="space-y-3 text-xs text-neutral-200">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-[#00e599] flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                          </div>
                          <span className="font-semibold text-[13px] text-neutral-200">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto border-t border-[#252F2D]">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
            OURSELL RETAIL POS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mt-2 tracking-tight">
            FREQUENTLY ASKED QUESTIONS &amp; SYSTEM OVERVIEW
          </h2>
          <div className="mt-6 p-4 rounded-xl bg-[#151D1C] border border-[#252F2D] max-w-2xl mx-auto text-left flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider font-mono">
                About this document
              </p>
              <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                A quick reference to the Oursell Retail POS capabilities described in this FAQ.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {[
            {
              category: 'GENERAL OVERVIEW',
              items: [
                {
                  id: 1,
                  q: '1. What is Oursell Retail POS?',
                  a: 'Oursell Retail POS is an advanced, user-friendly point-of-sale software and hardware solution designed specifically for retail businesses. It helps you manage daily sales transactions, keep track of live inventory, manage customer relationships (CRM), and generate in-depth business reports.',
                },
                {
                  id: 2,
                  q: '2. Is Oursell POS cloud-based or on-premise?',
                  a: 'Oursell Retail POS features cloud synchronization, allowing you to access real-time sales data, inventory levels, and analytics remotely from anywhere, while ensuring uninterrupted local offline checkout capabilities during internet outages.',
                },
                {
                  id: 3,
                  q: '3. What types of retail businesses is Oursell POS suitable for?',
                  a: 'Oursell Retail POS is designed for a wide range of businesses, including apparel and fashion boutiques, electronics stores, grocery and convenience shops, pharmacies, specialty gift stores, restaurants, cafés, and multi-location retail chains. It provides flexible solutions for managing sales, inventory, billing, and daily business operations across different industries.',
                },
              ],
            },
            {
              category: 'SALES & CHECKOUT',
              items: [
                {
                  id: 4,
                  q: '4. How do I process a sale or scan items?',
                  a: 'Cashiers can quickly scan product barcodes using an integrated barcode scanner or tap/select items directly from the customizable touchscreen grid. The system instantly calculates taxes, discounts, and the grand total.',
                },
                {
                  id: 5,
                  q: '5. What payment methods does Oursell POS support?',
                  a: 'The system supports flexible payment integrations, including:',
                  bullets: [
                    'Cash (with automatic change calculation)',
                    'Credit and debit cards (via integrated card readers/terminals)',
                    'Mobile and contactless wallets (Apple Pay, Google Pay, etc.)',
                    'Split payments and store credit/gift cards',
                  ],
                },
                {
                  id: 6,
                  q: '6. How do I handle returns, exchanges, or refunds?',
                  a: 'To process a return or exchange, pull up the original transaction using the receipt barcode or customer purchase history, select the item(s) to be returned, and issue a refund or store credit with a few clicks. Manager approval can be configured for security.',
                },
              ],
            },
            {
              category: 'INVENTORY & STOCK MANAGEMENT',
              items: [
                {
                  id: 7,
                  q: '7. How does inventory tracking work?',
                  a: 'Inventory updates automatically in real-time with every completed sale, return, or stock transfer, eliminating manual counting errors and ensuring accurate stock visibility across your store.',
                },
                {
                  id: 8,
                  q: '8. Can I set up low-stock alerts?',
                  a: 'Yes. You can configure minimum stock thresholds for your products. The system will automatically notify you or generate reorder reports when items are running low, preventing unexpected stockouts.',
                },
                {
                  id: 9,
                  q: '9. Can I import my existing product catalog in bulk?',
                  a: 'Yes, Oursell POS allows you to bulk-import your inventory list, product variants (size, color, material), pricing tiers, and barcodes using CSV or Excel templates.',
                },
              ],
            },
          ].map((group) => (
            <div key={group.category} className="space-y-3">
              <div className="flex items-center gap-3 pt-4">
                <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider bg-[#10B981]/10 border border-[#10B981]/20 px-3.5 py-1 rounded-full">
                  {group.category}
                </span>
                <div className="h-px flex-1 bg-[#252F2D]" />
              </div>

              <div className="space-y-3">
                {group.items.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-[#151D1C] border border-[#252F2D] rounded-2xl overflow-hidden hover:border-[#10B981]/30 transition"
                  >
                    <button
                      onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                      className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-[#F8FAFC] gap-4"
                    >
                      <span className="leading-snug">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#10B981] shrink-0 transition-transform duration-200 ${
                          activeFaq === faq.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {activeFaq === faq.id && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-[#94A3B8] leading-relaxed border-t border-[#252F2D]/50 pt-3">
                        <p>{faq.a}</p>
                        {faq.bullets && (
                          <ul className="mt-3 space-y-2">
                            {faq.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-center gap-2.5 text-[#CBD5E1]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-[11px] font-mono text-[#64748B] uppercase tracking-wider">
          OURSELL RETAIL POS • FAQ &amp; SYSTEM OVERVIEW
        </div>
      </section>

      {/* 9. STORE HOURS & LOCATION SECTION (Directly inspired by Reference Screenshot 1) */}
      <section id="contact" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Info Column */}
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-full uppercase">
              VISIT US
            </span>
            <h2 className="text-3xl font-black text-[#F8FAFC]">
              Store Hours & Location
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Drop in during our working hours or navigate directly using Google Maps.
            </p>

            <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono font-semibold text-[#94A3B8] uppercase block">
                    STORE ADDRESS
                  </span>
                  <span className="text-xs font-bold text-[#F8FAFC] block">
                    Main Street, Central Commercial District
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono font-semibold text-[#94A3B8] uppercase block">
                    PHONE NUMBER
                  </span>
                  <span className="text-xs font-bold text-[#F8FAFC] block font-mono">
                    +91 81290 31950
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-bold text-xs rounded-xl text-center transition"
                >
                  Directions on Maps
                </a>
                <a
                  href="tel:+918129031950"
                  className="px-4 py-2 bg-[#080B0B] hover:bg-[#111717] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#252F2D] font-bold text-xs rounded-xl text-center transition"
                >
                  Call Store
                </a>
              </div>
            </div>
          </div>

          {/* Right Weekly Schedule Card (Exact match to Reference Screenshot 1) */}
          <div className="lg:col-span-2 bg-[#151D1C] border border-[#252F2D] rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#252F2D]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#10B981]" />
                <h3 className="font-bold text-base text-[#F8FAFC]">Weekly Schedule</h3>
              </div>
              <span className="text-[11px] text-[#94A3B8]">
                Open all days including national holidays.
              </span>
            </div>

            <div className="divide-y divide-[#252F2D]/60 text-xs font-mono">
              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Monday</span>
                <span className="text-[#F8FAFC] font-semibold">08:00 AM - 10:00 PM</span>
              </div>
              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Tuesday</span>
                <span className="text-[#F8FAFC] font-semibold">08:00 AM - 10:00 PM</span>
              </div>
              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Wednesday</span>
                <span className="text-[#F8FAFC] font-semibold">08:00 AM - 10:00 PM</span>
              </div>
              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Thursday</span>
                <span className="text-[#F8FAFC] font-semibold">08:00 AM - 10:00 PM</span>
              </div>

              {/* Friday Highlighted Row with TODAY badge */}
              <div className="py-3 px-3 bg-[#10B981]/10 rounded-xl border border-[#10B981]/30 flex items-center justify-between font-bold my-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#10B981]">Friday</span>
                  <span className="bg-[#10B981] text-slate-950 text-[10px] uppercase px-2 py-0.5 rounded-full font-black">
                    TODAY
                  </span>
                </div>
                <span className="text-[#F8FAFC]">08:00 AM - 10:00 PM</span>
              </div>

              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Saturday</span>
                <span className="text-[#F8FAFC] font-semibold">08:00 AM - 10:30 PM</span>
              </div>
              <div className="py-3 flex items-center justify-between text-[#94A3B8]">
                <span>Sunday</span>
                <span className="text-[#F8FAFC] font-semibold">08:30 AM - 10:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CONNECT TO STORE NODE MODAL */}
      <StoreDiscoveryModal
        isOpen={isStoreNodeModalOpen}
        onClose={() => setIsStoreNodeModalOpen(false)}
      />

      {/* 11. REGISTER CONNECTION MODAL (Exact match to Reference Screenshot 2) */}
      <RegisterConnectionModal
        isOpen={isRegisterConnectionOpen}
        onClose={() => setIsRegisterConnectionOpen(false)}
      />

      {/* 12. PLAN CONTACT & ENQUIRY MODAL (Directly triggered by Contact Us buttons) */}
      <PlanContactModal
        isOpen={isPlanContactModalOpen}
        onClose={() => setIsPlanContactModalOpen(false)}
        plan={selectedContactPlan}
        billingCycle={billingCycle}
        displayPrice={
          selectedContactPlan
            ? billingCycle === 'ANNUAL'
              ? (selectedContactPlan.annualPrice || 0)
              : selectedContactPlan.monthlyPrice
            : 0
        }
      />

      {/* 11. PROFESSIONAL FOOTER */}
      <footer className="bg-[#080B0B] border-t border-[#252F2D] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#10B981] text-slate-950 font-black flex items-center justify-center text-sm">
                O
              </div>
              <span className="font-black text-sm text-[#F8FAFC]">OURSELL POS</span>
            </div>
            <p className="text-[#94A3B8] leading-relaxed">
              Unified platform for multi-store retail billing, inventory intelligence, and business operations.
            </p>
          </div>

          <div>
            <span className="font-bold text-[#F8FAFC] uppercase tracking-wider font-mono block mb-3">
              Solutions
            </span>
            <ul className="space-y-2 text-[#94A3B8]">
              <li><a href="#solutions" className="hover:text-[#F8FAFC]">Grocery & Supermarkets</a></li>
              <li><a href="#solutions" className="hover:text-[#F8FAFC]">Apparel & Boutiques</a></li>
              <li><a href="#solutions" className="hover:text-[#F8FAFC]">Restaurants & Cafés</a></li>
              <li><a href="#solutions" className="hover:text-[#F8FAFC]">Electronics & Hardware</a></li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-[#F8FAFC] uppercase tracking-wider font-mono block mb-3">
              Platform
            </span>
            <ul className="space-y-2 text-[#94A3B8]">
              <li><Link href="/login" className="hover:text-[#F8FAFC]">Store Login</Link></li>
              <li><Link href="/register-brand" className="hover:text-[#F8FAFC]">Brand Registration</Link></li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-[#F8FAFC] uppercase tracking-wider font-mono block mb-3">
              Language & Locale
            </span>
            <div className="flex flex-col gap-1.5 text-[#94A3B8]">
              <button onClick={() => setLang('en')} className={`text-left hover:text-[#F8FAFC] ${lang === 'en' ? 'text-[#10B981] font-bold' : ''}`}>English (Global)</button>
              <button onClick={() => setLang('ml')} className={`text-left hover:text-[#F8FAFC] ${lang === 'ml' ? 'text-[#10B981] font-bold' : ''}`}>മലയാളം (Kerala)</button>
              <button onClick={() => setLang('ar')} className={`text-left hover:text-[#F8FAFC] ${lang === 'ar' ? 'text-[#10B981] font-bold' : ''}`}>العربية (Middle East RTL)</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#252F2D] flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8]/60 gap-4">
          <div>© {new Date().getFullYear()} OURSELL Retail Technologies Inc. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#terms" className="hover:underline">Privacy Policy</a>
            <a href="#privacy" className="hover:underline">Terms of Service</a>
            <a href="#security" className="hover:underline">Security Architecture</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
