'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { SupportMessage } from '@/types/devcore';
import { BrandApplication } from '@/types/pos';
import {
  Inbox,
  Search,
  Store,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  CornerDownRight,
  Trash2,
  Filter,
  Shield,
  User,
  Plus,
  ArrowUpRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  HardDrive,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { DevCoreCreateStoreModal } from './DevCoreCreateStoreModal';

export function DevCoreInboxSection() {
  const {
    inboxMessages,
    applications,
    activeAccounts,
    replySupportMessage,
    updateMessageStatus,
    updateMessagePriority,
    deleteMessage,
    acceptApplication,
    rejectApplication,
    activateShop,
    rejectShop,
    reopenApplication,
    simulateNewShopApplication,
    openCreateStoreModal,
    toggleStoreStatus,
    isLoading,
    theme,
  } = useDevCoreStore();

  const isDark = theme === 'dark';

  // Primary inbox mode: 'SHOPS' (Shop Activation Requests) vs 'TICKETS' (Support Messages)
  const [inboxMode, setInboxMode] = useState<'SHOPS' | 'TICKETS'>('SHOPS');

  // --- 1. SHOP REGISTRATION INBOX STATE ---
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopStatusFilter, setShopStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectAppTarget, setRejectAppTarget] = useState<BrandApplication | null>(null);
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('Incomplete business details');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // --- 2. SUPPORT TICKETS STATE ---
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED' | 'URGENT'>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    inboxMessages.length > 0 ? inboxMessages[0].id : null
  );
  const [replyInput, setReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const q = shopSearchQuery.toLowerCase();
    const matchesSearch =
      app.brandName?.toLowerCase().includes(q) ||
      app.ownerName?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.requestedUsername?.toLowerCase().includes(q) ||
      app.businessCategory?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (shopStatusFilter === 'ALL') return true;
    return app.status === shopStatusFilter;
  });

  const selectedApp =
    applications.find((a) => a.id === selectedAppId) ||
    (filteredApps.length > 0 ? filteredApps[0] : null);

  // Application counts
  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const approvedApps = applications.filter((a) => a.status === 'APPROVED');
  const rejectedApps = applications.filter((a) => a.status === 'REJECTED');
  const unreadTickets = inboxMessages.filter((m) => m.status === 'UNREAD');

  // Filtered Support Tickets
  const filteredTickets = inboxMessages.filter((m) => {
    const q = ticketSearchQuery.toLowerCase();
    const matchesSearch =
      m.storeName?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.senderEmail?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (ticketStatusFilter === 'ALL') return true;
    if (ticketStatusFilter === 'URGENT') return m.priority === 'URGENT' || m.priority === 'HIGH';
    return m.status === ticketStatusFilter;
  });

  const selectedTicket =
    inboxMessages.find((m) => m.id === selectedTicketId) ||
    (filteredTickets.length > 0 ? filteredTickets[0] : null);

  // Handlers for Shop Actions
  const handleActivateShop = async (app: BrandApplication) => {
    setIsProcessingAction(true);
    await activateShop(app.id);
    setSelectedAppId(app.id);
    setIsProcessingAction(false);
  };

  const handleOpenRejectModal = (app: BrandApplication) => {
    setRejectAppTarget(app);
    setCustomRejectReason('');
    setSelectedPresetReason('Incomplete business or tax information');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectAppTarget) return;
    const finalReason = customRejectReason.trim() || selectedPresetReason;
    setIsProcessingAction(true);
    await rejectShop(rejectAppTarget.id, finalReason);
    setIsRejectModalOpen(false);
    setRejectAppTarget(null);
    setIsProcessingAction(false);
  };

  const handleReopenApp = async (app: BrandApplication) => {
    setIsProcessingAction(true);
    await reopenApplication(app.id);
    setIsProcessingAction(false);
  };

  const handleSimulateGetStarted = () => {
    openCreateStoreModal();
  };

  const handleStoreCreated = (newBrandId: string, appId: string) => {
    setShopStatusFilter('APPROVED');
    setSelectedAppId(appId);
  };

  // Handlers for Ticket Actions
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyInput.trim()) return;

    setIsSendingReply(true);
    await replySupportMessage(selectedTicket.id, replyInput);
    setReplyInput('');
    setIsSendingReply(false);
  };

  const handleSelectTicket = (msg: SupportMessage) => {
    setSelectedTicketId(msg.id);
    if (msg.status === 'UNREAD') {
      updateMessageStatus(msg.id, 'READ');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP HEADER: Switch between Shop Activation Inbox & Support Tickets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider border border-emerald-500/20">
              Dev Core Control Inbox
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Incoming Onboarding Requests & Merchant Inquiries
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Developer Core Inbox
          </h1>
        </div>

        {/* Primary Sub-Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-[#121817] p-1.5 rounded-2xl border border-slate-300/60 dark:border-[#232D2B]">
          <button
            onClick={() => setInboxMode('SHOPS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              inboxMode === 'SHOPS'
                ? isDark
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop Registrations (Get Started)</span>
            {pendingApps.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  inboxMode === 'SHOPS'
                    ? 'bg-slate-950 text-white'
                    : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}
              >
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setInboxMode('TICKETS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              inboxMode === 'TICKETS'
                ? isDark
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support Tickets</span>
            {unreadTickets.length > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  inboxMode === 'TICKETS'
                    ? 'bg-slate-950 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {unreadTickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SHOP REGISTRATION & ACTIVATION INBOX                             */}
      {/* ========================================================================= */}
      {inboxMode === 'SHOPS' && (
        <div className="space-y-6">
          {/* Top KPI Metric Cards for Shops */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Pending Review */}
            <div
              onClick={() => setShopStatusFilter('PENDING')}
              className={`p-5 rounded-[28px] border transition shadow-sm text-left cursor-pointer hover:scale-[1.01] ${
                shopStatusFilter === 'PENDING'
                  ? 'ring-2 ring-amber-500/50'
                  : ''
              } ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-500 block uppercase tracking-wider">
                  Pending Review
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-500 mt-1 block tracking-tight font-mono">
                {pendingApps.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Awaiting dev activation or rejection
              </span>
            </div>

            {/* Active / Approved */}
            <div
              onClick={() => setShopStatusFilter('APPROVED')}
              className={`p-5 rounded-[28px] border transition shadow-sm text-left cursor-pointer hover:scale-[1.01] ${
                shopStatusFilter === 'APPROVED'
                  ? 'ring-2 ring-emerald-500/50'
                  : ''
              } ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 block uppercase tracking-wider">
                  Active & Approved
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block tracking-tight font-mono">
                {approvedApps.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Live shops running in production
              </span>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setShopStatusFilter('REJECTED')}
              className={`p-5 rounded-[28px] border transition shadow-sm text-left cursor-pointer hover:scale-[1.01] ${
                shopStatusFilter === 'REJECTED'
                  ? 'ring-2 ring-rose-500/50'
                  : ''
              } ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-500 block uppercase tracking-wider">
                  Rejected
                </span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-rose-500 mt-1 block tracking-tight font-mono">
                {rejectedApps.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Applications denied with reason
              </span>
            </div>

            {/* Total Applications */}
            <div
              onClick={() => setShopStatusFilter('ALL')}
              className={`p-5 rounded-[28px] border transition shadow-sm text-left cursor-pointer hover:scale-[1.01] ${
                shopStatusFilter === 'ALL'
                  ? 'ring-2 ring-slate-400'
                  : ''
              } ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  Total Registrations
                </span>
                <Store className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 block tracking-tight font-mono">
                {applications.length}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Submitted from "Get Started"
              </span>
            </div>
          </div>

          {/* Quick Simulation Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              isDark
                ? 'bg-[#121918] border-[#22312E] text-slate-300'
                : 'bg-emerald-50/60 border-emerald-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Live "Get Started" Testing Sandbox
                </span>
                <p className="text-[11px] text-slate-400">
                  When any merchant completes "Get Started" (/register-brand), their application lands here instantly.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/register-brand"
                target="_blank"
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[11px] transition flex items-center gap-1.5"
              >
                <span>Open "Get Started" Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => openCreateStoreModal()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simulate New Shop Application</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Split Console (List on Left, Dossier & Actions on Right) */}
          <div
            className={`border rounded-[28px] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[640px] transition-colors ${
              isDark
                ? 'bg-[#111717] border-[#232D2B]'
                : 'bg-white border-slate-200/80'
            }`}
          >
            {/* LEFT COLUMN: Applications List (5 cols) */}
            <div
              className={`lg:col-span-5 border-r flex flex-col ${
                isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
              }`}
            >
              {/* Search & Status Filter Header */}
              <div className={`p-4 border-b space-y-3 ${isDark ? 'border-[#232D2B]' : 'border-slate-200/80'}`}>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={shopSearchQuery}
                    onChange={(e) => setShopSearchQuery(e.target.value)}
                    placeholder="Search shop, owner, category, username..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition border ${
                      isDark
                        ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                    }`}
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => {
                    const count =
                      filter === 'ALL'
                        ? applications.length
                        : applications.filter((a) => a.status === filter).length;

                    return (
                      <button
                        key={filter}
                        onClick={() => setShopStatusFilter(filter)}
                        className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition shrink-0 cursor-pointer text-[10px] flex items-center gap-1.5 ${
                          shopStatusFilter === filter
                            ? isDark
                              ? 'bg-emerald-500 text-slate-950 shadow-xs'
                              : 'bg-slate-950 text-white shadow-xs'
                            : isDark
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                        }`}
                      >
                        <span>{filter === 'APPROVED' ? 'ACTIVE' : filter}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                            shopStatusFilter === filter
                              ? isDark
                                ? 'bg-slate-950 text-white'
                                : 'bg-white text-slate-950'
                              : 'bg-black/20 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List of Applications */}
              <div
                className={`flex-1 overflow-y-auto divide-y max-h-[580px] ${
                  isDark ? 'divide-[#1D2625]' : 'divide-slate-100'
                }`}
              >
                {filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <Store className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No shop applications found
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      {shopSearchQuery
                        ? 'Try clearing your search query.'
                        : 'New store registrations submitted via "Get Started" will land here.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateStoreModal()}
                      className="mt-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 text-xs font-bold rounded-xl transition border border-emerald-500/20 cursor-pointer"
                    >
                      + Create New Store (Auto-Active)
                    </button>
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const isSelected = selectedApp?.id === app.id;
                    const isPending = app.status === 'PENDING';
                    const isApproved = app.status === 'APPROVED';
                    const isRejected = app.status === 'REJECTED';

                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`p-4 transition cursor-pointer text-left relative ${
                          isSelected
                            ? isDark
                              ? 'bg-[#182321] border-l-4 border-l-emerald-500'
                              : 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                            : isDark
                            ? 'hover:bg-[#141C1A]'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isPending && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
                            )}
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {app.brandName}
                            </h4>
                          </div>

                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              isPending
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/30'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isApproved ? 'ACTIVE' : app.status}
                          </span>
                        </div>

                        {/* Owner & Category info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                          <span className="truncate">{app.ownerName}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {app.businessCategory}
                          </span>
                        </div>

                        {/* Username handle & applied date */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            s/{app.requestedUsername}
                          </span>
                          <span>
                            {new Date(app.appliedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Action hints if pending */}
                        {isPending && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Needs dev decision
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600">
                              Active / Reject &rarr;
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Full Shop Dossier & Decision Controls (7 cols) */}
            <div
              className={`lg:col-span-7 flex flex-col justify-between ${
                isDark ? 'bg-[#0E1413]' : 'bg-slate-50/50'
              }`}
            >
              {selectedApp ? (
                <div className="flex flex-col h-full justify-between">
                  {/* Shop Dossier Header */}
                  <div
                    className={`p-6 border-b space-y-4 ${
                      isDark ? 'border-[#232D2B]' : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-wider">
                            ONBOARDING APPLICATION #{selectedApp.id.toUpperCase()}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                              selectedApp.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : selectedApp.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            STATUS: {selectedApp.status === 'APPROVED' ? 'ACTIVE & LIVE' : selectedApp.status}
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                          {selectedApp.brandName}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Legal Entity: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedApp.legalName}</span> • Applied via "Get Started"
                        </p>
                      </div>

                      {/* Primary Dev Decision Action Buttons */}
                      <div className="flex items-center gap-2">
                        {selectedApp.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleActivateShop(selectedApp)}
                              disabled={isProcessingAction}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              <span>Active Shop</span>
                            </button>

                            <button
                              onClick={() => handleOpenRejectModal(selectedApp)}
                              disabled={isProcessingAction}
                              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4 stroke-[2]" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {selectedApp.status === 'APPROVED' && (
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/shop/${selectedApp.brandId || selectedApp.requestedUsername}`}
                              target="_blank"
                              className="px-3.5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-emerald-500 transition flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Visit Store</span>
                            </Link>
                            <Link
                              href="/login"
                              target="_blank"
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition"
                            >
                              Login Link
                            </Link>
                          </div>
                        )}

                        {selectedApp.status === 'REJECTED' && (
                          <button
                            onClick={() => handleReopenApp(selectedApp)}
                            disabled={isProcessingAction}
                            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs rounded-xl border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Re-evaluate Application</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status Alert Banner */}
                    {selectedApp.status === 'PENDING' && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            This shop was submitted via <strong>Get Started</strong>. Click <strong>"Active Shop"</strong> to approve and provision workspace credentials.
                          </span>
                        </div>
                        <button
                          onClick={() => handleActivateShop(selectedApp)}
                          className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[11px] rounded-lg shrink-0 cursor-pointer hover:bg-amber-400 transition"
                        >
                          Quick Activate &rarr;
                        </button>
                      </div>
                    )}

                    {selectedApp.status === 'APPROVED' && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>
                            Shop is <strong>ACTIVE</strong> in production! Assigned Store ID:{' '}
                            <strong className="font-mono">{selectedApp.brandId}</strong>. Admin username:{' '}
                            <strong className="font-mono">{selectedApp.requestedUsername}</strong>.
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold">
                          Provisioned Live
                        </span>
                      </div>
                    )}

                    {selectedApp.status === 'REJECTED' && (
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Application Denied</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            Reason: {selectedApp.rejectionReason || 'Verification check failed.'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shop Information Dossier Grid */}
                  <div className="p-6 overflow-y-auto space-y-4 max-h-[460px] flex-1">
                    {/* Section 1: Store Configuration */}
                    <div
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#141C1A] border-[#232D2B]' : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
                        RETAIL OPERATIONS & CAPACITY
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Category</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                            {selectedApp.businessCategory}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">Planned Outlets</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block font-mono">
                            {selectedApp.outletCount || 1} Outlet
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">POS Terminals</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block font-mono">
                            {selectedApp.terminalCount || 1} Terminals
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">GSTIN / Tax ID</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                            {selectedApp.gstin || 'Unspecified'}
                          </span>
                        </div>
                      </div>

                      {selectedApp.businessAddress && (
                        <div className="pt-2 border-t border-slate-100 dark:border-white/5 text-xs flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-300">
                            {selectedApp.businessAddress}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Merchant & Credentials */}
                    <div
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'bg-[#141C1A] border-[#232D2B]' : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
                        MERCHANT OWNER & LOGIN CREDENTIALS
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Owner / Dev Name</span>
                          <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                            {selectedApp.ownerName}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">Email Address</span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] mt-0.5 block truncate">
                            {selectedApp.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block">Phone Number</span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] mt-0.5 block">
                            {selectedApp.phone}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Requested Store Handle
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm block mt-0.5">
                            s/{selectedApp.requestedUsername}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">
                            Allocated Cloud Tier
                          </span>
                          <span className="font-black text-slate-900 dark:text-white text-sm block mt-0.5">
                            Starter Plan (250MB Quota)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Verification Audit Checklist */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-[#141C1A] border-[#232D2B]' : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider block">
                        DEV CORE VERIFICATION CHECKLIST
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Store handle uniqueness validated across Oursell multi-tenant registry</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Owner email and telephone verified for two-way notifications</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Offline IndexedDB schema partition ready for activation</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer for Dev */}
                  <div
                    className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                      isDark ? 'border-[#232D2B] bg-[#0B100F]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Registered on {new Date(selectedApp.appliedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedApp.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleOpenRejectModal(selectedApp)}
                            disabled={isProcessingAction}
                            className="px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
                          >
                            Reject Application
                          </button>
                          <button
                            onClick={() => handleActivateShop(selectedApp)}
                            disabled={isProcessingAction}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Active Shop Now</span>
                          </button>
                        </>
                      ) : selectedApp.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedApp.brandId) {
                                toggleStoreStatus(selectedApp.brandId, 'Dev Core inbox toggle');
                              }
                            }}
                            className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-amber-500 text-xs font-bold transition"
                          >
                            Suspend / Toggle Status
                          </button>
                          <Link
                            href={`/shop/${selectedApp.brandId || selectedApp.requestedUsername}`}
                            target="_blank"
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                          >
                            <span>Open Store Dashboard</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReopenApp(selectedApp)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                        >
                          Reopen & Activate Shop
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-slate-400 space-y-3 m-auto">
                  <Store className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    Select a shop application
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Choose an onboarding submission from the left to inspect business details, activate the shop, or reject the application.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SUPPORT & HELP TICKETS INBOX                                     */}
      {/* ========================================================================= */}
      {inboxMode === 'TICKETS' && (
        <div className="space-y-6">
          {/* Metric cards for tickets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-xs font-bold text-slate-400 block">TOTAL TICKETS</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight font-mono">
                {inboxMessages.length}
              </span>
            </div>

            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-xs font-bold text-emerald-600 block">UNREAD TICKETS</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 block tracking-tight font-mono">
                {unreadTickets.length}
              </span>
            </div>

            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-xs font-bold text-slate-500 block">RESOLVED / REPLIED</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight font-mono">
                {inboxMessages.filter((m) => m.status === 'REPLIED').length}
              </span>
            </div>

            <div
              className={`p-5 rounded-[28px] border transition shadow-sm text-left ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-xs font-bold text-rose-500 block">HIGH / URGENT</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-1 block tracking-tight font-mono">
                {inboxMessages.filter((m) => m.priority === 'URGENT' || m.priority === 'HIGH').length}
              </span>
            </div>
          </div>

          {/* Tickets Split Container */}
          <div
            className={`border rounded-[28px] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 min-h-[620px] transition-colors ${
              isDark
                ? 'bg-[#111717] border-[#232D2B]'
                : 'bg-white border-slate-200/80'
            }`}
          >
            {/* Left Column: Tickets List */}
            <div
              className={`lg:col-span-5 border-r flex flex-col ${
                isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
              }`}
            >
              <div className={`p-4 border-b space-y-3 ${isDark ? 'border-[#232D2B]' : 'border-slate-200/80'}`}>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    placeholder="Search tickets by store, subject..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition border ${
                      isDark
                        ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {(['ALL', 'UNREAD', 'READ', 'REPLIED', 'URGENT'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTicketStatusFilter(filter)}
                      className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition shrink-0 cursor-pointer text-[10px] ${
                        ticketStatusFilter === filter
                          ? isDark
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'bg-slate-950 text-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-400 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`flex-1 overflow-y-auto divide-y max-h-[540px] ${
                  isDark ? 'divide-[#1D2625]' : 'divide-slate-100'
                }`}
              >
                {filteredTickets.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No support tickets found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {ticketSearchQuery ? 'Try clearing your search query.' : 'Store messages will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredTickets.map((msg) => {
                    const isSelected = selectedTicket?.id === msg.id;
                    const isUnread = msg.status === 'UNREAD';

                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectTicket(msg)}
                        className={`p-4 transition cursor-pointer text-left relative ${
                          isSelected
                            ? isDark
                              ? 'bg-[#182321] border-l-4 border-l-emerald-500'
                              : 'bg-slate-50 border-l-4 border-l-slate-950'
                            : isDark
                            ? 'hover:bg-[#141C1A]'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {msg.storeName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mb-1">
                          {msg.subject}
                        </p>

                        <p className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                          {msg.message}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                              msg.priority === 'URGENT'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                                : msg.priority === 'HIGH'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {msg.priority}
                          </span>
                          <span className="text-[9px] font-mono uppercase text-slate-400">
                            Status: {msg.status}
                          </span>
                          {msg.replies?.length > 0 && (
                            <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-1 ml-auto">
                              <MessageSquare className="w-3 h-3" />
                              {msg.replies.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Ticket Conversation Thread */}
            <div
              className={`lg:col-span-7 flex flex-col justify-between ${
                isDark ? 'bg-[#0E1413]' : 'bg-slate-50/50'
              }`}
            >
              {selectedTicket ? (
                <div className="flex flex-col h-full justify-between">
                  <div
                    className={`p-6 border-b space-y-4 ${
                      isDark ? 'border-[#232D2B]' : 'border-slate-200/80 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-600 uppercase font-bold tracking-wider">
                          STORE TICKET #{selectedTicket.id.toUpperCase()}
                        </span>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {selectedTicket.subject}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateMessageStatus(
                              selectedTicket.id,
                              selectedTicket.status === 'REPLIED' ? 'READ' : 'REPLIED'
                            )
                          }
                          className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
                        >
                          {selectedTicket.status === 'REPLIED' ? 'Mark Read' : 'Mark Resolved'}
                        </button>

                        <button
                          onClick={() => deleteMessage(selectedTicket.id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border ${
                        isDark
                          ? 'bg-[#141C1A] border-[#232D2B]'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 dark:text-white">{selectedTicket.storeName}</h5>
                          <span className="text-[11px] font-mono text-slate-400">
                            {selectedTicket.senderName} ({selectedTicket.senderEmail})
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 max-h-[380px] flex-1">
                    <div
                      className={`p-4 rounded-2xl space-y-2 border ${
                        isDark
                          ? 'bg-[#141C1A] border-[#232D2B]'
                          : 'bg-white border-slate-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-slate-900 dark:text-white">{selectedTicket.senderName}</span>
                        <span>wrote:</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.message}
                      </p>
                    </div>

                    {selectedTicket.replies?.map((rep) => (
                      <div
                        key={rep.id}
                        className={`p-4 rounded-2xl space-y-2 ml-4 animate-in fade-in border ${
                          isDark
                            ? 'bg-[#16201E] border-emerald-500/30'
                            : 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-slate-900 dark:text-white">{rep.sender}</span>
                            <span className="text-slate-400">({rep.senderRole})</span>
                          </div>
                          <span className="text-slate-400">
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap">
                          {rep.message}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleSendTicketReply}
                    className={`p-4 border-t space-y-2.5 ${
                      isDark ? 'border-[#232D2B] bg-[#0B100F]' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reply as Dev Core Super Admin</span>
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        placeholder="Type official reply to store owner..."
                        className={`flex-1 p-3 rounded-2xl text-xs outline-none resize-none border transition ${
                          isDark
                            ? 'bg-[#111717] border-[#232D2B] text-white focus:border-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyInput.trim()}
                        className="px-5 py-3 bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 self-end shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">SEND REPLY</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-16 text-center text-slate-400 space-y-3 m-auto">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">Select a support ticket</h4>
                  <p className="text-xs text-slate-400">
                    Choose a conversation from the left to view details and respond.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT APPLICATION WITH REASON PICKER                             */}
      {/* ========================================================================= */}
      {isRejectModalOpen && rejectAppTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Reject Store Application
                  </h3>
                  <p className="text-xs text-slate-400">
                    Store: <strong className="text-slate-700 dark:text-slate-200">{rejectAppTarget.brandName}</strong> ({rejectAppTarget.ownerName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Select Primary Rejection Reason
              </label>

              <div className="grid grid-cols-1 gap-2">
                {[
                  'Incomplete business or tax information',
                  'Duplicate store or brand name',
                  'Contact telephone or email verification failed',
                  'High risk or unsupported product category',
                  'Custom rejection feedback (type below)',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedPresetReason(reason)}
                    className={`p-3 rounded-xl border text-left font-medium transition cursor-pointer flex items-center justify-between ${
                      selectedPresetReason === reason
                        ? 'border-rose-500 bg-rose-500/10 text-rose-500 font-bold'
                        : isDark
                        ? 'border-[#232D2B] bg-[#16201E] text-slate-300 hover:bg-[#1a2624]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedPresetReason === reason && <Check className="w-4 h-4 text-rose-500" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                  Additional Notes / Detailed Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  placeholder="Provide guidance to the merchant on how to correct their application..."
                  className={`w-full p-3 rounded-xl text-xs outline-none border transition resize-none ${
                    isDark
                      ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-rose-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingAction}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm & Reject Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
