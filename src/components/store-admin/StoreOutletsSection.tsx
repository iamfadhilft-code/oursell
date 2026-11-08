'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  RefreshCw,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';

interface StoreOutletsSectionProps {
  storeSlug: string;
}

interface OutletData {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  manager_name?: string;
  is_primary: boolean;
  is_active: boolean;
  pos_terminal_count?: number;
  created_at: string;
}

export function StoreOutletsSection({ storeSlug }: StoreOutletsSectionProps) {
  const { planId, planName, limits, usage, canAddResource, refetchPlan } = usePlanAccess(storeSlug);

  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOutlets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/store/outlets?storeId=${encodeURIComponent(storeSlug)}`);
      const data = await res.json();
      if (data.success && data.outlets) {
        setOutlets(data.outlets);
      }
    } catch (err) {
      console.warn('Error fetching outlets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, [storeSlug]);

  const activeCount = outlets.filter((o) => o.is_active).length;
  const effectiveLimit = limits.outlets; // null means unlimited
  const isUnlimited = effectiveLimit === null;
  const isLimitReached = !isUnlimited && activeCount >= effectiveLimit;
  const usagePct = isUnlimited ? 20 : Math.min(100, Math.round((activeCount / effectiveLimit) * 100));

  const handleOpenAdd = () => {
    if (isLimitReached) {
      setIsGateModalOpen(true);
      return;
    }
    setName('');
    setCode(`OUT-${outlets.length + 1}`);
    setAddress('');
    setPhone('');
    setManagerName('');
    setIsPrimary(outlets.length === 0);
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMessage('Outlet name and branch code are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/store/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeSlug,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          managerName: managerName.trim() || undefined,
          isPrimary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'OUTLET_LIMIT_EXCEEDED') {
          setIsAddModalOpen(false);
          setIsGateModalOpen(true);
          return;
        }
        setErrorMessage(data.error || 'Failed to create outlet branch.');
        return;
      }

      setSuccessMessage(`Outlet "${name.trim()}" created successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setIsAddModalOpen(false);
      fetchOutlets();
      refetchPlan();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error creating outlet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-5 py-3 rounded-2xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Physical Store Outlets & Branches
            </h2>
            <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded uppercase">
              {planName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer brick-and-mortar branch locations, branch managers, and terminal allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              isLimitReached
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'bg-teal-700 hover:bg-teal-800 text-white'
            }`}
          >
            {isLimitReached ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isLimitReached ? 'Outlet Limit Reached' : 'Add Store Outlet'}</span>
          </button>
        </div>
      </div>

      {/* Outlet Capacity Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isLimitReached ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
              }`}
            >
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Outlet Usage:{' '}
                  <strong className={isLimitReached ? 'text-rose-600' : 'text-teal-700'}>
                    {activeCount}/{isUnlimited ? 'Unlimited' : effectiveLimit} Outlets Used
                  </strong>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({planName} Plan Limit)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {isUnlimited
                  ? 'Unlimited physical outlet branch locations supported on Enterprise.'
                  : isLimitReached
                  ? 'Your branch outlet limit has been reached. Upgrade to expand your chain.'
                  : `${(effectiveLimit || 0) - activeCount} additional outlet location(s) available.`}
              </span>
            </div>
          </div>

          {isLimitReached && (
            <button
              onClick={() => setIsGateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan to Add Branches</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isUnlimited ? 'bg-blue-600' : isLimitReached ? 'bg-rose-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-teal-600'
            }`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* Outlets Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading store outlets...</div>
      ) : outlets.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-xs text-slate-500 space-y-3">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No Store Outlets Configured</h4>
          <p className="max-w-md mx-auto text-slate-500">
            Create your primary retail location to register POS billing counters and assign cashier terminals.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl"
          >
            + Create First Outlet
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                    {outlet.code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{outlet.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                        {outlet.code}
                      </span>
                      {outlet.is_primary && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          PRIMARY
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    outlet.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {outlet.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl space-y-2 text-xs border border-slate-100 text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{outlet.address || 'Address not configured'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{outlet.phone || 'Phone not configured'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Manager: {outlet.manager_name || 'General Manager'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Outlet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Add New Outlet Branch</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateOutlet} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Outlet Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MG Road Flagship Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OUT-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Manager Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 144 Commercial Street, Bangalore"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-700">Set as Primary Flagship Branch</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-2 font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow transition"
                >
                  {isSubmitting ? 'Creating...' : 'Create Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Gate Modal */}
      <PlanGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        title={planId === 'starter' ? 'Upgrade to Professional for 3 Outlets' : 'Upgrade to Enterprise for Unlimited Outlets'}
        description={
          planId === 'starter'
            ? 'Starter Plan is limited to 1 store outlet. Upgrade to Professional (₹799/mo) to operate up to 3 separate outlets with consolidated reporting and 6 POS billing counters.'
            : 'Professional Plan is limited to 3 store outlets. Upgrade to Multi-Chain Enterprise (₹3,299/mo) to unlock unlimited regional outlets and Centralized Fleet Management.'
        }
        requiredPlan={planId === 'starter' ? 'Professional' : 'Enterprise'}
        currentPlan={planName}
        featureBenefits={
          planId === 'starter'
            ? [
                'Up to 3 Physical Store Outlets',
                'Up to 6 POS Billing Terminals',
                'Customer Khata & Credit Ledger',
                'Purchase Orders & Supplier Restocking',
                'English, Malayalam & Arabic Language Support',
              ]
            : [
                'Unlimited Store Outlets & Locations',
                'Unlimited POS Billing Terminals',
                'Centralized Enterprise Fleet Management & Health Telemetry',
                'Franchise Management & Royalty Settlement Automation',
                'Dedicated Database Isolation & Custom Domain Mapping',
              ]
        }
        storeId={storeSlug}
        onSuccessUpgrade={() => {
          fetchOutlets();
          refetchPlan();
        }}
      />
    </div>
  );
}
