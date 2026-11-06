'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { translations } from '@/lib/i18n';
import {
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  Users,
  Clock,
  BarChart3,
  UserCheck,
  Wallet,
  Settings,
  ShieldCheck,
  Languages,
  LogOut,
  MonitorPlay,
  Barcode,
} from 'lucide-react';

export function PosSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, activeCashier } = usePosStore();
  const t = translations[language];

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('ml');
    else if (language === 'ml') setLanguage('ar');
    else setLanguage('en');
  };

  const navItems = [
    { label: t.register, href: '/pos/register', icon: ShoppingCart },
    { label: t.inventory, href: '/backoffice/inventory', icon: Package },
    { label: t.barcodes, href: '/backoffice/barcodes', icon: Barcode },
    { label: t.purchasing, href: '/backoffice/purchasing', icon: Truck },
    { label: t.orders, href: '/backoffice/orders', icon: Receipt },
    { label: t.customers, href: '/backoffice/crm', icon: Users },
    { label: t.shifts, href: '/pos/shifts', icon: Clock },
    { label: t.analytics, href: '/backoffice/analytics', icon: BarChart3 },
    { label: t.staff, href: '/backoffice/staff', icon: UserCheck },
    { label: t.expenses, href: '/backoffice/expenses', icon: Wallet },
    { label: t.settings, href: '/backoffice/settings', icon: Settings },
    { label: t.kioskMode, href: '/pos/kiosk', icon: MonitorPlay },
  ];

  return (
    <aside className="no-print w-16 bg-white border-r border-slate-200 flex flex-col justify-between items-center py-4 z-20 shrink-0">
      {/* Brand Icon at Top */}
      <div className="flex flex-col items-center gap-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md hover:scale-105 transition"
          title="OURSELL POS Home"
        >
          O
        </Link>

        {/* Navigation Icon List */}
        <nav className="flex flex-col items-center gap-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative group p-2.5 rounded-2xl transition flex items-center justify-center ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-600 rounded-r-full" />
                )}
                {/* Tooltip */}
                <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Dev Core, Language, Cashier & Logout */}
      <div className="flex flex-col items-center gap-2">
        {/* Language Switcher */}
        <button
          onClick={cycleLanguage}
          title={`Language: ${language.toUpperCase()}`}
          className="relative group p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
        >
          <Languages className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase block text-center leading-none mt-0.5">
            {language}
          </span>
          <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
            Switch Language (EN/ML/AR)
          </span>
        </button>

        {/* Cashier Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-slate-200 border-2 border-teal-500 text-slate-700 flex items-center justify-center font-bold text-xs"
          title={activeCashier.name}
        >
          IK
        </div>

        {/* Logout to Brand Login */}
        <Link
          href="/login-brand"
          title="Logout"
          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
        >
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
