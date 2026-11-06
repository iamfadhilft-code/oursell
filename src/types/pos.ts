export type Language = 'en' | 'ml' | 'ar';

export type BusinessCategory = 
  | 'Grocery'
  | 'Supermarket'
  | 'Fashion'
  | 'Electronics'
  | 'Pharmacy'
  | 'Bakery'
  | 'Restaurant'
  | 'Cafe'
  | 'General Retail'
  | 'Specialty Gift';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'SUSPENDED';

export type BrandStatus = 'ACTIVE' | 'SUSPENDED';

export type PlanTier = 'Starter' | 'Growth' | 'Professional' | 'Enterprise';

export interface BrandApplication {
  id: string;
  brandName: string;
  legalName: string;
  businessCategory: BusinessCategory;
  ownerName: string;
  email: string;
  phone: string;
  requestedUsername: string;
  passwordHash: string;
  terminalCount: number;
  outletCount: number;
  gstin?: string;
  businessAddress?: string;
  status: ApplicationStatus;
  appliedAt: string;
  rejectionReason?: string;
}

export interface Brand {
  id: string;
  brandId: string; // e.g., 'BRD-101'
  brandName: string;
  businessCategory: BusinessCategory;
  ownerName: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;
  status: BrandStatus;
  planTier: PlanTier;
  createdAt: string;
  outletCount: number;
  terminalCount: number;
  currency: string;
  taxRateDefault: number;
}

export interface ProductVariant {
  id: string;
  brandId: string;
  parentProductId: string;
  title: string;
  sku: string;
  barcode: string;
  additionalPrice: number;
  stock: number;
}

export interface Product {
  id: string;
  brandId: string;
  barcode: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  unit: 'Pcs' | 'Kg' | 'Ltr';
  costPrice: number;
  mrp: number;
  sellingPrice: number;
  taxRate: number; // Percentage, e.g. 5, 12, 18
  stock: number;
  lowStockThreshold: number;
  image?: string;
  isActive: boolean;
  variants?: ProductVariant[];
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  lineTotal: number;
  image?: string;
  notes?: string;
  barcode?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'KHATA' | 'SPLIT';

export interface Order {
  id: string;
  brandId: string;
  orderNumber: string; // e.g. 'INV-20261102-0001'
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  cashTendered?: number;
  changeDue?: number;
  cardRefCode?: string;
  upiRef?: string;
  splitDetails?: {
    cash?: number;
    card?: number;
    upi?: number;
    khata?: number;
  };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  shiftId?: string;
  status: 'COMPLETED' | 'HELD' | 'REFUNDED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  brandId: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  storeCreditBalance: number;
  creditLimit: number;
  address?: string;
  createdAt: string;
}

export interface CustomerCreditLedger {
  id: string;
  brandId: string;
  customerId: string;
  type: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED';
  amount: number;
  orderId?: string;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  brandId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  gstin?: string;
  paymentTerms: 'NET_15' | 'NET_30' | 'COD';
  address?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  title: string;
  orderedQty: number;
  receivedQty: number;
  costPrice: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  brandId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  totalCost: number;
  items: PurchaseOrderItem[];
  createdAt: string;
  receivedAt?: string;
}

export interface ShiftSession {
  id: string;
  brandId: string;
  shiftNumber: string;
  cashierId: string;
  cashierName: string;
  openingFloat: number;
  closingCashCounted?: number;
  expectedCash?: number;
  variance?: number; // Counted - Expected
  varianceType?: 'BALANCED' | 'OVER' | 'SHORT';
  payIns: number;
  payOuts: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  khataSales: number;
  totalSales: number;
  openedAt: string;
  closedAt?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface StoreExpense {
  id: string;
  brandId: string;
  shiftId?: string;
  category: 'TEA_SNACKS' | 'CLEANING' | 'REPAIRS' | 'COURIER' | 'UTILITIES' | 'OTHER';
  amount: number;
  notes: string;
  paidByCashier: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  brandId: string;
  code: string;
  title: string;
  promoType: 'PERCENTAGE' | 'FLAT_CART' | 'BOGO' | 'BUNDLE';
  discountValue: number;
  minCartValue: number;
  buyQty?: number;
  getQty?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export type StaffRole = 'STORE_ADMIN' | 'STORE_STAFF' | 'ADMIN' | 'MANAGER' | 'CASHIER';

export type StaffPermission =
  | 'all'
  | 'pos_billing'
  | 'inventory_view'
  | 'inventory_edit'
  | 'customer_manage'
  | 'invoice_print'
  | 'discount_approve'
  | 'staff_manage'
  | 'settings_manage';

export interface StoreAccount {
  id: string;
  storeId: string; // e.g. 'oursell'
  username: string; // e.g. 'oursell@admin' or 'oursell@staff'
  email?: string;
  passwordHash: string; // e.g. '6001' or '1234'
  name: string;
  role: 'STORE_ADMIN' | 'STORE_STAFF';
  permissions: StaffPermission[];
  pin?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  brandId: string;
  name: string;
  pin: string; // 4-digit PIN e.g. '1234'
  role: 'ADMIN' | 'MANAGER' | 'CASHIER';
  commissionRate: number; // e.g. 0.02 for 2%
  totalSalesGenerated: number;
  canGiveDiscount: boolean;
  isActive: boolean;
}

export interface TerminalTelemetry {
  id: string;
  brandId: string;
  terminalId: string;
  terminalName: string;
  currentCashier: string;
  ipAddress: string;
  isOnline: boolean;
  pendingSyncCount: number;
  lastPing: string;
}

export interface HeldCart {
  id: string;
  brandId: string;
  heldNumber: string;
  customerLabel: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  brandId?: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface BarcodeRecord {
  id: string;
  brandId: string;
  productId: string;
  productName: string;
  productSku: string;
  sellingPrice: number;
  barcodeValue: string;
  barcodeType: 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'CODE39' | 'QR';
  labelSize: string;
  createdAt: string;
  updatedAt: string;
}

export interface BarcodePrintLog {
  id: string;
  brandId: string;
  barcodeValue: string;
  productName: string;
  labelCount: number;
  labelSize: string;
  printedAt: string;
}

export interface DevCoreAdmin {
  username: string;
  role: 'SUPER_ADMIN';
}

