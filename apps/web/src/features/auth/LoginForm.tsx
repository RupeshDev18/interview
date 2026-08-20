'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, Sparkles, Shield, UserCheck, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schemas';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  const handleDemoFill = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-theme-accent text-white shadow-md shadow-black/10 mb-2">
          <span className="font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-theme-primary">
          Welcome to InterviewOS
        </h1>
        <p className="text-theme-muted text-sm">
          Sign in to your high-velocity technical hiring workspace
        </p>
      </div>

      {/* Card */}
      <div className="bg-card backdrop-blur-xl border border-theme rounded-2xl p-7 shadow-sm space-y-6">
        {/* Quick Demo Credentials */}
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-theme space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-theme-accent">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Quick Demo Login
            </span>
            <span className="text-[10px] text-theme-muted font-sans">1-Click Fill</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill('rupesh.dev2002@gmail.com', 'admin123')}
              className="px-2 py-1.5 rounded-lg bg-surface border border-theme hover:border-theme-accent/50 text-[11px] font-semibold text-theme-primary transition-all flex flex-col items-center gap-0.5"
            >
              <Shield className="h-3.5 w-3.5 text-theme-accent" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('recruiter@acme.com', 'admin123')}
              className="px-2 py-1.5 rounded-lg bg-surface border border-theme hover:border-theme-accent/50 text-[11px] font-semibold text-theme-primary transition-all flex flex-col items-center gap-0.5"
            >
              <Briefcase className="h-3.5 w-3.5 text-theme-accent" />
              <span>Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('interviewer@acme.com', 'admin123')}
              className="px-2 py-1.5 rounded-lg bg-surface border border-theme hover:border-theme-accent/50 text-[11px] font-semibold text-theme-primary transition-all flex flex-col items-center gap-0.5"
            >
              <UserCheck className="h-3.5 w-3.5 text-theme-accent" />
              <span>Interviewer</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {login.error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {(login.error as { response?: { data?: { error?: { message?: string } } } })
                ?.response?.data?.error?.message ||
                'Invalid credentials. Please check your email and password.'}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-theme-primary">
              Work Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              {...register('email')}
              className={cn(
                'bg-surface border-theme text-theme-primary placeholder:text-theme-muted text-xs h-10',
                errors.email && 'border-rose-500 focus-visible:ring-rose-500',
              )}
            />
            {errors.email && (
              <p className="text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-theme-primary">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-theme-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className={cn(
                  'bg-surface border-theme text-theme-primary placeholder:text-theme-muted pr-10 text-xs h-10',
                  errors.password && 'border-rose-500 focus-visible:ring-rose-500',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-theme-btn h-10 text-xs font-bold shadow-md gap-2"
            disabled={isSubmitting || login.isPending}
          >
            <LogIn className="h-4 w-4" />
            {login.isPending ? 'Authenticating…' : 'Sign in to Workspace'}
          </Button>
        </form>

        <p className="text-center text-xs text-theme-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-bold text-theme-accent hover:underline"
          >
            Create an organization account
          </Link>
        </p>
      </div>
    </div>
  );
}
