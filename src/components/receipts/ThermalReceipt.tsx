'use client';
import React from 'react';
import { Order } from '@/types/pos';
import { Printer, X, Share2 } from 'lucide-react';

interface ThermalReceiptProps {
  order: Order;
  onClose: () => void;
  currency?: string;
}

export function ThermalReceipt({ order, onClose, currency = '₹' }: ThermalReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `*OURSELL POS - INVOICE RECEIPT*\n` +
      `Bill: ${order.orderNumber}\n` +
      `Store: Central Mart (BRD-101)\n` +
      `Date: ${new Date(order.createdAt).toLocaleString()}\n` +
      `Items: ${order.items.map((i) => `\n- ${i.title} x${i.quantity} = ${currency}${i.lineTotal}`).join('')}\n\n` +
      `*Total Paid: ${currency}${order.grandTotal.toFixed(2)}*\n` +
      `Payment Mode: ${order.paymentMethod}\n` +
      `Thank you for shopping with Oursell!`
    );
    window.open(`https://wa.me/${order.customerPhone ? order.customerPhone.replace(/\D/g, '') : ''}?text=${text}`, '_blank');
  };

  const cgst = (order.taxAmount / 2).toFixed(2);
  const sgst = (order.taxAmount / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[420px] w-full flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Receipt Preview</span>
            <span className="text-[11px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">80mm Thermal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="receipt-content p-6 overflow-y-auto font-mono text-[12px] leading-relaxed text-black bg-white select-text">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-black/40">
            <h1 className="text-lg font-black tracking-wider uppercase">OURSELL POS</h1>
            <p className="text-[11px] font-bold">CENTRAL MART (BRD-101)</p>
            <p className="text-[10px] text-gray-700">102 Brigade Road, Commercial Hub</p>
            <p className="text-[10px] text-gray-700">Phone: +91 98450 11223</p>
            <p className="text-[10px] font-bold mt-1">GSTIN: 29ABCDE1234F1Z5</p>
          </div>

          {/* Meta Info */}
          <div className="py-2 border-b border-dashed border-black/40 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>INV NO: <strong>{order.orderNumber}</strong></span>
              <span>DATE: {new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>CASHIER: {order.cashierName}</span>
              <span>TIME: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between text-[10px] pt-0.5">
                <span>CUSTOMER: {order.customerName}</span>
                <span>{order.customerPhone || ''}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <table className="w-full my-2 text-[11px]">
            <thead>
              <tr className="border-b border-black text-left text-[10px] font-bold">
                <th className="py-1">ITEM</th>
                <th className="text-center py-1">QTY</th>
                <th className="text-right py-1">RATE</th>
                <th className="text-right py-1">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1 pr-1 font-semibold text-[10.5px]">
                    {item.title}
                    {item.notes && <div className="text-[9px] text-gray-500">{item.notes}</div>}
                  </td>
                  <td className="py-1 text-center font-bold">{item.quantity}</td>
                  <td className="py-1 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1 text-right font-bold">{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financials & Tax Slabs */}
          <div className="pt-2 border-t border-dashed border-black/40 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{currency}{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Discount:</span>
                <span>-{currency}{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>CGST (2.5%):</span>
              <span>{currency}{cgst}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>SGST (2.5%):</span>
              <span>{currency}{sgst}</span>
            </div>
            <div className="flex justify-between text-base font-black border-y border-black py-1 my-1">
              <span>NET PAYABLE:</span>
              <span>{currency}{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Tender Details */}
          <div className="py-2 border-b border-dashed border-black/40 text-[10.5px] space-y-0.5">
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase">{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'CASH' && order.cashTendered && (
              <>
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>{currency}{order.cashTendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Change Returned:</span>
                  <span>{currency}{(order.changeDue || 0).toFixed(2)}</span>
                </div>
              </>
            )}
            {order.cardRefCode && (
              <div className="flex justify-between text-[10px]">
                <span>Auth Reference:</span>
                <span>{order.cardRefCode}</span>
              </div>
            )}
            {order.upiRef && (
              <div className="flex justify-between text-[10px]">
                <span>UPI Txn ID:</span>
                <span>{order.upiRef}</span>
              </div>
            )}
          </div>

          {/* Barcode & Footer */}
          <div className="text-center pt-3 space-y-1">
            <div className="font-mono text-xs tracking-widest bg-gray-100 py-1 rounded border border-dashed border-gray-400">
              *{order.orderNumber}*
            </div>
            <p className="text-[9.5px] text-gray-600 mt-2">Goods once sold can be exchanged within 7 days with bill.</p>
            <p className="text-[10px] font-bold uppercase mt-1">Thank you for visiting Oursell!</p>
            <p className="text-[8px] text-gray-400">Powered by Oursell Retail OS v3.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
