'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Customer, CustomerCreditLedger } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
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
} from 'lucide-react';

export default function CrmPage() {
  const { activeBrandId, currency } = usePosStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerCreditLedger[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayNotes, setRepayNotes] = useState<string>('Cash repayment at counter');

  // New Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState(5000);
  const [address, setAddress] = useState('');

  const loadCustomers = async () => {
    const list = await db.customers.toArray();
    setCustomers(list);
    if (!selectedCustomer && list.length > 0) {
      handleSelectCustomer(list[0]);
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
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

    await db.customers.add(newCust);
    setIsAddCustomerOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    await loadCustomers();
    handleSelectCustomer(newCust);
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
    await db.customers.update(selectedCustomer.id, { storeCreditBalance: newBalance });

    const updated = { ...selectedCustomer, storeCreditBalance: newBalance };
    setSelectedCustomer(updated);
    setIsRepayModalOpen(false);
    setRepayAmount(0);
    await loadCustomers();
    handleSelectCustomer(updated);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-hidden p-6 flex flex-col gap-5">
          {/* Top Bar */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  CRM & Khata Credit Ledger
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage customer relationships, loyalty reward tiers, and credit balance audit trails.
              </p>
            </div>

            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Dual Panel: Customer List (Left) and Khata Ledger (Right) */}
          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
            {/* Left Customer List */}
            <div className="w-[340px] bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col shadow-xs shrink-0">
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filtered.map((cust) => {
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
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h2>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                          Khata #{selectedCustomer.id.slice(-4)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selectedCustomer.phone}</span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selectedCustomer.email}</span>
                        )}
                        {selectedCustomer.address && <span>• {selectedCustomer.address}</span>}
                      </p>
                    </div>

                    {/* Balance Cards & Repay Action */}
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
                  </div>

                  {/* Ledger History List */}
                  <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      Financial Transaction Audit History
                    </span>

                    {ledgerEntries.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 text-xs">
                        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        No recorded credit transactions yet for this customer.
                      </div>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                                entry.type === 'CREDIT_GIVEN'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {entry.type === 'CREDIT_GIVEN' ? (
                                <ArrowUpRight className="w-4 h-4 text-amber-700" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">
                                {entry.type === 'CREDIT_GIVEN'
                                  ? 'Purchase on Credit (Khata)'
                                  : 'Debt Repayment Received'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(entry.createdAt).toLocaleString()} • {entry.notes || ''}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-sm font-black font-mono block ${
                                entry.type === 'CREDIT_GIVEN' ? 'text-amber-700' : 'text-emerald-700'
                              }`}
                            >
                              {entry.type === 'CREDIT_GIVEN' ? '+' : '-'}{currency}{entry.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Balance: {currency}{entry.balanceAfter.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Select a customer from the left to view their Khata ledger.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* RECORD REPAYMENT MODAL */}
      {isRepayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Record Customer Repayment</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedCustomer.name}</p>
            </div>

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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Payment Method / Notes</label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="e.g. Cash paid at counter or GPay"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] space-y-0.5">
                <div className="flex justify-between text-slate-500">
                  <span>Current Due:</span>
                  <span>{currency}{selectedCustomer.storeCreditBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Remaining Due:</span>
                  <span>{currency}{Math.max(0, selectedCustomer.storeCreditBalance - repayAmount).toFixed(2)}</span>
                </div>
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

      {/* ADD CUSTOMER MODAL */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-900">Add New Customer</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 11223"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Credit Limit ({currency})</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
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
    </div>
  );
}
