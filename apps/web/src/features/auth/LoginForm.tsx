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
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sunset-orange to-sunset-crimson shadow-lg shadow-sunset-orange/20 mb-2">
          <span className="text-sunset-cream font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-sunset-cream">
          Welcome to InterviewOS
        </h1>
        <p className="text-stone-400 text-sm">
          Sign in to your high-velocity hiring workspace
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#18110C]/90 backdrop-blur-xl border border-[#36271D] rounded-2xl p-7 shadow-2xl space-y-6">
        {/* Quick Demo Credentials */}
        <div className="p-3.5 rounded-xl bg-[#120B07] border border-[#36271D] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-sunset-amber">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-sunset-orange" />
              Quick Demo Accounts
            </span>
            <span className="text-stone-500">1-click fill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('rupesh.dev2002@gmail.com', 'Admin@123456')}
              className="px-2.5 py-1.5 rounded-lg bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/50 text-[11px] text-sunset-cream flex flex-col items-center gap-1 transition-all group"
            >
              <Shield className="h-3.5 w-3.5 text-sunset-crimson group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('recruiter@acme.com', 'Recruiter@123456')}
              className="px-2.5 py-1.5 rounded-lg bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/50 text-[11px] text-sunset-cream flex flex-col items-center gap-1 transition-all group"
            >
              <Briefcase className="h-3.5 w-3.5 text-sunset-orange group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Recruiter</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('interviewer@acme.com', 'Interviewer@123456')}
              className="px-2.5 py-1.5 rounded-lg bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/50 text-[11px] text-sunset-cream flex flex-col items-center gap-1 transition-all group"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Interviewer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sunset-cream text-xs font-semibold">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className={cn(
                'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange',
                errors.email && 'border-rose-500 focus-visible:ring-rose-500',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-rose-400 text-xs font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sunset-cream text-xs font-semibold">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-sunset-amber hover:underline transition-colors"
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
                  'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange pr-10',
                  errors.password && 'border-rose-500 focus-visible:ring-rose-500',
                )}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-sunset-cream transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-400 text-xs font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gradient-sunset-btn font-semibold text-sm h-10 shadow-lg shadow-sunset-orange/20 mt-2"
            disabled={isSubmitting || login.isPending}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-stone-400 text-xs">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-sunset-amber hover:underline font-semibold transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
