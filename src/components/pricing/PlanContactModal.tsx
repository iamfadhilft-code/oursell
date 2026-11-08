'use client';

import React, { useState } from 'react';
import { db } from '@/db/posDb';
import { PricingPlan } from '@/types/pos';
import { X, CheckCircle2, Send, ArrowRight, ShieldCheck, Sparkles, Building2, Phone, Mail, User } from 'lucide-react';

interface PlanContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PricingPlan | null;
  billingCycle?: 'MONTHLY' | 'ANNUAL';
  displayPrice?: number;
}

export function PlanContactModal({
  isOpen,
  onClose,
  plan,
  billingCycle = 'MONTHLY',
  displayPrice,
}: PlanContactModalProps) {
  const effectivePrice = displayPrice !== undefined ? displayPrice : (plan?.monthlyPrice || 0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your name, email, and phone number.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      planId: plan.id,
      planName: plan.name,
      billingCycle,
      price: effectivePrice,
      customerName: name.trim(),
      customerEmail: email.trim().toLowerCase(),
      customerPhone: phone.trim(),
      message: message.trim(),
    };

    try {
      // 1. Submit to Next.js API / Supabase
      const res = await fetch('/api/plans/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      // 2. Also cache locally in IndexedDB
      try {
        await db.plan_enquiries.put({
          id: `enq-${Date.now()}`,
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          price: effectivePrice,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim(),
          message: message.trim(),
          status: 'NEW',
          createdAt: new Date().toISOString(),
        });
      } catch (localErr) {
        console.warn('Local enquiry cache error:', localErr);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F1514] border border-[#232F2C] text-[#F8FAFC] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] my-8">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#182321] hover:bg-[#233330] text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center mx-auto text-[#10B981]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Enquiry Received!</h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-sm mx-auto leading-relaxed">
                Thank you <strong className="text-white">{name}</strong>. Our enterprise retail specialist will contact you shortly regarding the <strong className="text-[#10B981]">{plan.name} Plan</strong>.
              </p>
            </div>

            {/* Selected Plan Summary Pill */}
            <div className="bg-[#151E1C] border border-[#232F2C] rounded-2xl p-4 text-xs font-mono max-w-sm mx-auto text-left space-y-1.5">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Selected Plan:</span>
                <span className="text-white font-bold">{plan.name}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Billing Period:</span>
                <span className="text-white">{billingCycle === 'ANNUAL' ? 'Annual Billing' : 'Monthly Billing'}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Plan Price:</span>
                <span className="text-[#10B981] font-bold">
                  ₹{effectivePrice.toLocaleString('en-IN')} / {billingCycle === 'ANNUAL' ? 'year' : 'month'}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleResetAndClose}
                className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#0ea371] text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-[#10B981]/25"
              >
                Done & Return to Website
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modal Header with Selected Plan Summary */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[11px] font-mono font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Contact Sales & Onboarding</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Get started with {plan.name}
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Share your details and our retail onboarding team will set up your store workspace with full feature access.
              </p>
            </div>

            {/* Selected Plan Details Banner */}
            <div className="bg-[#141C1A] border border-[#232F2C] rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#94A3B8] block">
                  Chosen Tier
                </span>
                <h4 className="font-extrabold text-white text-sm sm:text-base">{plan.name}</h4>
                <span className="text-[11px] text-[#94A3B8]">
                  {billingCycle === 'ANNUAL' ? 'Billed Annually' : 'Billed Monthly'}
                </span>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-[#10B981] font-mono">
                  ₹{effectivePrice.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-[#94A3B8] font-mono">
                  /{billingCycle === 'ANNUAL' ? 'year' : 'month'}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090D0C] border border-[#232F2C] text-white placeholder-neutral-500 focus:outline-none focus:border-[#10B981] transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Business Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@store.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090D0C] border border-[#232F2C] text-white placeholder-neutral-500 focus:outline-none focus:border-[#10B981] transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090D0C] border border-[#232F2C] text-white placeholder-neutral-500 focus:outline-none focus:border-[#10B981] transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1.5">
                  Business Requirements or Store Location (Optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your store type, number of counters, or specific requirements..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090D0C] border border-[#232F2C] text-white placeholder-neutral-500 focus:outline-none focus:border-[#10B981] transition resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#10B981] hover:bg-[#0ea371] disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-[#10B981]/25"
                >
                  {isSubmitting ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <span>Submit Enquiry</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-center text-[#94A3B8] flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Zero spam guarantee. No credit card required.</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
