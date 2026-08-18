import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <RegisterForm />
    </div>
  );
}
