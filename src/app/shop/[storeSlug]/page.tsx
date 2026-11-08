'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/db/posDb';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { usePosStore } from '@/store/usePosStore';
import { translations } from '@/lib/i18n';
import {
  Store,
  ShoppingCart,
  Package,
  Barcode,
  Users,
  BarChart3,
  Settings,
  UserCheck,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Clock,
  Languages,
  LogOut,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Plus,
  RefreshCw,
  Lock,
  Truck,
} from 'lucide-react';

export default function StoreHomePage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || 'oursell';

  const { isAuthenticated, currentRole, currentAccount, logout } = useBrandAuthStore();
  const { language, setLanguage, currency } = usePosStore();
  const t = translations[language];

  const [storeData, setStoreData] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoreData = async () => {
    setIsLoading(true);
    try {
      // Find matching store brand
      let brand = await db.brands.where('brandId').equals(storeSlug).first();
      if (!brand) {
        brand = await db.brands.where('username').equals(storeSlug).first();
      }
      if (!brand) {
        brand = await db.brands.where('brandId').equals('oursell').first();
      }
      setStoreData(brand);

      const targetId = brand?.brandId || storeSlug;

      // Real DB metrics for this store
      const [allOrders, allProds] = await Promise.all([
        db.orders.where('brandId').equals(targetId).toArray(),
        db.products.where('brandId').equals(targetId).toArray(),
      ]);

      const sales = allOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      const lowStock = allProds.filter((p) => p.stock <= p.lowStockThreshold);

      setMetrics({
        todaySales: sales,
        totalOrders: allOrders.length,
        totalProducts: allProds.length,
        lowStockCount: lowStock.length,
      });

      setRecentOrders(allOrders.slice(-5).reverse());
      setLowStockItems(lowStock.slice(0, 4));
    } catch (e) {
      console.warn('Error loading store data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [storeSlug]);

  const cycleLanguage = () => {
    if (language === 'en') setLanguage('ml');
    else if (language === 'ml') setLanguage('ar');
    else setLanguage('en');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in with your authorized store credentials to access this store workspace.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl block transition shadow-xs"
            >
              Log In to Your Store &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentRole === 'STORE_ADMIN' || currentRole === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans select-none flex flex-col">
      {/* 1. STORE HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Store Logo & Name */}
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm"
            title="Oursell Home"
          >
            O
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-900 tracking-tight">
                {storeData?.brandName || 'Oursell Demo Store'}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE STORE
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Store ID: <strong className="text-slate-700">{storeData?.brandId || storeSlug}</strong>
            </span>
          </div>
        </div>

        {/* Right: Actions, Language, Role Badge & Logout */}
        <div className="flex items-center gap-3">
          {/* Refresh State */}
          <button
            onClick={loadStoreData}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            title="Refresh Store Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Language Switcher */}
          <button
            onClick={cycleLanguage}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-teal-600" />
            <span className="uppercase text-[11px]">{language}</span>
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {currentAccount?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] font-mono text-teal-700 font-bold uppercase">
                {currentRole || 'STORE_ADMIN'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentAccount?.name?.slice(0, 2).toUpperCase() || 'OU'}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition border border-slate-200"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN STORE WORKSPACE BODY */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-teal-700 uppercase tracking-wider block mb-1">
              Store Workspace Overview
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome to {storeData?.brandName || 'Oursell Demo Store'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your business operations, organized in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos/register"
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Open POS Register</span>
            </Link>
            {isAdmin && (
              <Link
                href={`/shop/${storeSlug}/admin`}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-[#C4F12A]" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3. REAL DATABASE DASHBOARD METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Today&apos;s Sales</span>
              <Receipt className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {currency}
              {metrics.todaySales.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              Real-time DB aggregate
            </span>
          </div>

          {/* Total Orders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Total Orders Settled</span>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {metrics.totalOrders}
            </div>
            <span className="text-[11px] text-slate-500">Invoices generated</span>
          </div>

          {/* Products in Stock */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Products in Stock</span>
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {metrics.totalProducts} Items
            </div>
            <span className="text-[11px] text-slate-500">Catalog SKUs tracked</span>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {metrics.lowStockCount} Items
            </div>
            <span className="text-[11px] text-slate-500">Below threshold level</span>
          </div>
        </div>

        {/* 4. QUICK ACCESS MODULES GRID */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 mb-3">Quick Access Modules</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* New Sale POS */}
            <Link
              href="/pos/register"
              className="bg-white border border-slate-200 hover:border-teal-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">New Sale / Billing</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Optical barcode scanner, fast cart, receipt printing, and split payments.
                </p>
              </div>
            </Link>

            {/* Products & Inventory */}
            <Link
              href="/backoffice/inventory"
              className="bg-white border border-slate-200 hover:border-blue-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Products & Inventory</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAdmin
                    ? 'Full catalog control: Add, edit, delete SKUs, price tiers & stock adjustments.'
                    : 'Search products, verify real-time stock levels and customer pricing.'}
                </p>
              </div>
            </Link>

            {/* Suppliers & Purchasing */}
            <Link
              href="/backoffice/purchasing"
              className="bg-white border border-slate-200 hover:border-teal-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Suppliers & Purchasing</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAdmin
                    ? 'Vendor management: Add, edit, delete suppliers, payment terms & purchase orders.'
                    : 'Inspect vendor list and receive inward deliveries (GRN) to restock inventory.'}
                </p>
              </div>
            </Link>

            {/* Barcode Studio */}
            <Link
              href={`/shop/${storeSlug}/barcodes`}
              className="bg-white border border-slate-200 hover:border-purple-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Barcode className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Barcode Studio</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Generate EAN-13 and Code 128 barcodes with thermal sticker label printing.
                </p>
              </div>
            </Link>

            {/* Customers & Credit Ledger */}
            <Link
              href="/backoffice/crm"
              className="bg-white border border-slate-200 hover:border-emerald-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Customers & Khata</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Store credit ledger, loyalty points, and purchase history.
                </p>
              </div>
            </Link>

            {/* Reports & Analytics */}
            <Link
              href="/backoffice/analytics"
              className="bg-white border border-slate-200 hover:border-amber-500/50 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">Reports & Analytics</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Financial GMV, gross margin, hourly sales heatmaps, and basket affinity.
                </p>
              </div>
            </Link>

            {/* Staff Management (Admin Only) */}
            {isAdmin ? (
              <Link
                href={`/shop/${storeSlug}/admin`}
                className="bg-white border border-slate-200 hover:border-slate-800 rounded-2xl p-5 transition shadow-xs group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">Staff & Settings</h4>
                    <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Create staff accounts, assign permissions, and configure store settings.
                  </p>
                </div>
              </Link>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 flex items-start gap-4 opacity-60">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-600">Admin Section</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Restricted to Store Administrators.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. RECENT INVOICES & LOW STOCK TABLES */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Recent Settled Invoices</h4>
              <Link
                href="/backoffice/orders"
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                View All &rarr;
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices recorded yet. Start billing in the POS register.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block font-mono">
                        {ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {ord.customerName || 'Walk-in Customer'} • {ord.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        {currency}
                        {ord.grandTotal?.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-sm text-slate-900">Low Stock Warnings</h4>
              </div>
              <Link
                href="/backoffice/inventory"
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                Reorder Stock &rarr;
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                All product stock quantities are healthy and above minimum thresholds.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {lowStockItems.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{prod.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        SKU: {prod.sku} • Min: {prod.lowStockThreshold}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-600 block">
                        {prod.stock} {prod.unit} left
                      </span>
                      <span className="text-[10px] text-slate-400">Restock recommended</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
