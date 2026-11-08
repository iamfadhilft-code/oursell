import { create } from 'zustand';
import {
  OrderItem,
  Product,
  Customer,
  ShiftSession,
  Promotion,
  HeldCart,
  Order,
  PaymentMethod,
  Language,
} from '@/types/pos';
import { db } from '@/db/posDb';
import { syncPendingTransactions, getStoreSyncStatus } from '@/utils/cloudSyncManager';

interface PosState {
  activeBrandId: string;
  brandName: string;
  currency: string;
  language: Language;
  isOnline: boolean;
  isNetworkConnected: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncAt: string | null;
  syncError: string | null;
  isKioskMode: boolean;

  // Active Register State
  cart: OrderItem[];
  heldCarts: HeldCart[];
  selectedCustomer: Customer | null;
  activeShift: ShiftSession | null;
  activeCashier: { id: string; name: string; role: string };
  appliedPromo: Promotion | null;
  cartDiscount: number;
  donationAmount: number;

  // Actions
  setLanguage: (lang: Language) => void;
  setActiveBrand: (brandId: string, brandName?: string) => void;
  setOnlineStatus: (status: boolean) => Promise<{ success: boolean; message?: string }>;
  setNetworkConnected: (connected: boolean) => void;
  refreshPendingSyncCount: () => Promise<number>;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  toggleKioskMode: (kiosk?: boolean) => void;
  setCashier: (cashier: { id: string; name: string; role: string }) => void;
  setActiveShift: (shift: ShiftSession | null) => void;

  addItem: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, qty: number, maxStock?: number) => void;
  removeItem: (productId: string) => void;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromo: () => void;
  setCartDiscount: (amount: number) => void;
  setDonation: (amount: number) => void;
  selectCustomer: (customer: Customer | null) => void;

  parkCart: (customerNotes?: string) => Promise<boolean>;
  recallCart: (heldId: string) => Promise<boolean>;
  deleteHeldCart: (heldId: string) => Promise<boolean>;
  clearCart: () => void;

  getTotals: () => {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    donation: number;
    grandTotal: number;
    itemCount: number;
  };

  finalizeCheckout: (payment: {
    method: PaymentMethod;
    cashTendered?: number;
    cardRefCode?: string;
    upiRef?: string;
    splitDetails?: { cash?: number; card?: number; upi?: number; khata?: number };
    notes?: string;
  }) => Promise<{ success: boolean; order?: Order; error?: string }>;
}

