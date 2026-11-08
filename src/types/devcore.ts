export type DevCoreRoleName =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT_AGENT'
  | 'BILLING_MANAGER'
  | 'AUDITOR'
  | 'CUSTOM';

export interface DevCoreUser {
  id: string;
  name: string;
  username: string; // 'devcore'
  email: string;
  passwordHash: string; // Secure SHA-256 hash
  salt: string;
  role: DevCoreRoleName;
  permissions: string[];
  mustChangePassword?: boolean;
  isPermanent?: boolean; // Protected system root account (cannot delete/suspend)
  isActive: boolean;
  storeId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface DevCoreRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
  createdAt: string;
}

export interface SupportReply {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  storeId: string;
  storeName: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  replies: SupportReply[];
  createdAt: string;
  updatedAt: string;
}

export interface StoreSubscription {
  id: string;
  storeId: string;
  storeName: string;
  planId?: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  amount: number;
  annualPrice?: number;
  currency: string;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
  startDate: string;
  nextBillingDate: string;
  paymentMethod: string;
  autoRenew: boolean;
  staffLimit?: number;
  outletLimit?: number | null;
  terminalLimit?: number | null;
  productLimit?: number | null;
}

export interface StoreStorageQuota {
  id: string;
  storeId: string;
  storeName: string;
  storageUsedMb: number;
  storageLimitMb: number;
  productCount: number;
  ordersCount: number;
  barcodesCount: number;
  customersCount: number;
  lastBackupAt?: string;
  backupStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface PlatformSystemSetting {
  id: string;
  key: string;
  value: string;
  category: 'GENERAL' | 'SECURITY' | 'BILLING' | 'STORAGE' | 'MAINTENANCE';
  label: string;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DevCoreAuditLog {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  targetEntity?: string;
  targetId?: string;
  details: string;
  ipAddress: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export type DevCoreTab =
  | 'overview'
  | 'inbox'
  | 'active-accounts'
  | 'permissions'
  | 'user-management'
  | 'subscription-management'
  | 'storage-management'
  | 'activity-logs'
  | 'system-settings';
