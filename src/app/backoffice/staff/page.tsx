'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/db/posDb';
import { StaffUser, PricingPlan } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { PlanContactModal } from '@/components/pricing/PlanContactModal';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import {
  syncStaffBetweenTables,
  saveUnifiedStaff,
  updateUnifiedStaff,
  deleteUnifiedStaff,
  toggleActiveUnifiedStaff,
} from '@/utils/staffSync';
import {
  UserCheck,
  Plus,
  Key,
  Shield,
  Award,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

export default function StaffPage() {
  const { activeBrandId, currency } = usePosStore();
  const currentBrand = useBrandAuthStore((s) => s.currentBrand);
  const currentAccount = useBrandAuthStore((s) => s.currentAccount);
  const effectiveStoreId = activeBrandId || currentBrand?.brandId || currentAccount?.storeId || 'oursell';

  const { isAdmin, isStaff, canManageStaff, roleBadge } = useRoleAccess();
  const {
    planId,
    planName,
    limits: planLimits,
    usage: planUsage,
    refetchPlan,
  } = usePlanAccess(effectiveStoreId);

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Subscription & Staff Limit State
  const [planTier, setPlanTier] = useState<string>('Professional');
  const [staffLimit, setStaffLimit] = useState<number>(3);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradePlanObj, setUpgradePlanObj] = useState<PricingPlan | null>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);

  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [pin, setPin] = useState('1111');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');
  const [commissionRate, setCommissionRate] = useState(0.02);
  const [canGiveDiscount, setCanGiveDiscount] = useState(true);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadStaffAndLimits = async () => {
    try {
      // 1. Bi-directionally sync between db.accounts and db.staff_users so that staff added in either place always appears in both!
      const { staffUsers } = await syncStaffBetweenTables(effectiveStoreId);
      const list = staffUsers.length > 0 ? staffUsers : await db.staff_users.toArray();
      setStaff(list);

      // Query backend API for live verified limits & tier
      try {
        const res = await fetch(`/api/store/staff?storeId=${encodeURIComponent(effectiveStoreId)}`);
        const data = await res.json();
        if (data.success) {
          setPlanTier(data.planTier || planName);
          setStaffLimit(data.staffLimit || planLimits.staff);
        }
      } catch (apiErr) {
        console.warn('API staff limit lookup fallback:', apiErr);
      }
    } catch (err) {
      console.error('Error loading staff and limits:', err);
    }
  };

  useEffect(() => {
    loadStaffAndLimits();
  }, [effectiveStoreId, planLimits.staff, planName]);

  const effectiveLimit = staffLimit || planLimits.staff || (planId === 'enterprise' ? 5 : planId === 'professional' ? 3 : 1);
  const activeStaffCount = staff.filter((s) => s.isActive).length;
  const isLimitReached = activeStaffCount >= effectiveLimit;
  const usagePercentage = Math.min(100, Math.round((activeStaffCount / effectiveLimit) * 100));

  const handleOpenAdd = () => {
    if (!canManageStaff) {
      alert('Restricted: Only Store Administrators can add staff associates.');
      return;
    }
    if (isLimitReached) {
      setIsGateModalOpen(true);
      return;
    }
    setEditingStaff(null);
    setName('');
    setPin('1111');
    setRole('CASHIER');
    setCommissionRate(0.02);
    setCanGiveDiscount(false);
    setIsAddStaffOpen(true);
  };

  const handleOpenEdit = (s: StaffUser) => {
    if (!canManageStaff) {
      alert('Restricted: Only Store Administrators can edit staff associates.');
      return;
    }
    setEditingStaff(s);
    setName(s.name);
    setPin(s.pin);
    setRole(s.role);
    setCommissionRate(s.commissionRate);
    setCanGiveDiscount(s.canGiveDiscount);
    setIsEditStaffOpen(true);
  };

  const handleOpenUpgradeModal = () => {
    const nextPlan = planTier.toLowerCase().includes('starter')
      ? {
          id: 'professional',
          name: 'Professional',
          badge: 'MOST POPULAR',
          description: 'Ideal for supermarkets, restaurants and multi-counter outlets.',
          monthlyPrice: 799,
          annualPrice: 7990,
          staffLimit: 3,
          outletLimit: 3,
          terminalLimit: 6,
          productLimit: null,
          features: ['Up to 3 Staff Accounts', 'Up to 3 Store Outlets', '6 POS Terminals'],
          isActive: true,
          sortOrder: 2,
        }
      : {
          id: 'enterprise',
          name: 'Multi-Chain Enterprise',
          description: 'For retail chains, franchises and regional networks.',
          monthlyPrice: 3299,
          annualPrice: 32990,
          staffLimit: 5,
          outletLimit: null,
          terminalLimit: null,
          productLimit: null,
          features: ['Up to 5 Staff Accounts', 'Unlimited Store Outlets', 'Unlimited POS Terminals'],
          isActive: true,
          sortOrder: 3,
        };

    setUpgradePlanObj(nextPlan);
    setIsUpgradeModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) return;
    if (!name.trim() || pin.length !== 4) {
      alert('Please provide a valid name and 4-digit numeric PIN.');
      return;
    }

    // 1. Strict frontend guardrail
    if (activeStaffCount >= staffLimit) {
      alert(`Your staff limit has been reached (${activeStaffCount}/${staffLimit}). Upgrade your plan to add more staff.`);
      return;
    }

    // 2. Save unified staff simultaneously across db.staff_users AND db.accounts!
    const { staffUser } = await saveUnifiedStaff({
      storeId: effectiveStoreId,
      name: name.trim(),
      pin: pin.trim(),
      role,
      commissionRate: Number(commissionRate),
      canGiveDiscount: role !== 'CASHIER' || canGiveDiscount,
      isActive: true,
    });

    setStaff((prev) => [staffUser, ...prev]);
    setIsAddStaffOpen(false);
    showNotification(`Staff associate "${staffUser.name}" added successfully.`);
    loadStaffAndLimits();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff || !editingStaff) return;
    if (!name.trim() || pin.length !== 4) return;

    await updateUnifiedStaff(editingStaff.id, {
      name: name.trim(),
      pin: pin.trim(),
      role,
      commissionRate: Number(commissionRate),
      canGiveDiscount,
    });

    setStaff((prev) =>
      prev.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name: name.trim(),
              pin: pin.trim(),
              role,
              commissionRate: Number(commissionRate),
              canGiveDiscount,
            }
          : s
      )
    );
    setIsEditStaffOpen(false);
    setEditingStaff(null);
    showNotification(`Staff associate "${name.trim()}" updated.`);
  };

  const handleToggleStaffActive = async (s: StaffUser) => {
    const newStatus = !s.isActive;
    await toggleActiveUnifiedStaff(s.id, newStatus);
    setStaff((prev) => prev.map((item) => (item.id === s.id ? { ...item, isActive: newStatus } : item)));
    showNotification(`Staff associate "${s.name}" is now ${newStatus ? 'ACTIVE' : 'DISABLED'}.`);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    const id = staffToDelete.id;
    const staffName = staffToDelete.name;

    await deleteUnifiedStaff(id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
    setStaffToDelete(null);
    showNotification(`Staff associate "${staffName}" removed.`);
  };

  // If user is staff, show access restriction view with option to go to POS register
  if (isStaff) {
    return (
      <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
        <PosSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <PosHeader />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Access Restricted to Administrators</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                You are currently working in <strong className="text-slate-700">Store Staff mode</strong>. Managing staff associates, configuring PIN credentials, and adjusting discount authorizations are restricted to Store Administrators.
              </p>
              <div className="pt-2">
                <Link
                  href="/pos/register"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <span>Return to POS Billing Register</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        {/* Status Toast */}
        {notice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Staff Permissions & PIN Management
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase">
                  STORE_ADMIN
                </span>
                <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded uppercase">
                  {planTier} Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Administer 4-digit cashier/manager PIN codes, discount authorization privileges, and sales commissions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleOpenAdd}
                disabled={isLimitReached}
                title={isLimitReached ? 'Your staff limit has been reached. Upgrade to add more staff.' : 'Add Staff Associate'}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                  isLimitReached
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Associate</span>
              </button>
            </div>
          </div>

          {/* STAFF USAGE & CAPACITY PROGRESS INDICATOR */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isLimitReached ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Staff Usage: <strong className={isLimitReached ? 'text-rose-600' : 'text-teal-700'}>{activeStaffCount}/{effectiveLimit} Staff Accounts Used</strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({planTier || planName} Plan Limit)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {isLimitReached
                      ? planId === 'enterprise'
                        ? 'Maximum enterprise staff limit reached (5 accounts).'
                        : 'Your staff limit has been reached. Upgrade your plan to add additional staff accounts.'
                      : `${effectiveLimit - activeStaffCount} additional staff account(s) available on your active plan.`}
                  </span>
                </div>
              </div>

              {isLimitReached && planId !== 'enterprise' && (
                <button
                  onClick={() => setIsGateModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade Staff Limit</span>
                </button>
              )}
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isLimitReached
                    ? 'bg-rose-500'
                    : usagePercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          {/* Limit Reached Warning Alert */}
          {isLimitReached && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-rose-950">Your staff limit has been reached.</h4>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Your store is currently on the <strong>{planTier || planName} Plan</strong>, which allows a maximum of <strong>{effectiveLimit} staff account(s)</strong>.
                  {planId !== 'enterprise' && ' To add more cashiers or managers, please contact our support team to upgrade your subscription.'}
                </p>
                {planId !== 'enterprise' && (
                  <div className="pt-1.5">
                    <button
                      onClick={() => setIsGateModalOpen(true)}
                      className="text-xs font-bold text-teal-800 underline hover:text-teal-950 cursor-pointer"
                    >
                      Contact Us to Request an Upgrade →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staff Directory Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{s.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                            s.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : s.role === 'MANAGER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.role}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                            s.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {s.isActive !== false ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStaffActive(s)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                        s.isActive !== false
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={s.isActive !== false ? 'Disable Staff User' : 'Enable Staff User'}
                    >
                      {s.isActive !== false ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                      title="Edit Staff User"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setStaffToDelete(s)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Delete Staff User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Terminal PIN</span>
                    <span className="font-bold text-slate-800">{s.pin}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Commission</span>
                    <span className="font-bold text-teal-700">{(s.commissionRate * 100).toFixed(0)}% per sale</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block uppercase">Discounts</span>
                    <span className="font-bold text-slate-700">
                      {s.canGiveDiscount ? 'Authorized' : 'Restricted'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 uppercase block">Sales Handled</span>
                    <span className="font-bold text-slate-900">{currency}{s.totalSalesGenerated.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ADD STAFF MODAL (Admin) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Add Staff User (Admin)</h3>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} autoComplete="off" className="space-y-3 text-xs">
              {/* Anti-autofill decoy inputs */}
              <input type="text" name="anti_fill_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="anti_fill_pwd" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="staff_name_new"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    name="staff_pin_new"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Store Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={canGiveDiscount}
                  onChange={(e) => setCanGiveDiscount(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-700">Authorize Register Line Discounts</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow"
                >
                  Save Associate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL (Admin) */}
      {isEditStaffOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Edit Staff Associate (Admin)</h3>
              <button
                onClick={() => setIsEditStaffOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} autoComplete="off" className="space-y-3 text-xs">
              {/* Anti-autofill decoy inputs */}
              <input type="text" name="anti_fill_user_edit" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="anti_fill_pwd_edit" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="staff_name_edit"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    name="staff_pin_edit"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'CASHIER')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Store Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={canGiveDiscount}
                  onChange={(e) => setCanGiveDiscount(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-700">Authorize Register Line Discounts</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditStaffOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE STAFF CONFIRMATION MODAL */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Remove Staff Associate?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently remove associate <strong className="text-slate-800">&quot;{staffToDelete.name}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN UPGRADE CONTACT MODAL */}
      <PlanContactModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plan={upgradePlanObj}
        billingCycle="MONTHLY"
        displayPrice={upgradePlanObj ? upgradePlanObj.monthlyPrice : 799}
      />

      {/* DYNAMIC PLAN GATE UPGRADE MODAL */}
      <PlanGateModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        title={planId === 'starter' ? 'Upgrade to Professional for 3 Staff Accounts' : 'Upgrade to Enterprise for 5 Staff Accounts'}
        description={
          planId === 'starter'
            ? `Your store is currently on the Starter Plan (1 staff account limit). Upgrade to the Professional plan to expand to 3 staff accounts, and unlock Customer Khata, Purchase Orders, and multi-language support.`
            : `Your store is currently on the Professional Plan (3 staff account limit). Upgrade to Multi-Chain Enterprise to expand to 5 staff accounts, Centralized Fleet Management, and custom API integrations.`
        }
        requiredPlan={planId === 'starter' ? 'Professional' : 'Enterprise'}
        currentPlan={planName}
        featureBenefits={
          planId === 'starter'
            ? [
                'Up to 3 Staff Accounts with role permissions',
                'Customer Khata & Store Credit Ledger',
                'Purchase Orders & Supplier Stock Replenishment',
                'Store Expense Tracking directly at Cashier Counters',
                'Advanced Profit Margin Analytics',
                'English, Malayalam & Arabic Language Support',
              ]
            : [
                'Up to 5 Staff Accounts with granular role permissions',
                'Centralized Enterprise Fleet Management & Telemetry',
                'Franchise Operations & Royalty Automation',
                'Unlimited Outlets & POS Billing Terminals',
                'Dedicated Database Isolation & Custom Domain Mapping',
                '24/7 Dedicated Priority SLA & On-Premise Support',
              ]
        }
        storeId={activeBrandId}
        onSuccessUpgrade={() => {
          loadStaffAndLimits();
          refetchPlan();
        }}
      />
    </div>
  );
}
