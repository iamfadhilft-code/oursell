'use client';
import React, { useState, useEffect } from 'react';
import { Customer } from '@/types/pos';
import { db } from '@/db/posDb';
import { usePosStore } from '@/store/usePosStore';
import { Search, UserPlus, Phone, Mail, Award, X, Check } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export function CustomerModal({ isOpen, onClose, onSelectCustomer }: CustomerModalProps) {
  const { activeBrandId, currency } = usePosStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState(3000);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, activeBrandId]);

  const loadCustomers = async () => {
    const list = await db.customers.toArray();
    setCustomers(list);
  };

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      brandId: activeBrandId,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      loyaltyPoints: 0,
      storeCreditBalance: 0,
      creditLimit: Number(newCreditLimit) || 3000,
      createdAt: new Date().toISOString(),
    };

    await db.customers.add(newCust);
    onSelectCustomer(newCust);
    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[500px] w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-400" />
            <h3 className="font-extrabold text-sm uppercase tracking-wide">
              {isAddingNew ? 'Add New Customer' : 'Link Customer to Bill'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAddingNew ? (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Search and Add button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                New
              </button>
            </div>

            {/* Customers List */}
            <div className="space-y-2 mt-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No customers found. Click &quot;New&quot; to create one.
                </div>
              ) : (
                filtered.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onSelectCustomer(cust);
                      onClose();
                    }}
                    className="p-3 border border-slate-200 rounded-2xl hover:border-teal-500 hover:bg-teal-50/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-700">
                        {cust.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {cust.phone}
                        </span>
                        <span className="flex items-center gap-1 text-teal-700 font-semibold">
                          <Award className="w-3 h-3 text-teal-600" />
                          {cust.loyaltyPoints} pts
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Khata Due</span>
                      <span className="text-xs font-bold text-slate-700">
                        {currency}{cust.storeCreditBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Add New Customer Form */
          <form onSubmit={handleCreateCustomer} className="p-6 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +91 98450 11223"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Store Credit Limit ({currency})</label>
              <input
                type="number"
                value={newCreditLimit}
                onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="flex-[2] py-2.5 text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save & Link Customer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
