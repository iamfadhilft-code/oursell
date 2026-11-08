'use client';

import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  X,
  Shield,
  Zap,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import { PlanContactModal } from './PlanContactModal';
import { PricingPlan } from '@/types/pos';
import { PLAN_PRICING } from '@/lib/planAccess';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface PlanGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  requiredPlan: 'Professional' | 'Enterprise';
  currentPlan?: string;
  featureBenefits?: string[];
  storeId?: string;
  onSuccessUpgrade?: () => void;
}

export function PlanGateModal({
  isOpen,
  onClose,
  title,
  description,
  requiredPlan,
  currentPlan = 'Starter',
  featureBenefits = [],
  storeId,
  onSuccessUpgrade,
}: PlanGateModalProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { isAdmin } = useRoleAccess();

  if (!isOpen) return null;

  const isEnterprise = requiredPlan === 'Enterprise';
  const targetPrice = isEnterprise ? PLAN_PRICING.enterprise.monthly : PLAN_PRICING.professional.monthly;
  const targetAnnualPrice = isEnterprise ? PLAN_PRICING.enterprise.annual : PLAN_PRICING.professional.annual;

  const defaultBenefits = isEnterprise
    ? [
        'Centralized Enterprise Fleet Management & Health Telemetry',
        'Franchise Operations & Royalty Automation',
        'Unlimited Outlets & POS Billing Terminals',
        'Dedicated Database Isolation & Custom Domain Mapping',
        'Enterprise REST API Keys & Custom Integrations',
        '24/7 Dedicated Priority SLA & On-Premise Support',
      ]
    : [
        'Customer Khata & Store Credit Ledger Management',
        'Purchase Orders & Supplier Stock Replenishment',
        'Store Expense Tracking directly at Cashier Counters',
        'Advanced Profit Margin Analytics & Traffic Heatmaps',
        'Up to 3 Store Outlets & 6 POS Terminals',
        'English, Malayalam & Arabic Language Support',
      ];

  const benefitsToShow = featureBenefits.length > 0 ? featureBenefits : defaultBenefits;

  const handleOpenUpgrade = () => {
    setIsContactModalOpen(true);
  };

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
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div
            className={`p-6 text-white relative ${
              isEnterprise
                ? 'bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-900'
                : 'bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700'
            }`}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {requiredPlan} Feature
              </span>
              <span className="text-xs text-white/70">Current Plan: {currentPlan}</span>
            </div>

            <h3 className="text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-xs text-white/80 mt-1.5 leading-relaxed">{description}</p>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Value Callout / Staff Role Notice */}
            {!isAdmin ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Store Admin Action Required
                </div>
                <p className="text-xs text-amber-900 mt-1.5 leading-relaxed">
                  Your account is logged in as <strong className="font-bold">Store Staff</strong>. Subscription plans, quotas, and billing upgrades are managed by the <strong className="font-bold">Store Administrator</strong>.
                </p>
                <p className="text-[11px] text-amber-700 mt-2">
                  Please ask your Store Admin to upgrade the shop&apos;s subscription to the <strong className="font-bold">{requiredPlan} Plan</strong> to unlock this module.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Upgrade to {requiredPlan}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-slate-900">₹{targetPrice}</span>
                    <span className="text-xs text-slate-500 font-medium">/month</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                  Instant Activation
                </span>
              </div>
            )}

            {/* Feature Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Included in {requiredPlan}:
              </span>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {benefitsToShow.slice(0, 5).map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              {!isAdmin ? (
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-md transition"
                >
                  Understood
                </button>
              ) : (
                <>
                  <button
                    onClick={handleOpenUpgrade}
                    className={`w-full py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                      isEnterprise
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to {requiredPlan} Plan
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                  >
                    Maybe Later
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <PlanContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        plan={planObj}
      />
    </>
  );
}
