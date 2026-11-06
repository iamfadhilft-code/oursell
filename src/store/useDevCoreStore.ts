import { create } from 'zustand';
import { BrandApplication, Brand } from '@/types/pos';
import { db } from '@/db/posDb';

interface DevCoreState {
  isAuthenticated: boolean;
  adminUsername: string;
  applications: BrandApplication[];
  brands: Brand[];
  isLoading: boolean;

  login: (user: string, pass: string) => boolean;
  logout: () => void;
  loadData: () => Promise<void>;
  acceptApplication: (appId: string) => Promise<{ success: boolean; brandId?: string }>;
  rejectApplication: (appId: string, reason?: string) => Promise<boolean>;
  toggleBrandStatus: (brandId: string) => Promise<boolean>;
}

export const useDevCoreStore = create<DevCoreState>((set, get) => ({
  isAuthenticated: false,
  adminUsername: 'ourselldev',
  applications: [],
  brands: [],
  isLoading: false,

  login: (user: string, pass: string) => {
    const trimmed = user.trim().toLowerCase();
    if (
      (trimmed === 'ourselldev' && pass === 'oursell@6001') ||
      (trimmed === 'devcore' && pass === 'devcore@admin2026')
    ) {
      set({ isAuthenticated: true, adminUsername: 'ourselldev' });
      get().loadData();
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false }),

  loadData: async () => {
    set({ isLoading: true });
    try {
      const apps = await db.brand_applications.toArray();
      const brands = await db.brands.toArray();
      set({ applications: apps, brands: brands, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  acceptApplication: async (appId: string) => {
    const app = await db.brand_applications.get(appId);
    if (!app) return { success: false };

    // Generate unique brand ID: BRD-XXXX
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newBrandId = `BRD-${randomDigits}`;

    const newBrand: Brand = {
      id: `brand-${Date.now()}`,
      brandId: newBrandId,
      brandName: app.brandName,
      businessCategory: app.businessCategory,
      ownerName: app.ownerName,
      email: app.email,
      phone: app.phone,
      username: app.requestedUsername,
      passwordHash: app.passwordHash,
      status: 'ACTIVE',
      planTier: 'Starter',
      createdAt: new Date().toISOString(),
      outletCount: app.outletCount || 1,
      terminalCount: app.terminalCount || 1,
      currency: '₹',
      taxRateDefault: 5,
    };

    // 1. Insert into brands
    await db.brands.add(newBrand);

    // 2. Update application status
    await db.brand_applications.update(appId, { status: 'APPROVED' });

    // 3. Seed starter products for this new brand
    await db.products.bulkAdd([
      {
        id: `prod-${Date.now()}-1`,
        brandId: newBrandId,
        barcode: `890${randomDigits}0001`,
        sku: 'GEN-STARTER-1',
        title: `${app.brandName} Signature Item #1`,
        brand: app.brandName,
        category: 'General',
        unit: 'Pcs',
        costPrice: 50,
        mrp: 120,
        sellingPrice: 99,
        taxRate: 5,
        stock: 50,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
      {
        id: `prod-${Date.now()}-2`,
        brandId: newBrandId,
        barcode: `890${randomDigits}0002`,
        sku: 'GEN-STARTER-2',
        title: `${app.brandName} Special Pack`,
        brand: app.brandName,
        category: 'General',
        unit: 'Pcs',
        costPrice: 120,
        mrp: 250,
        sellingPrice: 199,
        taxRate: 5,
        stock: 35,
        lowStockThreshold: 10,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
        isActive: true,
      },
    ]);

    // Refresh state
    await get().loadData();
    return { success: true, brandId: newBrandId };
  },

  rejectApplication: async (appId: string, reason?: string) => {
    await db.brand_applications.update(appId, {
      status: 'REJECTED',
      rejectionReason: reason || 'Information verification failed',
    });
    await get().loadData();
    return true;
  },

  toggleBrandStatus: async (brandId: string) => {
    const brand = await db.brands.where('brandId').equals(brandId).first();
    if (!brand) return false;

    const newStatus = brand.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await db.brands.update(brand.id, { status: newStatus });
    await get().loadData();
    return true;
  },
}));
