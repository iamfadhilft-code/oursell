'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { usePosStore } from '@/store/usePosStore';
import { db } from '@/db/posDb';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Layers,
  Activity,
  Lock,
  ArrowRight,
  RefreshCw,
  LogOut,
  Store,
  Receipt,
  Package,
  Barcode,
  Users,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export default function DevCorePage() {
  const {
    isAuthenticated,
    adminUsername,
    applications,
    brands,
    isLoading,
    login,
    logout,
    loadData,
    acceptApplication,
    rejectApplication,
    toggleBrandStatus,
  } = useDevCoreStore();

  const setActiveBrand = usePosStore((s) => s.setActiveBrand);

  // Login form state (if visiting directly)
  const [usernameInput, setUsernameInput] = useState('ourselldev');
  const [passwordInput, setPasswordInput] = useState('oursell@6001');
  const [loginError, setLoginError] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'inbox' | 'brands' | 'telemetry'>('inbox');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Real Platform Telemetry metrics computed from actual DB records
  const [telemetry, setTelemetry] = useState({
    totalGmv: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalBarcodes: 0,
    totalCustomers: 0,
  });

  const fetchRealTelemetry = async () => {
    try {
      const orders = await db.orders.toArray();
      const gmv = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const prodCount = await db.products.count();
      const barCount = await db.barcodes.count();
      const custCount = await db.customers.count();

      setTelemetry({
        totalGmv: gmv,
        totalOrders: orders.length,
        totalProducts: prodCount,
        totalBarcodes: barCount,
        totalCustomers: custCount,
      });
    } catch (e) {
      console.warn('Could not read telemetry stats:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      fetchRealTelemetry();
    }
  }, [isAuthenticated, loadData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    const success = login(usernameInput, passwordInput);
    if (!success) {
      setLoginError(true);
    }
  };

  const handleAccept = async (appId: string) => {
    const res = await acceptApplication(appId);
    if (res.success) {
      setActionNotice(`Brand approved successfully! Assigned Brand ID: ${res.brandId}`);
      fetchRealTelemetry();
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Information verification incomplete';
    await rejectApplication(appId, reason);
    setActionNotice('Application marked as REJECTED');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const pendingApps = applications.filter((a) => a.status === 'PENDING');

  // IF NOT AUTHENTICATED: SHOW CLEAN ENTERPRISE SAAS LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Developer Administration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Platform Super-Admin authentication console
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Access Denied. Invalid credentials.</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Admin Username</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Sign In to Dev Console
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1 border border-slate-200">
            <span className="font-semibold text-slate-900 block text-[11px] uppercase tracking-wider">
              Developer Credentials:
            </span>
            <p className="font-mono text-[11px]">User: <strong className="text-slate-900">ourselldev</strong></p>
            <p className="font-mono text-[11px]">Pass: <strong className="text-slate-900">oursell@6001</strong></p>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition">
              ← Return to Main Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED CLEAN SAAS DEVELOPER DASHBOARD
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col select-none">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                OURSELL DEV CORE
              </span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                SUPER-ADMIN
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Operator: <strong className="text-slate-700">{adminUsername}</strong>
            </span>
          </div>
        </div>

        {/* Global Metric Pills */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">Brands: </span>
            <strong className="text-slate-900 font-bold">{brands.length}</strong>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">Pending Review: </span>
            <strong className="text-amber-600 font-bold">{pendingApps.length}</strong>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500">Total Outlets: </span>
            <strong className="text-teal-700 font-bold">
              {brands.reduce((sum, b) => sum + (b.outletCount || 1), 0)}
            </strong>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadData();
              fetchRealTelemetry();
            }}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            title="Refresh Database State"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/pos/register"
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <span>Launch POS Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition border border-slate-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 pb-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Applications Inbox</span>
            {pendingApps.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'brands'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Active Tenant Fleet</span>
            <span className="text-[11px] opacity-80">({brands.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('telemetry');
              fetchRealTelemetry();
            }}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Platform Telemetry & GMV</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pending Brand Applications</h2>
              <p className="text-xs text-slate-500">
                Review retail business submissions and approve store accounts.
              </p>
            </div>

            {pendingApps.length === 0 ? (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending applications. All onboarding reviews are complete.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 space-y-4 transition shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{app.brandName}</h3>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                            {app.businessCategory}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Owner: <strong className="text-slate-800">{app.ownerName}</strong>
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email:</span>
                        <span className="text-slate-800 truncate block">{app.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Phone:</span>
                        <span className="text-slate-800">{app.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Requested Username:</span>
                        <span className="text-teal-700 font-bold">{app.requestedUsername}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Scale:</span>
                        <span className="text-slate-800">
                          {app.outletCount} store(s) / {app.terminalCount} POS
                        </span>
                      </div>
                    </div>

                    {app.businessAddress && (
                      <p className="text-[11px] text-slate-500">
                        Address: {app.businessAddress}
                      </p>
                    )}

                    {/* Action Buttons: Accept / Reject */}
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => handleReject(app.id)}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleAccept(app.id)}
                        className="flex-[2] py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Brand</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE TENANT FLEET */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Retail Tenancies</h2>
              <p className="text-xs text-slate-500">
                View all configured brand accounts, toggle operational status, or enter store POS.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Brand / Store</th>
                    <th className="p-4">Brand ID</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Plan Tier</th>
                    <th className="p-4">Outlets</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">
                        {brand.brandName}
                        <span className="text-[11px] text-slate-500 block font-normal font-mono">
                          user: {brand.username} • {brand.email}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-teal-700">{brand.brandId}</td>
                      <td className="p-4 text-slate-600">{brand.businessCategory}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 border border-slate-200">
                          {brand.planTier}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-mono">
                        {brand.outletCount} store(s)
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            brand.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {brand.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => toggleBrandStatus(brand.brandId)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                            brand.status === 'ACTIVE'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {brand.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveBrand(brand.brandId, brand.brandName);
                            window.location.href = '/pos/register';
                          }}
                          className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
                        >
                          Enter POS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM TELEMETRY & LIVE STATS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Telemetry & Metrics</h2>
              <p className="text-xs text-slate-500">
                Live database aggregations across registered tenancies and POS terminals.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Total Platform GMV</span>
                  <Receipt className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  ₹{telemetry.totalGmv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500">
                  Computed from {telemetry.totalOrders} completed orders
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Catalog Products</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {telemetry.totalProducts} Items
                </div>
                <span className="text-[11px] text-slate-500">Active stock in database</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Barcodes Indexed</span>
                  <Barcode className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {telemetry.totalBarcodes} Codes
                </div>
                <span className="text-[11px] text-slate-500">EAN-13, EAN-8 & Code 128</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs">
                  <span>Registered Customers</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {telemetry.totalCustomers} Accounts
                </div>
                <span className="text-[11px] text-slate-500">With credit ledger support</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
