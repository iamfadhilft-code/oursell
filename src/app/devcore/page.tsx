'use client';

import React, { useState, useEffect } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { DevCoreSidebar } from '@/components/devcore/DevCoreSidebar';
import { DevCoreHeader } from '@/components/devcore/DevCoreHeader';
import { DevCoreLoginCard } from '@/components/devcore/DevCoreLoginCard';
import { DevCoreFirstLoginModal } from '@/components/devcore/DevCoreFirstLoginModal';
import { DevCoreCreateStoreModal } from '@/components/devcore/DevCoreCreateStoreModal';

import { DevCoreOverviewSection } from '@/components/devcore/DevCoreOverviewSection';
import { DevCoreInboxSection } from '@/components/devcore/DevCoreInboxSection';
import { DevCoreAccountsSection } from '@/components/devcore/DevCoreAccountsSection';
import { DevCorePermissionsSection } from '@/components/devcore/DevCorePermissionsSection';
import { DevCoreUsersSection } from '@/components/devcore/DevCoreUsersSection';
import { DevCoreSubscriptionsSection } from '@/components/devcore/DevCoreSubscriptionsSection';
import { DevCoreStorageSection } from '@/components/devcore/DevCoreStorageSection';
import { DevCoreActivityLogsSection } from '@/components/devcore/DevCoreActivityLogsSection';
import { DevCoreSettingsSection } from '@/components/devcore/DevCoreSettingsSection';

export default function DevCorePage() {
  const { isAuthenticated, activeTab, loadAllData, checkSession, theme } = useDevCoreStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Reset any legacy blocking modal state so user accesses dashboard directly
    useDevCoreStore.setState({ isFirstLoginModalOpen: false, mustChangePassword: false });
    // Check session or load initial datasets on mount
    checkSession().then((authenticated) => {
      if (authenticated) {
        loadAllData();
      }
    });
  }, [checkSession, loadAllData]);

  // IF NOT AUTHENTICATED: Display pristine Dev Core Admin Sign-In Console
  if (!isAuthenticated) {
    return <DevCoreLoginCard />;
  }

  const isDark = theme === 'dark';

  // AUTHENTICATED: DEV CORE ADMIN CONTROL CENTRE
  return (
    <div
      className={`min-h-screen font-sans flex select-none transition-colors duration-200 ${
        isDark ? 'bg-[#0B0F12] text-[#F8FAFC]' : 'bg-[#F4F6F8] text-slate-900'
      }`}
    >
      {/* Compulsory First-Login Password Change Modal */}
      <DevCoreFirstLoginModal />

      {/* Global Dev Core Direct Store Creation & Auto-Activation Modal */}
      <DevCoreCreateStoreModal />

      {/* Floating Left Dock Navigation (All 8 Sections + Overview) */}
      <div className="hidden lg:block shrink-0 pl-4 py-4">
        <DevCoreSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <div className="lg:hidden">
        <DevCoreSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Control Centre Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        <DevCoreHeader onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {activeTab === 'overview' && <DevCoreOverviewSection />}
          {activeTab === 'inbox' && <DevCoreInboxSection />}
          {activeTab === 'active-accounts' && <DevCoreAccountsSection />}
          {activeTab === 'permissions' && <DevCorePermissionsSection />}
          {activeTab === 'user-management' && <DevCoreUsersSection />}
          {activeTab === 'subscription-management' && <DevCoreSubscriptionsSection />}
          {activeTab === 'storage-management' && <DevCoreStorageSection />}
          {activeTab === 'activity-logs' && <DevCoreActivityLogsSection />}
          {activeTab === 'system-settings' && <DevCoreSettingsSection />}
        </main>

        {/* Global Footer */}
        <footer
          className={`px-6 py-6 border-t text-center text-[10px] font-mono transition-colors ${
            isDark
              ? 'border-[#1D2625] text-slate-500 bg-[#0B0F12]'
              : 'border-slate-200/80 text-slate-400 bg-[#F4F6F8]'
          }`}
        >
          OURSELL DEV CORE CONTROL CENTRE • ENTERPRISE SUPER-ADMIN CONSOLE • MULTI-STORE TENANT ARCHITECTURE
        </footer>
      </div>
    </div>
  );
}
