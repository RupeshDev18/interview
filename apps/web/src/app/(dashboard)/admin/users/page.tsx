'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Shield,
  Plus,
  Search,
  Mail,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  UserCheck,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { adminService, type UserItem, type CompanyItem } from '@/services/admin.service';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'RECRUITER',
    companyId: '',
    phone: '',
  });

  const { data: users = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: () =>
      adminService.listUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      }),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies-lookup'],
    queryFn: () => adminService.listCompanies({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'RECRUITER',
        companyId: '',
        phone: '',
      });
      toast({ title: 'User created successfully' });
    },
    onError: (err: any) => {
      toast({
        title: 'Failed to create user',
        description: err?.response?.data?.error?.message || 'Check input details',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserItem> }) =>
      adminService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      toast({ title: 'User updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update user', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete user', variant: 'destructive' });
    },
  });

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      companyId: user.companyId || '',
      phone: user.phone || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role as any,
          companyId: form.companyId || null,
          phone: form.phone || null,
          ...(form.password ? { password: form.password } : {}),
        },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10';
      case 'COMPANY_ADMIN':
        return 'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10';
      case 'RECRUITER':
        return 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10';
      case 'INTERVIEWER':
        return 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10';
      default:
        return 'border-theme text-theme-muted bg-surface-subtle';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <Shield className="h-4 w-4" />
            </div>
            User Access & Permissions Governance
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Manage system administrators, company recruiters, interviewers, and account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-theme bg-card text-theme-primary hover:bg-surface-subtle"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-theme-accent' : 'text-theme-muted'}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingUser(null);
              setForm({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'RECRUITER',
                companyId: '',
                phone: '',
              });
              setIsModalOpen(true);
            }}
            className="gradient-theme-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card border border-theme shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="pl-9 bg-surface border-theme text-theme-primary text-xs"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg bg-surface border border-theme px-3 py-2 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Super Admin</option>
          <option value="COMPANY_ADMIN">Company Admin</option>
          <option value="RECRUITER">Recruiter</option>
          <option value="INTERVIEWER">Interviewer</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-16 rounded-xl bg-surface-subtle" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-theme space-y-3 shadow-sm">
          <Users className="h-10 w-10 text-theme-muted mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-theme-primary">No users found</h3>
          <p className="text-xs text-theme-muted">Try changing your filters or add a new team member.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-theme bg-card shadow-sm">
          <table className="w-full text-left text-xs text-theme-primary">
            <thead className="border-b border-theme bg-surface-subtle text-[11px] font-semibold uppercase tracking-wider text-theme-muted font-mono">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Created / Last Login</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-subtle transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center font-bold text-xs font-mono">
                        {u.firstName[0]}
                        {u.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-theme-primary text-sm">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[11px] text-theme-muted font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="outline" className={`text-[10px] ${getRoleBadgeStyle(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-theme-primary font-medium">
                      {u.company?.name || (u.role === 'ADMIN' ? 'System (Global)' : 'Unassigned')}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-[11px] text-theme-muted">
                    <div>{new Date(u.createdAt).toLocaleDateString()}</div>
                    {u.lastLoginAt && (
                      <div className="text-theme-muted text-[10px]">
                        Last: {new Date(u.lastLoginAt).toLocaleDateString()}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-surface-subtle text-theme-muted'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(u)}
                        className="h-7 w-7 p-0 text-theme-muted hover:text-theme-primary hover:bg-surface-subtle"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete user ${u.firstName} ${u.lastName}?`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-card border border-theme rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-surface-subtle">
              <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
                <Shield className="h-5 w-5 text-theme-accent" />
                {editingUser ? 'Edit User Account' : 'Add New User'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-primary">First Name *</label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-primary">Last Name *</label>
                  <Input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="bg-surface border-theme text-theme-primary text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Email Address *</label>
                <Input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <Input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••' : 'Min 8 characters'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-primary">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg bg-surface border border-theme p-2 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  >
                    <option value="RECRUITER">Recruiter</option>
                    <option value="INTERVIEWER">Interviewer</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                    <option value="ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-theme-primary">Company</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full rounded-lg bg-surface border border-theme p-2 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
                  >
                    <option value="">No specific company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Phone Number (Optional)</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-theme text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gradient-theme-btn font-semibold text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving…'
                    : editingUser
                    ? 'Update User'
                    : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
