'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { StoreExpense } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { LockedFeatureScreen } from '@/components/pricing/LockedFeatureScreen';
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
  Edit2,
  Trash2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function ExpensesPage() {
  const { activeBrandId, currency, activeCashier } = usePosStore();
  const { isAdmin, roleBadge } = useRoleAccess();
  const { planName, checkFeature } = usePlanAccess(activeBrandId);
  const expenseFeature = checkFeature('expense_management');

  const [expenses, setExpenses] = useState<StoreExpense[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StoreExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<StoreExpense | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<StoreExpense['category']>('TEA_SNACKS');
  const [amount, setAmount] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadExpenses = async () => {
    const list = await db.store_expenses.reverse().sortBy('createdAt');
    setExpenses(list);
  };

  useEffect(() => {
    loadExpenses();
  }, [activeBrandId]);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot log expenses.');
      return;
    }
    setCategory('TEA_SNACKS');
    setAmount(50);
    setNotes('');
    setIsAddExpenseOpen(true);
  };

  const handleOpenEdit = (exp: StoreExpense) => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot edit expenses.');
      return;
    }
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount);
    setNotes(exp.notes);
    setIsEditExpenseOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('Permission Denied: Only Store Administrators can record expenses.');
      return;
    }
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

    await db.store_expenses.put(newExp);
    setExpenses((prev) => [newExp, ...prev]);
    setIsAddExpenseOpen(false);
    showNotification(`Petty expense of ${currency}${newExp.amount.toFixed(2)} logged.`);
  };

  const handleSaveExpenseEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('Permission Denied: Only Store Administrators can edit expenses.');
      return;
    }
    if (!editingExpense || amount <= 0) return;

    const updated: StoreExpense = {
      ...editingExpense,
      category,
      amount: Number(amount),
      notes: notes.trim() || 'Store petty expense',
    };

    await db.store_expenses.put(updated);
    setExpenses((prev) => prev.map((exp) => (exp.id === updated.id ? updated : exp)));
    setIsEditExpenseOpen(false);
    setEditingExpense(null);
    showNotification(`Expense updated successfully.`);
  };

  const handleConfirmDelete = async () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot delete expenses.');
      return;
    }
    if (!expenseToDelete) return;
    const delId = expenseToDelete.id;

    await db.store_expenses.delete(delId);
    setExpenses((prev) => prev.filter((exp) => exp.id !== delId));
    setExpenseToDelete(null);
    showNotification(`Expense record deleted.`);
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

  if (!expenseFeature.allowed) {
    return (
      <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
        <PosSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <PosHeader />
          <LockedFeatureScreen
            featureName="Store Expense Tracking"
            featureDescription="Track miscellaneous retail operational expenses (tea, cleaning, repairs, courier, utilities) directly from counter cash registers with shift reconciliation."
            requiredPlan="Professional"
            currentPlan={planName}
            storeSlug={activeBrandId}
          />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Petty Cash & Store Operational Expenses
                </h1>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    isAdmin
                      ? 'bg-slate-900 text-white'
                      : 'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}
                >
                  {roleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Administrator control: Review, edit, and delete store petty cash logs and payouts.'
                  : 'Cashier work mode: Log day-to-day register payouts (tea, snacks, cleaning supplies, repairs, courier).'}
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Record Petty Expense
              </button>
            ) : (
              <div
                title="Restricted: Only Store Administrators can log petty expenses"
                className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Record Expense (Admin Only)</span>
              </div>
            )}
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
                  <th className="p-3.5">Amount</th>
                  {isAdmin && <th className="p-3.5 pr-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-slate-400 text-xs">
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
                      <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                        {currency}{exp.amount.toFixed(2)}
                      </td>
                      {isAdmin && (
                        <td className="p-3.5 pr-5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Record Petty Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Milk and sugar for store counter"
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
                  Confirm Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL (Admin Only) */}
      {isEditExpenseOpen && editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Edit Expense (Admin)</h3>
              <button onClick={() => setIsEditExpenseOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpenseEdit} className="space-y-3 text-xs">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditExpenseOpen(false)}
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

      {/* DELETE EXPENSE CONFIRM MODAL */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Expense Record?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove expense of <strong className="text-slate-800">{currency}{expenseToDelete.amount.toFixed(2)}</strong> ({expenseToDelete.notes})?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
