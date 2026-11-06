'use client';
import React, { useEffect, useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { translations } from '@/lib/i18n';
import { Wifi, WifiOff, Bell, User } from 'lucide-react';

export function PosHeader() {
  const {
    brandName,
    activeBrandId,
    activeCashier,
    isOnline,
    setOnlineStatus,
    language,
    setLanguage,
  } = usePosStore();

  const t = translations[language];
  const [timeStr, setTimeStr] = useState<string>('');

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

  return (
    <header className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Brand & Outlet Info */}
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-slate-900 tracking-tight text-sm">
          OURSELL POS
        </span>
        <span className="text-slate-300 font-light">•</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700">{brandName}</span>
          <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
            {activeBrandId}
          </span>
        </div>
      </div>

      {/* Right: Live Clock, Online Status, Language, Cashier */}
      <div className="flex items-center gap-4 text-xs">
        {/* Live Clock */}
        <span className="font-mono text-slate-500 font-medium tracking-wide">
          {timeStr}
        </span>

        {/* Online / Offline Pill */}
        <button
          onClick={() => setOnlineStatus(!isOnline)}
          title="Toggle Online / Offline Network Simulator"
          className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 border transition ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
          }`}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3 h-3 text-emerald-600" />
              <span>{t.online}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>{t.offline}</span>
            </>
          )}
        </button>

        {/* Language selector chips */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
              language === 'en' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ml')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
              language === 'ml' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            മലയാളം
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
              language === 'ar' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            العربية
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

        {/* Cashier Badge */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px]">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-[11px] leading-tight">
              {activeCashier.name}
            </span>
            <span className="text-[9px] text-slate-400 block uppercase font-semibold">
              {activeCashier.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
