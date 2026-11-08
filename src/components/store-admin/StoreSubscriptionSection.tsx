'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building,
  Monitor,
  Package,
  Calendar,
  ArrowRight,
  RefreshCw,
  Clock,
  Zap,
  Tag,
  Lock,
} from 'lucide-react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanContactModal } from '@/components/pricing/PlanContactModal';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import { PricingPlan } from '@/types/pos';
import { PLAN_PRICING, FEATURE_REGISTRY, DEFAULT_PLAN_LIMITS } from '@/lib/planAccess';

interface StoreSubscriptionSectionProps {
  storeSlug: string;
}

export function StoreSubscriptionSection({ storeSlug }: StoreSubscriptionSectionProps) {
  const {
    planId,
    planName,
    monthlyPrice,
    annualPrice,
    subscriptionStatus,
    renewalDate,
    limits,
    usage,
    hasAccess,
    refetchPlan,
    isLoading,
  } = usePlanAccess(storeSlug);

  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PricingPlan | null>(null);

  const fetchSubscriptionHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const res = await fetch(`/api/store/subscription?storeId=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (data.success && data.events) {
        setHistoryEvents(data.events);
      }
    } catch (err) {
      console.warn('Error fetching subscription history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionHistory();
  }, [storeSlug]);

  const handleOpenUpgrade = () => {
    if (planId === 'starter') {
      setIsGateModalOpen(true);
    } else if (planId === 'professional') {
      setSelectedPlanForUpgrade({
        id: 'enterprise',
        name: 'Multi-Chain Enterprise',
        badge: 'ENTERPRISE',
        description: 'For retail chains, franchises, and regional networks.',
        monthlyPrice: PLAN_PRICING.enterprise.monthly,
        annualPrice: PLAN_PRICING.enterprise.annual,
        staffLimit: 5,
        outletLimit: null,
        terminalLimit: null,
        productLimit: null,
        features: [
          'Up to 5 Staff Accounts',
          'Unlimited Outlets & POS Terminals',
          'Centralized Enterprise Fleet Management',
          'Franchise Management & Royalty Automation',
          'Dedicated Database Isolation',
          'Custom Domain & Enterprise REST APIs',
        ],
        isActive: true,
        sortOrder: 3,
      });
      setIsContactModalOpen(true);
    }
  };

  const formattedRenewal = renewalDate
    ? new Date(renewalDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Monthly Rolling (Active)';

  return (
    <div className="space-y-6">
      {/* Top Banner: Current Subscription Status */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 shadow-xs">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {planName} Plan
                </h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                  {subscriptionStatus}
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                  Monthly Billing
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Active SaaS tier governing counter staff, physical outlet branches, POS terminals, and advanced retail module access.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-left lg:text-right pr-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Subscription Price
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                ₹{monthlyPrice.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </span>
            </div>

            {planId !== 'enterprise' && (
              <button
                onClick={handleOpenUpgrade}
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-300" />
                <span>Upgrade Plan</span>
              </button>
            )}

            <button
              onClick={() => {
                refetchPlan();
                fetchSubscriptionHistory();
              }}
              title="Refresh Subscription Data"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Plan Renewal Sub-bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Next Renewal / Review Date: <strong className="text-slate-800">{formattedRenewal}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-700 font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Automatic Database Limit Sync Active</span>
          </div>
        </div>
      </div>

      {/* 4 Resource Usage Metric Cards */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <span>Real-Time Resource Limits & Usage</span>
          <span className="text-[11px] font-mono text-slate-400">({planName})</span>
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Staff Usage */}
          {(() => {
            const used = usage.staff.used;
            const limit = usage.staff.limit;
            const pct = Math.min(100, Math.round((used / limit) * 100));
            const isFull = usage.staff.isExceeded || used >= limit;

            return (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Staff Accounts</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isFull ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {used}/{limit}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{isFull ? 'Limit Reached' : `${limit - used} available`}</span>
                    <span className="font-mono font-bold text-slate-700">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. Outlet Usage */}
          {(() => {
            const used = usage.outlets.used;
            const limit = usage.outlets.limit;
            const isUnlimited = limit === null;
            const pct = isUnlimited ? 10 : Math.min(100, Math.round((used / limit) * 100));
            const isFull = !isUnlimited && used >= limit;

            return (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Store Outlets</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isFull ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {used}/{isUnlimited ? '∞' : limit}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">
                      {isUnlimited ? 'Unlimited Outlets' : isFull ? 'Limit Reached' : `${(limit || 0) - used} available`}
                    </span>
                    <span className="font-mono font-bold text-slate-700">{isUnlimited ? 'Active' : `${pct}%`}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlimited ? 'bg-blue-600' : isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. POS Terminal Usage */}
          {(() => {
            const used = usage.terminals.used;
            const limit = usage.terminals.limit;
            const isUnlimited = limit === null;
            const pct = isUnlimited ? 10 : Math.min(100, Math.round((used / limit) * 100));
            const isFull = !isUnlimited && used >= limit;

            return (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">POS Terminals</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isFull ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {used}/{isUnlimited ? '∞' : limit}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">
                      {isUnlimited ? 'Unlimited Terminals' : isFull ? 'Limit Reached' : `${(limit || 0) - used} available`}
                    </span>
                    <span className="font-mono font-bold text-slate-700">{isUnlimited ? 'Active' : `${pct}%`}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlimited ? 'bg-purple-600' : isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 4. Product Catalog Usage */}
          {(() => {
            const used = usage.products.used;
            const limit = usage.products.limit;
            const isUnlimited = limit === null;
            const pct = isUnlimited ? 10 : Math.min(100, Math.round((used / limit) * 100));
            const isFull = !isUnlimited && used >= limit;

            return (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Catalog SKUs</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isFull ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {used}/{isUnlimited ? '∞' : limit}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">
                      {isUnlimited ? 'Unlimited Products' : isFull ? 'Limit Reached' : `${(limit || 0) - used} available`}
                    </span>
                    <span className="font-mono font-bold text-slate-700">{isUnlimited ? 'Active' : `${pct}%`}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlimited ? 'bg-emerald-600' : isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Feature Capabilities Matrix for Current Plan */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Available Feature Modules</h3>
            <p className="text-[11px] text-slate-400">Permissions active on your store&apos;s current subscription</p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
            Tier: {planName}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {Object.entries(FEATURE_REGISTRY).map(([key, meta]) => {
            const isEnabled = hasAccess(key as any);
            return (
              <div
                key={key}
                className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                  isEnabled
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-800'
                    : 'bg-slate-50 border-slate-200/70 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className={`font-semibold ${isEnabled ? 'text-slate-900' : 'text-slate-400'}`}>
                    {meta.name || meta.label}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                    isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isEnabled ? 'ACTIVE' : meta.minPlan}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Event & Audit History */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Subscription & Limit Audit Trail</h3>
            <p className="text-[11px] text-slate-400">Chronological history of plan changes, upgrades, and renewals</p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {historyEvents.length} event(s) logged
          </span>
        </div>

        {isHistoryLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading subscription events...</div>
        ) : historyEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            Store subscription initialized on <strong>{planName} Plan</strong>. No manual overrides logged.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {historyEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[10px]">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{evt.event_type}</span>
                      <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {evt.new_plan || planName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {evt.actor ? `Initiated by: ${evt.actor}` : 'System Provisioned'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {new Date(evt.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Contact Modal */}
      <PlanContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        plan={selectedPlanForUpgrade}
        billingCycle="MONTHLY"
        displayPrice={selectedPlanForUpgrade?.monthlyPrice || 799}
      />

      {/* Plan Gate Modal */}
      <PlanGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        title="Upgrade to Professional Plan"
        description="Expand your store from 1 staff to 3 staff members, unlock up to 3 outlets, 6 POS terminals, unlimited products, Customer Khata, Purchase Orders, and multi-language support."
        requiredPlan="Professional"
        currentPlan={planName}
        storeId={storeSlug}
        onSuccessUpgrade={() => {
          refetchPlan();
          fetchSubscriptionHistory();
        }}
      />
    </div>
  );
}
