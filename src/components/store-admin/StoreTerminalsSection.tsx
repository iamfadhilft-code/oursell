'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Plus,
  Building,
  Key,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  RefreshCw,
  X,
  Shield,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';

interface StoreTerminalsSectionProps {
  storeSlug: string;
}

interface TerminalData {
  id: string;
  name: string;
  code: string;
  outlet_id?: string;
  outlets?: { name: string; code: string };
  device_fingerprint?: string;
  cashier_assigned?: string;
  status: 'ONLINE' | 'OFFLINE' | 'LOCKED';
  is_active: boolean;
  last_active_at?: string;
  created_at: string;
}

export function StoreTerminalsSection({ storeSlug }: StoreTerminalsSectionProps) {
  const { planId, planName, limits, usage, canAddResource, refetchPlan } = usePlanAccess(storeSlug);

  const [terminals, setTerminals] = useState<TerminalData[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [outletId, setOutletId] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [cashierAssigned, setCashierAssigned] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tRes, oRes] = await Promise.all([
        fetch(`/api/store/terminals?storeId=${encodeURIComponent(storeSlug)}`),
        fetch(`/api/store/outlets?storeId=${encodeURIComponent(storeSlug)}`),
      ]);

      const tData = await tRes.json();
      const oData = await oRes.json();

      if (tData.success && tData.terminals) {
        setTerminals(tData.terminals);
      }
      if (oData.success && oData.outlets) {
        setOutlets(oData.outlets);
        if (oData.outlets.length > 0 && !outletId) {
          setOutletId(oData.outlets[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching terminals data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeSlug]);

  const activeCount = terminals.filter((t) => t.is_active).length;
  const effectiveLimit = limits.terminals; // null means unlimited
  const isUnlimited = effectiveLimit === null;
  const isLimitReached = !isUnlimited && activeCount >= effectiveLimit;
  const usagePct = isUnlimited ? 20 : Math.min(100, Math.round((activeCount / effectiveLimit) * 100));

  const handleOpenAdd = () => {
    if (isLimitReached) {
      setIsGateModalOpen(true);
      return;
    }
    setName(`Counter Register ${terminals.length + 1}`);
    setCode(`POS-${terminals.length + 1}`);
    setDeviceFingerprint(`DEV-HW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setCashierAssigned('Counter Cashier');
    if (outlets.length > 0) setOutletId(outlets[0].id);
    setErrorMessage(null);
    setIsAddModalOpen(true);
  };

  const handleRegisterTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMessage('Terminal name and identifier code are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/store/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeSlug,
          outletId: outletId || undefined,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          deviceFingerprint: deviceFingerprint.trim() || undefined,
          cashierAssigned: cashierAssigned.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'TERMINAL_LIMIT_EXCEEDED') {
          setIsAddModalOpen(false);
          setIsGateModalOpen(true);
          return;
        }
        setErrorMessage(data.error || 'Failed to register terminal.');
        return;
      }

      setSuccessMessage(`Terminal "${code.trim()}" registered successfully.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setIsAddModalOpen(false);
      fetchData();
      refetchPlan();
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error registering terminal.');
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
            <Monitor className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              POS Billing Terminals & Hardware Registers
            </h2>
            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded uppercase">
              {planName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Register hardware billing counters, thermal printer stations, and device security fingerprints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
              isLimitReached
                ? 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            {isLimitReached ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isLimitReached ? 'Terminal Limit Reached' : 'Register POS Terminal'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Capacity Bar */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isLimitReached ? 'bg-rose-50 text-rose-600' : 'bg-purple-50 text-purple-600'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Terminal Usage:{' '}
                  <strong className={isLimitReached ? 'text-rose-600' : 'text-purple-700'}>
                    {activeCount}/{isUnlimited ? 'Unlimited' : effectiveLimit} Terminals Registered
                  </strong>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({planName} Plan Limit)
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {isUnlimited
                  ? 'Unlimited POS terminals supported across all outlets on Enterprise.'
                  : isLimitReached
                  ? 'Your POS terminal limit has been reached. Upgrade to add more checkout lanes.'
                  : `${(effectiveLimit || 0) - activeCount} additional billing terminal(s) available on your active plan.`}
              </span>
            </div>
          </div>

          {isLimitReached && (
            <button
              onClick={() => setIsGateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Plan to Add Terminals</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isUnlimited ? 'bg-purple-600' : isLimitReached ? 'bg-rose-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-purple-600'
            }`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* Terminals Table / Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading POS billing terminals...</div>
      ) : terminals.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-xs text-slate-500 space-y-3">
          <Monitor className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-800">No POS Terminals Registered</h4>
          <p className="max-w-md mx-auto text-slate-500">
            Register your cashier checkout counters and barcode scan stations to begin high-speed billing.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
          >
            + Register First Terminal
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {terminals.map((term) => (
            <div
              key={term.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-sm">
                    {term.code.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{term.name}</h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                      {term.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                      term.status === 'ONLINE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {term.status === 'ONLINE' ? (
                      <Wifi className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{term.status}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl space-y-2 text-xs border border-slate-100 text-slate-600 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Assigned Branch:</span>
                  <span className="font-bold text-slate-800">{term.outlets?.name || 'Main Branch'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Device Fingerprint:</span>
                  <span className="text-[11px] text-slate-700">{term.device_fingerprint || 'DEV-NATIVE'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Operator:</span>
                  <span className="text-slate-800 font-sans">{term.cashier_assigned || 'Default Cashier'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Terminal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">Register POS Terminal</h3>
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

            <form onSubmit={handleRegisterTerminal} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Terminal Descriptive Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Counter Register 1 - Front Lane"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Terminal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POS-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign to Outlet Branch</label>
                  <select
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                    {outlets.length === 0 && <option value="">Default Branch</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Device Hardware Fingerprint</label>
                <input
                  type="text"
                  placeholder="e.g. DEV-HW-9A4F"
                  value={deviceFingerprint}
                  onChange={(e) => setDeviceFingerprint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Cashier Operator</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Cashier"
                  value={cashierAssigned}
                  onChange={(e) => setCashierAssigned(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

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
                  className="flex-[2] py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow transition"
                >
                  {isSubmitting ? 'Registering...' : 'Register Terminal'}
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
        title={planId === 'starter' ? 'Upgrade to Professional for 6 POS Terminals' : 'Upgrade to Enterprise for Unlimited Terminals'}
        description={
          planId === 'starter'
            ? 'Starter Plan is limited to 2 POS checkout terminals. Upgrade to Professional (₹799/mo) to operate up to 6 checkout counters across up to 3 outlets.'
            : 'Professional Plan is limited to 6 POS checkout terminals. Upgrade to Multi-Chain Enterprise (₹3,299/mo) for unlimited registers across all locations.'
        }
        requiredPlan={planId === 'starter' ? 'Professional' : 'Enterprise'}
        currentPlan={planName}
        featureBenefits={
          planId === 'starter'
            ? [
                'Up to 6 POS Billing Terminals',
                'Up to 3 Store Outlets',
                'Customer Khata & Credit Ledger',
                'Purchase Orders & Supplier Restocking',
                'English, Malayalam & Arabic Language Support',
              ]
            : [
                'Unlimited POS Billing Terminals',
                'Unlimited Store Outlets & Locations',
                'Centralized Enterprise Fleet Management & Telemetry',
                'Franchise Management & Royalty Settlement Automation',
                'Dedicated Database Isolation & Custom Domain Mapping',
              ]
        }
        storeId={storeSlug}
        onSuccessUpgrade={() => {
          fetchData();
          refetchPlan();
        }}
      />
    </div>
  );
}
