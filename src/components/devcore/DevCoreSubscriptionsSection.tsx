'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { StoreSubscription } from '@/types/devcore';
import { PricingPlan, PlanEnquiry } from '@/types/pos';
import { FEATURE_REGISTRY, FeatureKey, isRealStore } from '@/lib/planAccess';
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Search,
  Filter,
  Clock,
  X,
  Edit2,
  Plus,
  Trash2,
  Shield,
  Layers,
  Sparkles,
  Users,
  Building,
  Check,
  Mail,
  Phone,
  MessageSquare,
} from 'lucide-react';

export function DevCoreSubscriptionsSection() {
  const {
    subscriptions,
    pricingPlans,
    planEnquiries,
    updateSubscriptionPlan,
    updateSubscriptionStatus,
    updatePlanConfiguration,
    updateEnquiryStatus,
    deletePlanEnquiry,
    setActionNotice,
    theme,
  } = useDevCoreStore();

  const isDark = theme === 'dark';

  // Sub-tabs: 'plans' | 'subscriptions' | 'enquiries'
  const [subTab, setSubTab] = useState<'plans' | 'subscriptions' | 'enquiries'>('plans');

  // Search & Filter state for subscriptions
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  // Editing Subscription modal
  const [editingSub, setEditingSub] = useState<StoreSubscription | null>(null);
  const [selectedPlanTier, setSelectedPlanTier] = useState<StoreSubscription['plan']>('Professional');

  // Editing Pricing Plan modal
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(0);
  const [editAnnualPrice, setEditAnnualPrice] = useState<number>(0);
  const [editStaffLimit, setEditStaffLimit] = useState<number>(1);
  const [editOutletLimit, setEditOutletLimit] = useState<string>('1');
  const [editTerminalLimit, setEditTerminalLimit] = useState<string>('2');
  const [editProductLimit, setEditProductLimit] = useState<string>('1000');
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  // Filter strictly for active real merchant stores and deduplicate by canonical storeId
  const realSubsMap = new Map<string, StoreSubscription>();
  for (const s of subscriptions) {
    if (!isRealStore(s)) continue;
    const key = (s.storeId || '').trim().toLowerCase();
    if (!key) continue;
    const existing = realSubsMap.get(key);
    if (!existing) {
      realSubsMap.set(key, s);
    } else {
      if (existing.status !== 'ACTIVE' && s.status === 'ACTIVE') {
        realSubsMap.set(key, s);
      } else if (
        existing.status === s.status &&
        (s.plan === 'Enterprise' || (s.amount || 0) > (existing.amount || 0))
      ) {
        realSubsMap.set(key, s);
      }
    }
  }

  const realSubs = Array.from(realSubsMap.values());
  const activeRealSubs = realSubs.filter((s) => s.status === 'ACTIVE');

  // Compute MRR & ARR from active real stores only
  const mrr = activeRealSubs.reduce((sum, s) => {
    return sum + (s.billingCycle === 'ANNUAL' ? s.amount / 12 : s.amount);
  }, 0);
  const arr = mrr * 12;

  const filteredSubs = realSubs.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.storeName?.toLowerCase().includes(q) || s.storeId?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (planFilter !== 'ALL' && s.plan !== planFilter) return false;
    return true;
  });

  const handleOpenEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditBadge(plan.badge || '');
    setEditDescription(plan.description);
    setEditMonthlyPrice(plan.monthlyPrice);
    setEditAnnualPrice(plan.annualPrice);
    setEditStaffLimit(plan.staffLimit);
    setEditOutletLimit(plan.outletLimit === null ? 'UNLIMITED' : String(plan.outletLimit));
    setEditTerminalLimit(plan.terminalLimit === null ? 'UNLIMITED' : String(plan.terminalLimit));
    setEditProductLimit(plan.productLimit === null ? 'UNLIMITED' : String(plan.productLimit));
    setEditFeatures([...(plan.features || [])]);
    setEditIsActive(plan.isActive);

    // Fetch live feature toggles from backend
    fetch(`/api/plans/${plan.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.features) {
          setFeatureToggles(data.features);
        }
      })
      .catch(() => {});
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setEditFeatures([...editFeatures, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    setEditFeatures(editFeatures.filter((_, i) => i !== idx));
  };

  const handleToggleFeature = (key: string) => {
    setFeatureToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSavingPlan(true);

    try {
      const outletVal = editOutletLimit === 'UNLIMITED' ? null : Number(editOutletLimit);
      const terminalVal = editTerminalLimit === 'UNLIMITED' ? null : Number(editTerminalLimit);
      const productVal = editProductLimit === 'UNLIMITED' ? null : Number(editProductLimit);

      const success = await updatePlanConfiguration(editingPlan.id, {
        name: editPlanName.trim(),
        badge: editBadge.trim() || undefined,
        description: editDescription.trim(),
        monthlyPrice: Number(editMonthlyPrice),
        annualPrice: Number(editAnnualPrice),
        staffLimit: Number(editStaffLimit),
        outletLimit: outletVal,
        terminalLimit: terminalVal,
        productLimit: productVal,
        features: editFeatures,
        isActive: editIsActive,
        featureToggles,
      } as any);

      if (success) {
        setEditingPlan(null);
      }
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handlePlanChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    await updateSubscriptionPlan(editingSub.id, selectedPlanTier);
    setEditingSub(null);
    setActionNotice({
      message: `Store "${editingSub.storeName}" subscription plan updated to ${selectedPlanTier}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">
            Monthly Run Rate (MRR)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            ₹{mrr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-[11px] font-mono font-bold text-emerald-500 block uppercase">
            Annual Run Rate (ARR)
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-1 block tracking-tight">
            ₹{arr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">
            Active Subscriptions
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {activeRealSubs.length} Stores
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-[11px] font-mono font-bold text-cyan-400 block uppercase">
            Plan Enquiry Leads
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1 block tracking-tight">
            {planEnquiries.length} Inbound
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Plans Management vs Subscriptions vs Enquiries */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#232D2B] pb-3">
        <button
          onClick={() => setSubTab('plans')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'plans'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plans Configuration ({pricingPlans.length})</span>
        </button>

        <button
          onClick={() => setSubTab('subscriptions')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'subscriptions'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Active Store Subscriptions ({activeRealSubs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('enquiries')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
            subTab === 'enquiries'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Plan Enquiries ({planEnquiries.length})</span>
          {planEnquiries.filter((e) => e.status === 'NEW').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. PLANS CONFIGURATION SECTION */}
      {/* ======================================================== */}
      {subTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Global SaaS Pricing Plans & Capacity Limits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized plan limits synchronize directly with the public website pricing section, backend staff enforcement, and store dashboards.
              </p>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const isPro = plan.id === 'professional';

              return (
                <div
                  key={plan.id}
                  className={`rounded-[28px] border p-6 flex flex-col justify-between transition relative shadow-sm ${
                    isDark
                      ? isPro
                        ? 'bg-[#111917] border-emerald-500/80 shadow-emerald-950/20 shadow-lg'
                        : 'bg-[#111717] border-[#232D2B]'
                      : isPro
                      ? 'bg-white border-emerald-500 shadow-md'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 font-black text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-400 block uppercase">
                          PLAN TIER: {plan.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            plan.isActive
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {plan.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>

                      <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[32px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c1211] border border-slate-200/60 dark:border-[#1e2825] grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">
                          MONTHLY RATE
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">/mo</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">
                          ANNUAL RATE
                        </span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ₹{plan.annualPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">/yr</span>
                      </div>
                    </div>

                    {/* Hard Limit Badges */}
                    <div className="space-y-2 text-xs">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                        ENFORCED LIMITS
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between">
                          <span className="text-slate-500">Staff Limit:</span>
                          <strong className="text-slate-900 dark:text-emerald-400 font-bold">
                            {plan.staffLimit} max
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between">
                          <span className="text-slate-500">Outlets:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {plan.outletLimit === null ? 'Unlimited' : plan.outletLimit}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between">
                          <span className="text-slate-500">Terminals:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {plan.terminalLimit === null ? 'Unlimited' : plan.terminalLimit}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 flex items-center justify-between">
                          <span className="text-slate-500">Products:</span>
                          <strong className="text-slate-900 dark:text-white">
                            {plan.productLimit === null ? 'Unlimited' : plan.productLimit}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Features Count */}
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                        ✓ {plan.features.length} Marketing features configured
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6">
                    <button
                      onClick={() => handleOpenEditPlan(plan)}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Plan & Limits</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ACTIVE STORE SUBSCRIPTIONS TABLE */}
      {/* ======================================================== */}
      {subTab === 'subscriptions' && (
        <div
          className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          {/* Table Search & Filter Header */}
          <div
            className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
            }`}
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store name or handle..."
                className={`pl-8 pr-3 py-1.5 rounded-full text-xs outline-none border transition w-64 ${
                  isDark
                    ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-full text-xs outline-none border ${
                  isDark ? 'bg-[#080B0B] border-[#232D2B] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="PAST_DUE">Past Due</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-full text-xs outline-none border ${
                  isDark ? 'bg-[#080B0B] border-[#232D2B] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                    isDark
                      ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                      : 'border-slate-200/80 bg-slate-50 text-slate-500'
                  }`}
                >
                  <th className="py-3 px-6">Store & Handle</th>
                  <th className="py-3 px-6">SaaS Tier Plan</th>
                  <th className="py-3 px-6">Enforced Staff Limit</th>
                  <th className="py-3 px-6">Billing Cycle</th>
                  <th className="py-3 px-6">Recurring Amount</th>
                  <th className="py-3 px-6">Subscription Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                      <p className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                        No active real store subscriptions found.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Only verified, registered merchant stores appear in this section.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map((sub) => {
                  const staffLimit =
                    sub.staffLimit ??
                    (sub.plan === 'Enterprise' ? 5 : sub.plan === 'Professional' ? 3 : 1);

                  return (
                    <tr
                      key={sub.id}
                      className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {sub.storeName}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600">/{sub.storeId}</span>
                      </td>

                      <td className="py-3.5 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.plan === 'Enterprise'
                              ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
                              : sub.plan === 'Professional'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">
                          <Users className="w-3 h-3 text-emerald-500" />
                          <span>Max {staffLimit} Staff</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                        {sub.billingCycle}
                      </td>

                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        ₹{sub.amount.toLocaleString('en-IN')}
                        <span className="text-[10px] text-slate-400 font-normal">
                          /{sub.billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                        </span>
                      </td>

                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : sub.status === 'TRIAL'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{sub.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setEditingSub(sub);
                            setSelectedPlanTier(sub.plan);
                          }}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Modify Tier</span>
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PLAN ENQUIRIES SECTION */}
      {/* ======================================================== */}
      {subTab === 'enquiries' && (
        <div
          className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="p-4 border-b border-slate-200 dark:border-[#232D2B] flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Inbound Plan Enquiries & Upgrade Requests
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Leads captured from the public "Contact Us →" pricing buttons.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-500 font-bold">
              {planEnquiries.length} Total Enquiries
            </span>
          </div>

          {planEnquiries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-xs font-semibold">No plan enquiries received yet.</p>
              <p className="text-[11px] text-slate-500">
                When visitors click "Contact Us →" on the pricing section, their requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark
                        ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                        : 'border-slate-200/80 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <th className="py-3 px-6">Customer</th>
                    <th className="py-3 px-6">Requested Plan</th>
                    <th className="py-3 px-6">Billing Cycle</th>
                    <th className="py-3 px-6">Quoted Price</th>
                    <th className="py-3 px-6">Customer Message</th>
                    <th className="py-3 px-6">Date Received</th>
                    <th className="py-3 px-6">Lead Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
                  {planEnquiries.map((enq) => (
                    <tr
                      key={enq.id}
                      className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {enq.customerName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{enq.customerEmail}</span>
                          <span>•</span>
                          <span className="font-mono">{enq.customerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                        {enq.planName}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                        {enq.billingCycle}
                      </td>

                      <td className="py-3.5 px-6 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{enq.price.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-6 max-w-xs truncate text-slate-600 dark:text-slate-300 text-[11px]">
                        {enq.message || <span className="text-slate-400 italic">No notes</span>}
                      </td>

                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                        {new Date(enq.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-6">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            updateEnquiryStatus(enq.id, e.target.value as PlanEnquiry['status'])
                          }
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold outline-none border ${
                            enq.status === 'NEW'
                              ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                              : enq.status === 'CONVERTED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="CONVERTED">CONVERTED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => deletePlanEnquiry(enq.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          title="Delete Enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT PLAN CONFIGURATION */}
      {/* ======================================================== */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 text-left my-8 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base">Edit Plan: {editingPlan.name}</h3>
                <p className="text-xs text-slate-500">
                  Updates synchronize dynamically across public pricing, subscriptions, and staff limits.
                </p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlanSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Badge Pill (Optional)
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    placeholder="e.g. MOST POPULAR"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Plan Description
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Monthly Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editMonthlyPrice}
                    onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Annual Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editAnnualPrice}
                    onChange={(e) => setEditAnnualPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Limits Configuration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                    Staff Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editStaffLimit}
                    onChange={(e) => setEditStaffLimit(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Strict quota</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                    Outlets Limit
                  </label>
                  <select
                    value={editOutletLimit}
                    onChange={(e) => setEditOutletLimit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                    Terminals Limit
                  </label>
                  <select
                    value={editTerminalLimit}
                    onChange={(e) => setEditTerminalLimit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="10">10</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-[11px]">
                    Product Limit
                  </label>
                  <select
                    value={editProductLimit}
                    onChange={(e) => setEditProductLimit(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="1000">1,000</option>
                    <option value="5000">5,000</option>
                    <option value="10000">10,000</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>
              </div>

              {/* Features List Editor */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Plan Feature Checklist (Visible on pricing cards)
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                  {editFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-800 text-[11px]"
                    >
                      <span className="truncate">✓ {feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    placeholder="Add new feature bullet..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold text-xs"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Individual Feature Engine Permissions (Database-enforced) */}
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1 text-xs">
                  Feature Engine Module Toggles (Database & API Enforced)
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  Enabling or disabling these modules directly modifies database permissions and API access for this tier.
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
                  {Object.entries(FEATURE_REGISTRY).map(([fKey, fMeta]) => {
                    const isChecked = featureToggles[fKey] ?? (
                      editingPlan.id === 'enterprise'
                        ? true
                        : editingPlan.id === 'professional'
                        ? fMeta.minPlan !== 'Enterprise'
                        : fMeta.minPlan === 'Starter'
                    );

                    return (
                      <label
                        key={fKey}
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[11px] font-semibold truncate pr-1">
                          {fMeta.name || fMeta.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleFeature(fKey)}
                          className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold block">Plan Active Status</span>
                  <span className="text-[10px] text-slate-400">
                    When active, this plan is displayed on the public landing page.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer shadow-md"
                >
                  {isSavingPlan ? 'Saving Changes...' : 'Save Plan Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MODIFY STORE SUBSCRIPTION TIER */}
      {/* ======================================================== */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Adjust Store Plan Tier</h3>
              <button
                onClick={() => setEditingSub(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Modifying subscription plan for <strong className="text-slate-900 dark:text-white">{editingSub.storeName}</strong>.
            </p>

            <form onSubmit={handlePlanChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  Choose SaaS Tier
                </label>
                <div className="space-y-2">
                  {(['Starter', 'Professional', 'Enterprise'] as const).map((tier) => {
                    const planCfg = pricingPlans.find(
                      (p) => p.name.toLowerCase().includes(tier.toLowerCase()) || p.id === tier.toLowerCase()
                    );
                    const pPrice = planCfg ? planCfg.monthlyPrice : tier === 'Enterprise' ? 3299 : tier === 'Professional' ? 799 : 0;
                    const pStaff = planCfg ? planCfg.staffLimit : tier === 'Enterprise' ? 5 : tier === 'Professional' ? 3 : 1;

                    return (
                      <div
                        key={tier}
                        onClick={() => setSelectedPlanTier(tier)}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition ${
                          selectedPlanTier === tier
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div>
                          <span className="block font-bold">{tier} Plan</span>
                          <span className="text-[10px] text-slate-400">
                            Max {pStaff} Staff • {tier === 'Enterprise' ? 'Unlimited outlets' : tier === 'Professional' ? '3 outlets' : '1 outlet'}
                          </span>
                        </div>
                        <span className="font-mono font-bold">
                          ₹{pPrice.toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Update Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
