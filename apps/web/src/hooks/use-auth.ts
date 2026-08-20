'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApiService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/use-toast';
import type { LoginFormValues, RegisterFormValues } from '@/schemas/auth.schemas';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginFormValues) => authApiService.login(values),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.clear();
      router.push('/dashboard');
      toast({ title: `Welcome back, ${data.user.firstName}!`, variant: 'default' });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title: 'Login failed',
        description: error.response?.data?.error?.message ?? 'Please check your credentials',
        variant: 'destructive',
      });
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authApiService.register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName || undefined,
        phone: values.phone,
        companyId: values.companyId,
        role: values.role,
      }),
    onSuccess: () => {
      router.push('/login?registered=true');
      toast({
        title: 'Account created successfully',
        description: 'Please sign in with your new credentials.',
      });
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      toast({
        title: 'Registration failed',
        description: error.response?.data?.error?.message ?? 'Please check your information and try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApiService.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useMe() {
  const { setAuth, accessToken } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApiService.me();
      if (accessToken) setAuth(user, accessToken);
      return user;
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}
