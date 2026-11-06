'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import {
  ArrowLeft,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  UserCheck,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, loginError } = useBrandAuthStore();
  const devCoreLogin = useDevCoreStore((s) => s.login);

  const [username, setUsername] = useState('oursell@admin');
  const [password, setPassword] = useState('6001');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setLocalError('Please enter your username/email and password.');
      return;
    }

    // 1. Check Platform Developer credentials
    if (
      (trimmedUser === 'ourselldev' && trimmedPass === 'oursell@6001') ||
      (trimmedUser === 'devcore' && trimmedPass === 'devcore@admin2026')
    ) {
      const devOk = devCoreLogin(trimmedUser, trimmedPass);
      if (devOk) {
        router.push('/devcore');
        return;
      }
    }

    // 2. Perform authenticated backend login
    const res = await login(username, password);
    if (res.success && res.redirectUrl) {
      router.push(res.redirectUrl);
    } else {
      setLocalError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleFillDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-[#080B0B] text-[#F8FAFC] flex flex-col justify-between py-10 px-4 font-sans select-none">
      <div className="max-w-md w-full mx-auto">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
          <span className="text-[11px] font-mono font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2.5 py-0.5 rounded-full">
            RETAIL OS v3.0
          </span>
        </div>

        {/* Login Container Card */}
        <div className="bg-[#151D1C] border border-[#252F2D] rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#C4F12A] text-slate-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-[#10B981]/20 mb-3">
              O
            </div>
            <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
              Log In to Your Store
            </h1>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              Enter your authorized credentials to access your retail workspace.
            </p>
          </div>

          {(localError || loginError) && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{localError || loginError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Username / Email Field */}
            <div>
              <label className="block font-semibold text-[#F8FAFC] mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., oursell@admin or oursell@staff"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] font-mono text-xs transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-[#F8FAFC]">Password</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('For demo accounts, use password 6001 (Admin) or 1234 (Staff).');
                  }}
                  className="text-[11px] text-[#10B981] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] text-xs transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#F8FAFC] transition p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-[#252F2D] bg-[#080B0B] text-[#10B981] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-[11px] text-[#94A3B8]">Remember me on this terminal</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#10B981] hover:bg-[#10B981]/90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#10B981]/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Test Accounts Card */}
          <div className="p-3.5 bg-[#080B0B] border border-[#252F2D] rounded-xl text-xs space-y-2">
            <span className="font-semibold text-[#94A3B8] uppercase tracking-wider text-[10px] block">
              Quick Demo Accounts:
            </span>

            {/* Store Admin */}
            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px] bg-[#151D1C] p-2 rounded-lg border border-[#252F2D]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C4F12A]" />
                <span>
                  Admin: <strong className="text-[#F8FAFC]">oursell@admin</strong> / 6001
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFillDemo('oursell@admin', '6001')}
                className="text-[10px] bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] font-sans font-bold px-2 py-0.5 rounded transition"
              >
                Fill
              </button>
            </div>

            {/* Store Staff */}
            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px] bg-[#151D1C] p-2 rounded-lg border border-[#252F2D]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  Staff: <strong className="text-[#F8FAFC]">oursell@staff</strong> / 1234
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFillDemo('oursell@staff', '1234')}
                className="text-[10px] bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 font-sans font-bold px-2 py-0.5 rounded transition"
              >
                Fill
              </button>
            </div>

            {/* Super Admin */}
            <div className="flex items-center justify-between text-slate-300 font-mono text-[11px] bg-[#151D1C] p-2 rounded-lg border border-[#252F2D]">
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Dev: <strong className="text-[#F8FAFC]">ourselldev</strong> / oursell@6001
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleFillDemo('ourselldev', 'oursell@6001')}
                className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-sans font-bold px-2 py-0.5 rounded transition"
              >
                Fill
              </button>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-[#252F2D]">
            <p className="text-xs text-[#94A3B8]">
              New retail brand or enterprise?{' '}
              <Link href="/register-brand" className="text-[#10B981] font-semibold hover:underline">
                Register Your Store
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-[#94A3B8]/60 py-4">
        OURSELL Multi-Store Retail Platform • Enterprise Isolated Tenancies
      </footer>
    </div>
  );
}
