'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { StoreExpense } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import {
  Wallet,
  Plus,
  Coffee,
  Sparkles,
  Wrench,
  Truck,
  Lightbulb,
  Receipt,
  X,
} from 'lucide-react';

export default function ExpensesPage() {
  const { activeBrandId, currency, activeCashier } = usePosStore();
  const [expenses, setExpenses] = useState<StoreExpense[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<StoreExpense['category']>('TEA_SNACKS');
  const [amount, setAmount] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const loadExpenses = async () => {
    const list = await db.store_expenses.reverse().sortBy('createdAt');
    setExpenses(list);
  };

  useEffect(() => {
    loadExpenses();
  }, [activeBrandId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newExp: StoreExpense = {
      id: `exp-${Date.now()}`,
      brandId: activeBrandId,
      category,
      amount: Number(amount),
      notes: notes.trim() || 'Store petty expense',
      paidByCashier: activeCashier.name,
      createdAt: new Date().toISOString(),
    };

    await db.store_expenses.add(newExp);
    setIsAddExpenseOpen(false);
    setAmount(50);
    setNotes('');
    loadExpenses();
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getCategoryIcon = (cat: StoreExpense['category']) => {
    switch (cat) {
      case 'TEA_SNACKS':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'CLEANING':
        return <Sparkles className="w-4 h-4 text-cyan-600" />;
      case 'REPAIRS':
        return <Wrench className="w-4 h-4 text-indigo-600" />;
      case 'COURIER':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'UTILITIES':
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-600" />;
    }
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
                <Wallet className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Petty Cash & Store Operational Expenses
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log day-to-day register payouts (tea, snacks, cleaning supplies, repairs, courier).
              </p>
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              Record Petty Expense
            </button>
          </div>

          {/* Quick Expense Total Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex items-center justify-between max-w-sm">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Expenses Logged
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                {currency}{totalExpense.toFixed(2)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          {/* Expense Log Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Category</th>
                  <th className="p-3.5">Description / Notes</th>
                  <th className="p-3.5">Paid By</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5 pr-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      No petty expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100">{getCategoryIcon(exp.category)}</div>
                          <span className="font-bold text-slate-800">{exp.category.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">{exp.notes}</td>
                      <td className="p-3.5 font-medium text-slate-700">{exp.paidByCashier}</td>
                      <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                        {new Date(exp.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 pr-5 text-right font-mono font-black text-slate-900 text-sm">
                        {currency}{exp.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Record Petty Expense</h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StoreExpense['category'])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="TEA_SNACKS">Tea & Snacks</option>
                  <option value="CLEANING">Cleaning & Sanitization</option>
                  <option value="REPAIRS">Maintenance & Repairs</option>
                  <option value="COURIER">Courier & Logistics</option>
                  <option value="UTILITIES">Electricity / Water / Internet</option>
                  <option value="OTHER">Other Operational Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Notes / Voucher Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon tea for 4 staff members"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
