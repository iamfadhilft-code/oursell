'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/db/posDb';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BusinessCategory, BrandApplication } from '@/types/pos';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { ArrowLeft, CheckCircle2, ShieldAlert, Store, User, Mail, Phone, Lock, Building, Check, Sparkles, ShieldCheck } from 'lucide-react';

export default function RegisterBrandPage() {
  const { isAuthenticated: isDevCoreAdmin } = useDevCoreStore();
  const [isAutoActive, setIsAutoActive] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('Supermarket');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [outlets, setOutlets] = useState(1);
  const [terminals, setTerminals] = useState(2);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const categories: BusinessCategory[] = [
    'Grocery',
    'Supermarket',
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

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedUser = username.trim().toLowerCase();
      const trimmedEmail = email.trim().toLowerCase();

      // Check duplicate usernames in applications or brands
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

      // If registered while authenticated as Dev Core Admin: AUTO-ACTIVATE IMMEDIATELY!
      if (isDevCoreAdmin) {
        const res = await useDevCoreStore.getState().createActiveStore({
          brandName: brandName.trim(),
          legalName: legalName.trim() || brandName.trim(),
          businessCategory: category,
          ownerName: ownerName.trim(),
          email: trimmedEmail,
          phone: phone.trim() || '+91 9800000000',
          username: trimmedUser,
          password: password,
          pin: '1234',
          outletCount: Number(outlets) || 1,
          terminalCount: Number(terminals) || 1,
          gstin: gstin.trim() || undefined,
          businessAddress: address.trim() || undefined,
        });

        setIsSubmitting(false);
        if (res.success) {
          setSubmittedRef(res.brandId || appId);
          setIsAutoActive(true);
          return;
        } else {
          setErrorMsg(res.error || 'Registration failed');
          return;
        }
      }
      const application: BrandApplication = {
        id: appId,
        brandName: brandName.trim(),
        legalName: legalName.trim() || brandName.trim(),
        businessCategory: category,
        ownerName: ownerName.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        requestedUsername: trimmedUser,
        passwordHash: password,
        terminalCount: Number(terminals) || 1,
        outletCount: Number(outlets) || 1,
        gstin: gstin.trim() || undefined,
        businessAddress: address.trim() || undefined,
        status: 'PENDING',
        appliedAt: new Date().toISOString(),
      };

      await db.brand_applications.add(application);

      // Mirror to Supabase Cloud if online
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          await supabase.from('brand_applications').insert({
            brand_name: brandName.trim(),
            requested_username: trimmedUser,
            owner_name: ownerName.trim(),
            email: trimmedEmail,
            phone: phone.trim() || null,
            business_category: category,
            notes: `Legal: ${legalName.trim() || brandName.trim()} | Outlets: ${outlets} | Terminals: ${terminals} | GSTIN: ${gstin.trim() || 'N/A'}`,
            status: 'PENDING',
          });

          await supabase.from('support_inbox').insert({
            store_name: brandName.trim(),
            sender_email: trimmedEmail,
            subject: `[New Shop Registration] Activation Request: ${brandName.trim()}`,
            message: `New retail store onboarding request submitted for ${brandName.trim()} by ${ownerName.trim()}.`,
            priority: 'HIGH',
            status: 'OPEN',
          });
        } catch (cloudErr) {
          console.warn('Could not mirror application to Supabase:', cloudErr);
        }
      }

      // Route directly to Dev Core Inbox
      await db.support_inbox.add({
        id: `ticket-${appId}`,
        storeId: appId,
        storeName: brandName.trim(),
        senderName: ownerName.trim(),
        senderEmail: trimmedEmail,
        subject: `[New Shop Registration] Activation Request: ${brandName.trim()}`,
        message: `New retail store onboarding request submitted via "Get Started" portal.\n\n` +
          `• Brand: ${brandName.trim()} (${category})\n` +
          `• Legal Name: ${legalName.trim() || brandName.trim()}\n` +
          `• Owner: ${ownerName.trim()} (${phone.trim()})\n` +
          `• Requested Username: ${trimmedUser}\n` +
          `• Outlets: ${Number(outlets) || 1} | POS Terminals: ${Number(terminals) || 1}\n` +
          `• GSTIN: ${gstin.trim() || 'N/A'}\n` +
          `• Business Address: ${address.trim() || 'N/A'}\n\n` +
          `Please review application in Dev Core Inbox to Activate or Reject this shop.`,
        status: 'UNREAD',
        priority: 'HIGH',
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setIsSubmitting(false);
      setSubmittedRef(appId);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col justify-between py-12 px-4 selection:bg-teal-500">
      <div className="max-w-2xl w-full mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Already registered?</span>
            <Link
              href="/login-brand"
              className="text-xs font-bold text-teal-400 hover:underline"
            >
              Log Your Brand
            </Link>
          </div>
        </div>

        {/* Confirmation State */}
        {submittedRef ? (
          <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            {isAutoActive ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white">Store Created & Auto-Activated!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Because you are signed in as Dev Core Admin, this store has been <strong className="text-emerald-400 font-bold">INSTANTLY ACTIVATED</strong> in production.
                </p>
                <div className="inline-block px-4 py-2 bg-slate-800 text-emerald-400 font-mono font-black text-lg rounded-xl border border-emerald-500/40">
                  Store ID: {submittedRef}
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={`/shop/${submittedRef}`}
                    className="px-6 py-2.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Visit Store POS Workspace &rarr;</span>
                  </Link>
                  <Link
                    href="/devcore"
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-white/10 inline-flex items-center justify-center cursor-pointer"
                  >
                    Return to Dev Core Console
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-white">Sent to Dev Core Inbox!</h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your shop registration has been routed directly into the <span className="text-teal-400 font-bold">Dev Core Inbox</span> with reference:
                </p>
                <div className="inline-block px-4 py-2 bg-slate-800 text-teal-400 font-mono font-black text-lg rounded-xl border border-teal-500/40">
                  {submittedRef}
                </div>
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl text-xs font-black transition shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center"
                  >
                    Store Login &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRef(null);
                      setBrandName('');
                      setLegalName('');
                      setUsername('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition border border-white/10 inline-flex items-center justify-center cursor-pointer"
                  >
                    Register Another Shop
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Form State */
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-6">
              <span className="text-xs font-bold font-mono tracking-widest uppercase text-teal-400">
                Brand Onboarding Portal
              </span>
              <h1 className="text-2xl font-black text-white mt-1">Register Your Retail Brand</h1>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your company and outlet details to request an isolated Oursell workspace.
              </p>
            </div>

            {isDevCoreAdmin && (
              <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>
                  <strong>⚡ Dev Core Direct Mode:</strong> Because you are signed in to Dev Core, submitting this form will <strong>AUTO-ACTIVATE</strong> your store immediately without waiting for review.
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
              {/* Anti-autofill decoy inputs */}
              <input type="text" name="decoy_brand_reg_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="decoy_brand_reg_pass" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              {/* Brand & Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Store / Brand Name *</label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Luxe Boutique"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Business Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Legal Name & GSTIN */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Luxe Retail Pvt Ltd"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">GSTIN / Tax ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Owner Info */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Owner Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Official Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="owner@brand.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="+91 98450 11223"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Outlets & Terminals */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Number of Store Outlets</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={outlets}
                    onChange={(e) => setOutlets(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Estimated POS Terminals</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={terminals}
                    onChange={(e) => setTerminals(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Login Credentials Desired */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block mb-3">
                  Account Login Credentials
                </span>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Requested Username *</label>
                    <input
                      type="text"
                      name="new_brand_request_user"
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      required
                      placeholder="e.g. luxeadmin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      name="new_brand_request_pass"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      name="new_brand_request_conf"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {isSubmitting ? 'Registering Application...' : 'Submit Application to Dev Core'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
