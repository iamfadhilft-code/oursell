'use client';
import React, { useState, useEffect, useRef } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { db } from '@/db/posDb';
import { Product, Order, Customer } from '@/types/pos';
import { useBarcodeScanner, playBeepSound } from '@/hooks/useBarcodeScanner';
import { translations } from '@/lib/i18n';
import { PosSidebar } from '@/components/layout/PosSidebar';
import { PosHeader } from '@/components/layout/PosHeader';
import { PaymentModal } from '@/components/register/PaymentModal';
import { ThermalReceipt } from '@/components/receipts/ThermalReceipt';
import { CustomerModal } from '@/components/register/CustomerModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Pause,
  Receipt,
  Tag,
  User,
  Heart,
} from 'lucide-react';

export default function PosRegisterPage() {
  const {
    activeBrandId,
    currency,
    language,
    cart,
    heldCarts,
    selectedCustomer,
    appliedPromo,
    donationAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    parkCart,
    recallCart,
    deleteHeldCart,
    applyPromoCode,
    removePromo,
    selectCustomer,
    getTotals,
  } = usePosStore();

  const t = translations[language];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [promoInput, setPromoInput] = useState<string>('');
  const [promoFeedback, setPromoFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [cartFlash, setCartFlash] = useState(false);
  const [activeShiftInfo, setActiveShiftInfo] = useState<{ id: string; openingFloat: number; shiftSales: number }>({
    id: 'Shift #01',
    openingFloat: 2000,
    shiftSales: 0,
  });

  // Load products from IndexedDB
  const loadProducts = async () => {
    const prods = await db.products.toArray();
    setProducts(prods);

    const [shifts, orders] = await Promise.all([
      db.shifts.toArray(),
      db.orders.toArray(),
    ]);

    const openShift = shifts.find((s) => s.status === 'OPEN') || shifts[0];
    const totalSales = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    if (openShift) {
      setActiveShiftInfo({
        id: openShift.shiftNumber || 'Shift #01',
        openingFloat: openShift.openingFloat || 2000,
        shiftSales: totalSales,
      });
    }
  };

  useEffect(() => {
    loadProducts();
    // Refresh held carts from DB
    db.held_carts.toArray().then((held) => {
      usePosStore.setState({ heldCarts: held });
    });
  }, [activeBrandId]);

  // Barcode Scanner Listener
  useBarcodeScanner({
    onScan: (barcode) => {
      const match = products.find((p) => p.barcode === barcode);
      if (match) {
        const added = addItem(match);
        if (added) {
          triggerCartFlash();
        }
      }
    },
  });

  const triggerCartFlash = () => {
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 250);
  };

  // Keyboard Shortcuts: Space to Pay, F1 to Search, F2 to Park
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isPaymentModalOpen && !isCustomerModalOpen && cart.length > 0) {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
          e.preventDefault();
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault();
        handleParkCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPaymentModalOpen, isCustomerModalOpen]);

  // Categories list with item counts
  const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Bakery', 'Apparel', 'Restaurant'];
  const categoryCounts = categories.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'All') acc[cat] = products.length;
    else acc[cat] = products.filter((p) => p.category === cat).length;
    return acc;
  }, {});

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Totals
  const { subtotal, discountTotal, taxTotal, donation, grandTotal, itemCount } = getTotals();

  // Handlers
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = await applyPromoCode(promoInput.trim());
    setPromoFeedback(res);
    if (res.success) {
      setPromoInput('');
    }
    setTimeout(() => setPromoFeedback(null), 3500);
  };

  const handleParkCart = async () => {
    const success = await parkCart();
    if (success) {
      playBeepSound();
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      {/* 1. SLIM 64PX ICON NAVIGATION RAIL */}
      <PosSidebar />

      {/* 2. MAIN APPLICATION VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <PosHeader />

        {/* Workspace Body: Split between Product Grid (Left) and Billing Panel (Right) */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          
          {/* MIDDLE: CATALOG & ORDER LINE (FLEX-1) */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] p-4 gap-3">
            
            {/* Top Ribbon: Active Shift & Parked Carts Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 shrink-0">
              {/* Active Shift Card */}
              <div className="bg-white border border-teal-200/80 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-xs shrink-0">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900">{activeShiftInfo.id}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Float: {currency}{activeShiftInfo.openingFloat.toLocaleString()} • Sales: {currency}{activeShiftInfo.shiftSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Parked Carts Cards (Scrollable) */}
              {heldCarts.map((held) => (
                <div
                  key={held.id}
                  className="bg-amber-50/70 border border-amber-200/90 rounded-2xl px-3.5 py-2 flex items-center gap-3 shadow-xs shrink-0 hover:bg-amber-100/60 transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <Pause className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-950">{held.heldNumber}</span>
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-200/60 px-1.5 py-0.5 rounded">
                        {held.items.length} items
                      </span>
                    </div>
                    <span className="text-[10.5px] text-slate-600 block">
                      {held.customerLabel} • <strong>{currency}{held.total.toFixed(2)}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => recallCart(held.id)}
                    className="ml-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    title="Recall Held Cart"
                  >
                    {t.recall}
                  </button>
                  <button
                    onClick={() => deleteHeldCart(held.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    title="Delete Held Cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Search Bar & Category Chips Row */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-3">
                {/* Global Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    data-barcode-target="true"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-2xl shadow-xs focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Add Custom Item button / Hotkey hint */}
                <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">[Space]</span> Pay
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600 ml-1">[F1]</span> Scan
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isSelected ? 'bg-teal-700/60 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid (Scrollable, 3 to 4 columns) */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Search className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-semibold">No products match your search or category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((prod) => {
                    const cartItem = cart.find((i) => i.productId === prod.id);
                    const qtyInCart = cartItem ? cartItem.quantity : 0;
                    const isLowStock = prod.stock <= prod.lowStockThreshold && prod.stock > 0;
                    const isOutOfStock = prod.stock === 0;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-white rounded-2xl border p-3 flex flex-col justify-between shadow-xs transition hover:shadow-md relative overflow-hidden group ${
                          qtyInCart > 0
                            ? 'border-teal-500 ring-1 ring-teal-500/30'
                            : 'border-slate-200/80 hover:border-slate-300'
                        } ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                      >
                        {/* Top Badges */}
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            {prod.barcode.slice(-6)}
                          </span>

                          {/* Stock status badge */}
                          {isOutOfStock ? (
                            <span className="bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Only {prod.stock} left!
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              Stock: <strong className="text-slate-700">{prod.stock}</strong>
                            </span>
                          )}
                        </div>

                        {/* Product Image & Thumbnail */}
                        <div className="h-24 w-full rounded-xl overflow-hidden bg-slate-50 relative my-1 flex items-center justify-center">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <Tag className="w-8 h-8 text-slate-300" />
                          )}
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                            {prod.category}
                          </span>
                        </div>

                        {/* Product Title */}
                        <div className="mt-1">
                          <h4
                            className="font-bold text-slate-800 text-xs line-clamp-1 leading-snug group-hover:text-teal-700 transition"
                            title={prod.title}
                          >
                            {prod.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {prod.sku} • GST {prod.taxRate}%
                          </p>
                        </div>

                        {/* Bottom Row: Price & Quantity Controls */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block line-through">
                              {currency}{prod.mrp.toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {currency}{prod.sellingPrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Action: Add to Cart button or Stepper */}
                          {qtyInCart === 0 ? (
                            <button
                              disabled={isOutOfStock}
                              onClick={() => {
                                const added = addItem(prod);
                                if (added) {
                                  triggerCartFlash();
                                  playBeepSound();
                                }
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add
                            </button>
                          ) : (
                            <div className="flex items-center bg-teal-50 border border-teal-200 rounded-xl overflow-hidden shadow-xs">
                              <button
                                onClick={() => updateQuantity(prod.id, qtyInCart - 1, prod.stock)}
                                className="p-1 text-teal-800 hover:bg-teal-100 transition active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-black text-teal-950">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => {
                                  if (qtyInCart < prod.stock) {
                                    updateQuantity(prod.id, qtyInCart + 1, prod.stock);
                                    triggerCartFlash();
                                    playBeepSound();
                                  }
                                }}
                                disabled={qtyInCart >= prod.stock}
                                className="p-1 text-teal-800 hover:bg-teal-100 disabled:opacity-40 transition active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* 3. RIGHT BILLING & CART SIDEBAR (380PX FIXED) */}
          <aside
            className={`w-[380px] bg-white border-l border-slate-200 flex flex-col justify-between shadow-xl shrink-0 transition duration-150 ${
              cartFlash ? 'ring-2 ring-emerald-500/80 bg-emerald-50/20' : ''
            }`}
          >
            {/* Top Customer Link Header */}
            <div className="p-3.5 border-b border-slate-200 bg-[#F8FAFC]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.cartSummary}
                </span>
                <span className="font-mono text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                  BILL #INV-{new Date().toISOString().slice(2, 10).replace(/-/g, '')}-1092
                </span>
              </div>

              {/* Linked Customer Profile */}
              <div className="mt-2 flex items-center justify-between">
                {selectedCustomer ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 text-xs">{selectedCustomer.name}</span>
                      <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 rounded font-bold">
                        {selectedCustomer.loyaltyPoints} pts
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{selectedCustomer.phone}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs font-medium">Walk-in Customer</div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-white rounded-lg border border-slate-200 text-xs font-bold transition flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{selectedCustomer ? 'Change' : '+ Customer'}</span>
                  </button>
                  {selectedCustomer && (
                    <button
                      onClick={() => selectCustomer(null)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Unlink Customer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Cart Line Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                  <Receipt className="w-10 h-10 text-slate-200 stroke-1" />
                  <p className="text-xs font-bold text-slate-600">Cart is Empty</p>
                  <p className="text-[11px] text-slate-400">
                    Scan a barcode or tap products from the catalog to start billing.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 bg-[#F8FAFC] border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs hover:border-slate-300 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 line-clamp-1 leading-tight">
                        {item.title}
                      </h5>
                      <span className="text-[10.5px] text-slate-500 block mt-0.5">
                        {currency}{item.unitPrice.toFixed(2)} × {item.quantity} ={' '}
                        <strong className="text-slate-800">{currency}{item.lineTotal.toFixed(2)}</strong>
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 text-slate-600 hover:bg-slate-100 transition active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-black text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 text-slate-600 hover:bg-slate-100 transition active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Billing Summary & Actions */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
              {/* Promo Code Input Accordion */}
              <div>
                {!appliedPromo ? (
                  <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. WELCOME10)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl uppercase font-mono tracking-wider focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={cart.length === 0}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </form>
                ) : (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {appliedPromo.code} ({appliedPromo.title})
                    </span>
                    <button
                      onClick={removePromo}
                      className="text-red-600 hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {promoFeedback && (
                  <p
                    className={`text-[10px] mt-1 font-semibold ${
                      promoFeedback.success ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {promoFeedback.message}
                  </p>
                )}
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
                <div className="flex justify-between">
                  <span>{t.subtotal} ({itemCount} items)</span>
                  <span className="font-semibold text-slate-800">{currency}{subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-red-500 font-semibold">
                    <span>{t.discount}</span>
                    <span>-{currency}{discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>CGST (2.5%) + SGST (2.5%)</span>
                  <span>{currency}{taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-teal-700">
                  <span>{t.donation}</span>
                  <span>{currency}{donation.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total Row */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="text-sm font-extrabold text-slate-900">{t.totalPayable}</span>
                <span className="text-2xl font-black text-teal-700 tracking-tight">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleParkCart}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-2xs"
                  title="Hold / Park Cart [F2]"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Hold [F2]
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={clearCart}
                  className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-xl transition disabled:opacity-40"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>{t.chargePay}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MODALS */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={(order) => {
          setCompletedOrder(order);
          loadProducts(); // Refresh stock
        }}
      />

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(cust) => selectCustomer(cust)}
      />

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
