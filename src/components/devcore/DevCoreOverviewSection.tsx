'use client';

import React, { useState, useEffect } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Search,
  Filter,
  Plus,
  CreditCard,
  Wallet,
  ShoppingBag,
  Coins,
  Award,
  Smartphone,
  Plane,
  Building,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wifi,
} from 'lucide-react';

export function DevCoreOverviewSection() {
  const { telemetry, activeAccounts, setActiveTab, theme } = useDevCoreStore();

  const [currency, setCurrency] = useState<'USD' | 'INR' | 'EUR'>('USD');
  const [greeting, setGreeting] = useState('Good morning');
  const [searchActivity, setSearchActivity] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>(['INV_000073']);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const currencySymbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
  };

  const curr = currencySymbols[currency];

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const activities = [
    {
      id: 'INV_000076',
      title: 'Mobile App Purchase',
      category: 'Software & Cloud',
      icon: Smartphone,
      iconBg: 'bg-sky-500 text-white',
      price: '$25,500',
      status: 'Completed',
      statusColor: 'text-emerald-600 bg-emerald-50',
      dotColor: 'bg-emerald-500',
      date: '17 Apr, 2026 03:45 PM',
    },
    {
      id: 'INV_000075',
      title: 'Store Hardware Terminal POS',
      category: 'Retail Terminal',
      icon: Building,
      iconBg: 'bg-indigo-600 text-white',
      price: '$32,750',
      status: 'Pending',
      statusColor: 'text-rose-600 bg-rose-50',
      dotColor: 'bg-rose-500',
      date: '15 Apr, 2026 11:30 AM',
    },
    {
      id: 'INV_000074',
      title: 'Enterprise Sync Gateway',
      category: 'Cloud Infrastructure',
      icon: Plane,
      iconBg: 'bg-blue-400 text-white',
      price: '$40,200',
      status: 'Completed',
      statusColor: 'text-emerald-600 bg-emerald-50',
      dotColor: 'bg-emerald-500',
      date: '15 Apr, 2026 12:00 PM',
    },
    {
      id: 'INV_000073',
      title: 'Flagship Supermarket Billing',
      category: 'Retail Sales',
      icon: ShoppingBag,
      iconBg: 'bg-amber-400 text-slate-950',
      price: '$50,200',
      status: 'In Progress',
      statusColor: 'text-amber-600 bg-amber-50',
      dotColor: 'bg-amber-500',
      date: '14 Apr, 2026 09:15 PM',
    },
    {
      id: 'INV_000072',
      title: 'Central Mart License Renewal',
      category: 'Subscription Fee',
      icon: Layers,
      iconBg: 'bg-rose-500 text-white',
      price: '$15,900',
      status: 'Completed',
      statusColor: 'text-emerald-600 bg-emerald-50',
      dotColor: 'bg-emerald-500',
      date: '10 Apr, 2026 06:00 AM',
    },
  ];

  const filteredActivities = activities.filter(
    (a) =>
      a.id.toLowerCase().includes(searchActivity.toLowerCase()) ||
      a.title.toLowerCase().includes(searchActivity.toLowerCase()) ||
      a.category.toLowerCase().includes(searchActivity.toLowerCase())
  );

  // Stacked Bar Chart Data (Jan - Aug)
  const chartData = [
    { month: 'Jan', profit: 42, loss: 22 },
    { month: 'Feb', profit: 45, loss: 16 },
    { month: 'Mar', profit: 38, loss: 24 },
    { month: 'Apr', profit: 46, loss: 18 },
    { month: 'May', profit: 54, loss: 26 },
    { month: 'Jun', profit: 62, loss: 29 },
    { month: 'Jul', profit: 48, loss: 22 },
    { month: 'Aug', profit: 36, loss: 14 },
  ];

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HERO GREETING BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">☀️</span>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {greeting}, Dev Core
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Stay on top of your store operations, monitor platform GMV, and track system status.
          </p>
        </div>

        {/* Live Pending Shop Registrations Alert */}
        {(telemetry.pendingApplicationsCount || 0) > 0 && (
          <button
            onClick={() => setActiveTab('inbox')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/30 transition shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>
              {telemetry.pendingApplicationsCount} New Shop Registration(s) in Dev Core Inbox — Review & Active &rarr;
            </span>
          </button>
        )}
      </div>

      {/* 2. MAIN 3-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* COLUMN 1: Financial & Store Resources Hub (4 COLS)       */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1A: Total Balance & Wallets Carousel */}
          <div
            className={`p-6 rounded-[28px] border transition shadow-sm text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Total Balance</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-xs font-bold text-slate-800 cursor-pointer">
                <span>🇺🇸</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span
                className={`text-3xl sm:text-4xl font-extrabold font-sans tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-950'
                }`}
              >
                {curr}689,372.00
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold inline-flex items-center gap-0.5">
                <span>↑ 5%</span>
                <span className="text-[10px] text-slate-400 font-normal">than last month</span>
              </span>
            </div>

            {/* Dual Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                className="py-3 px-4 rounded-2xl bg-[#C4F12A] hover:bg-[#b5e022] active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>Transfer</span>
              </button>
              <button
                type="button"
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/70 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Request</span>
              </button>
            </div>

            {/* Wallets / Stores Row */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
                <span>Wallets | Total 6 wallets</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {/* Wallet 1 */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span>🇺🇸</span> USD
                    </span>
                    <MoreVertical className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                  <div className="text-xs font-black text-slate-950">$22,678.00</div>
                  <div className="text-[9px] text-slate-400 truncate">Limit $50k a month</div>
                  <div className="text-[9px] font-bold text-emerald-600">Active</div>
                </div>

                {/* Wallet 2 */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span>🇪🇺</span> EUR
                    </span>
                    <MoreVertical className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                  <div className="text-xs font-black text-slate-950">€18,345.00</div>
                  <div className="text-[9px] text-slate-400 truncate">Limit €40k a month</div>
                  <div className="text-[9px] font-bold text-emerald-600">Active</div>
                </div>

                {/* Wallet 3 */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <span>🇬🇧</span> GBP
                    </span>
                    <MoreVertical className="w-3 h-3 text-slate-400 cursor-pointer" />
                  </div>
                  <div className="text-xs font-black text-slate-950">£15,000.00</div>
                  <div className="text-[9px] text-slate-400 truncate">Limit £25k a month</div>
                  <div className="text-[9px] font-bold text-rose-500">Inactive</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 1B: Monthly Spending Limit */}
          <div
            className={`p-6 rounded-[28px] border transition shadow-sm text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-slate-800">Monthly Spending Limit</span>
            </div>

            {/* Custom Dual-Tone Bar (Solid Emerald + Pattern) */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex items-center p-0.5 border border-slate-200/50 mb-3">
              <div
                style={{ width: '35%' }}
                className="h-full bg-emerald-600 rounded-full shadow-xs"
              />
              <div
                style={{ width: '65%' }}
                className="h-full bg-[repeating-linear-gradient(45deg,#dcfce7,#dcfce7_4px,#bbf7d0_4px,#bbf7d0_8px)] rounded-r-full"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="text-slate-950 font-mono">$1,400.00 spent out of</span>
              <span className="text-slate-500 font-mono">$5,500.00</span>
            </div>
          </div>

          {/* Card 1C: My Cards / POS Terminals */}
          <div
            className={`p-6 rounded-[28px] border transition shadow-sm text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-800" />
                <span className="text-xs font-extrabold text-slate-800">My Cards</span>
              </div>
              <button
                type="button"
                className="text-xs font-bold text-slate-500 hover:text-slate-950 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Sleek Black Obsidian Card */}
              <div className="h-36 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-slate-400 rotate-90" />
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold">
                      Active
                    </span>
                  </div>
                  {/* Mastercard Circles */}
                  <div className="flex items-center -space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                    <div className="w-4 h-4 rounded-full bg-amber-400 opacity-90" />
                  </div>
                </div>

                <div className="font-mono text-xs tracking-widest text-slate-300">
                  •••• •••• 6782
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <div>
                    <span className="block text-[8px] uppercase">EXP</span>
                    <span className="font-bold text-white">09/29</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">CVV</span>
                    <span className="font-bold text-white">611</span>
                  </div>
                </div>
              </div>

              {/* Sleek Emerald Green Card */}
              <div className="h-36 rounded-2xl bg-gradient-to-tr from-emerald-950 via-emerald-800 to-teal-700 text-white p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-300 rotate-90" />
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">
                      Active
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[9px]">
                    O
                  </div>
                </div>

                <div className="font-mono text-xs tracking-widest text-emerald-100">
                  •••• •••• 4356
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-emerald-200">
                  <div>
                    <span className="block text-[8px] uppercase">HOLDER</span>
                    <span className="font-bold text-white">DEV CORE</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">STATUS</span>
                    <span className="font-bold text-emerald-300">ROOT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: 2x2 Metric Matrix & Activities Table (5 COLS)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* 2x2 Metric Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Emerald Green Gradient Hero Metric */}
            <div className="p-5 rounded-[28px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/15 text-left flex flex-col justify-between h-36">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-100">Total Earnings</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold tracking-tight">$950</div>
                <div className="text-[11px] font-medium text-emerald-100 mt-1 flex items-center gap-1">
                  <span>↑ 7%</span>
                  <span>This month</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Spending White Card */}
            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left flex flex-col justify-between h-36 ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Spending</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-950 tracking-tight">$700</div>
                <div className="text-[11px] font-medium text-rose-500 mt-1 flex items-center gap-1">
                  <span>↓ 5%</span>
                  <span className="text-slate-400">This month</span>
                </div>
              </div>
            </div>

            {/* Card 3: Total Income White Card */}
            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left flex flex-col justify-between h-36 ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Income</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-950 tracking-tight">$1,050</div>
                <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 8%</span>
                  <span className="text-slate-400">This month</span>
                </div>
              </div>
            </div>

            {/* Card 4: Total Revenue White Card */}
            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left flex flex-col justify-between h-36 ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Revenue</span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-950 tracking-tight">$850</div>
                <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 4%</span>
                  <span className="text-slate-400">This month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activities Data Table Card */}
          <div
            className={`p-6 rounded-[28px] border transition shadow-sm text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
            }`}
          >
            {/* Table Header: Title + Search + Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="text-sm font-extrabold text-slate-900">Recent Activities</h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchActivity}
                    onChange={(e) => setSearchActivity(e.target.value)}
                    placeholder="Search"
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none w-32 sm:w-40"
                  />
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 transition"
                >
                  <Filter className="w-3 h-3" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
                    <th className="py-2.5 px-2 w-6">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filteredActivities.length}
                        onChange={() => {
                          if (selectedRows.length === filteredActivities.length) setSelectedRows([]);
                          else setSelectedRows(filteredActivities.map((a) => a.id));
                        }}
                        className="rounded border-slate-300 accent-slate-900"
                      />
                    </th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Activity</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredActivities.map((row) => {
                    const isChecked = selectedRows.includes(row.id);
                    const Icon = row.icon;

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/70 transition font-medium ${
                          isChecked ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(row.id)}
                            className="rounded border-slate-300 accent-slate-900 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-800">
                          {row.id}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${row.iconBg}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 truncate">{row.title}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-950">{row.price}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${row.statusColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${row.dotColor}`} />
                            {row.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-400 font-normal whitespace-nowrap">
                          {row.date}
                        </td>

                        <td className="py-3 px-2 text-right">
                          <button className="text-slate-400 hover:text-slate-700 p-1">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: Analytics Stacked Bar Chart (3 COLS)          */}
        {/* ======================================================== */}
        <div className="lg:col-span-3">
          <div
            className={`p-6 rounded-[28px] border transition shadow-sm text-left h-full ${
              isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-900">Total Income</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                View your income in a certain period of time
              </p>
            </div>

            {/* Profit & Loss Legend */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-6">
              <span>Profit and Loss</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C4F12A]" />
                  <span className="text-[11px] text-slate-600 font-semibold">Profit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                  <span className="text-[11px] text-slate-600 font-semibold">Loss</span>
                </div>
              </div>
            </div>

            {/* Stacked Vertical Bar Chart */}
            <div className="relative pt-4 pb-2">
              {/* Y-Axis Steps */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] font-mono text-slate-400 pr-2 pointer-events-none">
                <span>50k</span>
                <span>40k</span>
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
                <span>00</span>
              </div>

              {/* Bars Row */}
              <div className="ml-8 h-64 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full max-w-[24px] h-52 flex flex-col justify-end items-center">
                      {/* Top Section: Profit (Lime Green) */}
                      <div
                        style={{ height: `${d.profit}%` }}
                        className="w-full bg-[#C4F12A] rounded-t-lg transition group-hover:brightness-105"
                        title={`${d.month} Profit: $${d.profit * 1000}`}
                      />
                      {/* Bottom Section: Loss/Cost (Dark Charcoal) */}
                      <div
                        style={{ height: `${d.loss}%` }}
                        className="w-full bg-slate-950 rounded-b-lg transition group-hover:bg-slate-800"
                        title={`${d.month} Operating Cost: $${d.loss * 1000}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