export const usePosStore = create<PosState>((set, get) => ({
  activeBrandId: '',
  brandName: '',
  currency: '₹',
  language: 'en',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isNetworkConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingSyncCount: 0,
  lastSyncAt: null,
  syncError: null,
  isKioskMode: false,

  cart: [],
  heldCarts: [],
  selectedCustomer: null,
  activeShift: null,
  activeCashier: {
    id: 'staff-guest',
    name: 'Store Associate',
    role: 'STAFF',
  },
  appliedPromo: null,
  cartDiscount: 0,
  donationAmount: 0,

  setLanguage: (lang: Language) => {
    set({ language: lang });
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },

  setActiveBrand: (brandId: string, brandName = '') => {
    set({ activeBrandId: brandId, brandName });
    get().refreshPendingSyncCount();
  },

  setOnlineStatus: async (status: boolean) => {
    if (status) {
      const physical = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!physical) {
        set({ isOnline: false, syncError: 'Physical network is offline. Connect to Wi-Fi first.' });
        return { success: false, message: 'Physical network is offline. Connect to Wi-Fi first.' };
      }
      set({ isOnline: true, syncError: null });
      const res = await get().syncNow();
      return { success: true, message: res.message };
    } else {
      set({ isOnline: false, syncError: null });
      return { success: true, message: 'Switched to Offline Mode. Transactions will be saved locally.' };
    }
  },

  setNetworkConnected: (connected: boolean) => {
    const wasConnected = get().isNetworkConnected;
    set({ isNetworkConnected: connected });
    if (!connected) {
      set({ isOnline: false });
    } else if (!wasConnected && connected) {
      set({ isOnline: true });
      get().syncNow().catch((e) => console.warn('Auto sync on network reconnect error:', e));
    }
  },

  refreshPendingSyncCount: async () => {
    try {
      const brandId = get().activeBrandId;
      const status = await getStoreSyncStatus(brandId);
      set({ pendingSyncCount: status.pendingOrdersCount, lastSyncAt: status.lastSyncAt });
      return status.pendingOrdersCount;
    } catch {
      return 0;
    }
  },

  syncNow: async () => {
    if (get().isSyncing) {
      return { success: false, syncedCount: 0, message: 'Sync already in progress' };
    }
    const physical = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!physical) {
      set({ syncError: 'No internet connection' });
      return { success: false, syncedCount: 0, message: 'No internet connection' };
    }

    set({ isSyncing: true, syncError: null });
    try {
      const brandId = get().activeBrandId || 'oursell';
      const result = await syncPendingTransactions(brandId);
      const newStatus = await getStoreSyncStatus(brandId);
      set({
        isSyncing: false,
        pendingSyncCount: newStatus.pendingOrdersCount,
        lastSyncAt: newStatus.lastSyncAt || new Date().toISOString(),
        syncError: result.success ? null : result.message,
      });
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Sync failed';
      set({ isSyncing: false, syncError: msg });
      return { success: false, syncedCount: 0, message: msg };
    }
  },

  toggleKioskMode: (kiosk?: boolean) =>
    set((state) => ({ isKioskMode: kiosk !== undefined ? kiosk : !state.isKioskMode })),

  setCashier: (cashier) => set({ activeCashier: cashier }),

  setActiveShift: (shift) => set({ activeShift: shift }),

  addItem: (product: Product, quantity = 1) => {
    const { cart } = get();
    if (product.stock <= 0) {
      return false;
    }

    const existingIdx = cart.findIndex((i) => i.productId === product.id);

    if (existingIdx >= 0) {
      const existing = cart[existingIdx];
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return false;
      }

      const updated = [...cart];
      const lineSubtotal = Math.max(0, newQty * existing.unitPrice - existing.discount);
      updated[existingIdx] = {
        ...existing,
        quantity: newQty,
        lineTotal: Math.round(lineSubtotal * 100) / 100,
      };
      set({ cart: updated });
      return true;
    } else {
      const lineTotal = Math.round(quantity * product.sellingPrice * 100) / 100;
      const newItem: OrderItem = {
        productId: product.id,
        title: product.title,
        quantity,
        unitPrice: product.sellingPrice,
        discount: 0,
        taxRate: product.taxRate || 5,
        lineTotal,
        image: product.image,
        barcode: product.barcode,
      };
      set({ cart: [...cart, newItem] });
      return true;
    }
  },

  updateQuantity: (productId: string, qty: number, maxStock?: number) => {
    const { cart } = get();
    if (qty <= 0) {
      set({ cart: cart.filter((i) => i.productId !== productId) });
      return;
    }

    const updated = cart.map((item) => {
      if (item.productId === productId) {
        const cappedQty = maxStock ? Math.min(qty, maxStock) : qty;
        const lineTotal = Math.max(0, cappedQty * item.unitPrice - item.discount);
        return {
          ...item,
          quantity: cappedQty,
          lineTotal: Math.round(lineTotal * 100) / 100,
        };
      }
      return item;
    });

    set({ cart: updated });
  },

  removeItem: (productId: string) => {
    set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) }));
  },

  applyPromoCode: async (code: string) => {
    const { activeBrandId, getTotals } = get();
    const promo = await db.promotions
      .where('code')
      .equalsIgnoreCase(code.trim())
      .first();

    if (!promo || !promo.isActive) {
      return { success: false, message: 'Invalid or expired coupon code' };
    }

    const { subtotal } = getTotals();
    if (subtotal < promo.minCartValue) {
      return {
        success: false,
        message: `Minimum cart value of ₹${promo.minCartValue} required for this coupon`,
      };
    }

    set({ appliedPromo: promo });
    return { success: true, message: `Applied "${promo.title}" successfully!` };
  },

  removePromo: () => set({ appliedPromo: null }),

  setCartDiscount: (amount: number) => set({ cartDiscount: Math.max(0, amount) }),

  setDonation: (amount: number) => set({ donationAmount: Math.max(0, amount) }),

  selectCustomer: (customer) => set({ selectedCustomer: customer }),

  parkCart: async (customerNotes?: string) => {
    const { cart, activeBrandId, selectedCustomer, getTotals } = get();
    if (cart.length === 0) return false;

    const { grandTotal } = getTotals();
    const heldNumber = `Held #${Date.now().toString().slice(-4)}`;
    const label = selectedCustomer ? selectedCustomer.name : (customerNotes || 'Walk-in Customer');

    const heldRecord: HeldCart = {
      id: `held-${Date.now()}`,
      brandId: activeBrandId,
      heldNumber,
      customerLabel: label,
      customerPhone: selectedCustomer?.phone,
      items: [...cart],
      total: grandTotal,
      createdAt: new Date().toISOString(),
    };

    await db.held_carts.add(heldRecord);
    set((state) => ({
      heldCarts: [heldRecord, ...state.heldCarts],
      cart: [],
      selectedCustomer: null,
      appliedPromo: null,
      cartDiscount: 0,
    }));
    return true;
  },

  recallCart: async (heldId: string) => {
    const heldRecord = await db.held_carts.get(heldId);
    if (!heldRecord) return false;

    await db.held_carts.delete(heldId);
    set((state) => ({
      cart: heldRecord.items,
      heldCarts: state.heldCarts.filter((h) => h.id !== heldId),
    }));
    return true;
  },

  deleteHeldCart: async (heldId: string) => {
    await db.held_carts.delete(heldId);
    set((state) => ({
      heldCarts: state.heldCarts.filter((h) => h.id !== heldId),
    }));
    return true;
  },

  clearCart: () => {
    set({
      cart: [],
      selectedCustomer: null,
      appliedPromo: null,
      cartDiscount: 0,
    });
  },

  getTotals: () => {
    const { cart, appliedPromo, cartDiscount, donationAmount } = get();

    if (cart.length === 0) {
      return {
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        donation: 0,
        grandTotal: 0,
        itemCount: 0,
      };
    }

    let subtotal = 0;
    let taxTotal = 0;
    let itemCount = 0;

    for (const item of cart) {
      itemCount += item.quantity;
      const lineSub = item.quantity * item.unitPrice - item.discount;
      subtotal += lineSub;
      const lineTax = lineSub * ((item.taxRate || 5) / 100);
      taxTotal += lineTax;
    }

    let promoDiscount = 0;
    if (appliedPromo) {
      if (appliedPromo.promoType === 'PERCENTAGE') {
        promoDiscount = (subtotal * appliedPromo.discountValue) / 100;
      } else if (appliedPromo.promoType === 'FLAT_CART') {
        promoDiscount = appliedPromo.discountValue;
      } else if (appliedPromo.promoType === 'BOGO' && appliedPromo.buyQty && appliedPromo.getQty) {
        // Calculate BOGO discount
        const eligibleItems = cart.filter((i) => i.quantity >= (appliedPromo.buyQty || 2));
        if (eligibleItems.length > 0) {
          promoDiscount = eligibleItems[0].unitPrice * (appliedPromo.getQty || 1);
        }
      }
    }

    const totalDiscount = Math.min(subtotal, cartDiscount + promoDiscount);
    const grandTotal = Math.max(0, subtotal - totalDiscount + taxTotal + donationAmount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(totalDiscount * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      donation: Math.round(donationAmount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      itemCount,
    };
  },

  finalizeCheckout: async (payment) => {
    const {
      cart,
      activeBrandId,
      selectedCustomer,
      activeCashier,
      activeShift,
      getTotals,
      clearCart,
    } = get();

    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    const totals = getTotals();
    const orderNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Validate Khata Credit limit if applicable
    if (payment.method === 'KHATA') {
      if (!selectedCustomer) {
        return { success: false, error: 'Customer must be linked for Khata / Store Credit' };
      }
      const newBalance = selectedCustomer.storeCreditBalance + totals.grandTotal;
      if (newBalance > selectedCustomer.creditLimit) {
        return {
          success: false,
          error: `Credit limit exceeded! Limit: ₹${selectedCustomer.creditLimit}, Current: ₹${selectedCustomer.storeCreditBalance}`,
        };
      }
    }

    const orderId = `ord-${Date.now()}`;
    const newOrder: Order = {
      id: orderId,
      brandId: activeBrandId,
      orderNumber,
      items: [...cart],
      subtotal: totals.subtotal,
      discountAmount: totals.discountTotal,
      taxAmount: totals.taxTotal,
      grandTotal: totals.grandTotal,
      paymentMethod: payment.method,
      cashTendered: payment.cashTendered,
      changeDue: payment.cashTendered
        ? Math.max(0, Math.round((payment.cashTendered - totals.grandTotal) * 100) / 100)
        : 0,
      cardRefCode: payment.cardRefCode,
      upiRef: payment.upiRef,
      splitDetails: payment.splitDetails,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      customerPhone: selectedCustomer?.phone,
      cashierId: activeCashier.id,
      cashierName: activeCashier.name,
      shiftId: activeShift?.id,
      status: 'COMPLETED',
      notes: payment.notes,
      createdAt: new Date().toISOString(),
      syncedToCloud: false,
    };

    try {
      // 1. Save Order
      await db.orders.add(newOrder);

      // 2. Decrement Product Stock
      for (const item of cart) {
        const prod = await db.products.get(item.productId);
        if (prod) {
          const updatedStock = Math.max(0, prod.stock - item.quantity);
          await db.products.update(item.productId, { stock: updatedStock });
        }
      }

      // 3. Update Customer Loyalty & Credit
      if (selectedCustomer) {
        const earnedLoyalty = Math.floor(totals.grandTotal / 100);
        let newCredit = selectedCustomer.storeCreditBalance;

        if (payment.method === 'KHATA') {
          newCredit += totals.grandTotal;
          await db.customer_credit_ledger.add({
            id: `ccl-${Date.now()}`,
            brandId: activeBrandId,
            customerId: selectedCustomer.id,
            type: 'CREDIT_GIVEN',
            amount: totals.grandTotal,
            orderId: newOrder.id,
            balanceAfter: newCredit,
            notes: `Credit purchase invoice ${orderNumber}`,
            createdAt: new Date().toISOString(),
          });
        }

        await db.customers.update(selectedCustomer.id, {
          loyaltyPoints: selectedCustomer.loyaltyPoints + earnedLoyalty,
          storeCreditBalance: newCredit,
        });
      }

      // 4. Update Shift Sales Totals
      if (activeShift) {
        const shiftUpdates: Partial<ShiftSession> = {
          totalSales: activeShift.totalSales + totals.grandTotal,
        };
        if (payment.method === 'CASH') {
          shiftUpdates.cashSales = activeShift.cashSales + totals.grandTotal;
          shiftUpdates.expectedCash = (activeShift.expectedCash || 0) + totals.grandTotal;
        } else if (payment.method === 'CARD') {
          shiftUpdates.cardSales = activeShift.cardSales + totals.grandTotal;
        } else if (payment.method === 'UPI') {
          shiftUpdates.upiSales = activeShift.upiSales + totals.grandTotal;
        } else if (payment.method === 'KHATA') {
          shiftUpdates.khataSales = activeShift.khataSales + totals.grandTotal;
        }
        await db.shifts.update(activeShift.id, shiftUpdates);
      }

      clearCart();

      // Immediately increment local pending count
      set((s) => ({ pendingSyncCount: s.pendingSyncCount + 1 }));

      // Background sync to Supabase Cloud if online
      if (get().isOnline && typeof navigator !== 'undefined' && navigator.onLine) {
        get().syncNow().catch((e) => {
          console.warn('Background Supabase cloud sync deferred:', e);
        });
      }

      return { success: true, order: newOrder };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout transaction failed';
      return { success: false, error: msg };
    }
  },
}));
