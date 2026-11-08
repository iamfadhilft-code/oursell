'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/db/posDb';
import { Order, Product } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { PlanGateModal } from '@/components/pricing/PlanGateModal';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import {
  seedRealisticRetailTransactions,
  clearDemoRetailTransactions,
} from '@/utils/demoAnalyticsSeeder';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Calendar,
  RefreshCw,
  Download,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
  Package,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';

type TimeRange = 'TODAY' | 'YESTERDAY' | '7D' | '30D' | 'THIS_MONTH' | 'ALL';

interface HourlyBucket {
  hour: string;
  displayHour: string;
  hourNumber: number;
  count: number;
  revenue: number;
}

interface ProductPairing {
  itemA: string;
  itemB: string;
  count: number;
  totalRevenue: number;
  supportPercent: number;
}

export default function AnalyticsPage() {
  const { activeBrandId, currency } = usePosStore();
  const safeCurrency = currency && currency !== '?' && !currency.includes('\uFFFD') ? currency : '₹';
  const storeSlug = activeBrandId || 'oursell';

  const { hasAccess, planName, refetchPlan } = usePlanAccess(storeSlug);
  const { isAdmin } = useRoleAccess();
  const isAdvancedAnalyticsAllowed = hasAccess('advanced_analytics');
  const [isGateOpen, setIsGateOpen] = useState(false);

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [hoveredHour, setHoveredHour] = useState<HourlyBucket | null>(null);

  // Toast Notice State
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // Load orders and products from IndexedDB
  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [allOrders, allProducts] = await Promise.all([
        db.orders.toArray(),
        db.products.toArray(),
      ]);
      setOrders(allOrders);
      setProducts(allProducts);
      const now = new Date();
      setLastRefreshed(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('Failed to load analytics data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
      if (!quiet) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh periodically or when window receives focus (detects new POS sales in other tabs)
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);

    // Live polling every 5 seconds to ensure changes reflect immediately
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
    };
  }, [loadData, activeBrandId]);

  // Filter orders based on active time range & brand
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = now.getTime() - 7 * 86400000;
    const startOf30Days = now.getTime() - 30 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      if (o.status !== 'COMPLETED') return false;

      // Filter by brand if specific brand is active and order has brandId
      if (activeBrandId && o.brandId && o.brandId !== activeBrandId && o.brandId !== 'oursell') {
        return false;
      }

      const orderTime = new Date(o.createdAt).getTime();
      if (isNaN(orderTime)) return true;

      switch (timeRange) {
        case 'TODAY':
          return orderTime >= startOfToday;
        case 'YESTERDAY':
          return orderTime >= startOfYesterday && orderTime < startOfToday;
        case '7D':
          return orderTime >= startOf7Days;
        case '30D':
          return orderTime >= startOf30Days;
        case 'THIS_MONTH':
          return orderTime >= startOfMonth;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [orders, timeRange, activeBrandId]);

  // Financial KPI calculations strictly from filtered orders
  const totalGrossRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;
  const aov = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;

  const totalItemsSold = useMemo(() => {
    return filteredOrders.reduce(
      (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
  }, [filteredOrders]);

  const upt = totalOrdersCount > 0 ? totalItemsSold / totalOrdersCount : 0;

  // Accurate Cost & Net Profit Margin calculation based on inventory costPrice
  const totalCost = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.id, p]));
    return filteredOrders.reduce((sum, o) => {
      const orderCost = (o.items || []).reduce((iCost, item) => {
        const prod = prodMap.get(item.productId);
        // If product cost price is defined and positive, use it. Otherwise assume standard 65% retail cost.
        const unitCost = prod && prod.costPrice > 0 ? prod.costPrice : item.unitPrice * 0.65;
        return iCost + unitCost * item.quantity;
      }, 0);
      return sum + orderCost;
    }, 0);
  }, [filteredOrders, products]);

  const grossProfit = Math.max(0, totalGrossRevenue - totalCost);
  // Margin is strictly 0% when no revenue exists (no fake 38.5% fallback!)
  const marginPercent = totalGrossRevenue > 0 ? (grossProfit / totalGrossRevenue) * 100 : 0;

  // Hourly Traffic Heatmap (08:00 to 22:00) with true mathematical counts & revenues
  const hourlyCounts = useMemo<HourlyBucket[]>(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const hourNumber = i + 8; // 8 to 22 (store opening to closing)
      const hourSlotOrders = filteredOrders.filter((o) => {
        const orderHour = new Date(o.createdAt).getHours();
        return orderHour === hourNumber;
      });

      const count = hourSlotOrders.length;
      const revenue = hourSlotOrders.reduce((sum, o) => sum + o.grandTotal, 0);
      const displayHour = `${hourNumber > 12 ? hourNumber - 12 : hourNumber} ${hourNumber >= 12 ? 'PM' : 'AM'}`;

      return {
        hour: `${hourNumber.toString().padStart(2, '0')}:00`,
        displayHour,
        hourNumber,
        count,
        revenue,
      };
    });
  }, [filteredOrders]);

  const maxHourlyCount = useMemo(() => {
    return Math.max(...hourlyCounts.map((h) => h.count), 0);
  }, [hourlyCounts]);

  // Dynamic Peak Rush Hour Detection
  const peakSlot = useMemo(() => {
    if (totalOrdersCount === 0 || maxHourlyCount === 0) return null;
    const peak = [...hourlyCounts].sort((a, b) => b.count - a.count || b.revenue - a.revenue)[0];
    if (peak && peak.count > 0) {
      const nextHour = (peak.hourNumber + 1).toString().padStart(2, '0');
      return {
        slot: `${peak.hour} - ${nextHour}:00`,
        count: peak.count,
        revenue: peak.revenue,
      };
    }
    return null;
  }, [hourlyCounts, totalOrdersCount, maxHourlyCount]);

  // Market Basket Affinity Engine: Pairwise Apriori Calculation
  const { topPairings, multiItemOrderCount } = useMemo(() => {
    const multiItemOrders = filteredOrders.filter((o) => o.items && o.items.length >= 2);
    const pairingMap = new Map<string, { itemA: string; itemB: string; count: number; totalRevenue: number }>();

    multiItemOrders.forEach((o) => {
      // Find distinct item titles in the order
      const distinctTitles = Array.from(new Set(o.items.map((i) => i.title.trim())));
      if (distinctTitles.length < 2) return;

      for (let i = 0; i < distinctTitles.length; i++) {
        for (let j = i + 1; j < distinctTitles.length; j++) {
          const [itemA, itemB] = [distinctTitles[i], distinctTitles[j]].sort();
          const key = `${itemA} +++ ${itemB}`;
          const current = pairingMap.get(key) || { itemA, itemB, count: 0, totalRevenue: 0 };
          current.count += 1;
          current.totalRevenue += o.grandTotal;
          pairingMap.set(key, current);
        }
      }
    });

    const sorted = Array.from(pairingMap.values())
      .sort((a, b) => b.count - a.count || b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map((pair) => ({
        ...pair,
        supportPercent: multiItemOrders.length > 0 ? (pair.count / multiItemOrders.length) * 100 : 0,
      }));

    return { topPairings: sorted, multiItemOrderCount: multiItemOrders.length };
  }, [filteredOrders]);

  // Payment Channel Breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      UPI: { count: 0, amount: 0 },
      CASH: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      KHATA: { count: 0, amount: 0 },
    };

    filteredOrders.forEach((o) => {
      const method = (o.paymentMethod || 'CASH') as keyof typeof breakdown;
      if (breakdown[method]) {
        breakdown[method].count += 1;
        breakdown[method].amount += o.grandTotal;
      }
    });

    return breakdown;
  }, [filteredOrders]);

  // Top Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const map = new Map<string, { title: string; category: string; units: number; revenue: number }>();
    const prodMap = new Map(products.map((p) => [p.id, p]));

    filteredOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const prod = prodMap.get(item.productId);
        const category = prod?.category || 'Retail';
        const current = map.get(item.title) || { title: item.title, category, units: 0, revenue: 0 };
        current.units += item.quantity;
        current.revenue += item.lineTotal;
        map.set(item.title, current);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .slice(0, 5);
  }, [filteredOrders, products]);

  // Demo Data Seeding Handler
  const handleSeedDemoData = async () => {
    if (!isAdmin) {
      showToast('Permission Denied: Only Store Administrators can seed sample data.', 'error');
      return;
    }
    setIsRefreshing(true);
    try {
      const count = await seedRealisticRetailTransactions(storeSlug);
      await loadData();
      showToast(
        `⚡ Seeded ${count} realistic retail transactions with co-purchase affinities and rush hours!`,
        'success'
      );
    } catch (err) {
      console.error('Error seeding demo transactions:', err);
      showToast('Failed to seed sample sales data.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear Demo Data Handler
  const handleClearDemoData = async () => {
    if (!isAdmin) {
      showToast('Permission Denied: Only Store Administrators can clear transaction data.', 'error');
      return;
    }
    setIsRefreshing(true);
    try {
      const count = await clearDemoRetailTransactions(storeSlug);
      await loadData();
      showToast(`Cleared ${count} demo transactions. Store is back to raw real-time state.`, 'info');
    } catch (err) {
      console.error('Error clearing demo transactions:', err);
      showToast('Failed to clear demo transactions.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export Analytics Summary to CSV
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      showToast('No orders available to export for this time range.', 'error');
      return;
    }

    const headers = ['Order Number', 'Date & Time', 'Customer', 'Payment Method', 'Items Count', 'Gross Total', 'Status'];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.customerName || 'Walk-in Customer'}"`,
      `"${o.paymentMethod}"`,
      (o.items || []).reduce((s, itm) => s + itm.quantity, 0),
      o.grandTotal.toFixed(2),
      `"${o.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `retail_analytics_${timeRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics summary exported to CSV successfully.', 'success');
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Toast Notification Banner */}
          {notice && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm transition-all duration-300 ${
                notice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : notice.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-teal-50 text-teal-900 border border-teal-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {notice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-teal-600 shrink-0" />
                )}
                <span>{notice.message}</span>
              </div>
              <button
                onClick={() => setNotice(null)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Top Header & Interactive Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-100/80 shadow-xs">
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      Bill & Basket Retail Analytics
                    </h1>
                    {/* Live Sync Beacon */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      LIVE FEED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live business intelligence: Gross margin, average order value, peak traffic, and co-purchase affinities.
                  </p>
                </div>
              </div>
            </div>

            {/* Controls: Date Filter & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Time Range Pills */}
              <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600">
                {(
                  [
                    { id: 'TODAY', label: 'Today' },
                    { id: 'YESTERDAY', label: 'Yesterday' },
                    { id: '7D', label: '7D' },
                    { id: '30D', label: '30D' },
                    { id: 'THIS_MONTH', label: 'This Month' },
                    { id: 'ALL', label: 'All Time' },
                  ] as { id: TimeRange; label: string }[]
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeRange(t.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      timeRange === t.id
                        ? 'bg-white text-teal-800 shadow-xs font-black'
                        : 'hover:text-slate-900 hover:bg-slate-200/40'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => loadData()}
                disabled={isRefreshing}
                title={`Last synced: ${lastRefreshed}`}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-2xl shadow-xs transition flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCsv}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-2xl shadow-xs transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Export report to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Seed Demo Data Button (Admin Only) */}
              {isAdmin && (
                <>
                  <button
                    onClick={handleSeedDemoData}
                    disabled={isRefreshing}
                    className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl shadow-xs transition flex items-center gap-1.5 text-xs font-black cursor-pointer active:scale-95"
                    title="Generate realistic retail sales transactions to preview live analytics"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Seed Live Demo Data</span>
                  </button>

                  {/* Clear Demo Data Button (if orders exist) */}
                  {orders.some((o) => o.id.startsWith('demo-ord-') || o.notes?.includes('Demo')) && (
                    <button
                      onClick={handleClearDemoData}
                      disabled={isRefreshing}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl shadow-xs transition flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="Clear generated sample retail transactions"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden md:inline">Reset</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Empty State Banner (When 0 receipts exist) */}
          {totalOrdersCount === 0 && (
            <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-sky-50 border border-teal-200/80 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    No transactions recorded for {timeRange === 'ALL' ? 'this store' : timeRange.toLowerCase()} yet
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Ring up live sales in the register, or load <strong>16 realistic retail demo transactions</strong> to see the hourly checkout heatmap, profit margins, and basket affinities spring to life immediately.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                {isAdmin && (
                  <button
                    onClick={handleSeedDemoData}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Generate Sample Sales</span>
                  </button>
                )}
                <Link
                  href="/pos/register"
                  className="flex-1 md:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                  <span>Open Register</span>
                </Link>
              </div>
            </div>
          )}

          {/* 4 Major KPI Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Gross Revenue */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-1.5 shadow-xs relative overflow-hidden group hover:border-teal-300/60 transition">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Gross Revenue
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {safeCurrency}{totalGrossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Verified from {totalOrdersCount} {totalOrdersCount === 1 ? 'receipt' : 'receipts'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {totalItemsSold} items
                </span>
              </div>
            </div>

            {/* Net Profit Margin (Gated by Pro/Enterprise or dynamic calculation) */}
            {isAdvancedAnalyticsAllowed ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-1.5 shadow-xs relative overflow-hidden group hover:border-teal-300/60 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Net Profit Margin
                  </span>
                  {totalGrossRevenue > 0 && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        marginPercent >= 35
                          ? 'bg-emerald-50 text-emerald-800'
                          : marginPercent >= 20
                          ? 'bg-teal-50 text-teal-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {marginPercent >= 35 ? 'High Margin' : marginPercent >= 20 ? 'Healthy' : 'Standard'}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-teal-700 font-mono tracking-tight">
                  {marginPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Gross Profit: {safeCurrency}{grossProfit.toFixed(2)}</span>
                  <span className="font-mono text-slate-400">Cost: {safeCurrency}{totalCost.toFixed(0)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-1.5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Net Profit Margin
                  </span>
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                </div>
                <div className="filter blur-[3px] select-none text-2xl font-black text-slate-300 font-mono">
                  38.5%
                </div>
                <button
                  onClick={() => setIsGateOpen(true)}
                  className="text-[10px] text-teal-700 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  Requires Professional Plan →
                </button>
              </div>
            )}

            {/* Average Order Value (AOV) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-1.5 shadow-xs relative overflow-hidden group hover:border-teal-300/60 transition">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Average Order Value (AOV)
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {safeCurrency}{aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                <span>Per customer checkout</span>
                <span className="text-teal-700 font-bold">
                  {totalOrdersCount > 0 ? `${(totalGrossRevenue / Math.max(totalOrdersCount, 1)).toFixed(0)} / ticket` : '—'}
                </span>
              </div>
            </div>

            {/* Units Per Transaction (UPT) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-1.5 shadow-xs relative overflow-hidden group hover:border-teal-300/60 transition">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Units Per Transaction (UPT)
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {upt.toFixed(1)} items
              </div>
              <div className="text-[10px] pt-1 flex items-center justify-between">
                <span className="text-teal-600 font-bold">Basket density factor</span>
                <span className="text-slate-400 font-mono">{totalItemsSold} total units</span>
              </div>
            </div>
          </div>

          {/* Middle Two Columns: Hourly Traffic & Basket Affinity */}
          <div className="relative">
            {!isAdvancedAnalyticsAllowed && (
              <div className="absolute inset-0 z-20 bg-slate-900/10 backdrop-blur-[3px] rounded-3xl flex flex-col items-center justify-center p-6 text-center border border-slate-200/50">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg mb-3">
                  <Lock className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Advanced Retail Analytics Locked
                </h3>
                <p className="text-xs text-slate-600 max-w-md mt-1 mb-4 leading-relaxed">
                  Hourly checkout rush heatmaps and AI market basket co-purchase intelligence require the{' '}
                  <strong>Professional Plan (₹799/mo)</strong> or higher.
                </p>
                <button
                  onClick={() => setIsGateOpen(true)}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-teal-300" />
                  <span>Upgrade to Professional Plan</span>
                </button>
              </div>
            )}

            <div className={`grid lg:grid-cols-2 gap-5 ${!isAdvancedAnalyticsAllowed ? 'filter blur-[3px] pointer-events-none select-none opacity-40' : ''}`}>
              {/* Hourly Traffic Bar Chart */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Hourly Traffic & Checkout Heatmap
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Peak customer counter rush hours across store operating day (08:00 - 22:00)
                      </p>
                    </div>

                    {/* Dynamic Peak Rush Hour Badge */}
                    {peakSlot ? (
                      <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200/70 px-2.5 py-1 rounded-xl shadow-2xs">
                        Peak: {peakSlot.slot}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                        No traffic yet
                      </span>
                    )}
                  </div>

                  {/* Active Tooltip / Hover Banner */}
                  <div className="h-6 mt-3 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    {hoveredHour ? (
                      <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/70 w-full animate-fadeIn">
                        <span className="font-bold text-slate-900">
                          {hoveredHour.hour} ({hoveredHour.displayHour})
                        </span>
                        <span className="text-teal-700 font-bold">
                          {hoveredHour.count} {hoveredHour.count === 1 ? 'sale' : 'sales'}
                        </span>
                        <span className="text-slate-700">
                          Gross: {safeCurrency}{hoveredHour.revenue.toFixed(2)}
                        </span>
                        {totalOrdersCount > 0 && (
                          <span className="text-slate-400 ml-auto">
                            {((hoveredHour.count / totalOrdersCount) * 100).toFixed(0)}% of period
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">
                        {maxHourlyCount > 0
                          ? 'Hover over any hour column to view checkout volume and revenue'
                          : 'No completed transactions recorded in this time range'}
                      </span>
                    )}
                  </div>

                  {/* Dynamic CSS Bar Chart */}
                  <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 pb-2 px-1">
                    {hourlyCounts.map((h, i) => {
                      const heightPercent =
                        maxHourlyCount > 0 && h.count > 0
                          ? Math.max(12, Math.round((h.count / maxHourlyCount) * 100))
                          : 0;

                      return (
                        <div
                          key={i}
                          onMouseEnter={() => setHoveredHour(h)}
                          onMouseLeave={() => setHoveredHour(null)}
                          className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          {/* Column Bar Container */}
                          <div className="w-full bg-slate-100/90 rounded-t-lg h-32 flex items-end overflow-hidden p-0.5">
                            {h.count > 0 ? (
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className="w-full bg-gradient-to-t from-teal-600 via-teal-500 to-emerald-400 rounded-t transition-all duration-300 group-hover:from-teal-500 group-hover:to-emerald-300 shadow-2xs flex flex-col justify-start items-center pt-1"
                              >
                                {heightPercent > 40 && (
                                  <span className="text-[9px] font-mono font-bold text-white/90 select-none">
                                    {h.count}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-1 bg-slate-200 rounded-full" />
                            )}
                          </div>

                          {/* Hour Label */}
                          <span
                            className={`text-[9px] font-mono transition-colors ${
                              h.count > 0
                                ? 'text-slate-700 font-bold group-hover:text-teal-700'
                                : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          >
                            {h.hour.slice(0, 2)}h
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hourly Heatmap Summary Footnote */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Store Hours: 08:00 AM - 10:00 PM</span>
                  {peakSlot && (
                    <span className="text-teal-700 font-bold">
                      Highest Rush: {peakSlot.count} checkouts ({safeCurrency}{peakSlot.revenue.toFixed(0)})
                    </span>
                  )}
                </div>
              </div>

              {/* Market Basket Affinity (Real Cross-sell analysis) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h3 className="font-extrabold text-sm text-slate-900">
                          Market Basket Affinity Analysis
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Products most frequently purchased together on same bill (Apriori AI)
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200/60">
                      {multiItemOrderCount} multi-item {multiItemOrderCount === 1 ? 'basket' : 'baskets'}
                    </span>
                  </div>

                  {/* List of Real Basket Pairings */}
                  <div className="space-y-2.5 mt-4">
                    {topPairings.length > 0 ? (
                      topPairings.map((pair, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-slate-800 group-hover:text-teal-900">
                                {pair.itemA}
                              </span>
                              <span className="text-teal-600 font-bold mx-1.5">+</span>
                              <span className="font-bold text-slate-800 group-hover:text-teal-900">
                                {pair.itemB}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-slate-800 text-[11px] font-black">
                              {pair.count} {pair.count === 1 ? 'time' : 'times'}
                            </div>
                            <div className="text-[9px] font-mono text-teal-700 font-bold">
                              {pair.supportPercent.toFixed(0)}% co-occurrence
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Empty State for Affinity */
                      <div className="py-8 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            Awaiting Multi-Item Baskets
                          </h4>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                            When customers purchase 2 or more products together in a single receipt, the algorithmic affinity engine will identify cross-selling co-purchase pairs here.
                          </p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={handleSeedDemoData}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-black rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>Generate Multi-Item Sales Data</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Merchandising Actionable Tip */}
                {topPairings.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-teal-800 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      <strong>Merchandising Tip:</strong> Bundle <strong>{topPairings[0].itemA}</strong> and{' '}
                      <strong>{topPairings[0].itemB}</strong> at the front checkout shelf to boost basket size by ~15%.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Payment Methods & Top Selling Products */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Payment Method Split */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Payment Breakdown</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {totalOrdersCount} checkouts
                </span>
              </div>

              {/* Multi-segmented Progress Bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {totalGrossRevenue > 0 ? (
                  <>
                    <div
                      style={{ width: `${(paymentBreakdown.UPI.amount / totalGrossRevenue) * 100}%` }}
                      className="bg-indigo-500 transition-all duration-300"
                      title={`UPI: ${safeCurrency}${paymentBreakdown.UPI.amount.toFixed(2)}`}
                    />
                    <div
                      style={{ width: `${(paymentBreakdown.CASH.amount / totalGrossRevenue) * 100}%` }}
                      className="bg-teal-500 transition-all duration-300"
                      title={`Cash: ${safeCurrency}${paymentBreakdown.CASH.amount.toFixed(2)}`}
                    />
                    <div
                      style={{ width: `${(paymentBreakdown.CARD.amount / totalGrossRevenue) * 100}%` }}
                      className="bg-sky-500 transition-all duration-300"
                      title={`Card: ${safeCurrency}${paymentBreakdown.CARD.amount.toFixed(2)}`}
                    />
                    <div
                      style={{ width: `${(paymentBreakdown.KHATA.amount / totalGrossRevenue) * 100}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`Khata: ${safeCurrency}${paymentBreakdown.KHATA.amount.toFixed(2)}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-200" />
                )}
              </div>

              {/* Payment Legend & Amounts */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span className="font-bold text-slate-800">UPI / QR</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-900">
                    {safeCurrency}{paymentBreakdown.UPI.amount.toFixed(0)}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-teal-50/60 border border-teal-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                    <span className="font-bold text-slate-800">Cash</span>
                  </div>
                  <span className="font-mono font-bold text-teal-900">
                    {safeCurrency}{paymentBreakdown.CASH.amount.toFixed(0)}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    <span className="font-bold text-slate-800">Card</span>
                  </div>
                  <span className="font-mono font-bold text-sky-900">
                    {safeCurrency}{paymentBreakdown.CARD.amount.toFixed(0)}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-slate-800">Khata</span>
                  </div>
                  <span className="font-mono font-bold text-amber-900">
                    {safeCurrency}{paymentBreakdown.KHATA.amount.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Selling Products Leaderboard */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-600" />
                    <h3 className="font-extrabold text-sm text-slate-900">Top Performing Products</h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    By Gross Sales
                  </span>
                </div>

                <div className="space-y-2.5 mt-3">
                  {topProducts.length > 0 ? (
                    topProducts.map((p, idx) => {
                      const sharePercent =
                        totalGrossRevenue > 0 ? Math.round((p.revenue / totalGrossRevenue) * 100) : 0;

                      return (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 rounded-2xl flex items-center justify-between text-xs transition"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-bold text-slate-800 block truncate">
                                {p.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Category: {p.category}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex items-center gap-4">
                            <div>
                              <div className="font-mono font-black text-slate-900">
                                {safeCurrency}{p.revenue.toFixed(2)}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {p.units} {p.units === 1 ? 'unit' : 'units'} sold
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60">
                              {sharePercent}%
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No product sales recorded in this period.
                    </div>
                  )}
                </div>
              </div>

              {/* POS Register Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Want to test ringing up sales?</span>
                <Link
                  href="/pos/register"
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Open POS Register</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Plan Gate Modal for Advanced Analytics Upgrade */}
      <PlanGateModal
        isOpen={isGateOpen}
        onClose={() => setIsGateOpen(false)}
        title="Upgrade to Professional for Advanced Analytics"
        description="Unlock live net profit margins, peak hourly customer checkout heatmaps, and AI market basket co-purchase intelligence for smarter inventory merchandising."
        requiredPlan="Professional"
        currentPlan={planName}
        featureBenefits={[
          'Hourly Checkout Traffic & Rush-Hour Heatmap',
          'Market Basket Affinity & Co-Purchase Frequency',
          'Live Net Profit Margins & Cost-Price Calculations',
          'Customer Khata & Store Credit Ledger Management',
          'Purchase Orders & Supplier Restocking',
          'Multi-Outlet Management (Up to 3 Outlets & 6 Terminals)',
        ]}
        storeId={storeSlug}
        onSuccessUpgrade={() => refetchPlan()}
      />
    </div>
  );
}
