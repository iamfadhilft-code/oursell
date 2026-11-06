'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { db } from '@/db/posDb';
import { Product, Order, Customer } from '@/types/pos';
import { useBarcodeScanner, playBeepSound } from '@/hooks/useBarcodeScanner';
import { translations } from '@/lib/i18n';
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
  Store,
  ShieldCheck,
  LogOut,
  Languages,
  ShoppingCart,
  Lock,
} from 'lucide-react';

export default function StorePosPage() {
  const params = useParams();
  const storeSlug = (params?.storeSlug as string) || 'oursell';

  const {
    activeBrandId,
    setActiveBrand,
    currency,
    language,
    setLanguage,
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

  const { isAuthenticated, currentAccount, currentRole, logout } = useBrandAuthStore();
  const isAdmin = currentRole === 'STORE_ADMIN' || currentRole === 'SUPER_ADMIN';
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
    openingFloat: 2500,
    shiftSales: 0,
  });

  // Load products from IndexedDB for this store
  const loadProducts = async () => {
    // Check if store has its own products, otherwise fallback to storeSlug or BRD-101
    let prods = await db.products.where('brandId').equals(storeSlug).toArray();
    if (prods.length === 0) {
      prods = await db.products.where('brandId').equals('oursell').toArray();
    }
    if (prods.length === 0) {
      prods = await db.products.toArray();
    }
    setProducts(prods);

    const [shifts, orders] = await Promise.all([
      db.shifts.where('brandId').equals(storeSlug).toArray(),
      db.orders.where('brandId').equals(storeSlug).toArray(),
    ]);

    const openShift = shifts.find((s) => s.status === 'OPEN') || shifts[0];
    const totalSales = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    if (openShift) {
      setActiveShiftInfo({
        id: openShift.shiftNumber || 'Shift #01',
        openingFloat: openShift.openingFloat || 2500,
        shiftSales: totalSales,
      });
    }
  };

  useEffect(() => {
    setActiveBrand(storeSlug, storeSlug === 'oursell' ? 'Oursell Demo Store' : storeSlug);
    loadProducts();
    db.held_carts.where('brandId').equals(storeSlug).toArray().then((held) => {
      usePosStore.setState({ heldCarts: held });
    });
  }, [storeSlug]);

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
  const categories = ['All', 'Snacks', 'Beverages', 'Dairy', 'Bakery', 'General'];
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

  const handleParkCart = async () => {
    const success = await parkCart();
    if (success) {
      playBeepSound();
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please log in with your store credentials to access this POS register terminal.
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

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden select-none">
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href={`/shop/${storeSlug}`}
              className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-teal-800 transition"
              title="Store Home"
            >
              O
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                {storeSlug === 'oursell' ? 'Oursell Demo Store' : storeSlug}
              </span>
              <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                POS-01
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Shift Sales Badge */}
            <div className="bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 font-mono text-slate-600">
              Float: <strong className="text-slate-900">{currency}{activeShiftInfo.openingFloat.toLocaleString()}</strong> • Sales: <strong className="text-emerald-700">{currency}{activeShiftInfo.shiftSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            {/* Language Switch */}
            <button
              onClick={() => {
                if (language === 'en') setLanguage('ml');
                else if (language === 'ml') setLanguage('ar');
                else setLanguage('en');
              }}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold uppercase text-[10px]"
              title="Switch Language"
            >
              {language}
            </button>

            {/* Cashier Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {currentAccount?.name?.slice(0, 2).toUpperCase() || 'OU'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {currentAccount?.name || 'Cashier'}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              title="Exit Register"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Register Body: Left Catalog + Right Cart */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* LEFT: PRODUCTS CATALOG */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC] p-4 gap-3">
            {/* Search and Category Bar */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan barcode or search product name / SKU (Press F1)..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-xs"
                />
              </div>

              {/* Parked Carts indicator */}
              {heldCarts.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {heldCarts.map((held) => (
                    <button
                      key={held.id}
                      onClick={() => recallCart(held.id)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                      title="Recall parked cart"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>{held.heldNumber} ({currency}{held.total})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No products found matching query.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((prod) => {
                    const cartItem = cart.find((i) => i.productId === prod.id);
                    const qtyInCart = cartItem ? cartItem.quantity : 0;
                    const isLowStock = prod.stock <= (prod.lowStockThreshold || 5) && prod.stock > 0;
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
                        <div
                          onClick={() => {
                            if (!isOutOfStock) {
                              addItem(prod);
                              triggerCartFlash();
                            }
                          }}
                          className="h-24 w-full rounded-xl overflow-hidden bg-slate-50 relative my-1 flex items-center justify-center cursor-pointer"
                        >
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
                            className="font-bold text-slate-800 text-xs line-clamp-1 leading-snug group-hover:text-teal-700 transition cursor-pointer"
                            title={prod.title}
                            onClick={() => {
                              if (!isOutOfStock) {
                                addItem(prod);
                                triggerCartFlash();
                              }
                            }}
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
                            {prod.mrp && prod.mrp > prod.sellingPrice && (
                              <span className="text-[10px] text-slate-400 block line-through">
                                {currency}{prod.mrp.toFixed(2)}
                              </span>
                            )}
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
                                if (added) triggerCartFlash();
                              }}
                              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 font-bold text-xs rounded-xl border border-teal-200/80 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-teal-50 border border-teal-200/80 p-0.5 rounded-xl">
                              <button
                                onClick={() => updateQuantity(prod.id, qtyInCart - 1)}
                                className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-xs w-5 text-center text-teal-900">
                                {qtyInCart}
                              </span>
                              <button
                                disabled={qtyInCart >= prod.stock}
                                onClick={() => {
                                  updateQuantity(prod.id, qtyInCart + 1);
                                  triggerCartFlash();
                                }}
                                className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs hover:bg-teal-800 disabled:opacity-40"
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

          {/* RIGHT: BILLING PANEL / CART (380px) */}
          <aside
            className={`w-96 bg-white border-l border-slate-200 flex flex-col justify-between shrink-0 shadow-lg transition-colors ${
              cartFlash ? 'bg-teal-50/50' : ''
            }`}
          >
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Current Order</h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {itemCount} item(s) selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                {cart.length > 0 && (
                  <>
                    <button
                      onClick={handleParkCart}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                      title="Park Cart (F2)"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Park (F2)</span>
                    </button>
                    <button
                      onClick={clearCart}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      title="Clear Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Customer Selector Ribbon */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-semibold text-slate-700">
                  {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                </span>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-[11px] text-teal-700 font-bold hover:underline"
              >
                {selectedCustomer ? 'Change' : '+ Add Customer'}
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <span>Cart is empty</span>
                  <span className="text-[10px] mt-1 text-slate-400">
                    Scan a product or click an item on the left to start billing.
                  </span>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 truncate">
                        {item.title}
                      </h5>
                      <span className="text-[10px] font-mono text-slate-500">
                        {currency}
                        {item.unitPrice?.toFixed(2)} x {item.quantity}
                      </span>
                    </div>

                    {/* Quantity Adjustment Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-5 h-5 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-16 text-right font-mono font-bold text-xs text-slate-900">
                      {currency}
                      {item.lineTotal?.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Totals */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME10)"
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-teal-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-700"
                >
                  Apply
                </button>
              </form>

              {promoFeedback && (
                <div
                  className={`text-[11px] font-bold ${
                    promoFeedback.success ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {promoFeedback.message}
                </div>
              )}

              {/* Subtotal Breakdown */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount</span>
                    <span>-{currency}{discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Tax (GST 5%)</span>
                  <span>{currency}{taxTotal.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
                  <span>Grand Total</span>
                  <span className="text-teal-700">{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Settlement Action Button */}
              <button
                disabled={cart.length === 0}
                onClick={() => setIsPaymentModalOpen(true)}
                className={`w-full py-3.5 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm flex items-center justify-center gap-2 ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-[0.99] cursor-pointer'
                }`}
              >
                {cart.length === 0 ? (
                  <span>Cart is Empty</span>
                ) : (
                  <>
                    <span>Process Payment (Space)</span>
                    <span className="font-mono text-sm">{currency}{grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* MODALS */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSelectCustomer={(c: Customer) => {
            selectCustomer(c);
            setIsCustomerModalOpen(false);
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(ord) => {
            setCompletedOrder(ord);
            setIsPaymentModalOpen(false);
            loadProducts();
          }}
        />
      )}

      {completedOrder && (
        <ThermalReceipt
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
