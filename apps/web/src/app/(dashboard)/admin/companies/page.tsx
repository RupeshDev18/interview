'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  Globe,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  ShieldCheck,
  User,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { adminService, type CompanyItem } from '@/services/admin.service';

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);

  // Onboard Form
  const [onboardForm, setOnboardForm] = useState({
    companyName: '',
    companyEmail: '',
    phone: '',
    website: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
  });

  const { data: companies = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-companies', search],
    queryFn: () => adminService.listCompanies({ search: search.trim() || undefined }),
  });

  const onboardMutation = useMutation({
    mutationFn: adminService.onboardCompany,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsOnboardModalOpen(false);
      setOnboardForm({
        companyName: '',
        companyEmail: '',
        phone: '',
        website: '',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
      });
      toast({
        title: 'Organization Onboarded Successfully',
        description: `Created ${data.company.name} and assigned ${data.adminUser.firstName} as Company Admin.`,
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Onboarding Failed',
        description: err?.response?.data?.error?.message || 'Could not onboard organization.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyItem> }) =>
      adminService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setEditingCompany(null);
      toast({ title: 'Company details updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update company', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      toast({ title: 'Company deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete company', variant: 'destructive' });
    },
  });

  const handleOpenEdit = (company: CompanyItem) => {
    setEditingCompany(company);
    setEditForm({
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
    });
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onboardMutation.mutate(onboardForm);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    updateMutation.mutate({
      id: editingCompany.id,
      data: editForm,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <Building2 className="h-4 w-4" />
            </div>
            Organizations & Multi-Tenancy Management
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Onboard new corporate client organizations, provision Company Administrators, and enforce strict tenant boundaries.
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
            onClick={() => setIsOnboardModalOpen(true)}
            className="gradient-theme-btn text-xs font-semibold gap-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" /> Onboard Organization
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-theme shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, corporate domain, or contact email..."
            className="pl-9 bg-surface border-theme text-theme-primary text-xs"
          />
        </div>
      </div>

      {/* Company Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-xl bg-surface-subtle" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-theme space-y-3 shadow-sm">
          <Building2 className="h-10 w-10 text-theme-muted mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-theme-primary">No organizations found</h3>
          <p className="text-xs text-theme-muted">Get started by onboarding your first client organization.</p>
          <Button
            onClick={() => setIsOnboardModalOpen(true)}
            className="text-xs gradient-theme-btn mt-2"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Onboard First Organization
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="p-5 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-all space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center font-bold text-theme-accent font-mono text-sm">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-theme-primary text-base leading-tight">
                        {company.name}
                      </h3>
                      <span className="text-[11px] text-theme-muted font-mono">
                        Tenant ID: {company.id.substring(0, 13)}…
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      company.isActive
                        ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : 'border-theme text-theme-muted bg-surface-subtle'
                    }`}
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-theme-muted pt-2 border-t border-theme">
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-theme-accent shrink-0" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-theme-accent shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-theme-accent shrink-0" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-theme-accent hover:underline truncate"
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(company)}
                  className="h-8 text-xs text-theme-muted hover:text-theme-primary hover:bg-surface-subtle"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1 text-theme-accent" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${company.name}? This will revoke access for all associated users.`)) {
                      deleteMutation.mutate(company.id);
                    }
                  }}
                  className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Organization Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-card border border-theme rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-surface-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-theme-accent text-white flex items-center justify-center shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-theme-primary">
                    Onboard New Organization
                  </h2>
                  <p className="text-xs text-theme-muted font-mono">
                    Provisions company entity + primary Company Administrator
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Section 1: Company Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-theme-accent uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  1. Organization Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-theme-primary">Company Name *</label>
                    <Input
                      required
                      placeholder="e.g. Netflix, Stripe, Google"
                      value={onboardForm.companyName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, companyName: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-primary">Company Contact Email</label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={onboardForm.companyEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, companyEmail: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-primary">Website URL</label>
                    <Input
                      placeholder="https://company.com"
                      value={onboardForm.website}
                      onChange={(e) => setOnboardForm({ ...onboardForm, website: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Company Admin Account */}
              <div className="space-y-3 pt-4 border-t border-theme">
                <h3 className="text-xs font-semibold text-theme-accent uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  2. Primary Company Administrator
                </h3>
                <p className="text-[11px] text-theme-muted">
                  This user will be assigned the <strong>COMPANY_ADMIN</strong> role with authority to manage team interviewers, candidates, and evaluations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-primary">Admin First Name *</label>
                    <Input
                      required
                      placeholder="Jane"
                      value={onboardForm.adminFirstName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminFirstName: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-theme-primary">Admin Last Name *</label>
                    <Input
                      required
                      placeholder="Smith"
                      value={onboardForm.adminLastName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminLastName: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-theme-primary">Admin Work Email *</label>
                    <Input
                      required
                      type="email"
                      placeholder="admin@company.com"
                      value={onboardForm.adminEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminEmail: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-semibold text-theme-primary">Initial Password</label>
                    <Input
                      type="password"
                      placeholder="Leave blank for default (Admin@123456)"
                      value={onboardForm.adminPassword}
                      onChange={(e) => setOnboardForm({ ...onboardForm, adminPassword: e.target.value })}
                      className="bg-surface border-theme text-theme-primary text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="border-theme text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={onboardMutation.isPending}
                  className="gradient-theme-btn font-semibold text-xs gap-1.5 shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  {onboardMutation.isPending ? 'Provisioning Tenant…' : 'Onboard Organization & Admin'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Edit Modal */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-card border border-theme rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-surface-subtle">
              <h2 className="text-base font-bold text-theme-primary flex items-center gap-2">
                <Building2 className="h-5 w-5 text-theme-accent" />
                Edit Company Details
              </h2>
              <button
                onClick={() => setEditingCompany(null)}
                className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Company Name *</label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Corporate Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Website URL</label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCompany(null)}
                  className="border-theme text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gradient-theme-btn font-semibold text-xs"
                >
                  {updateMutation.isPending ? 'Saving…' : 'Update Company'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
