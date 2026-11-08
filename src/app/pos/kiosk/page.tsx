'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { db, seedOursellDemoStore } from '@/db/posDb';
import { Product, OrderItem, Order } from '@/types/pos';
import { usePosStore } from '@/store/usePosStore';
import {
  useBarcodeScanner,
  playBeepSound,
  playSuccessSound,
  playErrorSound,
} from '@/hooks/useBarcodeScanner';
import { ThermalReceipt } from '@/components/receipts/ThermalReceipt';
import { KioskCameraScannerModal } from '@/components/kiosk/KioskCameraScannerModal';
import { KioskPaymentModal } from '@/components/kiosk/KioskPaymentModal';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scan,
  Camera,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  Search,
  Package,
  RotateCcw,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  X,
} from 'lucide-react';

interface ScanFeedback {
  type: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  subMessage?: string;
  price?: number;
  barcode?: string;
  timestamp: number;
}

// Sample barcodes available in the store database for instant one-click testing
const SAMPLE_TEST_BARCODES = [
  { code: '8902000000016', label: 'Masala Crisps 50g', price: 25 },
  { code: '8902000000023', label: 'Mineral Water 1L', price: 20 },
  { code: '8902000000030', label: 'Organic Milk 500ml', price: 32 },
  { code: '8902000000047', label: 'Sourdough Bread', price: 50 },
  { code: '8902000000054', label: 'Dark Chocolate 85g', price: 100 },
  { code: '8902000000061', label: 'Coffee Beans 250g', price: 380 },
];

