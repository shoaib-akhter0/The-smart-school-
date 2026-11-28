import React, { useEffect, useState } from 'react';
import {
  Users, UserPlus, Shield, CheckCircle, XCircle,
  Power, KeyRound, Trash2, AlertCircle, Lock, ShieldAlert, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';

export const UserManagementModule: React.FC = () => {
  const { availableUsers, currentUser, refreshUsers } = useAuth();
  const [userList, setUserList] = useState<User[]>(availableUsers);
  useEffect(() => setUserList(availableUsers), [availableUsers]);
  // Always show what is actually in the database, not the list cached at login.
  useEffect(() => { refreshUsers(); }, []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('school@123');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'school@123',
    role: 'ACCOUNTANT' as UserRole,
    department: 'Finance & Accounts Office',
    phone: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleToggleActive = async (userId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.users.manage({ action: 'toggle_active', userId });
      if (res.user) {
        setUserList(prev => prev.map(u => u.id === userId ? { ...u, isActive: res.user.isActive } : u));
        setSuccessMsg(`Status updated for ${res.user.name}.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to toggle user status.');
    } finally {
      refreshUsers();
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.isPrimaryAdmin || user.id === 'usr-gm-01' || user.id === currentUser.id) {
      alert('The primary Super Admin account cannot be deleted.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to permanently remove user account "${user.name}" (${user.email})? This action cannot be undone.`);
    if (!confirmDelete) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.users.manage({ action: 'delete', userId: user.id });
      if (res.success) {
        setUserList(prev => prev.filter(u => u.id !== user.id));
        setSuccessMsg(`User ${user.name} removed successfully.`);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to remove user account.');
    } finally {
      refreshUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg('Full Name and Official Email are required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg('Default temporary password must be at least 6 characters.');
      return;
    }

    try {
      const res = await api.users.manage({ action: 'create', userData: formData });
      if (res.user) {
        setUserList(prev => [...prev, res.user]);
        setShowAddModal(false);
        setSuccessMsg(`Account created for ${res.user.name} with default password. User must change password upon first login.`);
        setFormData({
          name: '',
          email: '',
          password: 'school@123',
          role: 'ACCOUNTANT',
          department: 'Finance & Accounts Office',
          phone: '',
        });
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to provision user account.');
    } finally {
      refreshUsers();
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newTempPassword || newTempPassword.length < 6) {
      setErrorMsg('Temporary password must be at least 6 characters.');
      return;
    }

    try {
      const res = await api.users.manage({
        action: 'reset_password',
        userId: selectedUserForReset.id,
        userData: { newPassword: newTempPassword },
      });
      if (res.success) {
        setSuccessMsg(`Password successfully reset for ${selectedUserForReset.name}.`);
        setShowResetModal(false);
        setSelectedUserForReset(null);
        setNewTempPassword('school@123');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to reset password.');
    } finally {
      refreshUsers();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-bold text-[#D81A28]">
              Super Admin Authority
            </span>
            <span className="text-xs text-slate-500 font-medium">
              The Smart School • User Accounts &amp; Access Governance
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            User Accounts &amp; Credential Administration
          </h2>
          <p className="text-xs text-slate-500">
            Provision Accountants, HOD Admins, and GMs. Set default temporary passwords and manage system access.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#D81A28] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#B91220] transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Provision New Account</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User &amp; Contact</th>
                <th className="py-3 px-4">Role Clearance</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-center">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                    <div className="text-[10px] text-slate-400">{user.phone || 'No phone recorded'}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        user.role === 'GM'
                          ? 'bg-red-100 text-[#D81A28] border border-red-200'
                          : user.role === 'ACCOUNTANT'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : user.role === 'HOD'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {user.role === 'GM' ? 'Super Admin' : user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {user.department || 'General Staff'}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition ${
                          user.isActive
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUserForReset(user);
                          setShowResetModal(true);
                        }}
                        className="rounded px-2.5 py-1 text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      >
                        Reset Password
                      </button>

                      {!user.isPrimaryAdmin && user.id !== 'usr-gm-01' && user.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          title="Remove user account"
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Provision Authorized Staff Account
            </h3>
            <p className="text-slate-500 mb-4">
              Create credentials for school management roles with a default temporary password.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Asma Tariq"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. asma@thesmartschool.edu.pk"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Default Temporary Password *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. school@123"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28] font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  The user will be required to change this temporary password upon first login.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role Clearance *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28]"
                >
                  <option value="ACCOUNTANT">Accountant (Category 1 &amp; 2 Financial Entry)</option>
                  <option value="HOD">HOD (Department Oversight &amp; Revisions)</option>
                  <option value="GM">GM / Super Admin (Executive Supervision)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Finance Office, Sciences Faculty"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#D81A28] px-4 py-1.5 font-semibold text-white hover:bg-[#B91220] shadow-xs"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Reset User Password
            </h3>
            <p className="text-slate-500 mb-4">
              Set a new temporary password for <strong>{selectedUserForReset.name}</strong>.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Temporary Password (min 6 characters)
                </label>
                <input
                  type="text"
                  required
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="e.g. school@123"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#D81A28] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedUserForReset(null);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#D81A28] px-4 py-1.5 font-semibold text-white hover:bg-[#B91220] shadow-xs"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
