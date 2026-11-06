'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { ShiftSession } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { translations } from '@/lib/i18n';
import {
  Clock,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Layers,
  X,
} from 'lucide-react';

export default function ShiftsPage() {
  const { activeBrandId, currency, language, activeCashier } = usePosStore();
  const t = translations[language];

  const [shifts, setShifts] = useState<ShiftSession[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(null);

  // Mid-Shift Move modal
  const [isCashMoveOpen, setIsCashMoveOpen] = useState(false);
  const [moveType, setMoveType] = useState<'PAY_IN' | 'PAY_OUT'>('PAY_OUT');
  const [moveAmount, setMoveAmount] = useState<number>(100);
  const [moveReason, setMoveReason] = useState<string>('Tea / Snacks');

  // Close Shift & Blind Count Modal
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [denomCounts, setDenomCounts] = useState<Record<string, number>>({
    '2000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
    'coins': 0,
  });
  const [manualCountedCash, setManualCountedCash] = useState<number>(0);
  const [closedZReport, setClosedZReport] = useState<ShiftSession | null>(null);

  const loadShifts = async () => {
    const list = await db.shifts.toArray();
    setShifts(list);
    const open = list.find((s) => s.status === 'OPEN');
    setActiveShift(open || null);
  };

  useEffect(() => {
    loadShifts();
  }, [activeBrandId]);

  // Compute total counted from denominations
  const totalCountedFromDenoms =
    (denomCounts['2000'] || 0) * 2000 +
    (denomCounts['500'] || 0) * 500 +
    (denomCounts['200'] || 0) * 200 +
    (denomCounts['100'] || 0) * 100 +
    (denomCounts['50'] || 0) * 50 +
    (denomCounts['20'] || 0) * 20 +
    (denomCounts['10'] || 0) * 10 +
    (denomCounts['coins'] || 0);

  const effectiveCounted = totalCountedFromDenoms > 0 ? totalCountedFromDenoms : manualCountedCash;

  const expectedCash = activeShift
    ? activeShift.openingFloat + activeShift.cashSales + activeShift.payIns - activeShift.payOuts
    : 0;

  const variance = effectiveCounted - expectedCash;
  const varianceType = Math.abs(variance) < 0.01 ? 'BALANCED' : variance > 0 ? 'OVER' : 'SHORT';

  const handleCashMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || moveAmount <= 0) return;

    const newPayIns = moveType === 'PAY_IN' ? activeShift.payIns + moveAmount : activeShift.payIns;
    const newPayOuts = moveType === 'PAY_OUT' ? activeShift.payOuts + moveAmount : activeShift.payOuts;

    await db.shifts.update(activeShift.id, {
      payIns: newPayIns,
      payOuts: newPayOuts,
    });

    // Record in store expenses
    if (moveType === 'PAY_OUT') {
      await db.store_expenses.add({
        id: `exp-${Date.now()}`,
        brandId: activeBrandId,
        shiftId: activeShift.id,
        category: 'TEA_SNACKS',
        amount: moveAmount,
        notes: moveReason,
        paidByCashier: activeCashier.name,
        createdAt: new Date().toISOString(),
      });
    }

    setIsCashMoveOpen(false);
    await loadShifts();
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;

    const updatedShift: ShiftSession = {
      ...activeShift,
      closingCashCounted: effectiveCounted,
      expectedCash,
      variance,
      varianceType,
      closedAt: new Date().toISOString(),
      status: 'CLOSED',
    };

    await db.shifts.update(activeShift.id, updatedShift);
    setIsCloseShiftOpen(false);
    setClosedZReport(updatedShift);
    await loadShifts();
  };

  const handleOpenNewShift = async () => {
    const float = prompt('Enter Opening Cash Float amount:', '2000');
    if (!float) return;

    const newShiftNum = `Shift #${shifts.length + 1}`;
    const newShift: ShiftSession = {
      id: `shift-${Date.now()}`,
      brandId: activeBrandId,
      shiftNumber: newShiftNum,
      cashierId: activeCashier.id,
      cashierName: activeCashier.name,
      openingFloat: parseFloat(float) || 0,
      expectedCash: parseFloat(float) || 0,
      payIns: 0,
      payOuts: 0,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
      khataSales: 0,
      totalSales: 0,
      openedAt: new Date().toISOString(),
      status: 'OPEN',
    };

    await db.shifts.add(newShift);
    await loadShifts();
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Title & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Shift Float Management & Z-Report
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage cash drawer floats, mid-shift payouts, and blind reconciliation closeout slips.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeShift ? (
                <>
                  <button
                    onClick={() => setIsCashMoveOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                    Cash In / Out
                  </button>
                  <button
                    onClick={() => setIsCloseShiftOpen(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow"
                  >
                    Close Shift (Z-Report)
                  </button>
                </>
              ) : (
                <button
                  onClick={handleOpenNewShift}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Open New Shift
                </button>
              )}
            </div>
          </div>

          {/* Active Shift Live Overview Card */}
          {activeShift ? (
            <div className="bg-white border border-teal-300 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-black">
                    {activeShift.shiftNumber.slice(-2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{activeShift.shiftNumber}</h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full">
                        ACTIVE LIVE
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Opened by: <strong>{activeShift.cashierName}</strong> at{' '}
                      {new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Shift Sales</span>
                  <span className="text-2xl font-black font-mono text-teal-700">
                    {currency}{activeShift.totalSales.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 4 Shift Breakdown Metric Blocks */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Opening Float</span>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {currency}{activeShift.openingFloat.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Cash Sales</span>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {currency}{activeShift.cashSales.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 block">Card + UPI Sales</span>
                  <span className="text-lg font-black font-mono text-slate-800">
                    {currency}{(activeShift.cardSales + activeShift.upiSales).toFixed(2)}
                  </span>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                  <span className="text-[10.5px] uppercase font-bold text-amber-800 block">Expected Drawer Cash</span>
                  <span className="text-lg font-black font-mono text-amber-950">
                    {currency}{expectedCash.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Active Shift Currently Open</h3>
              <p className="text-xs text-slate-400">Click &quot;Open New Shift&quot; above to declare opening cash float.</p>
            </div>
          )}

          {/* Historical Shifts Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Previous Shift Reconciliation History
            </h2>

            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Shift ID</th>
                    <th className="p-3.5">Cashier</th>
                    <th className="p-3.5">Opened At</th>
                    <th className="p-3.5">Float</th>
                    <th className="p-3.5">Total Sales</th>
                    <th className="p-3.5">Counted Cash</th>
                    <th className="p-3.5">Variance</th>
                    <th className="p-3.5 pr-5 text-right">Z-Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3.5 pl-5 font-bold font-mono text-slate-900">{s.shiftNumber}</td>
                      <td className="p-3.5 font-medium text-slate-700">{s.cashierName}</td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(s.openedAt).toLocaleDateString()} {new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{currency}{s.openingFloat.toFixed(2)}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">{currency}{s.totalSales.toFixed(2)}</td>
                      <td className="p-3.5 font-mono text-slate-600">
                        {s.closingCashCounted !== undefined ? `${currency}${s.closingCashCounted.toFixed(2)}` : 'In Progress'}
                      </td>
                      <td className="p-3.5 font-mono">
                        {s.variance !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.varianceType === 'BALANCED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : s.varianceType === 'OVER'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {s.variance >= 0 ? '+' : ''}{currency}{s.variance.toFixed(2)} ({s.varianceType})
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => setClosedZReport(s)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* MID-SHIFT CASH MOVE MODAL */}
      {isCashMoveOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Record Mid-Shift Cash Move</h3>

            <form onSubmit={handleCashMove} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMoveType('PAY_OUT')}
                  className={`py-2 rounded-xl font-bold border transition ${
                    moveType === 'PAY_OUT'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  Cash Out (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setMoveType('PAY_IN')}
                  className={`py-2 rounded-xl font-bold border transition ${
                    moveType === 'PAY_IN'
                      ? 'bg-teal-600 text-white border-teal-600 shadow'
                      : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  Cash In (Float Add)
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={moveAmount}
                  onChange={(e) => setMoveAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  placeholder="e.g. Tea / Snacks, Courier, Emergency"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCashMoveOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow"
                >
                  Confirm Cash Move
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE SHIFT BLIND COUNT MODAL */}
      {isCloseShiftOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Close Shift & Blind Cash Count</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Count the physical bills and coins in your drawer before system comparison.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Currency Denomination Counter
              </span>

              {['2000', '500', '200', '100', '50', '20', '10'].map((denom) => (
                <div key={denom} className="flex items-center justify-between gap-3">
                  <span className="font-bold font-mono text-slate-700 w-16">{currency}{denom} ×</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denomCounts[denom] || ''}
                    onChange={(e) =>
                      setDenomCounts({ ...denomCounts, [denom]: parseInt(e.target.value) || 0 })
                    }
                    className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                  />
                  <span className="font-mono text-slate-500 w-20 text-right">
                    = {currency}{((denomCounts[denom] || 0) * parseInt(denom)).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-bold text-slate-700 w-16">Coins:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={denomCounts['coins'] || ''}
                  onChange={(e) =>
                    setDenomCounts({ ...denomCounts, coins: parseFloat(e.target.value) || 0 })
                  }
                  className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                />
                <span className="font-mono text-slate-500 w-20 text-right">
                  = {currency}{(denomCounts['coins'] || 0).toFixed(2)}
                </span>
              </div>

              {/* Summary Calculation */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs mt-3">
                <div className="flex justify-between font-bold">
                  <span>Counted Cash:</span>
                  <span className="font-mono text-slate-900">{currency}{effectiveCounted.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Expected System Cash:</span>
                  <span className="font-mono">{currency}{expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black pt-1 border-t border-slate-200">
                  <span>Variance:</span>
                  <span
                    className={`font-mono ${
                      varianceType === 'BALANCED'
                        ? 'text-emerald-700'
                        : varianceType === 'OVER'
                        ? 'text-blue-700'
                        : 'text-red-700'
                    }`}
                  >
                    {variance >= 0 ? '+' : ''}{currency}{variance.toFixed(2)} ({varianceType})
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCloseShiftOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseShift}
                className="flex-[2] py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Reconcile & Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE Z-REPORT SUMMARY SLIP */}
      {closedZReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 font-mono text-[11px] leading-tight text-black">
            <div className="text-center border-b border-dashed border-black/40 pb-3">
              <h3 className="font-black text-base uppercase">OURSELL POS</h3>
              <p className="font-bold">SHIFT RECONCILIATION Z-REPORT</p>
              <p className="text-[10px] text-gray-600 mt-1">{closedZReport.shiftNumber}</p>
            </div>

            <div className="space-y-1 py-2 border-b border-dashed border-black/40 text-[10.5px]">
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <strong>{closedZReport.cashierName}</strong>
              </div>
              <div className="flex justify-between">
                <span>OPENED:</span>
                <span>{new Date(closedZReport.openedAt).toLocaleTimeString()}</span>
              </div>
              {closedZReport.closedAt && (
                <div className="flex justify-between">
                  <span>CLOSED:</span>
                  <span>{new Date(closedZReport.closedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 py-2 border-b border-dashed border-black/40">
              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span>{currency}{closedZReport.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cash Sales:</span>
                <span>+{currency}{closedZReport.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pay-Ins:</span>
                <span>+{currency}{closedZReport.payIns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pay-Outs:</span>
                <span>-{currency}{closedZReport.payOuts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-black/20 pt-1">
                <span>Expected Drawer:</span>
                <span>{currency}{(closedZReport.expectedCash || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Actual Counted:</span>
                <span>{currency}{(closedZReport.closingCashCounted || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xs border-t border-black pt-1">
                <span>VARIANCE:</span>
                <span>
                  {(closedZReport.variance || 0) >= 0 ? '+' : ''}
                  {currency}{(closedZReport.variance || 0).toFixed(2)} ({closedZReport.varianceType})
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-[9px] text-gray-500">End of Shift Audit Slip</p>
            </div>

            <div className="pt-2 flex gap-2 no-print">
              <button
                type="button"
                onClick={() => setClosedZReport(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
