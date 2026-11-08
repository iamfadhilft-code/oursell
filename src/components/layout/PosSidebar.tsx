'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { FeatureKey } from '@/lib/planAccess';
import { translations } from '@/lib/i18n';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
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
  Lock,
  Building,
} from 'lucide-react';

interface NavItemConfig {
  label: string;
  href: string;
  icon: any;
  adminOnly: boolean;
  featureKey?: FeatureKey;
}

export function PosSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, activeCashier, activeBrandId } = usePosStore();
  const { isAdmin, isStaff } = useRoleAccess();
  const { planId, planName, checkFeature, checkLanguage } = usePlanAccess(activeBrandId);
  const t = translations[language];

  // Plan Gate modal state for sidebar actions
  const [gateConfig, setGateConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    requiredPlan: 'Professional' | 'Enterprise';
  }>({
    isOpen: false,
    title: '',
    description: '',
    requiredPlan: 'Professional',
  });

  const cycleLanguage = () => {
    let nextLang: 'en' | 'ml' | 'ar' = 'en';
    if (language === 'en') nextLang = 'ml';
    else if (language === 'ml') nextLang = 'ar';
    else nextLang = 'en';

    const langCheck = checkLanguage(nextLang);
    if (!langCheck.allowed) {
      setGateConfig({
        isOpen: true,
        title: 'Malayalam & Arabic Language Access',
        description:
          'Multi-lingual UI support (Malayalam and Arabic with RTL layout) is an advanced feature included in the Professional and Enterprise plans.',
        requiredPlan: 'Professional',
      });
      return;
    }

    setLanguage(nextLang);
  };

  const navItems: NavItemConfig[] = [
    { label: t.register, href: '/pos/register', icon: ShoppingCart, adminOnly: false },
    { label: t.inventory, href: '/backoffice/inventory', icon: Package, adminOnly: false },
    { label: t.barcodes, href: '/backoffice/barcodes', icon: Barcode, adminOnly: false },
    {
      label: t.purchasing,
      href: '/backoffice/purchasing',
      icon: Truck,
      adminOnly: false,
      featureKey: 'purchase_orders',
    },
    { label: t.orders, href: '/backoffice/orders', icon: Receipt, adminOnly: false },
    { label: t.customers, href: '/backoffice/crm', icon: Users, adminOnly: false },
    { label: t.shifts, href: '/pos/shifts', icon: Clock, adminOnly: false },
    { label: t.analytics, href: '/backoffice/analytics', icon: BarChart3, adminOnly: false },
    { label: `${t.staff} (Admin)`, href: '/backoffice/staff', icon: UserCheck, adminOnly: true },
    {
      label: t.expenses,
      href: '/backoffice/expenses',
      icon: Wallet,
      adminOnly: false,
      featureKey: 'expense_management',
    },
    { label: `${t.settings} (Admin)`, href: '/backoffice/settings', icon: Settings, adminOnly: true },
    { label: t.kioskMode, href: '/pos/kiosk', icon: MonitorPlay, adminOnly: false },
  ];

  const handleNavClick = (e: React.MouseEvent, item: NavItemConfig) => {
    if (item.adminOnly && isStaff) {
      e.preventDefault();
      alert(`Access Restricted: "${item.label}" is restricted to Store Administrators.`);
      return;
    }
    if (item.featureKey) {
      const featCheck = checkFeature(item.featureKey);
      if (!featCheck.allowed) {
        e.preventDefault();
        setGateConfig({
          isOpen: true,
          title: featCheck.feature?.name || item.label,
          description:
            featCheck.feature?.description ||
            `This module requires a ${featCheck.minPlan} subscription plan. Upgrade your plan to access this functionality.`,
          requiredPlan: featCheck.minPlan as 'Professional' | 'Enterprise',
        });
      }
    }
  };

  return (
    <>
      <aside className="no-print w-16 bg-white border-r border-slate-200 flex flex-col justify-between items-center py-4 z-20 shrink-0">
        {/* Brand Icon at Top */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href={`/shop/${activeBrandId}`}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-md hover:scale-105 transition"
            title="Store Overview"
          >
            O
          </Link>

          {/* Admin Console Shortcut if Admin */}
          {isAdmin && (
            <Link
              href={`/shop/${activeBrandId}/admin`}
              title="Store Admin Console"
              className="p-2 rounded-xl bg-slate-900 text-[#C4F12A] hover:bg-slate-800 transition shadow-xs group relative"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                Admin Console
              </span>
            </Link>
          )}

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isItemRestrictedRole = item.adminOnly && isStaff;

              let isPlanLocked = false;
              let minPlan = 'Starter';
              if (item.featureKey) {
                const check = checkFeature(item.featureKey);
                isPlanLocked = !check.allowed;
                minPlan = check.minPlan;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  title={item.label}
                  className={`relative group p-2 rounded-2xl transition flex items-center justify-center ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 shadow-sm'
                      : isPlanLocked
                      ? 'text-amber-500/80 hover:text-amber-600 hover:bg-amber-50/60'
                      : isItemRestrictedRole
                      ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />

                  {/* Plan Lock Badge */}
                  {isPlanLocked && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Lock className="w-2 h-2" />
                    </span>
                  )}

                  {isItemRestrictedRole && !isPlanLocked && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-slate-300" />
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-teal-600 rounded-r-full" />
                  )}

                  {/* Tooltip */}
                  <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                    {item.label}
                    {isPlanLocked && ` (Requires ${minPlan})`}
                    {isItemRestrictedRole && !isPlanLocked && ' — Admin Only'}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Language, Role Cashier & Logout */}
        <div className="flex flex-col items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={cycleLanguage}
            title={`Language: ${language.toUpperCase()}`}
            className="relative group p-1.5 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition"
          >
            <Languages className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase block text-center leading-none mt-0.5">
              {language}
            </span>
            <span className="absolute left-16 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
              Language: {language.toUpperCase()}
              {isAdmin && planId === 'starter' ? ' (Pro for ML/AR)' : ''}
            </span>
          </button>

          {/* Cashier Avatar */}
          <div
            className={`w-7 h-7 rounded-full border-2 text-white flex items-center justify-center font-bold text-[10px] ${
              isAdmin
                ? 'bg-slate-900 border-[#C4F12A]'
                : 'bg-teal-700 border-teal-300'
            }`}
            title={`${activeCashier.name} (${isAdmin ? 'STORE_ADMIN' : 'STORE_STAFF'})`}
          >
            {activeCashier.name
              ? activeCashier.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'OU'}
          </div>

          {/* Logout to Store Login */}
          <Link
            href="/login"
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      <PlanGateModal
        isOpen={gateConfig.isOpen}
        onClose={() => setGateConfig({ ...gateConfig, isOpen: false })}
        title={gateConfig.title}
        description={gateConfig.description}
        requiredPlan={gateConfig.requiredPlan}
        currentPlan={planName}
      />
    </>
  );
}
