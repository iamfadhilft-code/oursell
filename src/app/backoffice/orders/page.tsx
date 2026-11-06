'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/db/posDb';
import { Order, OrderItem } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { ThermalReceipt } from '@/components/receipts/ThermalReceipt';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Filter,
  Eye,
  X,
  CreditCard,
  Banknote,
  QrCode,
  BookOpen,
} from 'lucide-react';

export default function OrdersPage() {
  const { activeBrandId, currency } = usePosStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Modals
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);
  const [returningOrder, setReturningOrder] = useState<Order | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<'CASH' | 'STORE_CREDIT'>('CASH');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadOrders = async () => {
    const list = await db.orders.reverse().sortBy('createdAt');
    setOrders(list);
  };

  useEffect(() => {
    loadOrders();
  }, [activeBrandId]);

  const handleOpenReturnModal = (ord: Order) => {
    setReturningOrder(ord);
    // Initialize return quantities with 0
    const initial: Record<string, number> = {};
    ord.items.forEach((item) => {
      initial[item.productId] = 0;
    });
    setReturnItemsState(initial);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningOrder) return;

    let totalRefundAmount = 0;
    let anyItemReturned = false;

    // 1. Calculate refund & restock
    for (const item of returningOrder.items) {
      const returnQty = returnItemsState[item.productId] || 0;
      if (returnQty > 0) {
        anyItemReturned = true;
        const itemRefund = returnQty * item.unitPrice;
        totalRefundAmount += itemRefund;

        // Restock inventory
        const prod = await db.products.get(item.productId);
        if (prod) {
          await db.products.update(item.productId, {
            stock: prod.stock + returnQty,
          });
        }
      }
    }

    if (!anyItemReturned) {
      alert('Please specify at least 1 item quantity to return.');
      return;
    }

    // 2. If refunding via Store Credit to customer
    if (refundMode === 'STORE_CREDIT' && returningOrder.customerId) {
      const cust = await db.customers.get(returningOrder.customerId);
      if (cust) {
        const newBalance = Math.max(0, cust.storeCreditBalance - totalRefundAmount);
        await db.customers.update(cust.id, { storeCreditBalance: newBalance });
        await db.customer_credit_ledger.add({
          id: `ccl-${Date.now()}`,
          brandId: activeBrandId,
          customerId: cust.id,
          type: 'PAYMENT_RECEIVED',
          amount: totalRefundAmount,
          orderId: returningOrder.id,
          balanceAfter: newBalance,
          notes: `Return refund for bill ${returningOrder.orderNumber}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Update order status
    await db.orders.update(returningOrder.id, {
      status: 'REFUNDED',
      notes: `${returningOrder.notes ? returningOrder.notes + ' • ' : ''}Refunded ${currency}${totalRefundAmount.toFixed(2)} via ${refundMode}`,
    });

    setReturningOrder(null);
    setActionNotice(`Refund of ${currency}${totalRefundAmount.toFixed(2)} processed and stock restocked.`);
    setTimeout(() => setActionNotice(null), 4000);
    await loadOrders();
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.customerPhone && o.customerPhone.includes(searchQuery));
    const matchesMethod = methodFilter === 'ALL' || o.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      <PosSidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <PosHeader />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Title & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-teal-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Transaction History & Returns
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit past receipts, reprint 80mm slips, and process item returns with automatic stock replenishment.
              </p>
            </div>
          </div>

          {actionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice number, customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Payment:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI / QR</option>
                <option value="KHATA">Khata / Credit</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Invoice #</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Cashier</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 text-xs">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                          {ord.orderNumber}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {new Date(ord.createdAt).toLocaleDateString()}{' '}
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          {ord.customerName ? (
                            <div>
                              <span>{ord.customerName}</span>
                              <span className="text-[10px] text-slate-400 block">{ord.customerPhone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Walk-in</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">{ord.cashierName}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10.5px] bg-slate-100 text-slate-700">
                            {ord.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                          {currency}{ord.grandTotal.toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono ${
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3.5 pr-5 text-right space-x-1.5">
                          <button
                            onClick={() => setReprintOrder(ord)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                          >
                            Reprint
                          </button>
                          {ord.status !== 'REFUNDED' && (
                            <button
                              onClick={() => handleOpenReturnModal(ord)}
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* PROCESS RETURN / REFUND MODAL */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Process Item Return & Refund</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{returningOrder.orderNumber}</p>
              </div>
              <button onClick={() => setReturningOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="flex-1 overflow-y-auto space-y-4 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                Select Return Quantities
              </span>

              <div className="space-y-2">
                {returningOrder.items.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-slate-800">{item.title}</h5>
                      <span className="text-[10.5px] text-slate-500 font-mono">
                        Purchased: {item.quantity} × {currency}{item.unitPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Return Qty:</label>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItemsState[item.productId] || 0}
                        onChange={(e) =>
                          setReturnItemsState({
                            ...returnItemsState,
                            [item.productId]: Math.min(
                              item.quantity,
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          })
                        }
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Refund Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMode('CASH')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      refundMode === 'CASH'
                        ? 'bg-teal-600 text-white border-teal-600 shadow'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    Cash Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMode('STORE_CREDIT')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      refundMode === 'STORE_CREDIT'
                        ? 'bg-teal-600 text-white border-teal-600 shadow'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    Store Credit / Khata
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReturningOrder(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow"
                >
                  Confirm Return & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPRINT MODAL */}
      {reprintOrder && (
        <ThermalReceipt
          order={reprintOrder}
          currency={currency}
          onClose={() => setReprintOrder(null)}
        />
      )}
    </div>
  );
}
