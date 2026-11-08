'use client';

import React from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { DevCoreTab } from '@/types/devcore';
import {
  LayoutGrid,
  Inbox,
  Store,
  ShieldCheck,
  Users,
  CreditCard,
  HardDrive,
  Activity,
  Settings,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

interface DevCoreSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function DevCoreSidebar({ isMobileOpen = false, onCloseMobile }: DevCoreSidebarProps) {
  const { activeTab, setActiveTab, logout, theme, toggleTheme, telemetry } = useDevCoreStore();

  const isDark = theme === 'dark';

  const dockItems: Array<{
    id: DevCoreTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    {
      id: 'inbox',
      label: 'Dev Inbox',
      icon: Inbox,
      badge: (telemetry.pendingApplicationsCount || 0) + (telemetry.unreadTicketsCount || 0),
    },
    { id: 'active-accounts', label: 'Active Stores', icon: Store },
    { id: 'permissions', label: 'Permissions (RBAC)', icon: ShieldCheck },
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'subscription-management', label: 'Subscriptions', icon: CreditCard },
    { id: 'storage-management', label: 'Storage & Backups', icon: HardDrive },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
  ];

  const handleSelect = (tab: DevCoreTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Floating Vertical Dock matching Reference Design */}
      <aside
        className={`fixed lg:sticky top-4 left-4 h-[calc(100vh-2rem)] w-18 z-50 rounded-[28px] border transition-all duration-300 flex flex-col justify-between items-center py-5 shadow-sm ${
          isDark
            ? 'bg-[#111717] border-[#232D2B] text-slate-300'
            : 'bg-white border-slate-200/80 text-slate-600'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-32 lg:translate-x-0'
        }`}
      >
        {/* Top: Light / Dark Mode Toggle Pill */}
        <div className="flex flex-col items-center gap-1.5 p-1 rounded-full bg-slate-100 border border-slate-200/60">
          <button
            onClick={() => {
              if (isDark) toggleTheme();
            }}
            title="Light Theme"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              !isDark
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (!isDark) toggleTheme();
            }}
            title="Dark Theme"
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              isDark
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center: Icon Stack */}
        <nav className="flex flex-col items-center gap-2">
          {dockItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                title={item.label}
                className={`relative group w-11 h-11 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'stroke-[2.5] text-white' : 'stroke-2'
                  }`}
                />

                {/* Badge indicator */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}

                {/* Tooltip on Hover */}
                <span className="absolute left-16 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition shadow-xl z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom: Help & Logout Actions */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => alert('OURSELL Dev Core Operating System v3.2.1 • Enterprise Build')}
            title="System Documentation & Help"
            className="w-10 h-10 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="w-10 h-10 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
