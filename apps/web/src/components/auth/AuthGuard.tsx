'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authApiService } from '@/services/auth.service';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Client-side auth guard.
 * On mount, attempts a token refresh to validate the session.
 * If refresh fails, redirects to /login.
 * The middleware.ts handles server-side redirect for the cookie check.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, setAuth, setAccessToken, clearAuth, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { accessToken } = await authApiService.refresh();
        // `me()` uses the Axios interceptor, which reads its token from the store.
        // Set it before requesting the user profile.
        setAccessToken(accessToken);
        const user = await authApiService.me();
        if (!cancelled) {
          setAuth(user, accessToken);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
          router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
