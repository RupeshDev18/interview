import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

// Password reset via email link — Phase 11 implementation
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-4">
            <span className="text-white font-bold text-xl">IP</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Reset password</h1>
          <p className="text-slate-400 text-sm mt-1">
            Enter your email to receive reset instructions
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
          <p className="text-slate-400 text-sm text-center">
            Password reset is available in a future release. Please contact your administrator.
          </p>
          <Link
            href="/login"
            className="block text-center text-blue-400 hover:text-blue-300 text-sm mt-4 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
