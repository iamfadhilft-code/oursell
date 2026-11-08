'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Star,
  Zap,
} from 'lucide-react';
import { PlanContactModal } from './PlanContactModal';
import { PricingPlan } from '@/types/pos';
import { PLAN_PRICING } from '@/lib/planAccess';

interface LockedFeatureScreenProps {
  featureName: string;
  featureDescription: string;
  requiredPlan: 'Professional' | 'Enterprise';
  currentPlan?: string;
  storeSlug?: string;
  featureBenefits?: string[];
}

export function LockedFeatureScreen({
  featureName,
  featureDescription,
  requiredPlan,
  currentPlan = 'Starter',
  storeSlug = 'oursell',
  featureBenefits = [],
}: LockedFeatureScreenProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const isEnterprise = requiredPlan === 'Enterprise';
  const targetPrice = isEnterprise ? PLAN_PRICING.enterprise.monthly : PLAN_PRICING.professional.monthly;
  const targetAnnualPrice = isEnterprise ? PLAN_PRICING.enterprise.annual : PLAN_PRICING.professional.annual;

  const defaultBenefits = isEnterprise
    ? [
        'Centralized Fleet Management across all regional chain stores',
        'Franchise Operations & Automated Royalty Calculations',
        'Unlimited Outlets & POS Billing Terminals',
        'Dedicated Database Isolation & Custom Domain Mapping',
        'Enterprise REST API Keys & Custom Third-party Integrations',
        '24/7 Dedicated Priority Support & SLA',
      ]
    : [
        'Customer Khata & Store Credit Ledger Management',
        'Automated Purchase Orders & Supplier Reordering',
        'Store Cash Expense Tracking directly at Cashier Counters',
        'Advanced Profit Margin Analytics & Traffic Heatmaps',
        'Up to 3 Store Outlets & 6 POS Terminals',
        'English, Malayalam & Arabic Multi-lingual Support',
      ];

  const benefitsToShow = featureBenefits.length > 0 ? featureBenefits : defaultBenefits;

  const planObj: PricingPlan = {
    id: isEnterprise ? 'enterprise' : 'professional',
    name: isEnterprise ? 'Multi-Chain Enterprise' : 'Professional',
    badge: isEnterprise ? 'ENTERPRISE' : 'MOST POPULAR',
    description: isEnterprise
      ? 'Built for retail chains, franchises and multi-outlet fleet networks.'
      : 'Ideal for supermarkets, high-traffic retailers and multi-counter outlets.',
    monthlyPrice: targetPrice,
    annualPrice: targetAnnualPrice,
    staffLimit: isEnterprise ? 5 : 3,
    outletLimit: isEnterprise ? null : 3,
    terminalLimit: isEnterprise ? null : 6,
    productLimit: null,
    features: benefitsToShow,
    isActive: true,
    sortOrder: isEnterprise ? 3 : 2,
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Banner */}
        <div
          className={`p-8 text-white relative ${
            isEnterprise
              ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-900'
              : 'bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {requiredPlan} Exclusive Module
            </span>
            <span className="text-xs text-white/80 font-medium">Your Store: {currentPlan}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight">{featureName}</h2>
          <p className="text-xs md:text-sm text-white/85 mt-2 leading-relaxed">
            {featureDescription}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">₹{targetPrice}</span>
            <span className="text-xs text-white/75 font-medium">/month billed monthly</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              What unlocking {requiredPlan} gives your store:
            </h4>
            <div className="space-y-2.5">
              {benefitsToShow.map((b, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                isEnterprise
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to {requiredPlan}
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href={`/shop/${storeSlug}`}
              className="py-3.5 px-6 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>

      <PlanContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        plan={planObj}
      />
    </div>
  );
}
