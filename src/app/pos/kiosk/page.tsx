'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/db/posDb';
import { Product, OrderItem, Order } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import { useBarcodeScanner, playBeepSound } from '@/hooks/useBarcodeScanner';
import { ThermalReceipt } from '@/components/receipts/ThermalReceipt';
import {
  MonitorPlay,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  CreditCard,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export default function KioskPage() {
  const { activeBrandId, currency } = usePosStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    db.products.toArray().then(setProducts);
  }, [activeBrandId]);

  useBarcodeScanner({
    onScan: (barcode) => {
      const match = products.find((p) => p.barcode === barcode);
      if (match) {
        handleAddToCart(match);
      }
    },
  });

  const handleAddToCart = (prod: Product) => {
    playBeepSound();
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          lineTotal: newQty * updated[idx].unitPrice,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            title: prod.title,
            quantity: 1,
            unitPrice: prod.sellingPrice,
            discount: 0,
            taxRate: prod.taxRate,
            lineTotal: prod.sellingPrice,
            image: prod.image,
            barcode: prod.barcode,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: qty, lineTotal: qty * i.unitPrice } : i))
      );
    }
  };

  const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Bakery', 'Restaurant'];
  const filtered = products.filter(
    (p) => selectedCategory === 'All' || p.category === selectedCategory
  );

  const subtotal = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + tax;

  const handleFinalizeKioskSale = async (method: 'CARD' | 'UPI') => {
    const orderNum = `SCO-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      brandId: activeBrandId,
      orderNumber: orderNum,
      items: [...cart],
      subtotal,
      discountAmount: 0,
      taxAmount: tax,
      grandTotal,
      paymentMethod: method,
      cashierId: 'kiosk-01',
      cashierName: 'Self-Checkout Kiosk',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    await db.orders.add(newOrder);

    // Decrement stock
    for (const item of cart) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(item.productId, { stock: Math.max(0, prod.stock - item.quantity) });
      }
    }

    setCart([]);
    setIsCheckoutOpen(false);
    setCompletedOrder(newOrder);
  };

  return (
    <div className="h-screen w-screen bg-slate-900 text-white font-sans flex flex-col overflow-hidden select-none">
      {/* Top Kiosk Header */}
      <header className="h-20 bg-slate-950 border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-500/20">
            O
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">OURSELL EXPRESS</h1>
            <p className="text-xs text-teal-400 font-bold">Self-Checkout Touch Kiosk Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Tap items or scan barcode</span>
            <span className="text-xs font-bold text-emerald-400">● Scanner Ready</span>
          </div>
          <Link
            href="/pos/register"
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Kiosk
          </Link>
        </div>
      </header>

      {/* Main Kiosk Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Huge Touch Category & Product Grid */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">
          {/* Category Touch Buttons */}
          <div className="flex gap-3 overflow-x-auto pb-1 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3.5 rounded-2xl text-sm font-extrabold transition shadow-md whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-teal-500 text-slate-950 shadow-teal-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid with Huge Touch Tiles */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className="bg-slate-800 border border-slate-700 hover:border-teal-500 rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition transform active:scale-95 shadow-lg group"
              >
                <div className="h-32 w-full rounded-2xl overflow-hidden bg-slate-900 relative mb-3">
                  {prod.image && (
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-black/70 px-2 py-0.5 rounded-md">
                    {prod.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white line-clamp-1">{prod.title}</h4>
                  <span className="text-xl font-black text-teal-400 font-mono mt-1 block">
                    {currency}{prod.sellingPrice.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/80 flex justify-between items-center text-xs font-bold text-slate-400 group-hover:text-teal-300">
                  <span>Tap to Add</span>
                  <Plus className="w-4 h-4 text-teal-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Kiosk Basket & Pay Panel */}
        <div className="w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-base text-white">Your Tray</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-teal-950 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-800">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            {/* Tray items list */}
            <div className="space-y-3 mt-4 max-h-[46vh] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-700 mx-auto stroke-1" />
                  <p>Your tray is currently empty.</p>
                  <p className="text-[11px] text-slate-600">Tap items on the left to add them.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-white block truncate">{item.title}</span>
                      <span className="font-mono text-teal-400 font-bold block mt-0.5">
                        {currency}{item.lineTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-700 text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono font-black text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-slate-700 text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateQty(item.productId, 0)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Totals & Big Pay CTA */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (5%)</span>
                <span className="font-mono text-white">{currency}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="font-mono text-teal-400 text-2xl">{currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-base rounded-2xl transition shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              PAY & GET RECEIPT
            </button>
          </div>
        </div>
      </div>

      {/* KIOSK PAYMENT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
            <div>
              <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest">
                Self-Checkout Pay
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Choose Payment Method</h2>
              <div className="text-4xl font-black text-teal-400 font-mono mt-2">
                {currency}{grandTotal.toFixed(2)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleFinalizeKioskSale('CARD')}
                className="p-6 bg-slate-800 hover:bg-teal-500/20 border-2 border-slate-700 hover:border-teal-400 rounded-3xl flex flex-col items-center gap-3 transition group"
              >
                <CreditCard className="w-10 h-10 text-teal-400 group-hover:scale-110 transition" />
                <span className="font-extrabold text-sm text-white">Tap Card / Phone</span>
              </button>

              <button
                onClick={() => handleFinalizeKioskSale('UPI')}
                className="p-6 bg-slate-800 hover:bg-teal-500/20 border-2 border-slate-700 hover:border-teal-400 rounded-3xl flex flex-col items-center gap-3 transition group"
              >
                <QrCode className="w-10 h-10 text-teal-400 group-hover:scale-110 transition" />
                <span className="font-extrabold text-sm text-white">Scan UPI QR</span>
              </button>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel and Return to Tray
            </button>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {completedOrder && (
        <ThermalReceipt
          order={completedOrder}
          currency={currency}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
