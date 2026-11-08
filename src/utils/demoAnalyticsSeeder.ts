import { db } from '@/db/posDb';
import { Order, Product, OrderItem } from '@/types/pos';

export const DEMO_RETAIL_PRODUCTS: Product[] = [
  {
    id: 'prod-our-001',
    brandId: 'oursell',
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
    brandId: 'oursell',
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
    brandId: 'oursell',
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
    brandId: 'oursell',
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
    brandId: 'oursell',
    barcode: '890200000005',
    sku: 'OUR-COFF-250',
    title: 'Specialty Arabica Roasted Coffee Beans 250g',
    brand: 'Hilltop Brew',
    category: 'Beverages',
    unit: 'Pcs',
    costPrice: 220.00,
    mrp: 420.00,
    sellingPrice: 380.00,
    taxRate: 5,
    stock: 18,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'prod-our-006',
    brandId: 'oursell',
    barcode: '890200000006',
    sku: 'OUR-HONY-250',
    title: 'Organic Wildflower Raw Honey 250g',
    brand: 'NatureNectar',
    category: 'Groceries',
    unit: 'Pcs',
    costPrice: 140.00,
    mrp: 290.00,
    sellingPrice: 240.00,
    taxRate: 5,
    stock: 32,
    lowStockThreshold: 8,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'prod-our-007',
    brandId: 'oursell',
    barcode: '890200000007',
    sku: 'OUR-PSTA-500',
    title: 'Whole Wheat Spaghetti Pasta 500g',
    brand: 'CasaBella',
    category: 'Groceries',
    unit: 'Pcs',
    costPrice: 65.00,
    mrp: 130.00,
    sellingPrice: 110.00,
    taxRate: 5,
    stock: 45,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'prod-our-008',
    brandId: 'oursell',
    barcode: '890200000008',
    sku: 'OUR-OLIV-500',
    title: 'Extra Virgin Cold Pressed Olive Oil 500ml',
    brand: 'OleaTerra',
    category: 'Groceries',
    unit: 'Pcs',
    costPrice: 280.00,
    mrp: 520.00,
    sellingPrice: 450.00,
    taxRate: 5,
    stock: 20,
    lowStockThreshold: 5,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'prod-our-009',
    brandId: 'oursell',
    barcode: '890200000009',
    sku: 'OUR-BUTR-100',
    title: 'Classic Salted Butter 100g',
    brand: 'DairyGold',
    category: 'Dairy',
    unit: 'Pcs',
    costPrice: 38.00,
    mrp: 65.00,
    sellingPrice: 56.00,
    taxRate: 5,
    stock: 35,
    lowStockThreshold: 10,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'prod-our-010',
    brandId: 'oursell',
    barcode: '890200000010',
    sku: 'OUR-CHOC-80G',
    title: 'Dark Chocolate Almond Bar 80g',
    brand: 'CocoaCraft',
    category: 'Snacks',
    unit: 'Pcs',
    costPrice: 45.00,
    mrp: 99.00,
    sellingPrice: 85.00,
    taxRate: 5,
    stock: 50,
    lowStockThreshold: 12,
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

interface DemoOrderBlueprint {
  hour: number;
  minute: number;
  dayOffset: number; // 0 = today, 1 = yesterday
  items: {
    productId: string;
    qty: number;
  }[];
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'KHATA';
  customer?: { name: string; phone: string; id: string };
  cashierName: string;
}

const DEMO_BLUEPRINTS: DemoOrderBlueprint[] = [
  // Morning Rush (08:30 - 11:30)
  {
    hour: 8,
    minute: 35,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-004', qty: 1 }, // Sourdough bread 50
      { productId: 'prod-our-003', qty: 2 }, // Milk 32x2 = 64
    ],
    paymentMethod: 'CASH',
    customer: { id: 'cust-our-001', name: 'Anil Kumar', phone: '+91 98450 77889' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 9,
    minute: 15,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-004', qty: 1 }, // Bread 50
      { productId: 'prod-our-009', qty: 1 }, // Butter 56
      { productId: 'prod-our-003', qty: 1 }, // Milk 32
    ],
    paymentMethod: 'UPI',
    customer: { id: 'cust-our-002', name: 'Aysha Noor', phone: '+91 94470 12345' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 10,
    minute: 20,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 2 }, // Crisps 25x2 = 50
      { productId: 'prod-our-002', qty: 1 }, // Water 20
    ],
    paymentMethod: 'CASH',
    cashierName: 'Oursell Store Admin',
  },
  {
    hour: 11,
    minute: 40,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-005', qty: 1 }, // Coffee 380
      { productId: 'prod-our-004', qty: 1 }, // Bread 50
    ],
    paymentMethod: 'CARD',
    customer: { id: 'cust-our-003', name: 'Vikram Patel', phone: '+91 97230 45678' },
    cashierName: 'Oursell Store Admin',
  },

  // Lunch Peak (13:00 - 14:30)
  {
    hour: 13,
    minute: 10,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 2 }, // Crisps 50
      { productId: 'prod-our-002', qty: 2 }, // Water 40
    ],
    paymentMethod: 'UPI',
    customer: { id: 'cust-our-004', name: 'Rahul Sharma', phone: '+91 98110 33445' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 13,
    minute: 35,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-007', qty: 1 }, // Pasta 110
      { productId: 'prod-our-008', qty: 1 }, // Olive Oil 450
    ],
    paymentMethod: 'CARD',
    customer: { id: 'cust-our-005', name: 'Priya Nair', phone: '+91 94960 99887' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 13,
    minute: 55,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 3 }, // Crisps 75
      { productId: 'prod-our-002', qty: 2 }, // Water 40
    ],
    paymentMethod: 'UPI',
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 14,
    minute: 20,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-010', qty: 2 }, // Dark Choc 85x2 = 170
      { productId: 'prod-our-002', qty: 1 }, // Water 20
    ],
    paymentMethod: 'UPI',
    cashierName: 'Oursell Store Admin',
  },

  // Afternoon Steady (15:30 - 17:00)
  {
    hour: 15,
    minute: 40,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-005', qty: 1 }, // Coffee 380
      { productId: 'prod-our-006', qty: 1 }, // Honey 240
    ],
    paymentMethod: 'UPI',
    customer: { id: 'cust-our-006', name: 'Mohammed Salim', phone: '+91 98950 55443' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 16,
    minute: 25,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 1 }, // Crisps 25
      { productId: 'prod-our-002', qty: 1 }, // Water 20
    ],
    paymentMethod: 'CASH',
    cashierName: 'Cashier Fatima',
  },

  // Evening Rush Hour (18:00 - 20:00)
  {
    hour: 18,
    minute: 15,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-004', qty: 2 }, // Bread 100
      { productId: 'prod-our-003', qty: 2 }, // Milk 64
      { productId: 'prod-our-009', qty: 1 }, // Butter 56
    ],
    paymentMethod: 'KHATA',
    customer: { id: 'cust-our-001', name: 'Anil Kumar', phone: '+91 98450 77889' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 18,
    minute: 45,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 2 }, // Crisps 50
      { productId: 'prod-our-002', qty: 2 }, // Water 40
      { productId: 'prod-our-010', qty: 1 }, // Choc 85
    ],
    paymentMethod: 'UPI',
    customer: { id: 'cust-our-002', name: 'Aysha Noor', phone: '+91 94470 12345' },
    cashierName: 'Cashier Fatima',
  },
  {
    hour: 19,
    minute: 10,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-007', qty: 2 }, // Pasta 220
      { productId: 'prod-our-008', qty: 1 }, // Olive Oil 450
      { productId: 'prod-our-006', qty: 1 }, // Honey 240
    ],
    paymentMethod: 'CARD',
    customer: { id: 'cust-our-003', name: 'Vikram Patel', phone: '+91 97230 45678' },
    cashierName: 'Oursell Store Admin',
  },
  {
    hour: 19,
    minute: 35,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-001', qty: 2 }, // Crisps 50
      { productId: 'prod-our-002', qty: 1 }, // Water 20
    ],
    paymentMethod: 'CASH',
    cashierName: 'Cashier Fatima',
  },

  // Night Casual (20:15 - 21:30)
  {
    hour: 20,
    minute: 25,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-003', qty: 2 }, // Milk 64
      { productId: 'prod-our-004', qty: 1 }, // Bread 50
    ],
    paymentMethod: 'UPI',
    cashierName: 'Oursell Store Admin',
  },
  {
    hour: 21,
    minute: 10,
    dayOffset: 0,
    items: [
      { productId: 'prod-our-010', qty: 1 }, // Choc 85
      { productId: 'prod-our-002', qty: 1 }, // Water 20
    ],
    paymentMethod: 'CASH',
    cashierName: 'Oursell Store Admin',
  },
];

