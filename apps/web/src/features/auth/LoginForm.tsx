'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
          <span className="text-white font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">InterviewPlatform</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Card */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-300 text-sm">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={cn(
                'bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500',
                errors.email && 'border-red-500 focus-visible:ring-red-500',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-red-400 text-xs">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-300 text-sm">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  'bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10',
                  errors.password && 'border-red-500 focus-visible:ring-red-500',
                )}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            loading={isSubmitting || login.isPending}
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
