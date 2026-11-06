'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Store,
  ChevronDown,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Multi-Language State (English, Malayalam, Arabic)
  const [lang, setLang] = useState<'en' | 'ml' | 'ar'>('en');

  // Connect Store Node Modal State (Reference Screenshot 2)
  const [isStoreNodeModalOpen, setIsStoreNodeModalOpen] = useState(false);
  const [storeSlugInput, setStoreSlugInput] = useState('');

  // Interactive FAQ State
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

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
      locateShop: 'Connect Store Node',
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

  const handleConnectStoreNode = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = storeSlugInput.trim().toLowerCase();
    if (slug) {
      setIsStoreNodeModalOpen(false);
      router.push(`/shop/${slug}`);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#080B0B] text-[#F8FAFC] font-sans selection:bg-[#10B981] selection:text-slate-950 overflow-x-hidden"
    >
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#080B0B]/90 backdrop-blur-md border-b border-[#252F2D] px-6 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#C4F12A] flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-[#10B981]/20 group-hover:scale-105 transition">
              O
            </div>
            <div>
              <span className="font-black text-lg tracking-wider text-[#F8FAFC] block leading-tight">
                OURSELL
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#10B981] uppercase block font-bold">
                RETAIL OS v3.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-[#94A3B8]">
          <a href="#features" className="hover:text-[#F8FAFC] transition">
            {t.features}
          </a>
          <a href="#solutions" className="hover:text-[#F8FAFC] transition">
            {t.solutions}
          </a>
          <a href="#billing" className="hover:text-[#F8FAFC] transition">
            POS Billing
          </a>
          <a href="#barcodes" className="hover:text-[#F8FAFC] transition">
            Barcode Studio
          </a>
          <a href="#pricing" className="hover:text-[#F8FAFC] transition">
            {t.pricing}
          </a>
          <a href="#contact" className="hover:text-[#F8FAFC] transition">
            {t.contact}
          </a>
        </nav>

        {/* Right Section: Language Picker, Connect Node & Login */}
        <div className="flex items-center gap-3">
          {/* Language Selector Pill */}
          <div className="flex items-center bg-[#151D1C] border border-[#252F2D] rounded-xl p-1 text-xs">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
                lang === 'en' ? 'bg-[#10B981] text-slate-950 shadow' : 'text-[#94A3B8]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ml')}
              className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
                lang === 'ml' ? 'bg-[#10B981] text-slate-950 shadow' : 'text-[#94A3B8]'
              }`}
            >
              മലയാളം
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
                lang === 'ar' ? 'bg-[#10B981] text-slate-950 shadow' : 'text-[#94A3B8]'
              }`}
            >
              العربية
            </button>
          </div>

          {/* Connect to Store Node Button (Reference Screenshot 2) */}
          <button
            onClick={() => setIsStoreNodeModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151D1C] hover:bg-[#1f2a29] text-[#F8FAFC] text-xs font-semibold border border-[#252F2D] transition"
          >
            <Search className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{t.locateShop}</span>
          </button>

          {/* Login Button */}
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-[#151D1C] hover:bg-[#1f2a29] text-[#F8FAFC] text-xs font-bold border border-[#252F2D] transition"
          >
            {t.login}
          </Link>

          {/* Get Started Button */}
          <Link
            href="/register-brand"
            className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 text-xs font-black shadow-md shadow-[#10B981]/20 transition flex items-center gap-1.5"
          >
            <span>{t.getStarted}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

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
          <a
            href="#features"
            className="px-6 py-3.5 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-black shadow-xl shadow-[#10B981]/20 transition flex items-center gap-2"
          >
            <span>{t.ctaPrimary}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-[#151D1C] hover:bg-[#1f2a29] text-[#F8FAFC] border border-[#252F2D] transition flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#10B981]" />
            <span>{t.ctaSecondary}</span>
          </Link>
          <button
            onClick={() => setIsStoreNodeModalOpen(true)}
            className="px-6 py-3.5 rounded-xl bg-[#080B0B] hover:bg-[#111717] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#252F2D] transition flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-[#C4F12A]" />
            <span>Connect Demo Node</span>
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

            <div className="pt-2">
              <Link
                href="/shop/oursell/pos"
                className="px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-[#10B981]/20 transition"
              >
                <span>Launch Interactive POS Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
              <div className="pt-2">
                <Link
                  href="/shop/oursell/barcodes"
                  className="px-5 py-2.5 rounded-xl bg-[#151D1C] hover:bg-[#1f2a29] text-[#F8FAFC] border border-[#252F2D] font-bold text-xs inline-flex items-center gap-2 transition"
                >
                  <Barcode className="w-4 h-4 text-[#10B981]" />
                  <span>Open Barcode Studio Workspace</span>
                </Link>
              </div>
            </div>

            {/* Barcode Sticker Preview Graphic */}
            <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-6 text-center space-y-3 font-mono">
              <span className="text-[10px] text-[#94A3B8] block uppercase">Sample 50x25mm Label</span>
              <div className="bg-white p-4 rounded-xl text-slate-900 inline-block shadow-lg">
                <div className="text-[11px] font-bold truncate max-w-[200px]">Artisan Potato Crisps 50g</div>
                {/* Visual Barcode Lines */}
                <div className="flex items-center justify-center gap-0.5 h-12 my-1 px-4">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-black h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
                <div className="text-[10px] tracking-widest font-bold">8 902000 000001</div>
                <div className="text-xs font-black text-slate-950 mt-1">₹25.00</div>
              </div>
              <span className="text-[11px] text-[#10B981] block font-sans font-bold">
                ✓ 100% Optical Scanner Certified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING PLANS */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#252F2D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mt-2">
            Predictable plans for ambitious businesses.
          </h2>
          <p className="text-sm text-[#94A3B8] mt-3">
            No hidden transaction fees. Offline engine included in all tiers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-xs font-mono text-[#94A3B8] font-bold">STARTER STORE</span>
              <div className="text-3xl font-black text-[#F8FAFC] font-mono mt-2">
                ₹999<span className="text-xs text-[#94A3B8] font-sans font-normal"> / month</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">
                For single stores, boutiques and small kiosks.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-[#F8FAFC]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>1 Store Outlet • 2 Terminals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Full POS Register & Offline Billing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Barcode Studio & 80mm Receipts</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Up to 1,000 Catalog Products</span>
              </li>
            </ul>
            <Link
              href="/register-brand"
              className="w-full py-2.5 bg-[#080B0B] hover:bg-[#111717] text-[#F8FAFC] border border-[#252F2D] font-bold text-xs rounded-xl block text-center transition"
            >
              Choose Starter
            </Link>
          </div>

          {/* Professional Plan (Highlighted) */}
          <div className="bg-[#151D1C] border-2 border-[#10B981] rounded-2xl p-6 space-y-6 relative shadow-xl shadow-[#10B981]/10">
            <span className="absolute -top-3 right-6 bg-[#10B981] text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
              MOST POPULAR
            </span>
            <div>
              <span className="text-xs font-mono text-[#10B981] font-bold">PROFESSIONAL</span>
              <div className="text-3xl font-black text-[#F8FAFC] font-mono mt-2">
                ₹2,499<span className="text-xs text-[#94A3B8] font-sans font-normal"> / month</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">
                For busy supermarkets, restaurants and multi-counter outlets.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-[#F8FAFC]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Up to 3 Outlets • 6 Terminals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Customer Khata & Credit Ledger</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Purchase Orders & Supplier Module</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Unlimited Catalog Products</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>English, Malayalam & Arabic Support</span>
              </li>
            </ul>
            <Link
              href="/register-brand"
              className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-black text-xs rounded-xl block text-center transition shadow-md shadow-[#10B981]/20"
            >
              Start Professional
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-xs font-mono text-[#C4F12A] font-bold">MULTI-CHAIN ENTERPRISE</span>
              <div className="text-3xl font-black text-[#F8FAFC] font-mono mt-2">
                ₹4,999<span className="text-xs text-[#94A3B8] font-sans font-normal"> / month</span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-2">
                For retail chains, franchises, and regional networks.
              </p>
            </div>
            <ul className="space-y-2.5 text-xs text-[#F8FAFC]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Unlimited Outlets & Terminals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Centralized Fleet Management</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Dedicated DB Isolation & Custom Domain</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>24/7 Priority SLA & On-Prem Support</span>
              </li>
            </ul>
            <Link
              href="/register-brand"
              className="w-full py-2.5 bg-[#080B0B] hover:bg-[#111717] text-[#F8FAFC] border border-[#252F2D] font-bold text-xs rounded-xl block text-center transition"
            >
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-[#252F2D]">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-[#F8FAFC] mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Can Oursell run completely offline without internet?',
              a: 'Yes! Oursell uses a localized IndexedDB database engine inside your browser. You can scan barcodes, ring up sales, print thermal receipts, and adjust inventory with zero internet. Once connectivity resumes, it synchronizes securely with the cloud.',
            },
            {
              q: 'Which barcode scanners and receipt printers are supported?',
              a: 'All standard USB and Bluetooth HID barcode scanners are natively supported without drivers. For receipts, any 80mm or 58mm ESC/POS thermal printer is fully compatible.',
            },
            {
              q: 'How does multi-store isolation work?',
              a: 'Each business operates in its own tenant namespace. Records for products, inventory, customers, and staff are strictly partitioned by store ID.',
            },
            {
              q: 'Can staff access store settings or profit reports?',
              a: 'No. Staff accounts are strictly role-based (STORE_STAFF) and restricted from administrative settings, profit metrics, and staff management unless explicitly granted by the store admin.',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className="bg-[#151D1C] border border-[#252F2D] rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between text-sm font-bold text-[#F8FAFC]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#10B981] transition-transform ${
                    activeFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-[#94A3B8] leading-relaxed border-t border-[#252F2D]/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
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
                    +91 98765 43210
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
                  href="tel:+919876543210"
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

      {/* 10. CONNECT TO STORE NODE MODAL (Exact match to Reference Screenshot 2) */}
      {isStoreNodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setIsStoreNodeModalOpen(false)}
              className="absolute right-4 top-4 w-7 h-7 rounded-full bg-[#080B0B] border border-[#252F2D] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Search className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-lg font-bold text-[#F8FAFC]">Connect to Store Node</h3>
            </div>
            <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
              Enter your store&apos;s custom subdomain slug to connect your register.
            </p>

            <form onSubmit={handleConnectStoreNode} className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  value={storeSlugInput}
                  onChange={(e) => setStoreSlugInput(e.target.value)}
                  placeholder="e.g., oursell"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] font-mono text-xs transition"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                <span>Default Demo: <button type="button" onClick={() => setStoreSlugInput('oursell')} className="text-[#C4F12A] font-mono underline font-bold">oursell</button></span>
                <span>Flagship: <button type="button" onClick={() => setStoreSlugInput('centralmart')} className="text-[#10B981] font-mono underline font-bold">centralmart</button></span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-[#10B981]/20"
              >
                Open Store Workspace
              </button>
            </form>
          </div>
        </div>
      )}

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
              <li><Link href="/shop/oursell" className="hover:text-[#F8FAFC]">Demo Store Workspace</Link></li>
              <li><Link href="/shop/oursell/barcodes" className="hover:text-[#F8FAFC]">Barcode Studio</Link></li>
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
