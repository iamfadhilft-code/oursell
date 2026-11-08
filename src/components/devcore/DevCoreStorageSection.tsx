'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { StoreStorageQuota } from '@/types/devcore';
import {
  HardDrive,
  Database,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Package,
  Receipt,
  Barcode,
  Users,
  X,
  RefreshCw,
} from 'lucide-react';

export function DevCoreStorageSection() {
  const { storageQuotas, adjustStorageLimit, backupStoreSnapshot, setActionNotice, theme } =
    useDevCoreStore();

  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [editingStorage, setEditingStorage] = useState<StoreStorageQuota | null>(null);
  const [newQuotaInput, setNewQuotaInput] = useState<number>(500);
  const [isBackingUp, setIsBackingUp] = useState<string | null>(null);

  const totalUsedMb = storageQuotas.reduce((sum, s) => sum + (s.storageUsedMb || 0), 0);
  const totalAllocatedMb = storageQuotas.reduce((sum, s) => sum + (s.storageLimitMb || 0), 0);
  const totalProducts = storageQuotas.reduce((sum, s) => sum + (s.productCount || 0), 0);
  const totalOrders = storageQuotas.reduce((sum, s) => sum + (s.ordersCount || 0), 0);

  const filteredQuotas = storageQuotas.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.storeName?.toLowerCase().includes(q) || s.storeId?.toLowerCase().includes(q);
  });

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStorage) return;

    await adjustStorageLimit(editingStorage.storeId, Number(newQuotaInput));
    setEditingStorage(null);
    setActionNotice({
      message: `Storage limit for ${editingStorage.storeName} set to ${newQuotaInput} MB.`,
      type: 'success',
    });
  };

  const handleDownloadBackup = async (storeId: string, storeName: string) => {
    setIsBackingUp(storeId);
    try {
      const jsonStr = await backupStoreSnapshot(storeId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${storeId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionNotice({
        message: `Database backup for "${storeName}" exported successfully.`,
        type: 'success',
      });
    } catch {
      setActionNotice({
        message: `Failed to export backup for "${storeName}".`,
        type: 'error',
      });
    } finally {
      setIsBackingUp(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-slate-400 block">TOTAL STORAGE USED</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {totalUsedMb.toFixed(1)} MB
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            of {totalAllocatedMb} MB allocated
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-emerald-600 block">CATALOG INVENTORY</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block tracking-tight">
            {totalProducts.toLocaleString()} Items
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            across active store nodes
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-slate-500 block">REGISTER TRANSACTIONS</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            {totalOrders.toLocaleString()} Orders
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            synced to local database
          </span>
        </div>

        <div
          className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <span className="text-xs font-bold text-emerald-600 block">ENGINE STATUS</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
            Dexie v5
          </span>
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            IndexedDB Local Fast Engine
          </span>
        </div>
      </div>

      {/* Main Quotas Table */}
      <div
        className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
        }`}
      >
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
          }`}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by store name..."
              className={`pl-8 pr-3 py-1.5 rounded-full text-xs outline-none border transition w-64 ${
                isDark
                  ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>
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
                <th className="py-3 px-6">Store & Node</th>
                <th className="py-3 px-6">Storage Quota Utilization</th>
                <th className="py-3 px-6">Indexed Counts</th>
                <th className="py-3 px-6">Last Backup</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
              {filteredQuotas.map((item) => {
                const used = item.storageUsedMb || 0;
                const limit = item.storageLimitMb || 100;
                const percent = Math.min(100, Math.round((used / limit) * 100));

                return (
                  <tr
                    key={item.id}
                    className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                  >
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {item.storeName}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-600">/{item.storeId}</span>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="w-48 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>{used.toFixed(1)} MB used</span>
                          <span>{percent}% of {limit} MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full ${
                              percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                      <span>{item.productCount || 0} Products</span> •{' '}
                      <span>{item.ordersCount || 0} Orders</span>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                      {item.lastBackupAt ? new Date(item.lastBackupAt).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingStorage(item);
                            setNewQuotaInput(limit);
                          }}
                          className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Adjust Quota</span>
                        </button>

                        <button
                          disabled={isBackingUp === item.storeId}
                          onClick={() => handleDownloadBackup(item.storeId, item.storeName)}
                          className="px-3 py-1 rounded-full bg-slate-950 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Download className={`w-3 h-3 ${isBackingUp === item.storeId ? 'animate-bounce' : ''}`} />
                          <span>Export Backup</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST QUOTA MODAL */}
      {editingStorage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Adjust Storage Quota</h3>
              <button
                onClick={() => setEditingStorage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set disk quota for <strong className="text-slate-900 dark:text-white">{editingStorage.storeName}</strong>.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Storage Allocation (Megabytes)
                </label>
                <input
                  type="number"
                  min={50}
                  max={10000}
                  step={50}
                  required
                  value={newQuotaInput}
                  onChange={(e) => setNewQuotaInput(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingStorage(null)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Save Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
