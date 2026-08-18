import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your interview pipeline
        </p>
      </div>
      {/* Dashboard cards and charts built in Phase 10 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
      </div>
    </div>
  );
}
