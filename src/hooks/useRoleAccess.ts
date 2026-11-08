'use client';
import { useBrandAuthStore } from '@/store/useBrandAuthStore';
import { usePosStore } from '@/store/usePosStore';
import { StaffPermission } from '@/types/pos';

export function useRoleAccess() {
  const {
    isAuthenticated,
    currentRole,
    currentAccount,
    currentBrand,
    permissions = [],
    hasPermission,
    switchToRole,
  } = useBrandAuthStore();
  const { activeCashier, brandName, activeBrandId } = usePosStore();

  // A user is Admin ONLY if currentRole is STORE_ADMIN or SUPER_ADMIN, or activeCashier.role is ADMIN (and currentRole is not STORE_STAFF)
  const isExplicitAdmin = currentRole === 'STORE_ADMIN' || currentRole === 'SUPER_ADMIN';
  const isExplicitStaff = currentRole === 'STORE_STAFF';

  // Strict role evaluation: Default to Staff mode for security so staff cannot add or delete anything
  const isAdmin = isExplicitAdmin || (!isExplicitStaff && activeCashier.role === 'ADMIN');
  const isStaff = !isAdmin;

  const roleName = isAdmin ? 'Store Administrator' : 'Store Staff / Cashier';
  const roleBadge = isAdmin ? 'STORE_ADMIN' : 'STORE_STAFF';

  const checkPerm = (perm: StaffPermission): boolean => {
    if (isAdmin) return true;
    return false; // Staff cannot have permissions to add/delete master data
  };

  return {
    isAuthenticated,
    isAdmin,
    isStaff,
    currentRole: isAdmin ? 'STORE_ADMIN' : 'STORE_STAFF',
    roleName,
    roleBadge,
    currentAccount,
    currentBrand,
    activeCashier,
    brandName,
    activeBrandId,
    permissions,
    hasPermission: checkPerm,
    switchToRole,

    // Master entity permissions: Strictly restricted to Admin (Staff cannot add or delete anything)
    canManageSuppliers: isAdmin,
    canAddProduct: isAdmin,
    canEditProduct: isAdmin,
    canDeleteProduct: isAdmin,
    canAdjustStock: isAdmin,
    canManageStaff: isAdmin,
    canManageSettings: isAdmin,
    canManageCustomers: isAdmin,
    canAddCustomer: isAdmin,
    canDeleteCustomer: isAdmin,
    canManageExpenses: isAdmin,
    canAddExpense: isAdmin,
    canDeleteExpense: isAdmin,
    canDeleteOrders: false,
    canAddSuppliers: isAdmin,
    canDeleteSuppliers: isAdmin,
    canCreatePO: isAdmin,
    canDeletePO: isAdmin,

    // Operational staff duties ("staff can do works")
    canProcessSales: true, // Billing register, cart scanning, taking payments
    canOpenCloseShifts: true, // Opening float and cash drawer count
    canReceiveGoods: true, // Inward Goods Received Note (GRN)
    canCollectKhata: true, // Customer credit repayments
    canPrintBarcodes: true, // Printing thermal barcode labels
    canLookupInventory: true, // Checking price and stock in catalog
    canLookupCustomers: true, // Searching customers for Khata billing
  };
}
