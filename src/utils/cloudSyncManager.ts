import { db } from '@/db/posDb';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Product, Customer, Order, StoreExpense, ShiftSession } from '@/types/pos';

export interface SyncStatus {
  isOnline: boolean;
  isCloudConfigured: boolean;
  pendingOrdersCount: number;
  lastSyncAt: string | null;
  syncHistory: Array<{ timestamp: string; status: 'SUCCESS' | 'FAILED' | 'PENDING'; details: string }>;
}

export interface StoreBackupData {
  version: string;
  storeId: string;
  exportedAt: string;
  brand?: any;
  products: any[];
  orders: any[];
  customers: any[];
  barcodes: any[];
  accounts: any[];
}

const SYNC_HISTORY_KEY = 'oursell_sync_history';

/**
 * Resolves a store's UUID from slug or existing business record
 */
export async function resolveStoreBusinessId(storeSlugOrId: string): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const clean = (storeSlugOrId || '').trim().toLowerCase();

  // Check if it's already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (clean && uuidRegex.test(clean)) {
    return clean;
  }

  try {
    if (clean) {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', clean)
        .maybeSingle();

      if (!error && data?.id) {
        return data.id;
      }
    }

    // Fallback: check active brand in local Dexie database
    const activeBrand = await db.brands.toCollection().first().catch(() => null);
    if (activeBrand?.brandId && activeBrand.brandId.toLowerCase() !== clean) {
      const { data: fallbackData } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', activeBrand.brandId.toLowerCase())
        .maybeSingle();
      if (fallbackData?.id) return fallbackData.id;
    }

    // Default to the first registered business node in Cloud (e.g. 'oursell')
    const { data: defaultBiz } = await supabase
      .from('businesses')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (defaultBiz?.id) return defaultBiz.id;
  } catch (err) {
    console.warn('Failed to resolve business UUID by slug:', err);
  }

  return null;
}

/**
 * Checks connection and local offline transaction queue
 */
export async function getStoreSyncStatus(storeId: string): Promise<SyncStatus> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isCloud = isSupabaseConfigured;

  let pendingCount = 0;
  try {
    let orders = await db.orders.toArray();
    if (storeId) {
      const storeOrders = orders.filter((o) => o.brandId === storeId);
      if (storeOrders.length > 0) orders = storeOrders;
    }
    const pendingOrders = orders.filter((o: any) => !o.syncedToCloud).length;

    let expenses = await db.store_expenses.toArray();
    if (storeId) {
      const storeExpenses = expenses.filter((e) => e.brandId === storeId);
      if (storeExpenses.length > 0) expenses = storeExpenses;
    }
    const pendingExpenses = expenses.filter((e: any) => !e.syncedToCloud).length;

    pendingCount = pendingOrders + pendingExpenses;
  } catch (err) {
    console.warn('Error reading local orders:', err);
  }

  let history: any[] = [];
  try {
    const raw = localStorage.getItem(`${SYNC_HISTORY_KEY}_${storeId || 'default'}`);
    if (raw) history = JSON.parse(raw);
  } catch {}

  const lastSuccess = history.find((h) => h.status === 'SUCCESS');

  return {
    isOnline,
    isCloudConfigured: isCloud,
    pendingOrdersCount: pendingCount,
    lastSyncAt: lastSuccess?.timestamp || null,
    syncHistory: history.slice(0, 5),
  };
}

/**
 * Exports full store database as an offline backup file
 */
