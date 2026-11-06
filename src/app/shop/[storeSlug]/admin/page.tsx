'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/db/posDb';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { StoreAccount, StaffPermission, Brand } from '@/types/pos';
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Store,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  Edit,
  Save,
  ShoppingCart,
  Package,
  Barcode,
  BarChart3,
  X,
  Key,
} from 'lucide-react';

export default function StoreAdminPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || 'oursell';

  const { isAuthenticated, currentRole, currentAccount } = useBrandAuthStore();

  const [store, setStore] = useState<Brand | null>(null);
  const [accounts, setAccounts] = useState<StoreAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'staff' | 'schedule'>('staff');
  const [notice, setNotice] = useState<string | null>(null);

  // New Staff Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'STORE_ADMIN' | 'STORE_STAFF'>('STORE_STAFF');
  const [newStaffPermissions, setNewStaffPermissions] = useState<StaffPermission[]>([
    'pos_billing',
    'customer_manage',
    'invoice_print',
  ]);

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profileCategory, setProfileCategory] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  const loadData = async () => {
    try {
      let b = await db.brands.where('brandId').equals(storeSlug).first();
      if (!b) b = await db.brands.where('username').equals(storeSlug).first();
      if (!b) b = await db.brands.where('brandId').equals('oursell').first();

      setStore(b || null);
      if (b) {
        setProfileName(b.brandName);
        setProfileCategory(b.businessCategory);
        setProfilePhone(b.phone);
        setProfileEmail(b.email);
      }

      const targetId = b?.brandId || storeSlug;
      const accList = await db.accounts.where('storeId').equals(targetId).toArray();
      setAccounts(accList);
    } catch (e) {
      console.warn('Error loading admin store data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeSlug]);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Create Staff Account
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUsername || !newStaffPassword) {
      alert('Please fill out all fields.');
      return;
    }

    const targetStoreId = store?.brandId || storeSlug;

    // Check duplicate username
    const existing = await db.accounts
      .where('username')
      .equalsIgnoreCase(newStaffUsername.trim().toLowerCase())
      .first();

    if (existing) {
      alert('This username is already taken. Please choose another.');
      return;
    }

    const newAccount: StoreAccount = {
      id: `acc-${Date.now()}`,
      storeId: targetStoreId,
      username: newStaffUsername.trim().toLowerCase(),
      name: newStaffName.trim(),
      passwordHash: newStaffPassword.trim(),
      role: newStaffRole,
      permissions: newStaffRole === 'STORE_ADMIN' ? ['all'] : newStaffPermissions,
      pin: newStaffPassword.trim().slice(-4),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.accounts.put(newAccount);
    setIsStaffModalOpen(false);
    setNewStaffName('');
    setNewStaffUsername('');
    setNewStaffPassword('');
    showNotification(`Staff account ${newAccount.username} created successfully!`);
    loadData();
  };

  // Toggle Account Active / Disabled
  const handleToggleActive = async (accId: string, currentStatus: boolean) => {
    await db.accounts.update(accId, { isActive: !currentStatus });
    showNotification(`Account status updated to ${!currentStatus ? 'ACTIVE' : 'DISABLED'}.`);
    loadData();
  };

  // Delete Staff Account
  const handleDeleteAccount = async (accId: string) => {
    if (confirm('Are you sure you want to remove this staff account?')) {
      await db.accounts.delete(accId);
      showNotification('Staff account removed.');
      loadData();
    }
  };

  // Save Store Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    await db.brands.update(store.id, {
      brandName: profileName,
      businessCategory: profileCategory as any,
      phone: profilePhone,
      email: profileEmail,
    });

    showNotification('Store profile updated successfully.');
    loadData();
  };

  // 1. ACCESS CONTROL GUARD: Unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in with your store administrator account to access this management workspace.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl block transition shadow-xs"
            >
              Log In to Your Store &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACCESS CONTROL GUARD: If user is logged in as staff, block admin section
  if (currentRole === 'STORE_STAFF') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You are logged in as a Store Staff member. Administrative settings, staff management, and financial configuration are restricted to Store Administrators.
          </p>
          <div className="pt-2">
            <Link
              href={`/shop/${storeSlug}/pos`}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl block transition shadow-xs"
            >
              Return to POS Register Workspace &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans select-none flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/shop/${storeSlug}`}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            title="Back to Store Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-900">
                {store?.brandName || 'Oursell Demo Store'} • Admin Console
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                STORE_ADMIN
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Store ID: <strong className="text-slate-700">{store?.brandId || storeSlug}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/shop/${storeSlug}/pos`}
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </Link>
        </div>
      </header>

      {/* Notification Toast */}
      {notice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 pb-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Accounts & Permissions</span>
            <span className="text-[10px] opacity-80">({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Profile & Tax Defaults</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Operating Hours & Location</span>
          </button>
        </div>

        {/* TAB 1: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Store Staff Accounts</h3>
                <p className="text-xs text-slate-500">
                  Manage cashier and manager accounts, assign operational permissions, and toggle access.
                </p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create Staff Account</span>
              </button>
            </div>

            {/* Staff Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Staff Name / User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4">Terminal PIN</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{acc.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {acc.username}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            acc.role === 'STORE_ADMIN'
                              ? 'bg-slate-900 text-white'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {acc.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {acc.permissions?.includes('all') ? (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              Full Administrative Access
                            </span>
                          ) : (
                            acc.permissions?.map((p) => (
                              <span
                                key={p}
                                className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono"
                              >
                                {p.replace('_', ' ')}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {acc.pin ? `PIN: ${acc.pin}` : '••••'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            acc.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {acc.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleActive(acc.id, acc.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                            acc.isActive
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {acc.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STORE PROFILE & TAX SETTINGS */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Store Profile & Settings</h3>
              <p className="text-xs text-slate-500">
                Update store branding, contact details, and tax rate defaults.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
                  <input
                    type="text"
                    value={profileCategory}
                    onChange={(e) => setProfileCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: OPERATING HOURS & LOCATION (Reference Screenshot 1) */}
        {activeTab === 'schedule' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Physical Store Location</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Main Street, Central Commercial District, Ground Floor Retail Arcade.
              </p>
              <div className="pt-2 font-mono text-xs text-slate-700">
                Contact: <strong>+91 98765 43210</strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Active Weekly Hours</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs font-mono">
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Mon - Thu</span>
                  <span className="font-bold text-slate-900">08:00 AM - 10:00 PM</span>
                </div>
                <div className="py-2 flex justify-between text-teal-700 font-bold bg-teal-50 px-2 rounded">
                  <span>Friday (Today)</span>
                  <span>08:00 AM - 10:00 PM</span>
                </div>
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Sat - Sun</span>
                  <span className="font-bold text-slate-900">08:30 AM - 10:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE NEW STAFF ACCOUNT MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">Create Staff Account</h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username / Login ID</label>
                <input
                  type="text"
                  required
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  placeholder="e.g. rahul@staff"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                >
                  <option value="STORE_STAFF">STORE_STAFF (Cashier / Counter Operator)</option>
                  <option value="STORE_ADMIN">STORE_ADMIN (Store Manager / Co-Owner)</option>
                </select>
              </div>

              {/* Permissions Checklist (if staff) */}
              {newStaffRole === 'STORE_STAFF' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Configurable Permissions:
                  </span>
                  {[
                    { key: 'pos_billing', label: 'POS Billing & Checkout' },
                    { key: 'customer_manage', label: 'Customer Loyalty & Khata' },
                    { key: 'invoice_print', label: 'Reprint Receipts' },
                    { key: 'inventory_view', label: 'View Stock Catalog' },
                    { key: 'discount_approve', label: 'Apply Manual Discounts' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={newStaffPermissions.includes(perm.key as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStaffPermissions([...newStaffPermissions, perm.key as any]);
                          } else {
                            setNewStaffPermissions(newStaffPermissions.filter((p) => p !== perm.key));
                          }
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Save & Activate Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