export async function seedRealisticRetailTransactions(brandId: string = 'oursell'): Promise<number> {
  // 1. Ensure products exist for this brand
  const existingProds = await db.products.toArray();
  const prodMap = new Map<string, Product>();

  if (existingProds.length === 0) {
    const productsToSeed = DEMO_RETAIL_PRODUCTS.map((p) => ({
      ...p,
      brandId: brandId || 'oursell',
    }));
    await db.products.bulkPut(productsToSeed);
    productsToSeed.forEach((p) => prodMap.set(p.id, p));
  } else {
    existingProds.forEach((p) => prodMap.set(p.id, p));
  }

  // 2. Build realistic orders with real timestamp distribution
  const now = new Date();
  const ordersToInsert: Order[] = [];

  for (let idx = 0; idx < DEMO_BLUEPRINTS.length; idx++) {
    const bp = DEMO_BLUEPRINTS[idx];
    const orderDate = new Date(now);
    orderDate.setDate(now.getDate() - bp.dayOffset);
    orderDate.setHours(bp.hour, bp.minute, Math.floor(Math.random() * 50) + 5, 0);

    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let taxAmount = 0;

    for (const itm of bp.items) {
      let product = prodMap.get(itm.productId);
      if (!product && existingProds.length > 0) {
        // Fallback to an available product if ID differed
        product = existingProds[Math.abs(itm.productId.charCodeAt(itm.productId.length - 1)) % existingProds.length];
      }
      if (!product) continue;

      const lineTotal = product.sellingPrice * itm.qty;
      const lineTax = (lineTotal * (product.taxRate || 5)) / 100;

      subtotal += lineTotal;
      taxAmount += lineTax;

      orderItems.push({
        productId: product.id,
        title: product.title,
        quantity: itm.qty,
        unitPrice: product.sellingPrice,
        discount: 0,
        taxRate: product.taxRate || 5,
        lineTotal,
        image: product.image,
        barcode: product.barcode,
      });
    }

    if (orderItems.length === 0) continue;

    const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;
    const orderNumber = `INV-${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${(1001 + idx).toString()}`;

    const order: Order = {
      id: `demo-ord-${idx + 1}-${Date.now()}`,
      brandId: brandId || 'oursell',
      orderNumber,
      items: orderItems,
      subtotal,
      discountAmount: 0,
      taxAmount,
      grandTotal,
      paymentMethod: bp.paymentMethod,
      cashTendered: bp.paymentMethod === 'CASH' ? Math.ceil(grandTotal / 50) * 50 : undefined,
      changeDue: bp.paymentMethod === 'CASH' ? Math.ceil(grandTotal / 50) * 50 - grandTotal : undefined,
      customerId: bp.customer?.id,
      customerName: bp.customer?.name,
      customerPhone: bp.customer?.phone,
      cashierId: 'acc-demo-cashier',
      cashierName: bp.cashierName,
      status: 'COMPLETED',
      notes: 'Demo Sample Retail Transaction',
      createdAt: orderDate.toISOString(),
    };

    ordersToInsert.push(order);
  }

  await db.orders.bulkPut(ordersToInsert);
  return ordersToInsert.length;
}

export async function clearDemoRetailTransactions(brandId: string = 'oursell'): Promise<number> {
  const allOrders = await db.orders.toArray();
  const demoOrders = allOrders.filter(
    (o) =>
      o.id.startsWith('demo-ord-') ||
      o.notes === 'Demo Sample Retail Transaction' ||
      (brandId && o.brandId === brandId && o.orderNumber.startsWith('INV-OUR-'))
  );

  for (const o of demoOrders) {
    await db.orders.delete(o.id);
  }

  return demoOrders.length;
}