export async function exportStoreBackup(storeId: string): Promise<string> {
  const [brand, prods, ords, custs, bars, accs] = await Promise.all([
    db.brands.where('brandId').equals(storeId).first(),
    db.products.where('brandId').equals(storeId).toArray(),
    db.orders.where('brandId').equals(storeId).toArray(),
    db.customers.where('brandId').equals(storeId).toArray(),
    db.barcodes.where('brandId').equals(storeId).toArray(),
    db.accounts.where('storeId').equals(storeId).toArray(),
  ]);

  const backup: StoreBackupData = {
    version: '3.0',
    storeId,
    exportedAt: new Date().toISOString(),
    brand,
    products: prods,
    orders: ords,
    customers: custs,
    barcodes: bars,
    accounts: accs,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Restores store database from a backup JSON string
 */
export async function importStoreBackup(jsonData: string, targetStoreId: string): Promise<{ success: boolean; message: string }> {
  try {
    const data: StoreBackupData = JSON.parse(jsonData);
    if (!data.storeId || !Array.isArray(data.products)) {
      return { success: false, message: 'Invalid backup file structure.' };
    }

    if (data.products.length > 0) {
      await db.products.bulkPut(data.products);
    }
    if (data.customers && data.customers.length > 0) {
      await db.customers.bulkPut(data.customers);
    }
    if (data.barcodes && data.barcodes.length > 0) {
      await db.barcodes.bulkPut(data.barcodes);
    }
    if (data.orders && data.orders.length > 0) {
      await db.orders.bulkPut(data.orders);
    }
    if (data.accounts && data.accounts.length > 0) {
      await db.accounts.bulkPut(data.accounts);
    }

    return {
      success: true,
      message: `Restored ${data.products.length} products, ${data.orders?.length || 0} orders, and ${data.customers?.length || 0} customers successfully.`,
    };
  } catch (err: any) {
    return { success: false, message: `Backup restoration failed: ${err?.message || 'Invalid JSON'}` };
  }
}

/**
 * Pulls master catalog & business records from Supabase Cloud into local Dexie store
 */
export async function pullStoreFromCloud(storeSlug: string): Promise<{
  success: boolean;
  message: string;
  counts?: { products: number; customers: number; barcodes: number };
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, message: 'Network offline. Cannot pull from Cloud.' };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { success: false, message: 'Supabase credentials not configured.' };
  }

  try {
    const cleanSlug = storeSlug.trim().toLowerCase();
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (bizErr || !business) {
      return { success: false, message: `Store "${cleanSlug}" not found on Supabase Cloud.` };
    }

    const businessId = business.id;

    // Pull Products
    const { data: cloudProducts } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId);

    if (cloudProducts && cloudProducts.length > 0) {
      const localProds: Product[] = cloudProducts.map((p) => ({
        id: p.id,
        brandId: cleanSlug,
        barcode: p.barcode,
        sku: p.sku,
        title: p.title,
        brand: p.brand_name || cleanSlug,
        category: p.category_name || 'General',
        unit: (p.unit as any) || 'Pcs',
        costPrice: Number(p.cost_price) || 0,
        mrp: Number(p.mrp) || 0,
        sellingPrice: Number(p.selling_price) || 0,
        taxRate: Number(p.tax_rate) || 5,
        stock: p.stock,
        lowStockThreshold: p.low_stock_threshold || 10,
        image: p.image_url || undefined,
        isActive: Boolean(p.is_active),
      }));
      await db.products.bulkPut(localProds);
    }

    // Pull Barcodes
    const { data: cloudBarcodes } = await supabase
      .from('barcode_records')
      .select('*')
      .eq('business_id', businessId);

    if (cloudBarcodes && cloudBarcodes.length > 0) {
      const localBars = cloudBarcodes.map((b) => ({
        id: b.id,
        brandId: cleanSlug,
        productId: b.product_id || '',
        productName: b.product_name,
        productSku: b.product_sku,
        sellingPrice: Number(b.selling_price) || 0,
        barcodeValue: b.barcode_value,
        barcodeType: (b.barcode_type as any) || 'EAN13',
        labelSize: b.label_size || '50x25mm',
        createdAt: b.created_at || new Date().toISOString(),
        updatedAt: b.updated_at || new Date().toISOString(),
      }));
      await db.barcodes.bulkPut(localBars);
    }

    // Pull Customers
    const { data: cloudCustomers } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId);

    if (cloudCustomers && cloudCustomers.length > 0) {
      const localCusts: Customer[] = cloudCustomers.map((c) => ({
        id: c.id,
        brandId: cleanSlug,
        name: c.name,
        phone: c.phone || '',
        email: c.email || undefined,
        address: c.address || undefined,
        creditLimit: Number(c.credit_limit) || 5000,
        storeCreditBalance: Number(c.current_balance) || 0,
        loyaltyPoints: c.loyalty_points || 0,
        createdAt: c.created_at || new Date().toISOString(),
      }));
      await db.customers.bulkPut(localCusts);
    }

    const prodCount = cloudProducts?.length || 0;
    const custCount = cloudCustomers?.length || 0;
    const barCount = cloudBarcodes?.length || 0;

    return {
      success: true,
      message: `Cloud sync complete: ${prodCount} products, ${custCount} customers, ${barCount} barcodes loaded.`,
      counts: { products: prodCount, customers: custCount, barcodes: barCount },
    };
  } catch (err: any) {
    return { success: false, message: `Cloud pull failed: ${err?.message || 'Network error'}` };
  }
}

/**
 * Syncs pending local transactions (Orders, Invoices, Payments, Khata, Expenses) to Supabase Cloud
 */
