'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import {
  Activity,
  Search,
  Filter,
  Download,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

export function DevCoreActivityLogsSection() {
  const { auditLogs, theme } = useDevCoreStore();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.actor?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.targetEntity?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Target', 'Severity', 'Details', 'IP'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actor}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.targetEntity || ''}"`,
      `"${l.severity}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Audit Trail & Administrative Activity
          </h2>
          <p className="text-xs text-slate-500">
            Cryptographically timestamped log of platform administrative actions and security events.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-full transition flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Main Logs Table Container */}
      <div
        className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
        }`}
      >
        {/* Search & Filter Bar */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
          }`}
        >
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by actor, action, details..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-full text-xs outline-none border transition ${
                isDark
                  ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSeverityFilter(sev);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                  severityFilter === sev
                    ? isDark
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-950 text-white font-black'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-950'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                  isDark
                    ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                    : 'border-slate-200/80 bg-slate-50 text-slate-500'
                }`}
              >
                <th className="py-3 px-6">Timestamp (UTC)</th>
                <th className="py-3 px-6">Actor / User</th>
                <th className="py-3 px-6">Action Performed</th>
                <th className="py-3 px-6">Target Entity</th>
                <th className="py-3 px-6">Severity</th>
                <th className="py-3 px-6">Audit Details</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No activity log entries match the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                  >
                    <td className="py-3 px-6 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {log.actor}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {log.actorRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-6 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>

                    <td className="py-3 px-6 font-mono text-[11px] text-slate-500">
                      {log.targetEntity || 'System'}
                    </td>

                    <td className="py-3 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>

                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300 text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs text-slate-500 ${
            isDark ? 'border-[#232D2B]' : 'border-slate-200/80 bg-slate-50/50'
          }`}
        >
          <span>
            Showing {Math.min(filteredLogs.length, (currentPage - 1) * pageSize + 1)}–
            {Math.min(filteredLogs.length, currentPage * pageSize)} of {filteredLogs.length} events
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
