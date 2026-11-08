'use client';
import React, { useEffect, useState, useRef } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { translations } from '@/lib/i18n';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import {
  Wifi,
  WifiOff,
  Bell,
  User,
  ShieldCheck,
  Sparkles,
  Lock,
  RefreshCw,
  Cloud,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export function PosHeader() {
  const {
    brandName,
    activeBrandId,
    activeCashier,
    isOnline,
    isNetworkConnected,
    isSyncing,
    pendingSyncCount,
    lastSyncAt,
    syncError,
    setOnlineStatus,
    syncNow,
    language,
    setLanguage,
  } = usePosStore();
  const { isAdmin, roleBadge } = useRoleAccess();
  const { planId, planName, checkLanguage } = usePlanAccess(activeBrandId);

  const t = translations[language];
  const [timeStr, setTimeStr] = useState<string>('');
  const [isLangGateOpen, setIsLangGateOpen] = useState(false);
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const syncMenuRef = useRef<HTMLDivElement>(null);

  // Close sync menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (syncMenuRef.current && !syncMenuRef.current.contains(e.target as Node)) {
        setIsSyncMenuOpen(false);
      }
    };
    if (isSyncMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSyncMenuOpen]);

  const showToast = (text: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 3500);
  };

  const handleToggleOnlineOffline = async () => {
    if (isOnline) {
      const res = await setOnlineStatus(false);
      showToast(res.message || 'Switched to Offline Mode. All orders stored locally in IndexedDB.', 'warn');
    } else {
      const res = await setOnlineStatus(true);
      if (res.success) {
        showToast(res.message || 'Switched to Online Mode. Cloud sync active.', 'success');
      } else {
        showToast(res.message || 'Cannot switch to Online: No physical network detected.', 'warn');
      }
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    const res = await syncNow();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warn');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectLanguage = (targetLang: 'en' | 'ml' | 'ar') => {
    const langCheck = checkLanguage(targetLang);
    if (!langCheck.allowed) {
      setIsLangGateOpen(true);
      return;
    }
    setLanguage(targetLang);
  };

  const getPlanBadgeColor = () => {
    if (planId === 'enterprise') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (planId === 'professional') {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      <header className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
        {/* Left: Brand, Outlet Info & Active Plan Badge */}
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">
            OURSELL POS
          </span>
          <span className="text-slate-300 font-light">•</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">{brandName}</span>
            <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
              {activeBrandId}
            </span>
            {/* Active Subscription Plan Badge - Only visible to Store Admin */}
            {isAdmin && (
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${getPlanBadgeColor()}`}
                title={`Active Plan: ${planName} (Admin)`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {planName}
              </span>
            )}
          </div>
        </div>

        {/* Right: Live Clock, Online Status, Language, Cashier */}
        <div className="flex items-center gap-4 text-xs">
          {/* Live Clock */}
          <span className="font-mono text-slate-500 font-medium tracking-wide">
            {timeStr}
          </span>

          {/* Online / Offline Status Badge & Quick Sync Menu */}
          <div className="relative" ref={syncMenuRef}>
            <div className="flex items-center">
              <button
                onClick={handleToggleOnlineOffline}
                title={
                  isOnline
                    ? 'Online mode active. Click to switch to Offline Mode'
                    : 'Offline mode active. Click to switch to Online Mode & Sync'
                }
                disabled={isSyncing}
                className={`px-2.5 py-1 rounded-l-full font-bold text-[11px] flex items-center gap-1.5 border transition ${
                  isSyncing
                    ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                    : isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-teal-600 animate-spin" />
                    <span>Syncing{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : '...'}</span>
                  </>
                ) : isOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Wifi className="w-3 h-3 text-emerald-600" />
                    <span>{t.online}</span>
                    {pendingSyncCount > 0 && (
                      <span className="ml-0.5 bg-emerald-200/80 text-emerald-800 text-[10px] font-mono px-1 rounded-full">
                        {pendingSyncCount}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <WifiOff className="w-3 h-3 text-amber-600" />
                    <span>{t.offline}</span>
                    {pendingSyncCount > 0 && (
                      <span className="ml-0.5 bg-amber-200 text-amber-900 text-[10px] font-mono px-1.5 rounded-full font-extrabold">
                        {pendingSyncCount}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Popover toggle chevron */}
              <button
                onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
                title="View Cloud Sync & Connection Details"
                className={`px-1.5 py-1 rounded-r-full font-bold text-[11px] flex items-center border-y border-r transition ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${isSyncMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Popover */}
            {isSyncMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-teal-600" />
                    <span className="font-extrabold text-xs text-slate-900">Network & Cloud Sync</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Connection Status Items */}
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Wi-Fi / Internet:</span>
                    <span className="font-semibold flex items-center gap-1">
                      {isNetworkConnected ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-emerald-700">Connected</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          <span className="text-amber-700">Disconnected</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Local Queue (IndexedDB):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {pendingSyncCount} pending
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Synced:</span>
                    <span className="font-mono text-slate-600">
                      {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>

                  {syncError && (
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-800 text-[10px] flex items-center gap-1.5 border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">{syncError}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing || !isNetworkConnected}
                    className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Synchronizing...' : 'Sync Pending to Cloud'}</span>
                  </button>

                  <button
                    onClick={handleToggleOnlineOffline}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                      isOnline
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isOnline ? (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Switch to Offline Mode</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Switch to Online Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language selector chips */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 items-center">
            <button
              onClick={() => handleSelectLanguage('en')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                language === 'en' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleSelectLanguage('ml')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                language === 'ml' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              മലയാളം
              {planId === 'starter' && <Lock className="w-2 h-2 text-slate-400" />}
            </button>
            <button
              onClick={() => handleSelectLanguage('ar')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 ${
                language === 'ar' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
              }`}
            >
              العربية
              {planId === 'starter' && <Lock className="w-2 h-2 text-slate-400" />}
            </button>
          </div>

          {/* Notification Bell */}
          <button
            className="relative p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-teal-500 rounded-full" />
          </button>

          <div className="w-[1px] h-5 bg-slate-200" />

          {/* Cashier / Role Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                isAdmin ? 'bg-slate-900 text-white' : 'bg-teal-100 text-teal-800'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-[#C4F12A]" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                {activeCashier.name}
              </span>
              <span
                className={`text-[9px] block uppercase font-mono font-bold leading-none mt-0.5 ${
                  isAdmin ? 'text-slate-900' : 'text-teal-700'
                }`}
              >
                {roleBadge}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Connection & Sync Status Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xl border flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/30'
              : toastMsg.type === 'warn'
              ? 'bg-slate-900 text-amber-400 border-amber-500/30'
              : 'bg-slate-900 text-slate-200 border-slate-700'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <PlanGateModal
        isOpen={isLangGateOpen}
        onClose={() => setIsLangGateOpen(false)}
        title="Malayalam & Arabic Language Access"
        description="Multi-lingual interface support (Malayalam and Arabic with RTL layout) is enabled on the Professional and Enterprise subscription plans."
        requiredPlan="Professional"
        currentPlan={planName}
      />
    </>
  );
}
