'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { DevCoreTab } from '@/types/devcore';
import {
  Menu,
  Search,
  Bell,
  Info,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  User,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface DevCoreHeaderProps {
  onOpenMobileMenu: () => void;
}

export function DevCoreHeader({ onOpenMobileMenu }: DevCoreHeaderProps) {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    telemetry,
    loadAllData,
    isLoading,
    actionNotice,
    theme,
    logout,
  } = useDevCoreStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const isDark = theme === 'dark';

  const totalInboxNotifications = (telemetry.pendingApplicationsCount || 0) + (telemetry.unreadTicketsCount || 0);

  const navTabs: Array<{ id: DevCoreTab; label: string; badge?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'inbox', label: 'Inbox', badge: totalInboxNotifications },
    { id: 'active-accounts', label: 'Accounts' },
    { id: 'permissions', label: 'Permissions' },
    { id: 'user-management', label: 'Users' },
    { id: 'subscription-management', label: 'Subscriptions' },
    { id: 'storage-management', label: 'Storage' },
    { id: 'activity-logs', label: 'Logs' },
    { id: 'system-settings', label: 'Settings' },
  ];

  return (
    <>
      <header
        className={`w-full px-4 sm:px-8 py-3 transition-colors duration-200 ${
          isDark
            ? 'bg-[#0B0F12]/90 border-b border-[#1D2625]'
            : 'bg-[#F4F6F8]/90'
        }`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* LEFT: Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className={`lg:hidden p-2 rounded-2xl border transition cursor-pointer ${
                isDark
                  ? 'bg-[#121817] border-[#232D2B] text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700 shadow-xs'
              }`}
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              {/* Brand Icon Emblem */}
              <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-base shadow-sm group-hover:scale-105 transition-transform">
                <span className="tracking-tighter">O</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Oursell
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#C4F12A] text-slate-950 text-[9px] font-black uppercase tracking-wider">
                    Core
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Floating Capsule Pill Nav (Matches Reference Design) */}
          <nav
            className={`hidden xl:flex items-center gap-1 p-1.5 rounded-full border shadow-xs transition-colors ${
              isDark
                ? 'bg-[#111717] border-[#232D2B]'
                : 'bg-white border-slate-200/80'
            }`}
          >
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-white shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isActive
                          ? isDark
                            ? 'bg-slate-950 text-emerald-400'
                            : 'bg-emerald-400 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Action Icons & Profile Card */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              title="Search System"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer ${
                isDark
                  ? 'bg-[#111717] border-[#232D2B] text-slate-300 hover:text-white hover:border-[#384744]'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-300 shadow-xs'
              }`}
            >
              <Search className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => setActiveTab('inbox')}
              title={`${totalInboxNotifications} notifications (${telemetry.pendingApplicationsCount || 0} shop requests pending)`}
              className={`relative w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer ${
                isDark
                  ? 'bg-[#111717] border-[#232D2B] text-slate-300 hover:text-white hover:border-[#384744]'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-300 shadow-xs'
              }`}
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              {totalInboxNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111717]" />
              )}
            </button>

            {/* System Info Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              title="Dev Core System Specifications"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer ${
                isDark
                  ? 'bg-[#111717] border-[#232D2B] text-slate-300 hover:text-white hover:border-[#384744]'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:text-slate-950 hover:border-slate-300 shadow-xs'
              }`}
            >
              <Info className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Data Refresh Spinner */}
            <button
              onClick={() => loadAllData()}
              disabled={isLoading}
              title="Refresh Platform Datasets"
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-[#111717] border-[#232D2B] text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200/80 text-slate-700 hover:text-slate-950 shadow-xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* Profile Pill (devcore Super Admin) */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#111717] border-[#232D2B] hover:border-[#384744]'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Profile Avatar with Emerald Gradient */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  DC
                </div>

                <div className="hidden sm:block text-left leading-tight">
                  <div className={`text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    Dev Core
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Super Admin
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 stroke-[2.5]" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150 ${
                    isDark
                      ? 'bg-[#111717] border-[#232D2B] text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-950 dark:text-white">Dev Core Super Admin</p>
                    <p className="text-[11px] text-slate-400 font-mono">devcore@oursell.internal</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Permanent System Account</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('system-settings');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <span>System Settings</span>
                      <span className="text-[10px] text-slate-400 font-mono">v3.2</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('permissions');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <span>RBAC Matrix</span>
                      <span className="text-[10px] text-emerald-500 font-bold">Root</span>
                    </button>

                    <Link
                      href="/"
                      target="_blank"
                      className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-between"
                    >
                      <span>Open Customer POS</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out Dev Core</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="max-w-[1600px] mx-auto mt-2">
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-xs animate-in slide-in-from-top-1 duration-200 ${
                actionNotice.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-500/40 dark:text-rose-200'
                  : actionNotice.type === 'info'
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-500/40 dark:text-blue-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-500/40 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {actionNotice.type === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-medium">{actionNotice.message}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  O
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">OURSELL Control Centre</h3>
                  <p className="text-[11px] text-slate-400">System Architecture & Node Metadata</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Environment</span>
                <span className="font-bold text-emerald-500">Production Enterprise</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-bold">Dexie.js IndexedDB v5</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Super Admin User</span>
                <span className="font-bold">devcore (ID #1)</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Cryptography</span>
                <span className="font-bold">SHA-256 + Salt (SubtleCrypto)</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-slate-400">Active Stores</span>
                <span className="font-bold">{telemetry.totalStores} tenants</span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
