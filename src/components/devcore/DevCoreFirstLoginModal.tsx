'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, Loader2, KeyRound, X } from 'lucide-react';

export function DevCoreFirstLoginModal() {
  const { currentUser, isFirstLoginModalOpen, closeFirstLoginModal, changePassword, setActionNotice } =
    useDevCoreStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isFirstLoginModalOpen || !currentUser) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError('Please enter your initial temporary password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be identical to the initial password.');
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setActionNotice({
        message: 'Permanent password established successfully.',
        type: 'success',
      });
    } else {
      setError(res.error || 'Failed to update password. Please check your current password.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={closeFirstLoginModal}
    >
      <div
        className="bg-[#111717] border-2 border-[#10B981]/50 rounded-[28px] max-w-md w-full p-7 md:p-8 shadow-2xl relative text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (X) Button */}
        <button
          type="button"
          onClick={closeFirstLoginModal}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#182321] text-[#8E9B9A] hover:text-white flex items-center justify-center border border-[#232D2B] hover:border-[#384744] transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center border border-[#10B981]/30 shrink-0">
            <KeyRound className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#10B981] uppercase block">
              SECURITY COMPLIANCE
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              Mandatory Password Change
            </h2>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed mb-5">
          Welcome to <strong className="text-white">OURSELL Dev Core Control Centre</strong>. Because this is your initial login, security policy recommends setting a new permanent password.
        </p>

        {error && (
          <div className="mb-4 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5 text-xs">
          {/* Anti-autofill decoy inputs */}
          <input type="text" name="decoy_first_login_u" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
          <input type="password" name="decoy_first_login_p" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
              Current Initial Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#637270]" />
              <input
                type="password"
                name="devcore_curr_pass"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter initial password"
                className="w-full pl-10 pr-4 py-2.5 bg-[#080B0B] border border-[#232D2B] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-xl text-[#F8FAFC] placeholder-[#4B5755] font-mono text-xs outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
              New Permanent Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#637270]" />
              <input
                type="password"
                name="devcore_new_permanent_pass"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-[#080B0B] border border-[#232D2B] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-xl text-[#F8FAFC] placeholder-[#4B5755] font-mono text-xs outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#637270]" />
              <input
                type="password"
                name="devcore_new_permanent_confirm"
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-10 pr-4 py-2.5 bg-[#080B0B] border border-[#232D2B] focus:border-[#C4F12A] focus:ring-1 focus:ring-[#C4F12A] rounded-xl text-[#F8FAFC] placeholder-[#4B5755] font-mono text-xs outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#C4F12A] hover:bg-[#b0dc1e] active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#C4F12A]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SECURING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>SAVE NEW PASSWORD & ENTER CONSOLE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={closeFirstLoginModal}
              className="w-full py-2.5 bg-[#151D1C] hover:bg-[#1E2826] text-[#8E9B9A] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Skip for Now (Remind Me Later)
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#8E9B9A]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Passwords are encrypted using SHA-256 salted hashes.</span>
        </div>
      </div>
    </div>
  );
}
