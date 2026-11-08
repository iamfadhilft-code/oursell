'use client';

import React, { useState, useEffect } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import {
  Settings,
  Shield,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Save,
  RotateCcw,
  Sliders,
  Bell,
  Database,
} from 'lucide-react';
import { seedInitialData } from '@/db/posDb';

export function DevCoreSettingsSection() {
  const { systemSettings, updateSystemSetting, purgeDatabase, setActionNotice, theme } = useDevCoreStore();
  const isDark = theme === 'dark';

  const getSetting = (key: string, fallback: string) => {
    const s = systemSettings.find((item) => item.key === key);
    return s ? s.value : fallback;
  };

  const [platformName, setPlatformName] = useState(
    getSetting('platform_name', 'OURSELL Retail Cloud Platform')
  );
  const [supportEmail, setSupportEmail] = useState(
    getSetting('support_email', 'support@oursell.internal')
  );
  const [currency, setCurrency] = useState(getSetting('default_currency', '₹'));
  const [sessionTimeout, setSessionTimeout] = useState(
    getSetting('session_timeout_minutes', '60')
  );
  const [enforcePasswordChange, setEnforcePasswordChange] = useState(
    getSetting('enforce_first_login_password_change', 'true') === 'true'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(
    getSetting('maintenance_mode', 'false') === 'true'
  );
  const [maintenanceAnnouncement, setMaintenanceAnnouncement] = useState(
    getSetting('maintenance_announcement', 'Scheduled maintenance window: all store terminals online.')
  );
  const [starterQuota, setStarterQuota] = useState(
    getSetting('default_starter_quota_mb', '250')
  );
  const [proQuota, setProQuota] = useState(getSetting('default_pro_quota_mb', '500'));
  const [enterpriseQuota, setEnterpriseQuota] = useState(
    getSetting('default_enterprise_quota_mb', '2000')
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPlatformName(getSetting('platform_name', 'OURSELL Retail Cloud Platform'));
    setSupportEmail(getSetting('support_email', 'support@oursell.internal'));
    setCurrency(getSetting('default_currency', '₹'));
    setSessionTimeout(getSetting('session_timeout_minutes', '60'));
    setEnforcePasswordChange(getSetting('enforce_first_login_password_change', 'true') === 'true');
    setMaintenanceMode(getSetting('maintenance_mode', 'false') === 'true');
    setMaintenanceAnnouncement(getSetting('maintenance_announcement', 'Scheduled maintenance window: all store terminals online.'));
    setStarterQuota(getSetting('default_starter_quota_mb', '250'));
    setProQuota(getSetting('default_pro_quota_mb', '500'));
    setEnterpriseQuota(getSetting('default_enterprise_quota_mb', '2000'));
  }, [systemSettings]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    await Promise.all([
      updateSystemSetting('platform_name', platformName),
      updateSystemSetting('support_email', supportEmail),
      updateSystemSetting('default_currency', currency),
      updateSystemSetting('session_timeout_minutes', sessionTimeout),
      updateSystemSetting('enforce_first_login_password_change', String(enforcePasswordChange)),
      updateSystemSetting('maintenance_mode', String(maintenanceMode)),
      updateSystemSetting('maintenance_announcement', maintenanceAnnouncement),
      updateSystemSetting('default_starter_quota_mb', starterQuota),
      updateSystemSetting('default_pro_quota_mb', proQuota),
      updateSystemSetting('default_enterprise_quota_mb', enterpriseQuota),
    ]);

    setIsSaving(false);
    setActionNotice({
      message: 'System settings & security configuration saved successfully.',
      type: 'success',
    });
  };

  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAllData = async () => {
    if (
      confirm(
        'WARNING: Permanent Action!\n\nThis will permanently delete all stores, products, orders, tickets, and data history from the database.\n\nOnly the Dev Core permanent Super Admin account and system configuration will be preserved.\n\nProceed to clear database?'
      )
    ) {
      setIsPurging(true);
      await purgeDatabase();
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Save All Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            System Global Policies & Security Settings
          </h2>
          <p className="text-xs text-slate-500">
            Control platform identity, default storage limits, session timeouts, and maintenance modes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPurging}
            onClick={handlePurgeAllData}
            className="px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-rose-200 dark:border-rose-900 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin' : ''}`} />
            <span>{isPurging ? 'Wiping...' : 'Clear All Stores & Data'}</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-full transition shadow-sm flex items-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Card 1: Platform Brand Identity & Regional */}
        <div
          className={`p-6 sm:p-8 rounded-[28px] border transition shadow-sm space-y-4 ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Settings className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Brand & Regional Settings</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Platform Display Name
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Central Support Email
            </label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Default Currency Symbol
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="₹">₹ (INR - Indian Rupee)</option>
              <option value="$">$ (USD - United States Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - British Pound)</option>
            </select>
          </div>
        </div>

        {/* Card 2: Security & Authentication Policies */}
        <div
          className={`p-6 sm:p-8 rounded-[28px] border transition shadow-sm space-y-4 ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Security & Session Policies</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Admin Session Inactivity Timeout (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Mandatory First-Login Password Change
                </span>
                <span className="text-[11px] text-slate-400">
                  Forces new administrators to replace initial passwords immediately.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enforcePasswordChange}
                onChange={(e) => setEnforcePasswordChange(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Global Maintenance Window
                </span>
                <span className="text-[11px] text-slate-400">
                  Displays maintenance banner on register checkouts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Storage Quota Tier Defaults */}
        <div
          className={`p-6 sm:p-8 rounded-[28px] border transition shadow-sm space-y-4 lg:col-span-2 ${
            isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Default Storage Allocations by Plan Tier
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Starter Tier Quota (MB)
              </label>
              <input
                type="number"
                value={starterQuota}
                onChange={(e) => setStarterQuota(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Professional Tier Quota (MB)
              </label>
              <input
                type="number"
                value={proQuota}
                onChange={(e) => setProQuota(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Enterprise Tier Quota (MB)
              </label>
              <input
                type="number"
                value={enterpriseQuota}
                onChange={(e) => setEnterpriseQuota(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none border transition ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Permanent Dev Core & Database Reset (Danger Zone) */}
        <div
          className={`p-6 sm:p-8 rounded-[28px] border transition shadow-sm space-y-4 lg:col-span-2 ${
            isDark ? 'bg-rose-950/10 border-rose-900/40' : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-rose-200/50 dark:border-rose-900/40">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="font-extrabold text-sm text-rose-900 dark:text-rose-300">
              Database Maintenance & Core Permanent Isolation
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                Clear all store history, transactions, orders, shifts, tickets, and accounts.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Dev Core Super Admin credentials (<code className="font-mono font-bold">devcore</code>), core system roles, and platform settings are strictly permanent and never erased.
              </p>
            </div>

            <button
              type="button"
              disabled={isPurging}
              onClick={handlePurgeAllData}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isPurging ? 'Wiping Database...' : 'Wipe All Stores & History'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
