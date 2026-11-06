'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/db/posDb';
import { BusinessCategory, BrandApplication } from '@/types/pos';
import { ArrowLeft, CheckCircle2, ShieldAlert, Store, User, Mail, Phone, Lock, Building, Check } from 'lucide-react';

export default function RegisterBrandPage() {
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
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Application Submitted!</h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your application has been registered with reference code:
            </p>
            <div className="inline-block px-4 py-2 bg-slate-800 text-teal-400 font-mono font-black text-lg rounded-xl border border-teal-500/40">
              {submittedRef}
            </div>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed pt-2">
              It has been routed to <strong>Dev Core Administration</strong> for verification. Once approved, you will be able to log in to your dedicated POS register.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/devcore"
                className="px-5 py-2.5 bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 rounded-xl text-xs font-bold transition"
              >
                Go to Dev Core to Review & Approve
              </Link>
              <Link
                href="/login-brand"
                className="px-5 py-2.5 bg-teal-500 text-slate-950 hover:bg-teal-400 rounded-xl text-xs font-black transition"
              >
                Go to Brand Login
              </Link>
            </div>
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

            {errorMsg && (
              <div className="mb-6 p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
