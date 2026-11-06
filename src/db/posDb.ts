import Dexie, { type EntityTable } from 'dexie';
import {
  BrandApplication,
  Brand,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Customer,
  CustomerCreditLedger,
  Supplier,
  PurchaseOrder,
  ShiftSession,
  StoreExpense,
  Promotion,
  StaffUser,
  TerminalTelemetry,
  HeldCart,
  AuditLog,
} from '@/types/pos';

export class OursellDatabase extends Dexie {
  brand_applications!: EntityTable<BrandApplication, 'id'>;
  brands!: EntityTable<Brand, 'id'>;
  products!: EntityTable<Product, 'id'>;
  variants!: EntityTable<ProductVariant, 'id'>;
  orders!: EntityTable<Order, 'id'>;
  order_items!: EntityTable<OrderItem & { id: string; orderId: string; brandId: string }, 'id'>;
  customers!: EntityTable<Customer, 'id'>;
  customer_credit_ledger!: EntityTable<CustomerCreditLedger, 'id'>;
  suppliers!: EntityTable<Supplier, 'id'>;
  purchase_orders!: EntityTable<PurchaseOrder, 'id'>;
  shifts!: EntityTable<ShiftSession, 'id'>;
  store_expenses!: EntityTable<StoreExpense, 'id'>;
  promotions!: EntityTable<Promotion, 'id'>;
  staff_users!: EntityTable<StaffUser, 'id'>;
  terminal_telemetry!: EntityTable<TerminalTelemetry, 'id'>;
  held_carts!: EntityTable<HeldCart, 'id'>;
  audit_logs!: EntityTable<AuditLog, 'id'>;
  barcodes!: EntityTable<import('@/types/pos').BarcodeRecord, 'id'>;
  barcode_prints!: EntityTable<import('@/types/pos').BarcodePrintLog, 'id'>;
  accounts!: EntityTable<import('@/types/pos').StoreAccount, 'id'>;

  constructor() {
    super('Oursell_POS_DB');
    this.version(4).stores({
      brand_applications: 'id, requestedUsername, email, status, appliedAt',
      brands: 'id, brandId, username, status, planTier',
      products: 'id, brandId, barcode, sku, category, title, stock, isActive',
      variants: 'id, brandId, parentProductId, sku, barcode',
      orders: 'id, brandId, orderNumber, status, customerPhone, cashierId, createdAt',
      order_items: 'id, orderId, productId, brandId',
      customers: 'id, brandId, phone, name',
      customer_credit_ledger: 'id, brandId, customerId, createdAt',
      suppliers: 'id, brandId, phone, name',
      purchase_orders: 'id, brandId, poNumber, supplierId, status, createdAt',
      shifts: 'id, brandId, cashierId, status, openedAt',
      store_expenses: 'id, brandId, shiftId, category, createdAt',
      promotions: 'id, brandId, code, promoType, isActive',
      staff_users: 'id, brandId, pin, role, isActive',
      terminal_telemetry: 'id, brandId, terminalId, lastPing',
      held_carts: 'id, brandId, heldNumber, createdAt',
      audit_logs: 'id, brandId, actor, timestamp',
      barcodes: 'id, brandId, barcodeValue, productId, barcodeType, createdAt',
      barcode_prints: 'id, brandId, barcodeValue, printedAt',
      accounts: 'id, storeId, username, role, isActive',
    });
  }
}

export const db = new OursellDatabase();

