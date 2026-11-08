'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { ShieldCheck, Lock, User, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export function DevCoreLoginCard() {
  const { login, isLoading } = useDevCoreStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = await login(username, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication denied. Invalid credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B0B] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-8 font-sans select-none">
      {/* Top Navigation */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-[#8E9B9A] hover:text-[#F8FAFC] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Portal</span>
        </Link>
        <span className="text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 rounded-full font-bold">
          DEV CORE CONTROL CENTRE
        </span>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-[#111717] border border-[#252F2D] rounded-[28px] p-8 shadow-2xl space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#C4F12A] text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-[#10B981]/20">
            <ShieldCheck className="w-7 h-7 stroke-[2.3]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight pt-2">
            DEV CORE CONTROL CENTRE
          </h1>
          <p className="text-xs text-[#8E9B9A]">
            Platform Super-Admin authentication and root management
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
          {/* Anti-autofill decoy inputs */}
          <input type="text" name="decoy_devcore_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
          <input type="password" name="decoy_devcore_pass" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#637270]" />
              <input
                type="text"
                name="devcore_root_username"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 bg-[#080B0B] border border-[#232D2B] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-xl text-[#F8FAFC] placeholder-[#4B5755] font-mono text-xs outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#637270]" />
              <input
                type="password"
                name="devcore_root_password"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full pl-10 pr-4 py-3 bg-[#080B0B] border border-[#232D2B] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-xl text-[#F8FAFC] placeholder-[#4B5755] font-mono text-xs outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 bg-[#10B981] hover:bg-[#0ea371] active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#10B981]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AUTHENTICATING PRIVILEGES...</span>
              </>
            ) : (
              <>
                <span>SIGN IN TO DEV CORE</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#1F2927] text-center text-[11px] text-[#8E9B9A]">
          <span>Protected System Architecture • Role-based access control</span>
        </div>
      </div>

      <div className="text-center text-[10px] font-mono text-[#8E9B9A]/50">
        OURSELL DEV CORE OS © {new Date().getFullYear()} • ALL RIGHTS RESERVED
      </div>
    </div>
  );
}
