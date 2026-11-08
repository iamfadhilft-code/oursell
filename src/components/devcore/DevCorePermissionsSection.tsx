'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { DevCoreRole } from '@/types/devcore';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  Layers,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export function DevCorePermissionsSection() {
  const { roles, updateRolePermissions, createRole, deleteRole, theme } = useDevCoreStore();
  const isDark = theme === 'dark';

  const [selectedRole, setSelectedRole] = useState<DevCoreRole | null>(
    roles.length > 0 ? roles[0] : null
  );
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  const permissionDefinitions: Array<{
    id: string;
    label: string;
    category: string;
    description: string;
  }> = [
    {
      id: 'manage_stores',
      label: 'Manage Stores',
      category: 'Store Operations',
      description: 'Create, update store profiles and review onboarding applications.',
    },
    {
      id: 'suspend_stores',
      label: 'Suspend & Reactivate Stores',
      category: 'Store Operations',
      description: 'Lock terminal registers and suspend delinquent accounts.',
    },
    {
      id: 'view_inbox',
      label: 'View Support Inbox',
      category: 'Communications',
      description: 'Read store support inquiries and customer messages.',
    },
    {
      id: 'reply_inbox',
      label: 'Reply to Support Messages',
      category: 'Communications',
      description: 'Send official Dev Core replies and resolve tickets.',
    },
    {
      id: 'manage_users',
      label: 'Manage Admin Users',
      category: 'User Access',
      description: 'Create, edit, and deactivate administrative staff accounts.',
    },
    {
      id: 'manage_permissions',
      label: 'Manage Roles & RBAC',
      category: 'User Access',
      description: 'Define custom access roles and assign system permissions.',
    },
    {
      id: 'manage_subscriptions',
      label: 'Subscription & Billing',
      category: 'Financials',
      description: 'Upgrade, downgrade store SaaS tiers and adjust billing.',
    },
    {
      id: 'view_revenue',
      label: 'View GMV & Financials',
      category: 'Financials',
      description: 'Inspect platform gross merchandise value and revenue stats.',
    },
    {
      id: 'view_storage',
      label: 'View Storage Quotas',
      category: 'Storage & Backup',
      description: 'Inspect store disk utilization and database health.',
    },
    {
      id: 'adjust_quota',
      label: 'Modify Storage Quotas',
      category: 'Storage & Backup',
      description: 'Increase or decrease store disk allocations.',
    },
    {
      id: 'manage_system_settings',
      label: 'Platform Global Settings',
      category: 'System Config',
      description: 'Modify security policies, session timeout, and platform flags.',
    },
    {
      id: 'view_audit_logs',
      label: 'View Audit Logs',
      category: 'Compliance',
      description: 'Inspect comprehensive administrative audit trail.',
    },
  ];

  const currentRole =
    roles.find((r) => r.id === selectedRole?.id) || (roles.length > 0 ? roles[0] : null);

  const handleTogglePermission = async (role: DevCoreRole, permId: string) => {
    if (role.id === 'role-super-admin') return; // Super admin always possesses all permissions

    let nextPerms: string[];
    if (role.permissions.includes(permId)) {
      nextPerms = role.permissions.filter((p) => p !== permId);
    } else {
      nextPerms = [...role.permissions, permId];
    }

    await updateRolePermissions(role.id, nextPerms);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    await createRole(newRoleName.trim(), newRoleDesc.trim(), newRolePerms);
    setIsCreatingRole(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRolePerms([]);
  };

  const toggleNewRolePerm = (permId: string) => {
    if (newRolePerms.includes(permId)) {
      setNewRolePerms(newRolePerms.filter((p) => p !== permId));
    } else {
      setNewRolePerms([...newRolePerms, permId]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Create Role Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-slate-500">
            Configure platform authority tiers, toggle permissions, and enforce server-side security.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingRole(true)}
          className="px-5 py-2.5 bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-full transition shadow-sm flex items-center gap-2 cursor-pointer hover:opacity-90"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Custom Role</span>
        </button>
      </div>

      {/* Main Grid: Roles List (Left) & Permissions Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block px-1 text-left">
            CONFIGURED PLATFORM ROLES ({roles.length})
          </span>

          <div className="space-y-2.5">
            {roles.map((role) => {
              const isSelected = currentRole?.id === role.id;
              const isSuper = role.id === 'role-super-admin';

              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`p-5 rounded-[24px] border transition cursor-pointer text-left shadow-sm ${
                    isSelected
                      ? isDark
                        ? 'bg-[#16201E] border-emerald-500'
                        : 'bg-slate-50 border-slate-950 shadow-md'
                      : isDark
                      ? 'bg-[#111717] border-[#232D2B] hover:bg-[#141C1A]'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        className={`w-4 h-4 ${
                          isSuper ? 'text-emerald-500' : 'text-slate-700 dark:text-emerald-400'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{role.name}</h4>
                    </div>

                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                        role.isSystem
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {role.isSystem ? 'System Root' : 'Custom'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>
                      {role.permissions.length} granted privileges
                    </span>
                    {isSuper && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Immutable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Role Privileges Matrix (8 cols) */}
        <div className="lg:col-span-8">
          {currentRole ? (
            <div
              className={`p-6 sm:p-8 rounded-[28px] border transition shadow-sm text-left ${
                isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
              }`}
            >
              {/* Role Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                      ROLE PRIVILEGE MATRIX
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {currentRole.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{currentRole.description}</p>
                </div>

                {!currentRole.isSystem && (
                  <button
                    onClick={async () => {
                      if (confirm(`Delete custom role "${currentRole.name}"?`)) {
                        await deleteRole(currentRole.id);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Role</span>
                  </button>
                )}
              </div>

              {/* Notice for System Super Admin */}
              {currentRole.id === 'role-super-admin' && (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-3">
                  <Lock className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Super Admin role is permanent and holds all authority tokens by default. Permissions cannot be revoked.
                  </span>
                </div>
              )}

              {/* Permissions Checklist Grid */}
              <div className="mt-6 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  SYSTEM CAPABILITY TOKENS
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissionDefinitions.map((perm) => {
                    const isGranted =
                      currentRole.id === 'role-super-admin' ||
                      currentRole.permissions.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(currentRole, perm.id)}
                        className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                          currentRole.id === 'role-super-admin'
                            ? 'cursor-default opacity-90'
                            : 'cursor-pointer hover:border-slate-400'
                        } ${
                          isGranted
                            ? isDark
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-white'
                              : 'bg-emerald-50/50 border-emerald-200 text-slate-900'
                            : isDark
                            ? 'bg-[#141C1A] border-[#232D2B] text-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {perm.label}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-2 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {perm.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {perm.description}
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                            isGranted
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isGranted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold">Select a role to inspect permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CUSTOM ROLE MODAL */}
      {isCreatingRole && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-5 ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Create Custom Administrative Role</h3>
              <button
                onClick={() => setIsCreatingRole(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Regional Support Officer"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Scope of administrative duty..."
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                  Select Granted Privileges ({newRolePerms.length})
                </label>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {permissionDefinitions.map((p) => {
                    const isSelected = newRolePerms.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleNewRolePerm(p.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                        }`}
                      >
                        <span>{p.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingRole(false)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
