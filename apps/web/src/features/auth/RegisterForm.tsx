'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
import { useState } from 'react';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth.schemas';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sunset-orange to-sunset-crimson shadow-lg shadow-sunset-orange/20 mb-2">
          <span className="text-sunset-cream font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-sunset-cream">
          Create an Account
        </h1>
        <p className="text-stone-400 text-sm">
          Join InterviewOS to streamline your technical evaluations
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#18110C]/90 backdrop-blur-xl border border-[#36271D] rounded-2xl p-7 shadow-2xl space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sunset-cream text-xs font-semibold">First name</Label>
              <Input
                placeholder="Jane"
                className={cn(
                  'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange',
                  errors.firstName && 'border-rose-500',
                )}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-rose-400 text-xs font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sunset-cream text-xs font-semibold">Last name</Label>
              <Input
                placeholder="Doe"
                className={cn(
                  'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange',
                  errors.lastName && 'border-rose-500',
                )}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-rose-400 text-xs font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sunset-cream text-xs font-semibold">Email address</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="jane.doe@company.com"
              className={cn(
                'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange',
                errors.email && 'border-rose-500',
              )}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-rose-400 text-xs font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sunset-cream text-xs font-semibold">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className={cn(
                  'bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-600 focus-visible:ring-sunset-orange pr-10',
                  errors.password && 'border-rose-500',
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

          <Button
            type="submit"
            className="w-full gradient-sunset-btn font-semibold text-sm h-10 shadow-lg shadow-sunset-orange/20 mt-3"
            disabled={isSubmitting || registerMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-stone-400 text-xs">
          Already have an account?{' '}
          <Link href="/login" className="text-sunset-amber hover:underline font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
