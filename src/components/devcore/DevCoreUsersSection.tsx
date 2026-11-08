'use client';

import React, { useState } from 'react';
import { useDevCoreStore } from '@/store/useDevCoreStore';
import { DevCoreUser, DevCoreRoleName } from '@/types/devcore';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Lock,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  X,
  Search,
} from 'lucide-react';

export function DevCoreUsersSection() {
  const {
    users,
    roles,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    setActionNotice,
    theme,
  } = useDevCoreStore();

  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DevCoreUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<DevCoreRoleName>('PLATFORM_ADMIN');
  const [password, setPassword] = useState('');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    const res = await createUser({
      name,
      username,
      email,
      role,
      password,
      requirePasswordChange,
    });

    if (res.success) {
      setIsAddUserModalOpen(false);
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRequirePasswordChange(true);
      setActionNotice({ message: `User "${username}" created successfully.`, type: 'success' });
    } else {
      setFormError(res.error || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = await updateUser(editingUser.id, {
      name: editingUser.name,
      email: editingUser.email,
      role: editingUser.role,
    });

    if (res.success) {
      setEditingUser(null);
      setActionNotice({ message: `User "${editingUser.username}" updated.`, type: 'success' });
    } else {
      alert(res.error || 'Failed to update user');
    }
  };

  const handleDelete = async (u: DevCoreUser) => {
    if (u.isPermanent || u.username === 'devcore') {
      setActionNotice({
        message: 'Dev Core root account is permanent and cannot be deleted.',
        type: 'error',
      });
      return;
    }

    if (confirm(`Are you sure you want to delete administrator "${u.name}" (${u.username})?`)) {
      const res = await deleteUser(u.id);
      if (!res.success) {
        setActionNotice({ message: res.error || 'Could not delete user.', type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Add User Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-left">
        <div>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Dev Core & Administrative Staff
          </h2>
          <p className="text-xs text-slate-500">
            Manage system-level administrative credentials and RBAC assignments.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-5 py-2.5 bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-full transition shadow-sm flex items-center gap-2 cursor-pointer hover:opacity-90"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Provision New Admin</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div
        className={`border rounded-[28px] overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-[#111717] border-[#232D2B]' : 'bg-white border-slate-200/80'
        }`}
      >
        {/* Table Filters Header */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-[#232D2B]' : 'border-slate-200/80'
          }`}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, handle, email..."
              className={`pl-8 pr-3 py-1.5 rounded-full text-xs outline-none border transition w-64 ${
                isDark
                  ? 'bg-[#080B0B] border-[#232D2B] text-white focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-full text-xs outline-none border ${
                isDark ? 'bg-[#080B0B] border-[#232D2B] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="PLATFORM_ADMIN">Platform Admin</option>
              <option value="SUPPORT_LEAD">Support Lead</option>
              <option value="AUDITOR">Auditor</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                  isDark
                    ? 'border-[#232D2B] bg-[#0E1413] text-slate-400'
                    : 'border-slate-200/80 bg-slate-50 text-slate-500'
                }`}
              >
                <th className="py-3 px-6">User & Identity</th>
                <th className="py-3 px-6">System Handle</th>
                <th className="py-3 px-6">Assigned Role</th>
                <th className="py-3 px-6">Security Status</th>
                <th className="py-3 px-6">Created On</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1D2625]' : 'divide-slate-100'}`}>
              {filteredUsers.map((u) => {
                const isRoot = u.username === 'devcore';
                return (
                  <tr
                    key={u.id}
                    className={`transition ${isDark ? 'hover:bg-[#151E1D]' : 'hover:bg-slate-50/70'}`}
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                            isRoot
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-sm">
                            {u.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        @{u.username}
                      </span>
                      {isRoot && (
                        <span className="ml-2 px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-[9px] font-bold">
                          ROOT #1
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                        </span>

                        {u.mustChangePassword && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-600 text-[9px] font-bold">
                            PW Reset Req
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(u)}
                          title="Edit User Details"
                          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {!isRoot && (
                          <button
                            onClick={() => toggleUserActive(u.id)}
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                            className={`p-1.5 rounded-xl transition cursor-pointer ${
                              u.isActive
                                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isRoot && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isRoot && (
                          <span
                            title="Permanent Dev Core Root Account"
                            className="p-1.5 text-emerald-600"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PROVISION NEW ADMIN */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Provision Administrative User</h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} autoComplete="off" className="space-y-3.5">
              {/* Anti-autofill decoy inputs */}
              <input type="text" name="decoy_admin_create_user" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />
              <input type="password" name="decoy_admin_create_pass" tabIndex={-1} style={{ display: 'none' }} autoComplete="off" />

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="admin_person_name"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Username (Login Handle)
                </label>
                <input
                  type="text"
                  name="admin_person_login"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex.rivera"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@oursell.internal"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Administrative Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="SUPPORT_LEAD">Support Lead</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  name="admin_person_password"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reqPwChange"
                  checked={requirePasswordChange}
                  onChange={(e) => setRequirePasswordChange(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="reqPwChange" className="text-xs text-slate-600 dark:text-slate-400">
                  Require password change on first login
                </label>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 text-left ${
              isDark ? 'bg-[#111717] border-[#232D2B] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">Edit User @{editingUser.username}</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} autoComplete="off" className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {editingUser.username !== 'devcore' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Administrative Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="PLATFORM_ADMIN">Platform Admin</option>
                    <option value="SUPPORT_LEAD">Support Lead</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>
              )}

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-slate-950 dark:bg-emerald-500 dark:text-slate-950 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