export async function syncPendingTransactions(storeId: string): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Network is offline. Transactions remain securely queued in local IndexedDB.',
    };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Supabase Cloud credentials are not configured in environment. Operating in zero-latency local mode.',
    };
  }

  try {
    const businessId = await resolveStoreBusinessId(storeId);
    if (!businessId) {
      return {
        success: false,
        syncedCount: 0,
        message: `Could not resolve Cloud business node for "${storeId}". Ensure the store is registered in Supabase.`,
      };
    }

    let localOrders = await db.orders.toArray();
    if (storeId) {
      const storeOrders = localOrders.filter((o) => o.brandId === storeId);
      if (storeOrders.length > 0) localOrders = storeOrders;
    }
    const pendingOrders = localOrders.filter((o: any) => !o.syncedToCloud);

    // Also get unsynced expenses
    let localExpenses = await db.store_expenses.toArray();
    if (storeId) {
      const storeExpenses = localExpenses.filter((e) => e.brandId === storeId);
      if (storeExpenses.length > 0) localExpenses = storeExpenses;
    }
    const pendingExpenses = localExpenses.filter((e: any) => !e.syncedToCloud);

    if (pendingOrders.length === 0 && pendingExpenses.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'All local records and transactions are already synchronized with Cloud.',
      };
    }

    let synced = 0;

    // 1. Sync Invoices, Items & Payments
    for (const order of pendingOrders) {
      const invoicePayload = {
        business_id: businessId,
        invoice_number: order.orderNumber,
        cashier_id: order.cashierId || null,
        cashier_name: order.cashierName || 'Cashier',
        customer_name: order.customerName || null,
        customer_phone: order.customerPhone || null,
        subtotal: order.subtotal,
        discount_amount: order.discountAmount,
        tax_amount: order.taxAmount,
        donation_amount: (order as any).donationAmount || 0,
        grand_total: order.grandTotal,
        payment_method: order.paymentMethod,
        order_status: order.status,
        created_at: order.createdAt,
      };

      const { data: invData, error: invError } = await supabase
        .from('invoices')
        .upsert(invoicePayload, { onConflict: 'business_id, invoice_number' })
        .select('id')
        .single();

      if (!invError && invData) {
        // Sync invoice items
        if (order.items && order.items.length > 0) {
          try {
            await supabase.from('invoice_items').delete().eq('invoice_id', invData.id);
          } catch {}
          const itemsPayload = order.items.map((item) => ({
            business_id: businessId,
            invoice_id: invData.id,
            product_title: item.title,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            discount: item.discount || 0,
            tax_rate: item.taxRate || 5,
            line_total: item.lineTotal,
            created_at: order.createdAt,
          }));

          try {
            await supabase.from('invoice_items').insert(itemsPayload);
          } catch (e) {
            console.warn('Error inserting invoice items:', e);
          }
        }

        // Record payment
        try {
          try {
            await supabase.from('payments').delete().eq('invoice_id', invData.id);
          } catch {}
          await supabase.from('payments').insert({
            business_id: businessId,
            invoice_id: invData.id,
            payment_method: (order.paymentMethod as any) || 'CASH',
            amount: order.grandTotal,
            reference_id: order.cardRefCode || order.upiRef || undefined,
            status: 'SUCCESS',
            created_at: order.createdAt,
          });
        } catch (e) {
          console.warn('Error inserting payment:', e);
        }

        // Mark local order as synced
        await db.orders.update(order.id, { syncedToCloud: true } as any);
        synced++;
      }
    }

    // 2. Sync Expenses
    for (const exp of pendingExpenses) {
      const { error: expErr } = await supabase.from('store_expenses').insert({
        business_id: businessId,
        category: exp.category,
        title: exp.notes || exp.category,
        amount: exp.amount,
        payment_method: 'CASH',
        paid_to: null,
        notes: exp.notes || null,
        recorded_by: exp.paidByCashier || null,
        created_at: exp.createdAt,
      });

      if (!expErr) {
        await db.store_expenses.update(exp.id, { syncedToCloud: true } as any);
        synced++;
      }
    }

    // Save history log
    const totalPending = pendingOrders.length + pendingExpenses.length;
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: synced > 0 ? ('SUCCESS' as const) : ('FAILED' as const),
      details: `Synchronized ${synced} of ${totalPending} transactions to Supabase Cloud.`,
    };

    try {
      const key = `${SYNC_HISTORY_KEY}_${storeId || 'default'}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([logEntry, ...existing].slice(0, 10)));
    } catch {}

    return {
      success: synced > 0 || totalPending === 0,
      syncedCount: synced,
      message: `Successfully synchronized ${synced} transaction(s) to Supabase Cloud.`,
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      message: `Synchronization error: ${err?.message || 'Failed connecting to Supabase database'}`,
    };
  }
}

/**
 * Pushes a newly created/edited product to Supabase Cloud
 */
export async function pushProductToCloud(storeSlug: string, product: Product): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const businessId = await resolveStoreBusinessId(storeSlug);
    if (!businessId) return false;

    const { error } = await supabase.from('products').upsert({
      business_id: businessId,
      barcode: product.barcode,
      sku: product.sku,
      title: product.title,
      brand_name: product.brand || null,
      category_name: product.category,
      unit: product.unit,
      cost_price: product.costPrice,
      mrp: product.mrp,
      selling_price: product.sellingPrice,
      tax_rate: product.taxRate,
      stock: product.stock,
      low_stock_threshold: product.lowStockThreshold,
      image_url: product.image || null,
      is_active: product.isActive,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'business_id, barcode' });

    return !error;
  } catch (err) {
    console.warn('Failed to push product to Supabase:', err);
    return false;
  }
}

/**
 * Pushes a newly created/edited customer to Supabase Cloud
 */
export async function pushCustomerToCloud(storeSlug: string, customer: Customer): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  try {
    const businessId = await resolveStoreBusinessId(storeSlug);
    if (!businessId) return false;

    const { error } = await supabase.from('customers').upsert({
      business_id: businessId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      address: customer.address || null,
      credit_limit: customer.creditLimit,
      current_balance: customer.storeCreditBalance,
      loyalty_points: customer.loyaltyPoints,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'business_id, phone' });

    return !error;
  } catch (err) {
    console.warn('Failed to push customer to Supabase:', err);
    return false;
  }
}
