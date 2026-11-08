'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { Brand, BrandApplication } from '@/types/pos';
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  HardDrive,
  Users,
  Building2,
  CreditCard,
  FileCheck,
  X,
  Trash2,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { DevCoreCreateStoreModal } from './DevCoreCreateStoreModal';

export function DevCoreAccountsSection() {
  const {
    activeAccounts,
    applications,
    storageQuotas,
    toggleStoreStatus,
    deleteStore,
    acceptApplication,
    rejectApplication,
    setActiveTab,
    openCreateStoreModal,
    theme,
  } = useDevCoreStore();

  const isDark = theme === 'dark';

  const [activeSubTab, setActiveSubTab] = useState<'STORES' | 'APPLICATIONS'>('STORES');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'Starter' | 'Professional' | 'Enterprise'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [suspendingBrand, setSuspendingBrand] = useState<Brand | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Pending Applications
  const pendingApps = applications.filter((a) => a.status === 'PENDING');

  // Filtered Stores
  const filteredBrands = activeAccounts.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.brandName?.toLowerCase().includes(q) ||
      b.brandId?.toLowerCase().includes(q) ||
      b.ownerName?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (planFilter !== 'ALL' && b.planTier !== planFilter) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredBrands.length / pageSize) || 1;
  const paginatedBrands = filteredBrands.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleConfirmSuspend = async () => {
    if (!suspendingBrand) return;
    await toggleStoreStatus(suspendingBrand.brandId, suspendReason);
    setSuspendingBrand(null);
    setSuspendReason('');
  };

  const handleApproveApp = async (appId: string) => {
    await acceptApplication(appId);
  };

  const handleRejectApp = async (appId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason !== null) {
      await rejectApplication(appId, reason || undefined);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-slate-400 block">REGISTERED STORES</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {activeAccounts.length}
          </span>
        </div>

        {/* Active Stores */}
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-emerald-600 block">ACTIVE STORES</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block tracking-tight">
            {activeAccounts.filter((b) => b.status === 'ACTIVE').length}
          </span>
        </div>

        {/* Suspended Stores */}
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-amber-500 block">SUSPENDED STORES</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 block tracking-tight">
            {activeAccounts.filter((b) => b.status === 'SUSPENDED').length}
          </span>
        </div>

        {/* Pending Queue */}
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 block">ONBOARDING QUEUE</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {pendingApps.length}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div
        className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
        }`}
      >
        {/* Top Tab Bar: Registered Stores vs Onboarding Applications */}
        <div
          className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('STORES')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeSubTab === 'STORES'
                  ? isDark
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'bg-slate-950 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-950'
              }`}
            >
              Registered Stores ({activeAccounts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('APPLICATIONS')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'APPLICATIONS'
                  ? isDark
                    ? 'bg-[#C4F12A] text-slate-950 shadow-xs'
                    : 'bg-slate-950 text-white shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Onboarding Queue</span>
              {pendingApps.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-mono">
                  {pendingApps.length}
                </span>
              )}
            </button>
          </div>

          {/* Search & Filter Bar (Only for Stores tab) */}
          {activeSubTab === 'STORES' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openCreateStoreModal()}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Store</span>
              </button>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search store name, ID..."
                  className={`pl-8 pr-3 py-1.5 rounded-full text-xs outline-none transition border ${
                    isDark
                      ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                  }`}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs outline-none border ${
                  isDark
                    ? 'bg-[#080B0B] border-[#232D2B] text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs outline-none border ${
                  isDark
                    ? 'bg-[#080B0B] border-[#232D2B] text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="ALL">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: REGISTERED STORES TABLE */}
        {activeSubTab === 'STORES' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                      isDark
                        ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                        : 'border-slate-200/80 bg-slate-50 text-slate-500'
                    }`}
                  >
                    <th className="py-3 px-6">Store Name & Vertical</th>
                    <th className="py-3 px-6">Owner / Contact</th>
                    <th className="py-3 px-6">Store ID / Slug</th>
                    <th className="py-3 px-6">Plan Tier</th>
                    <th className="py-3 px-6">Storage Quota</th>
                    <th className="py-3 px-6">Registered</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
                  {paginatedBrands.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No store accounts match the current search and filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedBrands.map((brand) => {
                      const quota = storageQuotas.find((s) => s.storeId === brand.brandId);
                      const isSuspended = brand.status === 'SUSPENDED';

                      return (
                        <tr
                          key={brand.id}
                          className={`transition ${
                            isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                                <Store className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                                  {brand.brandName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {brand.businessCategory || 'General'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-6">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block">
                              {brand.ownerName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">{brand.email}</span>
                          </td>

                          <td className="py-3.5 px-6">
                            <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                              /{brand.brandId}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">Node ID #{brand.id}</span>
                          </td>

                          <td className="py-3.5 px-6">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                brand.planTier === 'Enterprise'
                                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
                                  : brand.planTier === 'Professional'
                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {brand.planTier}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                            {quota ? (
                              <span>
                                {quota.storageUsedMb.toFixed(1)} / {quota.storageLimitMb} MB
                              </span>
                            ) : (
                              <span>Default (100 MB)</span>
                            )}
                          </td>

                          <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                            {new Date(brand.createdAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          <td className="py-3.5 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isSuspended
                                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSuspended ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span>{isSuspended ? 'Suspended' : 'Active'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                onClick={() => setSelectedBrand(brand)}
                                title="View Store Dossier"
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Open Store */}
                              <Link
                                href={`/login/${brand.brandId}`}
                                target="_blank"
                                title="Open Store Terminal Register"
                                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>

                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => {
                                  if (isSuspended) {
                                    toggleStoreStatus(brand.brandId);
                                  } else {
                                    setSuspendingBrand(brand);
                                  }
                                }}
                                title={isSuspended ? 'Reactivate Store' : 'Suspend Store Account'}
                                className={`p-1.5 rounded-xl transition cursor-pointer ${
                                  isSuspended
                                    ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                    : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                }`}
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>

                              {/* Delete Store */}
                              <button
                                onClick={async () => {
                                  if (confirm(`Permanently delete store "${brand.brandName}" (${brand.brandId}) and all associated records?`)) {
                                    await deleteStore(brand.brandId);
                                  }
                                }}
                                title="Delete Store Permanently"
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div
              className={`p-4 border-t flex items-center justify-between text-xs text-slate-500 ${
                isDark ? 'border-[#232D2B]' : 'border-slate-200/80 bg-slate-50/50'
              }`}
            >
              <span>
                Showing {Math.min(filteredBrands.length, (currentPage - 1) * pageSize + 1)}–
                {Math.min(filteredBrands.length, currentPage * pageSize)} of {filteredBrands.length} stores
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ONBOARDING APPLICATIONS QUEUE */}
        {activeSubTab === 'APPLICATIONS' && (
          <div>
            <div
              className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                isDark ? 'border-[#232D2B] bg-[#141C1A]' : 'border-slate-200/80 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-slate-900 dark:text-white">
                  Shop Onboarding Applications Queue
                </span>
                <span className="text-slate-400">
                  ({pendingApps.length} pending review)
                </span>
              </div>
              <button
                onClick={() => setActiveTab('inbox')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <span>Open in Dev Core Inbox</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                    isDark
                      ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                      : 'border-slate-200/80 bg-slate-50 text-slate-500'
                  }`}
                >
                  <th className="py-3 px-6">Brand Name</th>
                  <th className="py-3 px-6">Applicant Contact</th>
                  <th className="py-3 px-6">Requested Slug</th>
                  <th className="py-3 px-6">Plan Requested</th>
                  <th className="py-3 px-6">Applied Date</th>
                  <th className="py-3 px-6">Decision Status</th>
                  <th className="py-3 px-6 text-right">Dev Core Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
                {pendingApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No onboarding applications awaiting review.
                    </td>
                  </tr>
                ) : (
                  pendingApps.map((app) => (
                    <tr
                      key={app.id}
                      className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                        {app.brandName}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="block font-medium text-slate-800 dark:text-slate-200">
                          {app.ownerName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{app.email}</span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-emerald-600">
                        /{app.requestedUsername}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                          {app.businessCategory || 'Standard'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 text-[10px] font-bold">
                          PENDING
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveApp(app.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-full transition cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectApp(app.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-[10px] uppercase rounded-full transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {/* MODAL: STORE DETAILS DOSSIER */}
      {selectedBrand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">{selectedBrand.brandName}</h3>
                  <span className="text-xs font-mono text-emerald-600">/{selectedBrand.brandId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBrand(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Store Owner</span>
                <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">{selectedBrand.ownerName}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Email</span>
                <span className="font-mono text-slate-800 dark:text-white mt-0.5 block truncate">{selectedBrand.email}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Plan Tier</span>
                <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">{selectedBrand.planTier}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className={`font-bold mt-0.5 block ${selectedBrand.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedBrand.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Link
                href={`/login/${selectedBrand.brandId}`}
                target="_blank"
                className="flex-1 py-3 bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-2"
              >
                <span>Launch Terminal</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedBrand(null)}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPEND CONFIRMATION */}
      {suspendingBrand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-base">Suspend Store Account?</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Suspending <strong className="text-slate-900 dark:text-white">{suspendingBrand.brandName}</strong> will immediately disable customer checkouts and staff login sessions for this tenant.
            </p>

            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension (optional audit trail note)..."
              className={`w-full p-3 rounded-2xl text-xs outline-none border ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSuspendingBrand(null)}
                className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
