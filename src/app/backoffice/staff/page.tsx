'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { StaffUser } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
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
} from 'lucide-react';

export default function StaffPage() {
  const { activeBrandId, currency } = usePosStore();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // New Staff Form
  const [name, setName] = useState('');
  const [pin, setPin] = useState('1111');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');
  const [commissionRate, setCommissionRate] = useState(0.02);

  const loadStaff = async () => {
    const list = await db.staff_users.toArray();
    setStaff(list);
  };

  useEffect(() => {
    loadStaff();
  }, [activeBrandId]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4) return;

    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      brandId: activeBrandId,
      name: name.trim(),
      pin: pin.trim(),
      role,
      commissionRate: Number(commissionRate),
      totalSalesGenerated: 0,
      canGiveDiscount: role !== 'CASHIER',
      isActive: true,
    };

    await db.staff_users.add(newStaff);
    setIsAddStaffOpen(false);
    setName('');
    setPin('1111');
    loadStaff();
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Staff Permissions & PIN Management
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure 4-digit cashier/manager PIN codes, discount authorization privileges, and sales commissions.
              </p>
            </div>

            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Add Staff Associate
            </button>
          </div>

          {/* Staff Directory Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{s.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase font-mono ${
                          s.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : s.role === 'MANAGER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.role}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                    PIN: ••••
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Commission</span>
                    <span className="font-bold text-teal-700">{(s.commissionRate * 100).toFixed(0)}% per sale</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Discounts</span>
                    <span className="font-bold text-slate-700">
                      {s.canGiveDiscount ? 'Authorized' : 'Restricted'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase">Sales Handled</span>
                    <span className="font-bold text-slate-900">{currency}{s.totalSalesGenerated.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Add Staff User</h3>

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
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
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Save Associate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
