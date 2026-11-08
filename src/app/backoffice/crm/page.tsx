'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Customer, CustomerCreditLedger } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import {
  Users,
  Search,
  UserPlus,
  BookOpen,
  Award,
  Phone,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Plus,
  X,
  CheckCircle2,
  Edit2,
  Trash2,
  Lock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

export default function CrmPage() {
  const { activeBrandId, currency } = usePosStore();
  const { isAdmin, isStaff, canManageCustomers, roleBadge } = useRoleAccess();
  const { planName, checkFeature } = usePlanAccess(activeBrandId);
  const khataFeature = checkFeature('customer_khata');
  const [isKhataGateOpen, setIsKhataGateOpen] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerCreditLedger[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayNotes, setRepayNotes] = useState<string>('Cash repayment at counter');

  // Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [address, setAddress] = useState('');

  // Delete Confirm Dialog
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const loadCustomers = async () => {
    const list = await db.customers.toArray();
    setCustomers(list);
    if (list.length > 0) {
      if (!selectedCustomer || !list.find((c) => c.id === selectedCustomer.id)) {
        handleSelectCustomer(list[0]);
      }
    } else {
      setSelectedCustomer(null);
      setLedgerEntries([]);
    }
  };

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    const ledger = await db.customer_credit_ledger
      .where('customerId')
      .equals(cust.id)
      .reverse()
      .sortBy('createdAt');
    setLedgerEntries(ledger);
  };

  useEffect(() => {
    loadCustomers();
  }, [activeBrandId]);

  const handleOpenAdd = () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot add new customer profiles.');
      return;
    }
    setName('');
    setPhone('');
    setEmail('');
    setCreditLimit(5000);
    setAddress('');
    setIsAddCustomerOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot edit customer details.');
      return;
    }
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setCreditLimit(cust.creditLimit);
    setAddress(cust.address || '');
    setIsEditCustomerOpen(true);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('Permission Denied: Only Store Administrators can create customers.');
      return;
    }
    if (!name.trim() || !phone.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      brandId: activeBrandId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      loyaltyPoints: 0,
      storeCreditBalance: 0,
      creditLimit: Number(creditLimit) || 5000,
      address: address.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await db.customers.put(newCust);
    setCustomers((prev) => [newCust, ...prev]);
    setSelectedCustomer(newCust);
    setIsAddCustomerOpen(false);
    showNotification(`Customer "${newCust.name}" added successfully.`);
    loadCustomers();
  };

  const handleSaveCustomerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showNotification('Permission Denied: Only Store Administrators can edit customer profiles.');
      return;
    }
    if (!selectedCustomer || !name.trim() || !phone.trim()) return;

    const updated: Customer = {
      ...selectedCustomer,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      creditLimit: Number(creditLimit) || 5000,
      address: address.trim() || undefined,
    };

    await db.customers.put(updated);
    setSelectedCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setIsEditCustomerOpen(false);
    showNotification(`Customer "${updated.name}" updated successfully.`);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!isAdmin) {
      showNotification('Permission Denied: Staff accounts cannot delete customers.');
      return;
    }
    if (!customerToDelete) return;
    const delId = customerToDelete.id;
    const delName = customerToDelete.name;

    await db.customers.delete(delId);
    setCustomers((prev) => prev.filter((c) => c.id !== delId));
    if (selectedCustomer?.id === delId) {
      const remaining = customers.filter((c) => c.id !== delId);
      if (remaining.length > 0) {
        handleSelectCustomer(remaining[0]);
      } else {
        setSelectedCustomer(null);
        setLedgerEntries([]);
      }
    }
    setCustomerToDelete(null);
    showNotification(`Customer "${delName}" removed.`);
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || repayAmount <= 0) return;

    const newBalance = Math.max(0, selectedCustomer.storeCreditBalance - repayAmount);

    const ledgerRecord: CustomerCreditLedger = {
      id: `ccl-${Date.now()}`,
      brandId: activeBrandId,
      customerId: selectedCustomer.id,
      type: 'PAYMENT_RECEIVED',
      amount: repayAmount,
      balanceAfter: newBalance,
      notes: repayNotes,
      createdAt: new Date().toISOString(),
    };

    await db.customer_credit_ledger.add(ledgerRecord);
    const updated = { ...selectedCustomer, storeCreditBalance: newBalance };
    await db.customers.put(updated);

    setSelectedCustomer(updated);
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setIsRepayModalOpen(false);
    setRepayAmount(0);
    showNotification(`Repayment of ${currency}${repayAmount.toFixed(2)} recorded.`);
    handleSelectCustomer(updated);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

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

        <main className="flex-1 overflow-hidden p-6 flex flex-col space-y-4">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Customers & Credit Ledger (Khata)
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
                  ? 'Administrator control: Add, edit, and delete customer profiles, manage credit limits and Khata ledger.'
                  : 'Staff work mode: Look up customer accounts, register walk-in customers, and collect Khata repayments.'}
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <UserPlus className="w-4 h-4" />
                Add Customer
              </button>
            ) : (
              <div
                title="Restricted: Only Store Administrators can add new customer profiles"
                className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Add Customer (Admin Only)</span>
              </div>
            )}
          </div>

          {/* Master Detail Layout */}
          <div className="flex-1 flex gap-5 overflow-hidden min-h-0">
            {/* Left Customer List */}
            <div className="w-80 bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col shadow-xs shrink-0">
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <div
                      key={cust.id}
                      onClick={() => handleSelectCustomer(cust)}
                      className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{cust.name}</h4>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{cust.phone}</span>
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-100/60 px-1.5 py-0.2 rounded mt-1 inline-block">
                          {cust.loyaltyPoints} pts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Khata Balance</span>
                        <span
                          className={`text-xs font-black font-mono ${
                            cust.storeCreditBalance > 0 ? 'text-amber-700' : 'text-slate-700'
                          }`}
                        >
                          {currency}{cust.storeCreditBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Khata Ledger Timeline */}
            <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col shadow-xs overflow-hidden">
              {selectedCustomer ? (
                <>
                  {/* Customer Banner */}
                  <div className="pb-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          Khata #{selectedCustomer.id.slice(-4)}
                        </span>

                        {/* Admin Edit & Delete Actions */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleOpenEdit(selectedCustomer)}
                              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                              title="Edit Customer Profile"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCustomerToDelete(selectedCustomer)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Customer Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}</span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}</span>
                        )}
                        {selectedCustomer.address && <span>• {selectedCustomer.address}</span>}
                      </p>
                    </div>

                    {/* Balance Cards & Repay Action (Professional & Enterprise) */}
                    {khataFeature.allowed ? (
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl text-right">
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">Current Outstanding</span>
                          <span className="text-xl font-black font-mono text-amber-950">
                            {currency}{selectedCustomer.storeCreditBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Credit Limit</span>
                          <span className="text-xl font-black font-mono text-slate-800">
                            {currency}{selectedCustomer.creditLimit.toFixed(2)}
                          </span>
                        </div>
                        {selectedCustomer.storeCreditBalance > 0 && (
                          <button
                            onClick={() => {
                              setRepayAmount(selectedCustomer.storeCreditBalance);
                              setIsRepayModalOpen(true);
                            }}
                            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-600/20 active:scale-95"
                          >
                            Record Repayment
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsKhataGateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition shadow-xs"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Khata & Credit Ledger Locked</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">
                          PRO
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Ledger History List */}
                  {!khataFeature.allowed ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200/80 my-4 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">
                        Customer Khata & Credit Ledger requires Professional Plan
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        Track customer outstanding balances, credit limits, automated ledger audit trails, and accept deferred khata payments at counter checkout.
                      </p>
                      <button
                        onClick={() => setIsKhataGateOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
                      >
                        Upgrade to Professional (₹799/mo)
                      </button>
                    </div>
                  ) : (
                  <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
                    <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
                      Transaction Audit Log
                    </h3>
                    {ledgerEntries.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No credit transactions logged for this customer.
                      </div>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3.5 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                entry.type === 'CREDIT_GIVEN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {entry.type === 'CREDIT_GIVEN' ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">
                                {entry.type === 'CREDIT_GIVEN' ? 'Store Credit Given' : 'Payment Received'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(entry.createdAt).toLocaleString()} • {entry.notes}
                              </span>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <span
                              className={`font-black text-sm block ${
                                entry.type === 'CREDIT_GIVEN' ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              {entry.type === 'CREDIT_GIVEN' ? '+' : '-'}
                              {currency}{entry.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Balance: {currency}{entry.balanceAfter.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Select a customer on the left to review Khata transactions.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Add Customer</h3>
              <button
                onClick={() => setIsAddCustomerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Credit Limit ({currency})</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Address / Note</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL (Admin Only) */}
      {isEditCustomerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">Edit Customer (Admin)</h3>
              <button
                onClick={() => setIsEditCustomerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Credit Limit ({currency})</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Address / Note</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCustomerOpen(false)}
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

      {/* DELETE CUSTOMER CONFIRMATION MODAL (Admin Only) */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Customer?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete customer profile <strong className="text-slate-800">&quot;{customerToDelete.name}&quot;</strong>? This cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {isRepayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Record Khata Repayment</h3>
            <p className="text-xs text-slate-500">
              Customer: <span className="font-bold text-slate-800">{selectedCustomer.name}</span>
              <br />
              Current Due: <span className="font-mono font-bold text-amber-700">{currency}{selectedCustomer.storeCreditBalance.toFixed(2)}</span>
            </p>

            <form onSubmit={handleRecordRepayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Repayment Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedCustomer.storeCreditBalance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Notes / Mode</label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Plan Gate for Customer Khata */}
      <PlanGateModal
        isOpen={isKhataGateOpen}
        onClose={() => setIsKhataGateOpen(false)}
        title="Customer Khata & Credit Ledger"
        description="Allow approved customers to make purchases on store credit, set individual credit limits, maintain full transparent transaction ledgers, and accept repayments at POS counter."
        requiredPlan="Professional"
        currentPlan={planName}
      />
    </div>
  );
}
