'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/db/posDb';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  StoreAccount,
  StaffPermission,
  Brand,
  Supplier,
  Product,
  Customer,
  StoreExpense,
  PricingPlan,
} from '@/types/pos';
import { PlanContactModal } from '@/components/pricing/PlanContactModal';
import { StoreSubscriptionSection } from '@/components/store-admin/StoreSubscriptionSection';
import { StoreOutletsSection } from '@/components/store-admin/StoreOutletsSection';
import { StoreTerminalsSection } from '@/components/store-admin/StoreTerminalsSection';
import { StoreEnterpriseSection } from '@/components/store-admin/StoreEnterpriseSection';
import {
  syncStaffBetweenTables,
  saveUnifiedStaff,
  updateUnifiedStaff,
  deleteUnifiedStaff,
  toggleActiveUnifiedStaff,
} from '@/utils/staffSync';
import { ImageFileInput } from '@/components/common/ImageFileInput';
import { generateCompliantBarcode } from '@/utils/barcodeUtils';
import {
  getStoreSyncStatus,
  exportStoreBackup,
  importStoreBackup,
  syncPendingTransactions,
  pullStoreFromCloud,
  SyncStatus,
} from '@/utils/cloudSyncManager';
import {
  CreditCard,
  Monitor,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Store,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Save,
  ShoppingCart,
  Package,
  Barcode,
  BarChart3,
  X,
  Key,
  Cloud,
  Database,
  Download,
  Upload,
  RefreshCw,
  Truck,
  Building,
  Mail,
  Search,
  Filter,
  DollarSign,
  Tag,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function StoreAdminPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = (params?.storeSlug as string) || 'oursell';

  const {
    isAdmin,
    isStaff,
    isAuthenticated,
    currentRole,
    currentAccount,
    switchToRole,
  } = useRoleAccess();

  const [store, setStore] = useState<Brand | null>(null);
  const [accounts, setAccounts] = useState<StoreAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<StoreExpense[]>([]);

  const [activeTab, setActiveTab] = useState<
    'subscription' | 'staff' | 'outlets' | 'terminals' | 'enterprise' | 'suppliers' | 'products' | 'customers' | 'expenses' | 'profile' | 'schedule' | 'backup'
  >('subscription');
  const [notice, setNotice] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Search/Filters in Admin
  const [productSearch, setProductSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // DELETE CONFIRMATION MODALS (Never blocked by browser popup blockers!)
  const [accountToDelete, setAccountToDelete] = useState<StoreAccount | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<StoreExpense | null>(null);

  // STAFF MODAL STATE (Create & Edit)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StoreAccount | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'STORE_ADMIN' | 'STORE_STAFF'>('STORE_STAFF');
  const [staffPermissions, setStaffPermissions] = useState<StaffPermission[]>([
    'pos_billing',
    'customer_manage',
    'invoice_print',
  ]);

  // Subscription Plan & Staff Limit State
  const [planTier, setPlanTier] = useState<string>('Starter');
  const [staffLimit, setStaffLimit] = useState<number>(1);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradePlanObj, setUpgradePlanObj] = useState<PricingPlan | null>(null);

  // SUPPLIER MODAL STATE (Create & Edit)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supPerson, setSupPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supTerms, setSupTerms] = useState<'NET_15' | 'NET_30' | 'COD'>('NET_30');

  // PRODUCT MODAL STATE (Create & Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Snacks');
  const [prodCost, setProdCost] = useState(15);
  const [prodMrp, setProdMrp] = useState(30);
  const [prodPrice, setProdPrice] = useState(25);
  const [prodTax, setProdTax] = useState(5);
  const [prodStock, setProdStock] = useState(30);
  const [prodLowThreshold, setProdLowThreshold] = useState(10);
  const [prodImage, setProdImage] = useState('');

  // CUSTOMER MODAL STATE (Create & Edit)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState(5000);
  const [custAddress, setCustAddress] = useState('');

  // EXPENSE MODAL STATE (Create & Edit)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<StoreExpense | null>(null);
  const [expCategory, setExpCategory] = useState<StoreExpense['category']>('TEA_SNACKS');
  const [expAmount, setExpAmount] = useState<number>(50);
  const [expNotes, setExpNotes] = useState('');

  // PROFILE EDIT STATE
  const [profileName, setProfileName] = useState('');
  const [profileCategory, setProfileCategory] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  const loadData = async () => {
    try {
      let b = await db.brands.where('brandId').equals(storeSlug).first();
      if (!b) b = await db.brands.where('username').equals(storeSlug).first();
      if (!b) b = await db.brands.where('brandId').equals('oursell').first();

      setStore(b || null);
      if (b) {
        setProfileName(b.brandName);
        setProfileCategory(b.businessCategory);
        setProfilePhone(b.phone);
        setProfileEmail(b.email);
      }

      const targetId = b?.brandId || storeSlug;

      // Synchronize staff accounts and staff users between tables
      await syncStaffBetweenTables(targetId);

      const [allAccs, supList, prodList, custList, expList, status] = await Promise.all([
        db.accounts.toArray(),
        db.suppliers.toArray(),
        db.products.toArray(),
        db.customers.toArray(),
        db.store_expenses.reverse().sortBy('createdAt'),
        getStoreSyncStatus(targetId).catch(() => null),
      ]);

      const accList = allAccs.filter(
        (a) =>
          a.storeId === targetId ||
          a.storeId === storeSlug ||
          (b?.brandId && a.storeId === b.brandId) ||
          (b?.username && a.storeId === b.username) ||
          a.storeId === 'oursell'
      );

      setAccounts(accList);
      setSuppliers(supList);
      setProducts(prodList);
      setCustomers(custList);
      setExpenses(expList);
      setSyncStatus(status);

      // Resolve store subscription & staff limits
      let currentTier = b?.planTier || 'Starter';
      let currentLimit = currentTier === 'Enterprise' ? 5 : currentTier === 'Professional' ? 3 : 1;

      const sub = await db.store_subscriptions.where('storeId').equals(targetId).first().catch(() => null);
      if (sub) {
        currentTier = sub.plan || currentTier;
        currentLimit = sub.staffLimit || (currentTier === 'Enterprise' ? 5 : currentTier === 'Professional' ? 3 : 1);
      }

      try {
        const fallbackSlug = b?.username || storeSlug;
        const res = await fetch(`/api/store/staff?storeId=${encodeURIComponent(targetId)}&storeSlug=${encodeURIComponent(fallbackSlug)}`);
        const data = await res.json();
        if (data.success) {
          currentTier = data.planTier || currentTier;
          currentLimit = data.staffLimit || currentLimit;
        }
      } catch {}

      setPlanTier(currentTier);
      setStaffLimit(currentLimit);
    } catch (e) {
      console.warn('Error loading admin store data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeSlug]);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const targetId = store?.brandId || storeSlug;
    const res = await syncPendingTransactions(targetId);
    showNotification(res.message);
    setIsSyncing(false);
    const status = await getStoreSyncStatus(targetId);
    setSyncStatus(status);
  };

  const handlePullCloud = async () => {
    setIsSyncing(true);
    const targetId = store?.brandId || storeSlug;
    const res = await pullStoreFromCloud(targetId);
    showNotification(res.message);
    await loadData();
    setIsSyncing(false);
  };

  const handleExportBackup = async () => {
    const targetId = store?.brandId || storeSlug;
    const backupJson = await exportStoreBackup(targetId);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oursell_backup_${targetId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Encrypted store snapshot exported successfully.');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const targetId = store?.brandId || storeSlug;
      const res = await importStoreBackup(text, targetId);
      showNotification(res.message);
      if (res.success) {
        loadData();
      }
    };
    reader.readAsText(file);
  };

  // ==================== STAFF MANAGEMENT HANDLERS ====================
  const handleOpenUpgradeModal = () => {
    if (planTier.toLowerCase().includes('enterprise')) return;
    const nextPlan = planTier.toLowerCase().includes('starter')
      ? {
          id: 'professional',
          name: 'Professional',
          badge: 'MOST POPULAR',
          description: 'Ideal for supermarkets, restaurants and multi-counter outlets.',
          monthlyPrice: 799,
          annualPrice: 7990,
          staffLimit: 3,
          outletLimit: 3,
          terminalLimit: 6,
          productLimit: null,
          features: ['Up to 3 Staff Accounts', 'Up to 3 Store Outlets', '6 POS Terminals'],
          isActive: true,
          sortOrder: 2,
        }
      : {
          id: 'enterprise',
          name: 'Multi-Chain Enterprise',
          description: 'For retail chains, franchises and regional networks.',
          monthlyPrice: 3299,
          annualPrice: 32990,
          staffLimit: 5,
          outletLimit: null,
          terminalLimit: null,
          productLimit: null,
          features: ['Up to 5 Staff Accounts', 'Unlimited Store Outlets', 'Unlimited POS Terminals'],
          isActive: true,
          sortOrder: 3,
        };

    setUpgradePlanObj(nextPlan);
    setIsUpgradeModalOpen(true);
  };

  const handleOpenAddStaff = () => {
    const activeStaffCount = accounts.filter((a) => a.isActive).length;
    if (activeStaffCount >= staffLimit) {
      alert(`Your staff limit has been reached (${activeStaffCount}/${staffLimit}). Please upgrade your plan to add more staff accounts.`);
      return;
    }

    setEditingAccount(null);
    setStaffName('');
    setStaffUsername('');
    setStaffPassword('');
    setStaffRole('STORE_STAFF');
    setStaffPermissions(['pos_billing', 'customer_manage', 'invoice_print']);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (acc: StoreAccount) => {
    setEditingAccount(acc);
    setStaffName(acc.name);
    setStaffUsername(acc.username);
    setStaffPassword(acc.passwordHash);
    setStaffRole(acc.role);
    setStaffPermissions(acc.permissions || ['pos_billing', 'customer_manage', 'invoice_print']);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffUsername || !staffPassword) {
      alert('Please fill out all fields.');
      return;
    }

    const targetStoreId = store?.brandId || storeSlug;

    if (editingAccount) {
      const updated: StoreAccount = {
        ...editingAccount,
        name: staffName.trim(),
        username: staffUsername.trim().toLowerCase(),
        passwordHash: staffPassword.trim(),
        role: staffRole,
        permissions: staffRole === 'STORE_ADMIN' ? ['all'] : staffPermissions,
        pin: staffPassword.trim().slice(-4),
      };

      await db.accounts.put(updated);
      await updateUnifiedStaff(updated.id, {
        name: updated.name,
        username: updated.username,
        password: updated.passwordHash,
        pin: updated.pin,
        role: updated.role,
        permissions: updated.permissions,
      });
      setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      showNotification(`Staff account ${staffUsername} updated.`);
    } else {
      const activeStaffCount = accounts.filter((a) => a.isActive).length;
      if (activeStaffCount >= staffLimit) {
        alert(`Your staff limit has been reached (${activeStaffCount}/${staffLimit}). Upgrade your plan to add more staff.`);
        return;
      }

      // Save simultaneously across db.accounts AND db.staff_users!
      const { account } = await saveUnifiedStaff({
        storeId: targetStoreId,
        name: staffName.trim(),
        username: staffUsername.trim().toLowerCase(),
        password: staffPassword.trim(),
        pin: staffPassword.trim().slice(-4),
        role: staffRole,
        permissions: staffRole === 'STORE_ADMIN' ? ['all'] : staffPermissions,
        isActive: true,
      });

      setAccounts((prev) => [account, ...prev]);
      showNotification(`Staff account ${account.username} created.`);
    }

    setIsStaffModalOpen(false);
  };

  const handleToggleActive = async (accId: string, currentStatus: boolean) => {
    await toggleActiveUnifiedStaff(accId, !currentStatus);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accId ? { ...a, isActive: !currentStatus } : a))
    );
    showNotification(`Account status updated to ${!currentStatus ? 'ACTIVE' : 'DISABLED'}.`);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!accountToDelete) return;
    const accId = accountToDelete.id;
    const accUser = accountToDelete.username;

    await deleteUnifiedStaff(accId);
    setAccounts((prev) => prev.filter((a) => a.id !== accId));
    setAccountToDelete(null);
    showNotification(`Staff account "${accUser}" removed.`);
  };

  // ==================== SUPPLIER MANAGEMENT HANDLERS ====================
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupName('');
    setSupPerson('');
    setSupPhone('');
    setSupEmail('');
    setSupGstin('');
    setSupAddress('');
    setSupTerms('NET_30');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupPerson(sup.contactPerson || '');
    setSupPhone(sup.phone || '');
    setSupEmail(sup.email || '');
    setSupGstin(sup.gstin || '');
    setSupAddress(sup.address || '');
    setSupTerms(sup.paymentTerms || 'NET_30');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert('Please enter supplier company name.');
      return;
    }

    const targetStoreId = store?.brandId || storeSlug;

    if (editingSupplier) {
      const updated: Supplier = {
        ...editingSupplier,
        name: supName.trim(),
        contactPerson: supPerson.trim(),
        phone: supPhone.trim(),
        email: supEmail.trim() || undefined,
        gstin: supGstin.trim() || undefined,
        address: supAddress.trim() || undefined,
        paymentTerms: supTerms,
      };
      await db.suppliers.put(updated);
      setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showNotification(`Supplier "${supName.trim()}" updated.`);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        brandId: targetStoreId,
        name: supName.trim(),
        contactPerson: supPerson.trim(),
        phone: supPhone.trim(),
        email: supEmail.trim() || undefined,
        gstin: supGstin.trim() || undefined,
        address: supAddress.trim() || undefined,
        paymentTerms: supTerms,
      };
      await db.suppliers.put(newSup);
      setSuppliers((prev) => [newSup, ...prev]);
      showNotification(`Supplier "${newSup.name}" created.`);
    }

    setIsSupplierModalOpen(false);
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    const supId = supplierToDelete.id;
    const name = supplierToDelete.name;

    await db.suppliers.delete(supId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supId));
    setSupplierToDelete(null);
    showNotification(`Supplier "${name}" deleted.`);
  };

  // ==================== PRODUCT MANAGEMENT HANDLERS ====================
  const generateBarcode = () => {
    setProdBarcode(generateCompliantBarcode('EAN13'));
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdTitle('');
    generateBarcode();
    setProdSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setProdCategory('Snacks');
    setProdCost(15);
    setProdMrp(30);
    setProdPrice(25);
    setProdTax(5);
    setProdStock(30);
    setProdLowThreshold(10);
    setProdImage('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdBarcode(p.barcode);
    setProdSku(p.sku);
    setProdCategory(p.category);
    setProdCost(p.costPrice);
    setProdMrp(p.mrp);
    setProdPrice(p.sellingPrice);
    setProdTax(p.taxRate);
    setProdStock(p.stock);
    setProdLowThreshold(p.lowStockThreshold);
    setProdImage(p.image || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodBarcode.trim()) {
      alert('Please enter product title and barcode.');
      return;
    }

    const targetStoreId = store?.brandId || storeSlug;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        title: prodTitle.trim(),
        barcode: prodBarcode.trim(),
        sku: prodSku.trim(),
        category: prodCategory,
        costPrice: Number(prodCost),
        mrp: Number(prodMrp),
        sellingPrice: Number(prodPrice),
        taxRate: Number(prodTax),
        stock: Number(prodStock),
        lowStockThreshold: Number(prodLowThreshold),
        image: prodImage.trim() || undefined,
      };
      await db.products.put(updated);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showNotification(`Product "${prodTitle.trim()}" updated.`);
    } else {
      const newP: Product = {
        id: `prod-${Date.now()}`,
        brandId: targetStoreId,
        barcode: prodBarcode.trim(),
        sku: prodSku.trim(),
        title: prodTitle.trim(),
        brand: store?.brandName || 'Store Brand',
        category: prodCategory,
        unit: 'Pcs',
        costPrice: Number(prodCost),
        mrp: Number(prodMrp),
        sellingPrice: Number(prodPrice),
        taxRate: Number(prodTax),
        stock: Number(prodStock),
        lowStockThreshold: Number(prodLowThreshold),
        image: prodImage.trim() || undefined,
        isActive: true,
      };
      await db.products.put(newP);
      setProducts((prev) => [newP, ...prev]);
      showNotification(`Product "${newP.title}" created.`);
    }

    setIsProductModalOpen(false);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const id = productToDelete.id;
    const title = productToDelete.title;

    await db.products.delete(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setProductToDelete(null);
    showNotification(`Product "${title}" deleted.`);
  };

  // ==================== CUSTOMER MANAGEMENT HANDLERS ====================
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustCreditLimit(5000);
    setCustAddress('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustEmail(c.email || '');
    setCustCreditLimit(c.creditLimit);
    setCustAddress(c.address || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('Please enter customer name and phone.');
      return;
    }

    const targetStoreId = store?.brandId || storeSlug;

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
        creditLimit: Number(custCreditLimit) || 5000,
        address: custAddress.trim() || undefined,
      };
      await db.customers.put(updated);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showNotification(`Customer "${updated.name}" updated.`);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        brandId: targetStoreId,
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
        loyaltyPoints: 0,
        storeCreditBalance: 0,
        creditLimit: Number(custCreditLimit) || 5000,
        address: custAddress.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await db.customers.put(newCust);
      setCustomers((prev) => [newCust, ...prev]);
      showNotification(`Customer "${newCust.name}" created.`);
    }

    setIsCustomerModalOpen(false);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const id = customerToDelete.id;
    const name = customerToDelete.name;

    await db.customers.delete(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setCustomerToDelete(null);
    showNotification(`Customer "${name}" removed.`);
  };

  // ==================== EXPENSE MANAGEMENT HANDLERS ====================
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setExpCategory('TEA_SNACKS');
    setExpAmount(50);
    setExpNotes('');
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: StoreExpense) => {
    setEditingExpense(exp);
    setExpCategory(exp.category);
    setExpAmount(exp.amount);
    setExpNotes(exp.notes);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0) return;

    const targetStoreId = store?.brandId || storeSlug;

    if (editingExpense) {
      const updated: StoreExpense = {
        ...editingExpense,
        category: expCategory,
        amount: Number(expAmount),
        notes: expNotes.trim() || 'Store petty expense',
      };
      await db.store_expenses.put(updated);
      setExpenses((prev) => prev.map((exp) => (exp.id === updated.id ? updated : exp)));
      showNotification(`Expense record updated.`);
    } else {
      const newExp: StoreExpense = {
        id: `exp-${Date.now()}`,
        brandId: targetStoreId,
        category: expCategory,
        amount: Number(expAmount),
        notes: expNotes.trim() || 'Store petty expense',
        paidByCashier: currentAccount?.name || 'Store Administrator',
        createdAt: new Date().toISOString(),
      };
      await db.store_expenses.put(newExp);
      setExpenses((prev) => [newExp, ...prev]);
      showNotification(`Expense of ₹${newExp.amount.toFixed(2)} recorded.`);
    }

    setIsExpenseModalOpen(false);
  };

  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    const id = expenseToDelete.id;

    await db.store_expenses.delete(id);
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    setExpenseToDelete(null);
    showNotification(`Expense record deleted.`);
  };

  // ==================== PROFILE HANDLER ====================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    await db.brands.update(store.id, {
      brandName: profileName,
      businessCategory: profileCategory as any,
      phone: profilePhone,
      email: profileEmail,
    });

    showNotification('Store profile updated successfully.');
    loadData();
  };

  // Filtered lists
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.phone.includes(supplierSearch)
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  // 1. ACCESS CONTROL GUARD: If user is in staff mode or not an admin, deny access to admin console
  if (isStaff || !isAdmin || currentRole === 'STORE_STAFF') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 font-sans select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Admin Authentication Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You are logged in with <strong className="text-slate-800">Store Staff permissions</strong>. Store administration and catalog management are restricted to Store Administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/pos/register"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl block transition"
            >
              Return to POS Register &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans select-none flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/shop/${storeSlug}`}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition border border-slate-200"
            title="Back to Store Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-900">
                {store?.brandName || 'Oursell Demo Store'} • Admin Console
              </h1>
              <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                STORE_ADMIN
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Store ID: <strong className="text-slate-700">{store?.brandId || storeSlug}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pos/register"
            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS</span>
          </Link>
        </div>
      </header>

      {/* Notification Toast */}
      {notice && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-6 py-2.5 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation Tabs (EVERY STORE MODULE ACCESSIBLE TO ADMIN!) */}
        <div className="flex border-b border-slate-200 pb-2 gap-2 text-xs font-semibold overflow-x-auto">
          {/* TAB: Subscription & Plan */}
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-400" />
            <span>Subscription & Plan</span>
            <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-bold uppercase">
              {planTier}
            </span>
          </button>

          {/* TAB: Staff */}
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Accounts</span>
            <span className="text-[10px] opacity-80">({accounts.length})</span>
          </button>

          {/* TAB: Store Outlets */}
          <button
            onClick={() => setActiveTab('outlets')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'outlets'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Store Outlets</span>
          </button>

          {/* TAB: POS Terminals */}
          <button
            onClick={() => setActiveTab('terminals')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'terminals'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>POS Terminals</span>
          </button>

          {/* TAB: Enterprise Suite */}
          <button
            onClick={() => setActiveTab('enterprise')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'enterprise'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Enterprise Suite</span>
          </button>

          {/* TAB: Suppliers */}
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'suppliers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Suppliers</span>
            <span className="text-[10px] opacity-80">({suppliers.length})</span>
          </button>

          {/* TAB: Products */}
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
            <span className="text-[10px] opacity-80">({products.length})</span>
          </button>

          {/* TAB: Customers */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'customers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers & Khata</span>
            <span className="text-[10px] opacity-80">({customers.length})</span>
          </button>

          {/* TAB: Expenses */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Store Expenses</span>
            <span className="text-[10px] opacity-80">({expenses.length})</span>
          </button>

          {/* TAB: Profile */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Profile</span>
          </button>

          {/* TAB: Operating Hours */}
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Operating Hours</span>
          </button>

          {/* TAB: Backup */}
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud & Backups</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 0: SUBSCRIPTION & PLAN                               */}
        {/* ======================================================== */}
        {activeTab === 'subscription' && <StoreSubscriptionSection storeSlug={storeSlug} />}

        {/* ======================================================== */}
        {/* TAB: OUTLETS MANAGEMENT                                 */}
        {/* ======================================================== */}
        {activeTab === 'outlets' && <StoreOutletsSection storeSlug={storeSlug} />}

        {/* ======================================================== */}
        {/* TAB: POS TERMINALS MANAGEMENT                            */}
        {/* ======================================================== */}
        {activeTab === 'terminals' && <StoreTerminalsSection storeSlug={storeSlug} />}

        {/* ======================================================== */}
        {/* TAB: ENTERPRISE FLEET & ARCHITECTURE SUITE              */}
        {/* ======================================================== */}
        {activeTab === 'enterprise' && <StoreEnterpriseSection storeSlug={storeSlug} />}

        {/* ======================================================== */}
        {/* TAB 1: STAFF MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'staff' && (() => {
          const activeStaffCount = accounts.filter((a) => a.isActive).length;
          const isStaffLimitReached = activeStaffCount >= staffLimit;
          const staffUsagePercentage = Math.min(100, Math.round((activeStaffCount / staffLimit) * 100));

          return (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Store Staff Accounts</h3>
                    <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded uppercase">
                      {planTier} Plan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Full administrative authority: Create, edit, toggle active status, and manage cashier permissions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddStaff}
                    disabled={isStaffLimitReached}
                    title={isStaffLimitReached ? 'Your staff limit has been reached. Upgrade to add more staff.' : 'Create Staff Account'}
                    className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs ${
                      isStaffLimitReached
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Create Staff Account</span>
                  </button>
                </div>
              </div>

              {/* STAFF USAGE & CAPACITY PROGRESS INDICATOR */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isStaffLimitReached ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Staff Usage: <strong className={isStaffLimitReached ? 'text-rose-600' : 'text-teal-700'}>{activeStaffCount}/{staffLimit} Staff</strong>
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          ({planTier} Plan)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {isStaffLimitReached
                          ? planTier.toLowerCase().includes('enterprise')
                            ? 'Maximum enterprise staff limit reached (5 accounts).'
                            : 'Your staff limit has been reached. Contact us or upgrade to add more staff accounts.'
                          : `${staffLimit - activeStaffCount} additional staff account(s) available on your active plan.`}
                      </span>
                    </div>
                  </div>

                  {isStaffLimitReached && !planTier.toLowerCase().includes('enterprise') && (
                    <button
                      onClick={handleOpenUpgradeModal}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Contact Us to Upgrade</span>
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isStaffLimitReached
                        ? 'bg-rose-500'
                        : staffUsagePercentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-teal-600'
                    }`}
                    style={{ width: `${staffUsagePercentage}%` }}
                  />
                </div>
              </div>

              {/* Limit Reached Warning Alert */}
              {isStaffLimitReached && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-rose-950">Your staff limit has been reached.</h4>
                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      Your store is currently on the <strong>{planTier} Plan</strong>, which allows a maximum of <strong>{staffLimit} staff account(s)</strong>.
                      {!planTier.toLowerCase().includes('enterprise') && ' To add more staff accounts, please request an upgrade.'}
                    </p>
                    {!planTier.toLowerCase().includes('enterprise') && (
                      <div className="pt-1">
                        <button
                          onClick={handleOpenUpgradeModal}
                          className="text-xs font-bold text-teal-800 underline hover:text-teal-950 cursor-pointer"
                        >
                          Contact Us to Request an Upgrade →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Staff Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Staff Name / User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Permissions</th>
                    <th className="p-4">Terminal PIN</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{acc.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {acc.username}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            acc.role === 'STORE_ADMIN'
                              ? 'bg-slate-900 text-white'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {acc.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {acc.permissions?.includes('all') ? (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              Full Administrative Access
                            </span>
                          ) : (
                            acc.permissions?.map((p) => (
                              <span
                                key={p}
                                className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono"
                              >
                                {p.replace('_', ' ')}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {acc.pin ? `PIN: ${acc.pin}` : '••••'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            acc.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {acc.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditStaff(acc)}
                          className="px-2.5 py-1 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg text-[11px] font-semibold transition border border-slate-200"
                          title="Edit Staff Account"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(acc.id, acc.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                            acc.isActive
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {acc.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => setAccountToDelete(acc)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* ======================================================== */}
        {/* TAB 2: SUPPLIERS MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Suppliers & Vendor Management</h3>
                <p className="text-xs text-slate-500">
                  Admin control: Add new supplier companies, edit payment terms and contact details, or remove inactive suppliers.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  onClick={handleOpenAddSupplier}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Supplier</span>
                </button>
              </div>
            </div>

            {/* Supplier Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{sup.name}</h4>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded inline-block mt-1">
                        Terms: {sup.paymentTerms}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSupplier(sup)}
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(sup)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Supplier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sup.phone}</span>
                      {sup.contactPerson && (
                        <span className="text-slate-400">({sup.contactPerson})</span>
                      )}
                    </p>
                    {sup.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.email}</span>
                      </p>
                    )}
                    {sup.address && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sup.address}</span>
                      </p>
                    )}
                    {sup.gstin && (
                      <p className="font-mono text-[10px] text-slate-400 pt-1">
                        GSTIN: <span className="font-bold text-slate-700">{sup.gstin}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PRODUCT CATALOG */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Product Catalog Management</h3>
                <p className="text-xs text-slate-500">
                  Admin control: Add new products, update selling prices and MRPs, alter GST rates, and delete catalog items.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, SKU, barcode..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Product</span>
                </button>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Barcode</th>
                    <th className="p-4">Cost Price</th>
                    <th className="p-4">MRP</th>
                    <th className="p-4">Selling Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            {p.image && (
                              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{p.category}</td>
                      <td className="p-4 font-mono font-semibold text-slate-700">{p.barcode}</td>
                      <td className="p-4 font-mono text-slate-500">₹{p.costPrice.toFixed(2)}</td>
                      <td className="p-4 font-mono text-slate-500 line-through">₹{p.mrp.toFixed(2)}</td>
                      <td className="p-4 font-mono font-extrabold text-slate-900">
                        ₹{p.sellingPrice.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            p.stock <= p.lowStockThreshold
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CUSTOMERS & KHATA */}
        {/* ======================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Customers & Khata Ledger</h3>
                <p className="text-xs text-slate-500">
                  Admin control: Add new customer accounts, update contact information & credit limits, or remove customer records.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <button
                  onClick={handleOpenAddCustomer}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Customer</span>
                </button>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Credit Limit</th>
                    <th className="p-4">Outstanding Khata</th>
                    <th className="p-4">Loyalty Points</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-900">
                        {c.name}
                        {c.email && <span className="block text-[11px] text-slate-400 font-normal">{c.email}</span>}
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-700">{c.phone}</td>
                      <td className="p-4 font-mono text-slate-600">₹{c.creditLimit.toFixed(2)}</td>
                      <td className="p-4 font-mono font-extrabold text-amber-700">
                        ₹{c.storeCreditBalance.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {c.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(c)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: STORE EXPENSES */}
        {/* ======================================================== */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Petty Cash & Store Operational Expenses</h3>
                <p className="text-xs text-slate-500">
                  Admin control: Review, add, edit descriptions/amounts, or remove expense records.
                </p>
              </div>
              <button
                onClick={handleOpenAddExpense}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Log Expense</span>
              </button>
            </div>

            {/* Expenses Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Category</th>
                    <th className="p-4">Description / Notes</th>
                    <th className="p-4">Paid By</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-800">{exp.category.replace('_', ' ')}</td>
                      <td className="p-4 text-slate-600">{exp.notes}</td>
                      <td className="p-4 font-medium text-slate-700">{exp.paidByCashier}</td>
                      <td className="p-4 font-mono text-slate-500 text-[11px]">
                        {new Date(exp.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-mono font-extrabold text-slate-900">
                        ₹{exp.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(exp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: STORE PROFILE & TAX SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl space-y-6">
            <div>
              <h3 className="font-bold text-base text-slate-900">Store Profile & Settings</h3>
              <p className="text-xs text-slate-500">
                Update store branding, contact details, and tax rate defaults.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} autoComplete="off" className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
                  <input
                    type="text"
                    value={profileCategory}
                    onChange={(e) => setProfileCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: OPERATING HOURS & LOCATION */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Physical Store Location</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Main Street, Central Commercial District, Ground Floor Retail Arcade.
              </p>
              <div className="pt-2 font-mono text-xs text-slate-700 flex items-center justify-between">
                <span>Contact: <strong>+91 81290 31950</strong></span>
                <a
                  href="tel:+918129031950"
                  className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition"
                >
                  Call Store
                </a>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Active Weekly Hours</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs font-mono">
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Mon - Thu</span>
                  <span className="font-bold text-slate-900">08:00 AM - 10:00 PM</span>
                </div>
                <div className="py-2 flex justify-between text-teal-700 font-bold bg-teal-50 px-2 rounded">
                  <span>Friday (Today)</span>
                  <span>08:00 AM - 10:00 PM</span>
                </div>
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Sat - Sun</span>
                  <span className="font-bold text-slate-900">08:30 AM - 10:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: CLOUD SYNC & BACKUPS */}
        {/* ======================================================== */}
        {activeTab === 'backup' && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Cloud className="w-5 h-5 text-teal-600" />
                  <span>Cloud Synchronization & Offline Queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePullCloud}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pull Catalog</span>
                  </button>
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Pending Sync</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {syncStatus?.pendingOrdersCount ?? 0} transactions
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Cloud Connection</span>
                  <span className={`text-base font-extrabold ${syncStatus?.isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {syncStatus?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Last Sync</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    {syncStatus?.lastSyncAt
                      ? new Date(syncStatus.lastSyncAt).toLocaleTimeString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold pb-3 border-b border-slate-100">
                <Database className="w-5 h-5 text-teal-600" />
                <span>Store Database Snapshot (Offline Backup)</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download an encrypted JSON file containing all products, suppliers, staff records, orders, and customer credit ledger for this store.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Store Snapshot</span>
                </button>

                <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-200">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: STAFF ACCOUNT (Create & Edit)                     */}
      {/* ======================================================== */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingAccount ? 'Edit Staff Account' : 'Create Staff Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} autoComplete="off" className="space-y-3.5 text-xs">
              {/* Anti-autofill decoy inputs */}
              <input type="text" name="anti_autofill_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="anti_autofill_pwd" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="staff_member_full_name"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username / Login ID</label>
                <input
                  type="text"
                  name="staff_member_login_id"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  placeholder="e.g. rahul@staff"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                <input
                  type="password"
                  name="staff_member_secret_pin"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-semibold"
                >
                  <option value="STORE_STAFF">STORE_STAFF (Cashier / Operational Duties)</option>
                  <option value="STORE_ADMIN">STORE_ADMIN (Full Administrative Rights)</option>
                </select>
              </div>

              {/* Permissions Checklist (if staff) */}
              {staffRole === 'STORE_STAFF' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Authorized Operations:
                  </span>
                  {[
                    { key: 'pos_billing', label: 'POS Billing & Checkout' },
                    { key: 'customer_manage', label: 'Customer Loyalty & Khata Collection' },
                    { key: 'invoice_print', label: 'Reprint Customer Receipts' },
                    { key: 'inventory_view', label: 'View Stock Catalog & Pricing' },
                    { key: 'discount_approve', label: 'Apply Manual Discounts' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700">
                      <input
                        type="checkbox"
                        checked={staffPermissions.includes(perm.key as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffPermissions([...staffPermissions, perm.key as any]);
                          } else {
                            setStaffPermissions(staffPermissions.filter((p) => p !== perm.key));
                          }
                        }}
                        className="rounded text-teal-600"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingAccount ? 'Save Changes' : 'Save & Activate Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUPPLIER (Create & Edit)                          */}
      {/* ======================================================== */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} autoComplete="off" className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Wholesale Foods"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={supPerson}
                    onChange={(e) => setSupPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="NET_15">NET 15 Days</option>
                    <option value="NET_30">NET 30 Days</option>
                    <option value="COD">Cash On Delivery (COD)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={supGstin}
                    onChange={(e) => setSupGstin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Office / Warehouse Address</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingSupplier ? 'Save Supplier Details' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PRODUCT (Create & Edit)                           */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingProduct ? 'Edit Product & Pricing' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} autoComplete="off" className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Potato Chips 50g"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-semibold text-slate-700">Barcode *</label>
                    <button
                      type="button"
                      onClick={generateBarcode}
                      className="text-[10px] font-bold text-teal-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    {['Snacks', 'Beverages', 'Dairy', 'Bakery', 'Apparel', 'Restaurant', 'General'].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GST Tax Rate (%)</label>
                  <select
                    value={prodTax}
                    onChange={(e) => setProdTax(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value={0}>0% (Tax Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodCost}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodMrp}
                    onChange={(e) => setProdMrp(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-teal-800 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border-2 border-teal-500 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={prodLowThreshold}
                    onChange={(e) => setProdLowThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <ImageFileInput
                value={prodImage}
                onChange={setProdImage}
                label="Product Image (Upload from Files or Link)"
              />

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CUSTOMER (Create & Edit)                          */}
      {/* ======================================================== */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} autoComplete="off" className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kumar"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98..."
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={custCreditLimit}
                  onChange={(e) => setCustCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Note</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EXPENSE (Create & Edit)                           */}
      {/* ======================================================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingExpense ? 'Edit Store Expense' : 'Log Store Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} autoComplete="off" className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="TEA_SNACKS">Tea & Snacks</option>
                  <option value="CLEANING">Cleaning & Sanitization</option>
                  <option value="REPAIRS">Maintenance & Repairs</option>
                  <option value="COURIER">Courier & Logistics</option>
                  <option value="UTILITIES">Electricity / Water / Internet</option>
                  <option value="OTHER">Other Operational Cost</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Evening staff refreshments"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingExpense ? 'Save Changes' : 'Confirm Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOGS                              */}
      {/* ======================================================== */}
      {/* Delete Account Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Remove Staff Account?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently remove staff account <strong className="text-slate-800">&quot;{accountToDelete.username}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Supplier Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Supplier?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete supplier <strong className="text-slate-800">&quot;{supplierToDelete.name}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSupplier}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete product <strong className="text-slate-800">&quot;{productToDelete.title}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Customer?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove customer <strong className="text-slate-800">&quot;{customerToDelete.name}&quot;</strong>?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">Delete Expense?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove expense of <strong className="text-slate-800">₹{expenseToDelete.amount.toFixed(2)}</strong> ({expenseToDelete.notes})?
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExpense}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN UPGRADE CONTACT MODAL */}
      <PlanContactModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        plan={upgradePlanObj}
        billingCycle="MONTHLY"
        displayPrice={upgradePlanObj ? upgradePlanObj.monthlyPrice : 799}
      />
    </div>
  );
}
