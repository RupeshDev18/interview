import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <LoginForm />
    </div>
  );
}