export default function KioskPage() {
  const { activeBrandId, currency } = usePosStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directBarcodeInput, setDirectBarcodeInput] = useState<string>('');

  // Modals & HUD state
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAttendantAlerted, setIsAttendantAlerted] = useState(false);
  const [sessionCountdown, setSessionCountdown] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sound preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('oursell_kiosk_sound');
    if (saved !== null) {
      setIsSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('oursell_kiosk_sound', String(next));
      return next;
    });
  };

  // Load products with guaranteed fallback seeding
  const loadKioskProducts = async () => {
    let prods = await db.products.toArray();
    if (prods.length === 0) {
      // Seed default demo store products so kiosk is never blank
      await seedOursellDemoStore();
      prods = await db.products.toArray();
    }
    setProducts(prods);
  };

  useEffect(() => {
    loadKioskProducts();
  }, [activeBrandId]);

  // Trigger temporary HUD notification
  const triggerScanFeedback = (feedback: Omit<ScanFeedback, 'timestamp'>) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setScanFeedback({ ...feedback, timestamp: Date.now() });
    feedbackTimeoutRef.current = setTimeout(() => {
      setScanFeedback(null);
    }, 3500);
  };

  // Bulletproof barcode & SKU product resolution
  const findMatchingProduct = (rawQuery: string): Product | undefined => {
    const query = rawQuery.trim();
    if (!query) return undefined;
    const lower = query.toLowerCase();

    // 1. Direct exact barcode match
    let match = products.find((p) => p.barcode && p.barcode.trim() === query);
    if (match) return match;

    // 2. Direct SKU match
    match = products.find((p) => p.sku && p.sku.toLowerCase() === lower);
    if (match) return match;

    // 3. EAN-13 vs 12-digit prefix match (with or without check digit)
    const digitsOnly = query.replace(/\D/g, '');
    if (digitsOnly.length >= 8) {
      match = products.find((p) => {
        const pDigits = (p.barcode || '').replace(/\D/g, '');
        if (!pDigits) return false;
        return (
          pDigits === digitsOnly ||
          (digitsOnly.length === 13 && pDigits === digitsOnly.slice(0, 12)) ||
          (digitsOnly.length === 12 && pDigits.startsWith(digitsOnly)) ||
          (pDigits.length === 13 && digitsOnly === pDigits.slice(0, 12)) ||
          (digitsOnly.length === 8 && pDigits === digitsOnly.slice(0, 7))
        );
      });
      if (match) return match;
    }

    // 4. Match by Product ID
    match = products.find((p) => p.id === query);
    if (match) return match;

    // 5. Case-insensitive exact title match
    match = products.find((p) => p.title.toLowerCase() === lower);
    return match;
  };

  // Unified Direct Barcode Handler
  const handleProcessBarcodeScan = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    const matchedProduct = findMatchingProduct(cleanCode);

    if (matchedProduct) {
      if (matchedProduct.stock <= 0) {
        if (isSoundEnabled) playErrorSound();
        triggerScanFeedback({
          type: 'WARNING',
          message: `${matchedProduct.title} is Out of Stock`,
          subMessage: 'Please ask an attendant for assistance with alternative items.',
          barcode: cleanCode,
        });
        return;
      }

      // Add to tray
      if (isSoundEnabled) playBeepSound();
      handleAddToCart(matchedProduct);

      triggerScanFeedback({
        type: 'SUCCESS',
        message: `Scanned: ${matchedProduct.title}`,
        price: matchedProduct.sellingPrice,
        barcode: cleanCode,
      });
    } else {
      // Barcode not found
      if (isSoundEnabled) playErrorSound();
      triggerScanFeedback({
        type: 'ERROR',
        message: `Barcode Not Recognized (${cleanCode})`,
        subMessage: 'Please verify the label, search the catalog, or call an attendant.',
        barcode: cleanCode,
      });
    }

    // Clear direct input if used
    setDirectBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Hardware Scanner Listener (USB / Bluetooth Laser Scanner)
  useBarcodeScanner({
    onScan: (barcode) => {
      handleProcessBarcodeScan(barcode);
    },
    playSound: false, // Managed inside handleProcessBarcodeScan for custom error/success sounds
    maxIntervalMs: 80,
  });

  const handleAddToCart = (prod: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          lineTotal: Math.round(newQty * updated[idx].unitPrice * 100) / 100,
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
            taxRate: prod.taxRate || 5,
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
        prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity: qty,
                lineTotal: Math.round(qty * i.unitPrice * 100) / 100,
              }
            : i
        )
      );
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear your current tray?')) {
      setCart([]);
    }
  };

  // Categories & Filtering
  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        (p.brand && p.brand.toLowerCase().includes(query));
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Financial Totals
  const subtotal = Math.round(cart.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((subtotal + tax) * 100) / 100;
  const totalItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Finalize Sale
  const handleFinalizeSale = async (method: 'CARD' | 'UPI' | 'CASH') => {
    const orderNum = `SCO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      brandId: activeBrandId || 'oursell',
      orderNumber: orderNum,
      items: [...cart],
      subtotal,
      discountAmount: 0,
      taxAmount: tax,
      grandTotal,
      paymentMethod: method,
      cashierId: 'kiosk-terminal-01',
      cashierName: 'Self-Checkout Kiosk #1',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    await db.orders.add(newOrder);

    // Stock decrement
    for (const item of cart) {
      const prod = await db.products.get(item.productId);
      if (prod) {
        await db.products.update(item.productId, {
          stock: Math.max(0, prod.stock - item.quantity),
        });
      }
    }

    if (isSoundEnabled) playSuccessSound();

    setCart([]);
    setIsPaymentModalOpen(false);
    setCompletedOrder(newOrder);
    setSessionCountdown(15);
  };

  // Order completion auto-reset countdown
  useEffect(() => {
    if (sessionCountdown === null) return;
    if (sessionCountdown <= 0) {
      setCompletedOrder(null);
      setSessionCountdown(null);
      return;
    }
    const timer = setInterval(() => {
      setSessionCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionCountdown]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden select-none">
      {/* 1. TOP KIOSK HEADER */}
      <header className="h-20 bg-slate-950/95 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-30 backdrop-blur-xl">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-teal-500/20">
            O
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wider">OURSELL EXPRESS</h1>
              <span className="text-[10px] font-mono font-black tracking-widest text-teal-400 uppercase px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30">
                KIOSK #01
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Self-Checkout Touch & Barcode Station</p>
          </div>
        </div>

        {/* Center: Live Direct Scanner Radar Capsule */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
              DIRECT SCANNER ACTIVE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-full text-xs font-bold transition active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>
        </div>

        {/* Right: Sound, Attendant Help, Time & Exit */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition ${
              isSoundEnabled
                ? 'bg-slate-900 border-slate-800 text-teal-400 hover:bg-slate-800'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={isSoundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Call Attendant */}
          <button
            onClick={() => setIsAttendantAlerted(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Call Attendant</span>
          </button>

          {/* Digital Time */}
          {currentTime && (
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 border border-slate-800/80 rounded-xl font-mono text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Exit Kiosk Link */}
          <Link
            href="/pos/register"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Kiosk</span>
          </Link>
        </div>
      </header>

      {/* 2. ATTENDANT NOTIFICATION BANNER */}
      {isAttendantAlerted && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between z-20 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5 text-amber-300 text-xs font-bold">
            <HelpCircle className="w-4 h-4 animate-bounce" />
            <span>Assistance Requested: A store associate has been summoned to this kiosk.</span>
          </div>
          <button
            onClick={() => setIsAttendantAlerted(false)}
            className="text-xs text-amber-300 hover:text-white font-bold bg-amber-500/30 px-2.5 py-1 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. SCAN FEEDBACK HUD OVERLAY */}
      {scanFeedback && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center justify-between gap-4 ${
              scanFeedback.type === 'SUCCESS'
                ? 'bg-slate-900/95 border-emerald-500 text-white shadow-emerald-500/20'
                : scanFeedback.type === 'WARNING'
                ? 'bg-slate-900/95 border-amber-500 text-white shadow-amber-500/20'
                : 'bg-slate-900/95 border-red-500 text-white shadow-red-500/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  scanFeedback.type === 'SUCCESS'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : scanFeedback.type === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {scanFeedback.type === 'SUCCESS' && <CheckCircle2 className="w-6 h-6" />}
                {scanFeedback.type === 'WARNING' && <AlertTriangle className="w-6 h-6" />}
                {scanFeedback.type === 'ERROR' && <Scan className="w-6 h-6" />}
              </div>

              <div>
                <span className="text-xs font-black block">{scanFeedback.message}</span>
                {scanFeedback.subMessage && (
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {scanFeedback.subMessage}
                  </span>
                )}
                {scanFeedback.barcode && (
                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                    Barcode: {scanFeedback.barcode}
                  </span>
                )}
              </div>
            </div>

            {scanFeedback.price !== undefined && (
              <span className="text-lg font-black font-mono text-emerald-400 shrink-0">
                +{currency}{scanFeedback.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN KIOSK VIEWPORT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Direct Scan Dock, Search, Categories & Catalog */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4 min-w-0">
          {/* DIRECT SCANNING ZONE CARD */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/80 border border-slate-800/80 rounded-3xl p-4 shadow-xl shrink-0 space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Direct Barcode Input Field */}
              <div className="flex-1 flex items-center bg-slate-950 border border-slate-700/80 focus-within:border-teal-400 rounded-2xl px-3.5 py-2 transition shadow-inner">
                <Scan className="w-5 h-5 text-teal-400 shrink-0 mr-2.5 animate-pulse" />
                <input
                  ref={barcodeInputRef}
                  data-barcode-target="true"
                  type="text"
                  value={directBarcodeInput}
                  onChange={(e) => setDirectBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProcessBarcodeScan(directBarcodeInput);
                    }
                  }}
                  placeholder="Scan barcode with laser gun or enter code/SKU..."
                  className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none flex-1 font-mono"
                />
                {directBarcodeInput && (
                  <button
                    onClick={() => setDirectBarcodeInput('')}
                    className="text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleProcessBarcodeScan(directBarcodeInput)}
                  className="ml-2 px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl transition shrink-0 active:scale-95"
                >
                  Scan Code
                </button>
              </div>

              {/* Camera Scanner Trigger Button */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 hover:text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shrink-0 shadow-md active:scale-95"
              >
                <Camera className="w-4 h-4 text-teal-400" />
                <span>Camera Viewfinder</span>
              </button>
            </div>

            {/* Quick Test Barcode Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Test Barcodes:</span>
              </span>

              {SAMPLE_TEST_BARCODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleProcessBarcodeScan(item.code)}
                  className="px-3 py-1 bg-slate-800/80 hover:bg-teal-500/20 border border-slate-700/80 hover:border-teal-400/60 rounded-xl text-[11px] font-mono text-slate-300 hover:text-teal-300 whitespace-nowrap transition active:scale-95 flex items-center gap-1.5"
                >
                  <Scan className="w-3 h-3 text-teal-400" />
                  <span>{item.label}</span>
                  <span className="text-teal-400 font-bold">({item.code.slice(-5)})</span>
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH & CATEGORY PILLS BAR */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            {/* Horizontal Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-md whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-teal-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Search Filter */}
            <div className="flex items-center bg-slate-900 border border-slate-800 focus-within:border-teal-500/50 rounded-2xl px-3 py-2 w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* PRODUCT TOUCH TILES GRID */}
          <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 space-y-2">
                <Package className="w-12 h-12 text-slate-700 mx-auto stroke-1" />
                <p className="text-sm font-bold text-slate-400">No products found</p>
                <p className="text-xs text-slate-500">
                  Try adjusting your search or category filter, or scan a barcode directly.
                </p>
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleAddToCart(prod)}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-teal-400/70 rounded-3xl p-4 flex flex-col justify-between cursor-pointer transition transform active:scale-95 shadow-lg group relative overflow-hidden backdrop-blur-xs"
                >
                  {/* Card Image Area */}
                  <div className="h-32 w-full rounded-2xl overflow-hidden bg-slate-950 relative mb-3 flex items-center justify-center">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                        <Package className="w-8 h-8 stroke-1" />
                        <span className="text-[10px] font-mono uppercase">{prod.category}</span>
                      </div>
                    )}

                    {/* Category Tag */}
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase bg-black/75 px-2 py-0.5 rounded-md text-slate-200 backdrop-blur-xs">
                      {prod.category}
                    </span>

                    {/* Stock indicator badge */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs ${
                        prod.stock <= 5
                          ? 'bg-amber-500/80 text-black'
                          : 'bg-black/60 text-slate-300'
                      }`}
                    >
                      {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-white line-clamp-2 min-h-10 leading-tight">
                      {prod.title}
                    </h4>

                    {prod.barcode && (
                      <span className="inline-block text-[10px] font-mono text-teal-400/80 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                        {prod.barcode}
                      </span>
                    )}

                    <div className="pt-1">
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {currency}{prod.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Add Action Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400 group-hover:text-teal-300">
                    <span>Tap to Add</span>
                    <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-slate-950 transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Your Tray (Cart & Checkout) */}
        <div className="w-96 xl:w-[420px] bg-slate-950/95 border-l border-slate-800/80 flex flex-col h-full shrink-0 z-20 backdrop-blur-xl">
          {/* Tray Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-base text-white">Your Tray</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black bg-teal-950 text-teal-400 px-3 py-1 rounded-full border border-teal-800">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>

              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 transition"
                  title="Clear entire tray"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tray Items List (Fills exactly available height) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 p-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                  <ShoppingCart className="w-8 h-8 stroke-1" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-300">Your Tray is Empty</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    Scan any product barcode or tap items on the catalog to begin.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center border border-slate-800">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* Title & Price */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white block truncate">{item.title}</span>
                    <span className="font-mono text-emerald-400 font-black block mt-0.5">
                      {currency}{item.lineTotal.toFixed(2)}
                    </span>
                    {item.barcode && (
                      <span className="text-[10px] font-mono text-slate-500 block truncate">
                        {item.barcode}
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-slate-800 rounded-xl overflow-hidden border border-slate-700/80 shrink-0">
                    <button
                      onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                      className="p-1.5 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono font-black text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                      className="p-1.5 hover:bg-slate-700 text-slate-300 active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleUpdateQty(item.productId, 0)}
                    className="text-slate-500 hover:text-red-400 p-1 transition shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Totals & Big Pay CTA */}
          <div className="p-5 border-t border-slate-800/80 bg-slate-950/90 shrink-0 space-y-4">
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-white font-bold">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (5%)</span>
                <span className="font-mono text-white font-bold">{currency}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline text-base font-black text-white pt-2.5 border-t border-slate-800">
                <span>Total Due</span>
                <span className="font-mono text-emerald-400 text-3xl font-black">
                  {currency}{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-base rounded-2xl transition shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>PROCEED TO PAYMENT</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. LIVE CAMERA BARCODE SCANNER MODAL */}
      <KioskCameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(barcode) => {
          handleProcessBarcodeScan(barcode);
        }}
      />

      {/* 6. MULTI-METHOD PAYMENT MODAL */}
      <KioskPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        grandTotal={grandTotal}
        currency={currency}
        onCompletePayment={handleFinalizeSale}
        onCallAttendant={() => setIsAttendantAlerted(true)}
      />

      {/* 7. ORDER COMPLETED CELEBRATION SCREEN */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-8 text-center space-y-6 shadow-2xl">
            {/* Celebration Icon */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-widest">
                TRANSACTION APPROVED
              </span>
              <h2 className="text-2xl font-black text-white mt-1">Thank You For Your Visit!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your order <span className="font-mono text-white font-bold">{completedOrder.orderNumber}</span> has been processed.
              </p>
            </div>

            {/* Summary Pill */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Total Items</span>
                <span className="font-bold text-white">
                  {completedOrder.items.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Mode</span>
                <span className="font-bold text-teal-400">{completedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Total Paid</span>
                <span className="font-mono text-emerald-400 text-lg">
                  {currency}{completedOrder.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Countdown Auto Reset */}
            {sessionCountdown !== null && (
              <div className="text-xs text-slate-400">
                <span>Starting next customer session in </span>
                <span className="font-mono font-black text-emerald-400">{sessionCountdown}s</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>

              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setSessionCountdown(null);
                }}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                Start Next Order Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
