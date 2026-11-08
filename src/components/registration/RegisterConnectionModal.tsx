'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Store,
  User,
  Mail,
  Phone,
  Check,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { db } from '@/db/posDb';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BusinessCategory, BrandApplication } from '@/types/pos';

interface RegisterConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterConnectionModal({ isOpen, onClose }: RegisterConnectionModalProps) {
  const router = useRouter();

  // Form State matching Screenshot 2
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Supermarket');
  const [legalName, setLegalName] = useState('');
  const [gstin, setGstin] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [outlets, setOutlets] = useState<number>(1);
  const [terminals, setTerminals] = useState<number>(2);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: BusinessCategory[] = [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!brandName.trim()) {
      setErrorMsg('Store / Brand Name is required.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Owner Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid official email is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Mobile number is required.');
      return;
    }
    if (!username.trim()) {
      setErrorMsg('Requested username is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedBrand = brandName.trim();
      const trimmedOwner = ownerName.trim();
      const trimmedPhone = phone.trim();
      const trimmedLegal = legalName.trim() || trimmedBrand;
      const trimmedGstin = gstin.trim();

      // Check if username is already taken
      const existingApp = await db.brand_applications
        .where('requestedUsername')
        .equalsIgnoreCase(trimmedUser)
        .first();

      const existingBrand = await db.brands
        .where('username')
        .equalsIgnoreCase(trimmedUser)
        .first();

      if (existingApp || existingBrand) {
        setErrorMsg('This username is already taken. Please choose another username.');
        setIsSubmitting(false);
        return;
      }

      const appId = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
      const application: BrandApplication = {
        id: appId,
        brandName: trimmedBrand,
        legalName: trimmedLegal,
        businessCategory: category,
        ownerName: trimmedOwner,
        email: trimmedEmail,
        phone: trimmedPhone,
        requestedUsername: trimmedUser,
        passwordHash: password,
        terminalCount: Number(terminals) || 1,
        outletCount: Number(outlets) || 1,
        gstin: trimmedGstin || undefined,
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
      };

      await db.brand_applications.add(application);

      // Route directly to Dev Core Inbox
      await db.support_inbox.add({
        id: `ticket-${appId}`,
        storeId: appId,
        storeName: trimmedBrand,
        senderName: trimmedOwner,
        senderEmail: trimmedEmail,
        subject: `[New Shop Registration] Activation Request: ${trimmedBrand}`,
        message:
          `New retail store onboarding request submitted via "Get Started" portal.\n\n` +
          `• Brand: ${trimmedBrand} (${category})\n` +
          `• Legal Name: ${trimmedLegal}\n` +
          `• Owner: ${trimmedOwner} (${trimmedPhone})\n` +
          `• Requested Username: ${trimmedUser}\n` +
          `• Outlets: ${Number(outlets) || 1} | POS Terminals: ${Number(terminals) || 1}\n` +
          `• GSTIN: ${trimmedGstin || 'N/A'}\n\n` +
          `Please review application in Dev Core Inbox to Activate or Reject this shop.`,
        status: 'UNREAD',
        priority: 'HIGH',
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Mirror to Supabase Cloud if online
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          await supabase.from('brand_applications').insert({
            brand_name: trimmedBrand,
            requested_username: trimmedUser,
            owner_name: trimmedOwner,
            email: trimmedEmail,
            phone: trimmedPhone || null,
            business_category: category,
            notes: `Legal: ${trimmedLegal} | Outlets: ${outlets} | Terminals: ${terminals} | GSTIN: ${trimmedGstin || 'N/A'}`,
            status: 'PENDING',
          });

          await supabase.from('support_inbox').insert({
            store_name: trimmedBrand,
            sender_email: trimmedEmail,
            subject: `[New Shop Registration] Activation Request: ${trimmedBrand}`,
            message: `New retail store onboarding request submitted for ${trimmedBrand} by ${trimmedOwner}.`,
            priority: 'HIGH',
            status: 'OPEN',
          });
        } catch (cloudErr) {
          console.warn('Could not mirror application to Supabase:', cloudErr);
        }
      }

      setIsSubmitting(false);
      setSubmittedRef(appId);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleReset = () => {
    setBrandName('');
    setCategory('Supermarket');
    setLegalName('');
    setGstin('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    setOutlets(1);
    setTerminals(2);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSubmittedRef(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0B101B] border border-[#1E293B] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button in Top Right */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-slate-800 bg-[#121929] hover:bg-[#1A2338] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header matching Screenshot 2 */}
        <div className="mb-6 pr-8">
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#00c957] block mb-1">
            BRAND ONBOARDING PORTAL
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Register Your Retail Brand
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400 mt-1 leading-relaxed">
            Fill in your company and outlet details to request an isolated Oursell workspace.
          </p>
        </div>

        {/* Confirmation Screen */}
        {submittedRef ? (
          <div className="bg-[#101726] border border-[#00c957]/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#00c957]/20 text-[#00c957] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Application Submitted to Dev Core!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your store application for <span className="text-white font-semibold">{brandName}</span>{' '}
              has been routed directly into the Dev Core administration console:
            </p>
            <div className="inline-block px-4 py-2 bg-[#080D1A] text-[#00c957] font-mono font-bold text-base rounded-xl border border-[#00c957]/40 shadow-inner">
              {submittedRef}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Platform developers can now view your application in the{' '}
              <strong className="text-slate-200">Dev Core Inbox</strong> to provision your isolated store
              workspace and terminal register.
            </p>

            <div className="pt-4 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-8 py-2.5 bg-[#00c957] hover:bg-[#00b84f] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-[#00c957]/20 cursor-pointer inline-flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form State matching Screenshot 2 */
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            {/* Anti-autofill decoy inputs */}
            <input type="text" name="decoy_reg_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
            <input type="password" name="decoy_reg_pass" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Row 1: Store / Brand Name & Business Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Store / Brand Name *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Luxe Boutique"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Business Category *
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white outline-none transition appearance-none cursor-pointer pr-10"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Legal Entity Name & GSTIN / Tax ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Legal Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxe Retail Pvt Ltd"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  GSTIN / Tax ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="E.G. 29ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition uppercase font-mono"
                />
              </div>
            </div>

            {/* Row 3: Owner Full Name, Official Email, Mobile Number (3 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Owner Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Official Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="owner@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="+91 98450 11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Outlets & Terminals (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Number of Store Outlets
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={outlets}
                  onChange={(e) => setOutlets(Number(e.target.value))}
                  className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white outline-none transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Estimated POS Terminals
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={terminals}
                  onChange={(e) => setTerminals(Number(e.target.value))}
                  className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white outline-none transition"
                />
              </div>
            </div>

            {/* Section: Account Login Credentials */}
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#00c957] block mb-2">
                ACCOUNT LOGIN CREDENTIALS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Requested Username *
                  </label>
                  <input
                    type="text"
                    required
                    name="register_store_admin_user"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="e.g. storeadmin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    name="register_store_admin_password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    name="register_store_admin_confirm"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#131B2E] border border-[#24324D] focus:border-[#00c957] rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit Application Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#00c957] hover:bg-[#00b84f] active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-[#00c957]/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Submit Application to Dev Core</span>
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
