'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth.schemas';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any;
  className?: string;
}

function Field({ label, id, type = 'text', placeholder, error, autoComplete, registration, className }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-slate-300 text-sm">{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={cn(
          'bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500',
          error && 'border-red-500',
          className,
        )}
        {...registration}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

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
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
          <span className="text-white font-bold text-xl">IP</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="text-slate-400 text-sm mt-1">Join InterviewPlatform</p>
      </div>

      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First name"
              id="firstName"
              placeholder="Jane"
              error={errors.firstName?.message}
              registration={register('firstName')}
            />
            <Field
              label="Last name"
              id="lastName"
              placeholder="Doe"
              error={errors.lastName?.message}
              registration={register('lastName')}
            />
          </div>

          <Field
            label="Email address"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            error={errors.email?.message}
            registration={register('email')}
          />

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  'bg-white/5 border-white/20 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 pr-10',
                  errors.password && 'border-red-500',
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
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          <Field
            label="Confirm password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2"
            loading={isSubmitting || registerMutation.isPending}
          >
            <UserPlus className="h-4 w-4" />
            Create account
          </Button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
