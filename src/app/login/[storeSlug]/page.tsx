'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { db, seedInitialData } from '@/db/posDb';
import { Brand } from '@/types/pos';
import {
  ArrowLeft,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  Clock,
  Terminal,
  ArrowRight,
  Check,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function StoreLoginPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = ((params?.storeSlug as string) || 'oursell').toLowerCase();

  const { login, isLoading, loginError } = useBrandAuthStore();

  const [store, setStore] = useState<Brand | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loginIntent, setLoginIntent] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load store details
  useEffect(() => {
    if (storeSlug === 'devcore') {
      router.replace('/devcore');
      return;
    }
    seedInitialData().catch(() => {});
    loadStore();
  }, [storeSlug, router]);

  const loadStore = async () => {
    try {
      let b = await db.brands.where('brandId').equalsIgnoreCase(storeSlug).first();
      if (!b) {
        b = await db.brands.where('username').equalsIgnoreCase(storeSlug).first();
      }
      if (!b && storeSlug === 'oursell') {
        b = await db.brands.where('brandId').equals('oursell').first();
      }
      if (!b && storeSlug === 'resell') {
        b = await db.brands.where('brandId').equals('resell').first();
      }
      setStore(b || null);
    } catch (err) {
      console.warn('Error loading store metadata:', err);
    }
  };

  // Toggle Intent: Admin or Staff
  const handleToggleIntent = (intent: 'ADMIN' | 'STAFF') => {
    setLoginIntent(intent);
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setLocalError('Please enter both your Employee ID / Username and Password / PIN.');
      return;
    }

    const res = await login(trimmedUser, trimmedPass);

    if (res.success && res.redirectUrl) {
      router.push(res.redirectUrl);
    } else {
      setLocalError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const storeDisplayName =
    store?.brandName || (storeSlug === 'oursell' ? 'OURSELL DEMO STORE' : storeSlug.toUpperCase());

  return (
    <div className="min-h-screen bg-[#080B0B] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-8 font-sans select-none">
      {/* Top Header Navigation */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Portal</span>
        </Link>
        <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-full font-bold">
          TERMINAL NODE: {storeSlug.toUpperCase()}
        </span>
      </div>

      {/* Split Screen Login Container matching Reference Screenshot */}
      <div className="max-w-4xl w-full mx-auto bg-[#111717] border border-[#252F2D] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* LEFT PANEL: Emerald Green (#10B981) */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#10B981] to-[#059669] p-8 flex flex-col justify-between text-slate-950 relative overflow-hidden">
          {/* Subtle geometric background overlay */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/10 blur-2xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-black/20 text-white flex items-center justify-center backdrop-blur-xs shadow-inner">
              <Store className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                {storeDisplayName}
              </h2>
              <span className="text-[11px] font-mono tracking-widest text-emerald-100 uppercase font-black block mt-1">
                POINT OF SALE SYSTEM
              </span>
              <span className="text-[10px] font-mono text-emerald-200/90 block mt-0.5">
                v3.2.1 • Enterprise Build
              </span>
            </div>
          </div>

          {/* Bottom Shift Stats Cards */}
          <div className="relative z-10 space-y-3 mt-8">
            {/* Live Clock Card */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">
                  CURRENT TIME
                </span>
                <span className="text-lg font-black font-mono text-white tracking-widest">
                  {currentTime || '11:52:13'}
                </span>
              </div>
            </div>

            {/* Terminal Identification Card */}
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">
                  TERMINAL
                </span>
                <span className="text-sm font-black text-white tracking-wide">
                  Register #01 (Station A)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Dark Charcoal (#111717) Login Form */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-[#111717] text-[#F8FAFC]">
          <div>
            {/* Header with Title and Intent Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC]">
                  WELCOME BACK
                </h1>
                <p className="text-xs text-[#94A3B8] font-medium tracking-wide uppercase mt-0.5">
                  SIGN IN TO START YOUR SHIFT
                </p>
              </div>

              {/* ADMIN / STAFF Selector Pill matching Screenshot */}
              <div className="inline-flex items-center bg-[#1E2625] border border-[#2B3835] rounded-xl p-1 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleToggleIntent('ADMIN')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                    loginIntent === 'ADMIN'
                      ? 'bg-[#10B981] text-slate-950 shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  ADMIN
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleIntent('STAFF')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                    loginIntent === 'STAFF'
                      ? 'bg-[#10B981] text-slate-950 shadow-sm'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  STAFF
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {(localError || loginError) && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-snug">{localError || loginError}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
              {/* Anti-autofill decoy inputs to block browser credential autofill */}
              <input type="text" name="anti_autofill_login_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="anti_autofill_login_pwd" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              {/* Field 1: Employee ID or Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  EMPLOYEE ID OR EMAIL
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    name="store_staff_user_id"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Employee ID or Email"
                    className="w-full pl-10 pr-4 py-3 bg-[#1A2322] border border-[#2B3835] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] font-mono text-xs transition"
                  />
                </div>
              </div>

              {/* Field 2: Password / Access PIN */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  ACCESS PIN OR PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="store_staff_pin_code"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter PIN or Password"
                    className="w-full pl-10 pr-10 py-3 bg-[#1A2322] border border-[#2B3835] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] font-mono text-xs tracking-wider transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#94A3B8] hover:text-[#F8FAFC] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot PIN */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#94A3B8] hover:text-[#F8FAFC] transition">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#1A2322] border-[#2B3835] text-[#10B981] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#10B981]"
                  />
                  <span className="font-semibold text-[11px] uppercase tracking-wide">
                    REMEMBER ME
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Please contact your Store Administrator or IT Helpdesk to reset your PIN.')}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#10B981] hover:underline"
                >
                  FORGOT PIN?
                </button>
              </div>

              {/* Big CTA Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 bg-[#10B981] hover:bg-[#0ea371] active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>AUTHENTICATING TERMINAL...</span>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className="pt-6 text-center text-[10px] font-mono text-[#94A3B8]/50">
            OURSELL RETAIL OS © {new Date().getFullYear()} • SECURE MULTI-TENANT ARCHITECTURE
          </div>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-2" />
    </div>
  );
}