export async function seedInitialData(): Promise<void> {
  try {
    // 0. Ensure Oursell Demo Store and its accounts (oursell@admin / oursell@staff) are always seeded
    await seedOursellDemoStore();
  } catch (err) {
    console.warn('Oursell demo store seeding warning:', err);
  }

  try {
    const brandCount = await db.brands.count().catch(() => 0);
    if (brandCount > 1) {
      // If brands already exist, ensure barcodes table is populated if empty
      const barCount = await db.barcodes.count().catch(() => 0);
      if (barCount === 0) {
        await seedBarcodes('BRD-101');
      }
      return;
    }
  } catch (err) {
    console.warn('Initial brand count check warning:', err);
  }

  try {
    // 1. Seed Pending Brand Applications
    const appCount = await db.brand_applications.count().catch(() => 0);
    if (appCount === 0) {
      await db.brand_applications.bulkPut([
    {
      id: 'app-001',
      brandName: 'Luxe Apparel Store',
      legalName: 'Luxe Retail Pvt Ltd',
      businessCategory: 'Fashion',
      ownerName: 'Rahul Sharma',
      email: 'rahul@luxeapparel.in',
      phone: '+91 98450 11223',
      requestedUsername: 'luxeapparel',
      passwordHash: 'luxe@2026',
      terminalCount: 2,
      outletCount: 1,
      gstin: '29ABCDE1234F1Z5',
      businessAddress: '102 Brigade Road, Bangalore, Karnataka',
      status: 'PENDING',
      appliedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'app-002',
      brandName: 'Daily Fresh Supermarket',
      legalName: 'Daily Fresh Retailers LLP',
      businessCategory: 'Grocery',
      ownerName: 'Aysha Mariyam',
      email: 'aysha@dailyfreshmart.com',
      phone: '+91 94470 55667',
      requestedUsername: 'dailyfresh',
      passwordHash: 'fresh@2026',
      terminalCount: 4,
      outletCount: 2,
      gstin: '32AABCB4321E1Z8',
      businessAddress: 'Express Highway, Kochi, Kerala',
      status: 'PENDING',
      appliedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    },
  ]);
  }

  // 2. Seed Default Active Brand
  const defaultBrandId = 'BRD-101';
  await db.brands.put({
    id: 'brand-001',
    brandId: defaultBrandId,
    brandName: 'Central Mart (Oursell Flagship)',
    businessCategory: 'Supermarket',
    ownerName: 'Ibrahim Kadri',
    email: 'kadri@centralmart.com',
    phone: '+91 98765 43210',
    username: 'centralmart',
    passwordHash: 'store123',
    status: 'ACTIVE',
    planTier: 'Professional',
    createdAt: new Date().toISOString(),
    outletCount: 3,
    terminalCount: 6,
    currency: '₹',
    taxRateDefault: 5,
  });

  // 3. Seed Realistic Products
  await db.products.bulkPut([
    {
      id: 'prod-001',
      brandId: defaultBrandId,
      barcode: '890103000001',
      sku: 'SNK-CHIP-50G',
      title: 'Potato Chips Masala 50g',
      brand: 'Crispo',
      category: 'Snacks',
      unit: 'Pcs',
      costPrice: 14.00,
      mrp: 25.00,
      sellingPrice: 20.00,
      taxRate: 5,
      stock: 45,
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-002',
      brandId: defaultBrandId,
      barcode: '890103000002',
      sku: 'BEV-WATR-1L',
      title: 'Natural Mineral Water 1L',
      brand: 'AquaPure',
      category: 'Beverages',
      unit: 'Pcs',
      costPrice: 10.00,
      mrp: 25.00,
      sellingPrice: 20.00,
      taxRate: 5,
      stock: 120,
      lowStockThreshold: 20,
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-003',
      brandId: defaultBrandId,
      barcode: '890103000003',
      sku: 'DAI-MILK-500',
      title: 'Full Cream Fresh Milk 500ml',
      brand: 'DairyGold',
      category: 'Dairy',
      unit: 'Pcs',
      costPrice: 26.00,
      mrp: 35.00,
      sellingPrice: 32.00,
      taxRate: 0,
      stock: 25,
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-004',
      brandId: defaultBrandId,
      barcode: '890103000004',
      sku: 'BAK-BRED-400',
      title: 'Whole Wheat Farm Bread 400g',
      brand: 'BakersPride',
      category: 'Bakery',
      unit: 'Pcs',
      costPrice: 32.00,
      mrp: 50.00,
      sellingPrice: 45.00,
      taxRate: 5,
      stock: 8, // Low Stock Alert
      lowStockThreshold: 15,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-005',
      brandId: defaultBrandId,
      barcode: '890103000005',
      sku: 'SNK-CHOC-BAR',
      title: 'Dark Chocolate Almond Bar 85g',
      brand: 'NoirDelight',
      category: 'Snacks',
      unit: 'Pcs',
      costPrice: 65.00,
      mrp: 120.00,
      sellingPrice: 100.00,
      taxRate: 18,
      stock: 60,
      lowStockThreshold: 12,
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-006',
      brandId: defaultBrandId,
      barcode: '890103000006',
      sku: 'APP-SOCK-WHT',
      title: 'Cotton Crew Sports Socks (Pair)',
      brand: 'FlexFit',
      category: 'Apparel',
      unit: 'Pcs',
      costPrice: 75.00,
      mrp: 199.00,
      sellingPrice: 150.00,
      taxRate: 12,
      stock: 14,
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-007',
      brandId: defaultBrandId,
      barcode: '890103000007',
      sku: 'BAK-BRIO-350',
      title: 'Artisan Brioche Loaf 350g',
      brand: 'BakersPride',
      category: 'Bakery',
      unit: 'Pcs',
      costPrice: 85.00,
      mrp: 150.00,
      sellingPrice: 120.00,
      taxRate: 5,
      stock: 5, // Low Stock Alert
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-008',
      brandId: defaultBrandId,
      barcode: '890103000008',
      sku: 'APP-BELT-LTH',
      title: 'Fine Italian Leather Belt Black',
      brand: 'UrbanCraft',
      category: 'Apparel',
      unit: 'Pcs',
      costPrice: 450.00,
      mrp: 1299.00,
      sellingPrice: 899.00,
      taxRate: 18,
      stock: 42,
      lowStockThreshold: 8,
      image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-009',
      brandId: defaultBrandId,
      barcode: '890103000009',
      sku: 'RES-PST-BEEF',
      title: 'Pasta with Roast Beef',
      brand: 'Gourmet Kitchen',
      category: 'Restaurant',
      unit: 'Pcs',
      costPrice: 120.00,
      mrp: 280.00,
      sellingPrice: 240.00,
      taxRate: 5,
      stock: 28,
      lowStockThreshold: 5,
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d628169a?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-010',
      brandId: defaultBrandId,
      barcode: '890103000010',
      sku: 'RES-SAL-STK',
      title: 'Grilled Salmon Steak Plate',
      brand: 'Ocean Fresh',
      category: 'Restaurant',
      unit: 'Pcs',
      costPrice: 240.00,
      mrp: 480.00,
      sellingPrice: 420.00,
      taxRate: 5,
      stock: 18,
      lowStockThreshold: 5,
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-011',
      brandId: defaultBrandId,
      barcode: '890103000011',
      sku: 'RES-PIZ-SUPR',
      title: 'Supreme Woodfired Pizza',
      brand: 'Pizzaro',
      category: 'Restaurant',
      unit: 'Pcs',
      costPrice: 160.00,
      mrp: 399.00,
      sellingPrice: 350.00,
      taxRate: 5,
      stock: 30,
      lowStockThreshold: 8,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
    {
      id: 'prod-012',
      brandId: defaultBrandId,
      barcode: '890103000012',
      sku: 'RES-BGR-MSHM',
      title: 'Gourmet Mushroom Burger',
      brand: 'BurgerCraft',
      category: 'Restaurant',
      unit: 'Pcs',
      costPrice: 85.00,
      mrp: 220.00,
      sellingPrice: 180.00,
      taxRate: 5,
      stock: 35,
      lowStockThreshold: 10,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
      isActive: true,
    },
  ]);

  // 4. Seed Staff Users
  await db.staff_users.bulkPut([
    {
      id: 'staff-001',
      brandId: defaultBrandId,
      name: 'Ibrahim Kadri (Admin)',
      pin: '1234',
      role: 'ADMIN',
      commissionRate: 0.03,
      totalSalesGenerated: 45200,
      canGiveDiscount: true,
      isActive: true,
    },
    {
      id: 'staff-002',
      brandId: defaultBrandId,
      name: 'Sarah Jenkins (Manager)',
      pin: '9999',
      role: 'MANAGER',
      commissionRate: 0.02,
      totalSalesGenerated: 28400,
      canGiveDiscount: true,
      isActive: true,
    },
    {
      id: 'staff-003',
      brandId: defaultBrandId,
      name: 'Atikur Rahman (Cashier)',
      pin: '5678',
      role: 'CASHIER',
      commissionRate: 0.01,
      totalSalesGenerated: 14200,
      canGiveDiscount: false,
      isActive: true,
    },
  ]);

  // 5. Seed Customers
  await db.customers.bulkPut([
    {
      id: 'cust-001',
      brandId: defaultBrandId,
      name: 'Rahul Sharma',
      phone: '+91 98450 11223',
      email: 'rahul.s@outlook.com',
      loyaltyPoints: 140,
      storeCreditBalance: 1200.00,
      creditLimit: 5000.00,
      address: 'Indiranagar 100ft Road, Bangalore',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'cust-002',
      brandId: defaultBrandId,
      name: 'Fatima Al-Zahra',
      phone: '+971 50 123 4567',
      email: 'fatima.z@gmail.com',
      loyaltyPoints: 320,
      storeCreditBalance: 0.00,
      creditLimit: 3000.00,
      address: 'Deira, Dubai, UAE',
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'cust-003',
      brandId: defaultBrandId,
      name: 'Anjali Menon',
      phone: '+91 94471 23890',
      email: 'anjali.m@yahoo.com',
      loyaltyPoints: 85,
      storeCreditBalance: 450.00,
      creditLimit: 2000.00,
      address: 'Panampilly Nagar, Kochi',
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
  ]);

  // 6. Seed Active Shift
  const currentShiftId = 'shift-101';
  await db.shifts.put({
    id: currentShiftId,
    brandId: defaultBrandId,
    shiftNumber: 'Shift #01',
    cashierId: 'staff-001',
    cashierName: 'Ibrahim Kadri (Admin)',
    openingFloat: 2000.00,
    expectedCash: 7420.00,
    payIns: 0,
    payOuts: 0,
    cashSales: 5420.00,
    cardSales: 4150.00,
    upiSales: 2890.00,
    khataSales: 0,
    totalSales: 12460.00,
    openedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: 'OPEN',
  });

  // 7. Seed Held Carts
  await db.held_carts.bulkPut([
    {
      id: 'held-001',
      brandId: defaultBrandId,
      heldNumber: 'Held #01',
      customerLabel: 'Rahul Sharma',
      customerPhone: '+91 98450 11223',
      items: [
        {
          productId: 'prod-001',
          title: 'Potato Chips Masala 50g',
          quantity: 2,
          unitPrice: 20.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 40.00,
          image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
        },
        {
          productId: 'prod-005',
          title: 'Dark Chocolate Almond Bar 85g',
          quantity: 1,
          unitPrice: 100.00,
          discount: 0,
          taxRate: 18,
          lineTotal: 100.00,
          image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80',
        },
      ],
      total: 140.00,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'held-002',
      brandId: defaultBrandId,
      heldNumber: 'Held #02',
      customerLabel: 'Walk-in Customer',
      items: [
        {
          productId: 'prod-004',
          title: 'Whole Wheat Farm Bread 400g',
          quantity: 1,
          unitPrice: 45.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 45.00,
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
        },
      ],
      total: 45.00,
      createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
  ]);

  // 8. Seed Promotions
  await db.promotions.bulkPut([
    {
      id: 'promo-001',
      brandId: defaultBrandId,
      code: 'WELCOME10',
      title: 'Welcome 10% Off',
      promoType: 'PERCENTAGE',
      discountValue: 10,
      minCartValue: 100,
      isActive: true,
    },
    {
      id: 'promo-002',
      brandId: defaultBrandId,
      code: 'FLAT50',
      title: 'Flat ₹50 Off on orders above ₹500',
      promoType: 'FLAT_CART',
      discountValue: 50,
      minCartValue: 500,
      isActive: true,
    },
    {
      id: 'promo-003',
      brandId: defaultBrandId,
      code: 'BOGO',
      title: 'Buy 2 Get 1 Free',
      promoType: 'BOGO',
      discountValue: 20,
      minCartValue: 50,
      buyQty: 2,
      getQty: 1,
      isActive: true,
    },
  ]);

  // 9. Seed Suppliers
  await db.suppliers.bulkPut([
    {
      id: 'sup-001',
      brandId: defaultBrandId,
      name: 'FreshBake Wholesale Ltd',
      contactPerson: 'David Miller',
      phone: '+91 98888 12345',
      email: 'orders@freshbakewholesale.com',
      gstin: '29AABCF9876K1Z3',
      paymentTerms: 'NET_30',
      address: 'Industrial Area Phase 2, Bangalore',
    },
    {
      id: 'sup-002',
      brandId: defaultBrandId,
      name: 'Beverage Distributors Corp',
      contactPerson: 'Kareem Mansoor',
      phone: '+91 97777 54321',
      email: 'sales@bevditrib.com',
      gstin: '32AABCF1234D1Z2',
      paymentTerms: 'NET_15',
      address: 'Harbor Road, Kochi',
    },
  ]);

  // 10. Seed Completed Sample Orders for Realistic Analytics
  const sampleOrders: Order[] = [
    {
      id: 'ord-1001',
      brandId: defaultBrandId,
      orderNumber: 'INV-20261102-0001',
      items: [
        {
          productId: 'prod-001',
          title: 'Potato Chips Masala 50g',
          quantity: 2,
          unitPrice: 20.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 40.00,
        },
        {
          productId: 'prod-002',
          title: 'Natural Mineral Water 1L',
          quantity: 1,
          unitPrice: 20.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 20.00,
        },
      ],
      subtotal: 60.00,
      discountAmount: 0,
      taxAmount: 3.00,
      grandTotal: 63.00,
      paymentMethod: 'CASH',
      cashTendered: 100.00,
      changeDue: 37.00,
      customerId: 'cust-001',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98450 11223',
      cashierId: 'staff-001',
      cashierName: 'Ibrahim Kadri',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'ord-1002',
      brandId: defaultBrandId,
      orderNumber: 'INV-20261102-0002',
      items: [
        {
          productId: 'prod-009',
          title: 'Pasta with Roast Beef',
          quantity: 2,
          unitPrice: 240.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 480.00,
        },
        {
          productId: 'prod-010',
          title: 'Grilled Salmon Steak Plate',
          quantity: 1,
          unitPrice: 420.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 420.00,
        },
      ],
      subtotal: 900.00,
      discountAmount: 50.00,
      taxAmount: 42.50,
      grandTotal: 892.50,
      paymentMethod: 'CARD',
      cardRefCode: 'AUTH-948271',
      customerId: 'cust-002',
      customerName: 'Fatima Al-Zahra',
      customerPhone: '+971 50 123 4567',
      cashierId: 'staff-001',
      cashierName: 'Ibrahim Kadri',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'ord-1003',
      brandId: defaultBrandId,
      orderNumber: 'INV-20261102-0003',
      items: [
        {
          productId: 'prod-011',
          title: 'Supreme Woodfired Pizza',
          quantity: 1,
          unitPrice: 350.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 350.00,
        },
        {
          productId: 'prod-002',
          title: 'Natural Mineral Water 1L',
          quantity: 2,
          unitPrice: 20.00,
          discount: 0,
          taxRate: 5,
          lineTotal: 40.00,
        },
      ],
      subtotal: 390.00,
      discountAmount: 0,
      taxAmount: 19.50,
      grandTotal: 409.50,
      paymentMethod: 'UPI',
      upiRef: 'UPI-TXN-883921',
      cashierId: 'staff-001',
      cashierName: 'Ibrahim Kadri',
      status: 'COMPLETED',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ];

  await db.orders.bulkPut(sampleOrders);

  // 11. Seed Telemetry
  await db.terminal_telemetry.put({
    id: 'tel-001',
    brandId: defaultBrandId,
    terminalId: 'TRM-01',
    terminalName: 'Main Counter POS-1',
    currentCashier: 'Ibrahim Kadri',
    ipAddress: '192.168.1.104',
    isOnline: true,
    pendingSyncCount: 0,
    lastPing: new Date().toISOString(),
  });

  // 12. Seed Barcodes
  await seedBarcodes(defaultBrandId);
  } catch (err) {
    console.warn('Seed initialization handled:', err);
  }
}

export async function seedBarcodes(brandId = 'BRD-101'): Promise<void> {
  await db.barcodes.bulkPut([
    {
      id: 'bar-001',
      brandId,
      productId: 'prod-001',
      productName: 'Potato Chips Masala 50g',
      productSku: 'SNK-CHIP-50G',
      sellingPrice: 20.00,
      barcodeValue: '890103000001',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-002',
      brandId,
      productId: 'prod-002',
      productName: 'Natural Mineral Water 1L',
      productSku: 'BEV-WATR-1L',
      sellingPrice: 20.00,
      barcodeValue: '890103000002',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-003',
      brandId,
      productId: 'prod-003',
      productName: 'Full Cream Fresh Milk 500ml',
      productSku: 'DAI-MILK-500',
      sellingPrice: 32.00,
      barcodeValue: '890103000003',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-004',
      brandId,
      productId: 'prod-004',
      productName: 'Whole Wheat Farm Bread 400g',
      productSku: 'BAK-BRED-400',
      sellingPrice: 45.00,
      barcodeValue: '890103000004',
      barcodeType: 'EAN13',
      labelSize: '38x25mm',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-005',
      brandId,
      productId: 'prod-005',
      productName: 'Dark Chocolate Almond Bar 85g',
      productSku: 'SNK-CHOC-BAR',
      sellingPrice: 100.00,
      barcodeValue: '890103000005',
      barcodeType: 'EAN13',
      labelSize: '50x25mm',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bar-006',
      brandId,
      productId: 'prod-006',
      productName: 'Cotton Crew Sports Socks (Pair)',
      productSku: 'APP-SOCK-WHT',
      sellingPrice: 150.00,
      barcodeValue: '890103000006',
      barcodeType: 'CODE128',
      labelSize: '50x25mm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
}

export async function seedOursellDemoStore(): Promise<void> {
  const storeId = 'oursell';

  // 1. Seed Store Brand
  await db.brands.put({
    id: 'brand-oursell',
    brandId: storeId,
    brandName: 'Oursell Demo Store',
    businessCategory: 'General Retail',
    ownerName: 'Oursell Retail Admin',
    email: 'oursell@admin',
    phone: '+91 98765 43210',
    username: 'oursell',
    passwordHash: '6001',
    status: 'ACTIVE',
    planTier: 'Enterprise',
    createdAt: new Date().toISOString(),
    outletCount: 2,
    terminalCount: 4,
    currency: '₹',
    taxRateDefault: 5,
  });

  // 2. Seed Accounts: Admin & Staff
  await db.accounts.bulkPut([
    {
      id: 'acc-oursell-admin',
      storeId: 'oursell',
      username: 'oursell@admin',
      email: 'admin@ourselldemo.com',
      passwordHash: '6001',
      name: 'Oursell Store Admin',
      role: 'STORE_ADMIN',
      permissions: ['all'],
      pin: '6001',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-oursell-staff',
      storeId: 'oursell',
      username: 'oursell@staff',
      email: 'staff@ourselldemo.com',
      passwordHash: '1234',
      name: 'Cashier Fatima',
      role: 'STORE_STAFF',
      permissions: ['pos_billing', 'customer_manage', 'invoice_print'],
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'acc-centralmart-admin',
      storeId: 'BRD-101',
      username: 'centralmart',
      email: 'kadri@centralmart.com',
      passwordHash: 'store123',
      name: 'Ibrahim Kadri',
      role: 'STORE_ADMIN',
      permissions: ['all'],
      pin: '1234',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  // 3. Seed Products for 'oursell' store
  const existingProds = await db.products.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingProds === 0) {
    await db.products.bulkPut([
      {
        id: 'prod-our-001',
        brandId: storeId,
        barcode: '890200000001',
        sku: 'OUR-CHIP-50G',
        title: 'Artisan Potato Crisps Masala 50g',
        brand: 'Crispo',
        category: 'Snacks',
        unit: 'Pcs',
        costPrice: 15.00,
        mrp: 30.00,
        sellingPrice: 25.00,
        taxRate: 5,
        stock: 58,
        lowStockThreshold: 15,
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-002',
        brandId: storeId,
        barcode: '890200000002',
        sku: 'OUR-WATR-1L',
        title: 'Himalayan Spring Mineral Water 1L',
        brand: 'AquaPure',
        category: 'Beverages',
        unit: 'Pcs',
        costPrice: 10.00,
        mrp: 25.00,
        sellingPrice: 20.00,
        taxRate: 5,
        stock: 120,
        lowStockThreshold: 20,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-003',
        brandId: storeId,
        barcode: '890200000003',
        sku: 'OUR-MILK-500',
        title: 'Farm Fresh Organic Whole Milk 500ml',
        brand: 'DairyGold',
        category: 'Dairy',
        unit: 'Pcs',
        costPrice: 22.00,
        mrp: 35.00,
        sellingPrice: 32.00,
        taxRate: 5,
        stock: 40,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-004',
        brandId: storeId,
        barcode: '890200000004',
        sku: 'OUR-BRED-400',
        title: 'Rustic Sourdough Farm Bread 400g',
        brand: 'OvenCraft',
        category: 'Bakery',
        unit: 'Pcs',
        costPrice: 30.00,
        mrp: 60.00,
        sellingPrice: 50.00,
        taxRate: 5,
        stock: 25,
        lowStockThreshold: 8,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-005',
        brandId: storeId,
        barcode: '890200000005',
        sku: 'OUR-CHOC-85G',
        title: 'Single Origin Dark Chocolate 85g',
        brand: 'ChocoNoir',
        category: 'Snacks',
        unit: 'Pcs',
        costPrice: 65.00,
        mrp: 120.00,
        sellingPrice: 99.00,
        taxRate: 18,
        stock: 35,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: 'prod-our-006',
        brandId: storeId,
        barcode: '890200000006',
        sku: 'OUR-COFF-250',
        title: 'Specialty Arabica Roasted Coffee Beans 250g',
        brand: 'RoastMasters',
        category: 'Beverages',
        unit: 'Pcs',
        costPrice: 220.00,
        mrp: 450.00,
        sellingPrice: 380.00,
        taxRate: 5,
        stock: 18,
        lowStockThreshold: 5,
        image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);
  }

  // 4. Seed Barcodes for 'oursell'
  const existingBars = await db.barcodes.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingBars === 0) {
    await db.barcodes.bulkPut([
      {
        id: 'bar-our-001',
        brandId: storeId,
        productId: 'prod-our-001',
        productName: 'Artisan Potato Crisps Masala 50g',
        productSku: 'OUR-CHIP-50G',
        sellingPrice: 25.00,
        barcodeValue: '890200000001',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bar-our-002',
        brandId: storeId,
        productId: 'prod-our-002',
        productName: 'Himalayan Spring Mineral Water 1L',
        productSku: 'OUR-WATR-1L',
        sellingPrice: 20.00,
        barcodeValue: '890200000002',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bar-our-003',
        brandId: storeId,
        productId: 'prod-our-003',
        productName: 'Farm Fresh Organic Whole Milk 500ml',
        productSku: 'OUR-MILK-500',
        sellingPrice: 32.00,
        barcodeValue: '890200000003',
        barcodeType: 'EAN13',
        labelSize: '50x25mm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  // 5. Seed Shift for 'oursell'
  const existingShifts = await db.shifts.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingShifts === 0) {
    await db.shifts.put({
      id: 'shift-oursell-01',
      brandId: storeId,
      shiftNumber: 'Shift #01',
      cashierId: 'acc-oursell-admin',
      cashierName: 'Oursell Store Admin',
      openingFloat: 2500.00,
      expectedCash: 6450.00,
      payIns: 0,
      payOuts: 0,
      cashSales: 3950.00,
      cardSales: 4200.00,
      upiSales: 3100.00,
      khataSales: 0,
      totalSales: 11250.00,
      openedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: 'OPEN',
    });
  }

  // 6. Seed Orders for 'oursell'
  const existingOrders = await db.orders.where('brandId').equals(storeId).count().catch(() => 0);
  if (existingOrders === 0) {
    await db.orders.bulkPut([
      {
        id: 'ord-our-001',
        brandId: storeId,
        orderNumber: 'INV-OUR-0001',
        items: [
          {
            productId: 'prod-our-001',
            title: 'Artisan Potato Crisps Masala 50g',
            quantity: 2,
            unitPrice: 25.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 50.00,
          },
          {
            productId: 'prod-our-002',
            title: 'Himalayan Spring Mineral Water 1L',
            quantity: 2,
            unitPrice: 20.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 40.00,
          },
        ],
        subtotal: 90.00,
        discountAmount: 0,
        taxAmount: 4.50,
        grandTotal: 94.50,
        paymentMethod: 'CASH',
        cashTendered: 100.00,
        changeDue: 5.50,
        customerId: 'cust-our-001',
        customerName: 'Anil Kumar',
        customerPhone: '+91 98450 77889',
        cashierId: 'acc-oursell-staff',
        cashierName: 'Cashier Fatima',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'ord-our-002',
        brandId: storeId,
        orderNumber: 'INV-OUR-0002',
        items: [
          {
            productId: 'prod-our-006',
            title: 'Specialty Arabica Roasted Coffee Beans 250g',
            quantity: 1,
            unitPrice: 380.00,
            discount: 0,
            taxRate: 5,
            lineTotal: 380.00,
          },
        ],
        subtotal: 380.00,
        discountAmount: 20.00,
        taxAmount: 18.00,
        grandTotal: 378.00,
        paymentMethod: 'UPI',
        customerId: 'cust-our-002',
        customerName: 'Aysha Noor',
        customerPhone: '+91 94470 12345',
        cashierId: 'acc-oursell-admin',
        cashierName: 'Oursell Store Admin',
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ]);
  }
}

