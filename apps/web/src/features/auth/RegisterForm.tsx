'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Building2 } from 'lucide-react';
import { useState } from 'react';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth.schemas';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'COMPANY_ADMIN',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-theme-accent text-white shadow-md shadow-black/10 mb-2">
          <span className="font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
          Create an Account
        </h1>
        <p className="text-theme-muted text-sm">
          Join InterviewOS to streamline your technical evaluations
        </p>
      </div>

      {/* Card */}
      <div className="bg-card backdrop-blur-xl border border-theme rounded-2xl p-7 shadow-sm space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-theme-primary text-xs font-semibold">First name</Label>
              <Input
                placeholder="Jane"
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent text-xs h-10',
                  errors.firstName && 'border-rose-500',
                )}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs text-rose-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-theme-primary text-xs font-semibold">Last name</Label>
              <Input
                placeholder="Doe"
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent text-xs h-10',
                  errors.lastName && 'border-rose-500',
                )}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs text-rose-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-theme-primary text-xs font-semibold">Work Email</Label>
            <Input
              type="email"
              placeholder="jane@company.com"
              className={cn(
                'bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent text-xs h-10',
                errors.email && 'border-rose-500',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-theme-primary text-xs font-semibold">Organization / Company Name</Label>
            <div className="relative">
              <Input
                placeholder="Acme Technologies"
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent text-xs h-10 pl-8',
                  errors.companyName && 'border-rose-500',
                )}
                {...register('companyName')}
              />
              <Building2 className="h-4 w-4 text-theme-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            {errors.companyName && (
              <p className="text-xs text-rose-500">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-theme-primary text-xs font-semibold">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted pr-10 focus-visible:ring-theme-accent text-xs h-10',
                  errors.password && 'border-rose-500',
                )}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-rose-500">{errors.password.message}</p>
            ) : (
              <p className="text-[11px] text-theme-muted">
                At least 8 chars with 1 uppercase, 1 lowercase & 1 number
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-theme-primary text-xs font-semibold">Confirm Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted pr-10 focus-visible:ring-theme-accent text-xs h-10',
                  errors.confirmPassword && 'border-rose-500',
                )}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-theme-btn h-10 text-xs font-bold shadow-md gap-2"
            disabled={isSubmitting || registerMutation.isPending}
          >
            <UserPlus className="h-4 w-4" />
            {registerMutation.isPending ? 'Creating Account…' : 'Create Organization Account'}
          </Button>
        </form>

        <p className="text-center text-xs text-theme-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-theme-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
