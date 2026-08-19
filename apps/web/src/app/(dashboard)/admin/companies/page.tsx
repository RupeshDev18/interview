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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyItem | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
  });

  const { data: companies = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-companies', search],
    queryFn: () => adminService.listCompanies({ search: search.trim() || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: adminService.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsModalOpen(false);
      setForm({ name: '', email: '', phone: '', website: '' });
      toast({ title: 'Company created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create company', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyItem> }) =>
      adminService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      setIsModalOpen(false);
      setEditingCompany(null);
      toast({ title: 'Company updated' });
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
    setForm({
      name: company.name,
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({
        id: editingCompany.id,
        data: form,
      });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <Building2 className="h-4 w-4 text-sunset-cream" />
            </div>
            Company Organizations
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Manage multi-tenant corporate accounts, interview limits, and organization details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-[#36271D] bg-[#18110C] text-stone-300 hover:text-sunset-cream"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-sunset-orange' : 'text-sunset-amber'}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingCompany(null);
              setForm({ name: '', email: '', phone: '', website: '' });
              setIsModalOpen(true);
            }}
            className="gradient-sunset-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Company
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, domain, or email..."
            className="pl-9 bg-[#120B07] border-[#36271D] text-sunset-cream"
          />
        </div>
      </div>

      {/* Company Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#18110C] border border-[#36271D] space-y-3">
          <Building2 className="h-10 w-10 text-stone-600 mx-auto" />
          <h3 className="text-sm font-semibold text-sunset-cream">No companies found</h3>
          <p className="text-xs text-stone-400">Get started by creating your first company profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="p-5 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-all space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-orange/20 to-sunset-crimson/20 border border-sunset-orange/30 flex items-center justify-center font-bold text-sunset-amber">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sunset-cream text-base leading-tight">
                        {company.name}
                      </h3>
                      <span className="text-[11px] text-stone-500 font-mono">
                        Added {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      company.isActive
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                        : 'border-stone-700 text-stone-500 bg-stone-900'
                    }`}
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-stone-400 pt-2 border-t border-[#36271D]/60">
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-sunset-orange/70 shrink-0" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-sunset-orange/70 shrink-0" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-sunset-orange/70 shrink-0" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sunset-amber hover:underline truncate"
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#36271D]/60">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenEdit(company)}
                  className="h-8 text-xs text-stone-400 hover:text-sunset-cream hover:bg-[#251A13]"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${company.name}?`)) {
                      deleteMutation.mutate(company.id);
                    }
                  }}
                  className="h-8 text-xs text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#18110C] border border-[#36271D] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#36271D] flex items-center justify-between bg-[#120B07]">
              <h2 className="text-base font-bold text-sunset-cream flex items-center gap-2">
                <Building2 className="h-5 w-5 text-sunset-orange" />
                {editingCompany ? 'Edit Company' : 'Register New Company'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-sunset-cream hover:bg-[#251A13]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sunset-cream">Company Name *</label>
                <Input
                  required
                  placeholder="e.g. Acme Corp"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#120B07] border-[#36271D] text-sunset-cream"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sunset-cream">Corporate Email</label>
                <Input
                  type="email"
                  placeholder="contact@acme.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-[#120B07] border-[#36271D] text-sunset-cream"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sunset-cream">Phone Number</label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-[#120B07] border-[#36271D] text-sunset-cream"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-sunset-cream">Website URL</label>
                <Input
                  placeholder="https://acme.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="bg-[#120B07] border-[#36271D] text-sunset-cream"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#36271D]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-[#36271D] text-stone-400 hover:text-sunset-cream"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="gradient-sunset-btn font-semibold"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving…'
                    : editingCompany
                    ? 'Update Company'
                    : 'Create Company'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
