import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | InterviewOS',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0805] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))] px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sunset-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
